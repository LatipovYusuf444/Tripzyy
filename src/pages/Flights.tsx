import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { ArrowRight, CalendarDays, ChevronDown, Clock3, Filter, Plane, PlaneLanding, PlaneTakeoff, Sparkles, Ticket, Users } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import amsterdamImage from "@/assets/SHaharlar/amsterdam.webp"
import dubaiImage from "@/assets/SHaharlar/dubai-marina-cityscape-skyline-skyscrapers-buildings-city-2560x1440-4870.jpg"
import spainImage from "@/assets/SHaharlar/Espania.webp"
import germanyImage from "@/assets/SHaharlar/germany.webp"
import parisImage from "@/assets/SHaharlar/parij.webp"
import sharmImage from "@/assets/SHaharlar/sharm el sheikh.webp"
import turkeyImage from "@/assets/SHaharlar/turkey.jpg"
import FareCalendarPicker from "@/components/site/FareCalendarPicker"
import FlightDetailsModal, { type Flight } from "@/components/site/FlightDetailsModal"
import { formatMoney } from "@/lib/money"
import { searchAir } from "@/shared/api/air/air.api"
import { AIRPORT_CACHE_KEY, DEFAULT_AIRPORT_DIRECTORY } from "@/shared/air/airportDirectory"
import { getAccessToken } from "@/shared/auth/token"
import { useI18n } from "@/shared/i18n/i18n"

const luxuryBtn =
  "border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-white shadow-[0_14px_28px_rgba(17,24,39,0.22)] hover:brightness-110"
const softPanel =
  "border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,249,255,0.92)_100%)] shadow-[0_20px_50px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_22px_60px_rgba(4,10,28,0.38)]"
const flightsCache = new Map<string, { items: Flight[]; info: string | null }>()
const LAST_SUCCESSFUL_SEARCH_KEY = "last_successful_air_search_v1"
const LAST_AIR_RESULT_META_KEY = "last_air_result_meta_v1"

const cityHeroSlides = [
  { image: amsterdamImage, city: "Amsterdam" },
  { image: dubaiImage, city: "Dubai" },
  { image: spainImage, city: "Barcelona" },
  { image: germanyImage, city: "Berlin" },
  { image: parisImage, city: "Paris" },
  { image: sharmImage, city: "Sharm El Sheikh" },
  { image: turkeyImage, city: "Istanbul" },
] as const

const UZ_AIRPORT_OVERRIDES: Record<string, string> = {
  ALA: "Olmaota",
  NQZ: "Astana",
  FRA: "Frankfurt",
  LIS: "Lissabon",
  ESB: "Anqara (Esenboga)",
  AYT: "Antaliya",
  DME: "Moskva (Domodedovo)",
  SVO: "Moskva (Sheremetyevo)",
}

type TravelClassCode = "Y" | "C" | "F"
type SearchTrip = { origin: string; destination: string; departure: string }
type SearchCriteria = { from: string; to: string; date: string; pax: number; travelClass: TravelClassCode; trips?: SearchTrip[] }
type LocationOption = { code: string; name: string; searchText: string }

type SearchDataLike = {
  currency?: string
  options?: any[]
  carriers?: Array<{ code: string; name: string; logo?: string }>
  cities?: Array<{ code: string; name: string }>
  airports?: Array<{ code: string; name: string }>
}

const COMMON_COPY = {
  uz: {
    hour: "soat",
    minute: "daqiqa",
    unknown: "Noma'lum",
    badgeCheap: "Eng arzon",
    badgeDirect: "To'g'ridan-to'g'ri",
    badgeMorning: "Ertalab jo'naydi",
    badgeEvening: "Kechqurun yetadi",
    badgeLastSeats: "Oxirgi",
    seat: "o'rin",
  },
  ru: {
    hour: "ч",
    minute: "мин",
    unknown: "Неизвестно",
    badgeCheap: "Самый дешевый",
    badgeDirect: "Прямой",
    badgeMorning: "Утренний вылет",
    badgeEvening: "Вечернее прибытие",
    badgeLastSeats: "Осталось",
    seat: "мест",
  },
  en: {
    hour: "h",
    minute: "min",
    unknown: "Unknown",
    badgeCheap: "Cheapest",
    badgeDirect: "Direct",
    badgeMorning: "Morning departure",
    badgeEvening: "Evening arrival",
    badgeLastSeats: "Last",
    seat: "seats",
  },
} as const

const fmtDuration = (mins: number, language: "uz" | "ru" | "en") => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const common = COMMON_COPY[language]
  return `${h} ${common.hour} ${m} ${common.minute}`
}

const toTime = (value?: string) => {
  if (!value) return "—"
  const t = value.split(" ")[1]
  return t ? t.slice(0, 5) : value
}

const toDateOnly = (value?: string) => {
  if (!value) return "—"
  const d = value.split(" ")[0]
  return d || value
}

const parseBackendDateTime = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().replace(" ", "T")
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const resolveFlightDurationMinutes = ({
  optionTrips,
  segments,
  fallbackMinutes,
}: {
  optionTrips: any[]
  segments: any[]
  fallbackMinutes?: number
}) => {
  const tripDuration = Number(
    optionTrips.reduce((sum: number, currentTrip: any) => sum + Number(currentTrip?.duration || 0), 0) || 0
  )

  const segmentDuration = segments.reduce((sum: number, segment: any) => {
    return sum + Number(segment.duration || 0) + Number(segment.layover || 0)
  }, 0)

  const firstDeparture = parseBackendDateTime(optionTrips[0]?.departure || segments[0]?.departure)
  const lastArrival = parseBackendDateTime(
    optionTrips[optionTrips.length - 1]?.arrival || segments[segments.length - 1]?.arrival
  )
  const endpointDuration =
    firstDeparture && lastArrival
      ? Math.max(0, Math.round((lastArrival.getTime() - firstDeparture.getTime()) / 60000))
      : 0

  const directSegmentDuration = Number(segments[0]?.duration || fallbackMinutes || 0)

  if (segmentDuration > 0 && endpointDuration > segmentDuration * 2) {
    return segmentDuration
  }

  if (tripDuration > 0 && endpointDuration > tripDuration * 2) {
    return tripDuration
  }

  if (endpointDuration > 0 && endpointDuration <= 1440) {
    return endpointDuration
  }

  if (segmentDuration > 0) {
    return segmentDuration
  }

  if (tripDuration > 0) {
    return tripDuration
  }

  return directSegmentDuration
}

const toApiAsset = (path?: string) => {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const base = (import.meta.env.VITE_API_URL || "https://b2b.skyup.uz/api").replace(/\/api\/?$/i, "")
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

const formatCompactPrice = (amount: number, currency?: string) => {
  if ((currency || "").toUpperCase() === "UZS" && amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2).replace(".", ",")} mln UZS`
  }
  return formatMoney(amount, currency)
}

const getFlightBadge = (flight: Flight, index: number, language: "uz" | "ru" | "en") => {
  const common = COMMON_COPY[language]
  if (index === 0) return { label: common.badgeCheap, tone: "green" as const }
  if ((flight.stopsCount ?? 0) === 0 && flight.durationMin <= 300) {
    return { label: common.badgeDirect, tone: "sky" as const }
  }
  const departureHour = Number(flight.depart.split(":")[0] ?? NaN)
  const arrivalHour = Number(flight.arrive.split(":")[0] ?? NaN)
  if (!Number.isNaN(departureHour) && departureHour < 12) {
    return { label: common.badgeMorning, tone: "blue" as const }
  }
  if (!Number.isNaN(arrivalHour) && arrivalHour >= 18) {
    return { label: common.badgeEvening, tone: "violet" as const }
  }
  if ((flight.seatsAvailable ?? 99) <= 5) {
    return { label: `${common.badgeLastSeats} ${flight.seatsAvailable} ${common.seat}`, tone: "rose" as const }
  }
  return null
}

const hasBaggage = (value?: string) => Boolean(value && value !== "—" && value.trim())

const formatAllowanceList = (values: Array<string | undefined | null>, fallback = "—") => {
  const cleaned = Array.from(
    new Set(
      values
        .map((value) => (value || "").trim())
        .filter((value) => value && value !== "—")
    )
  )
  return cleaned.length ? cleaned.join(" · ") : fallback
}

const isRefundableOption = (texts: string[]) =>
  /refund|refundable|return|cancel|exchange|flex|flexible|qaytar/i.test(
    texts.join(" ").toLowerCase()
  )

const matchDepartureBucket = (
  time: string,
  bucket: "all" | "morning" | "day" | "evening"
) => {
  if (bucket === "all") return true
  const [hoursRaw] = time.split(":")
  const hours = Number(hoursRaw)
  if (Number.isNaN(hours)) return true
  if (bucket === "morning") return hours < 12
  if (bucket === "day") return hours >= 12 && hours < 18
  return hours >= 18
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

const resolveLocationCode = (value: string, options: LocationOption[]) => {
  const raw = value.trim()
  if (!raw) return ""

  const upper = raw.toUpperCase()
  const exactCode = options.find((option) => option.code === upper)
  if (exactCode) return exactCode.code

  const prefixCode = upper.match(/^([A-Z]{3})\b/)
  if (prefixCode) {
    const option = options.find((item) => item.code === prefixCode[1])
    if (option) return option.code
  }

  const normalized = normalizeText(raw)
  const exactName = options.find((option) => normalizeText(option.name) === normalized)
  if (exactName) return exactName.code

  return upper.length === 3 ? upper : ""
}

const normalizeTravelClass = (value?: string): TravelClassCode => {
  const upper = (value || "").toUpperCase()
  if (upper === "C" || upper === "F") return upper
  return "Y"
}

const formatCabinClass = (code?: string, language: "uz" | "ru" | "en" = "en") => {
  const upper = (code || "").toUpperCase()
  if (upper === "C" || upper === "J") {
    return language === "uz" ? "Biznes (C)" : language === "ru" ? "Бизнес (C)" : "Business (C)"
  }
  if (upper === "F") {
    return language === "uz" ? "Birinchi klass (F)" : language === "ru" ? "Первый класс (F)" : "First (F)"
  }
  if (upper === "Y" || upper === "W" || upper === "M" || upper === "L" || upper === "X" || upper === "U") {
    return language === "uz" ? "Ekonom (Y)" : language === "ru" ? "Эконом (Y)" : "Economy (Y)"
  }
  return upper || (language === "uz" ? "Ekonom (Y)" : language === "ru" ? "Эконом (Y)" : "Economy (Y)")
}

export default function Flights() {
  const { language } = useI18n()
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [pax, setPax] = useState(1)
  const [travelClass, setTravelClass] = useState<TravelClassCode>("Y")
  const [sort, setSort] = useState<"best" | "cheap" | "fast">("best")
  const [airlineFilter, setAirlineFilter] = useState("all")
  const [cabinFilter, setCabinFilter] = useState("all")
  const [maxDuration, setMaxDuration] = useState<number | null>(null)
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null)
  const [departureFilter, setDepartureFilter] = useState<
    "all" | "morning" | "day" | "evening"
  >("all")
  const [onlyBaggage, setOnlyBaggage] = useState(false)
  const [onlyRefundable, setOnlyRefundable] = useState(false)

  const [items, setItems] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Flight | null>(null)
  const [dynamicAirportLabels, setDynamicAirportLabels] = useState<Record<string, string>>(DEFAULT_AIRPORT_DIRECTORY)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [searchTrips, setSearchTrips] = useState<SearchTrip[]>([])
  const [activeCitySlide, setActiveCitySlide] = useState(0)
  const [expandedAirline, setExpandedAirline] = useState<string | null>(null)

  const copy = {
    uz: {
      loginFirst: "Avval login qiling.",
      fillSearch: "Qayerdan, qayerga va sanani to'ldiring.",
      dateFormat: "Sana formati: YYYY-MM-DD",
      searchError: "Qidiruv xato",
      backendBusy: "Xizmat vaqtincha javob bermayapti.",
      timeout: "Server juda sekin javob berdi. So'rov timeout bo'ldi.",
      invalidRoute: "Jo'nash va manzil uchun to'g'ri variantni tanlang.",
      highlightCheap: "Eng arzon",
      highlightBest: "Optimal",
      highlightFast: "Eng tez",
      heroBadge: "Qulay yo'nalish tanlovi",
      heroTitleA: "Reyslar ichidan",
      heroTitleB: "eng qulay",
      heroTitleC: "tanlovni qiling",
      heroDesc: "Real reyslarni qidiring, solishtiring va bron qiling.",
      date: "Sana",
      passenger: "Yo'lovchi",
      route: "Yo'nalish",
      eta: "Yetib borish",
      unselected: "Tanlanmagan",
      routeEnter: "Yo'nalish kiriting",
      routeSelection: "Tanlangan yo'nalishlar",
      curated: "Tavsiya etilgan yo'nalishlar",
      curatedTitle: "Aviakompaniyalar va qulay tariflar",
      curatedDesc: "Reyslarni qidiring, solishtiring va qulay tarifni tanlang.",
      from: "Qayerdan",
      to: "Qayerga",
      fromPlaceholder: "Masalan: LON yoki London",
      toPlaceholder: "Masalan: FRA yoki Frankfurt",
      openCalendar: "Narx kalendari",
      classLabel: "Klass",
      classNames: { Y: "Ekonom", C: "Biznes", F: "First" } as Record<string, string>,
      search: "Qidirish",
      searching: "Qidirilmoqda...",
      searchHint: "* Shahar nomi yoki IATA kod yozsangiz, autocomplete ishlaydi. Sana blokida minimal narxli kalendar ochiladi.",
      swap: "Almashtirish",
      clear: "Tozalash",
      best: "Optimal",
      cheap: "Arzon",
      fast: "Tez",
      filters: "Filtrlar",
      priceRange: "Narx oralig'i",
      duration: "Parvoz davomiyligi",
      departureTime: "Jo'nash vaqti",
      conveniences: "Qo'shimcha qulayliklar",
      baggageOnly: "Bagaj bor",
      baggageOnlySub: "Faqat bagajli tariflar",
      refundable: "Qaytarish mumkin",
      refundableSub: "Qaytarish mumkin bo'lgan tariflar",
      refundableNone: "Hozir qaytariladigan tarif topilmadi",
      cabin: "Kabina turi",
      all: "Barchasi",
      airline: "Aviakompaniya",
      allCompanies: "Barcha kompaniyalar",
      visibleFlights: "Hozir ro'yxatda",
      visibleFlightsSuffix: "ta ko'rinayotgan reys bor. Bu natijalar sizning qidiruvingiz bo'yicha yangilandi.",
      noFlights: "Hozircha reys topilmadi. Yo'nalish, sana va yo'lovchi sonini kiriting.",
      backendInfo: "",
      foundFlights: "",
      allDay: "Barchasi",
      beforeNoon: "06:00 gacha",
      day: "12:00-18:00",
      evening: "18:00 dan keyin",
      chooseFare: "Tarifni ko'rish",
      offers: "ta taklif",
      fromPriceLabel: "dan",
      airlineChoice: "Aviakompaniyani tanlang",
      airlineDataNote: "Narx, vaqt, klass va bagaj backenddan olinadi",
      view: "Ko'rish",
      noBaggage: "Bagaj yo'q",
      noCarry: "Qo'l yuki yo'q",
      moreSeats: "Yana",
      seats: "ta joy",
      terminal: "Terminal",
      direct: "to'g'ridan-to'g'ri",
      transfers: "ta transfer",
      refundableYes: "Qaytarish mumkin",
      refundableNo: "Qaytarilmaydi",
      availableFlight: "Reys mavjud",
      select: "Tanlash",
      economy: "Ekonom",
      business: "Biznes",
      first: "Birinchi klass",
      selectOption: "tanlash",
      segments: "Segmentlar",
      layover: "Kutish vaqti",
      carryOnLabel: "Qo'l yuki",
      skylinePreview: "Shahar panoramasi",
    },
    ru: {
      loginFirst: "Сначала выполните вход.",
      fillSearch: "Заполните пункты отправления, прибытия и дату.",
      dateFormat: "Формат даты: YYYY-MM-DD",
      searchError: "Ошибка поиска",
      backendBusy: "Backend временно не отвечает (502 Bad Gateway).",
      timeout: "Сервер отвечает слишком медленно. Запрос превысил timeout.",
      invalidRoute: "Выберите корректные пункты отправления и назначения.",
      highlightCheap: "Самый дешевый",
      highlightBest: "Оптимальный",
      highlightFast: "Самый быстрый",
      heroBadge: "Премиальный выбор маршрута",
      heroTitleA: "Выберите",
      heroTitleB: "лучший",
      heroTitleC: "рейс",
      heroDesc: "Ищите, сравнивайте и бронируйте реальные рейсы из backend.",
      date: "Дата",
      passenger: "Пассажир",
      route: "Маршрут",
      eta: "Прибытие",
      unselected: "Не выбрано",
      routeEnter: "Укажите маршрут",
      routeSelection: "Премиальный выбор маршрута",
      curated: "Подобранные поездки",
      curatedTitle: "Авиакомпании и удобные тарифы",
      curatedDesc: "Поиск, сравнение, фильтрация и бронирование продолжают работать вместе с backend.",
      from: "Откуда",
      to: "Куда",
      fromPlaceholder: "Например: TAS или London",
      toPlaceholder: "Например: IST или Frankfurt",
      openCalendar: "Календарь цен",
      classLabel: "Класс",
      classNames: { Y: "Эконом", C: "Бизнес", F: "Первый" } as Record<string, string>,
      search: "Поиск",
      searching: "Поиск...",
      searchHint: "* Можно вводить название города или IATA код, autocomplete сработает. В блоке даты открывается календарь минимальных цен из backend.",
      swap: "Поменять",
      clear: "Очистить",
      best: "Лучший",
      cheap: "Дешевый",
      fast: "Быстрый",
      filters: "Фильтры",
      priceRange: "Диапазон цен",
      duration: "Длительность перелета",
      departureTime: "Время вылета",
      conveniences: "Дополнительные опции",
      baggageOnly: "Есть багаж",
      baggageOnlySub: "Только тарифы с багажом",
      refundable: "Возвратный",
      refundableSub: "Тарифы с возможностью возврата",
      refundableNone: "Backend сейчас не вернул refundable тарифы",
      cabin: "Класс салона",
      all: "Все",
      airline: "Авиакомпания",
      allCompanies: "Все авиакомпании",
      visibleFlights: "Сейчас в списке",
      visibleFlightsSuffix: "видимых рейсов. Эти результаты обновлены по вашему поиску.",
      noFlights: "Пока рейсы не найдены. Укажите маршрут, дату и число пассажиров.",
      backendInfo: "Backend",
      foundFlights: "Найдено",
      allDay: "Все",
      beforeNoon: "До 06:00",
      day: "12:00-18:00",
      evening: "После 18:00",
      chooseFare: "Посмотреть тариф",
      offers: "предложения",
      fromPriceLabel: "от",
      airlineChoice: "Выберите авиакомпанию",
      airlineDataNote: "Цена, время, класс и багаж приходят из backend",
      view: "Открыть",
      noBaggage: "Без багажа",
      noCarry: "Без ручной клади",
      moreSeats: "Еще",
      seats: "мест",
      terminal: "Терминал",
      direct: "прямой",
      transfers: "пересадки",
      refundableYes: "Можно вернуть",
      refundableNo: "Невозвратный",
      availableFlight: "Рейс доступен",
      select: "Выбрать",
      economy: "Эконом",
      business: "Бизнес",
      first: "Первый",
      selectOption: "выбрать",
      segments: "Сегменты",
      layover: "Ожидание",
      carryOnLabel: "Ручная кладь",
      skylinePreview: "Панорама города",
    },
    en: {
      loginFirst: "Please log in first.",
      fillSearch: "Fill in origin, destination, and date.",
      dateFormat: "Date format: YYYY-MM-DD",
      searchError: "Search error",
      backendBusy: "The backend is temporarily unavailable (502 Bad Gateway).",
      timeout: "The server responded too slowly. The request timed out.",
      invalidRoute: "Choose valid origin and destination values.",
      highlightCheap: "Cheapest",
      highlightBest: "Best",
      highlightFast: "Fastest",
      heroBadge: "Premium route selection",
      heroTitleA: "Choose the",
      heroTitleB: "best",
      heroTitleC: "flight option",
      heroDesc: "Search, compare, and book real flights coming from the backend.",
      date: "Date",
      passenger: "Passenger",
      route: "Route",
      eta: "Arrival",
      unselected: "Not selected",
      routeEnter: "Enter a route",
      routeSelection: "Premium route selection",
      curated: "Curated journeys",
      curatedTitle: "Airlines and convenient fares",
      curatedDesc: "Search, compare, filter, and booking continue working together with the backend.",
      from: "From",
      to: "To",
      fromPlaceholder: "For example: LON or London",
      toPlaceholder: "For example: FRA or Frankfurt",
      openCalendar: "Price calendar",
      classLabel: "Class",
      classNames: { Y: "Economy", C: "Business", F: "First" } as Record<string, string>,
      search: "Search",
      searching: "Searching...",
      searchHint: "* Enter a city name or IATA code to use autocomplete. The date block opens the minimum-price calendar from the backend.",
      swap: "Swap",
      clear: "Clear",
      best: "Best",
      cheap: "Cheap",
      fast: "Fast",
      filters: "Filters",
      priceRange: "Price range",
      duration: "Flight duration",
      departureTime: "Departure time",
      conveniences: "Extra options",
      baggageOnly: "Has baggage",
      baggageOnlySub: "Only fares with baggage",
      refundable: "Refundable",
      refundableSub: "Fares that can be refunded",
      refundableNone: "The backend did not return refundable fares right now",
      cabin: "Cabin class",
      all: "All",
      airline: "Airline",
      allCompanies: "All airlines",
      visibleFlights: "Currently showing",
      visibleFlightsSuffix: "flights in the list. These results were updated for your search.",
      noFlights: "No flights found yet. Enter route, date, and passenger count.",
      backendInfo: "Backend",
      foundFlights: "Found",
      allDay: "All",
      beforeNoon: "Before 06:00",
      day: "12:00-18:00",
      evening: "After 18:00",
      chooseFare: "View fare",
      offers: "offers",
      fromPriceLabel: "from",
      airlineChoice: "Choose an airline",
      airlineDataNote: "Price, time, class, and baggage come from the backend",
      view: "View",
      noBaggage: "No baggage",
      noCarry: "No carry-on",
      moreSeats: "Only",
      seats: "seats left",
      terminal: "Terminal",
      direct: "direct",
      transfers: "transfers",
      refundableYes: "Refundable",
      refundableNo: "Non-refundable",
      availableFlight: "Flight available",
      select: "Select",
      economy: "Economy",
      business: "Business",
      first: "First",
      selectOption: "select",
      segments: "Segments",
      layover: "Layover",
      carryOnLabel: "Carry-on",
      skylinePreview: "City skyline",
    },
  }[language]

  const lastAutoQueryRef = useRef("")
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const hydratedRef = useRef(false)

  const airportLabels = useMemo(
    () => ({ ...DEFAULT_AIRPORT_DIRECTORY, ...dynamicAirportLabels }),
    [dynamicAirportLabels]
  )

  const locationOptions = useMemo(() => {
    const map = new Map<string, LocationOption>()

    for (const [code, name] of Object.entries(airportLabels)) {
      map.set(code, { code, name, searchText: normalizeText(`${code} ${name}`) })
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [airportLabels])

  const resolvedFrom = useMemo(() => resolveLocationCode(from, locationOptions), [from, locationOptions])
  const resolvedTo = useMemo(() => resolveLocationCode(to, locationOptions), [to, locationOptions])

  const formatAirport = useCallback(
    (code?: string) => {
      if (!code) return COMMON_COPY[language].unknown
      const upper = code.toUpperCase()
      const city =
        language === "uz"
          ? UZ_AIRPORT_OVERRIDES[upper] || airportLabels[upper]
          : airportLabels[upper]
      const safeCity =
        language === "uz" && city && /[\u0400-\u04FF]/.test(city)
          ? UZ_AIRPORT_OVERRIDES[upper] || upper
          : city
      return safeCity ? `${safeCity} (${upper})` : upper
    },
    [airportLabels, language]
  )

  const formatRoute = useCallback(
    (origin?: string, destination?: string) =>
      `${formatAirport(origin)} → ${formatAirport(destination)}`,
    [formatAirport]
  )

  const mapLocationLabels = useCallback((data?: SearchDataLike) => {
    const next: Record<string, string> = {}
    for (const city of data?.cities ?? []) next[city.code.toUpperCase()] = city.name
    for (const airport of data?.airports ?? []) next[airport.code.toUpperCase()] = airport.name
    return next
  }, [])

  const mapResponseToFlights = useCallback(
    (data: SearchDataLike | undefined, criteria: SearchCriteria) => {
      const options = data?.options ?? []
      const carriersMap = new Map(
        (data?.carriers ?? []).map((carrier) => [
          carrier.code?.toUpperCase(),
          {
            name: carrier.name,
            logo: toApiAsset(carrier.logo),
          },
        ])
      )
      const mapped: Flight[] = options.map((opt) => {
        const optionTrips = opt.trips ?? []
        const trip = optionTrips[0]
        const lastTrip = optionTrips[optionTrips.length - 1] ?? trip
        const seg = trip?.segments?.[0]
        const family = opt.packages?.families?.[0]
        const carrierCode = (opt.carrier || seg?.carrier || "").toUpperCase()
        const carrierMeta = carriersMap.get(carrierCode)
        const segments = optionTrips.flatMap((currentTrip: any, tripIndex: number) =>
          (currentTrip?.segments ?? []).map((segment: any, index: number) => ({
            id: `${currentTrip?.id || opt.id}-${tripIndex}-${index}`,
            origin: segment?.origin || currentTrip?.origin || criteria.from,
            destination: segment?.destination || currentTrip?.destination || criteria.to,
            departure: segment?.departure || "—",
            arrival: segment?.arrival || "—",
            departureTerminal: segment?.departureTerminal,
            arrivalTerminal: segment?.arrivalTerminal,
            baggage: segment?.baggage || "—",
            carryOn: segment?.carryOn || "—",
            bookingClass: segment?.bookingClass,
            serviceClass: segment?.serviceClass,
            carrier: segment?.carrier,
            operatingCarrier: segment?.operatingCarrier,
            duration: segment?.duration,
            layover: segment?.layover,
            equipment: segment?.equipment,
            fareBasis: segment?.fareBasis,
            flightNumber: segment?.flightNumber,
            seatsAvailable: segment?.seatsAvailable,
          }))
        )
        const baggage = formatAllowanceList([
          ...segments.map((segment: any) => segment.baggage),
          ...(family?.baggageInfos ?? []),
        ])
        const carryOn = formatAllowanceList(segments.map((segment: any) => segment.carryOn))
        const familyServices = family?.services ?? []
        const services = familyServices
          .map((service: any) => {
            const text = `${service.type} ${service.description}`.toLowerCase()
            if (text.includes("wifi")) return "wifi" as const
            if (text.includes("meal") || text.includes("food")) return "meal" as const
            if (text.includes("priority")) return "priority" as const
            if (text.includes("support")) return "support" as const
            return null
          })
          .filter(Boolean) as Array<"wifi" | "meal" | "priority" | "support">
        const refundable = isRefundableOption([
          family?.name || "",
          ...familyServices.map((service: any) => `${service.type} ${service.description}`),
        ])
        const computedDuration = resolveFlightDurationMinutes({
          optionTrips,
          segments,
          fallbackMinutes: Number(seg?.duration || 0),
        })
        const price =
          Number(opt.price || 0) ||
          Number(opt.passengerInfos?.reduce((sum: number, item: any) => sum + Number(item?.total || 0), 0) || 0)
        const primarySegment = segments[0]
        const lastSegment = segments[segments.length - 1]
        const flightNo = segments.length
          ? segments
              .map((segment: any) =>
                segment.flightNumber ? `${segment.carrier || segment.operatingCarrier || ""}-${segment.flightNumber}` : null
              )
              .filter(Boolean)
              .join(" · ")
          : "—"

        return {
          id: opt.id,
          from: trip?.origin || criteria.from,
          to: lastTrip?.destination || criteria.to,
          airline: carrierCode || "—",
          airlineName: carrierMeta?.name || opt.carrier || seg?.carrier || "—",
          airlineLogo: carrierMeta?.logo,
          departDate: toDateOnly(trip?.departure || primarySegment?.departure),
          depart: toTime(trip?.departure || primarySegment?.departure),
          arriveDate: toDateOnly(lastTrip?.arrival || lastSegment?.arrival),
          arrive: toTime(lastTrip?.arrival || lastSegment?.arrival),
          durationMin: computedDuration,
          price,
          currency: opt.currency || data?.currency,
          baggage,
          cabin: formatCabinClass(seg?.serviceClass || opt.class || criteria.travelClass, language),
          refundable: Boolean(opt.isRefundable ?? refundable),
          services,
          flightNo,
          carryOn,
          stopsCount: Math.max(
            0,
            Number(
              optionTrips.reduce(
                (sum: number, currentTrip: any) => sum + Number(currentTrip?.numberOfStops ?? 0),
                0
              ) || (segments.length ? segments.length - 1 : 0)
            )
          ),
          seatsAvailable: Math.min(...segments.map((segment: any) => Number(segment.seatsAvailable || 99))),
          segments,
        }
      })

      return { mapped, labels: mapLocationLabels(data) }
    },
    [language, mapLocationLabels]
  )

  useEffect(() => {
    let parsedTrips: SearchTrip[] = []
    try {
      const rawTrips = sp.get("trips")
      if (rawTrips) {
        const parsed = JSON.parse(rawTrips) as SearchTrip[]
        if (Array.isArray(parsed)) {
          parsedTrips = parsed.filter((item) => item?.origin && item?.destination && item?.departure)
        }
      }
    } catch {
      parsedTrips = []
    }

    let qFrom = sp.get("from") ?? ""
    let qTo = sp.get("to") ?? ""
    let qDate = sp.get("date") ?? ""
    let qPax = Number(sp.get("pax") ?? "1")
    let qClass = normalizeTravelClass(sp.get("class") ?? "")

    if (parsedTrips.length) {
      qFrom = parsedTrips[0]?.origin ?? qFrom
      qTo = parsedTrips[parsedTrips.length - 1]?.destination ?? qTo
      qDate = parsedTrips[0]?.departure ?? qDate
    }

    if (!qFrom || !qTo || !qDate) {
      try {
        const stored = localStorage.getItem(LAST_SUCCESSFUL_SEARCH_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<SearchCriteria>
          qFrom = parsed.from ?? qFrom
          qTo = parsed.to ?? qTo
          qDate = parsed.date ?? qDate
          qPax = Number(parsed.pax ?? qPax)
          qClass = normalizeTravelClass((parsed as Partial<SearchCriteria>).travelClass ?? qClass)
        }
      } catch {
        // ignore invalid localStorage
      }
    }

    const nextPax = !Number.isNaN(qPax) && qPax >= 1 ? qPax : 1

    setSearchTrips(parsedTrips)
    setFrom(qFrom)
    setTo(qTo)
    setDate(qDate)
    setPax(nextPax)
    setTravelClass(qClass)
    lastAutoQueryRef.current =
      qFrom && qTo && qDate
        ? JSON.stringify({ from: qFrom, to: qTo, date: qDate, pax: nextPax, travelClass: qClass, trips: parsedTrips.length ? parsedTrips : undefined })
        : ""
    hydratedRef.current = true
  }, [sp])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AIRPORT_CACHE_KEY)
      if (!stored) {
        setDynamicAirportLabels(DEFAULT_AIRPORT_DIRECTORY)
        return
      }
      const parsed = JSON.parse(stored) as Record<string, string>
      setDynamicAirportLabels({ ...DEFAULT_AIRPORT_DIRECTORY, ...parsed })
    } catch {
      setDynamicAirportLabels(DEFAULT_AIRPORT_DIRECTORY)
    }
  }, [])

  const runSearch = useCallback(async (criteria: SearchCriteria, showAlert: boolean) => {
    const token = getAccessToken()
    const { from, to, date, pax, travelClass, trips } = criteria
    const payloadTrips = trips?.length
      ? trips
      : [{ origin: from, destination: to, departure: date }]

    if (!token) {
      if (showAlert) toast.error(copy.loginFirst)
      return
    }
    if (!payloadTrips.length || payloadTrips.some((tripItem) => !tripItem.origin || !tripItem.destination || !tripItem.departure)) {
      if (showAlert) toast.error(copy.fillSearch)
      return
    }
    if (payloadTrips.some((tripItem) => !/^\d{4}-\d{2}-\d{2}$/.test(tripItem.departure))) {
      if (showAlert) toast.error(copy.dateFormat)
      return
    }

    const queryKey = JSON.stringify(criteria)
    const cached = flightsCache.get(queryKey)
    if (cached) {
      setItems(cached.items)
      return
    }

    const requestId = ++requestIdRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    try {
      const res = await searchAir(
        {
          adults: pax,
          children: 0,
          infants: 0,
          class: travelClass,
          trips: payloadTrips,
        },
        { signal: controller.signal }
      )

      if (requestId !== requestIdRef.current) return

      if (res.data.status !== "success" || !res.data.data?.options?.length) {
        setItems([])
        const msg = res.data.message || copy.searchError
        if (showAlert) toast.error(msg)
        return
      }

      const { mapped, labels } = mapResponseToFlights(res.data.data, criteria)
      setDynamicAirportLabels((prev) => {
        const next = { ...prev, ...labels }
        localStorage.setItem(AIRPORT_CACHE_KEY, JSON.stringify(next))
        return next
      })

      setItems(mapped)
      flightsCache.set(queryKey, { items: mapped, info: null })
      localStorage.setItem(LAST_SUCCESSFUL_SEARCH_KEY, JSON.stringify(criteria))
      localStorage.setItem(
        LAST_AIR_RESULT_META_KEY,
        JSON.stringify({
          from: criteria.from,
          to: criteria.to,
          date: criteria.date,
          pax: criteria.pax,
          count: mapped.length,
          updatedAt: new Date().toISOString(),
        })
      )
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return
      const status = err?.response?.status
      const msg =
        status === 502
          ? copy.backendBusy
          : err?.code === "ECONNABORTED"
            ? copy.timeout
            : err?.response?.data?.message || copy.searchError
      setItems([])
      if (showAlert) toast.error(msg)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        abortRef.current = null
      }
    }
  }, [copy.backendBusy, copy.dateFormat, copy.fillSearch, copy.loginFirst, copy.searchError, copy.timeout, mapResponseToFlights])

  const onSearch = () => {
    const criteria = {
      from: resolvedFrom,
      to: resolvedTo,
      date: date.trim(),
      pax,
      travelClass,
      trips: undefined,
    }
    if (!criteria.from || !criteria.to) {
      toast.error(copy.invalidRoute)
      return
    }
    lastAutoQueryRef.current = JSON.stringify(criteria)
    setSearchTrips([])
    navigate(
      `/flights?${new URLSearchParams({
        from: criteria.from,
        to: criteria.to,
        date: criteria.date,
        pax: String(criteria.pax),
        class: criteria.travelClass,
      }).toString()}`,
      { replace: true }
    )
    void runSearch(criteria, true)
  }

  useEffect(() => {
    if (!hydratedRef.current || !from || !to || !date) return
    const criteria = {
      from: resolvedFrom,
      to: resolvedTo,
      date,
      pax,
      travelClass,
      trips: searchTrips.length ? searchTrips : undefined,
    }
    if (!criteria.from || !criteria.to) return
    const queryKey = JSON.stringify(criteria)
    if (lastAutoQueryRef.current === queryKey) return
    lastAutoQueryRef.current = queryKey
    if (searchTrips.length) {
      navigate(
        `/flights?${new URLSearchParams({
          trips: JSON.stringify(searchTrips),
          pax: String(criteria.pax),
          class: criteria.travelClass,
        }).toString()}`,
        { replace: true }
      )
    } else {
      navigate(
        `/flights?${new URLSearchParams({
          from: criteria.from,
          to: criteria.to,
          date: criteria.date,
          pax: String(criteria.pax),
          class: criteria.travelClass,
        }).toString()}`,
        { replace: true }
      )
    }
    void runSearch(criteria, false)
  }, [date, from, navigate, pax, resolvedFrom, resolvedTo, runSearch, searchTrips, to, travelClass])

  useEffect(() => () => abortRef.current?.abort(), [])

  const sourceItems = items

  const airlines = useMemo(
    () => ["all", ...Array.from(new Set(sourceItems.map((item) => item.airline).filter(Boolean)))],
    [sourceItems]
  )
  const cabinOptions = useMemo<string[]>(
    () => [
      "all",
      ...Array.from(
        new Set(
          sourceItems
            .map((item) => item.cabin)
            .filter((item): item is string => Boolean(item))
        )
      ),
    ],
    [sourceItems]
  )
  const maxPrice = useMemo(
    () => (sourceItems.length ? Math.max(...sourceItems.map((item) => item.price)) : 0),
    [sourceItems]
  )
  const maxTripDuration = useMemo(
    () => (sourceItems.length ? Math.max(...sourceItems.map((item) => item.durationMin)) : 0),
    [sourceItems]
  )
  const hasRefundableFlights = useMemo(
    () => sourceItems.some((flight) => flight.refundable),
    [sourceItems]
  )

  useEffect(() => {
    if (maxPrice) setMaxPriceFilter(maxPrice)
  }, [maxPrice])

  useEffect(() => {
    if (maxTripDuration) setMaxDuration(maxTripDuration)
  }, [maxTripDuration])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveCitySlide((prev) => (prev + 1) % cityHeroSlides.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    let list = sourceItems.filter((flight) => {
      if (airlineFilter !== "all" && flight.airline !== airlineFilter) return false
      if (cabinFilter !== "all" && flight.cabin !== cabinFilter) return false
      if (maxPriceFilter !== null && flight.price > maxPriceFilter) return false
      if (maxDuration !== null && flight.durationMin > maxDuration) return false
      if (!matchDepartureBucket(flight.depart, departureFilter)) return false
      if (onlyBaggage && !hasBaggage(flight.baggage)) return false
      if (onlyRefundable && !flight.refundable) return false
      return true
    })

    if (sort === "cheap") list = [...list].sort((a, b) => a.price - b.price)
    if (sort === "fast") list = [...list].sort((a, b) => a.durationMin - b.durationMin)
    if (sort === "best") {
      list = [...list].sort(
        (a, b) => a.price * 0.7 + a.durationMin * 0.3 - (b.price * 0.7 + b.durationMin * 0.3)
      )
    }
    return list
  }, [
    airlineFilter,
    cabinFilter,
    sourceItems,
    departureFilter,
    maxDuration,
    maxPriceFilter,
    onlyBaggage,
    onlyRefundable,
    resolvedFrom,
    resolvedTo,
    sort,
  ])

  const groupedFlights = useMemo(() => {
    const grouped = new Map<
      string,
      { key: string; airline: string; airlineCode: string; airlineLogo?: string; items: Flight[]; minPrice: number }
    >()

    for (const flight of filtered) {
      const key = `${flight.airlineName || flight.airline}-${flight.airline}`
      const existing = grouped.get(key)
      if (existing) {
        existing.items.push(flight)
        existing.minPrice = Math.min(existing.minPrice, flight.price)
      } else {
        grouped.set(key, {
          key,
          airline: flight.airlineName || flight.airline || COMMON_COPY[language].unknown,
          airlineCode: flight.airline || "—",
          airlineLogo: flight.airlineLogo,
          items: [flight],
          minPrice: flight.price,
        })
      }
    }

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => a.price - b.price || a.durationMin - b.durationMin),
      }))
      .sort((a, b) => a.minPrice - b.minPrice)
  }, [filtered, language])

  const highlightCards = useMemo(() => {
    if (!filtered.length) return []
    const cheapest = [...filtered].sort((a, b) => a.price - b.price)[0]
    const fastest = [...filtered].sort((a, b) => a.durationMin - b.durationMin)[0]
    const best = [...filtered].sort(
      (a, b) => a.price * 0.7 + a.durationMin * 0.3 - (b.price * 0.7 + b.durationMin * 0.3)
    )[0]

    return [
      { key: "cheap", badge: copy.highlightCheap, tone: "blue" as const, flight: cheapest },
      { key: "best", badge: copy.highlightBest, tone: "gold" as const, flight: best },
      { key: "fast", badge: copy.highlightFast, tone: "rose" as const, flight: fastest },
    ]
  }, [copy.highlightBest, copy.highlightCheap, copy.highlightFast, filtered])

  const onPick = (flight: Flight) => {
    setSelected(flight)
    setOpen(true)
  }

  const onSwapRoute = () => {
    setFrom(to)
    setTo(from)
  }

  const onClearSearch = () => {
    setFrom("")
    setTo("")
    setDate("")
    setTravelClass("Y")
    setItems([])
    lastAutoQueryRef.current = ""
    localStorage.removeItem(LAST_SUCCESSFUL_SEARCH_KEY)
    localStorage.removeItem(LAST_AIR_RESULT_META_KEY)
    navigate("/flights", { replace: true })
  }

  useEffect(() => {
    if (!groupedFlights.length) {
      setExpandedAirline(null)
      return
    }

    setExpandedAirline((prev) =>
      prev && groupedFlights.some((group) => group.key === prev) ? prev : groupedFlights[0].key
    )
  }, [groupedFlights])

  const currentCitySlide = cityHeroSlides[activeCitySlide] ?? cityHeroSlides[0]
  const heroRouteText =
    resolvedFrom && resolvedTo ? `${resolvedFrom} → ${resolvedTo}` : copy.routeEnter
  const heroEta = date || copy.unselected

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f8_34%,#e7edf6_100%)] pt-20 text-[#1d2430] dark:bg-[linear-gradient(180deg,#0d1830_0%,#111e39_26%,#15254a_62%,#11203d_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(860px_340px_at_16%_0%,rgba(81,121,197,0.18),transparent_62%),radial-gradient(640px_280px_at_84%_4%,rgba(219,116,101,0.16),transparent_55%),radial-gradient(720px_320px_at_50%_28%,rgba(156,88,129,0.08),transparent_60%)] dark:bg-[radial-gradient(860px_340px_at_16%_0%,rgba(75,114,201,0.22),transparent_62%),radial-gradient(640px_280px_at_84%_4%,rgba(72,104,176,0.18),transparent_55%),radial-gradient(720px_320px_at_50%_28%,rgba(47,71,122,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-12 xl:px-8 2xl:max-w-[1720px]">
        <div className={`overflow-visible rounded-[40px] border p-4 shadow-[0_30px_90px_rgba(17,24,39,0.08)] backdrop-blur-md dark:shadow-[0_32px_90px_rgba(4,10,28,0.42)] md:p-6 ${softPanel}`}>
          <div className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0f2038_0%,#162b49_46%,#20385d_100%)] p-5 text-white shadow-[0_26px_70px_rgba(9,15,23,0.18)] md:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(92,156,255,0.18)_0%,transparent_34%),radial-gradient(circle_at_88%_14%,rgba(255,179,122,0.14)_0%,transparent_26%)]" />
            <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 backdrop-blur-sm">
                  <Sparkles size={14} />
                  {copy.routeSelection}
                </div>
                <h1 className="mt-6 max-w-[720px] text-[38px] font-black leading-[0.94] tracking-[-0.06em] md:text-[60px]">
                  {copy.heroTitleA}
                  <span className="block bg-[linear-gradient(135deg,#8ec5ff_0%,#d4bcff_46%,#ffd29b_100%)] bg-clip-text text-transparent">
                    {copy.heroTitleB}
                  </span>
                  <span className="block">{copy.heroTitleC}</span>
                </h1>
                <p className="mt-5 max-w-[620px] text-[15px] leading-8 text-[#d2dced] md:text-[17px]">
                  {copy.heroDesc}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                      <CalendarDays size={14} />
                      {copy.date}
                    </div>
                    <div className="mt-3 text-[24px] font-black">{date || copy.unselected}</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                      <Users size={14} />
                      {copy.passenger}
                    </div>
                    <div className="mt-3 text-[24px] font-black">{`${pax} ${language === "en" ? "pax" : "ta"}`.trim()}</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                      <Ticket size={14} />
                      {copy.classLabel}
                    </div>
                    <div className="mt-3 text-[24px] font-black">{copy.classNames[travelClass]}</div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(255,255,255,0.06)] backdrop-blur-sm">
                <img src={currentCitySlide.image} alt={currentCitySlide.city} className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,18,34,0.12)_0%,rgba(9,18,34,0.64)_100%)]" />
                <div className="relative flex h-full min-h-[320px] flex-col justify-between p-5">
                  <div className="rounded-[22px] border border-white/12 bg-[rgba(8,18,34,0.56)] p-4 backdrop-blur-md">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/68">
                      {copy.curated}
                    </div>
                    <div className="mt-2 text-[26px] font-black leading-tight">
                      {copy.curatedTitle}
                    </div>
                    <div className="mt-3 text-sm leading-7 text-white/80">
                      {copy.curatedDesc}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/92">
                        {currentCitySlide.city}
                      </div>
                      <div className="flex items-center gap-2">
                        {cityHeroSlides.map((slide, index) => (
                          <button
                            key={`${slide.city}-${index}`}
                            type="button"
                            onClick={() => setActiveCitySlide(index)}
                            className={[
                              "h-2.5 rounded-full transition-all",
                              index === activeCitySlide ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70",
                            ].join(" ")}
                            aria-label={slide.city}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/12 bg-[rgba(8,18,34,0.44)] p-5 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/64">
                          {copy.route}
                        </div>
                        <div className="mt-2 text-[28px] font-black tracking-[-0.05em]">
                          {heroRouteText}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                          {copy.eta}
                        </div>
                        <div className="mt-2 text-[22px] font-black">
                          {heroEta}
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/54">
                        {copy.from}
                      </span>
                      <div className="relative h-[3px] flex-1 rounded-full bg-white/18">
                        <div className="absolute inset-y-0 left-0 w-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.15)_0%,rgba(146,197,255,0.95)_48%,rgba(255,215,162,0.85)_100%)]" />
                        <Plane className="absolute -top-[11px] left-1/2 -translate-x-1/2 text-white/80" size={18} />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/54">
                        {copy.to}
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-white/78">
                      {currentCitySlide.city} {copy.skylinePreview}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-visible rounded-[32px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.93)_100%)] p-4 shadow-[0_24px_60px_rgba(17,24,39,0.06)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] md:p-5">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_210px_190px_220px]">
              <AutocompleteField label={copy.from} value={from} placeholder={copy.fromPlaceholder} options={locationOptions} onChange={setFrom} selectLabel={copy.selectOption} />
              <AutocompleteField label={copy.to} value={to} placeholder={copy.toPlaceholder} options={locationOptions} onChange={setTo} selectLabel={copy.selectOption} />
              <div className="relative flex min-h-[84px] flex-col justify-center rounded-[24px] border border-[#dbe3ef] bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(17,24,39,0.04)] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)]">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#9fb4d7]">{copy.date}</div>
                <button
                  type="button"
                  onClick={() => setCalendarOpen((prev) => !prev)}
                  className="text-left text-[16px] font-semibold text-[#1d2430] dark:text-white"
                >
                  {date || copy.openCalendar}
                </button>
                {calendarOpen ? (
                  <FareCalendarPicker
                    from={resolvedFrom}
                    to={resolvedTo}
                    pax={pax}
                    classCode={travelClass}
                    value={date}
                    onChange={(nextDate) => {
                      setDate(nextDate)
                      setCalendarOpen(false)
                    }}
                    onClose={() => setCalendarOpen(false)}
                  />
                ) : null}
              </div>
              <div className="flex min-h-[84px] flex-col justify-center rounded-[24px] border border-[#dbe3ef] bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(17,24,39,0.04)] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)]">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#9fb4d7]">{copy.classLabel}</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["Y", "C", "F"] as TravelClassCode[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTravelClass(item)}
                      className={[
                        "h-10 rounded-2xl border text-[13px] font-semibold transition",
                        travelClass === item
                          ? `${luxuryBtn} border-[#1a2231]/10`
                          : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-[#d4e2fb]",
                      ].join(" ")}
                    >
                      {copy.classNames[item]}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={onSearch} disabled={loading} className={`min-h-[84px] rounded-[24px] px-6 text-sm font-semibold uppercase tracking-[0.18em] transition disabled:opacity-60 ${luxuryBtn}`}>
                {loading ? copy.searching : copy.search}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onSwapRoute} disabled={!from && !to} className="h-10 rounded-full border border-[#dbe3ef] bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#627188] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                  {copy.swap}
                </button>
                <button type="button" onClick={onClearSearch} disabled={!from && !to && !date && items.length === 0} className="h-10 rounded-full border border-[#dbe3ef] bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#627188] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                  {copy.clear}
                </button>
                {(["best", "cheap", "fast"] as const).map((item) => (
                  <button key={item} onClick={() => setSort(item)} className={["h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition", sort === item ? luxuryBtn : "border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] text-[#627188] hover:bg-white dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:text-[#d4e2fb]"].join(" ")}>
                    {item === "best" ? copy.best : item === "cheap" ? copy.cheap : copy.fast}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {highlightCards.length > 0 ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {highlightCards.map((card) => (
              <TopDealCard
                key={card.key}
                badge={card.badge}
                tone={card.tone}
                flight={card.flight}
                onPick={onPick}
                formatRoute={formatRoute}
                language={language}
                chooseFareLabel={copy.chooseFare}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className={`rounded-[30px] p-5 ${softPanel}`}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#627188] dark:text-[#d4e2fb]"><Filter size={15} />{copy.filters}</div>
            <div className="mt-5 space-y-5">
              <FilterBlock title={copy.priceRange}>
                <input type="range" min={0} max={Math.max(maxPrice, 1)} value={maxPriceFilter ?? Math.max(maxPrice, 1)} onChange={(e) => setMaxPriceFilter(Number(e.target.value))} className="w-full accent-[#4f8bd6]" />
                <div className="mt-2 flex items-center justify-between text-xs text-[#627188]"><span>0</span><span>{formatMoney(maxPriceFilter ?? maxPrice, sourceItems[0]?.currency || "UZS")}</span></div>
              </FilterBlock>
              <FilterBlock title={copy.duration}>
                <input type="range" min={0} max={Math.max(maxTripDuration, 60)} value={maxDuration ?? Math.max(maxTripDuration, 60)} onChange={(e) => setMaxDuration(Number(e.target.value))} className="w-full accent-[#4f8bd6]" />
                <div className="mt-2 text-xs text-[#627188]">{fmtDuration(maxDuration ?? maxTripDuration, language)}</div>
              </FilterBlock>
              <FilterBlock title={copy.departureTime}>
                <div className="grid grid-cols-2 gap-2">{[
                  { key: "all", label: copy.allDay },
                  { key: "morning", label: copy.beforeNoon },
                  { key: "day", label: copy.day },
                  { key: "evening", label: copy.evening },
                ].map((item) => <button key={item.key} type="button" onClick={() => setDepartureFilter(item.key as "all" | "morning" | "day" | "evening")} className={["rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] transition", departureFilter === item.key ? "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174]" : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff]"].join(" ")}>{item.label}</button>)}</div>
              </FilterBlock>
              <FilterBlock title={copy.conveniences}>
                <div className="space-y-3">
                  <ToggleButton active={onlyBaggage} onClick={() => setOnlyBaggage((prev) => !prev)} title={copy.baggageOnly} subtitle={copy.baggageOnlySub} />
                  <ToggleButton active={onlyRefundable} disabled={!hasRefundableFlights} onClick={() => setOnlyRefundable((prev) => !prev)} title={copy.refundable} subtitle={hasRefundableFlights ? copy.refundableSub : copy.refundableNone} />
                </div>
              </FilterBlock>
              <FilterBlock title={copy.cabin}>
                <div className="space-y-2">{cabinOptions.map((item) => <button key={item} type="button" onClick={() => setCabinFilter(item)} className={["flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition", cabinFilter === item ? `${luxuryBtn} border-[#1a2231]/10` : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff]"].join(" ")}><span>{item === "all" ? copy.all : item}</span><Ticket size={15} /></button>)}</div>
              </FilterBlock>
              <FilterBlock title={copy.airline}>
                <div className="space-y-2">{airlines.map((item) => <button key={item} type="button" onClick={() => setAirlineFilter(item)} className={["flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition", airlineFilter === item ? "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174]" : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff]"].join(" ")}><span className="truncate">{item === "all" ? copy.allCompanies : item}</span><span className="text-xs uppercase">{item === "all" ? sourceItems.length : sourceItems.filter((flight) => flight.airline === item).length}</span></button>)}</div>
              </FilterBlock>
            </div>
          </aside>

          <div className="space-y-4">
            {!loading && sourceItems.length > 0 ? (
              <div className="rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 text-sm text-[#51627c] shadow-[0_12px_30px_rgba(17,24,39,0.05)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:text-[#d2e0f8] dark:shadow-[0_14px_32px_rgba(4,10,28,0.28)]">
                {copy.visibleFlights} <span className="font-black text-[#1d2430] dark:text-white">{filtered.length}</span> {copy.visibleFlightsSuffix}
              </div>
            ) : null}
            {loading ? <InlineLoading /> : null}
            {!loading && groupedFlights.length > 0 ? (
              <div className="space-y-4">
                {groupedFlights.map((group) => (
                  <AirlineGroupCard
                    key={group.key}
                    group={group}
                    expanded={expandedAirline === group.key}
                    onToggle={() => setExpandedAirline((prev) => (prev === group.key ? null : group.key))}
                    onPick={onPick}
                    copy={copy}
                    language={language}
                    formatRoute={formatRoute}
                  />
                ))}
              </div>
            ) : null}
            {!loading && filtered.length === 0 ? <div className="rounded-[28px] border border-[#dbe3ef] bg-white px-6 py-12 text-center text-[#627188] shadow-[0_18px_40px_rgba(17,24,39,0.06)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:text-[#d2e0f8] dark:shadow-[0_18px_40px_rgba(4,10,28,0.28)]">{copy.noFlights}</div> : null}
          </div>
        </div>
      </div>

      <FlightDetailsModal open={open} onClose={() => setOpen(false)} flight={selected} pax={pax} date={date} />
    </section>
  )
}

function AutocompleteField({ label, value, placeholder, options, onChange, selectLabel }: { label: string; value: string; placeholder: string; options: LocationOption[]; onChange: (value: string) => void; selectLabel: string }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const filteredOptions = useMemo(() => {
    const query = normalizeText(value)
    if (!query) return options
    return options.filter((option) => option.searchText.includes(query))
  }, [options, value])

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  const pickOption = (option: LocationOption) => {
    onChange(`${option.code} - ${option.name}`)
    setOpen(false)
    setActiveIndex(0)
  }

  return (
    <label className="relative rounded-[20px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] transition hover:border-[#cfd9e8] hover:bg-white dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.28)] dark:hover:bg-[rgba(28,46,84,0.94)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#9fb4d7]">{label}</div>
      <input
        className="mt-2 w-full bg-transparent text-[15px] font-semibold text-[#1d2430] outline-none placeholder:text-[#93a0b4] dark:text-white dark:placeholder:text-[#8ea5cb]"
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!filteredOptions.length) return
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
            setActiveIndex((prev) => (prev + 1) % filteredOptions.length)
          }
          if (e.key === "ArrowUp") {
            e.preventDefault()
            setOpen(true)
            setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
          }
          if (e.key === "Enter" && open) {
            e.preventDefault()
            pickOption(filteredOptions[activeIndex] ?? filteredOptions[0])
          }
          if (e.key === "Escape") {
            setOpen(false)
          }
        }}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
      />
      {open && filteredOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[320px] overflow-y-auto rounded-[22px] border border-[#dbe3ef] bg-white shadow-[0_22px_55px_rgba(17,24,39,0.14)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(13,24,48,0.98)_0%,rgba(18,32,60,0.97)_100%)] dark:shadow-[0_22px_55px_rgba(4,10,28,0.42)]">
          {filteredOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onMouseEnter={() => setActiveIndex(filteredOptions.findIndex((item) => item.code === option.code))}
              onMouseDown={(e) => {
                e.preventDefault()
                pickOption(option)
              }}
              onClick={() => pickOption(option)}
              className={[
                "flex w-full items-center justify-between border-b border-[#eef3f8] px-4 py-3 text-left transition last:border-b-0",
                filteredOptions[activeIndex]?.code === option.code ? "bg-[#f8fbff] dark:bg-[rgba(28,46,84,0.94)]" : "hover:bg-[#f8fbff] dark:hover:bg-[rgba(28,46,84,0.94)]",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-semibold text-[#1d2430] dark:text-white">{option.name}</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-[#7f8ca0] dark:text-[#9fb4d7]">{option.code}</span>
              </span>
              <span className="rounded-full border border-[#dce7f3] bg-[#f7fbff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5a6f8d] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-[#d4e2fb]">
                {selectLabel}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  )
}

function InfoChip({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,250,255,0.92)_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.24)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0] dark:text-[#9fb4d7]"><Icon size={14} />{label}</div>
      <div className="mt-2 text-[15px] font-bold text-[#1d2430] dark:text-white">{value}</div>
    </div>
  )
}
void InfoChip

function TopDealCard({ badge, tone, flight, onPick, formatRoute, language, chooseFareLabel }: { badge: string; tone: "blue" | "gold" | "rose"; flight: Flight; onPick: (flight: Flight) => void; formatRoute: (origin?: string, destination?: string) => string; language: "uz" | "ru" | "en"; chooseFareLabel: string }) {
  const toneStyles = {
    blue: "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,33,62,0.96)_0%,rgba(22,40,74,0.94)_100%)]",
    gold: "border-[#f3e2bf] bg-[linear-gradient(135deg,#fffaf0_0%,#fff4da_100%)] dark:border-[#5c5771] dark:bg-[linear-gradient(135deg,rgba(24,38,68,0.96)_0%,rgba(46,43,74,0.94)_100%)]",
    rose: "border-[#f0d9df] bg-[linear-gradient(135deg,#fff8fa_0%,#fff1f3_100%)] dark:border-[#5f4e73] dark:bg-[linear-gradient(135deg,rgba(25,37,68,0.96)_0%,rgba(56,40,76,0.94)_100%)]",
  } as const

  return (
    <div className={`rounded-[30px] border p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:shadow-[0_20px_50px_rgba(4,10,28,0.34)] ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6e84] dark:bg-[rgba(34,56,98,0.92)] dark:text-[#eef4ff]">{badge}</div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f8ca0] dark:text-[#9fb4d7]">{flight.airline}</div>
      </div>
      <div className="mt-4 text-xl font-black text-[#1d2430] dark:text-[#f4f8ff]">{formatRoute(flight.from, flight.to)}</div>
      <div className="mt-2 text-sm text-[#627188] dark:text-[#b8cceb]">{flight.depart} — {flight.arrive} · {fmtDuration(flight.durationMin, language)}</div>
      <div className="mt-4 text-2xl font-black text-[#1d2430] dark:text-white">{formatMoney(flight.price, flight.currency)}</div>
      <div className="mt-2 text-sm text-[#627188] dark:text-[#b8cceb]">
        {flight.departDate || "—"} → {flight.arriveDate || "—"}
      </div>
      <button type="button" onClick={() => onPick(flight)} className={`mt-4 h-11 w-full rounded-2xl text-sm font-semibold ${luxuryBtn}`}>{chooseFareLabel}</button>
    </div>
  )
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.04)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.24)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#627188] dark:text-[#d4e2fb]">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function ToggleButton({ active, disabled = false, onClick, title, subtitle }: { active: boolean; disabled?: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={[
      "flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition",
      active ? `${luxuryBtn} border-[#1a2231]/10` : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(28,46,84,0.94)]",
      disabled ? "cursor-not-allowed opacity-55 hover:bg-white dark:hover:bg-[rgba(20,35,66,0.84)]" : "",
    ].join(" ")}>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className={`mt-1 text-xs ${active ? "text-white/70" : "text-[#8a97aa] dark:text-[#9fb4d7]"}`}>{subtitle}</div>
      </div>
      <div className={["relative h-7 w-12 rounded-full border transition", active ? "border-white/25 bg-white/15" : "border-[#d9e3ef] bg-[#f3f7fc] dark:border-[#35507f] dark:bg-[rgba(31,51,89,0.9)]"].join(" ")}>
        <span className={["absolute top-1 h-5 w-5 rounded-full transition", active ? "left-6 bg-white" : "left-1 bg-[#90a2bb] dark:bg-[#c9d8f4]"].join(" ")} />
      </div>
    </button>
  )
}

type FlightsCopy = any

function AirlineGroupCard({
  group,
  expanded,
  onToggle,
  onPick,
  copy,
  language,
  formatRoute,
}: {
  group: { key: string; airline: string; airlineCode: string; airlineLogo?: string; items: Flight[]; minPrice: number }
  expanded: boolean
  onToggle: () => void
  onPick: (flight: Flight) => void
  copy: FlightsCopy
  language: "uz" | "ru" | "en"
  formatRoute: (origin?: string, destination?: string) => string
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#dbe3ef] bg-white shadow-[0_16px_40px_rgba(17,24,39,0.06)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#f8fbff] dark:hover:bg-[rgba(28,46,84,0.94)]"
      >
        <span className="flex min-w-0 items-center gap-3">
          {group.airlineLogo ? (
            <img src={group.airlineLogo} alt={group.airline} className="h-8 w-8 rounded-full border border-[#edf2f7] bg-white object-contain p-1" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef4ff] text-[#3269b8]">
              <Plane size={16} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-semibold text-[#1d2430] dark:text-white">
              {group.airline} ({group.airlineCode})
            </span>
            <span className="block text-sm text-[#71819a] dark:text-[#9fb4d7]">
              {group.items.length} {copy.offers} {copy.fromPriceLabel} {formatMoney(group.minPrice, group.items[0]?.currency)}
            </span>
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-[#71819a] transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <div className="border-t border-[#eef2f6] px-5 py-4 dark:border-[#30476f]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7f8ca0] dark:text-[#9fb4d7]">
            {copy.airlineChoice}
          </div>
          <div className="mb-3 text-sm text-[#627188] dark:text-[#d4e2fb]">
            {copy.airlineDataNote}
          </div>
          <div className="space-y-3">
            {group.items.map((flight) => (
              <AirlineOptionRow
                key={flight.id}
                flight={flight}
                onPick={onPick}
                copy={copy}
                language={language}
                formatRoute={formatRoute}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AirlineOptionRow({
  flight,
  onPick,
  copy,
  language,
  formatRoute,
}: {
  flight: Flight
  onPick: (flight: Flight) => void
  copy: FlightsCopy
  language: "uz" | "ru" | "en"
  formatRoute: (origin?: string, destination?: string) => string
}) {
  const isDirect = (flight.stopsCount ?? 0) === 0

  return (
    <div className="rounded-[24px] border border-[#e4ebf4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(23,41,76,0.9)_0%,rgba(18,33,62,0.92)_100%)]">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:items-center">
        <div className="min-w-0">
          <div className="text-[15px] font-black text-[#172033] dark:text-white">{flight.flightNo || flight.airline}</div>
          <div className="mt-1 text-sm text-[#627188] dark:text-[#d4e2fb]">{flight.airlineName || flight.airline}</div>
          <div className="mt-2 text-sm text-[#8a95a8] dark:text-[#9fb4d7]">{formatRoute(flight.from, flight.to)}</div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-center gap-3 text-[15px] font-black text-[#172033] dark:text-white">
            <span>{flight.depart}</span>
            <span className="text-[#9aa8bb]">→</span>
            <span>{flight.arrive}</span>
          </div>
          <div className="mt-2 text-center text-sm text-[#7b8aa2] dark:text-[#9fb4d7]">
            {fmtDuration(flight.durationMin, language)}, {isDirect ? copy.direct : `${flight.stopsCount} ${copy.transfers}`}
          </div>
          <div className="mt-2 text-center text-sm text-[#627188] dark:text-[#d4e2fb]">
            {flight.departDate || "—"} → {flight.arriveDate || "—"}
          </div>
        </div>

        <div className="text-left lg:text-right">
          <div className="text-[17px] font-black text-[#172033] dark:text-white">
            {formatCompactPrice(flight.price, flight.currency)}
          </div>
          <div className="mt-2 flex flex-wrap justify-start gap-2 lg:justify-end">
            {flight.cabin ? <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs text-[#627188] dark:bg-[rgba(31,51,89,0.88)] dark:text-[#d4e2fb]">{flight.cabin}</span> : null}
            {flight.baggage ? <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs text-[#627188] dark:bg-[rgba(31,51,89,0.88)] dark:text-[#d4e2fb]">{flight.baggage} bagaj</span> : null}
            {flight.carryOn ? <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs text-[#627188] dark:bg-[rgba(31,51,89,0.88)] dark:text-[#d4e2fb]">{copy.carryOnLabel} {flight.carryOn}</span> : null}
            <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs text-[#627188] dark:bg-[rgba(31,51,89,0.88)] dark:text-[#d4e2fb]">
              {flight.refundable ? copy.refundableYes : copy.refundableNo}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onPick(flight)}
            className={`mt-3 h-11 rounded-2xl px-5 text-sm font-semibold transition ${luxuryBtn}`}
          >
            {copy.chooseFare}
          </button>
        </div>
      </div>
    </div>
  )
}

function FlightRowCard({ flight, index, onPick, formatRoute, language, copy }: { flight: Flight; index: number; onPick: (flight: Flight) => void; formatRoute: (origin?: string, destination?: string) => string; language: "uz" | "ru" | "en"; copy: FlightsCopy }) {
  const badge = getFlightBadge(flight, index, language)
  const firstSegment = flight.segments?.[0]
  const lastSegment = flight.segments?.[flight.segments.length - 1]
  const segments = flight.segments ?? []
  const departureTerminal = firstSegment?.departureTerminal
  const arrivalTerminal = lastSegment?.arrivalTerminal
  const badgeTone =
    badge?.tone === "green"
      ? "bg-[#31b44b]"
      : badge?.tone === "blue"
        ? "bg-[#2f8cff]"
        : badge?.tone === "violet"
          ? "bg-[#4aa4d9]"
          : badge?.tone === "rose"
            ? "bg-[#ffedf1] text-[#ef476f]"
            : badge?.tone === "sky"
              ? "bg-[#e8f6ed] text-[#27a745]"
              : ""
  const isDirect = (flight.stopsCount ?? 0) === 0

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: index * 0.04 }} className="group overflow-hidden rounded-[34px] border border-[#dde4ee] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(17,24,39,0.10)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.92)_0%,rgba(16,31,60,0.96)_100%)] dark:shadow-[0_20px_50px_rgba(4,10,28,0.34)] dark:hover:shadow-[0_26px_58px_rgba(4,10,28,0.42)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {badge ? (
            <div className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${badgeTone || "bg-[#31b44b] text-white"}`}>
              {badge.label}
            </div>
          ) : null}
          <div className="mt-3 text-[20px] font-black tracking-[-0.03em] text-[#151c28] dark:text-white">
            {formatCompactPrice(flight.price, flight.currency)}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#445167] dark:text-[#d4e2fb]">
            <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 dark:bg-[rgba(31,51,89,0.88)]">{flight.baggage ? `${flight.baggage} ${copy.baggageOnly.toLowerCase()}` : copy.noBaggage}</span>
            <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 dark:bg-[rgba(31,51,89,0.88)]">{flight.carryOn ? `${copy.carryOnLabel} ${flight.carryOn}` : copy.noCarry}</span>
            {flight.seatsAvailable ? <span className="rounded-full bg-[#fff0f3] px-2.5 py-1 text-[#d94b64]">{copy.moreSeats} {flight.seatsAvailable} {copy.seats}</span> : null}
          </div>
        </div>
        <button type="button" onClick={() => onPick(flight)} className="shrink-0 rounded-2xl border border-[#e5ebf3] bg-[#f7f9fc] px-4 py-2 text-sm font-semibold text-[#1d2430] transition hover:bg-white dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-white dark:hover:bg-[rgba(28,46,84,0.94)]">
          {copy.view}
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3">
          {flight.airlineLogo ? (
            <img src={flight.airlineLogo} alt={flight.airlineName || flight.airline} className="h-11 w-11 rounded-full border border-[#edf2f7] bg-white object-contain p-1.5" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4d9ce6] text-white">
              <Plane size={18} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[18px] font-black text-[#1d2430] dark:text-white">{flight.depart}</div>
            <div className="text-sm text-[#6a778d] dark:text-[#d4e2fb]">{flight.from}</div>
            <div className="mt-1 text-xs font-medium text-[#8a95a8] dark:text-[#9fb4d7]">{flight.departDate || "—"}</div>
            {departureTerminal ? (
              <div className="mt-1 text-xs font-medium text-[#8a95a8] dark:text-[#9fb4d7]">{copy.terminal} {departureTerminal}</div>
            ) : null}
            <div className="text-sm text-[#8a95a8] dark:text-[#a9bddb]">{flight.airlineName || flight.airline}</div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-center gap-3 text-sm text-[#97a2b4] dark:text-[#9fb4d7]">
            <PlaneTakeoff size={15} />
            <span>{fmtDuration(flight.durationMin, language)}, {isDirect ? copy.direct : `${flight.stopsCount} ${copy.transfers}`}</span>
            <PlaneLanding size={15} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm font-bold text-[#1d67ff]">{flight.from}</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-[#dfe5ee]">
              <div className="absolute left-0 top-0 h-1.5 rounded-full bg-[linear-gradient(90deg,#dfe5ee_0%,#b7c4d8_45%,#dfe5ee_100%)]" style={{ width: "100%" }} />
              <PlaneTakeoff className="absolute -top-3 left-0 text-[#8d98a9]" size={15} />
              <PlaneLanding className="absolute -top-3 right-0 text-[#8d98a9]" size={15} />
            </div>
            <span className="text-sm font-bold text-[#1d67ff]">{flight.to}</span>
          </div>
          <div className="mt-3 text-sm text-[#627188] dark:text-[#d2e0f8]">{formatRoute(flight.from, flight.to)}</div>
        </div>

        <div className="text-right">
          <div className="text-[18px] font-black text-[#1d2430] dark:text-white">{flight.arrive}</div>
          <div className="text-sm text-[#6a778d] dark:text-[#d4e2fb]">{flight.to}</div>
          <div className="mt-1 text-xs font-medium text-[#8a95a8] dark:text-[#9fb4d7]">{flight.arriveDate || "—"}</div>
          {arrivalTerminal ? (
            <div className="mt-1 text-xs font-medium text-[#8a95a8] dark:text-[#9fb4d7]">{copy.terminal} {arrivalTerminal}</div>
          ) : null}
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#f3f6fa] px-3 py-1 text-xs font-semibold text-[#5f6e84] dark:bg-[rgba(31,51,89,0.88)] dark:text-[#d4e2fb]">
            <Ticket size={13} />
            {flight.cabin || "—"}
          </div>
        </div>
      </div>

      {segments.length ? (
        <div className="mt-5 rounded-[24px] border border-[#e8eef6] bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fd_100%)] p-4 dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(23,41,76,0.9)_0%,rgba(18,33,62,0.92)_100%)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#74839a] dark:text-[#9fb4d7]">
            {copy.segments}
          </div>

          <div className="mt-3 space-y-3">
            {segments.map((segment, segmentIndex) => (
              <div key={segment.id || `${segment.origin}-${segment.destination}-${segmentIndex}`}>
                <div className="grid gap-3 rounded-[20px] border border-[#e3ebf6] bg-white/92 p-4 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.88)] md:grid-cols-[220px_minmax(0,1fr)_200px]">
                  <div>
                    <div className="text-sm font-black text-[#1d2430] dark:text-white">
                      {(segment.carrier || segment.operatingCarrier || flight.airline) + (segment.flightNumber ? `-${segment.flightNumber}` : "")}
                    </div>
                    <div className="mt-1 text-sm text-[#627188] dark:text-[#d4e2fb]">
                      {formatRoute(segment.origin, segment.destination)}
                    </div>
                    <div className="mt-2 text-xs text-[#8a95a8] dark:text-[#9fb4d7]">
                      {segment.equipment || "—"} • {segment.bookingClass || "—"} / {segment.serviceClass || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 text-sm text-[#1d2430] dark:text-white">
                      <span className="font-black">{toTime(segment.departure)}</span>
                      <span className="text-[#9aa8bb]">→</span>
                      <span className="font-black">{toTime(segment.arrival)}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#8a95a8] dark:text-[#9fb4d7]">
                      {toDateOnly(segment.departure)} → {toDateOnly(segment.arrival)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#5f6e84] dark:text-[#d4e2fb]">
                      <span className="rounded-full bg-[#f3f7fc] px-2.5 py-1 dark:bg-[rgba(31,51,89,0.88)]">
                        {segment.origin}
                      </span>
                      <span className="rounded-full bg-[#f3f7fc] px-2.5 py-1 dark:bg-[rgba(31,51,89,0.88)]">
                        {segment.destination}
                      </span>
                      <span className="rounded-full bg-[#f3f7fc] px-2.5 py-1 dark:bg-[rgba(31,51,89,0.88)]">
                        {segment.duration ? fmtDuration(segment.duration, language) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-xs text-[#8a95a8] dark:text-[#9fb4d7]">
                      {copy.terminal}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#1d2430] dark:text-white">
                      {(segment.departureTerminal || "—") + " → " + (segment.arrivalTerminal || "—")}
                    </div>
                    <div className="mt-2 text-xs text-[#8a95a8] dark:text-[#9fb4d7]">
                      {segment.baggage || copy.noBaggage}
                    </div>
                    <div className="mt-1 text-xs text-[#8a95a8] dark:text-[#9fb4d7]">
                      {segment.carryOn || copy.noCarry}
                    </div>
                  </div>
                </div>

                {segmentIndex < segments.length - 1 ? (
                  <div className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#7f8ca0] dark:text-[#9fb4d7]">
                    {copy.layover}: {segment.layover ? fmtDuration(segment.layover, language) : "—"} • {segment.destination}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1f6] pt-4 dark:border-[#30476f]">
        <div className="flex flex-wrap gap-2 text-sm text-[#627188] dark:text-[#d4e2fb]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]"><Clock3 size={14} /> {fmtDuration(flight.durationMin, language)}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]"><Users size={14} /> {flight.refundable ? copy.refundableYes : copy.refundableNo}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]"><ArrowRight size={14} /> {flight.flightNo ?? copy.availableFlight}</span>
          {firstSegment?.origin || lastSegment?.destination ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]">
              <Plane size={14} /> {(firstSegment?.origin || flight.from) + " → " + (lastSegment?.destination || flight.to)}
            </span>
          ) : null}
        </div>
        <button type="button" className={`h-12 rounded-2xl px-6 font-semibold transition ${luxuryBtn}`} onClick={() => onPick(flight)}>
          {copy.select}
        </button>
      </div>
    </motion.div>
  )
}
void FlightRowCard

function InlineLoading() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-[28px] border border-[#dbe3ef] bg-white px-6 py-6 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.92)_0%,rgba(16,31,60,0.96)_100%)] dark:shadow-[0_18px_45px_rgba(4,10,28,0.34)]">
          <div className="space-y-4">
            <SkeletonLine className="h-6 w-[180px]" />
            <SkeletonLine className="h-12 w-full" />
            <div className="grid gap-3 xl:grid-cols-4">
              <SkeletonLine className="h-20 w-full" />
              <SkeletonLine className="h-20 w-full" />
              <SkeletonLine className="h-20 w-full" />
              <SkeletonLine className="h-20 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <motion.div className={`overflow-hidden rounded-full bg-[#e9eef5] dark:bg-[rgba(38,58,97,0.92)] ${className}`} initial={{ opacity: 0.5 }} animate={{ opacity: [0.45, 0.8, 0.45] }} transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}>
      <motion.div className="h-full w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }} />
    </motion.div>
  )
}
