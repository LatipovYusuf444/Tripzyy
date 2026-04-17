import { motion } from "framer-motion"
import {
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CreditCard,
  MapPinned,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCcw,
  Search,
  Send,
  Ticket,
  UsersRound,
  X,
} from "lucide-react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import FareCalendarPicker from "@/components/site/FareCalendarPicker"
import heroBackgroundImage from "@/assets/images/cheerful-woman-looking-out-window-airplane.jpg"
import { searchAir } from "@/shared/api/air/air.api"
import { AIRPORT_CACHE_KEY, DEFAULT_AIRPORT_DIRECTORY } from "@/shared/air/airportDirectory"
import { useI18n } from "@/shared/i18n/i18n"
import { getStoredTheme, type SiteTheme } from "@/shared/theme/theme"

type LocationOption = { code: string; name: string; searchText: string }
type TripMode = "round" | "oneway" | "multi"
type MultiTrip = { from: string; to: string; date: string }
type HeroModeOption = { key: TripMode; label: string }
type SearchUiCopyShape = {
  tripModes: Record<TripMode, string>
  from: string
  to: string
  depart: string
  return: string
  passengers: string
  search: string
  airportNotFound: string
}
const DEFAULT_HOME_SEARCH = {
  from: "",
  to: "",
  pax: 1,
}
const LIVE_DIRECTORY_BOOTSTRAPS = [
  { from: "LON", to: "FRA" },
  { from: "TAS", to: "DXB" },
  { from: "DXB", to: "TAS" },
  { from: "IST", to: "TAS" },
  { from: "TAS", to: "IST" },
  { from: "AUH", to: "TAS" },
] as const

const heroMobileBackgroundImage = "/images/mobile-img.webp"


const getDefaultHomeDate = () => {
  const base = new Date()
  base.setDate(base.getDate() + 14)
  const yyyy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, "0")
  const dd = String(base.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
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

const formatDisplayDate = (value: string) => {
  if (!value) return ""

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
}

function HeroSection({
  heroBackgroundImage,
  heroMobileBackgroundImage,
  children,
}: {
  heroBackgroundImage: string
  heroMobileBackgroundImage: string
  children: ReactNode
}) {
  return (
    <section className="relative overflow-visible">
      <div className="relative min-h-[calc(100svh-88px)] overflow-visible pt-20 sm:min-h-[calc(100svh-92px)] sm:pt-24 lg:min-h-[860px]">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <img
            src={heroMobileBackgroundImage}
            alt="Tripzy travel background"
            className="h-full w-full object-cover object-center sm:hidden"
          />
          <img
            src={heroBackgroundImage}
            alt="Tripzy travel background"
            className="hidden h-full w-full object-cover object-[center_44%] sm:block xl:object-center"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_24%,rgba(7,18,35,0)_48%)]" />
          <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(5,13,26,0.86)_0%,rgba(6,17,31,0.68)_28%,rgba(8,22,42,0.26)_56%,rgba(8,22,42,0)_82%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.12)_0%,rgba(7,18,35,0.10)_42%,rgba(7,18,35,0.34)_100%)]" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-[1540px] flex-col items-center px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </section>
  )
}

function TripModeTabs({
  tripModes,
  tripMode,
  searchUiCopy,
  setTripMode,
  className,
}: {
  tripModes: HeroModeOption[]
  tripMode: TripMode
  searchUiCopy: SearchUiCopyShape
  setTripMode: (mode: TripMode) => void
  className?: string
}) {
  return (
    <div className={["luxury-search-tabs pointer-events-auto relative z-10 mt-6 flex w-full max-w-[490px] items-center justify-between gap-1 rounded-[999px] p-1.5 sm:p-2", className ?? ""].join(" ")}>
      {tripModes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => setTripMode(mode.key)}
          className={[
            "luxury-search-tab flex-1 rounded-full px-4 py-3 text-[12px] font-semibold transition-all duration-200 sm:flex-none sm:px-8 sm:py-3.5 sm:text-[14px]",
            tripMode === mode.key
              ? "luxury-search-tab-active"
              : "",
          ].join(" ")}
        >
          {searchUiCopy.tripModes[mode.key]}
        </button>
      ))}
    </div>
  )
}

function BookingGlassBar({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={["luxury-search-shell pointer-events-auto relative isolate", className ?? ""].join(" ")}>
      {children}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { language } = useI18n()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [pax, setPax] = useState(1)
  const [airportLabels, setAirportLabels] = useState<Record<string, string>>(DEFAULT_AIRPORT_DIRECTORY)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarAnchorRef = useRef<HTMLDivElement>(null)
  const returnDateAnchorRef = useRef<HTMLDivElement>(null)
  const multiDateAnchorRefs = useRef<(HTMLDivElement | null)[]>([])
  const [faqOpen, setFaqOpen] = useState(-1)
  const [faqQuestion, setFaqQuestion] = useState("")
  const [tripMode, setTripMode] = useState<TripMode>("round")
  const [passengerTouched, setPassengerTouched] = useState(false)
  const [activeAirportField, setActiveAirportField] = useState<string | null>(null)
  const [multiTrips, setMultiTrips] = useState<MultiTrip[]>([
    { from: "", to: "", date: "" },
    { from: "", to: "", date: "" },
  ])
  const [openMultiDateIndex, setOpenMultiDateIndex] = useState<number | null>(null)
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(() => getStoredTheme())

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

  const isDarkTheme = siteTheme === "dark"
  const copy = {
    uz: {
      titleLines: ["Xalqaro avia qatnovlar", "va tezkor reyslar"],
      subtitle: "Jonli tariflar, ishonchli aviakompaniyalar va qulay bron jarayoni bir ekranda jamlangan.",
      chips: ["Jonli tarif", "Aviakompaniyalar", "Tezkor bron"],
      totalFlights: "Jami",
      flightsSuffix: "ta reys",
      from: "Qayerdan",
      to: "Qayerga",
      date: "Qachon",
      passenger: "Yo'lovchi",
      selectDate: "Sanani tanlang",
      priceCalendar: "Sanani Tanlang",
      search: "Bilet topish",
      invalidRoute: "Qayerdan va qayerga uchun to'g'ri variantni tanlang.",
      invalidDate: "Sanani tanlang.",
      popularBadge: "Populyarnye napravleniya",
      popularTitleA: "",
      popularTitleB: "Yo'nalishlar",
      popularDesc: "Har bir blok bitta destination bo'yicha guruhlangan. Qatorni bossangiz shu reysning rasmiylashtirish oqimiga o'tadi.",
      fromPrice: "dan",
      latestUpdate: "Oxirgi yangilanish",
      viewFare: "Tarifni ko'rish",
      faqBadge: "Tez-tez so'raladigan savollar",
      faqTitleA: "Parvoz va bron jarayoni bo'yicha",
      faqTitleB: "eng muhim savollar",
      faqDesc: "Aviabilet qidirish, bron qilish, bagaj, to'lov va hamkorlik bo'yicha asosiy savollarni bir joyga jamladik.",
      ask: "Savolingiz bormi?",
      askPlaceholder: "Masalan: Bagaj limiti qanday ishlaydi?",
      send: "Yuborish",
      helpBadge: "Yordam va to'lov",
      helpTitleA: "Parvozdan oldin kerak bo'ladigan",
      helpTitleB: "muhim yo'riqnomalar",
      helpDesc: "To'lov usullari, elektron aviachipta va reysni almashtirish bo'yicha asosiy ma'lumotlarni bir qarashda topishingiz mumkin.",
      helpCards: [
        {
          title: "Saytda xavfsiz to'lov",
          text: "Aviabilet va xizmatlar uchun qulay to'lovni bir necha usulda amalga oshiring.",
          extra: "",
        },
        {
          title: "Elektron aviachipta nima?",
          text: "Bron tasdiqlangach, barcha parvoz ma'lumotlari elektron ko'rinishda shakllanadi va yo'lovchi uchun qulay saqlanadi.",
          extra: "Unda yo'nalish, vaqt, bagaj, tarif va yo'lovchi ma'lumotlari bir joyda ko'rsatiladi.",
        },
        {
          title: "Reysni almashtirish qanday ishlaydi?",
          text: "Tarif shartlariga qarab sana, yo'nalish yoki xizmat turini yangilash imkoniyati ko'rib chiqiladi.",
          extra: "Yordam bo'limi va operatorlar reys almashinuvi bo'yicha tezkor yo'naltiradi.",
        },
      ],
      faqItems: [
        {
          question: "Aviabilet qidirishda qaysi kodlarni kiritish kerak?",
          answer: "Qidiruvda aeroport yoki shahar IATA kodlarini kiriting: masalan, London uchun LON va Frankfurt uchun FRA. Sana esa YYYY-MM-DD formatida bo'lishi kerak.",
        },
        {
          question: "Bron qilish jarayoni qanday ishlaydi?",
          answer: "Avval reysni tanlaysiz, keyin yo'lovchi ma'lumotlarini kiritasiz va yakuniy tasdiqlash bosqichidan o'tasiz. Har bir qadam aniq ko'rsatiladi.",
        },
        {
          question: "Bagaj va xizmatlar haqida ma'lumot qayerda ko'rinadi?",
          answer: "Har bir reys kartasida bagaj, parvoz vaqti, davomiylik va tarif ma'lumotlari ko'rsatiladi. Batafsil oynada esa qo'shimcha xizmatlar ham chiqadi.",
        },
      ],
    },
    ru: {
      titleLines: ["Международные авиарейсы", "и быстрое бронирование"],
      subtitle: "Актуальные тарифы, надежные авиакомпании и удобное бронирование собраны на одном экране.",
      chips: ["Актуальные тарифы", "Авиакомпании", "Быстрое бронирование"],
      totalFlights: "Всего",
      flightsSuffix: "рейсов",
      from: "Откуда",
      to: "Куда",
      date: "Когда",
      passenger: "Пассажир",
      selectDate: "Выберите дату",
      priceCalendar: "Выберите дату",
      search: "Найти билет",
      invalidRoute: "Выберите корректные пункты отправления и назначения.",
      invalidDate: "Выберите дату.",
      popularBadge: "Популярные направления",
      popularTitleA: "",
      popularTitleB: "Направления",
      popularDesc: "Каждый блок сгруппирован по отдельному направлению. Нажмите на строку, чтобы перейти к оформлению именно этого рейса.",
      fromPrice: "от",
      latestUpdate: "Последнее обновление",
      viewFare: "Посмотреть тариф",
      faqBadge: "Часто задаваемые вопросы",
      faqTitleA: "Самые важные вопросы о",
      faqTitleB: "перелетах и бронировании",
      faqDesc: "Мы собрали в одном месте основные вопросы о поиске авиабилетов, бронировании, багаже, оплате и сотрудничестве.",
      ask: "Есть вопрос?",
      askPlaceholder: "Например: Как работает норма багажа?",
      send: "Отправить",
      helpBadge: "Помощь и оплата",
      helpTitleA: "Что важно знать",
      helpTitleB: "перед вылетом",
      helpDesc: "В одном месте собрана основная информация об оплате, электронном билете и правилах обмена рейсов.",
      helpCards: [
        {
          title: "Безопасная оплата на сайте",
          text: "Оплачивайте авиабилеты и услуги удобным для вас способом.",
          extra: "",
        },
        {
          title: "Что такое электронный авиабилет?",
          text: "После подтверждения бронирования все данные о перелете сохраняются в электронном виде для удобства пассажира.",
          extra: "В нем отображаются маршрут, время, багаж, тариф и данные пассажира в одном месте.",
        },
        {
          title: "Как работает обмен рейса?",
          text: "В зависимости от условий тарифа можно изменить дату, направление или набор услуг.",
          extra: "Служба поддержки и операторы помогут быстро сориентироваться по правилам обмена.",
        },
      ],
      faqItems: [
        {
          question: "Какие коды нужно вводить при поиске авиабилета?",
          answer: "При поиске используйте IATA-коды аэропортов или городов: например, LON для Лондона и FRA для Франкфурта. Дата должна быть в формате YYYY-MM-DD.",
        },
        {
          question: "Как проходит процесс бронирования?",
          answer: "Сначала вы выбираете рейс, затем вводите данные пассажира и переходите к финальному подтверждению. Каждый шаг подробно показан.",
        },
        {
          question: "Где посмотреть информацию о багаже и услугах?",
          answer: "На карточке каждого рейса отображаются багаж, время вылета, длительность и тариф. В подробном окне видны и дополнительные услуги.",
        },
      ],
    },
    en: {
      titleLines: ["Premium flight search", "and fast booking"],
      subtitle: "Real flights, accurate pricing, and a simplified booking flow.",
      chips: ["Real pricing", "Uzbek interface", "Fast booking"],
      totalFlights: "Total",
      flightsSuffix: "flights",
      from: "From",
      to: "To",
      date: "When",
      passenger: "Passenger",
      selectDate: "Select a date",
      priceCalendar: "Price calendar",
      search: "Find ticket",
      invalidRoute: "Select valid origin and destination values.",
      invalidDate: "Select a date.",
      popularBadge: "Popular directions",
      popularTitleA: "Directions collected",
      popularTitleB: "from the real backend",
      popularDesc: "Each block is grouped by destination. Clicking a row opens the checkout flow for that exact flight.",
      fromPrice: "from",
      latestUpdate: "Last update",
      viewFare: "View fare",
      faqBadge: "Frequently asked questions",
      faqTitleA: "Key questions about",
      faqTitleB: "flights and booking",
      faqDesc: "We collected the main questions about searching tickets, booking, baggage, payments, and partnerships.",
      ask: "Have a question?",
      askPlaceholder: "For example: how does baggage allowance work?",
      send: "Send",
      helpBadge: "Help and payment",
      helpTitleA: "Important instructions",
      helpTitleB: "before your flight",
      helpDesc: "Quick access to payment methods, e-ticket details, and flight change guidance.",
      helpCards: [
        {
          title: "Secure payment on the site",
          text: "Pay for tickets and services using several convenient methods.",
          extra: "",
        },
        {
          title: "What is an e-ticket?",
          text: "After booking is confirmed, all flight information is generated electronically.",
          extra: "Route, timing, baggage, fare, and passenger data are available in one place.",
        },
        {
          title: "How do flight changes work?",
          text: "Depending on fare rules, date, route, or service type changes may be available.",
          extra: "Support agents will guide you through flight change options quickly.",
        },
      ],
      faqItems: [
        {
          question: "Which codes should be entered when searching for a ticket?",
          answer: "Use airport or city IATA codes: for example LON for London and FRA for Frankfurt. The date should be in YYYY-MM-DD format.",
        },
        {
          question: "How does the booking process work?",
          answer: "First you select a flight, then fill in passenger details, and finally confirm the booking. Each step is shown clearly.",
        },
        {
          question: "Where can I see baggage and service information?",
          answer: "Each flight card shows baggage, timing, duration, and fare details. The detail modal shows extra services as well.",
        },
      ],
    },
  }[language]

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AIRPORT_CACHE_KEY)
      if (!stored) {
        setAirportLabels(DEFAULT_AIRPORT_DIRECTORY)
        return
      }
      const parsed = JSON.parse(stored) as Record<string, string>
      setAirportLabels({ ...DEFAULT_AIRPORT_DIRECTORY, ...parsed })
    } catch {
      setAirportLabels(DEFAULT_AIRPORT_DIRECTORY)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const syncAirportDirectoryFromBackend = async () => {
      try {
        const liveLabels: Record<string, string> = {}

        const responses = await Promise.allSettled(
          LIVE_DIRECTORY_BOOTSTRAPS.map((trip) =>
            searchAir({
              adults: 1,
              children: 0,
              infants: 0,
              class: "Y",
              trips: [
                {
                  origin: trip.from,
                  destination: trip.to,
                  departure: getDefaultHomeDate(),
                },
              ],
            })
          )
        )

        if (cancelled) return

        for (const result of responses) {
          if (result.status !== "fulfilled") continue
          if (result.value.data.status !== "success" || !result.value.data.data) continue

          for (const city of result.value.data.data.cities ?? []) {
            liveLabels[city.code.toUpperCase()] = city.name
          }
          for (const airport of result.value.data.data.airports ?? []) {
            liveLabels[airport.code.toUpperCase()] = airport.name
          }
        }

        if (!Object.keys(liveLabels).length) return

        setAirportLabels((prev) => {
          const next = { ...prev, ...liveLabels }
          localStorage.setItem(AIRPORT_CACHE_KEY, JSON.stringify(next))
          return next
        })
      } catch {
        // Keep cached/static directory when the live bootstrap call is unavailable.
      }
    }

    void syncAirportDirectoryFromBackend()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setFrom(DEFAULT_HOME_SEARCH.from)
    setTo(DEFAULT_HOME_SEARCH.to)
    setDate("")
    setPax(DEFAULT_HOME_SEARCH.pax)
  }, [])

  const locationOptions = useMemo(() => {
    return Object.entries(airportLabels)
      .map(([code, name]) => ({
        code,
        name,
        searchText: normalizeText(`${code} ${name}`),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [airportLabels])

  const heroCopy = {
    uz: {
      title: "Aviation Tour bilan qulay va ishonchli avia sayohat",
      subtitle: "Xalqaro reyslar, tezkor bron va bir joyda jamlangan aeroport yo'nalishlari",
      learnMore: "Batafsil",
      tripModes: [
        { key: "oneway" as const, label: "Bir tomonga" },
        { key: "round" as const, label: "Borib-kelish" },
        { key: "multi" as const, label: "Ko'p shahar" },
      ],
      guestCabin: "Yo'lovchi va klass",
      guestValue: passengerTouched ? `${pax} yo'lovchi, Ekonom` : "Qo'shing",
      travelWhen: "Qachon uchasiz?",
      departDateLabel: "Ketish",
      returnDateLabel: "Qaytish",
      addDates: "Sanani qo'shing",
      fromTitle: "Qayerdan",
      toTitle: "Qayerga",
      inspirationTitleA: "Abu Dhabidan",
      inspirationTitleB: "parvozlar",
      inspirationSubtitle: "Keyingi sayohatingiz uchun ilhom oling",
      viewAll: "Barchasi",
      routePrefix: "Borib-kelish - Ekonom",
      fromPrice: "Dan",
      originPlaceholder: "Ketish joyi",
      destinationPlaceholder: "Borish joyi",
      searchButton: "Qidirish",
      addFlight: "Parvoz qo'shish",
      bookWithMiles: "Tripzy bilan bron qilish",
      allAirports: "Barcha aeroportlar",
      fromPanelTitle: "Ketish aeroportlari",
      toPanelTitle: "Borish aeroportlari",
      flightLabel: "Parvoz",
      addSegment: "Parvoz qo'shish",
    },
    ru: {
      title: "Aviation Tour для комфортных и надежных авиапутешествий",
      subtitle: "Международные рейсы, быстрое бронирование и все аэропортные направления в одном месте",
      learnMore: "Подробнее",
      tripModes: [
        { key: "oneway" as const, label: "В одну сторону" },
        { key: "round" as const, label: "Туда-обратно" },
        { key: "multi" as const, label: "Мульти-город" },
      ],
      guestCabin: "Пассажиры и класс",
      guestValue: passengerTouched ? `${pax} пассажир, Эконом` : "Добавить",
      travelWhen: "Когда летите?",
      addDates: "Добавьте дату",
      fromTitle: "Откуда",
      toTitle: "Куда",
      inspirationTitleA: "Рейсы из",
      inspirationTitleB: "Абу-Даби",
      inspirationSubtitle: "Пусть следующее путешествие вдохновит вас",
      viewAll: "Смотреть все",
      routePrefix: "Туда-обратно - Эконом",
      fromPrice: "От",
      originPlaceholder: "Место вылета",
      destinationPlaceholder: "Место прилета",
      searchButton: "Поиск",
      addFlight: "Добавить рейс",
      bookWithMiles: "Бронирование с Tripzy",
      allAirports: "Все аэропорты",
      fromPanelTitle: "Аэропорты вылета",
      toPanelTitle: "Аэропорты прилета",
      flightLabel: "Рейс",
      addSegment: "Добавить рейс",
    },
    en: {
      title: "Aviation Tour for comfortable and reliable air travel",
      subtitle: "International flights, fast booking, and airport routes gathered in one place",
      learnMore: "Learn more",
      tripModes: [
        { key: "oneway" as const, label: "One-way" },
        { key: "round" as const, label: "Round trip" },
        { key: "multi" as const, label: "Multi-city" },
      ],
      guestCabin: "Passengers and Class",
      guestValue: passengerTouched ? `${pax} Passenger, Economy` : "Add",
      travelWhen: "Travelling when?",
      departDateLabel: "Departure",
      returnDateLabel: "Return",
      addDates: "Add dates",
      fromTitle: "From",
      toTitle: "To",
      inspirationTitleA: "Flights from",
      inspirationTitleB: "Abu Dhabi",
      inspirationSubtitle: "Let us inspire your next journey",
      viewAll: "View all",
      routePrefix: "Round trip - Economy",
      fromPrice: "From",
      originPlaceholder: "Origin",
      destinationPlaceholder: "Destination",
      searchButton: "Search",
      addFlight: "Add Flight",
      bookWithMiles: "Book with Tripzy",
      allAirports: "All Airports",
      fromPanelTitle: "Departure airports",
      toPanelTitle: "Arrival airports",
      flightLabel: "Flight",
      addSegment: "Add Flight",
    },
  }[language]

  const searchUiCopy = {
    uz: {
      tripModes: {
        round: "Borib-kelish",
        oneway: "Bir tomonga",
        multi: "Ko'p shahar",
      },
      from: "Qayerdan",
      to: "Qayerga",
      depart: "Ketish",
      return: "Qaytish",
      passengers: "Yo'lovchi",
      search: "Bilet topish",
      invalidRoute: "Qayerdan va qayerga uchun to'g'ri variantni tanlang.",
      invalidDate: "Sanani tanlang.",
      close: "Yopish",
      airportNotFound: "Aeroport topilmadi",
    },
    ru: {
      tripModes: {
        round: "Туда-обратно",
        oneway: "В одну сторону",
        multi: "Несколько городов",
      },
      from: "Откуда",
      to: "Куда",
      depart: "Туда",
      return: "Обратно",
      passengers: "Пассажир",
      search: "Найти билеты",
      invalidRoute: "Выберите корректные пункты отправления и назначения.",
      invalidDate: "Выберите дату.",
      close: "Закрыть",
      airportNotFound: "Аэропорт не найден",
    },
    en: {
      tripModes: {
        round: "Round trip",
        oneway: "One-way",
        multi: "Multi-city",
      },
      from: "From",
      to: "To",
      depart: "Departure",
      return: "Return",
      passengers: "Passenger",
      search: "Find tickets",
      invalidRoute: "Select valid origin and destination values.",
      invalidDate: "Select a date.",
      close: "Close",
      airportNotFound: "Airport not found",
    },
  }[language]

  const onSearch = () => {
    if (tripMode === "multi") {
      const trips = multiTrips
        .map((item) => ({
          origin: resolveLocationCode(item.from, locationOptions),
          destination: resolveLocationCode(item.to, locationOptions),
          departure: item.date.trim(),
        }))
        .filter((item) => item.origin || item.destination || item.departure)

      if (!trips.length || trips.some((item) => !item.origin || !item.destination)) {
        toast.error(searchUiCopy.invalidRoute)
        return
      }

      if (trips.some((item) => !item.departure)) {
        toast.error(searchUiCopy.invalidDate)
        return
      }

      const q = new URLSearchParams({
        trips: JSON.stringify(trips),
        pax: String(Math.max(1, pax)),
        class: "Y",
      }).toString()

      navigate(`/flights?${q}`)
      return
    }

    const resolvedFrom = resolveLocationCode(from, locationOptions)
    const resolvedTo = resolveLocationCode(to, locationOptions)

    if (!resolvedFrom || !resolvedTo) {
      toast.error(searchUiCopy.invalidRoute)
      return
    }
    if (!date.trim()) {
      toast.error(searchUiCopy.invalidDate)
      return
    }

    if (tripMode === "round") {
      if (!returnDate.trim()) {
        toast.error(searchUiCopy.invalidDate)
        return
      }

      const q = new URLSearchParams({
        trips: JSON.stringify([
          { origin: resolvedFrom, destination: resolvedTo, departure: date.trim() },
          { origin: resolvedTo, destination: resolvedFrom, departure: returnDate.trim() },
        ]),
        pax: String(Math.max(1, pax)),
        class: "Y",
      }).toString()

      navigate(`/flights?${q}`)
      return
    }

    const q = new URLSearchParams({
      from: resolvedFrom,
      to: resolvedTo,
      date: date.trim(),
      pax: String(Math.max(1, pax)),
    }).toString()

    navigate(`/flights?${q}`)
  }

  const faqSectionClass = isDarkTheme
    ? "relative z-10 bg-transparent px-4 pb-18 pt-14 sm:px-6 md:px-10 lg:px-14"
    : "relative z-10 bg-transparent px-4 pb-18 pt-14 sm:px-6 md:px-10 lg:px-14"

  const helpSectionClass = isDarkTheme
    ? "relative z-10 bg-transparent px-4 pb-20 sm:px-6 md:px-10 lg:px-14"
    : "relative z-10 bg-transparent px-4 pb-20 sm:px-6 md:px-10 lg:px-14"

  const faqGlowClass = isDarkTheme
    ? "pointer-events-none absolute inset-x-0 top-8 mx-auto h-40 max-w-[980px] rounded-full bg-[radial-gradient(circle,rgba(92,134,211,0.2)_0%,rgba(92,134,211,0)_72%)] blur-3xl"
    : "pointer-events-none absolute inset-x-0 top-8 mx-auto h-40 max-w-[980px] rounded-full bg-[radial-gradient(circle,rgba(92,134,211,0.1)_0%,rgba(92,134,211,0)_72%)] blur-3xl"

  const faqPanelClass = isDarkTheme
    ? "mt-10 rounded-[30px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.62)_0%,rgba(9,24,54,0.42)_100%)] p-5 shadow-[0_30px_80px_rgba(2,8,24,0.36)] backdrop-blur-[18px] sm:p-6 md:p-7"
    : "mt-10 rounded-[30px] border border-[#e5edf7] bg-white p-5 shadow-[0_24px_60px_rgba(17,24,39,0.08)] sm:p-6 md:p-7"

  const faqInputWrapClass = isDarkTheme
    ? "flex h-14 items-center gap-3 rounded-2xl border border-[#5d7fba]/45 bg-[rgba(13,30,62,0.56)] px-4 shadow-[0_14px_34px_rgba(2,8,24,0.26)] backdrop-blur-[14px]"
    : "flex h-14 items-center gap-3 rounded-2xl border border-[#dbe5f2] bg-white px-4 shadow-[0_8px_20px_rgba(17,24,39,0.04)]"

  const faqInputClass = isDarkTheme
    ? "h-full w-full bg-transparent text-[15px] font-medium text-white outline-none placeholder:text-[#9fb8e4]"
    : "h-full w-full bg-transparent text-[15px] font-medium text-[#0f172a] outline-none placeholder:text-[#64748b]"

  const faqItemClass = isDarkTheme
    ? "overflow-hidden rounded-[22px] border border-[#5d7fba]/45 bg-[rgba(13,30,62,0.5)] shadow-[0_18px_42px_rgba(2,8,24,0.3)] backdrop-blur-[14px]"
    : "overflow-hidden rounded-[22px] border border-[#e3eaf3] bg-white shadow-[0_10px_24px_rgba(17,24,39,0.05)]"

  const faqAnswerClass = isDarkTheme
    ? "border-t border-[#5d7fba]/35 bg-[rgba(8,22,50,0.34)] px-5 py-4 text-sm leading-7 text-[#cfe0fb]"
    : "border-t border-[#edf2f7] bg-[#f8fbff] px-5 py-4 text-sm leading-7 text-[#475569]"

  const faqQuestionTextClass = isDarkTheme
    ? "flex-1 text-sm font-semibold text-white sm:text-base"
    : "flex-1 text-sm font-semibold text-[#1e293b] sm:text-base"

  const faqIconClass = isDarkTheme
    ? "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(66,120,220,0.34)_0%,rgba(28,62,132,0.28)_100%)] text-[#9fc7ff]"
    : "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#edf5ff_0%,#dceaff_100%)] text-[#4790d8]"

  const faqSendButtonClass = isDarkTheme
    ? "inline-flex h-14 items-center justify-center gap-2 self-end rounded-2xl border border-[#36507f] bg-[linear-gradient(135deg,#4b79ff_0%,#2f63df_45%,#214fb8_100%)] px-6 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(33,79,184,0.34)] transition hover:brightness-110"
    : "inline-flex h-14 items-center justify-center gap-2 self-end rounded-2xl border border-[#1a2231]/10 bg-[linear-gradient(135deg,#4d9fe6_0%,#3f87d4_45%,#2a6fb8_100%)] px-6 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(63,135,212,0.22)] transition hover:brightness-110"

  const sectionBadgeClass = isDarkTheme
    ? "inline-flex items-center gap-2 rounded-full border border-[#35507f] bg-[rgba(19,35,67,0.82)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4e2fb] shadow-[0_10px_24px_rgba(2,8,24,0.24)] backdrop-blur-[12px]"
    : "inline-flex items-center gap-2 rounded-full border border-[#e2eaf5] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#334155] shadow-[0_10px_24px_rgba(17,24,39,0.06)]"

  const sectionTitleClass = isDarkTheme
    ? "mt-5 text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl md:text-5xl"
    : "mt-5 text-3xl font-extrabold tracking-[-0.04em] text-white drop-shadow-[0_6px_22px_rgba(2,8,24,0.72)] sm:text-4xl md:text-5xl"

  const sectionTitleAccentClass = isDarkTheme
    ? "block bg-[linear-gradient(135deg,#78b7ff_0%,#bba7ff_48%,#ffd1b8_100%)] bg-clip-text text-transparent"
    : "block bg-[linear-gradient(135deg,#ffffff_0%,#dceaff_42%,#86b9ff_100%)] bg-clip-text text-transparent drop-shadow-[0_6px_22px_rgba(2,8,24,0.62)]"

  const sectionDescriptionClass = isDarkTheme
    ? "mx-auto mt-4 max-w-[760px] text-sm leading-7 text-[#d2e0f8] sm:text-base"
    : "mx-auto mt-4 max-w-[760px] text-sm leading-7 text-[#475569] sm:text-base"

  const mobileSearchSegmentClass = isDarkTheme
    ? "luxury-search-segment luxury-search-divider pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-[18px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-4 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px] sm:min-h-[64px] sm:px-5 xl:min-h-[60px] xl:border-0 xl:bg-transparent xl:shadow-none xl:backdrop-blur-none xl:after:block after:hidden"
    : "luxury-search-segment luxury-search-divider pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-[18px] border border-[#e3edf7] bg-[#fbfdff] px-4 shadow-[0_8px_18px_rgba(17,24,39,0.035)] sm:min-h-[64px] sm:px-5 xl:min-h-[60px] xl:border-0 xl:bg-transparent xl:shadow-none xl:after:block after:hidden"

  const activeMobileSearchSegmentClass = isDarkTheme
    ? "z-40 bg-[linear-gradient(180deg,rgba(26,50,94,0.86)_0%,rgba(12,29,64,0.66)_100%)] shadow-[0_18px_42px_rgba(2,8,24,0.34)]"
    : "z-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(247,250,255,0.66)_100%)] shadow-[0_10px_28px_rgba(92,134,211,0.12)]"

  const idleMobileSearchSegmentClass = isDarkTheme
    ? "z-10 hover:bg-[linear-gradient(180deg,rgba(24,48,92,0.82)_0%,rgba(11,28,62,0.62)_100%)]"
    : "z-10 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(247,250,255,0.48)_100%)]"

  const multiFlightLabelClass = isDarkTheme
    ? "mb-1.5 text-[12px] font-semibold text-[#d4e2fb]"
    : "mb-1.5 text-[12px] font-semibold text-[#0f172a] drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]"

  const multiDateSegmentClass = isDarkTheme
    ? "luxury-search-segment pointer-events-auto relative flex min-h-[58px] flex-col justify-center overflow-visible rounded-[20px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-4 py-2 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px] xl:min-h-[62px]"
    : "luxury-search-segment pointer-events-auto relative flex min-h-[58px] flex-col justify-center overflow-visible rounded-[20px] border border-[#e3eaf3] bg-white px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] xl:min-h-[62px]"

  const activeMultiDateSegmentClass = isDarkTheme
    ? "z-40 bg-[linear-gradient(180deg,rgba(26,50,94,0.86)_0%,rgba(12,29,64,0.66)_100%)] shadow-[0_18px_42px_rgba(2,8,24,0.34)]"
    : "z-40 shadow-[0_10px_28px_rgba(92,134,211,0.12)]"

  return (
    <div className="-mt-[86px] relative overflow-x-hidden bg-transparent text-[#1d2430] md:-mt-[94px] xl:-mt-[102px] dark:text-white">
      <HeroSection
        heroBackgroundImage={heroBackgroundImage}
        heroMobileBackgroundImage={heroMobileBackgroundImage}
      >
            <div className="flex min-h-[560px] w-full items-start justify-center pt-28 sm:min-h-[680px] sm:items-start sm:pt-32 lg:min-h-[760px] lg:pt-36">
            <motion.div
              initial={{ opacity: 0, y: 38 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.36, ease: "easeOut" }}
              className="relative w-full max-w-[1360px]"
            >
              <TripModeTabs
                tripModes={heroCopy.tripModes}
                tripMode={tripMode}
                searchUiCopy={searchUiCopy}
                setTripMode={setTripMode}
                className="mx-auto max-w-[460px] lg:absolute lg:left-1/2 lg:top-24 lg:mt-0 lg:-translate-x-1/2"
              />
              <BookingGlassBar className="relative z-20 mt-6 rounded-[22px] p-2 pt-2 sm:rounded-[26px] sm:p-2.5 lg:mt-28 lg:rounded-[28px] lg:p-3">
              {tripMode === "multi" ? (
                <div className="space-y-2.5">
                  {multiTrips.map((trip, index) => (
                    <div key={`trip-${index}`}>
                      <div className={multiFlightLabelClass}>
                        {heroCopy.flightLabel} {index + 1}
                      </div>
                      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                        <HomeAutocompleteField
                          label={heroCopy.fromTitle}
                          value={trip.from}
                          placeholder={heroCopy.originPlaceholder}
                          options={locationOptions}
                          onChange={(value) =>
                            setMultiTrips((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, from: value } : item))
                          }
                          icon={<PlaneTakeoff size={18} />}
                          onActivate={() => {
                            setCalendarOpen(false)
                            setOpenMultiDateIndex(null)
                            setActiveAirportField(`multi-${index}-from`)
                          }}
                          onDismiss={() => setActiveAirportField(null)}
                          useInlinePanel
                          active={activeAirportField === `multi-${index}-from`}
                          isDark={isDarkTheme}
                        />
                        <HomeAutocompleteField
                          label={heroCopy.toTitle}
                          value={trip.to}
                          placeholder={heroCopy.destinationPlaceholder}
                          options={locationOptions}
                          onChange={(value) =>
                            setMultiTrips((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, to: value } : item))
                          }
                          icon={<PlaneLanding size={18} />}
                          onActivate={() => {
                            setCalendarOpen(false)
                            setOpenMultiDateIndex(null)
                            setActiveAirportField(`multi-${index}-to`)
                          }}
                          onDismiss={() => setActiveAirportField(null)}
                          useInlinePanel
                          active={activeAirportField === `multi-${index}-to`}
                          isDark={isDarkTheme}
                        />
                        <div
                          ref={(el) => { multiDateAnchorRefs.current[index] = el }}
                          className={[
                            multiDateSegmentClass,
                            openMultiDateIndex === index ? activeMultiDateSegmentClass : "z-10",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAirportField(null)
                              setCalendarOpen(false)
                              setOpenMultiDateIndex((prev) => (prev === index ? null : index))
                            }}
                            className="text-left"
                          >
                            <div className="luxury-search-label flex items-center gap-2 text-[9px] font-semibold uppercase">
                              <span className="luxury-search-icon h-7 w-7">
                                <CalendarDays size={13} />
                              </span>
                              <span>{copy.date}</span>
                            </div>
                            <div className="luxury-search-value mt-1.5 text-[13px] font-semibold">
                              {trip.date ? formatDisplayDate(trip.date) : heroCopy.addDates}
                            </div>
                          </button>
                          {openMultiDateIndex === index ? (
                            <FareCalendarPicker
                              from={resolveLocationCode(trip.from, locationOptions)}
                              to={resolveLocationCode(trip.to, locationOptions)}
                              pax={pax}
                              value={trip.date}
                              onChange={(nextDate) => {
                                setMultiTrips((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, date: nextDate } : item))
                                setOpenMultiDateIndex(null)
                              }}
                              onClose={() => setOpenMultiDateIndex(null)}
                              anchorElement={multiDateAnchorRefs.current[index]}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <PassengerField
                      pax={pax}
                      onChange={(value) => {
                        setPax(value)
                        setPassengerTouched(true)
                        setActiveAirportField(null)
                      }}
                      onActivate={() => {
                        setActiveAirportField(null)
                        setCalendarOpen(false)
                        setOpenMultiDateIndex(null)
                      }}
                      label={heroCopy.guestCabin}
                      valueLabel={heroCopy.guestValue}
                      icon={<UsersRound size={16} />}
                      isDark={isDarkTheme}
                    />
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setMultiTrips((prev) => [...prev, { from: "", to: "", date: "" }])
                        }
                        className="border-b border-white/24 pb-0.5 text-[13px] font-medium text-white/80 transition hover:text-white"
                      >
                        {heroCopy.addSegment}
                      </button>
                      <motion.button
                        type="button"
                        onClick={() => {
                          setActiveAirportField(null)
                          onSearch()
                        }}
                        className="luxury-search-cta inline-flex h-10 items-center justify-center rounded-[14px] px-5 text-[13px] font-bold text-white transition-all duration-300"
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                      >
                        {searchUiCopy.search}
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={[
                    `luxury-search-grid relative grid items-stretch gap-3 overflow-visible rounded-[20px] bg-transparent sm:rounded-[22px] xl:gap-0 ${isDarkTheme ? "xl:bg-[rgba(8,20,44,0.38)]" : "xl:bg-white"}`,
                    tripMode === "round"
                      ? "xl:grid-cols-[2.15fr_0.8fr_0.82fr_0.82fr_210px]"
                      : "xl:grid-cols-[2.15fr_0.82fr_0.82fr_210px]",
                  ].join(" ")}
                >
                  <div className="relative grid items-stretch gap-3 xl:grid-cols-2 xl:gap-0">
                    <button
                      type="button"
                      onClick={() => {
                        const nextFrom = to
                        const nextTo = from
                        setFrom(nextFrom)
                        setTo(nextTo)
                        setActiveAirportField(null)
                      }}
                      className="luxury-search-icon absolute left-1/2 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#d7e6f7] bg-[linear-gradient(180deg,#f7fbff_0%,#eaf4ff_100%)] text-[#2e9df2] shadow-[0_10px_24px_rgba(37,99,235,0.10)] transition-all duration-200 hover:scale-[1.04] hover:brightness-110 xl:flex"
                    >
                      <ArrowRightLeft size={18} />
                    </button>
                    <HomeAutocompleteField
                      label={searchUiCopy.from}
                      value={from}
                      placeholder={heroCopy.originPlaceholder}
                      options={locationOptions}
                      onChange={setFrom}
                      icon={<PlaneTakeoff size={20} className="text-[#18a0ea]" />}
                      onActivate={() => {
                        setCalendarOpen(false)
                        setOpenMultiDateIndex(null)
                        setActiveAirportField("from")
                      }}
                      onDismiss={() => setActiveAirportField(null)}
                      useInlinePanel
                      active={activeAirportField === "from"}
                      isDark={isDarkTheme}
                      compact
                    />
                    <HomeAutocompleteField
                      label={searchUiCopy.to}
                      value={to}
                      placeholder={heroCopy.destinationPlaceholder}
                      options={locationOptions}
                      onChange={setTo}
                      icon={<PlaneLanding size={20} className="text-[#18a0ea]" />}
                      onActivate={() => {
                        setCalendarOpen(false)
                        setOpenMultiDateIndex(null)
                        setActiveAirportField("to")
                      }}
                      onDismiss={() => setActiveAirportField(null)}
                      useInlinePanel
                      active={activeAirportField === "to"}
                      isDark={isDarkTheme}
                      compact
                    />
                  </div>
                  <PassengerField
                    pax={pax}
                    onChange={(value) => {
                      setPax(value)
                      setPassengerTouched(true)
                      setActiveAirportField(null)
                    }}
                    onActivate={() => {
                      setActiveAirportField(null)
                      setCalendarOpen(false)
                      setOpenMultiDateIndex(null)
                    }}
                    label={searchUiCopy.passengers}
                    valueLabel={language === "ru" ? `${pax} пассажир` : language === "en" ? `${pax} passenger` : `${pax} yo'lovchi`}
                    icon={<UsersRound size={20} className="text-[#18a0ea]" />}
                    isDark={isDarkTheme}
                    compact
                  />
                  <div
                    ref={calendarAnchorRef}
                    className={[
                      mobileSearchSegmentClass,
                      calendarOpen ? activeMobileSearchSegmentClass : idleMobileSearchSegmentClass,
                    ].join(" ")}
                  >
                    <button type="button" onClick={() => {
                      setActiveAirportField(null)
                      setOpenMultiDateIndex(null)
                      setCalendarOpen((prev) => !prev)
                    }} className="flex w-full items-center justify-between gap-3">
                      <div className="min-w-0 text-left">
                        <div className="luxury-search-label text-[10px] font-semibold uppercase">
                          {searchUiCopy.depart}
                        </div>
                        <span className={`luxury-search-value mt-1 block truncate text-[14px] font-semibold sm:text-[15px] ${date ? "" : "luxury-search-placeholder"}`}>
                          {date ? formatDisplayDate(date) : heroCopy.addDates}
                        </span>
                      </div>
                      <span className="luxury-search-icon h-8 w-8 shrink-0 border border-[#d7e6f7] bg-[linear-gradient(180deg,#f7fbff_0%,#eaf4ff_100%)] text-[#2e9df2] shadow-[0_8px_18px_rgba(37,99,235,0.08)]">
                        <CalendarDays size={15} />
                      </span>
                    </button>
                    {calendarOpen ? (
                      <FareCalendarPicker
                        from={resolveLocationCode(from, locationOptions)}
                        to={resolveLocationCode(to, locationOptions)}
                        pax={pax}
                        value={date}
                        onChange={(nextDate) => {
                          setDate(nextDate)
                          setCalendarOpen(false)
                        }}
                        onClose={() => setCalendarOpen(false)}
                        anchorElement={calendarAnchorRef.current}
                      />
                    ) : null}
                  </div>
                  {tripMode === "round" ? (
                    <div
                      ref={returnDateAnchorRef}
                      className={[
                        mobileSearchSegmentClass,
                        openMultiDateIndex === -2 ? activeMobileSearchSegmentClass : idleMobileSearchSegmentClass,
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAirportField(null)
                          setOpenMultiDateIndex(null)
                          setCalendarOpen(false)
                          setOpenMultiDateIndex(-2)
                        }}
                        className="flex w-full items-center justify-between gap-3"
                      >
                        <div className="min-w-0 text-left">
                          <div className="luxury-search-label text-[10px] font-semibold uppercase">
                            {searchUiCopy.return}
                          </div>
                          <span className={`luxury-search-value mt-1 block truncate text-[14px] font-semibold sm:text-[15px] ${returnDate ? "" : "luxury-search-placeholder"}`}>
                            {returnDate ? formatDisplayDate(returnDate) : heroCopy.addDates}
                          </span>
                        </div>
                        <span className="luxury-search-icon h-8 w-8 shrink-0 border border-[#d7e6f7] bg-[linear-gradient(180deg,#f7fbff_0%,#eaf4ff_100%)] text-[#2e9df2] shadow-[0_8px_18px_rgba(37,99,235,0.08)]">
                          <CalendarDays size={15} />
                        </span>
                      </button>
                      {openMultiDateIndex === -2 ? (
                        <FareCalendarPicker
                          from={resolveLocationCode(to, locationOptions)}
                          to={resolveLocationCode(from, locationOptions)}
                          pax={pax}
                          value={returnDate}
                          onChange={(nextDate) => {
                            setReturnDate(nextDate)
                            setOpenMultiDateIndex(null)
                          }}
                          onClose={() => setOpenMultiDateIndex(null)}
                          anchorElement={returnDateAnchorRef.current}
                        />
                      ) : null}
                    </div>
                  ) : null}
                  <motion.button
                    type="button"
                    onClick={() => {
                      setActiveAirportField(null)
                      onSearch()
                    }}
                    className="luxury-search-cta inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[16px] px-5 text-[14px] font-bold tracking-[0.02em] text-white transition-all duration-300 sm:min-h-[60px] sm:px-6 sm:text-[15px] xl:min-h-full xl:rounded-none xl:rounded-r-[20px]"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    {searchUiCopy.search}
                  </motion.button>
                </div>
              )}

              </BookingGlassBar>
            </motion.div>
            </div>
      </HeroSection>

      <section className={faqSectionClass}>
        <div className={faqGlowClass} />
        <div className="relative mx-auto max-w-[1440px] 2xl:max-w-[1600px]">
          <div className="text-center">
            <div className={sectionBadgeClass}>
              <CircleHelp size={14} />
              {copy.faqBadge}
            </div>
            <h2 className={sectionTitleClass}>
              {copy.faqTitleA}
              <span className={sectionTitleAccentClass}>
                {copy.faqTitleB}
              </span>
            </h2>
            <p className={sectionDescriptionClass.replace("max-w-[760px]", "max-w-[720px]")}>
              {copy.faqDesc}
            </p>
          </div>

          <div className={faqPanelClass}>
            <div className="grid gap-4 md:grid-cols-[1fr_170px]">
              <label className="block">
                <div className={`mb-2 text-sm font-semibold ${isDarkTheme ? "text-[#d4e2fb]" : "text-[#334155]"}`}>
                  {copy.ask}
                </div>
                <div className={faqInputWrapClass}>
                  <CircleHelp size={18} className={isDarkTheme ? "text-[#9fc7ff]" : "text-[#8da0ba]"} />
                  <input
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    className={faqInputClass}
                    placeholder={copy.askPlaceholder}
                  />
                </div>
              </label>

              <button
                type="button"
                className={faqSendButtonClass}
              >
                <Send size={16} />
                {copy.send}
              </button>
            </div>

            <div className="mt-8 space-y-3">
              {copy.faqItems.map((item, index) => {
                const isOpen = faqOpen === index

                return (
                  <div
                    key={item.question}
                    className={faqItemClass}
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? -1 : index)}
                      className={`flex w-full items-center gap-3 px-4 py-4 text-left transition sm:px-5 ${isDarkTheme ? "hover:bg-white/8" : "hover:bg-[#f8fbff]"}`}
                    >
                      <span className={faqIconClass}>
                        <CircleHelp size={16} />
                      </span>
                      <span className={faqQuestionTextClass}>
                        {item.question}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#4790d8] transition ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className={faqAnswerClass}>
                        {item.answer}
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={helpSectionClass}>
        <div className="relative mx-auto max-w-[1440px] 2xl:max-w-[1600px]">
          <div className="text-center">
            <div className={sectionBadgeClass}>
              <CreditCard size={14} />
              {copy.helpBadge}
            </div>
            <h2 className={sectionTitleClass}>
              {copy.helpTitleA}
              <span className={sectionTitleAccentClass}>
                {copy.helpTitleB}
              </span>
            </h2>
            <p className={sectionDescriptionClass}>
              {copy.helpDesc}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <HelpCard
              icon={<CreditCard size={34} />}
              accent="blue"
              title={copy.helpCards[0].title}
              text={copy.helpCards[0].text}
              isDark={isDarkTheme}
            >
              <div className="mt-4 flex flex-wrap gap-2">
                {["Click", "Visa", "Mastercard", "Humo"].map((item) => (
                  <span
                    key={item}
                    className={isDarkTheme ? "rounded-full border border-[#5d7fba]/42 bg-[rgba(13,30,62,0.56)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#cfe0fb] shadow-[0_10px_24px_rgba(2,8,24,0.2)]" : "rounded-full border border-[#d7e3f5] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#45628f] shadow-[0_8px_18px_rgba(17,24,39,0.04)]"}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </HelpCard>

            <HelpCard
              icon={<Ticket size={34} />}
              accent="gold"
              title={copy.helpCards[1].title}
              text={copy.helpCards[1].text}
              isDark={isDarkTheme}
            >
              <p className={`mt-4 text-sm leading-6 ${isDarkTheme ? "text-[#cfe0fb]" : "text-[#475569]"}`}>
                {copy.helpCards[1].extra}
              </p>
            </HelpCard>

            <HelpCard
              icon={<RefreshCcw size={34} />}
              accent="rose"
              title={copy.helpCards[2].title}
              text={copy.helpCards[2].text}
              isDark={isDarkTheme}
            >
              <p className={`mt-4 text-sm leading-6 ${isDarkTheme ? "text-[#cfe0fb]" : "text-[#475569]"}`}>
                {copy.helpCards[2].extra}
              </p>
            </HelpCard>
          </div>
        </div>
      </section>
    </div>
  )
}

function HomeAutocompleteField({
  label,
  value,
  placeholder,
  options,
  onChange,
  icon,
  onActivate,
  onDismiss,
  useInlinePanel = false,
  active = false,
  isDark = false,
  compact = false,
}: {
  label: string
  value: string
  placeholder: string
  options: LocationOption[]
  onChange: (value: string) => void
  icon?: ReactNode
  onActivate?: () => void
  onDismiss?: () => void
  useInlinePanel?: boolean
  active?: boolean
  isDark?: boolean
  compact?: boolean
}) {
  const { language } = useI18n()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const copy = {
    uz: { select: "tanlash", noResult: "Mos airport yoki shahar topilmadi.", chooseOption: "Variantni tanlang", close: "Ro'yxatni yopish" },
    ru: { select: "выбрать", noResult: "Подходящий аэропорт или город не найден.", chooseOption: "Выберите вариант", close: "Закрыть список" },
    en: { select: "select", noResult: "No matching airport or city found.", chooseOption: "Choose an option", close: "Close list" },
  }[language]
  void copy
  const safeCopy = {
    uz: { select: "tanlash", noResult: "Mos aeroport yoki shahar topilmadi.", chooseOption: "Variantni tanlang", close: "Ro'yxatni yopish" },
    ru: { select: "выбрать", noResult: "Подходящий аэропорт или город не найден.", chooseOption: "Выберите вариант", close: "Закрыть список" },
    en: { select: "select", noResult: "No matching airport or city found.", chooseOption: "Choose an option", close: "Close list" },
  }[language]

  const fieldRef = useRef<HTMLLabelElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number
    left: number
    width: number
    maxHeight: number
  } | null>(null)

  const filteredOptions = useMemo(() => {
    const query = normalizeText(value)
    if (!query) return options
    return options.filter((option) => option.searchText.includes(query))
  }, [options, value])

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined
    if (useInlinePanel || window.innerWidth >= 1280) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  useEffect(() => {
    if (!active || !useInlinePanel || !fieldRef.current) {
      setDropdownPos(null)
      return
    }

    const computePos = () => {
      const el = fieldRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const gap = 6
      const margin = 8

      let left = r.left
      const width = Math.min(r.width, window.innerWidth - margin * 2)
      if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin
      if (left < margin) left = margin

      const spaceBelow = window.innerHeight - r.bottom - gap
      const top = r.bottom + gap
      const maxHeight = Math.max(180, Math.min(316, spaceBelow - margin))

      setDropdownPos({ top, left, width, maxHeight })
    }

    computePos()

    const handleViewportChange = () => {
      computePos()
    }

    window.addEventListener("scroll", handleViewportChange, {
      passive: true,
      capture: true,
    })
    window.addEventListener("resize", handleViewportChange, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true)
      window.removeEventListener("resize", handleViewportChange)
    }
  }, [active, useInlinePanel])

  const pickOption = (option: LocationOption) => {
    onChange(`${option.code} - ${option.name}`)
    setOpen(false)
    setActiveIndex(0)
  }

  const optionButtonClass = (activeOption: boolean) =>
    [
      "flex w-full items-center justify-between px-4 py-3 text-left transition",
      isDark
        ? activeOption
          ? "bg-[rgba(42,82,150,0.36)]"
          : "hover:bg-[rgba(42,82,150,0.28)]"
        : activeOption
          ? "bg-[#f8fbff]"
          : "hover:bg-[#f8fbff]",
    ].join(" ")

  const optionTitleClass = isDark
    ? "block text-sm font-semibold text-white"
    : "block text-sm font-semibold text-[#0f172a]"

  const optionCodeClass = isDark
    ? "block text-xs uppercase tracking-[0.14em] text-[#b9cceb]"
    : "block text-xs uppercase tracking-[0.14em] text-[#7f8ca0]"

  const optionBadgeClass = isDark
    ? "rounded-full border border-[#5d7fba]/40 bg-[rgba(13,30,62,0.58)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#cfe0fb]"
    : "rounded-full bg-[#f3f7fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#637791]"

  const emptyOptionClass = isDark
    ? "px-4 py-4 text-sm text-[#b9cceb]"
    : "px-4 py-4 text-sm text-[#475569]"

  const inlinePanelHeaderClass = isDark
    ? "flex items-center justify-between border-b border-[#5d7fba]/34 px-4 py-2.5"
    : "flex items-center justify-between border-b border-[#e2e8f0] px-4 py-2.5"

  const inlinePanelTitleClass = isDark
    ? "text-[13px] font-semibold text-white"
    : "text-[13px] font-semibold text-[#0f172a]"

  const inlinePanelCloseClass = isDark
    ? "grid h-8 w-8 place-items-center rounded-full border border-[#5d7fba]/42 text-[#cfe0fb] transition hover:bg-[rgba(42,82,150,0.28)] hover:text-white"
    : "grid h-8 w-8 place-items-center rounded-full border border-[#dbe3ef] text-[#64748b] transition hover:bg-[#f8fbff] hover:text-[#0f172a]"

  const optionList = filteredOptions.length ? (
    filteredOptions.map((option, index) => (
      <button
        key={option.code}
        type="button"
        onMouseEnter={() => setActiveIndex(index)}
        onMouseDown={(e) => {
          e.preventDefault()
          pickOption(option)
        }}
        onClick={() => pickOption(option)}
        className={optionButtonClass(activeIndex === index)}
      >
        <span>
          <span className={optionTitleClass}>{option.name}</span>
          <span className={optionCodeClass}>{option.code}</span>
        </span>
        <span className={optionBadgeClass}>
          {safeCopy.select}
        </span>
      </button>
    ))
  ) : (
    <div className={emptyOptionClass}>
      {safeCopy.noResult}
    </div>
  )

  const inlinePanel =
    active && useInlinePanel && dropdownPos
      ? createPortal(
          <div
            className="overflow-hidden rounded-[20px] luxury-search-floating-panel"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
          >
            <div className={inlinePanelHeaderClass}>
              <div className={inlinePanelTitleClass}>{label}</div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onDismiss?.()}
                className={inlinePanelCloseClass}
              >
                <X size={14} />
              </button>
            </div>
            <div
              className="overscroll-contain overflow-y-auto px-2 py-1"
              style={{ maxHeight: dropdownPos.maxHeight }}
            >
              {filteredOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { pickOption(option); onDismiss?.() }}
                  className={`flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${isDark ? "hover:bg-[rgba(42,82,150,0.28)]" : "hover:bg-[#f8fbff]"}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="luxury-search-icon h-9 w-9 shrink-0 rounded-[12px]">
                      <MapPinned size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-[13px] font-semibold ${isDark ? "text-white" : "text-[#0f172a]"}`}>{option.name}</span>
                      <span className={`block text-[11px] ${isDark ? "text-[#b9cceb]" : "text-[#64748b]"}`}>{option.code}</span>
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-[999px] border px-2.5 py-1 text-[11px] font-semibold ${isDark ? "border-[#5d7fba]/40 bg-[rgba(13,30,62,0.58)] text-[#cfe0fb]" : "border-[#dbe3ef] bg-white/70 text-[#475569]"}`}>
                    {option.code}
                  </span>
                </button>
              ))}
              {!filteredOptions.length ? (
                <div className={`py-5 text-center text-[13px] ${isDark ? "text-[#b9cceb]" : "text-[#64748b]"}`}>{safeCopy.noResult}</div>
              ) : null}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <label
        ref={fieldRef}
        className={[
          compact
            ? isDark
              ? "luxury-search-segment luxury-search-divider relative flex min-h-[58px] items-center gap-3 rounded-[18px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-4 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px] sm:min-h-[64px] sm:px-5 xl:min-h-[66px] xl:border-0 xl:bg-transparent xl:shadow-none xl:backdrop-blur-none xl:after:block after:hidden"
              : "luxury-search-segment luxury-search-divider relative flex min-h-[58px] items-center gap-3 rounded-[18px] border border-[#e3edf7] bg-[#fbfdff] px-4 shadow-[0_8px_18px_rgba(17,24,39,0.035)] sm:min-h-[64px] sm:px-5 xl:min-h-[66px] xl:border-0 xl:bg-transparent xl:shadow-none xl:after:block after:hidden"
            : isDark
              ? "relative flex min-h-[58px] items-center gap-3 rounded-2xl border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-4 py-2.5 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px]"
              : "relative flex min-h-[58px] items-center gap-3 rounded-2xl border border-[#e3eaf3] bg-white px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
          compact
            ? active ? isDark ? "z-40 bg-[linear-gradient(180deg,rgba(26,50,94,0.86)_0%,rgba(12,29,64,0.66)_100%)] shadow-[0_18px_42px_rgba(2,8,24,0.34)] xl:bg-transparent xl:shadow-none" : "" : ""
            : active
              ? isDark
                ? "z-40 border-[#78b8ff]/55 bg-[linear-gradient(180deg,rgba(26,50,94,0.86)_0%,rgba(12,29,64,0.66)_100%)] shadow-[0_18px_42px_rgba(2,8,24,0.34)]"
                : "border-[#18a0ea]/50 shadow-[0_0_0_3px_rgba(24,160,234,0.08)]"
              : "",
        ].join(" ")}
        data-active={compact ? (active ? "true" : "false") : undefined}
      >
        <span className="luxury-search-icon h-8 w-8 shrink-0 border border-[#d7e6f7] bg-[linear-gradient(180deg,#f7fbff_0%,#eaf4ff_100%)] text-[#2e9df2] shadow-[0_8px_18px_rgba(37,99,235,0.08)]">
          {icon ?? <Search size={18} />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          {compact ? (
            <div className="luxury-search-label mb-1 text-[10px] font-semibold uppercase">
              {label}
            </div>
          ) : null}
          <input
            className="luxury-search-input w-full bg-transparent text-[14px] font-medium outline-none sm:text-[15px]"
            placeholder={placeholder}
            value={value}
            onFocus={() => {
              setOpen(true)
              onActivate?.()
            }}
            onBlur={() =>
              window.setTimeout(() => {
                setOpen(false)
                if (!useInlinePanel) onDismiss?.()
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
                onDismiss?.()
              }
            }}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
              onActivate?.()
            }}
          />
          {!compact && filteredOptions[0] && value.trim() ? (
            <div className="text-[10px] font-semibold text-[#18a0ea]">{filteredOptions[0].code}</div>
          ) : null}
        </div>
        {open && !useInlinePanel ? (
          <>
            <button
              type="button"
              aria-label={safeCopy.close}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[129] bg-[rgba(15,23,42,0.16)] backdrop-blur-[2px] xl:hidden"
            />
            <div className={`fixed inset-x-3 bottom-3 z-[130] max-h-[62svh] overflow-hidden rounded-[24px] border shadow-[0_24px_60px_rgba(17,24,39,0.16)] xl:absolute xl:left-0 xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:max-h-[320px] xl:rounded-[22px] ${isDark ? "border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.96)_0%,rgba(9,24,54,0.94)_100%)] shadow-[0_28px_80px_rgba(2,8,24,0.48)] backdrop-blur-[22px]" : "border-[#dbe3ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.96)_100%)] xl:bg-white"}`}>
              <div className={`mx-auto mt-2 h-1.5 w-14 rounded-full xl:hidden ${isDark ? "bg-[#5d7fba]/45" : "bg-[#d8e1ee]"}`} />
              <div className={`border-b px-4 py-3 xl:hidden ${isDark ? "border-[#5d7fba]/34" : "border-[#eef3f8]"}`}>
                <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-[#b9cceb]" : "text-[#7a879c]"}`}>
                  {label}
                </div>
                <div className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-[#0f172a]"}`}>
                  {safeCopy.chooseOption}
                </div>
              </div>
              <div className="max-h-[calc(62svh-70px)] overflow-y-auto xl:max-h-[320px]">
                {optionList}
              </div>
            </div>
          </>
        ) : null}
      </label>
      {inlinePanel}
    </>
  )
}

function PassengerField({
  pax,
  onChange,
  onActivate,
  label,
  valueLabel,
  icon,
  isDark,
  compact = false,
}: {
  pax: number
  onChange: (value: number) => void
  onActivate?: () => void
  label?: string
  valueLabel?: string
  icon?: ReactNode
  isDark: boolean
  compact?: boolean
}) {
  void label
  const { language } = useI18n()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [adults, setAdults] = useState(() => Math.max(1, pax))
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const safeCopy = {
    uz: {
      passenger: "Yo'lovchi",
      passengersCount: "Yo'lovchilar soni",
      people: "yo'lovchi",
      count: "ta",
      done: "Tayyor",
      close: "Yo'lovchi oynasini yopish",
      cabin: "Ekonom",
      adults: "Kattalar",
      adultsHint: "12 yoshdan katta",
      children: "Bolalar",
      childrenHint: "2 yoshdan 12 yoshgacha",
      infants: "Chaqaloqlar",
      infantsHint: "2 yoshgacha, alohida o'rindiqsiz",
      moreThanNine: "9 tadan ko'p yo'lovchi kerakmi?",
    },
    ru: {
      passenger: "Пассажир",
      passengersCount: "Количество пассажиров",
      people: "пассажир",
      count: "",
      done: "Готово",
      close: "Закрыть окно пассажиров",
      cabin: "Эконом",
      adults: "Взрослые",
      adultsHint: "старше 12 лет",
      children: "Дети",
      childrenHint: "от 2 до 12 лет",
      infants: "Младенцы",
      infantsHint: "до 2 лет, без отдельного места",
      moreThanNine: "Нужно больше 9 билетов?",
    },
    en: {
      passenger: "Passenger",
      passengersCount: "Passenger count",
      people: "passenger",
      count: "",
      done: "Done",
      close: "Close passenger panel",
      cabin: "Economy",
      adults: "Adults",
      adultsHint: "12 years and older",
      children: "Children",
      childrenHint: "from 2 to 12 years",
      infants: "Infants",
      infantsHint: "under 2 years, no seat",
      moreThanNine: "Need more than 9 tickets?",
    },
  }[language]

  const totalPassengers = useMemo(
    () => Math.max(1, adults + children + infants),
    [adults, children, infants]
  )

  useEffect(() => {
    if (!open || typeof window === "undefined" || window.innerWidth >= 1280) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  useEffect(() => {
    if (pax === totalPassengers) return
    setAdults(Math.max(1, pax))
    setChildren(0)
    setInfants(0)
  }, [pax, totalPassengers])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("keydown", onEscape)

    return () => {
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("keydown", onEscape)
    }
  }, [open])

  const updatePassengers = (
    nextAdults: number,
    nextChildren: number,
    nextInfants: number
  ) => {
    const safeAdults = Math.max(1, nextAdults)
    const safeChildren = Math.max(0, nextChildren)
    const safeInfants = Math.max(0, Math.min(nextInfants, safeAdults))
    const nextTotal = safeAdults + safeChildren + safeInfants

    if (nextTotal > 9) return

    setAdults(safeAdults)
    setChildren(safeChildren)
    setInfants(safeInfants)
    onChange(nextTotal)
  }

  const passengerRows = [
    {
      key: "adults",
      title: safeCopy.adults,
      hint: safeCopy.adultsHint,
      value: adults,
      decrement: () => updatePassengers(adults - 1, children, infants),
      increment: () => updatePassengers(adults + 1, children, infants),
      disableDecrement: adults <= 1,
      disableIncrement: totalPassengers >= 9,
    },
    {
      key: "children",
      title: safeCopy.children,
      hint: safeCopy.childrenHint,
      value: children,
      decrement: () => updatePassengers(adults, children - 1, infants),
      increment: () => updatePassengers(adults, children + 1, infants),
      disableDecrement: children <= 0,
      disableIncrement: totalPassengers >= 9,
    },
    {
      key: "infants",
      title: safeCopy.infants,
      hint: safeCopy.infantsHint,
      value: infants,
      decrement: () => updatePassengers(adults, children, infants - 1),
      increment: () => updatePassengers(adults, children, infants + 1),
      disableDecrement: infants <= 0,
      disableIncrement: totalPassengers >= 9 || infants >= adults,
    },
  ]
  const passengerSummary = valueLabel ?? `${pax} ${safeCopy.people}`

  const fieldShellClass = [
    compact
      ? isDark
        ? "luxury-search-segment luxury-search-divider pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-[18px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-4 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px] sm:min-h-[64px] sm:px-5 xl:min-h-[60px] xl:border-0 xl:bg-transparent xl:shadow-none xl:backdrop-blur-none xl:after:block after:hidden"
        : "luxury-search-segment luxury-search-divider pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-[18px] border border-[#e3edf7] bg-[#fbfdff] px-4 shadow-[0_8px_18px_rgba(17,24,39,0.035)] sm:min-h-[64px] sm:px-5 xl:min-h-[60px] xl:border-0 xl:bg-transparent xl:shadow-none xl:after:block after:hidden"
      : isDark
        ? "pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-2xl border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-4 py-2.5 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px]"
        : "pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-2xl border border-[#e3eaf3] bg-white px-4 py-2.5",
    open
      ? isDark
        ? "z-40 bg-[linear-gradient(180deg,rgba(26,50,94,0.86)_0%,rgba(12,29,64,0.66)_100%)] shadow-[0_18px_42px_rgba(2,8,24,0.34)]"
        : "z-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(247,250,255,0.66)_100%)] shadow-[0_10px_28px_rgba(92,134,211,0.12)]"
      : isDark
        ? "z-10 hover:bg-[linear-gradient(180deg,rgba(24,48,92,0.82)_0%,rgba(11,28,62,0.62)_100%)]"
        : "z-10 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(247,250,255,0.48)_100%)]",
  ].join(" ")

  const dropdownPanelClass = isDark
    ? "fixed inset-x-3 bottom-3 z-[130] rounded-[24px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.96)_0%,rgba(9,24,54,0.94)_100%)] p-4 shadow-[0_28px_80px_rgba(2,8,24,0.48)] backdrop-blur-[22px] xl:absolute xl:left-auto xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:z-[140] xl:w-[360px] xl:rounded-[22px]"
    : "fixed inset-x-3 bottom-3 z-[130] rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(246,249,255,0.96)_100%)] p-4 shadow-[0_24px_60px_rgba(17,24,39,0.16)] xl:absolute xl:left-auto xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:z-[140] xl:w-[360px] xl:rounded-[22px] xl:bg-white"

  const dropdownHandleClass = isDark
    ? "mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#5d7fba]/45 xl:hidden"
    : "mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#d8e1ee] xl:hidden"

  const dropdownTitleClass = isDark
    ? "text-sm font-semibold text-white"
    : "text-sm font-semibold text-[#0f172a]"

  const passengerRowClass = isDark
    ? "flex items-center justify-between gap-3 rounded-[18px] border border-[#5d7fba]/40 bg-[rgba(13,30,62,0.58)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
    : "flex items-center justify-between gap-3 rounded-[18px] border border-[#e7edf6] bg-white/90 px-3 py-3"

  const passengerRowTitleClass = isDark
    ? "text-[15px] font-bold text-white"
    : "text-[15px] font-bold text-[#0f172a]"

  const passengerRowHintClass = isDark
    ? "text-[12px] text-[#b9cceb]"
    : "text-[12px] text-[#64748b]"

  const counterBoxClass = isDark
    ? "flex shrink-0 items-center gap-3 rounded-[14px] border border-[#5d7fba]/38 bg-[rgba(8,22,50,0.52)] px-2.5 py-2"
    : "flex shrink-0 items-center gap-3 rounded-[14px] border border-[#d7e6f7] bg-[#f8fbff] px-2.5 py-2"

  const counterButtonClass = isDark
    ? "grid h-9 w-9 place-items-center rounded-full border-2 border-[#60b7ff] text-xl font-semibold leading-none text-[#8fd0ff] transition hover:bg-[#1d4f8d]/40 disabled:cursor-not-allowed disabled:border-[#4a6799] disabled:text-[#7895bd] disabled:hover:bg-transparent"
    : "grid h-9 w-9 place-items-center rounded-full border-2 border-[#1697ea] text-xl font-semibold leading-none text-[#1697ea] transition hover:bg-[#eaf6ff] disabled:cursor-not-allowed disabled:border-[#bfd8ea] disabled:text-[#bfd8ea] disabled:hover:bg-transparent"

  const counterValueClass = isDark
    ? "min-w-[18px] text-center text-lg font-bold text-white"
    : "min-w-[18px] text-center text-lg font-bold text-[#0f172a]"

  const morePassengersClass = isDark
    ? "mt-4 text-sm font-medium text-[#8fd0ff] underline underline-offset-4"
    : "mt-4 text-sm font-medium text-[#1697ea] underline underline-offset-4"

  const doneButtonClass = isDark
    ? "mt-3 h-11 w-full rounded-[16px] border border-[#5d7fba]/42 bg-[linear-gradient(135deg,#4b79ff_0%,#2f63df_45%,#214fb8_100%)] text-sm font-semibold text-white shadow-[0_16px_34px_rgba(33,79,184,0.32)]"
    : "mt-3 h-11 w-full rounded-[16px] bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-sm font-semibold text-white"

  return (
    <div
      ref={containerRef}
      className={fieldShellClass}
    >
      <button
        type="button"
        onClick={() => {
          onActivate?.()
          setOpen((prev) => !prev)
        }}
        className="flex w-full items-center justify-between gap-2"
      >
        <div className="flex items-center gap-3">
          <span className="luxury-search-icon h-8 w-8 shrink-0 border border-[#d7e6f7] bg-[linear-gradient(180deg,#f7fbff_0%,#eaf4ff_100%)] text-[#2e9df2] shadow-[0_8px_18px_rgba(37,99,235,0.08)]">
            {icon ?? <UsersRound size={18} />}
          </span>
          <div>
            {compact ? (
              <div className="luxury-search-label mb-1 text-[10px] font-semibold uppercase">
                {label ?? safeCopy.passenger}
              </div>
            ) : null}
            <div className="luxury-search-value text-[13px] font-semibold sm:text-[14px]">
              {compact ? `${passengerSummary} - ${safeCopy.cabin}` : passengerSummary}
            </div>
            {!compact ? (
              <div className="luxury-search-subvalue mt-1 text-[11px]">
                {safeCopy.cabin}
              </div>
            ) : null}
          </div>
        </div>
        <ChevronDown
          size={15}
          className={`shrink-0 text-white/56 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={safeCopy.close}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[129] bg-[rgba(15,23,42,0.16)] backdrop-blur-[2px] xl:hidden"
          />
          <div className={dropdownPanelClass}>
            <div className={dropdownHandleClass} />
            <div className={dropdownTitleClass}>
              {safeCopy.passengersCount}
            </div>
            <div className="mt-3 space-y-2.5">
              {passengerRows.map((row) => (
                <div
                  key={row.key}
                  className={passengerRowClass}
                >
                  <div className="min-w-0">
                    <div className={passengerRowTitleClass}>
                      {row.title}
                    </div>
                    <div className={passengerRowHintClass}>{row.hint}</div>
                  </div>
                  <div className={counterBoxClass}>
                    <button
                      type="button"
                      onClick={row.decrement}
                      disabled={row.disableDecrement}
                      className={counterButtonClass}
                    >
                      -
                    </button>
                    <div className={counterValueClass}>
                      {row.value}
                    </div>
                    <button
                      type="button"
                      onClick={row.increment}
                      disabled={row.disableIncrement}
                      className={counterButtonClass}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={morePassengersClass}
            >
              {safeCopy.moreThanNine}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={doneButtonClass}
            >
              {safeCopy.done}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function HelpCard({
  icon,
  title,
  text,
  accent,
  isDark,
  children,
}: {
  icon: ReactNode
  title: string
  text: string
  accent: "blue" | "gold" | "rose"
  isDark: boolean
  children?: ReactNode
}) {
  const accentStyles = {
    blue: isDark
      ? "bg-[linear-gradient(135deg,rgba(66,120,220,0.34)_0%,rgba(28,62,132,0.28)_100%)] border-[#5d7fba]/42 text-[#9fc7ff]"
      : "bg-[linear-gradient(135deg,#f5f9ff_0%,#e8f1ff_100%)] border-[#dce7fb] text-[#2f5ba8]",
    gold: isDark
      ? "bg-[linear-gradient(135deg,rgba(245,192,95,0.2)_0%,rgba(105,74,29,0.16)_100%)] border-[#a98751]/36 text-[#ffd891]"
      : "bg-[linear-gradient(135deg,#fffaf2_0%,#fff2db_100%)] border-[#f0e0b8] text-[#93631a]",
    rose: isDark
      ? "bg-[linear-gradient(135deg,rgba(255,129,170,0.2)_0%,rgba(106,45,75,0.18)_100%)] border-[#a86282]/36 text-[#ffc3d8]"
      : "bg-[linear-gradient(135deg,#fff7f9_0%,#fff0f3_100%)] border-[#f1d9df] text-[#9b506b]",
  } as const

  const cardClass = isDark
    ? "rounded-[30px] border border-[#5d7fba]/42 bg-[linear-gradient(180deg,rgba(18,38,76,0.58)_0%,rgba(9,24,54,0.42)_100%)] p-6 shadow-[0_28px_70px_rgba(2,8,24,0.34)] backdrop-blur-[18px] transition hover:-translate-y-1 hover:shadow-[0_32px_80px_rgba(2,8,24,0.42)]"
    : "rounded-[30px] border border-[#e8eef8] bg-white p-6 shadow-[0_24px_60px_rgba(17,24,39,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(17,24,39,0.12)]"

  return (
    <div className={cardClass}>
      <div
        className={`grid h-24 w-24 place-items-center rounded-full border shadow-[0_14px_30px_rgba(17,24,39,0.06)] ${accentStyles[accent]}`}
      >
        {icon}
      </div>
      <h3 className={`mt-6 text-2xl font-extrabold leading-tight ${isDark ? "text-white" : "text-[#0f172a]"}`}>
        {title}
      </h3>
      <p className={`mt-3 text-sm leading-7 sm:text-[15px] ${isDark ? "text-[#cfe0fb]" : "text-[#475569]"}`}>{text}</p>
      {children}
    </div>
  )
}

