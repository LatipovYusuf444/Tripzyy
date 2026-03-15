import { motion } from "framer-motion"
import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CreditCard,
  RefreshCcw,
  Search,
  Send,
  Ticket,
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble"
import FareCalendarPicker from "@/components/site/FareCalendarPicker"
import heroDesktopImage from "@/assets/svg/aviation-tour-logo.webp"
import heroMobileImage from "@/assets/svg/emirates.webp"
import { AIRPORT_CACHE_KEY, DEFAULT_AIRPORT_DIRECTORY } from "@/shared/air/airportDirectory"
import { FEATURED_ROUTE_CARDS_KEY, type FeaturedRouteCard } from "@/shared/air/featuredRoutes"
import { bookingCart } from "@/shared/store/bookingCart"
import { formatMoney } from "@/lib/money"
import { useI18n } from "@/shared/i18n/i18n"

type LocationOption = { code: string; name: string; searchText: string }
const LAST_SUCCESSFUL_SEARCH_KEY = "last_successful_air_search_v1"
const LAST_AIR_RESULT_META_KEY = "last_air_result_meta_v1"
const DEFAULT_HOME_SEARCH = {
  from: "TAS",
  to: "IST",
  pax: 1,
}

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

  const firstMatch = options.find((option) => option.searchText.includes(normalized))
  return firstMatch?.code ?? (upper.length <= 3 ? upper : "")
}

export default function Home() {
  const navigate = useNavigate()
  const { language } = useI18n()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [pax, setPax] = useState(1)
  const [airportLabels, setAirportLabels] = useState<Record<string, string>>(DEFAULT_AIRPORT_DIRECTORY)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(-1)
  const [faqQuestion, setFaqQuestion] = useState("")
  const [lastResultMeta, setLastResultMeta] = useState<null | {
    from: string
    to: string
    date: string
    pax: number
    count: number
    info?: string
    updatedAt?: string
  }>(null)
  const [featuredRoutes, setFeaturedRoutes] = useState<FeaturedRouteCard[]>([])
  const [openDestination, setOpenDestination] = useState<string | null>(null)

  const copy = {
    uz: {
      titleLines: ["Xalqaro avia qatnovlar", "va tezkor bron"],
      subtitle: "Jonli tariflar, ishonchli aviakompaniyalar va qulay bron jarayoni bir ekranda jamlangan.",
      chips: ["Jonli tarif", "Aviakompaniyalar", "Tezkor bron"],
      totalFlights: "Jami",
      flightsSuffix: "ta reys",
      from: "Qayerdan",
      to: "Qayerga",
      date: "Qachon",
      passenger: "Yo'lovchi",
      selectDate: "Sanani tanlang",
      priceCalendar: "Narxli kalendar",
      search: "Bilet topish",
      invalidRoute: "Qayerdan va qayerga uchun to'g'ri variantni tanlang.",
      invalidDate: "Sanani tanlang.",
      popularBadge: "Populyarnye napravleniya",
      popularTitleA: "Real backenddan",
      popularTitleB: "yig'ilgan yo'nalishlar",
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
          answer: "Qidiruvda aeroportning IATA kodlarini kiriting: masalan, Toshkent uchun TAS, Istanbul uchun SAW yoki IST. Sana esa YYYY-MM-DD formatida bo'lishi kerak.",
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
      titleLines: ["Премиальный поиск авиабилетов", "и быстрое бронирование"],
      subtitle: "Реальные рейсы, точные цены и упрощенный процесс бронирования.",
      chips: ["Реальная цена", "Интерфейс на узбекском", "Быстрое бронирование"],
      totalFlights: "Всего",
      flightsSuffix: "рейсов",
      from: "Откуда",
      to: "Куда",
      date: "Когда",
      passenger: "Пассажир",
      selectDate: "Выберите дату",
      priceCalendar: "Календарь цен",
      search: "Найти билет",
      invalidRoute: "Выберите корректные значения для пунктов отправления и прибытия.",
      invalidDate: "Выберите дату.",
      popularBadge: "Популярные направления",
      popularTitleA: "Направления, собранные",
      popularTitleB: "из реального backend",
      popularDesc: "Каждый блок сгруппирован по destination. При нажатии на строку открывается оформление именно этого рейса.",
      fromPrice: "от",
      latestUpdate: "Последнее обновление",
      viewFare: "Посмотреть тариф",
      faqBadge: "Частые вопросы",
      faqTitleA: "Самые важные вопросы",
      faqTitleB: "о перелете и бронировании",
      faqDesc: "Мы собрали основные вопросы по поиску билетов, бронированию, багажу, оплате и сотрудничеству.",
      ask: "Есть вопрос?",
      askPlaceholder: "Например: как работает лимит багажа?",
      send: "Отправить",
      helpBadge: "Помощь и оплата",
      helpTitleA: "Важные инструкции",
      helpTitleB: "перед перелетом",
      helpDesc: "Здесь можно быстро найти информацию об оплате, электронном билете и изменении рейса.",
      helpCards: [
        {
          title: "Безопасная оплата на сайте",
          text: "Оплачивайте авиабилеты и услуги удобным для вас способом.",
          extra: "",
        },
        {
          title: "Что такое электронный билет?",
          text: "После подтверждения брони все данные рейса формируются в электронном виде.",
          extra: "В одном месте отображаются маршрут, время, багаж, тариф и данные пассажира.",
        },
        {
          title: "Как работает обмен рейса?",
          text: "В зависимости от правил тарифа можно изменить дату, направление или тип услуги.",
          extra: "Служба поддержки быстро сориентирует по изменению рейса.",
        },
      ],
      faqItems: [
        {
          question: "Какие коды нужно вводить при поиске авиабилета?",
          answer: "Используйте IATA-коды аэропортов: например, TAS для Ташкента, SAW или IST для Стамбула. Дата вводится в формате YYYY-MM-DD.",
        },
        {
          question: "Как проходит процесс бронирования?",
          answer: "Сначала выбирается рейс, затем вводятся данные пассажира и подтверждается оформление. Каждый шаг показывается отдельно.",
        },
        {
          question: "Где отображается информация о багаже и услугах?",
          answer: "На карточке рейса видны багаж, время, длительность и тариф. В деталях отображаются дополнительные услуги.",
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
          answer: "Use airport IATA codes: for example TAS for Tashkent, SAW or IST for Istanbul. The date should be in YYYY-MM-DD format.",
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
    try {
      const stored = localStorage.getItem(LAST_SUCCESSFUL_SEARCH_KEY)
      if (!stored) {
        setFrom(DEFAULT_HOME_SEARCH.from)
        setTo(DEFAULT_HOME_SEARCH.to)
        setDate(getDefaultHomeDate())
        setPax(DEFAULT_HOME_SEARCH.pax)
        return
      }
      const parsed = JSON.parse(stored) as Partial<{
        from: string
        to: string
        date: string
        pax: number
      }>
      setFrom(parsed.from || DEFAULT_HOME_SEARCH.from)
      setTo(parsed.to || DEFAULT_HOME_SEARCH.to)
      setDate(parsed.date || getDefaultHomeDate())
      setPax(parsed.pax && parsed.pax >= 1 ? parsed.pax : DEFAULT_HOME_SEARCH.pax)
    } catch {
      setFrom(DEFAULT_HOME_SEARCH.from)
      setTo(DEFAULT_HOME_SEARCH.to)
      setDate(getDefaultHomeDate())
      setPax(DEFAULT_HOME_SEARCH.pax)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_AIR_RESULT_META_KEY)
      if (!stored) return
      setLastResultMeta(JSON.parse(stored))
    } catch {
      setLastResultMeta(null)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FEATURED_ROUTE_CARDS_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as FeaturedRouteCard[]
      setFeaturedRoutes(Array.isArray(parsed) ? parsed : [])
    } catch {
      setFeaturedRoutes([])
    }
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

  const groupedDestinations = useMemo(() => {
    const groups = new Map<
      string,
      {
        destinationCode: string
        destinationLabel: string
        items: FeaturedRouteCard[]
        minPrice: number
      }
    >()

    for (const item of featuredRoutes) {
      const key = item.to
      const existing = groups.get(key)
      if (!existing) {
        groups.set(key, {
          destinationCode: item.to,
          destinationLabel: item.toLabel,
          items: [item],
          minPrice: item.price,
        })
        continue
      }

      existing.items.push(item)
      existing.minPrice = Math.min(existing.minPrice, item.price)
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => a.price - b.price).slice(0, 10),
      }))
      .sort((a, b) => a.minPrice - b.minPrice)
      .slice(0, 6)
  }, [featuredRoutes])

  useEffect(() => {
    if (!groupedDestinations.length) {
      setOpenDestination(null)
      return
    }

    setOpenDestination((prev) => prev ?? groupedDestinations[0].destinationCode)
  }, [groupedDestinations])

  const onSearch = () => {
    const resolvedFrom = resolveLocationCode(from, locationOptions)
    const resolvedTo = resolveLocationCode(to, locationOptions)

    if (!resolvedFrom || !resolvedTo) {
      toast.error(copy.invalidRoute)
      return
    }
    if (!date.trim()) {
      toast.error(copy.invalidDate)
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

  const onBookFeaturedRoute = (route: FeaturedRouteCard) => {
    const cart = bookingCart.get()
    bookingCart.set({
      ...cart,
      flightId: route.flightId,
      route: `${route.fromLabel} → ${route.toLabel}`,
      date: route.date,
      pax: Math.max(1, route.pax),
      amount: route.price,
      currency: route.currency,
      airline: route.airline,
      flightNo: `${route.airline}-${route.depart}-${route.arrive}`,
      baggage: route.baggage,
      carryOn: route.carryOn,
      passengers: cart.passengers ?? [],
    })
    navigate("/passengers")
  }

  return (
    <div className="overflow-x-hidden bg-[linear-gradient(180deg,#dfe5ea_0%,#eef3f7_18%,#f8fbff_62%,#eaf0f7_100%)] text-[#1d2430] dark:bg-[linear-gradient(180deg,#0d1830_0%,#111e39_18%,#15254a_62%,#11203d_100%)] dark:text-white">
      <section className="overflow-hidden pt-[76px] md:pt-[82px]">
        <div className="bg-[#eef3f7] shadow-[0_18px_48px_rgba(16,24,40,0.07)] dark:bg-[rgba(10,20,42,0.34)] dark:shadow-[0_22px_60px_rgba(4,10,28,0.34)]">
        <div className="relative min-h-[660px] w-full overflow-hidden sm:min-h-[700px] lg:min-h-[740px]">
          <div className="absolute inset-0">
            <motion.img
              src={heroDesktopImage}
              alt="Aviation tour hero"
              initial={{ scale: 1.12, opacity: 0.98 }}
              animate={{ scale: [1.12, 1.16, 1.12], opacity: [0.98, 1, 0.98] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 hidden h-full w-full object-cover object-[50%_56%] md:block"
            />
            <motion.img
              src={heroMobileImage}
              alt="Emirates mobile hero"
              initial={{ scale: 1.02, opacity: 0.98 }}
              animate={{ scale: [1.02, 1.06, 1.02], opacity: [0.98, 1, 0.98] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full object-cover object-[50%_48%] md:hidden"
            />
            <div className="absolute inset-0 dark:bg-[linear-gradient(180deg,rgba(5,12,28,0.16)_0%,rgba(5,12,28,0.10)_48%,rgba(5,12,28,0.28)_100%)]" />
          </div>
          <BubbleBackground
            interactive
            colors={{
              first: "255,255,255",
              second: "189,216,255",
              third: "136,194,255",
              fourth: "246,250,255",
              fifth: "164,208,255",
              sixth: "214,234,255",
            }}
            className="pointer-events-none absolute inset-0 hidden opacity-0 dark:opacity-45 md:block"
          />
          <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_left_center,rgba(75,114,201,0.18)_0%,rgba(27,48,91,0.08)_24%,rgba(4,10,28,0)_50%)]" />
          <motion.div
            aria-hidden
            initial={{ opacity: 0.2, scale: 0.92 }}
            animate={{ opacity: [0.2, 0.32, 0.2], scale: [0.92, 1.02, 0.92] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute right-[6%] top-[10%] hidden h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(128,185,255,0.2)_0%,rgba(128,185,255,0.08)_44%,transparent_74%)] blur-3xl dark:block md:h-[320px] md:w-[320px]"
          />

          <div className="relative z-10 flex items-center justify-center px-4 py-14 sm:px-6 sm:py-16 md:px-12 md:py-18 xl:px-16 xl:py-20">
            <div className="flex w-full justify-center">
              <div className="w-full max-w-[1160px] rounded-[28px] bg-transparent px-4 py-16 dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.10)_0%,rgba(16,30,57,0.05)_48%,rgba(10,20,42,0.02)_100%)] sm:px-6 sm:py-18 md:px-8 md:py-20">
                <motion.h1
                  className="mx-auto max-w-[920px] text-center text-[34px] font-extrabold leading-[0.96] tracking-[-0.06em] text-[#1d2a3d] dark:text-white sm:text-[42px] md:text-[50px] md:[text-shadow:0_10px_34px_rgba(255,255,255,0.16)] xl:text-[56px]"
                >
                  {copy.titleLines.map((line, lineIndex) => (
                    <span key={line} className="block">
                      {line.split("").map((char, charIndex) => (
                        <motion.span
                          key={`${lineIndex}-${charIndex}-${char}`}
                          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.45,
                            delay: lineIndex * 0.16 + charIndex * 0.018,
                            ease: "easeOut",
                          }}
                          className="inline-block"
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                    </span>
                  ))}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.28, ease: "easeOut" }}
                  className="mx-auto mt-5 max-w-[700px] text-center text-[18px] leading-8 text-[#45576f] dark:text-[#d7e5ff] sm:text-[19px] md:mt-5 md:text-[20px] md:[text-shadow:0_8px_22px_rgba(255,255,255,0.12)]"
                >
                  {copy.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.36, ease: "easeOut" }}
                  className="mt-6 flex flex-wrap justify-center gap-3"
                >
                  {copy.chips.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/55 bg-white/78 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#37475e] backdrop-blur-md dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.44)] dark:text-[#deebff] dark:shadow-[0_14px_24px_rgba(4,10,28,0.22)]"
                    >
                      {item}
                    </span>
                  ))}
                </motion.div>

                {lastResultMeta ? (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.42, ease: "easeOut" }}
                    className="mt-4 flex justify-center"
                  >
                  <div className="inline-flex flex-wrap items-center gap-2 rounded-[20px] border border-[#dbe5f0] bg-white/80 px-4 py-3 text-sm text-[#52627b] shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(19,35,67,0.82)] dark:text-[#d4e2fb] dark:shadow-[0_14px_28px_rgba(4,10,28,0.26)]">
                    <span className="font-semibold text-[#1d2430] dark:text-white">
                      {copy.totalFlights} {lastResultMeta.count} {copy.flightsSuffix}
                    </span>
                    <span className="text-[#8a97aa]">•</span>
                    <span>
                      {lastResultMeta.from} → {lastResultMeta.to}
                    </span>
                    <span className="text-[#8a97aa]">•</span>
                    <span>{lastResultMeta.date}</span>
                  </div>
                  </motion.div>
                ) : null}

                <motion.div
                  initial={{ opacity: 0, y: 34, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.65, delay: 0.5, ease: "easeOut" }}
                  className="relative mx-auto mt-9 max-w-[1120px] overflow-visible rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.90)_0%,rgba(246,249,255,0.84)_100%)] p-3 shadow-[0_22px_60px_rgba(22,31,48,0.12)] backdrop-blur-md dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(13,24,48,0.78)_0%,rgba(17,31,60,0.74)_100%)] dark:shadow-[0_26px_70px_rgba(4,10,28,0.46)] md:mt-12 md:rounded-[30px] md:p-4"
                >
                  <div className="grid overflow-visible gap-2 rounded-[24px] border border-transparent bg-transparent shadow-none dark:bg-transparent xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,0.9fr)_260px]">
                    <HomeAutocompleteField label={copy.from} value={from} placeholder="Toshkent" options={locationOptions} onChange={setFrom} />
                    <HomeAutocompleteField label={copy.to} value={to} placeholder="Quda" options={locationOptions} onChange={setTo} />
                    <div className="relative flex min-h-[68px] flex-col justify-center rounded-[20px] bg-white/92 px-5 py-3 shadow-[0_14px_32px_rgba(18,28,45,0.07)] dark:bg-[rgba(14,26,50,0.92)] dark:shadow-[0_18px_36px_rgba(4,10,28,0.34)] xl:h-[74px] xl:min-h-0 xl:px-6 xl:py-0">
                      <button
                        type="button"
                        onClick={() => setCalendarOpen((prev) => !prev)}
                        className="text-left"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a879c] dark:text-[#9fb4d7]">
                          <span>{copy.date}</span>
                          <CalendarDays size={16} className="text-[#2474e8]" />
                        </div>
                        <div className="mt-1 text-[14px] font-semibold text-[#1b2433] dark:text-white xl:text-[17px]">
                          {date || copy.selectDate}
                        </div>
                        <div className="text-[13px] text-[#8d98aa] dark:text-[#a5b8d8]">{copy.priceCalendar}</div>
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
                        />
                      ) : null}
                    </div>
                    <PassengerField pax={pax} onChange={setPax} />
                    <motion.button
                      type="button"
                      onClick={onSearch}
                      className="inline-flex h-[72px] items-center justify-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,#ff8a33_0%,#ff7424_100%)] px-7 text-[16px] font-bold text-white shadow-[0_18px_45px_rgba(255,116,36,0.28)] transition hover:brightness-110 dark:bg-[linear-gradient(135deg,#3f72ff_0%,#1d4fd7_100%)] dark:shadow-[0_18px_45px_rgba(35,84,218,0.34)] xl:h-[74px] xl:text-[18px] xl:rounded-[24px]"
                      whileHover={{ y: -1, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <Search size={18} />
                      {copy.search}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {groupedDestinations.length ? (
        <section className="relative px-4 pb-6 pt-12 sm:px-6 md:px-10 lg:px-14">
          <div className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-32 max-w-[920px] rounded-full bg-[radial-gradient(circle,rgba(78,120,198,0.14)_0%,rgba(78,120,198,0)_72%)] blur-3xl" />
          <div className="relative mx-auto max-w-[1180px]">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b7b92] shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(19,35,67,0.82)] dark:text-[#d4e2fb]">
                  <Ticket size={14} />
                  {copy.popularBadge}
                </div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#1d2430] dark:text-white sm:text-4xl">
                  {copy.popularTitleA}
                  <span className="block bg-[linear-gradient(135deg,#3a6db8_0%,#7a5a98_48%,#d97753_100%)] bg-clip-text text-transparent">
                    {copy.popularTitleB}
                  </span>
                </h2>
                <p className="mt-3 max-w-[700px] text-sm leading-7 text-[#627188] dark:text-[#d2e0f8] sm:text-base">
                  {copy.popularDesc}
                </p>
              </div>
              {lastResultMeta ? (
                <div className="rounded-[20px] border border-[#dbe5f0] bg-white/80 px-4 py-3 text-sm text-[#52627b] shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(19,35,67,0.82)] dark:text-[#d4e2fb]">
                  {copy.latestUpdate}: <span className="font-semibold text-[#1d2430] dark:text-white">{lastResultMeta.date}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-3">
              {groupedDestinations.map((group, index) => (
                <motion.div
                  key={group.destinationCode}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.38, delay: index * 0.06, ease: "easeOut" }}
                  className="overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.92)_100%)] p-5 text-left shadow-[0_20px_50px_rgba(17,24,39,0.08)] transition dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_24px_54px_rgba(4,10,28,0.38)]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDestination((prev) =>
                        prev === group.destinationCode ? null : group.destinationCode
                      )
                    }
                    className="flex w-full items-start justify-between gap-4"
                  >
                    <div>
                      <div className="text-[30px] font-black tracking-[-0.04em] text-[#1d2430] dark:text-white">
                        {group.destinationLabel}
                      </div>
                      <div className="mt-1 text-sm text-[#627188] dark:text-[#c7d8f6]">
                        {group.destinationCode} · от {formatMoney(group.minPrice, group.items[0]?.currency)}
                      </div>
                    </div>
                    <div className="rounded-full border border-[#e1e9f4] bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c7c93] dark:border-[#436293] dark:bg-[rgba(27,46,85,0.84)] dark:text-[#d8e5ff]">
                      {openDestination === group.destinationCode ? "Yopish" : "Ochish"}
                    </div>
                  </button>

                  <div className="mt-5 space-y-2">
                    {group.items
                      .slice(0, openDestination === group.destinationCode ? 10 : 5)
                      .map((route) => (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => onBookFeaturedRoute(route)}
                          className="flex w-full items-center justify-between gap-4 rounded-[18px] border border-[#e8eef6] bg-white/88 px-4 py-3 text-left transition hover:border-[#d8e5f8] hover:bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.82)] dark:hover:border-[#4e72ab] dark:hover:bg-[linear-gradient(180deg,rgba(30,53,98,0.94)_0%,rgba(24,43,79,0.96)_100%)]"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-[15px] font-semibold text-[#1d2430] dark:text-white">
                              {route.fromLabel} — {route.toLabel}
                            </div>
                            <div className="mt-1 text-xs text-[#7b8aa0] dark:text-[#a8bcde]">
                              {route.depart} → {route.arrive} · {route.airlineName}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[15px] font-bold text-[#1d67ff] dark:text-[#8cb9ff]">
                              от {formatMoney(route.price, route.currency)}
                            </div>
                            <div className="mt-1 text-xs text-[#8a97aa] dark:text-[#9ab0d2]">
                              {route.stopsCount === 0 ? "Direct" : `${route.stopsCount} stop`}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>

                  {openDestination === group.destinationCode ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8eef6] pt-4 text-xs text-[#5c6c84] dark:border-[#30476f] dark:text-[#bdd0ef]">
                      <span className="rounded-full bg-[#f3f7fb] px-3 py-1.5 dark:bg-[rgba(42,64,110,0.34)]">
                        {group.items.length} ta real yo'nalish
                      </span>
                      <span className="rounded-full bg-[#f3f7fb] px-3 py-1.5 dark:bg-[rgba(42,64,110,0.34)]">
                        Eng arzon: {formatMoney(group.minPrice, group.items[0]?.currency)}
                      </span>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative px-4 pb-18 pt-14 sm:px-6 md:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-40 max-w-[980px] rounded-full bg-[radial-gradient(circle,rgba(92,134,211,0.12)_0%,rgba(92,134,211,0)_72%)] blur-3xl" />
        <div className="relative mx-auto max-w-[1120px]">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b7b92] shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(19,35,67,0.82)] dark:text-[#d4e2fb]">
              <CircleHelp size={14} />
              {copy.faqBadge}
            </div>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#1d2430] dark:text-white sm:text-4xl md:text-5xl">
              {copy.faqTitleA}
              <span className="block bg-[linear-gradient(135deg,#3a6db8_0%,#7a5a98_48%,#d97753_100%)] bg-clip-text text-transparent">
                {copy.faqTitleB}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-[720px] text-sm leading-7 text-[#627188] dark:text-[#d2e0f8] sm:text-base">
              {copy.faqDesc}
            </p>
          </div>

          <div className="mt-10 rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.92)_100%)] p-5 shadow-[0_26px_70px_rgba(17,24,39,0.08)] backdrop-blur-xl dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_26px_70px_rgba(4,10,28,0.42)] sm:p-6 md:p-7">
            <div className="grid gap-4 md:grid-cols-[1fr_170px]">
              <label className="block">
                <div className="mb-2 text-sm font-semibold text-[#52627b] dark:text-[#d4e2fb]">
                  {copy.ask}
                </div>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#dbe3ef] bg-white px-4 shadow-[0_8px_20px_rgba(17,24,39,0.04)] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.3)]">
                  <CircleHelp size={18} className="text-[#8da0ba] dark:text-[#9eb5db]" />
                  <input
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    className="h-full w-full bg-transparent text-[15px] font-medium text-[#1d2430] outline-none placeholder:text-[#9aa8bb] dark:text-white dark:placeholder:text-[#8ea5cb]"
                    placeholder={copy.askPlaceholder}
                  />
                </div>
              </label>

              <button
                type="button"
                className="inline-flex h-14 items-center justify-center gap-2 self-end rounded-2xl border border-[#1a2231]/10 bg-[linear-gradient(135deg,#4d9fe6_0%,#3f87d4_45%,#2a6fb8_100%)] px-6 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(63,135,212,0.22)] transition hover:brightness-110 dark:border-[#36507f] dark:bg-[linear-gradient(135deg,#4b79ff_0%,#2f63df_45%,#214fb8_100%)] dark:shadow-[0_18px_40px_rgba(33,79,184,0.34)]"
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
                    className="overflow-hidden rounded-[22px] border border-[#dde5f0] bg-white/80 shadow-[0_10px_24px_rgba(17,24,39,0.04)] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.82)] dark:shadow-[0_14px_32px_rgba(4,10,28,0.26)]"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? -1 : index)}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#f8fbff] dark:hover:bg-[rgba(28,46,84,0.92)] sm:px-5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#edf5ff_0%,#dceaff_100%)] text-[#4790d8] dark:bg-[linear-gradient(135deg,rgba(57,95,170,0.34)_0%,rgba(43,72,128,0.38)_100%)] dark:text-[#9dc1ff]">
                        <CircleHelp size={16} />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-[#314055] dark:text-white sm:text-base">
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
                      <div className="border-t border-[#eef3f8] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_100%)] px-5 py-4 text-sm leading-7 text-[#627188] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(27,46,84,0.9)_0%,rgba(21,37,69,0.96)_100%)] dark:text-[#d2e0f8]">
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

      <section className="relative px-4 pb-20 sm:px-6 md:px-10 lg:px-14">
        <div className="relative mx-auto max-w-[1120px]">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b7b92] shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(19,35,67,0.82)] dark:text-[#d4e2fb]">
              <CreditCard size={14} />
              {copy.helpBadge}
            </div>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#1d2430] dark:text-white sm:text-4xl md:text-5xl">
              {copy.helpTitleA}
              <span className="block bg-[linear-gradient(135deg,#3a6db8_0%,#7a5a98_48%,#d97753_100%)] bg-clip-text text-transparent">
                {copy.helpTitleB}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-[760px] text-sm leading-7 text-[#627188] dark:text-[#d2e0f8] sm:text-base">
              {copy.helpDesc}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <HelpCard
              icon={<CreditCard size={34} />}
              accent="blue"
              title={copy.helpCards[0].title}
              text={copy.helpCards[0].text}
            >
              <div className="mt-4 flex flex-wrap gap-2">
                {["Click", "Visa", "Mastercard", "Humo"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#d7e3f5] bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#45628f] shadow-[0_8px_18px_rgba(17,24,39,0.04)] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-[#d4e2fb] dark:shadow-[0_12px_24px_rgba(4,10,28,0.24)]"
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
            >
              <p className="mt-4 text-sm leading-6 text-[#627188] dark:text-[#d2e0f8]">
                {copy.helpCards[1].extra}
              </p>
            </HelpCard>

            <HelpCard
              icon={<RefreshCcw size={34} />}
              accent="rose"
              title={copy.helpCards[2].title}
              text={copy.helpCards[2].text}
            >
              <p className="mt-4 text-sm leading-6 text-[#627188] dark:text-[#d2e0f8]">
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
}: {
  label: string
  value: string
  placeholder: string
  options: LocationOption[]
  onChange: (value: string) => void
}) {
  const { language } = useI18n()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const copy = {
    uz: { select: "tanlash", noResult: "Mos airport yoki shahar topilmadi.", chooseOption: "Variantni tanlang", close: "Ro'yxatni yopish" },
    ru: { select: "выбрать", noResult: "Подходящий аэропорт или город не найден.", chooseOption: "Выберите вариант", close: "Закрыть список" },
    en: { select: "select", noResult: "No matching airport or city found.", chooseOption: "Choose an option", close: "Close list" },
  }[language]

  const filteredOptions = useMemo(() => {
    const query = normalizeText(value)
    if (!query) return options.slice(0, 8)
    return options.filter((option) => option.searchText.includes(query)).slice(0, 8)
  }, [options, value])

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  useEffect(() => {
    if (!open || typeof window === "undefined" || window.innerWidth >= 1280) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  const pickOption = (option: LocationOption) => {
    onChange(`${option.code} - ${option.name}`)
    setOpen(false)
    setActiveIndex(0)
  }

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
        className={[
          "flex w-full items-center justify-between px-4 py-3 text-left transition",
          activeIndex === index ? "bg-[#f8fbff]" : "hover:bg-[#f8fbff]",
        ].join(" ")}
      >
        <span>
          <span className="block text-sm font-semibold text-[#1d2430]">{option.name}</span>
          <span className="block text-xs uppercase tracking-[0.14em] text-[#7f8ca0]">{option.code}</span>
        </span>
        <span className="rounded-full bg-[#f3f7fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#637791]">
          {copy.select}
        </span>
      </button>
    ))
  ) : (
    <div className="px-4 py-4 text-sm text-[#627188]">
      {copy.noResult}
    </div>
  )

  return (
    <label className="relative flex min-h-[68px] flex-col justify-center rounded-[20px] bg-white/92 px-5 py-3 shadow-[0_14px_32px_rgba(18,28,45,0.07)] dark:bg-[rgba(14,26,50,0.92)] dark:shadow-[0_18px_36px_rgba(4,10,28,0.34)] xl:h-[74px] xl:min-h-0 xl:px-6 xl:py-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a879c] dark:text-[#9fb4d7]">
        {label}
      </div>
      <input
        className="mt-1 w-full bg-transparent text-[14px] font-semibold text-[#1b2433] outline-none placeholder:text-[#9aa8bb] dark:text-white dark:placeholder:text-[#8ea4c7] xl:text-[17px]"
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
          if (e.key === "Escape") setOpen(false)
        }}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
      />
      {filteredOptions[0] && value.trim() ? (
        <div className="mt-0.5 text-[13px] font-semibold text-[#8d98aa] dark:text-[#a5b8d8]">{filteredOptions[0].code}</div>
      ) : null}
      {open ? (
        <>
          <button
            type="button"
            aria-label={copy.close}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[129] bg-[rgba(15,23,42,0.16)] backdrop-blur-[2px] xl:hidden"
          />
          <div className="fixed inset-x-3 bottom-3 z-[130] max-h-[62svh] overflow-hidden rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.96)_100%)] shadow-[0_24px_60px_rgba(17,24,39,0.16)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(13,24,48,0.98)_0%,rgba(18,32,60,0.97)_100%)] dark:shadow-[0_24px_60px_rgba(4,10,28,0.42)] xl:absolute xl:left-0 xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:max-h-[320px] xl:rounded-[22px] xl:bg-white dark:xl:bg-[rgba(18,32,60,0.97)]">
            <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-[#d8e1ee] xl:hidden" />
            <div className="border-b border-[#eef3f8] px-4 py-3 xl:hidden">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a879c] dark:text-[#9fb4d7]">
                {label}
              </div>
              <div className="mt-1 text-sm font-semibold text-[#1d2430] dark:text-white">
                {copy.chooseOption}
              </div>
            </div>
            <div className="max-h-[calc(62svh-70px)] overflow-y-auto xl:max-h-[320px]">
              {optionList}
            </div>
          </div>
        </>
      ) : null}
    </label>
  )
}

function PassengerField({
  pax,
  onChange,
}: {
  pax: number
  onChange: (value: number) => void
}) {
  const { language } = useI18n()
  const [open, setOpen] = useState(false)
  const copy = {
    uz: { passenger: "Yo'lovchi", passengersCount: "Yo'lovchilar soni", people: "yo'lovchi", count: "ta", done: "Tayyor", close: "Yo'lovchi oynasini yopish" },
    ru: { passenger: "Пассажир", passengersCount: "Количество пассажиров", people: "пассажир", count: "", done: "Готово", close: "Закрыть окно пассажиров" },
    en: { passenger: "Passenger", passengersCount: "Passenger count", people: "passenger", count: "", done: "Done", close: "Close passenger panel" },
  }[language]

  useEffect(() => {
    if (!open || typeof window === "undefined" || window.innerWidth >= 1280) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  return (
    <div className="relative flex min-h-[68px] flex-col justify-center rounded-[20px] bg-white/92 px-5 py-3 shadow-[0_14px_32px_rgba(18,28,45,0.07)] dark:bg-[rgba(14,26,50,0.92)] dark:shadow-[0_18px_36px_rgba(4,10,28,0.34)] xl:h-[74px] xl:min-h-0 xl:px-6 xl:py-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-left"
      >
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a879c] dark:text-[#9fb4d7]">
          <span>{copy.passenger}</span>
          <ChevronDown size={16} className={`text-[#8d98aa] transition dark:text-[#a5b8d8] ${open ? "rotate-180" : ""}`} />
        </div>
        <div className="mt-1 text-[14px] font-semibold text-[#1b2433] dark:text-white xl:text-[17px]">{pax} {copy.people}</div>
        <div className="text-[13px] text-[#8d98aa] dark:text-[#a5b8d8]">Economy</div>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={copy.close}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[129] bg-[rgba(15,23,42,0.16)] backdrop-blur-[2px] xl:hidden"
          />
          <div className="fixed inset-x-3 bottom-3 z-[130] rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(246,249,255,0.96)_100%)] p-4 shadow-[0_24px_60px_rgba(17,24,39,0.16)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(13,24,48,0.98)_0%,rgba(18,32,60,0.97)_100%)] dark:shadow-[0_24px_60px_rgba(4,10,28,0.42)] xl:absolute xl:left-auto xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:w-[240px] xl:rounded-[22px] xl:bg-white dark:xl:bg-[rgba(18,32,60,0.97)]">
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#d8e1ee] xl:hidden" />
            <div className="text-sm font-semibold text-[#1d2430] dark:text-white">{copy.passengersCount}</div>
            <div className="mt-3 flex items-center justify-between rounded-[18px] bg-[#f6f8fb] px-3 py-3">
              <button
                type="button"
                onClick={() => onChange(Math.max(1, pax - 1))}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-semibold text-[#1d2430] shadow-[0_6px_14px_rgba(17,24,39,0.08)]"
              >
                -
              </button>
              <div className="text-base font-bold text-[#1d2430] dark:text-white">{pax} {copy.count}</div>
              <button
                type="button"
                onClick={() => onChange(Math.min(9, pax + 1))}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-semibold text-[#1d2430] shadow-[0_6px_14px_rgba(17,24,39,0.08)]"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 h-11 w-full rounded-[16px] bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-sm font-semibold text-white"
            >
              {copy.done}
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
  children,
}: {
  icon: ReactNode
  title: string
  text: string
  accent: "blue" | "gold" | "rose"
  children?: ReactNode
}) {
  const accentStyles = {
    blue: "bg-[linear-gradient(135deg,#f5f9ff_0%,#e8f1ff_100%)] border-[#dce7fb] text-[#2f5ba8]",
    gold: "bg-[linear-gradient(135deg,#fffaf2_0%,#fff2db_100%)] border-[#f0e0b8] text-[#93631a]",
    rose: "bg-[linear-gradient(135deg,#fff7f9_0%,#fff0f3_100%)] border-[#f1d9df] text-[#9b506b]",
  } as const

  return (
    <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.92)_100%)] p-6 shadow-[0_24px_60px_rgba(17,24,39,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(17,24,39,0.10)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_24px_60px_rgba(4,10,28,0.36)] dark:hover:shadow-[0_28px_70px_rgba(4,10,28,0.46)]">
      <div
        className={`grid h-24 w-24 place-items-center rounded-full border shadow-[0_14px_30px_rgba(17,24,39,0.06)] ${accentStyles[accent]}`}
      >
        {icon}
      </div>
      <h3 className="mt-6 text-2xl font-extrabold leading-tight text-[#1d2430] dark:text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#627188] dark:text-[#d2e0f8] sm:text-[15px]">{text}</p>
      {children}
    </div>
  )
}
