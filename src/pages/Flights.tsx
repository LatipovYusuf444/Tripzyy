import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { ArrowRight, CalendarDays, ChevronDown, Clock3, Filter, Luggage, Plane, PlaneLanding, PlaneTakeoff, Sparkles, Ticket, Users, X } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import flightLoadingAnimation from "@/assets/animations/Animation - 1776516038455.json"
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
import { getStoredTheme, type SiteTheme } from "@/shared/theme/theme"

const luxuryBtn =
  "border border-[#174A8B] bg-[#174A8B] text-white shadow-[0_14px_28px_rgba(23,74,139,0.22)] transition hover:bg-[#123F78]"
const softPanel =
  "border border-[#D9D5CE] !bg-[#EBEBEB] bg-none shadow-[0_18px_52px_rgba(30,32,36,0.08)]"
const secondaryBtn =
  "border border-[#D9D5CE] !bg-white bg-none text-[#5F5A54] shadow-none transition hover:border-[#174A8B]/35 hover:!bg-[#F6F6F6] hover:text-[#174A8B]"
const fieldPanel =
  "rounded-[16px] border border-[#D9D5CE] !bg-white bg-none px-4 py-3 shadow-none transition hover:border-[#174A8B]/35"
const dropdownPanel =
  "flights-dropdown-panel absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[320px] overflow-y-auto rounded-[18px] border border-[#D9D5CE] !bg-white bg-none shadow-[0_20px_42px_rgba(30,32,36,0.14)]"
const unifiedCard =
  "border border-[#D9D5CE] !bg-white bg-none shadow-none"
const unifiedSoftCard =
  "border border-[#D9D5CE] !bg-[#F3F1ED] bg-none shadow-none"
const primaryText = "text-[#111A34]"
const secondaryText = "text-[#5F5A54]"
const mutedText = "text-[#77716A]"
const accentChip =
  "rounded-full border border-[#D9D5CE] !bg-[#EBEBEB] text-[#174A8B]"
const darkSortBtn =
  "border border-[#76B2FF]/50 !bg-[#071C44] bg-none text-[#F4F9FF] shadow-none transition hover:border-[#A7D4FF]/70 hover:!bg-[#0E356F]"
const darkSortActiveBtn =
  "border border-[#AAD3FF]/60 !bg-[#1F6FC1] bg-[linear-gradient(180deg,#1F6FC1_0%,#15518F_100%)] text-white shadow-none transition hover:!bg-[#256FC0]"
const flightsCache = new Map<string, { items: Flight[]; info: string | null }>()
const LAST_SUCCESSFUL_SEARCH_KEY = "last_successful_air_search_v1"
const LAST_AIR_RESULT_META_KEY = "last_air_result_meta_v1"
const SEARCH_LOADING_DURATION_MS = 10000

const cityHeroSlides = [
  { image: amsterdamImage, city: "Amsterdam" },
  { image: dubaiImage, city: "Dubai" },
  { image: spainImage, city: "Barcelona" },
  { image: germanyImage, city: "Berlin" },
  { image: parisImage, city: "Paris" },
  { image: sharmImage, city: "Sharm El Sheikh" },
  { image: turkeyImage, city: "Istanbul" },
] as const

type TravelClassCode = "Y" | "B" | "F"
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

const isNightTime = (time?: string) => {
  const hour = Number((time || "").split(":")[0])
  return Number.isFinite(hour) && (hour < 6 || hour >= 23)
}

const isNightFlight = (flight: Flight) =>
  isNightTime(flight.depart) ||
  isNightTime(flight.arrive) ||
  (flight.segments ?? []).some((segment) => isNightTime(toTime(segment.departure)) || isNightTime(toTime(segment.arrival)))

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
  if (upper === "B" || upper === "C" || upper === "J") return "B"
  if (upper === "F") return "F"
  return "Y"
}

const formatCabinClass = (code?: string, language: "uz" | "ru" | "en" = "en") => {
  const upper = (code || "").toUpperCase()
  if (upper === "B" || upper === "C" || upper === "J") {
    return language === "uz" ? "Biznes (B)" : language === "ru" ? "Бизнес (B)" : "Business (B)"
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
  const [stopFilter, setStopFilter] = useState<"all" | "direct" | "one">("all")
  const [shortOnly, setShortOnly] = useState(false)
  const [excludeNight, setExcludeNight] = useState(false)
  const [departureFilter, setDepartureFilter] = useState<
    "all" | "morning" | "day" | "evening"
  >("all")
  const [onlyBaggage, setOnlyBaggage] = useState(false)
  const [onlyRefundable, setOnlyRefundable] = useState(false)

  const [items, setItems] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)

  const [dynamicAirportLabels, setDynamicAirportLabels] = useState<Record<string, string>>(DEFAULT_AIRPORT_DIRECTORY)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarAnchorRef = useRef<HTMLDivElement>(null)
  const [searchTrips, setSearchTrips] = useState<SearchTrip[]>([])
  const [activeCitySlide, setActiveCitySlide] = useState(0)
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(() => getStoredTheme())
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [previewFlight, setPreviewFlight] = useState<Flight | null>(null)
  const checkoutRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncTheme = () => setSiteTheme(getStoredTheme())

    syncTheme()
    window.addEventListener("storage", syncTheme)
    window.addEventListener("tripzy-theme-change", syncTheme as EventListener)

    return () => {
      window.removeEventListener("storage", syncTheme)
      window.removeEventListener("tripzy-theme-change", syncTheme as EventListener)
    }
  }, [])

  const copy = {
    uz: {
      loginFirst: "Avval login qiling.",
      fillSearch: "Qayerdan, qayerga va sanani to'ldiring.",
      dateFormat: "Sana formati: YYYY-MM-DD",
      searchError: "Qidiruv xato",
      backendBusy: "Xizmat vaqtincha ishlamayapti.",
      timeout: "Server juda sekin javob berdi. So'rov timeout bo'ldi.",
      invalidRoute: "Jo'nash va manzil uchun to'g'ri variantni tanlang.",
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
      classNames: { Y: "Ekonom", B: "Biznes", F: "Birinchi" } as Record<string, string>,
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
      classNames: { Y: "Эконом", B: "Бизнес", F: "Первый" } as Record<string, string>,
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
      classNames: { Y: "Economy", B: "Business", F: "First" } as Record<string, string>,
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
      const mapped: Flight[] = options.flatMap((opt) => {
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
        const departureSource = trip?.departure || primarySegment?.departure
        const arrivalSource = lastTrip?.arrival || lastSegment?.arrival
        const origin = trip?.origin || primarySegment?.origin
        const destination = lastTrip?.destination || lastSegment?.destination
        const flightNo = segments.length
          ? segments
              .map((segment: any) =>
                segment.flightNumber ? `${segment.carrier || segment.operatingCarrier || ""}-${segment.flightNumber}` : null
              )
              .filter(Boolean)
              .join(" · ")
          : "—"

        if (!opt.id || !optionTrips.length || !segments.length || !origin || !destination || !departureSource || !arrivalSource || price <= 0) {
          return []
        }

        return [{
          id: opt.id,
          from: origin,
          to: destination,
          airline: carrierCode || "—",
          airlineName: carrierMeta?.name || opt.carrier || seg?.carrier || "—",
          airlineLogo: carrierMeta?.logo,
          departDate: toDateOnly(departureSource),
          depart: toTime(departureSource),
          arriveDate: toDateOnly(arrivalSource),
          arrive: toTime(arrivalSource),
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
        }]
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
    const requestId = ++requestIdRef.current
    const loadingStartedAt = Date.now()
    const finishLoading = async () => {
      const remaining = SEARCH_LOADING_DURATION_MS - (Date.now() - loadingStartedAt)
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining))
      }
      if (requestId === requestIdRef.current) {
        setLoading(false)
        abortRef.current = null
      }
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    const cached = flightsCache.get(queryKey)
    if (cached) {
      setItems(cached.items)
      void finishLoading()
      return
    }

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
        await finishLoading()
      }
    }
  }, [copy.backendBusy, copy.dateFormat, copy.fillSearch, copy.loginFirst, copy.searchError, copy.timeout, mapResponseToFlights])

  const scrollToResultsOnMobile = useCallback(() => {
    if (typeof window === "undefined") return
    if (!window.matchMedia("(max-width: 767px)").matches) return

    window.setTimeout(() => {
      const target = resultsRef.current
      if (!target) return
      const top = target.getBoundingClientRect().top + window.scrollY - 92
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
    }, 120)
  }, [])

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
    scrollToResultsOnMobile()
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
  const airlineOptions = useMemo(
    () =>
      Array.from(
        new Map(
          sourceItems.map((item) => [
            item.airline,
            {
              code: item.airline,
              name: item.airlineName || item.airline || COMMON_COPY[language].unknown,
              logo: item.airlineLogo,
              minPrice: item.price,
            },
          ])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [language, sourceItems]
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
      if (stopFilter === "direct" && (flight.stopsCount ?? 0) !== 0) return false
      if (stopFilter === "one" && (flight.stopsCount ?? 0) !== 1) return false
      if (shortOnly && flight.durationMin > 180) return false
      if (excludeNight && isNightFlight(flight)) return false
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
    stopFilter,
    shortOnly,
    excludeNight,
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
  void groupedFlights

  const onPick = (flight: Flight) => {
    setPreviewFlight(null)
    localStorage.setItem("tripzyy_flight_pick", JSON.stringify(flight))
    setSelectedFlight(flight)
  }

  useEffect(() => {
    if (!selectedFlight) return
    const scrollToCheckout = () => {
      const top = checkoutRef.current
        ? checkoutRef.current.getBoundingClientRect().top + window.scrollY - 96
        : 0
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
    }
    const frame = window.requestAnimationFrame(scrollToCheckout)
    const timer = window.setTimeout(scrollToCheckout, 120)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [selectedFlight])

  const openPreview = (flight: Flight) => {
    setPreviewFlight(flight)
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
    setSelectedFlight(null)
    setPreviewFlight(null)
    lastAutoQueryRef.current = ""
    localStorage.removeItem(LAST_SUCCESSFUL_SEARCH_KEY)
    localStorage.removeItem(LAST_AIR_RESULT_META_KEY)
    navigate("/flights", { replace: true })
  }

  const currentCitySlide = cityHeroSlides[activeCitySlide] ?? cityHeroSlides[0]
  const pillBtn = siteTheme === "dark" ? darkSortBtn : secondaryBtn
  const activePillBtn = siteTheme === "dark" ? darkSortActiveBtn : luxuryBtn
  return (
    <section
      className="flights-page relative overflow-hidden bg-[#EBEBEB] pt-0 text-[#111A34]"
      data-flight-theme={siteTheme}
    >
      <div className="relative mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-12 xl:px-8 2xl:max-w-[1720px]">
        <div className={`relative z-10 overflow-visible rounded-[28px] border p-4 md:p-5 ${softPanel}`}>
          <div className="relative overflow-hidden rounded-[24px] bg-white p-5 text-[#111A34] shadow-none md:p-7">
            <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D9D5CE] bg-[#F3F1ED] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#77716A]">
                  <Sparkles size={14} />
                  {copy.routeSelection}
                </div>
                <h1 className="mt-6 max-w-[720px] text-[38px] font-black leading-[0.94] tracking-[-0.06em] text-[#111A34] md:text-[60px]">
                  {copy.heroTitleA}
                  <span className="block text-[#174A8B]">
                    {copy.heroTitleB}
                  </span>
                  <span className="block">{copy.heroTitleC}</span>
                </h1>
                <p className="mt-5 max-w-[620px] text-[15px] leading-8 text-[#4b5563] md:text-[17px]">
                  {copy.heroDesc}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className={`rounded-[24px] p-4 backdrop-blur-sm ${unifiedCard}`}>
                    <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                      <CalendarDays size={14} />
                      {copy.date}
                    </div>
                    <div className={`mt-3 text-[24px] font-black ${primaryText}`}>{date || copy.unselected}</div>
                  </div>
                  <div className={`rounded-[24px] p-4 backdrop-blur-sm ${unifiedCard}`}>
                    <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                      <Users size={14} />
                      {copy.passenger}
                    </div>
                    <div className={`mt-3 text-[24px] font-black ${primaryText}`}>{`${pax} ${language === "en" ? "pax" : "ta"}`.trim()}</div>
                  </div>
                  <div className={`rounded-[24px] p-4 backdrop-blur-sm ${unifiedCard}`}>
                    <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                      <Ticket size={14} />
                      {copy.classLabel}
                    </div>
                    <div className={`mt-3 text-[24px] font-black ${primaryText}`}>{copy.classNames[travelClass]}</div>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[320px] overflow-hidden rounded-[22px] border border-[#D9D5CE] shadow-none">
                <img
                  src={currentCitySlide.image}
                  alt={currentCitySlide.city}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700"
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,23,42,0.46)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div className="rounded-full border border-white/18 bg-[rgba(7,18,35,0.34)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(2,8,24,0.22)] backdrop-blur-[10px]">
                    {currentCitySlide.city}
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(7,18,35,0.28)] px-3 py-2 shadow-[0_10px_24px_rgba(2,8,24,0.18)] backdrop-blur-[10px]">
                    {cityHeroSlides.map((slide, index) => (
                      <button
                        key={`${slide.city}-${index}`}
                        type="button"
                        onClick={() => setActiveCitySlide(index)}
                        className={[
                          "h-2.5 rounded-full transition-all",
                          index === activeCitySlide ? "w-8 bg-white" : "w-2.5 bg-white/55 hover:bg-white/80",
                        ].join(" ")}
                        aria-label={slide.city}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-5 overflow-visible rounded-[24px] p-4 md:p-5 ${unifiedSoftCard}`}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_210px_190px_220px]">
              <AutocompleteField label={copy.from} value={from} placeholder={copy.fromPlaceholder} options={locationOptions} onChange={setFrom} selectLabel={copy.selectOption} />
              <AutocompleteField label={copy.to} value={to} placeholder={copy.toPlaceholder} options={locationOptions} onChange={setTo} selectLabel={copy.selectOption} />
              <div ref={calendarAnchorRef} className={`relative flex min-h-[84px] flex-col justify-center rounded-[24px] px-4 py-3 ${unifiedCard}`}>
                <div className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>{copy.date}</div>
                <button
                  type="button"
                  onClick={() => setCalendarOpen((prev) => !prev)}
                  className={`text-left text-[16px] font-semibold ${primaryText}`}
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
                    anchorElement={calendarAnchorRef.current}
                    onChange={(nextDate) => {
                      setDate(nextDate)
                      setCalendarOpen(false)
                    }}
                    onClose={() => setCalendarOpen(false)}
                  />
                ) : null}
              </div>
              <div className="flex min-h-[84px] flex-col justify-center rounded-[16px] border border-[#D9D5CE] bg-white px-4 py-3 shadow-none">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">{copy.classLabel}</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["Y", "B", "F"] as TravelClassCode[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTravelClass(item)}
                      className={[
                        "h-10 rounded-2xl border text-[13px] font-semibold transition",
                        travelClass === item
                          ? `${activePillBtn} border-[#1a2231]/10`
                          : pillBtn,
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
                <button type="button" onClick={onSwapRoute} disabled={!from && !to} className={`h-10 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-70 ${pillBtn}`}>
                  {copy.swap}
                </button>
                <button type="button" onClick={onClearSearch} disabled={!from && !to && !date && items.length === 0} className={`h-10 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-70 ${pillBtn}`}>
                  {copy.clear}
                </button>
                {(["best", "cheap", "fast"] as const).map((item) => (
                  <button key={item} onClick={() => setSort(item)} className={["h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition", sort === item ? activePillBtn : pillBtn].join(" ")}>
                    {item === "best" ? copy.best : item === "cheap" ? copy.cheap : copy.fast}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {selectedFlight ? (
          <div ref={checkoutRef} className="mt-8 overflow-hidden rounded-[28px] border border-[#D9D5CE] bg-white shadow-[0_18px_52px_rgba(30,32,36,0.08)]">
            <FlightDetailsModal
              open
              onClose={() => setSelectedFlight(null)}
              flight={selectedFlight}
              pax={pax}
              date={date}
              pageMode
              stayOnPage
            />
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[22px] border border-[#D9D5CE] bg-[#F8F7F4] p-3 shadow-[0_14px_34px_rgba(30,32,36,0.06)]">
            <div className="sticky top-24 space-y-3 text-[13px] text-[#1F2933]">
              <div className="flex items-center gap-2 rounded-[16px] border border-[#D9D5CE] bg-white px-3 py-3 text-[13px] font-bold text-[#111A34]">
                <Filter size={15} className="text-[#174A8B]" />
                {copy.filters}
              </div>

              <CityFilterBlock title={language === "ru" ? "Пересадки туда" : language === "en" ? "Outbound stops" : "Borishda transfer"}>
                <MiniCheck checked={stopFilter === "direct"} onChange={() => setStopFilter(stopFilter === "direct" ? "all" : "direct")} label={copy.direct} side={formatMoney(Math.min(...sourceItems.filter((f) => (f.stopsCount ?? 0) === 0).map((f) => f.price), maxPrice || 0), sourceItems[0]?.currency)} />
                <MiniCheck checked={stopFilter === "one"} onChange={() => setStopFilter(stopFilter === "one" ? "all" : "one")} label={`1 ${copy.transfers}`} side={formatMoney(Math.min(...sourceItems.filter((f) => (f.stopsCount ?? 0) === 1).map((f) => f.price), maxPrice || 0), sourceItems[0]?.currency)} />
                <MiniToggle checked={shortOnly} onChange={() => setShortOnly((prev) => !prev)} label={language === "ru" ? "Короткие (до 3ч)" : language === "en" ? "Short (up to 3h)" : "Qisqa (3 soatgacha)"} />
                <MiniToggle checked={excludeNight} onChange={() => setExcludeNight((prev) => !prev)} label={language === "ru" ? "Кроме ночных" : language === "en" ? "Exclude night" : "Tungi reyslarsiz"} />
              </CityFilterBlock>

              <CityFilterBlock title={copy.priceRange}>
                <input type="range" min={0} max={Math.max(maxPrice, 1)} value={maxPriceFilter ?? Math.max(maxPrice, 1)} onChange={(e) => setMaxPriceFilter(Number(e.target.value))} className="w-full accent-[#174A8B]" />
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#59636E]">
                  <span>{formatCompactPrice(Math.min(...sourceItems.map((f) => f.price), 0), sourceItems[0]?.currency)}</span>
                  <span>{formatCompactPrice(maxPriceFilter ?? maxPrice, sourceItems[0]?.currency)}</span>
                </div>
              </CityFilterBlock>

              <CityFilterBlock title={copy.departureTime}>
                <input type="range" min={0} max={Math.max(maxTripDuration, 60)} value={maxDuration ?? Math.max(maxTripDuration, 60)} onChange={(e) => setMaxDuration(Number(e.target.value))} className="w-full accent-[#174A8B]" />
                <div className="mt-1 text-[11px] text-[#59636E]">{fmtDuration(maxDuration ?? maxTripDuration, language)}</div>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {[
                    { key: "all", label: copy.allDay },
                    { key: "morning", label: copy.beforeNoon },
                    { key: "day", label: copy.day },
                    { key: "evening", label: copy.evening },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDepartureFilter(item.key as "all" | "morning" | "day" | "evening")}
                      className={[
                        "rounded-[6px] border px-2 py-1.5 text-left text-[11px] transition",
                        departureFilter === item.key
                          ? "border-[#174A8B]/40 bg-[#E7F2FF] text-[#174A8B]"
                          : "border-[#D9D5CE] bg-white text-[#59636E] hover:border-[#9DBFE3]",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </CityFilterBlock>

              <CityFilterBlock title={copy.airline}>
                <MiniCheck checked={airlineFilter === "all"} onChange={() => setAirlineFilter("all")} label={copy.allCompanies} />
                {airlineOptions.slice(0, 8).map((item) => (
                  <MiniCheck
                    key={item.code}
                    checked={airlineFilter === item.code}
                    onChange={() => setAirlineFilter(airlineFilter === item.code ? "all" : item.code)}
                    label={item.name}
                    side={formatCompactPrice(item.minPrice, sourceItems[0]?.currency)}
                    icon={item.logo}
                  />
                ))}
              </CityFilterBlock>

              <CityFilterBlock title={copy.conveniences}>
                <MiniCheck checked={onlyBaggage} onChange={() => setOnlyBaggage((prev) => !prev)} label={copy.baggageOnly} />
                <MiniCheck checked={onlyRefundable} disabled={!hasRefundableFlights} onChange={() => setOnlyRefundable((prev) => !prev)} label={copy.refundable} />
              </CityFilterBlock>

              <CityFilterBlock title={copy.cabin}>
                {cabinOptions.map((item) => (
                  <MiniCheck key={item} checked={cabinFilter === item} onChange={() => setCabinFilter(item)} label={item === "all" ? copy.all : item} />
                ))}
              </CityFilterBlock>
            </div>
          </aside>

          <div ref={resultsRef} className="space-y-4">
            {loading ? <SearchLoadingAnimation language={language} /> : null}
            {!loading && filtered.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 text-sm shadow-[0_10px_24px_rgba(30,32,36,0.06)]">
                  <div className="font-semibold text-[#111A34]">{filtered.length} {copy.offers}</div>
                  <div className="flex flex-wrap gap-2">
                    {(["best", "cheap", "fast"] as const).map((item) => (
                      <button key={item} onClick={() => setSort(item)} className={["h-8 rounded-[8px] border px-3 text-[12px] font-semibold transition", sort === item ? "border-[#0A84FF] bg-[#E7F2FF] text-[#075DB8]" : "border-[#D9D5CE] bg-white text-[#59636E]"].join(" ")}>
                        {item === "best" ? copy.best : item === "cheap" ? copy.cheap : copy.fast}
                      </button>
                    ))}
                  </div>
                </div>
                {filtered.map((flight, index) => (
                  <CityTravelResultCard
                    key={flight.id}
                    flight={flight}
                    index={index}
                    pax={pax}
                    onPick={openPreview}
                    copy={copy}
                    language={language}
                  />
                ))}
              </div>
            ) : null}
            {!loading && filtered.length === 0 ? <div className={`rounded-[28px] px-6 py-12 text-center ${unifiedSoftCard} ${secondaryText}`}>{copy.noFlights}</div> : null}
          </div>
        </div>
      </div>

      <FlightPreviewModal
        flight={previewFlight}
        language={language}
        pax={pax}
        onClose={() => setPreviewFlight(null)}
        onBuy={(flight) => onPick(flight)}
      />

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
    <label className={`relative ${fieldPanel}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#58789c]">{label}</div>
      <input
        className="mt-2 w-full bg-transparent text-[15px] font-semibold text-[#111A34] outline-none placeholder:text-[#90a3ba]"
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
        <div className={dropdownPanel}>
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
                "flex w-full items-center justify-between border-b border-[#D9D5CE] px-4 py-3 text-left transition last:border-b-0",
                filteredOptions[activeIndex]?.code === option.code ? "bg-[#F3F1ED]" : "hover:bg-[#F6F6F6]",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-semibold text-[#111A34]">{option.name}</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-[#6f84a0]">{option.code}</span>
              </span>
              <span className="rounded-full border border-[#cfe1f4] bg-[linear-gradient(180deg,#ffffff_0%,#eef5fc_100%)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#466b95]">
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
    <div className="rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,250,255,0.92)_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0]"><Icon size={14} />{label}</div>
      <div className="mt-2 text-[15px] font-bold text-[#111A34]">{value}</div>
    </div>
  )
}
void InfoChip

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`rounded-[24px] p-4 ${unifiedSoftCard}`}>
      <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
void FilterBlock

function ToggleButton({ active, disabled = false, onClick, title, subtitle }: { active: boolean; disabled?: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={[
      "flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition",
      active ? `${luxuryBtn} border-[#1a2231]/10` : secondaryBtn,
      disabled ? "cursor-not-allowed opacity-55" : "",
    ].join(" ")}>
      <div>
        <div className={`text-sm font-semibold ${active ? "text-white" : primaryText}`}>{title}</div>
        <div className={`mt-1 text-xs ${active ? "text-white/70" : mutedText}`}>{subtitle}</div>
      </div>
      <div className={["relative h-7 w-12 rounded-full border transition", active ? "border-white/25 bg-white/15" : "border-[#D9D5CE] bg-[#EBEBEB]"].join(" ")}>
        <span className={["absolute top-1 h-5 w-5 rounded-full transition", active ? "left-6 bg-white" : "left-1 bg-[#174A8B]"].join(" ")} />
      </div>
    </button>
  )
}
void ToggleButton

function CityFilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#D9D5CE] bg-white p-3 shadow-[0_8px_20px_rgba(30,32,36,0.04)]">
      <div className="mb-3 flex items-center justify-between border-b border-[#ECE8E1] pb-2 text-[13px] font-bold text-[#111A34]">
        <span>{title}</span>
        <ChevronDown size={14} className="text-[#174A8B]" />
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function MiniCheck({
  checked,
  disabled = false,
  onChange,
  label,
  side,
  icon,
}: {
  checked: boolean
  disabled?: boolean
  onChange: () => void
  label: string
  side?: string
  icon?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={[
        "flex w-full items-center justify-between gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[12px] transition disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "border-[#0A84FF]/35 bg-[#E7F2FF] text-[#075DB8]" : "border-[#ECE8E1] bg-[#FBFAF8] text-[#26313C] hover:border-[#C9D8E8] hover:bg-white",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={[
            "grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border",
            checked ? "border-[#0A84FF] bg-[#0A84FF]" : "border-[#B7B2AA] bg-white",
          ].join(" ")}
        >
          {checked ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
        </span>
        {icon ? <img src={icon} alt="" className="h-4 w-4 shrink-0 object-contain" /> : null}
        <span className="truncate">{label}</span>
      </span>
      {side ? <span className={["shrink-0 text-[11px]", checked ? "text-[#075DB8]" : "text-[#59636E]"].join(" ")}>{side}</span> : null}
    </button>
  )
}

function MiniToggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={[
        "flex w-full items-center justify-between gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[12px] transition",
        checked ? "border-[#0A84FF]/35 bg-[#E7F2FF] text-[#075DB8]" : "border-[#ECE8E1] bg-[#FBFAF8] text-[#26313C] hover:border-[#C9D8E8] hover:bg-white",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className={["relative h-5 w-9 rounded-full transition", checked ? "bg-[#0A84FF]" : "bg-[#D1CDC6]"].join(" ")}>
        <span className={["absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition", checked ? "left-[18px]" : "left-0.5"].join(" ")} />
      </span>
    </button>
  )
}

function CityTravelResultCard({
  flight,
  index,
  pax,
  onPick,
  copy,
  language,
}: {
  flight: Flight
  index: number
  pax: number
  onPick: (flight: Flight) => void
  copy: FlightsCopy
  language: "uz" | "ru" | "en"
}) {
  const segments =
    flight.segments && flight.segments.length
      ? flight.segments.slice(0, Math.min(2, flight.segments.length))
      : [
          {
            id: flight.id,
            origin: flight.from,
            destination: flight.to,
            departure: `${flight.departDate || ""} ${flight.depart}`,
            arrival: `${flight.arriveDate || ""} ${flight.arrive}`,
            carrier: flight.airline,
            flightNumber: flight.flightNo,
            duration: flight.durationMin,
            layover: undefined,
          } as any,
        ]
  const selected = index === 0
  const isDirect = (flight.stopsCount ?? 0) === 0

  return (
    <div
      className={[
        "grid gap-3 rounded-[18px] border bg-white px-4 py-3 shadow-[0_10px_24px_rgba(30,32,36,0.06)] transition hover:shadow-[0_16px_34px_rgba(30,32,36,0.10)] lg:grid-cols-[minmax(0,1fr)_150px]",
        selected ? "border-[#35B871]" : "border-transparent",
      ].join(" ")}
    >
      <div className="min-w-0 divide-y divide-[#E6E2DC]">
        {segments.map((segment, segmentIndex) => {
          const dep = toTime(segment.departure)
          const arr = toTime(segment.arrival)
          const segDuration = Number(segment.duration || 0) || Math.round(flight.durationMin / Math.max(segments.length, 1))
          const segStops = segmentIndex === 0 ? flight.stopsCount ?? 0 : 0
          return (
            <div key={segment.id || `${segment.origin}-${segment.destination}-${segmentIndex}`} className="grid gap-2 py-2 first:pt-0 last:pb-0 md:grid-cols-[118px_82px_minmax(0,1fr)_82px] md:items-center">
              <div className="flex min-w-0 items-center gap-2">
                {flight.airlineLogo ? (
                  <img src={flight.airlineLogo} alt={flight.airlineName || flight.airline} className="h-5 w-5 shrink-0 object-contain" />
                ) : (
                  <Plane size={16} className="shrink-0 text-[#0A84FF]" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-[#26313C]">{flight.airlineName || flight.airline}</div>
                  <div className="text-[10px] leading-4 text-[#59636E]">{segment.carrier || flight.airline}</div>
                  <div className="text-[10px] leading-4 text-[#59636E]">{segment.flightNumber || flight.flightNo || "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-[15px] font-bold leading-5 text-[#111A34]">{dep}</div>
                <div className="text-[11px] leading-4 text-[#59636E]">{toDateOnly(segment.departure)}</div>
                <div className="text-[11px] leading-4 text-[#59636E]">{segment.origin}</div>
              </div>

              <div className="min-w-0 px-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-[5px] bg-[#EEEAE4] px-2 py-0.5 text-[10px] font-semibold text-[#59636E]">{segment.origin}</span>
                  <span className="h-px min-w-[32px] flex-1 bg-[#C9C4BD]" />
                  <span className="rounded-[5px] bg-[#EEEAE4] px-2 py-0.5 text-[10px] font-semibold text-[#59636E]">{segment.destination}</span>
                </div>
                <div className="mt-1 text-center text-[11px] font-semibold text-[#26313C]">{fmtDuration(segDuration, language)}</div>
                <div className={["mt-0.5 text-center text-[10px]", isDirect ? "text-[#078A50]" : "text-[#59636E]"].join(" ")}>
                  {segStops === 0 ? copy.direct : `${segStops} ${copy.transfers}`}
                </div>
                {segment.layover ? <div className="mt-0.5 text-center text-[10px] text-[#A33B22]">{copy.layover}: {fmtDuration(segment.layover, language)}</div> : null}
              </div>

              <div className="text-left md:text-right">
                <div className="text-[15px] font-bold leading-5 text-[#111A34]">{arr}</div>
                <div className="text-[11px] leading-4 text-[#59636E]">{toDateOnly(segment.arrival)}</div>
                <div className="text-[11px] leading-4 text-[#59636E]">{segment.destination}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#E6E2DC] pt-3 lg:flex-col lg:items-end lg:justify-center lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
        <div className="text-left lg:text-right">
          <div className="text-[20px] font-black leading-6 text-[#111A34]">{formatCompactPrice(flight.price, flight.currency)}</div>
          <div className="mt-1 text-[11px] leading-4 text-[#59636E]">{tripTypeLabel(flight, language)}</div>
          <div className="text-[11px] leading-4 text-[#59636E]">{paxLabel(language, pax)}</div>
        </div>
        <button
          type="button"
          onClick={() => onPick(flight)}
          className="h-10 min-w-[116px] rounded-[9px] bg-[#DDEEFF] px-5 text-[13px] font-semibold text-[#006CD8] transition hover:bg-[#CFE7FF]"
        >
          {copy.select}
        </button>
      </div>
    </div>
  )
}

const paxLabel = (language: "uz" | "ru" | "en", pax: number) =>
  language === "ru" ? `${pax} пассажир` : language === "en" ? `${pax} passenger` : `${pax} yo'lovchi`

const isRoundTripFlight = (flight: Flight) => {
  const segments = flight.segments ?? []
  const firstOrigin = (segments[0]?.origin || flight.from || "").toUpperCase()
  const outboundDestination = (flight.to || segments[0]?.destination || "").toUpperCase()
  const lastDestination = (segments[segments.length - 1]?.destination || flight.to || "").toUpperCase()

  if (!firstOrigin || !outboundDestination || !lastDestination) return false
  if (segments.length < 2) return false

  const hasReturnLeg = segments.some((segment, index) => {
    if (index === 0) return false
    const origin = (segment.origin || "").toUpperCase()
    const destination = (segment.destination || "").toUpperCase()
    return origin === outboundDestination || destination === firstOrigin
  })

  return hasReturnLeg && lastDestination === firstOrigin
}

const tripTypeLabel = (flight: Flight, language: "uz" | "ru" | "en") => {
  const roundTrip = isRoundTripFlight(flight)
  if (language === "ru") return roundTrip ? "Туда и обратно" : "В одну сторону"
  if (language === "en") return roundTrip ? "Round trip" : "One way"
  return roundTrip ? "Borish va qaytish" : "Bir tomonga"
}

function FlightPreviewModal({
  flight,
  language,
  pax,
  onClose,
  onBuy,
}: {
  flight: Flight | null
  language: "uz" | "ru" | "en"
  pax: number
  onClose: () => void
  onBuy: (flight: Flight) => void
}) {
  const copy = {
    uz: {
      title: "Parvoz tafsilotlari",
      subtitle: "Uchish va yetib kelish vaqtlari mahalliy",
      inWay: "yo'lda",
      inFlight: "parvozda",
      cabinBaggage: "Qo'l yuki",
      baggage: "Bagaj",
      paidBaggage: "bagaj uchun qo'shimcha to'lov",
      baggageNote: "Bagaj miqdorini o'zgartirish va tarifni tanlash bron sahifasida amalga oshiriladi",
      transfer: "Transfer",
      buy: "Sotib olish",
      checking: "Iltimos, kuting",
      checkingSub: "Reys, tarif va joylar tekshirilmoqda...",
      aircraft: "Samolyot",
    },
    ru: {
      title: "Детали перелёта",
      subtitle: "Время вылета и прилёта местное",
      inWay: "в пути",
      inFlight: "в полёте",
      cabinBaggage: "Ручная кладь",
      baggage: "Багаж",
      paidBaggage: "доплата за багаж",
      baggageNote: "Изменить количество багажа и выбрать тариф можно на странице бронирования",
      transfer: "Пересадка",
      buy: "Купить",
      checking: "Пожалуйста, подождите",
      checkingSub: "Проверяем рейс, тариф и наличие мест...",
      aircraft: "Самолёт",
    },
    en: {
      title: "Flight details",
      subtitle: "Departure and arrival times are local",
      inWay: "in transit",
      inFlight: "in flight",
      cabinBaggage: "Cabin baggage",
      baggage: "Baggage",
      paidBaggage: "extra baggage fee",
      baggageNote: "Baggage quantity and fare can be changed on the booking page",
      transfer: "Transfer",
      buy: "Buy",
      checking: "Please wait",
      checkingSub: "Checking flight, fare, and seat availability...",
      aircraft: "Aircraft",
    },
  }[language]
  const [isBuying, setIsBuying] = useState(false)
  const buyTimerRef = useRef<number | null>(null)
  const buyCompletedRef = useRef(false)

  const segments =
    flight?.segments && flight.segments.length
      ? flight.segments
      : flight
        ? [
            {
              id: flight.id,
              origin: flight.from,
              destination: flight.to,
              departure: `${flight.departDate || ""} ${flight.depart}`,
              arrival: `${flight.arriveDate || ""} ${flight.arrive}`,
              carrier: flight.airline,
              flightNumber: flight.flightNo,
              duration: flight.durationMin,
              layover: undefined,
              baggage: flight.baggage,
              carryOn: flight.carryOn,
              equipment: undefined,
            } as any,
          ]
        : []

  useEffect(() => {
    return () => {
      if (buyTimerRef.current) window.clearTimeout(buyTimerRef.current)
    }
  }, [])

  const completeBuyCheck = useCallback(() => {
    if (!flight || buyCompletedRef.current) return
    buyCompletedRef.current = true
    if (buyTimerRef.current) {
      window.clearTimeout(buyTimerRef.current)
      buyTimerRef.current = null
    }
    onBuy(flight)
  }, [flight, onBuy])

  if (!flight) return null

  const startBuyCheck = () => {
    if (isBuying) return
    buyCompletedRef.current = false
    setIsBuying(true)
    buyTimerRef.current = window.setTimeout(completeBuyCheck, 10500)
  }

  const handleClose = () => {
    if (buyTimerRef.current) {
      window.clearTimeout(buyTimerRef.current)
      buyTimerRef.current = null
    }
    setIsBuying(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative flex max-h-[82svh] w-[calc(100%-20px)] max-w-[760px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:max-h-[88vh] sm:w-full sm:rounded-[28px]"
        >
          <div className="flex items-start justify-between gap-3 px-3.5 pb-1.5 pt-3 sm:gap-4 sm:px-8 sm:pb-3 sm:pt-7">
            <div>
              <div className="text-[18px] font-black leading-5 text-[#111111] sm:text-[22px] sm:leading-7">{copy.title}</div>
              <div className="mt-0.5 text-[12px] leading-4 text-[#6D6760] sm:mt-1 sm:text-[14px] sm:leading-5">{copy.subtitle}</div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isBuying}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#111111] transition hover:bg-[#F0EDE8] sm:h-10 sm:w-10"
              aria-label="Close"
            >
              <X size={18} className="sm:size-[22px]" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-2 sm:px-8 sm:pb-5">
            <div className="mb-2 sm:mb-5">
              <div className="text-[19px] font-black leading-5 text-[#111111] sm:text-[26px] sm:leading-8">
                {flight.from} → {flight.to}
              </div>
              <div className="mt-0.5 text-[12px] text-[#6D6760] sm:mt-1 sm:text-[16px]">
                {fmtDuration(flight.durationMin, language)} {copy.inWay}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-5">
              {segments.map((segment, index) => {
                const carrier = segment.carrier || segment.operatingCarrier || flight.airline
                const flightNo = segment.flightNumber || flight.flightNo || ""
                const duration = Number(segment.duration || 0) || Math.round(flight.durationMin / Math.max(segments.length, 1))
                return (
                  <div key={segment.id || `${segment.origin}-${segment.destination}-${index}`}>
                    <div className="mb-1.5 flex items-center gap-2 sm:mb-3 sm:gap-3">
                      {flight.airlineLogo ? (
                        <img src={flight.airlineLogo} alt={flight.airlineName || flight.airline} className="h-7 w-7 object-contain sm:h-9 sm:w-9" />
                      ) : (
                        <Plane size={20} className="text-[#0A84FF] sm:size-[26px]" />
                      )}
                      <div>
                        <div className="text-[15px] font-bold text-[#111111] sm:text-[17px]">{flight.airlineName || flight.airline}</div>
                        <div className="text-[12px] text-[#6D6760] sm:text-[14px]">{fmtDuration(duration, language)} {copy.inFlight}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-[16px_minmax(0,1fr)_42px] gap-1.5 sm:grid-cols-[22px_minmax(0,1fr)_58px] sm:gap-3">
                      <div className="relative flex justify-center">
                        <span className="mt-2 h-2 w-2 rounded-full border border-[#C9C4BD] bg-white" />
                        <span className="absolute bottom-2 top-4 w-px bg-[#D9D5CE]" />
                      </div>
                      <div className="pb-3 sm:pb-6">
                        <div className="grid grid-cols-[50px_minmax(0,1fr)] gap-1.5 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-3">
                          <div>
                            <div className="text-[15px] font-bold leading-5 text-[#111111] sm:text-[17px]">{toTime(segment.departure)}</div>
                            <div className="text-[11px] leading-4 text-[#6D6760] sm:text-[14px]">{toDateOnly(segment.departure)}</div>
                          </div>
                          <div>
                            <div className="text-[15px] font-bold leading-5 text-[#111111] sm:text-[17px]">{segment.origin}</div>
                            <div className="text-[11px] leading-4 text-[#6D6760] sm:text-[14px]">{segment.departureTerminal || ""}</div>
                          </div>
                        </div>
                      </div>
                      <div className="pb-3 text-right sm:pb-6">
                        <span className="rounded-[7px] bg-[#EEEAE4] px-1.5 py-0.5 text-[11px] font-semibold text-[#6D6760] sm:px-2 sm:py-1 sm:text-[13px]">{segment.origin}</span>
                      </div>

                      <div className="relative flex justify-center">
                        <span className="mt-2 h-2 w-2 rounded-full border border-[#C9C4BD] bg-white" />
                      </div>
                      <div>
                        <div className="grid grid-cols-[50px_minmax(0,1fr)] gap-1.5 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-3">
                          <div>
                            <div className="text-[15px] font-bold leading-5 text-[#111111] sm:text-[17px]">{toTime(segment.arrival)}</div>
                            <div className="text-[11px] leading-4 text-[#6D6760] sm:text-[14px]">{toDateOnly(segment.arrival)}</div>
                          </div>
                          <div>
                            <div className="text-[15px] font-bold leading-5 text-[#111111] sm:text-[17px]">{segment.destination}</div>
                            <div className="text-[11px] leading-4 text-[#6D6760] sm:text-[14px]">{segment.arrivalTerminal || ""}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded-[7px] bg-[#EEEAE4] px-1.5 py-0.5 text-[11px] font-semibold text-[#6D6760] sm:px-2 sm:py-1 sm:text-[13px]">{segment.destination}</span>
                      </div>
                    </div>

                    <div className="mt-1.5 space-y-1 text-[12px] text-[#111111] sm:mt-3 sm:space-y-2 sm:text-[15px]">
                      <div className="flex items-center gap-2 text-[#6D6760]">
                        <Ticket size={13} className="sm:size-[17px]" />
                        <span>{carrier}{flightNo ? `-${flightNo}` : ""} · {segment.equipment || copy.aircraft}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Luggage size={13} className="sm:size-[17px]" />
                        <span>{copy.cabinBaggage}: {segment.carryOn || flight.carryOn || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Luggage size={13} className="sm:size-[17px]" />
                        <span>{copy.baggage}: {segment.baggage || flight.baggage || copy.paidBaggage}</span>
                      </div>
                      <div className="text-[11px] leading-4 text-[#6D6760] sm:text-[13px] sm:leading-5">{copy.baggageNote}</div>
                    </div>

                    {index < segments.length - 1 ? (
                      <div className="mt-3 rounded-[10px] bg-[#F0EDE8] px-3 py-2 text-[13px] font-bold text-[#111111] sm:mt-5 sm:rounded-[14px] sm:px-5 sm:py-4 sm:text-[16px]">
                        {copy.transfer} {segment.layover ? fmtDuration(segment.layover, language) : fmtDuration(segments[index + 1]?.layover || 0, language)} {segment.destination}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-2 border-t border-[#E6E2DC] bg-white px-3.5 py-2.5 sm:grid-cols-[1fr_1.2fr] sm:gap-3 sm:px-8 sm:py-4">
            <div>
              <div className="text-[19px] font-black leading-5 text-[#111111] sm:text-[24px] sm:leading-7">{formatCompactPrice(flight.price, flight.currency)}</div>
              <div className="text-[12px] text-[#111111] sm:text-[14px]">{tripTypeLabel(flight, language)}, {paxLabel(language, pax)}</div>
            </div>
            <button
              type="button"
              onClick={startBuyCheck}
              disabled={isBuying}
              className="h-10 rounded-[12px] bg-[#0A84FF] px-5 text-[14px] font-bold text-white transition hover:bg-[#006CD8] disabled:cursor-wait disabled:opacity-80 sm:h-12 sm:px-6 sm:text-[16px]"
            >
              {isBuying ? `${copy.checking}...` : copy.buy}
            </button>
          </div>

          <AnimatePresence>
            {isBuying ? (
              <motion.div
                className="absolute inset-0 z-20 grid place-items-center bg-black/45 p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="flex min-h-[520px] w-full max-w-[650px] flex-col overflow-hidden rounded-[28px] bg-[#F8F7F4] text-center shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:min-h-[607px]"
                >
                  <div className="px-6 pt-8">
                    <div className="mx-auto mb-4 h-10 w-10 rounded-[10px] bg-[#174A8B]" />
                    <div className="text-[22px] font-black text-[#111111]">{copy.checking}</div>
                    <div className="mt-2 text-[14px] text-[#6D6760]">{copy.checkingSub}</div>
                  </div>
                  <FlightLoadingAnimation />
                  <div className="mt-auto px-6 pb-7">
                    <div className="mx-auto h-2 max-w-[320px] overflow-hidden rounded-full bg-[#D9D5CE]">
                      <motion.div
                        className="h-full rounded-full bg-[#0A84FF]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 10, ease: "linear" }}
                        onAnimationComplete={completeBuyCheck}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function FlightLoadingAnimation({ compact = false }: { compact?: boolean }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  useEffect(() => {
    const durationSeconds =
      (Number(flightLoadingAnimation.op) - Number(flightLoadingAnimation.ip || 0)) /
      Number(flightLoadingAnimation.fr || 30)
    const tenSecondSpeed = durationSeconds > 0 ? durationSeconds / 10 : 1
    lottieRef.current?.setSpeed(tenSecondSpeed)
  }, [])

  return (
    <div className={compact ? "relative mx-auto flex h-[286px] w-full items-center justify-center overflow-visible px-2 py-1 sm:h-[320px]" : "relative mx-auto flex h-[310px] w-full flex-1 items-center justify-center overflow-visible px-4 py-2 sm:h-[330px]"}>
      <Lottie
        lottieRef={lottieRef}
        animationData={flightLoadingAnimation}
        loop={false}
        autoplay
        className={compact ? "aspect-square h-[280px] max-h-full w-[280px] max-w-full sm:h-[318px] sm:w-[318px]" : "aspect-square h-[300px] max-h-full w-[300px] max-w-full sm:h-[320px] sm:w-[320px]"}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        aria-label="Flight availability loading"
      />
    </div>
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
    <div className={`overflow-hidden rounded-[28px] ${unifiedCard}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#F3F1ED]"
      >
        <span className="flex min-w-0 items-center gap-3">
          {group.airlineLogo ? (
            <img src={group.airlineLogo} alt={group.airline} className="h-8 w-8 rounded-full border border-[#D9D5CE] bg-white object-contain p-1" />
          ) : (
            <span className={`grid h-8 w-8 place-items-center ${accentChip}`}>
              <Plane size={16} />
            </span>
          )}
          <span className="min-w-0">
            <span className={`block truncate text-[17px] font-semibold ${primaryText}`}>
              {group.airline} ({group.airlineCode})
            </span>
            <span className={`block text-sm ${secondaryText}`}>
              {group.items.length} {copy.offers} {copy.fromPriceLabel} {formatMoney(group.minPrice, group.items[0]?.currency)}
            </span>
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 ${mutedText} transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <div className="border-t border-[#d6d6d6] px-5 py-4">
          <div className={`mb-3 text-xs font-semibold uppercase tracking-[0.16em] ${mutedText}`}>
            {copy.airlineChoice}
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
void AirlineGroupCard

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
    <div className={`rounded-[24px] p-4 ${unifiedSoftCard}`}>
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:items-center">
        <div className="min-w-0">
          <div className={`text-[15px] font-black ${primaryText}`}>{flight.flightNo || flight.airline}</div>
          <div className={`mt-1 text-sm ${secondaryText}`}>{flight.airlineName || flight.airline}</div>
          <div className={`mt-2 text-sm ${mutedText}`}>{formatRoute(flight.from, flight.to)}</div>
        </div>

        <div className="min-w-0">
          <div className={`flex items-center justify-center gap-3 text-[15px] font-black ${primaryText}`}>
            <span>{flight.depart}</span>
            <span className="text-[#315d8f]">→</span>
            <span>{flight.arrive}</span>
          </div>
          <div className={`mt-2 text-center text-sm ${secondaryText}`}>
            {fmtDuration(flight.durationMin, language)}, {isDirect ? copy.direct : `${flight.stopsCount} ${copy.transfers}`}
          </div>
          <div className={`mt-2 text-center text-sm ${mutedText}`}>
            {flight.departDate || "—"} → {flight.arriveDate || "—"}
          </div>
        </div>

        <div className="text-left lg:text-right">
          <div className={`text-[17px] font-black ${primaryText}`}>
            {formatCompactPrice(flight.price, flight.currency)}
          </div>
          <div className="mt-2 flex flex-wrap justify-start gap-2 lg:justify-end">
            {flight.cabin ? <span className={`px-2.5 py-1 text-xs ${accentChip}`}>{flight.cabin}</span> : null}
            {flight.baggage ? <span className={`px-2.5 py-1 text-xs ${accentChip}`}>{flight.baggage} bagaj</span> : null}
            {flight.carryOn ? <span className={`px-2.5 py-1 text-xs ${accentChip}`}>{copy.carryOnLabel} {flight.carryOn}</span> : null}
            <span className={`px-2.5 py-1 text-xs ${accentChip}`}>
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
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: index * 0.04 }} className={`group overflow-hidden rounded-[34px] p-5 transition hover:-translate-y-0.5 ${unifiedCard}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {badge ? (
            <div className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${badgeTone || "bg-[#31b44b] text-white"}`}>
              {badge.label}
            </div>
          ) : null}
          <div className={`mt-3 text-[20px] font-black tracking-[-0.03em] ${primaryText}`}>
            {formatCompactPrice(flight.price, flight.currency)}
          </div>
          <div className={`mt-2 flex flex-wrap gap-2 text-sm ${secondaryText}`}>
            <span className={`px-2.5 py-1 ${accentChip}`}>{flight.baggage ? `${flight.baggage} ${copy.baggageOnly.toLowerCase()}` : copy.noBaggage}</span>
            <span className={`px-2.5 py-1 ${accentChip}`}>{flight.carryOn ? `${copy.carryOnLabel} ${flight.carryOn}` : copy.noCarry}</span>
            {flight.seatsAvailable ? <span className="rounded-full bg-[#fff0f3] px-2.5 py-1 text-[#d94b64]">{copy.moreSeats} {flight.seatsAvailable} {copy.seats}</span> : null}
          </div>
        </div>
        <button type="button" onClick={() => onPick(flight)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold ${secondaryBtn}`}>
          {copy.view}
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3">
          {flight.airlineLogo ? (
            <img src={flight.airlineLogo} alt={flight.airlineName || flight.airline} className="h-11 w-11 rounded-full border border-[#D9D5CE] bg-white object-contain p-1.5" />
          ) : (
            <div className={`flex h-11 w-11 items-center justify-center ${accentChip}`}>
              <Plane size={18} />
            </div>
          )}
          <div className="min-w-0">
            <div className={`text-[18px] font-black ${primaryText}`}>{flight.depart}</div>
            <div className={`text-sm ${secondaryText}`}>{flight.from}</div>
            <div className={`mt-1 text-xs font-medium ${mutedText}`}>{flight.departDate || "—"}</div>
            {departureTerminal ? (
              <div className={`mt-1 text-xs font-medium ${mutedText}`}>{copy.terminal} {departureTerminal}</div>
            ) : null}
            <div className={`text-sm ${mutedText}`}>{flight.airlineName || flight.airline}</div>
          </div>
        </div>

        <div className="min-w-0">
          <div className={`flex items-center justify-center gap-3 text-sm ${secondaryText}`}>
            <PlaneTakeoff size={15} />
            <span>{fmtDuration(flight.durationMin, language)}, {isDirect ? copy.direct : `${flight.stopsCount} ${copy.transfers}`}</span>
            <PlaneLanding size={15} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className={`text-sm font-bold ${primaryText}`}>{flight.from}</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-[#dfe5ee]">
              <div className="absolute left-0 top-0 h-1.5 rounded-full bg-[linear-gradient(90deg,#dfe5ee_0%,#b7c4d8_45%,#dfe5ee_100%)]" style={{ width: "100%" }} />
              <PlaneTakeoff className="absolute -top-3 left-0 text-[#8d98a9]" size={15} />
              <PlaneLanding className="absolute -top-3 right-0 text-[#8d98a9]" size={15} />
            </div>
            <span className={`text-sm font-bold ${primaryText}`}>{flight.to}</span>
          </div>
          <div className={`mt-3 text-sm ${secondaryText}`}>{formatRoute(flight.from, flight.to)}</div>
        </div>

        <div className="text-right">
          <div className={`text-[18px] font-black ${primaryText}`}>{flight.arrive}</div>
          <div className={`text-sm ${secondaryText}`}>{flight.to}</div>
          <div className={`mt-1 text-xs font-medium ${mutedText}`}>{flight.arriveDate || "—"}</div>
          {arrivalTerminal ? (
            <div className={`mt-1 text-xs font-medium ${mutedText}`}>{copy.terminal} {arrivalTerminal}</div>
          ) : null}
          <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold ${accentChip}`}>
            <Ticket size={13} />
            {flight.cabin || "—"}
          </div>
        </div>
      </div>

      {segments.length ? (
        <div className={`mt-5 rounded-[24px] p-4 ${unifiedSoftCard}`}>
          <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
            {copy.segments}
          </div>

          <div className="mt-3 space-y-3">
            {segments.map((segment, segmentIndex) => (
              <div key={segment.id || `${segment.origin}-${segment.destination}-${segmentIndex}`}>
                <div className={`grid gap-3 rounded-[20px] p-4 md:grid-cols-[220px_minmax(0,1fr)_200px] ${unifiedCard}`}>
                  <div>
                    <div className={`text-sm font-black ${primaryText}`}>
                      {(segment.carrier || segment.operatingCarrier || flight.airline) + (segment.flightNumber ? `-${segment.flightNumber}` : "")}
                    </div>
                    <div className={`mt-1 text-sm ${secondaryText}`}>
                      {formatRoute(segment.origin, segment.destination)}
                    </div>
                    <div className={`mt-2 text-xs ${mutedText}`}>
                      {segment.equipment || "—"} • {segment.bookingClass || "—"} / {segment.serviceClass || "—"}
                    </div>
                  </div>

                  <div>
                    <div className={`flex items-center gap-3 text-sm ${primaryText}`}>
                      <span className="font-black">{toTime(segment.departure)}</span>
                      <span className="text-[#315d8f]">→</span>
                      <span className="font-black">{toTime(segment.arrival)}</span>
                    </div>
                    <div className={`mt-1 text-xs ${mutedText}`}>
                      {toDateOnly(segment.departure)} → {toDateOnly(segment.arrival)}
                    </div>
                    <div className={`mt-2 flex flex-wrap gap-2 text-xs ${secondaryText}`}>
                      <span className={`px-2.5 py-1 ${accentChip}`}>
                        {segment.origin}
                      </span>
                      <span className={`px-2.5 py-1 ${accentChip}`}>
                        {segment.destination}
                      </span>
                      <span className={`px-2.5 py-1 ${accentChip}`}>
                        {segment.duration ? fmtDuration(segment.duration, language) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className={`text-xs ${mutedText}`}>
                      {copy.terminal}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${primaryText}`}>
                      {(segment.departureTerminal || "—") + " → " + (segment.arrivalTerminal || "—")}
                    </div>
                    <div className={`mt-2 text-xs ${mutedText}`}>
                      {segment.baggage || copy.noBaggage}
                    </div>
                    <div className={`mt-1 text-xs ${mutedText}`}>
                      {segment.carryOn || copy.noCarry}
                    </div>
                  </div>
                </div>

                {segmentIndex < segments.length - 1 ? (
                  <div className={`px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
                    {copy.layover}: {segment.layover ? fmtDuration(segment.layover, language) : "—"} • {segment.destination}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#D9D5CE] pt-4">
        <div className={`flex flex-wrap gap-2 text-sm ${secondaryText}`}>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${accentChip}`}><Clock3 size={14} /> {fmtDuration(flight.durationMin, language)}</span>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${accentChip}`}><Users size={14} /> {flight.refundable ? copy.refundableYes : copy.refundableNo}</span>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${accentChip}`}><ArrowRight size={14} /> {flight.flightNo ?? copy.availableFlight}</span>
          {firstSegment?.origin || lastSegment?.destination ? (
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${accentChip}`}>
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

function SearchLoadingAnimation({ language }: { language: "uz" | "ru" | "en" }) {
  const copy = {
    uz: {
      title: "Qidirilmoqda...",
      subtitle: "Reyslar va tariflar tekshirilmoqda",
    },
    ru: {
      title: "Поиск...",
      subtitle: "Проверяем рейсы и тарифы",
    },
    en: {
      title: "Searching...",
      subtitle: "Checking flights and fares",
    },
  }[language]

  return (
    <motion.div
      className={`overflow-hidden rounded-[28px] px-5 py-6 text-center ${unifiedCard}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mx-auto max-w-[520px]">
        <div className="mx-auto mb-3 h-9 w-9 rounded-[10px] bg-[#174A8B]" />
        <div className="text-[20px] font-black text-[#111111]">{copy.title}</div>
        <div className="mt-1 text-[14px] text-[#6D6760]">{copy.subtitle}</div>
        <FlightLoadingAnimation compact />
        <div className="mx-auto mt-1 h-2 max-w-[320px] overflow-hidden rounded-full bg-[#D9D5CE]">
          <motion.div
            className="h-full rounded-full bg-[#0A84FF]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: SEARCH_LOADING_DURATION_MS / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  )
}
