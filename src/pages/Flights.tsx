import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { ArrowRight, CalendarDays, ChevronDown, Clock3, Filter, Luggage, Plane, PlaneLanding, PlaneTakeoff, Ticket, Users, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import flightLoadingAnimation from "@/assets/animations/Animation - 1776516038455.json"
import FareCalendarPicker from "@/components/site/FareCalendarPicker"
import FlightDetailsModal, { type Flight } from "@/components/site/FlightDetailsModal"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number"
import { formatMoney } from "@/lib/money"
import { searchAir } from "@/shared/api/air/air.api"
import { AIRPORT_CACHE_KEY, DEFAULT_AIRPORT_DIRECTORY } from "@/shared/air/airportDirectory"
import { ensureAccessToken } from "@/shared/auth/session"
import { useI18n } from "@/shared/i18n/i18n"
import { getStoredTheme, type SiteTheme } from "@/shared/theme/theme"

const luxuryBtn =
  "border border-[#174A8B] bg-[#174A8B] text-white shadow-[0_14px_28px_rgba(23,74,139,0.22)] transition hover:bg-[#123F78]"
const secondaryBtn =
  "border border-[#D9D5CE] !bg-white bg-none text-[#5F5A54] shadow-none transition hover:border-[#174A8B]/35 hover:!bg-[#F6F6F6] hover:text-[#174A8B]"
const dropdownPanel =
  "flights-dropdown-panel absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-[18px] border border-[#D9D5CE] !bg-white bg-none shadow-[0_20px_42px_rgba(30,32,36,0.14)] xl:w-[360px] xl:max-w-[min(360px,calc(100vw-32px))]"
const unifiedCard =
  "border border-[#D9D5CE] !bg-white bg-none shadow-none"
const unifiedSoftCard =
  "border border-[#D9D5CE] !bg-[#F3F1ED] bg-none shadow-none"
const primaryText = "text-[#111A34]"
const secondaryText = "text-[#5F5A54]"
const mutedText = "text-[#77716A]"
const accentChip =
  "rounded-full border border-[#D9D5CE] !bg-[#EBEBEB] text-[#174A8B]"
const tripzyBlueGradient = "bg-[linear-gradient(135deg,#021373_0%,#020F59_48%,#8491D9_100%)]"
const tripzyBlueFocus = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E7BFF]/25 focus-visible:ring-offset-2"
const flightsCache = new Map<string, { items: Flight[]; info: string | null }>()
const LAST_SUCCESSFUL_SEARCH_KEY = "last_successful_air_search_v1"
const LAST_AIR_RESULT_META_KEY = "last_air_result_meta_v1"
const SEARCH_LOADING_DURATION_MS = 10000

const luxurySpring = { type: "spring", stiffness: 260, damping: 28, mass: 0.8 } as const
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
} as const
const subtleLift = {
  y: -4,
  scale: 1.006,
  transition: luxurySpring,
} as const

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

const pickApiAsset = (...values: unknown[]) => {
  const found = values.find((value) => typeof value === "string" && value.trim().length > 0)
  return typeof found === "string" ? toApiAsset(found) : undefined
}

const formatCompactPrice = (amount: number, currency?: string) => {
  const safeCurrency = (currency || "").toUpperCase()
  if (safeCurrency === "UZS") {
    return `${Math.round(amount).toLocaleString("ru-RU").replace(/\u00A0/g, " ")} UZS`
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

const formatLocationInputValue = (value: string, options: LocationOption[]) => {
  const raw = value.trim()
  if (!raw) return ""

  const resolvedCode = resolveLocationCode(raw, options)
  const option = options.find((item) => item.code === resolvedCode)

  return option ? `${option.code} - ${option.name}` : raw
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
            logo: pickApiAsset(
              carrier.logo,
              (carrier as any).airlineLogo,
              (carrier as any).carrierLogo,
              (carrier as any).image,
              (carrier as any).icon,
              (carrier as any).picture
            ),
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
        const airlineLogo = pickApiAsset(
          carrierMeta?.logo,
          (opt as any).logo,
          (opt as any).airlineLogo,
          (opt as any).carrierLogo,
          (opt as any).image,
          (opt as any).icon,
          (opt as any).picture,
          seg?.logo,
          seg?.airlineLogo,
          seg?.carrierLogo,
          seg?.operatingCarrierLogo,
          seg?.image,
          seg?.icon,
          seg?.picture
        )
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
          airlineLogo,
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

    const nextPax = !Number.isNaN(qPax) && qPax >= 1 ? qPax : 1

    setSearchTrips(parsedTrips)
    setFrom(formatLocationInputValue(qFrom, locationOptions))
    setTo(formatLocationInputValue(qTo, locationOptions))
    setDate(qDate)
    setPax(nextPax)
    setTravelClass(qClass)
    hydratedRef.current = true
  }, [locationOptions, sp])


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
    const token = await ensureAccessToken()
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
    setSelectedFlight(null)
    setPreviewFlight(null)
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

  return (
    <section
      className="flights-page relative overflow-hidden bg-[#ECEAE5] pt-0 text-[#111A34]"
      data-flight-theme={siteTheme}
    >
      <div className="relative mx-auto max-w-[1560px] px-2.5 py-5 sm:px-6 sm:py-12 xl:px-8 2xl:max-w-[1720px]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 overflow-visible rounded-[20px] border border-[#E7E2DA] bg-[#F7F6F2] p-3 shadow-[0_18px_46px_rgba(77,70,61,0.08)] sm:rounded-[26px] sm:p-4 md:p-5"
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-visible rounded-[18px] bg-transparent p-0 transition-shadow duration-300"
          >
            <div className="grid gap-2.5 xl:grid-cols-[1.45fr_1.45fr_0.82fr_0.82fr_1.12fr_0.82fr]">
              <AutocompleteField label={copy.from} value={from} placeholder={copy.fromPlaceholder} options={locationOptions} onChange={setFrom} selectLabel={copy.selectOption} tone="blue" icon={<PlaneTakeoff size={20} className="shrink-0 text-[#1E7BFF]" />} />
              <AutocompleteField label={copy.to} value={to} placeholder={copy.toPlaceholder} options={locationOptions} onChange={setTo} selectLabel={copy.selectOption} tone="green" icon={<PlaneLanding size={20} className="shrink-0 text-[#1E7BFF]" />} />
              <motion.div ref={calendarAnchorRef} whileHover={subtleLift} className="flights-search-date relative flex min-h-[64px] items-center gap-2.5 rounded-[13px] border border-[#EBE7DF] bg-white px-3.5 py-2 shadow-[0_8px_20px_rgba(77,70,61,0.035)] transition-shadow duration-300 hover:shadow-[0_12px_26px_rgba(77,70,61,0.08)]">
                <CalendarDays size={20} className="shrink-0 text-[#1E7BFF]" />
                <div className="min-w-0 flex-1">
                <div className="mb-1 text-[9.5px] font-black uppercase tracking-[0.22em] text-[#8A8177]">{copy.date}</div>
                <button
                  type="button"
                  onClick={() => setCalendarOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-2 text-left text-[14px] font-bold text-[#111A34]"
                >
                  <span className="truncate">{date || copy.openCalendar}</span>
                  <ChevronDown size={16} className="shrink-0 text-[#7B7268]" />
                </button>
                </div>
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
              </motion.div>
              <motion.div
                whileHover={subtleLift}
                aria-label={paxLabel(language, pax)}
                className="flights-search-passenger flex min-h-[64px] items-center gap-2.5 rounded-[13px] border border-[#EBE7DF] bg-white px-3.5 py-2 shadow-[0_8px_20px_rgba(77,70,61,0.035)] transition-shadow duration-300 hover:shadow-[0_12px_26px_rgba(77,70,61,0.08)]"
              >
                <Users size={20} className="shrink-0 text-[#1E7BFF]" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-[9.5px] font-black uppercase tracking-[0.22em] text-[#8A8177]">
                    {copy.passenger}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[14px] font-bold text-[#111A34]">
                    <span className="truncate">{paxLabel(language, pax)}</span>
                    <ChevronDown size={16} className="shrink-0 text-[#7B7268]" />
                  </div>
                </div>
              </motion.div>
              <motion.div whileHover={subtleLift} className="flights-search-class flex min-h-[64px] flex-col justify-center rounded-[13px] border border-[#EBE7DF] bg-white px-3.5 py-2 shadow-[0_8px_20px_rgba(77,70,61,0.035)] transition-shadow duration-300 hover:shadow-[0_12px_26px_rgba(77,70,61,0.08)]">
                <div className="mb-1.5 text-[9.5px] font-black uppercase tracking-[0.22em] text-[#8A8177]">{copy.classLabel}</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["Y", "B", "F"] as TravelClassCode[]).map((item) => (
                    <motion.button
                      key={item}
                      type="button"
                      onClick={() => setTravelClass(item)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className={[
                        "flights-search-cabin-option h-9 whitespace-nowrap rounded-[8px] border px-2 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5",
                        travelClass === item
                          ? `flights-search-cabin-option-active border-[#1A6DEB] ${tripzyBlueGradient} text-white shadow-[0_10px_20px_rgba(23,105,232,0.22)]`
                          : "border-[#E3DDD4] bg-white text-[#4E5563] hover:border-[#CFC6BB] hover:bg-[#FBFAF8] hover:text-[#174A8B]",
                        tripzyBlueFocus,
                      ].join(" ")}
                    >
                      {copy.classNames[item]}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
              <motion.button whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.985 }} onClick={onSearch} disabled={loading} className={`flex min-h-[64px] items-center justify-center gap-3 rounded-[13px] border border-[#1769E8] ${tripzyBlueGradient} px-4 text-[14px] font-black uppercase tracking-[0.22em] text-white shadow-[0_14px_28px_rgba(23,105,232,0.24)] transition hover:shadow-[0_18px_34px_rgba(23,105,232,0.34)] disabled:opacity-60 ${tripzyBlueFocus}`}>
                <span>{loading ? copy.searching : copy.search}</span>
                <ArrowRight size={18} />
              </motion.button>
            </div>

          </motion.div>
        </motion.div>

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

        {!selectedFlight ? (
        <div className="mt-8 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[22px] border border-[#E7E2DA] bg-[#F7F6F2] p-3 shadow-[0_14px_34px_rgba(77,70,61,0.06)]"
          >
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
          </motion.aside>

          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {loading ? <SearchLoadingAnimation language={language} /> : null}
            {!loading && filtered.length > 0 ? (
              <div className="space-y-3">
                <motion.div whileHover={{ y: -2 }} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#E7E2DA] bg-[#F7F6F2] px-4 py-3 text-sm shadow-[0_10px_24px_rgba(77,70,61,0.05)] transition-shadow duration-300 hover:shadow-[0_16px_34px_rgba(77,70,61,0.09)]">
                  <div className="flex items-center gap-1.5 font-semibold text-[#111A34]">
                    <SlidingNumber number={filtered.length} initiallyStable className="tabular-nums" />
                    <span>{copy.offers}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["best", "cheap", "fast"] as const).map((item) => (
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        key={item}
                        onClick={() => setSort(item)}
                        className={[
                          "h-8 rounded-[8px] border px-3 text-[12px] font-semibold transition hover:border-[#1A6DEB]/45 hover:bg-[#F4F8FF] hover:text-[#174A8B]",
                          sort === item ? `border-[#1A6DEB] ${tripzyBlueGradient} text-white shadow-[0_8px_18px_rgba(23,105,232,0.18)]` : "border-[#D9D5CE] bg-white text-[#59636E]",
                          tripzyBlueFocus,
                        ].join(" ")}
                      >
                        {item === "best" ? copy.best : item === "cheap" ? copy.cheap : copy.fast}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
                {filtered.map((flight, index) => (
                  <CityTravelResultCard
                    key={flight.id}
                    flight={flight}
                    index={index}
                    pax={pax}
                    onPick={openPreview}
                    copy={copy}
                    language={language}
                    airportLabels={airportLabels}
                  />
                ))}
              </div>
            ) : null}
            {!loading && filtered.length === 0 ? <div className={`rounded-[28px] px-6 py-12 text-center ${unifiedSoftCard} ${secondaryText}`}>{copy.noFlights}</div> : null}
          </motion.div>
        </div>
        ) : null}
      </div>

      <FlightPreviewModal
        flight={previewFlight}
        language={language}
        pax={pax}
        airportLabels={airportLabels}
        onClose={() => setPreviewFlight(null)}
        onBuy={(flight) => onPick(flight)}
      />

    </section>
  )
}

function AutocompleteField({
  label,
  value,
  placeholder,
  options,
  onChange,
  selectLabel,
  tone = "blue",
  icon,
}: {
  label: string
  value: string
  placeholder: string
  options: LocationOption[]
  onChange: (value: string) => void
  selectLabel: string
  tone?: "blue" | "green"
  icon?: ReactNode
}) {
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
  const toneClass =
    tone === "green"
      ? "hover:shadow-[0_12px_28px_rgba(77,70,61,0.10)]"
      : "hover:shadow-[0_12px_28px_rgba(77,70,61,0.10)]"

  return (
    <motion.label
      whileHover={subtleLift}
      className={`relative flex min-h-[64px] items-center gap-2.5 rounded-[13px] border border-[#EBE7DF] bg-white px-3.5 py-2 shadow-[0_8px_20px_rgba(77,70,61,0.035)] transition focus-within:border-[#CFC6BB] focus-within:shadow-[0_0_0_4px_rgba(141,127,111,0.12)] ${toneClass}`}
    >
      {icon ?? <Plane size={20} className="shrink-0 text-[#1E7BFF]" />}
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[9.5px] font-black uppercase tracking-[0.22em] text-[#8A8177]">{label}</div>
        <div className="flex items-center gap-2">
          <input
            className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#111A34] outline-none placeholder:text-[#8A94A8]"
            placeholder={placeholder}
            value={value}
            onFocus={() => setOpen(true)}
            onBlur={() =>
              window.setTimeout(() => {
                setOpen(false)
                onChange(formatLocationInputValue(value, options))
              }, 120)
            }
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
          <ChevronDown size={16} className="shrink-0 text-[#7B7268]" />
        </div>
      </div>
      {open && filteredOptions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className={dropdownPanel}
        >
          {filteredOptions.map((option) => (
            <motion.button
              key={option.code}
              type="button"
              onMouseEnter={() => setActiveIndex(filteredOptions.findIndex((item) => item.code === option.code))}
              onMouseDown={(e) => {
                e.preventDefault()
                pickOption(option)
              }}
              onClick={() => pickOption(option)}
              className={[
                "flex w-full min-w-0 items-center justify-between gap-3 border-b border-[#D9D5CE] px-4 py-3 text-left transition last:border-b-0",
                filteredOptions[activeIndex]?.code === option.code ? "bg-[#F3F1ED]" : "hover:bg-[#F6F6F6]",
              ].join(" ")}
              whileHover={{ x: 3 }}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#111A34]">{option.name}</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-[#6f84a0]">{option.code}</span>
              </span>
              <span className="shrink-0 rounded-full border border-[#cfe1f4] bg-[linear-gradient(180deg,#ffffff_0%,#eef5fc_100%)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#466b95]">
                {selectLabel}
              </span>
            </motion.button>
          ))}
        </motion.div>
      ) : null}
    </motion.label>
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
    <motion.div whileHover={{ y: -3, transition: luxurySpring }} className="rounded-[18px] border border-[#D9D5CE] bg-white p-3 shadow-[0_8px_20px_rgba(30,32,36,0.04)] transition-shadow duration-300 hover:shadow-[0_16px_34px_rgba(30,32,36,0.08)]">
      <div className="mb-3 flex items-center justify-between border-b border-[#ECE8E1] pb-2 text-[13px] font-bold text-[#111A34]">
        <span>{title}</span>
        <ChevronDown size={14} className="text-[#174A8B]" />
      </div>
      <div className="space-y-2.5">{children}</div>
    </motion.div>
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
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onChange()
    }
  }

  return (
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-pressed={checked}
      onClick={onChange}
      onKeyDown={handleKeyDown}
      whileHover={disabled ? undefined : { x: 2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={[
        "flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[12px] transition",
        checked ? "border-[#0A84FF]/35 bg-[#E7F2FF] text-[#075DB8]" : "border-[#ECE8E1] bg-[#FBFAF8] text-[#26313C] hover:border-[#C9D8E8] hover:bg-white",
        disabled ? "cursor-not-allowed opacity-45" : "",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Checkbox
          checked={checked}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={() => onChange()}
          size="sm"
          className={[
            "border",
            checked
              ? "border-[#0A84FF] bg-[#0A84FF] text-white"
              : "border-[#B7B2AA] bg-white text-[#0A84FF]",
          ].join(" ")}
        />
        {icon ? <img src={icon} alt="" className="h-4 w-4 shrink-0 object-contain" /> : null}
        <span className="truncate">{label}</span>
      </span>
      {side ? <span className={["shrink-0 text-[11px]", checked ? "text-[#075DB8]" : "text-[#59636E]"].join(" ")}>{side}</span> : null}
    </motion.div>
  )
}

function MiniToggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <motion.button
      type="button"
      onClick={onChange}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "flex w-full items-center justify-between gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[12px] transition",
        checked ? "border-[#0A84FF]/35 bg-[#E7F2FF] text-[#075DB8]" : "border-[#ECE8E1] bg-[#FBFAF8] text-[#26313C] hover:border-[#C9D8E8] hover:bg-white",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className={["relative h-5 w-9 rounded-full transition", checked ? "bg-[#0A84FF]" : "bg-[#D1CDC6]"].join(" ")}>
        <span className={["absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition", checked ? "left-[18px]" : "left-0.5"].join(" ")} />
      </span>
    </motion.button>
  )
}

function AirlineLogoMark({
  src,
  alt,
  size = "sm",
  className = "",
}: {
  src?: string
  alt: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const sizeClass = {
    xs: "h-6 w-6 rounded-[9px]",
    sm: "h-8 w-8 rounded-[11px]",
    md: "h-10 w-10 rounded-[13px]",
    lg: "h-12 w-12 rounded-[15px]",
  }[size]
  const iconSize = size === "xs" ? 14 : size === "sm" ? 16 : size === "md" ? 18 : 20

  return (
    <span className={`grid shrink-0 place-items-center border border-[#E3DDD4] bg-white shadow-[0_8px_18px_rgba(77,70,61,0.08)] ${sizeClass} ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          className="h-[78%] w-[78%] object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <Plane size={iconSize} className="text-[#0A84FF]" />
      )}
    </span>
  )
}

function CityTravelResultCard({
  flight,
  index,
  pax,
  onPick,
  copy,
  language,
  airportLabels,
}: {
  flight: Flight
  index: number
  pax: number
  onPick: (flight: Flight) => void
  copy: FlightsCopy
  language: "uz" | "ru" | "en"
  airportLabels: Record<string, string>
}) {
  const segments =
    flight.segments && flight.segments.length
      ? flight.segments
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
  const routeSummary = buildSegmentRouteSummary(flight, airportLabels, language)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.28), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: luxurySpring }}
      className={[
        "grid gap-3 rounded-[18px] border bg-white px-4 py-3 shadow-[0_10px_24px_rgba(30,32,36,0.06)] transition-shadow duration-300 hover:shadow-[0_18px_42px_rgba(30,32,36,0.12)] lg:grid-cols-[minmax(0,1fr)_150px]",
        selected ? "border-[#35B871]" : "border-transparent",
      ].join(" ")}
    >
      <div className="min-w-0 divide-y divide-[#E6E2DC]">
        {segments.map((segment, segmentIndex) => {
          const dep = toTime(segment.departure)
          const arr = toTime(segment.arrival)
          const segDuration = Number(segment.duration || 0) || Math.round(flight.durationMin / Math.max(segments.length, 1))
          const segStops = segmentIndex === 0 ? flight.stopsCount ?? 0 : 0
          const originName = formatAirportNameOnly(segment.origin, airportLabels)
          const destinationName = formatAirportNameOnly(segment.destination, airportLabels)
          return (
              <div key={segment.id || `${segment.origin}-${segment.destination}-${segmentIndex}`} className="grid gap-2 py-2 first:pt-0 last:pb-0 md:grid-cols-[118px_82px_minmax(0,1fr)_82px] md:items-center">
                <div className="flex min-w-0 items-center gap-2">
                <AirlineLogoMark src={flight.airlineLogo} alt={flight.airlineName || flight.airline} size="xs" />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-[#26313C]">{flight.airlineName || flight.airline}</div>
                  <div className="text-[10px] leading-4 text-[#59636E]">{segment.carrier || flight.airline}</div>
                  <div className="text-[10px] leading-4 text-[#59636E]">{segment.flightNumber || flight.flightNo || "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-[15px] font-bold leading-5 text-[#111A34]">{dep}</div>
                <div className="text-[11px] leading-4 text-[#59636E]">{toDateOnly(segment.departure)}</div>
                <div className="text-[11px] font-semibold leading-4 text-[#26313C]">{segment.origin}</div>
                {originName ? <div className="text-[10px] leading-4 text-[#59636E]">{originName}</div> : null}
              </div>

              <div className="min-w-0 px-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex min-w-[54px] flex-col items-center rounded-[8px] bg-[#EEEAE4] px-2 py-1 text-center">
                    <span className="text-[10px] font-bold leading-3 text-[#59636E]">{segment.origin}</span>
                    {originName ? <span className="mt-0.5 max-w-[92px] truncate text-[9px] font-medium leading-3 text-[#7A746D]">{originName}</span> : null}
                  </span>
                  <span className="h-px min-w-[32px] flex-1 bg-[#C9C4BD]" />
                  <span className="inline-flex min-w-[54px] flex-col items-center rounded-[8px] bg-[#EEEAE4] px-2 py-1 text-center">
                    <span className="text-[10px] font-bold leading-3 text-[#59636E]">{segment.destination}</span>
                    {destinationName ? <span className="mt-0.5 max-w-[92px] truncate text-[9px] font-medium leading-3 text-[#7A746D]">{destinationName}</span> : null}
                  </span>
                </div>
                <div className="mt-1 text-center text-[11px] font-semibold text-[#26313C]">{fmtDuration(segDuration, language)}</div>
                <div className="mt-0.5 text-center text-[10px] leading-4 text-[#59636E]">
                  {formatSegmentRouteLabel(segment.origin, segment.destination, airportLabels)}
                </div>
                <div className={["mx-auto mt-1 inline-flex w-full justify-center text-center text-[11px] font-bold", isDirect ? "text-[#078A50]" : "text-[#A33B22]"].join(" ")}>
                  {segStops === 0 ? copy.direct : `${segStops} ${copy.transfers}`}
                </div>
                {segment.layover ? (
                  <div className="mx-auto mt-1 inline-flex rounded-full border border-[#F0C2AE] bg-[#FFF2EA] px-2.5 py-1 text-center text-[11px] font-bold text-[#A33B22]">
                    {copy.layover}: {fmtDuration(segment.layover, language)}
                  </div>
                ) : null}
              </div>

              <div className="text-left md:text-right">
                <div className="text-[15px] font-bold leading-5 text-[#111A34]">{arr}</div>
                <div className="text-[11px] leading-4 text-[#59636E]">{toDateOnly(segment.arrival)}</div>
                <div className="text-[11px] font-semibold leading-4 text-[#26313C]">{segment.destination}</div>
                {destinationName ? <div className="text-[10px] leading-4 text-[#59636E]">{destinationName}</div> : null}
              </div>
            </div>
          )
        })}
        <div className="py-3 text-[12px] leading-5 text-[#59636E]">
          <div>
            <span className="font-semibold text-[#26313C]">{routeSummary.routeLabel}: </span>
            {routeSummary.route}
          </div>
          <div className={["mt-2 inline-flex items-center rounded-full border px-3 py-1.5 text-[13px] font-bold shadow-sm", routeSummary.transfers.length ? "border-[#F0C2AE] bg-[#FFF2EA] text-[#A33B22]" : "border-[#B9E9D2] bg-[#F0FCF7] text-[#078A50]"].join(" ")}>
            <span>{routeSummary.transferLabel}: </span>
            <span className="ml-1">{routeSummary.transfers.length ? routeSummary.transfers.join(" · ") : routeSummary.directLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#5f72c7]/35 bg-[linear-gradient(135deg,#021373_0%,#020F59_48%,#8491D9_100%)] p-3 shadow-[0_16px_34px_rgba(2,19,115,0.18)] lg:flex-col lg:items-end lg:justify-center lg:p-4">
        <div className="text-left lg:text-right">
          <div className="whitespace-nowrap text-[13px] font-black leading-5 text-white sm:text-[14px]">{formatCompactPrice(flight.price, flight.currency)}</div>
          <div className="mt-1 text-[11px] leading-4 text-white/80">{tripTypeLabel(flight, language)}</div>
          <div className="text-[11px] leading-4 text-white/80">{paxLabel(language, pax)}</div>
        </div>
        <motion.button
          type="button"
          onClick={() => onPick(flight)}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`h-10 min-w-[116px] rounded-[9px] bg-white/95 px-5 text-[13px] font-semibold text-[#174A8B] shadow-[0_10px_22px_rgba(1,6,38,0.18)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_26px_rgba(1,6,38,0.24)] ${tripzyBlueFocus}`}
        >
          {copy.select}
        </motion.button>
      </div>
    </motion.div>
  )
}

const paxLabel = (language: "uz" | "ru" | "en", pax: number) =>
  language === "ru" ? `${pax} пассажир` : language === "en" ? `${pax} passenger` : `${pax} yo'lovchi`

const formatAirportPoint = (code?: string, airportLabels?: Record<string, string>) => {
  const safeCode = (code || "").trim().toUpperCase()
  if (!safeCode) return "—"

  const label = airportLabels?.[safeCode]?.trim()
  if (!label || label.toUpperCase() === safeCode) return safeCode

  return `${label} (${safeCode})`
}

const formatAirportNameOnly = (code?: string, airportLabels?: Record<string, string>) => {
  const safeCode = (code || "").trim().toUpperCase()
  if (!safeCode) return ""

  const label = airportLabels?.[safeCode]?.trim()
  return label && label.toUpperCase() !== safeCode ? label : ""
}

const formatSegmentRouteLabel = (
  origin?: string,
  destination?: string,
  airportLabels?: Record<string, string>
) => `${formatAirportPoint(origin, airportLabels)} → ${formatAirportPoint(destination, airportLabels)}`

const routeSummaryCopy = (language: "uz" | "ru" | "en") => {
  if (language === "ru") {
    return {
      routeLabel: "Маршрут",
      transferLabel: "Пересадка",
      directLabel: "Без пересадки",
    }
  }
  if (language === "en") {
    return {
      routeLabel: "Route",
      transferLabel: "Transfer",
      directLabel: "Direct flight",
    }
  }
  return {
    routeLabel: "Yo'nalish",
    transferLabel: "Peresadka",
    directLabel: "To'g'ridan-to'g'ri reys",
  }
}

const buildSegmentRouteSummary = (
  flight: Flight,
  airportLabels: Record<string, string>,
  language: "uz" | "ru" | "en"
) => {
  const segments = flight.segments?.length
    ? flight.segments
    : [{ origin: flight.from, destination: flight.to }]
  const points = segments.reduce<string[]>((acc, segment) => {
    const origin = (segment.origin || "").trim().toUpperCase()
    const destination = (segment.destination || "").trim().toUpperCase()

    if (origin && acc[acc.length - 1] !== origin) acc.push(origin)
    if (destination && acc[acc.length - 1] !== destination) acc.push(destination)

    return acc
  }, [])
  const transfers = points.slice(1, -1).map((point) => formatAirportPoint(point, airportLabels))
  const copy = routeSummaryCopy(language)

  return {
    ...copy,
    route: points.map((point) => formatAirportPoint(point, airportLabels)).join(" → ") || "—",
    transfers,
  }
}

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
  airportLabels,
  onClose,
  onBuy,
}: {
  flight: Flight | null
  language: "uz" | "ru" | "en"
  pax: number
  airportLabels: Record<string, string>
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

  if (!flight || typeof document === "undefined") return null

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

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 px-3 pb-3 pt-[14vh] sm:px-5 sm:pb-5 sm:pt-[12vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative flex max-h-[74svh] w-full max-w-[680px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:max-h-[76vh] sm:rounded-[24px]"
        >
          <div className="flex items-start justify-between gap-3 px-3.5 pb-1.5 pt-3 sm:gap-4 sm:px-7 sm:pb-2 sm:pt-6">
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

          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-2 sm:px-7 sm:pb-4">
            <div className="mb-2 sm:mb-5">
              <div className="text-[19px] font-black leading-5 text-[#111111] sm:text-[26px] sm:leading-8">
                {flight.from} → {flight.to}
              </div>
              <div className="mt-1 text-[11px] leading-4 text-[#6D6760] sm:text-[13px] sm:leading-5">
                {formatSegmentRouteLabel(flight.from, flight.to, airportLabels)}
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
                const originName = formatAirportNameOnly(segment.origin, airportLabels)
                const destinationName = formatAirportNameOnly(segment.destination, airportLabels)
                return (
                  <div key={segment.id || `${segment.origin}-${segment.destination}-${index}`}>
                    <div className="mb-1.5 flex items-center gap-2 sm:mb-3 sm:gap-3">
                      <AirlineLogoMark src={flight.airlineLogo} alt={flight.airlineName || flight.airline} size="md" />
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
                            {originName ? <div className="text-[11px] leading-4 text-[#6D6760] sm:text-[13px]">{originName}</div> : null}
                            {segment.departureTerminal ? <div className="text-[10px] leading-4 text-[#8A837C] sm:text-[12px]">{segment.departureTerminal}</div> : null}
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
                            {destinationName ? <div className="text-[11px] leading-4 text-[#6D6760] sm:text-[13px]">{destinationName}</div> : null}
                            {segment.arrivalTerminal ? <div className="text-[10px] leading-4 text-[#8A837C] sm:text-[12px]">{segment.arrivalTerminal}</div> : null}
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
                        <span>{copy.baggage}: {segment.baggage || flight.baggage || copy.paidBaggage}</span>
                      </div>
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
              className={`h-10 rounded-[12px] border border-[#5f72c7]/35 ${tripzyBlueGradient} px-5 text-[14px] font-bold text-white shadow-[0_12px_26px_rgba(2,19,115,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(2,19,115,0.26)] disabled:cursor-wait disabled:opacity-80 sm:h-12 sm:px-6 sm:text-[16px] ${tripzyBlueFocus}`}
            >
              {isBuying ? `${copy.checking}...` : copy.buy}
            </button>
          </div>

          <AnimatePresence>
            {isBuying ? (
              <motion.div
                className="absolute inset-0 z-20 grid place-items-center bg-black/45 p-5 lg:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="flex h-full max-h-[520px] w-full max-w-[650px] flex-col overflow-hidden rounded-[28px] bg-[#F8F7F4] text-center shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:max-h-[540px] lg:h-auto lg:max-h-[500px] lg:max-w-[560px]"
                >
                  <div className="px-6 pt-8 lg:pt-6">
                    <div className="mx-auto mb-4 inline-flex h-14 items-center gap-3 rounded-full border border-[#D7E5F8] bg-white px-4 pr-6 shadow-[0_12px_28px_rgba(23,74,139,0.08)] lg:mb-3 lg:h-12 lg:px-3.5 lg:pr-5">
                      <motion.span
                        className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,#174A8B_0%,#0A84FF_100%)] text-white shadow-[0_8px_18px_rgba(23,74,139,0.18)]"
                        animate={{ y: [0, -3, 0], rotate: [0, 8, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Plane size={16} />
                      </motion.span>
                      <span className="text-[12px] font-bold uppercase tracking-[0.34em] text-[#174A8B] lg:text-[11px]">
                        {language === "ru" ? "Онлайн поиск" : language === "en" ? "Live search" : "Jonli qidiruv"}
                      </span>
                    </div>
                    <div className="text-[22px] font-black text-[#111111] lg:text-[20px]">{copy.checking}</div>
                    <div className="mt-2 text-[14px] text-[#6D6760] lg:text-[13px]">{copy.checkingSub}</div>
                  </div>
                  <FlightLoadingAnimation />
                  <div className="mt-auto px-6 pb-7 lg:pb-6">
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
    </AnimatePresence>,
    document.body
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
    <div className={compact ? "relative mx-auto flex h-[286px] w-full items-center justify-center overflow-visible px-2 py-1 sm:h-[320px]" : "relative mx-auto flex h-[310px] w-full flex-1 items-center justify-center overflow-visible px-4 py-2 sm:h-[330px] lg:h-[270px] lg:px-3"}>
      <Lottie
        lottieRef={lottieRef}
        animationData={flightLoadingAnimation}
        loop={false}
        autoplay
        className={compact ? "aspect-square h-[280px] max-h-full w-[280px] max-w-full sm:h-[318px] sm:w-[318px]" : "aspect-square h-[300px] max-h-full w-[300px] max-w-full sm:h-[320px] sm:w-[320px] lg:h-[260px] lg:w-[260px]"}
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
          <AirlineLogoMark src={group.airlineLogo} alt={group.airline} size="sm" />
          <span className="min-w-0">
            <span className={`block truncate text-[17px] font-semibold ${primaryText}`}>
              {group.airline} ({group.airlineCode})
            </span>
            <span className={`block text-sm ${secondaryText}`}>
              <span className="inline-flex items-center gap-1">
                <SlidingNumber number={group.items.length} initiallyStable className="tabular-nums" />
                <span>{copy.offers}</span>
              </span>{" "}
              {copy.fromPriceLabel} {formatMoney(group.minPrice, group.items[0]?.currency)}
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
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, scale: 1.002, transition: luxurySpring }}
      className={`group overflow-hidden rounded-[34px] p-5 transition-shadow duration-300 hover:shadow-[0_24px_58px_rgba(30,32,36,0.12)] ${unifiedCard}`}
    >
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
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => onPick(flight)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold ${secondaryBtn}`}>
          {copy.view}
        </motion.button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3">
          <AirlineLogoMark src={flight.airlineLogo} alt={flight.airlineName || flight.airline} size="lg" />
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
                <motion.div whileHover={{ y: -2 }} className={`grid gap-3 rounded-[20px] p-4 transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(30,32,36,0.08)] md:grid-cols-[220px_minmax(0,1fr)_200px] ${unifiedCard}`}>
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
                </motion.div>

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
        <motion.button whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.985 }} type="button" className={`h-12 rounded-2xl px-6 font-semibold transition ${luxuryBtn}`} onClick={() => onPick(flight)}>
          {copy.select}
        </motion.button>
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
      badge: "Jonli qidiruv",
    },
    ru: {
      title: "Поиск...",
      subtitle: "Проверяем рейсы и тарифы",
      badge: "Онлайн поиск",
    },
    en: {
      title: "Searching...",
      subtitle: "Checking flights and fares",
      badge: "Live search",
    },
  }[language]

  return (
    <motion.div
      className={`relative overflow-hidden rounded-[28px] px-5 py-6 text-center ${unifiedCard}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-48px] top-[-56px] h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(10,132,255,0.14)_0%,rgba(10,132,255,0)_72%)]" />
        <div className="absolute bottom-[-72px] right-[-24px] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(23,74,139,0.10)_0%,rgba(23,74,139,0)_72%)]" />
      </div>
      <div className="mx-auto max-w-[520px]">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#cfe0f5] bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#174A8B] shadow-[0_10px_24px_rgba(23,74,139,0.08)]">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#174A8B_0%,#0A84FF_100%)] text-white shadow-[0_8px_18px_rgba(23,74,139,0.18)]">
            <Plane size={14} />
          </span>
          <span>{copy.badge}</span>
        </div>
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
