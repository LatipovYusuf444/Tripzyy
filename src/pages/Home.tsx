import { motion } from "framer-motion"
import {
  ArrowRightLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  Headphones,
  MapPinned,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  ShieldCheck,
  Minus,
  Plus,
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
type TravelClassCode = "Y" | "B" | "F"
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
            className="h-full w-full scale-[1.1] object-cover object-[53%_22%] sm:hidden"
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

function TripModeTabs({
  tripMode,
  searchUiCopy,
  setTripMode,
}: {
  tripMode: TripMode
  searchUiCopy: { tripModes: Record<TripMode, string> }
  setTripMode: (mode: TripMode) => void
}) {
  const modes: TripMode[] = ["oneway", "round", "multi"]
  const modeIcons: Record<TripMode, ReactNode> = {
    oneway: <PlaneTakeoff size={15} />,
    round: <ArrowRightLeft size={15} />,
    multi: <ArrowRightLeft size={15} />,
  }

  return (
    <div className="premium-trip-tabs pointer-events-auto mt-3 flex w-full max-w-[620px] items-center rounded-[999px] border border-white/22 bg-[rgba(7,13,28,0.56)] p-1 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:mt-6 sm:p-2">
      {modes.map((mode) => {
        const active = tripMode === mode

        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTripMode(mode)}
            className={[
              "premium-trip-tab flex h-8 flex-1 items-center justify-center gap-1 rounded-full px-1.5 text-[11px] font-semibold leading-none sm:h-11 sm:gap-2 sm:px-3 sm:text-[14px]",
              active
                ? "bg-[linear-gradient(135deg,#2369ff_0%,#0ea5ff_100%)] text-white shadow-[0_12px_28px_rgba(14,165,255,0.36)]"
                : "text-white/82 hover:bg-white/8 hover:text-white",
            ].join(" ")}
          >
            <span className="shrink-0">{modeIcons[mode]}</span>
            {searchUiCopy.tripModes[mode]}
          </button>
        )
      })}
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
  const [tripMode, setTripMode] = useState<TripMode>("oneway")
  const [travelClass, setTravelClass] = useState<TravelClassCode>("Y")
  const [passengerTouched, setPassengerTouched] = useState(false)
  const [activeAirportField, setActiveAirportField] = useState<string | null>(null)
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(() => getStoredTheme())
  const [multiTrips, setMultiTrips] = useState<MultiTrip[]>([
    { from: "", to: "", date: "" },
    { from: "", to: "", date: "" },
  ])
  const [openMultiDateIndex, setOpenMultiDateIndex] = useState<number | null>(null)
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
    const syncTheme = () => setSiteTheme(getStoredTheme())

    syncTheme()
    window.addEventListener("storage", syncTheme)
    window.addEventListener("tripzy-theme-change", syncTheme as EventListener)

    return () => {
      window.removeEventListener("storage", syncTheme)
      window.removeEventListener("tripzy-theme-change", syncTheme as EventListener)
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
      titleStart: "Butun dunyo bo'ylab",
      titleAccent: "aviachiptalar",
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
      titleStart: "Авиабилеты",
      titleAccent: "по всему миру",
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
      titleStart: "Air tickets",
      titleAccent: "around the world",
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
      passengerSummary: "1 yo'lovchi",
      cabin: "ekonom",
      classNames: { Y: "Ekonom", B: "Biznes", F: "Birinchi" } as Record<TravelClassCode, string>,
      search: "Topish",
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
      passengerSummary: "1 пассажир",
      cabin: "эконом",
      classNames: { Y: "Эконом", B: "Бизнес", F: "Первый" } as Record<TravelClassCode, string>,
      search: "Найти",
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
      passengerSummary: "1 passenger",
      cabin: "economy",
      classNames: { Y: "Economy", B: "Business", F: "First" } as Record<TravelClassCode, string>,
      search: "Find",
      invalidRoute: "Select valid origin and destination values.",
      invalidDate: "Select a date.",
      close: "Close",
      airportNotFound: "Airport not found",
    },
  }[language]
  const heroBenefits = {
    uz: [
      { title: "Eng yaxshi narxlar", text: "Kafolatlangan arzon chipta", icon: <ShieldCheck size={18} /> },
      { title: "Ishonchli xizmat", text: "24/7 qo'llab-quvvatlash", icon: <Headphones size={18} /> },
      { title: "Xavfsiz to'lov", text: "100% himoyalangan to'lov", icon: <CreditCard size={18} /> },
      { title: "Tez va oson bron", text: "Bir necha daqiqada chipta", icon: <Clock3 size={18} /> },
    ],
    ru: [
      { title: "Лучшие цены", text: "Гарантированно выгодные билеты", icon: <ShieldCheck size={18} /> },
      { title: "Надежный сервис", text: "Поддержка 24/7", icon: <Headphones size={18} /> },
      { title: "Безопасная оплата", text: "100% защищенный платеж", icon: <CreditCard size={18} /> },
      { title: "Быстрое бронирование", text: "Билет за несколько минут", icon: <Clock3 size={18} /> },
    ],
    en: [
      { title: "Best fares", text: "Guaranteed affordable tickets", icon: <ShieldCheck size={18} /> },
      { title: "Reliable service", text: "24/7 support", icon: <Headphones size={18} /> },
      { title: "Secure payment", text: "100% protected checkout", icon: <CreditCard size={18} /> },
      { title: "Fast booking", text: "Tickets in a few minutes", icon: <Clock3 size={18} /> },
    ],
  }[language]
  const heroSubtitle = {
    uz: "Eng qulay narxlar va ishonchli xizmatlar bilan sayohatingizni boshlang",
    ru: "Начните путешествие с выгодными ценами и надежным сервисом",
    en: "Start your journey with great fares and reliable service",
  }[language]
  const isHeroSearchDark = siteTheme === "dark"

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
        class: travelClass,
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
        class: travelClass,
      }).toString()

      navigate(`/flights?${q}`)
      return
    }

    const q = new URLSearchParams({
      from: resolvedFrom,
      to: resolvedTo,
      date: date.trim(),
      pax: String(Math.max(1, pax)),
      class: travelClass,
    }).toString()

    navigate(`/flights?${q}`)
  }

  const mobileSearchSegmentClass = isHeroSearchDark
    ? "luxury-search-segment pointer-events-auto relative flex min-h-[64px] items-center overflow-visible rounded-[18px] border border-white/10 bg-white/[0.03] px-4 shadow-none backdrop-blur-sm sm:min-h-[70px] xl:min-h-[84px] xl:rounded-none xl:border-0 xl:border-l xl:border-white/18 xl:bg-transparent xl:px-6 xl:shadow-none xl:backdrop-blur-none"
    : "luxury-search-segment pointer-events-auto relative flex min-h-[46px] items-center overflow-visible rounded-[14px] border border-[#d9dde3] bg-white px-3.5 shadow-none backdrop-blur-none sm:min-h-[52px] sm:rounded-[16px] sm:px-4 xl:min-h-[56px] xl:rounded-none xl:border-0 xl:border-l xl:border-[#cfcfcf] xl:bg-transparent xl:px-5 xl:shadow-none xl:backdrop-blur-none"

  const activeMobileSearchSegmentClass = isHeroSearchDark
    ? "z-40 bg-white/[0.07] shadow-[0_18px_42px_rgba(2,8,24,0.36)]"
    : "z-40 bg-white shadow-[0_14px_32px_rgba(92,134,211,0.16)]"

  const idleMobileSearchSegmentClass = isHeroSearchDark
    ? "z-10 hover:bg-white/[0.06]"
    : "z-10 hover:bg-white"

  const multiFlightLabelClass = isHeroSearchDark
    ? "mb-1.5 px-1 text-[12px] font-semibold text-[#d4e2fb]"
    : "mb-1 px-1 text-[11px] font-semibold text-[#0f172a] drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)] sm:mb-1.5 sm:text-[12px]"

  const multiDateSegmentClass = isHeroSearchDark
    ? "luxury-search-segment pointer-events-auto relative flex min-h-[52px] flex-col justify-center overflow-visible rounded-[16px] border border-[#5d7fba]/60 bg-[linear-gradient(180deg,rgba(10,22,52,0.96)_0%,rgba(6,13,34,0.92)_100%)] px-3.5 py-2 shadow-[0_14px_30px_rgba(2,8,24,0.44)] backdrop-blur-[18px] xl:min-h-[54px]"
    : "luxury-search-segment pointer-events-auto relative flex min-h-[46px] flex-col justify-center overflow-visible rounded-[14px] border border-[#d9dde3] bg-white px-3.5 py-2 shadow-none backdrop-blur-none sm:min-h-[52px] sm:rounded-[16px] sm:px-4 xl:min-h-[54px]"

  const activeMultiDateSegmentClass = isHeroSearchDark
    ? "z-40 bg-[linear-gradient(180deg,rgba(12,26,58,0.98)_0%,rgba(7,16,40,0.96)_100%)] shadow-[0_18px_42px_rgba(2,8,24,0.54)]"
    : "z-40 shadow-[0_10px_28px_rgba(92,134,211,0.12)]"

  return (
    <div className="-mt-[86px] relative overflow-x-hidden bg-transparent text-[#1d2430] md:-mt-[94px] xl:-mt-[102px] dark:text-white">
      <HeroSection
        heroBackgroundImage={heroBackgroundImage}
        heroMobileBackgroundImage={heroMobileBackgroundImage}
      >
            <div className="flex min-h-[640px] w-full items-start justify-center pt-24 sm:min-h-[720px] sm:items-start sm:pt-36 lg:min-h-[820px] lg:pt-40 xl:pt-44">
            <motion.div
              initial={{ opacity: 0, y: 38 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.36, ease: "easeOut" }}
              className="relative flex w-full max-w-[1380px] flex-col items-start"
            >
              <h1 className="max-w-[360px] text-left text-[clamp(20px,5.5vw,26px)] font-extrabold leading-[1.08] text-white [font-family:Arial,Helvetica,sans-serif] drop-shadow-[0_12px_36px_rgba(0,0,0,0.58)] sm:max-w-[1120px] sm:whitespace-nowrap sm:text-[clamp(22px,2.4vw,38px)]">
                {heroCopy.titleStart}{" "}
                <span className="block bg-[linear-gradient(90deg,#137dff_0%,#19b7ff_100%)] bg-clip-text text-transparent sm:inline">
                  {heroCopy.titleAccent}
                </span>
              </h1>
              <p className="mt-2 max-w-[430px] text-[14px] font-semibold leading-6 text-white/78 sm:mt-3 sm:max-w-[520px] sm:text-[17px]">
                {heroSubtitle}
              </p>
              <TripModeTabs
                tripMode={tripMode}
                searchUiCopy={searchUiCopy}
                setTripMode={setTripMode}
              />
              <BookingGlassBar
                className={[
                  "relative z-20 mt-3 w-full overflow-visible rounded-[16px] sm:mt-4 sm:rounded-[20px] lg:mt-5",
                  tripMode === "multi"
                    ? isHeroSearchDark
                      ? "border border-white/12 bg-[rgba(7,13,28,0.62)] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5 xl:p-6"
                      : "border border-[#d6d6d6] bg-white/95 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-5 xl:p-6"
                    : "p-0",
                ].join(" ")}
              >
              {tripMode === "multi" ? (
                <div className="space-y-3 sm:space-y-4">
                  {multiTrips.map((trip, index) => (
                    <div key={`trip-${index}`}>
                      <div className={multiFlightLabelClass}>
                        {heroCopy.flightLabel} {index + 1}
                      </div>
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
                          isDark={isHeroSearchDark}
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
                          isDark={isHeroSearchDark}
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
                              classCode={travelClass}
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

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
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
                      valueLabel={
                        language === "ru"
                          ? `${pax} пассажир, ${searchUiCopy.classNames[travelClass]}`
                          : language === "en"
                            ? `${pax} passenger, ${searchUiCopy.classNames[travelClass]}`
                            : `${pax} yo'lovchi, ${searchUiCopy.classNames[travelClass]}`
                      }
                      cabinLabel={searchUiCopy.classNames[travelClass]}
                      travelClass={travelClass}
                      onTravelClassChange={setTravelClass}
                      icon={<UsersRound size={16} />}
                      isDark={isHeroSearchDark}
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
                  data-search-theme={isHeroSearchDark ? "dark" : "light"}
                  className={[
                    "luxury-search-grid home-search-surface relative grid items-stretch gap-3 overflow-visible rounded-[18px] bg-transparent transition-colors duration-300 sm:gap-3 sm:rounded-[20px] xl:gap-0",
                    isHeroSearchDark
                      ? "border border-[#2c4b78]/70 bg-[linear-gradient(180deg,rgba(14,32,67,0.96)_0%,rgba(7,18,44,0.94)_100%)] shadow-[0_22px_58px_rgba(2,8,24,0.34)] backdrop-blur-xl"
                      : "xl:bg-[#EBEBEB]",
                    tripMode === "round"
                      ? "xl:grid-cols-[2.25fr_0.95fr_0.95fr_0.92fr_140px]"
                      : "xl:grid-cols-[2.45fr_1fr_0.95fr_140px]",
                  ].join(" ")}
                >
                    <div className="relative grid items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-0">
                    <button
                      type="button"
                      onClick={() => {
                        const nextFrom = to
                        const nextTo = from
                        setFrom(nextFrom)
                        setTo(nextTo)
                        setActiveAirportField(null)
                      }}
                    className={[
                      "absolute left-1/2 top-1/2 z-10 hidden h-[40px] w-[40px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 active:scale-95 xl:flex",
                      isHeroSearchDark
                        ? "bg-[#132f58] text-[#d8ebff] hover:bg-[#18416f] hover:shadow-[0_10px_22px_rgba(2,8,24,0.28)]"
                        : "bg-[#dedede] text-[#6d6a66] hover:bg-[#d6d6d6] hover:shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
                    ].join(" ")}
                    >
                      <ArrowRightLeft size={16} />
                    </button>
                    <HomeAutocompleteField
                      label={searchUiCopy.from}
                      value={from}
                      placeholder={heroCopy.originPlaceholder}
                      options={locationOptions}
                      onChange={setFrom}
                      icon={<PlaneTakeoff size={16} className={isHeroSearchDark ? "text-[#cfe5ff]" : "text-[#5f6368]"} />}
                      onActivate={() => {
                        setCalendarOpen(false)
                        setOpenMultiDateIndex(null)
                        setActiveAirportField("from")
                      }}
                      onDismiss={() => setActiveAirportField(null)}
                      useInlinePanel
                      active={activeAirportField === "from"}
                      isDark={isHeroSearchDark}
                      compact
                    />
                    <HomeAutocompleteField
                      label={searchUiCopy.to}
                      value={to}
                      placeholder={heroCopy.destinationPlaceholder}
                      options={locationOptions}
                      onChange={setTo}
                      icon={<PlaneLanding size={16} className={isHeroSearchDark ? "text-[#cfe5ff]" : "text-[#5f6368]"} />}
                      onActivate={() => {
                        setCalendarOpen(false)
                        setOpenMultiDateIndex(null)
                        setActiveAirportField("to")
                      }}
                      onDismiss={() => setActiveAirportField(null)}
                      useInlinePanel
                      active={activeAirportField === "to"}
                      isDark={isHeroSearchDark}
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
                    cabinLabel={searchUiCopy.classNames[travelClass]}
                    travelClass={travelClass}
                    onTravelClassChange={setTravelClass}
                    icon={<UsersRound size={16} className={isHeroSearchDark ? "text-[#cfe5ff]" : "text-[#111111]"} />}
                    isDark={isHeroSearchDark}
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
                    }} className="flex w-full items-center justify-start gap-4 xl:h-full">
                      <CalendarDays size={17} className={["shrink-0", isHeroSearchDark ? "text-[#cfe5ff]" : "text-[#5f6368]"].join(" ")} />
                      <div className="min-w-0 text-left">
                        <span className={[
                          "block truncate text-[14px] font-normal leading-none",
                          isHeroSearchDark
                            ? date ? "text-white" : "text-white/58"
                            : date ? "text-[#111111]" : "text-[#8a8a8a]",
                        ].join(" ")}>
                          {date ? formatDisplayDate(date) : searchUiCopy.depart}
                        </span>
                      </div>
                    </button>
                    {calendarOpen ? (
                      <FareCalendarPicker
                        from={resolveLocationCode(from, locationOptions)}
                        to={resolveLocationCode(to, locationOptions)}
                        pax={pax}
                        classCode={travelClass}
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
                          className="flex w-full items-center justify-start gap-4 xl:h-full"
                      >
                        <span className={["text-[15px] leading-none", isHeroSearchDark ? "text-[#cfe5ff]" : "text-[#6d6d6d]"].join(" ")}>→</span>
                        <div className="min-w-0 text-left">
                          <span className={[
                            "block truncate text-[14px] font-normal leading-none",
                            isHeroSearchDark
                              ? returnDate ? "text-white" : "text-white/58"
                              : returnDate ? "text-[#111111]" : "text-[#8a8a8a]",
                          ].join(" ")}>
                            {returnDate ? formatDisplayDate(returnDate) : searchUiCopy.return}
                          </span>
                        </div>
                      </button>
                      {openMultiDateIndex === -2 ? (
                        <FareCalendarPicker
                          from={resolveLocationCode(to, locationOptions)}
                          to={resolveLocationCode(from, locationOptions)}
                          pax={pax}
                          classCode={travelClass}
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
                    className="luxury-search-cta inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] px-4 text-[14px] font-semibold text-white transition-all duration-300 sm:min-h-[48px] xl:m-1.5 xl:min-h-[44px] xl:rounded-[14px]"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    {searchUiCopy.search}
                  </motion.button>
                </div>
              )}

              </BookingGlassBar>
              <div className="mt-8 grid w-full max-w-[1320px] grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {heroBenefits.map((item) => (
                  <div key={item.title} className="flex items-center gap-4 text-white/80">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/8 text-white shadow-[0_12px_26px_rgba(0,0,0,0.18)] backdrop-blur-md">
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-white">{item.title}</span>
                      <span className="mt-1 block text-[13px] text-white/62">{item.text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
            </div>
      </HeroSection>

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
      "premium-lift flex w-full items-center justify-between px-4 py-3 text-left",
      isDark
        ? activeOption
          ? "bg-[rgba(42,82,150,0.36)]"
          : "hover:bg-[rgba(42,82,150,0.28)]"
        : activeOption
          ? "bg-[#EBEBEB]"
          : "hover:bg-[#EBEBEB]",
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
    : "grid h-8 w-8 place-items-center rounded-full border border-[#d6d6d6] text-[#64748b] transition hover:bg-[#EBEBEB] hover:text-[#0f172a]"

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
                  className={`premium-lift flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left ${isDark ? "hover:bg-[rgba(42,82,150,0.28)]" : "hover:bg-[#EBEBEB]"}`}
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
                  <span className={`shrink-0 rounded-[999px] border px-2.5 py-1 text-[11px] font-semibold ${isDark ? "border-[#5d7fba]/40 bg-[rgba(13,30,62,0.58)] text-[#cfe0fb]" : "border-[#d6d6d6] bg-[#EBEBEB] text-[#475569]"}`}>
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
            ? "luxury-search-segment relative flex min-h-[64px] items-center gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 shadow-none backdrop-blur-sm sm:min-h-[70px] xl:min-h-[84px] xl:rounded-none xl:border-0 xl:border-r xl:border-white/18 xl:bg-transparent xl:px-7 xl:shadow-none xl:backdrop-blur-none"
              : "luxury-search-segment relative flex min-h-[46px] items-center gap-3 rounded-[14px] border border-[#d9dde3] bg-white px-3.5 shadow-none backdrop-blur-none sm:min-h-[52px] sm:rounded-[16px] sm:px-4 xl:min-h-[56px] xl:rounded-none xl:border-0 xl:border-r xl:border-[#cfcfcf] xl:bg-transparent xl:px-6 xl:shadow-none xl:backdrop-blur-none"
            : isDark
              ? "relative flex min-h-[46px] items-center gap-3 rounded-[14px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-3 py-2 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px] sm:min-h-[58px] sm:rounded-2xl sm:px-4 sm:py-2.5"
              : "relative flex min-h-[46px] items-center gap-3 rounded-[14px] border border-[#e3eaf3] bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:min-h-[58px] sm:rounded-2xl sm:px-4 sm:py-2.5",
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
        <span className={["grid h-6 w-6 shrink-0 place-items-center xl:h-7 xl:w-7", isDark ? "text-white/72" : "text-[#5f6368]"].join(" ")}>
          {icon ?? <Search size={16} />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          {!compact ? (
            <div className={["mb-1 text-[9px] font-bold uppercase tracking-[0.16em] sm:mb-1.5 sm:text-[10px]", isDark ? "text-white/78" : "luxury-search-label"].join(" ")}>
              {label}
            </div>
          ) : null}
          <input
            className={isDark
              ? "w-full min-w-[96px] bg-transparent text-[16px] font-medium leading-none text-white outline-none placeholder:text-white/58 sm:text-[17px] xl:min-w-[132px] xl:text-[17px]"
              : "w-full min-w-[96px] bg-transparent text-[13px] font-normal leading-none text-[#111111] outline-none placeholder:text-[#8a8a8a] sm:text-[16px] xl:min-w-[132px] xl:text-[16px]"
            }
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
            <div className={`fixed inset-x-3 bottom-3 z-[130] max-h-[62svh] overflow-hidden rounded-[24px] border shadow-[0_24px_60px_rgba(17,24,39,0.16)] xl:absolute xl:left-0 xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:max-h-[320px] xl:rounded-[22px] ${isDark ? "border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.96)_0%,rgba(9,24,54,0.94)_100%)] shadow-[0_28px_80px_rgba(2,8,24,0.48)] backdrop-blur-[22px]" : "border-[#d6d6d6] bg-[#EBEBEB] xl:bg-[#EBEBEB]"}`}>
              <div className={`mx-auto mt-2 h-1.5 w-14 rounded-full xl:hidden ${isDark ? "bg-[#5d7fba]/45" : "bg-[#d8e1ee]"}`} />
              <div className={`border-b px-4 py-3 xl:hidden ${isDark ? "border-[#5d7fba]/34" : "border-[#d6d6d6]"}`}>
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
  cabinLabel,
  travelClass,
  onTravelClassChange,
  icon,
  isDark,
  compact = false,
}: {
  pax: number
  onChange: (value: number) => void
  onActivate?: () => void
  label?: string
  valueLabel?: string
  cabinLabel?: string
  travelClass?: TravelClassCode
  onTravelClassChange?: (value: TravelClassCode) => void
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
      cabinTitle: "Xizmat klassi",
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
      cabinTitle: "Класс обслуживания",
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
      cabinTitle: "Cabin class",
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
  const selectedTravelClass = travelClass ?? "Y"
  const serviceClasses: Array<{ code: TravelClassCode; label: string }> = [
    { code: "Y", label: safeCopy.cabin },
    { code: "B", label: language === "uz" ? "Biznes" : language === "ru" ? "Бизнес" : "Business" },
    { code: "F", label: language === "uz" ? "Birinchi" : language === "ru" ? "Первый" : "First" },
  ]

  const fieldShellClass = [
    compact
      ? isDark
        ? "luxury-search-segment pointer-events-auto relative flex min-h-[64px] items-center overflow-visible rounded-[18px] border border-white/10 bg-white/[0.03] px-4 shadow-none backdrop-blur-sm sm:min-h-[70px] xl:min-h-[84px] xl:rounded-none xl:border-0 xl:border-l xl:border-white/18 xl:bg-transparent xl:px-6 xl:shadow-none xl:backdrop-blur-none"
        : "luxury-search-segment pointer-events-auto relative flex min-h-[46px] items-center overflow-visible rounded-[14px] border border-[#d9dde3] bg-white px-3.5 shadow-none backdrop-blur-none sm:min-h-[52px] sm:rounded-[16px] sm:px-4 xl:min-h-[56px] xl:rounded-none xl:border-0 xl:border-l xl:border-[#cfcfcf] xl:bg-transparent xl:px-5 xl:shadow-none xl:backdrop-blur-none"
      : isDark
        ? "pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-2xl border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] px-4 py-2.5 shadow-[0_16px_38px_rgba(2,8,24,0.28)] backdrop-blur-[18px]"
        : "pointer-events-auto relative flex min-h-[58px] items-center overflow-visible rounded-2xl border border-[#d9dde3] bg-white px-4 py-2.5 shadow-none backdrop-blur-none",
    open
      ? isDark
        ? "z-40 bg-[linear-gradient(180deg,rgba(26,50,94,0.86)_0%,rgba(12,29,64,0.66)_100%)] shadow-[0_18px_42px_rgba(2,8,24,0.34)]"
        : "z-40 bg-white shadow-[0_14px_32px_rgba(92,134,211,0.16)]"
      : isDark
        ? "z-10 hover:bg-[linear-gradient(180deg,rgba(24,48,92,0.82)_0%,rgba(11,28,62,0.62)_100%)]"
        : "z-10 hover:bg-white",
  ].join(" ")

  const dropdownPanelClass =
    "fixed inset-x-4 bottom-4 z-[130] rounded-[18px] border border-[#d6d6d6] bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)] xl:absolute xl:left-auto xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:z-[140] xl:w-[440px] xl:rounded-[18px] xl:border-0 xl:p-4"

  const dropdownHandleClass = isDark
    ? "mx-auto mb-3 h-1 w-10 rounded-full bg-[#5d7fba]/45 xl:hidden"
    : "mx-auto mb-3 h-1 w-10 rounded-full bg-[#c8cdd6] xl:hidden"

  const dropdownTitleClass = "text-[16px] font-semibold text-[#1f1f1f] xl:text-[18px]"

  const passengerRowClass =
    "flex items-center justify-between gap-3 py-2 xl:py-2"

  const passengerRowTitleClass = "text-[15px] font-normal leading-tight text-[#1f1f1f] xl:text-[17px]"

  const passengerRowHintClass = "text-[12px] leading-tight text-[#686868] xl:text-[13px]"

  const counterBoxClass = "flex shrink-0 items-center gap-3 xl:gap-4"

  const counterMinusClass =
    "premium-icon-button grid h-8 w-8 place-items-center rounded-full bg-white text-[#777777] hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:text-[#a9a9a9] xl:h-9 xl:w-9"
  const counterPlusClass =
    "premium-icon-button grid h-8 w-8 place-items-center rounded-full bg-[#e8f4ff] text-[#0878ff] hover:bg-[#dcedff] disabled:cursor-not-allowed disabled:text-[#99c8ff] xl:h-9 xl:w-9"

  const counterValueClass = "min-w-[18px] text-center text-[17px] font-normal text-[#111111] xl:text-[18px]"

  const morePassengersClass = "hidden"

  const doneButtonClass = "hidden"

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
        <div className="flex min-w-0 items-center gap-4">
          <span className={["grid h-8 w-8 shrink-0 place-items-center", isDark ? "text-white/78" : "text-[#111111]"].join(" ")}>
            {icon ?? <UsersRound size={16} />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            {!compact ? (
              <div className={["mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em]", isDark ? "text-white/78" : "luxury-search-label"].join(" ")}>
                {label ?? safeCopy.passenger}
              </div>
            ) : null}
            <div className="flex min-w-0 items-center gap-4">
              <div className={["truncate leading-none", isDark ? "text-[16px] font-medium text-white xl:text-[17px]" : "text-[14px] font-normal text-[#111111] xl:text-[15px]"].join(" ")}>
                {passengerSummary}
              </div>
              <div className={["hidden truncate leading-none xl:block", isDark ? "text-[16px] font-medium text-white/76 xl:text-[17px]" : "text-[14px] font-normal text-[#111111] xl:text-[15px]"].join(" ")}>
                {cabinLabel ?? safeCopy.cabin}
              </div>
            </div>
          </div>
        </div>
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
            <div className="mb-4 flex items-center justify-between">
              <div className={dropdownTitleClass}>
                {safeCopy.passengersCount}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="premium-icon-button grid h-8 w-8 place-items-center rounded-full text-[#111111] hover:bg-[#f3f3f3]"
                aria-label={safeCopy.close}
              >
                <X size={22} strokeWidth={1.8} />
              </button>
            </div>
            <div className="space-y-2">
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
                      className={counterMinusClass}
                    >
                      <Minus size={18} strokeWidth={1.8} />
                    </button>
                    <div className={counterValueClass}>
                      {row.value}
                    </div>
                    <button
                      type="button"
                      onClick={row.increment}
                      disabled={row.disableIncrement}
                      className={counterPlusClass}
                    >
                      <Plus size={20} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[15px] font-semibold text-[#1f1f1f] xl:mt-5 xl:text-[17px]">
              {safeCopy.cabinTitle}
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 xl:mt-3">
              {serviceClasses.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onTravelClassChange?.(item.code)}
                  className={[
                    "premium-choice-button h-9 rounded-full border bg-white px-2 text-[13px] font-medium xl:h-10 xl:text-[15px]",
                    selectedTravelClass === item.code
                      ? "border-[#0878ff] text-[#0878ff]"
                      : "border-[#d6d6d6] text-[#1f1f1f] hover:border-[#0878ff] hover:text-[#0878ff]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
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


