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
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import FareCalendarPicker from "@/components/site/FareCalendarPicker"
import amsterdamImage from "@/assets/SHaharlar/amsterdam.webp"
import dubaiImage from "@/assets/SHaharlar/dubai-marina-cityscape-skyline-skyscrapers-buildings-city-2560x1440-4870.jpg"
import spainImage from "@/assets/SHaharlar/Espania.webp"
import germanyImage from "@/assets/SHaharlar/germany.webp"
import parisImage from "@/assets/SHaharlar/parij.webp"
import sharmImage from "@/assets/SHaharlar/sharm el sheikh.webp"
import turkeyImage from "@/assets/SHaharlar/turkey.jpg"
import { searchAir } from "@/shared/api/air/air.api"
import { AIRPORT_CACHE_KEY, DEFAULT_AIRPORT_DIRECTORY } from "@/shared/air/airportDirectory"
import { useI18n } from "@/shared/i18n/i18n"

type LocationOption = { code: string; name: string; searchText: string }
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

const HOME_PRIORITY_AIRPORT_CODES = [
  "TAS",
  "DXB",
  "IST",
  "SAW",
  "SKD",
  "TBS",
  "HAN",
  "LIS",
  "FCO",
  "BKK",
  "SSH",
  "CDG",
] as const

const cityCarouselSlides = [
  { image: amsterdamImage, name: "Amsterdam" },
  { image: dubaiImage, name: "Dubai" },
  { image: spainImage, name: "Spain" },
  { image: germanyImage, name: "Germany" },
  { image: parisImage, name: "Paris" },
  { image: sharmImage, name: "Sharm El Sheikh" },
  { image: turkeyImage, name: "Istanbul" },
] as const

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
  const [faqOpen, setFaqOpen] = useState(-1)
  const [faqQuestion, setFaqQuestion] = useState("")
  const [tripMode, setTripMode] = useState<"round" | "oneway" | "multi">("round")
  const [passengerTouched, setPassengerTouched] = useState(false)
  const [activeAirportField, setActiveAirportField] = useState<string | null>(null)
  const [multiTrips, setMultiTrips] = useState<Array<{ from: string; to: string; date: string }>>([
    { from: "", to: "", date: "" },
    { from: "", to: "", date: "" },
  ])
  const [openMultiDateIndex, setOpenMultiDateIndex] = useState<number | null>(null)
  const [activeCitySlide, setActiveCitySlide] = useState(0)
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
      titleLines: ["Р В РЎСџР РЋР вЂљР В Р’ВµР В РЎВР В РЎвЂР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ Р В РЎвЂ”Р В РЎвЂўР В РЎвЂР РЋР С“Р В РЎвЂќ Р В Р’В°Р В Р вЂ Р В РЎвЂР В Р’В°Р В Р’В±Р В РЎвЂР В Р’В»Р В Р’ВµР РЋРІР‚С™Р В РЎвЂўР В Р вЂ ", "Р В РЎвЂ Р В Р’В±Р РЋРІР‚в„–Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В Р’Вµ Р В Р’В±Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р В РЎвЂР В Р’Вµ"],
      subtitle: "Р В Р’В Р В Р’ВµР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р РЋРІР‚в„–, Р РЋРІР‚С™Р В РЎвЂўР РЋРІР‚РЋР В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦Р РЋРІР‚в„– Р В РЎвЂ Р РЋРЎвЂњР В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋРІР‚В°Р В Р’ВµР В Р вЂ¦Р В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋРІР‚В Р В Р’ВµР РЋР С“Р РЋР С“ Р В Р’В±Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋР РЏ.",
      chips: ["Р В Р’В Р В Р’ВµР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В Р’В°Р РЋР РЏ Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦Р В Р’В°", "Р В Р’ВР В Р вЂ¦Р РЋРІР‚С™Р В Р’ВµР РЋР вЂљР РЋРІР‚С›Р В Р’ВµР В РІвЂћвЂ“Р РЋР С“ Р В Р вЂ¦Р В Р’В° Р РЋРЎвЂњР В Р’В·Р В Р’В±Р В Р’ВµР В РЎвЂќР РЋР С“Р В РЎвЂќР В РЎвЂўР В РЎВ", "Р В РІР‚ВР РЋРІР‚в„–Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В Р’Вµ Р В Р’В±Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р В РЎвЂР В Р’Вµ"],
      totalFlights: "Р В РІР‚в„ўР РЋР С“Р В Р’ВµР В РЎвЂ“Р В РЎвЂў",
      flightsSuffix: "Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р В РЎвЂўР В Р вЂ ",
      from: "Р В РЎвЂєР РЋРІР‚С™Р В РЎвЂќР РЋРЎвЂњР В РўвЂР В Р’В°",
      to: "Р В РЎв„ўР РЋРЎвЂњР В РўвЂР В Р’В°",
      date: "Р В РЎв„ўР В РЎвЂўР В РЎвЂ“Р В РўвЂР В Р’В°",
      passenger: "Р В РЎСџР В Р’В°Р РЋР С“Р РЋР С“Р В Р’В°Р В Р’В¶Р В РЎвЂР РЋР вЂљ",
      selectDate: "Р В РІР‚в„ўР РЋРІР‚в„–Р В Р’В±Р В Р’ВµР РЋР вЂљР В РЎвЂР РЋРІР‚С™Р В Р’Вµ Р В РўвЂР В Р’В°Р РЋРІР‚С™Р РЋРЎвЂњ",
      priceCalendar: "Р В РЎв„ўР В Р’В°Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РўвЂР В Р’В°Р РЋР вЂљР РЋР Р‰ Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦",
      search: "Р В РЎСљР В Р’В°Р В РІвЂћвЂ“Р РЋРІР‚С™Р В РЎвЂ Р В Р’В±Р В РЎвЂР В Р’В»Р В Р’ВµР РЋРІР‚С™",
      invalidRoute: "Р В РІР‚в„ўР РЋРІР‚в„–Р В Р’В±Р В Р’ВµР РЋР вЂљР В РЎвЂР РЋРІР‚С™Р В Р’Вµ Р В РЎвЂќР В РЎвЂўР РЋР вЂљР РЋР вЂљР В Р’ВµР В РЎвЂќР РЋРІР‚С™Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В Р’В·Р В Р вЂ¦Р В Р’В°Р РЋРІР‚РЋР В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ Р В РўвЂР В Р’В»Р РЋР РЏ Р В РЎвЂ”Р РЋРЎвЂњР В Р вЂ¦Р В РЎвЂќР РЋРІР‚С™Р В РЎвЂўР В Р вЂ  Р В РЎвЂўР РЋРІР‚С™Р В РЎвЂ”Р РЋР вЂљР В Р’В°Р В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ Р В РЎвЂ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂР В Р’В±Р РЋРІР‚в„–Р РЋРІР‚С™Р В РЎвЂР РЋР РЏ.",
      invalidDate: "Р В РІР‚в„ўР РЋРІР‚в„–Р В Р’В±Р В Р’ВµР РЋР вЂљР В РЎвЂР РЋРІР‚С™Р В Р’Вµ Р В РўвЂР В Р’В°Р РЋРІР‚С™Р РЋРЎвЂњ.",
      popularBadge: "Р В РЎСџР В РЎвЂўР В РЎвЂ”Р РЋРЎвЂњР В Р’В»Р РЋР РЏР РЋР вЂљР В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎвЂ”Р РЋР вЂљР В Р’В°Р В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ",
      popularTitleA: "Р В РЎСљР В Р’В°Р В РЎвЂ”Р РЋР вЂљР В Р’В°Р В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ, Р РЋР С“Р В РЎвЂўР В Р’В±Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ",
      popularTitleB: "Р В РЎвЂР В Р’В· Р РЋР вЂљР В Р’ВµР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂўР В РЎвЂ“Р В РЎвЂў backend",
      popularDesc: "Р В РЎв„ўР В Р’В°Р В Р’В¶Р В РўвЂР РЋРІР‚в„–Р В РІвЂћвЂ“ Р В Р’В±Р В Р’В»Р В РЎвЂўР В РЎвЂќ Р РЋР С“Р В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В РЎвЂ”Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦ Р В РЎвЂ”Р В РЎвЂў destination. Р В РЎСџР РЋР вЂљР В РЎвЂ Р В Р вЂ¦Р В Р’В°Р В Р’В¶Р В Р’В°Р РЋРІР‚С™Р В РЎвЂР В РЎвЂ Р В Р вЂ¦Р В Р’В° Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В РЎвЂќР РЋРЎвЂњ Р В РЎвЂўР РЋРІР‚С™Р В РЎвЂќР РЋР вЂљР РЋРІР‚в„–Р В Р вЂ Р В Р’В°Р В Р’ВµР РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В РЎвЂўР РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР В РЎВР В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В Р’Вµ Р В РЎвЂР В РЎВР В Р’ВµР В Р вЂ¦Р В Р вЂ¦Р В РЎвЂў Р РЋР РЉР РЋРІР‚С™Р В РЎвЂўР В РЎвЂ“Р В РЎвЂў Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р В Р’В°.",
      fromPrice: "Р В РЎвЂўР РЋРІР‚С™",
      latestUpdate: "Р В РЎСџР В РЎвЂўР РЋР С“Р В Р’В»Р В Р’ВµР В РўвЂР В Р вЂ¦Р В Р’ВµР В Р’Вµ Р В РЎвЂўР В Р’В±Р В Р вЂ¦Р В РЎвЂўР В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В Р’Вµ",
      viewFare: "Р В РЎСџР В РЎвЂўР РЋР С“Р В РЎВР В РЎвЂўР РЋРІР‚С™Р РЋР вЂљР В Р’ВµР РЋРІР‚С™Р РЋР Р‰ Р РЋРІР‚С™Р В Р’В°Р РЋР вЂљР В РЎвЂР РЋРІР‚С›",
      faqBadge: "Р В Р’В§Р В Р’В°Р РЋР С“Р РЋРІР‚С™Р РЋРІР‚в„–Р В Р’Вµ Р В Р вЂ Р В РЎвЂўР В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋР С“Р РЋРІР‚в„–",
      faqTitleA: "Р В Р Р‹Р В Р’В°Р В РЎВР РЋРІР‚в„–Р В Р’Вµ Р В Р вЂ Р В Р’В°Р В Р’В¶Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В Р вЂ Р В РЎвЂўР В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋР С“Р РЋРІР‚в„–",
      faqTitleB: "Р В РЎвЂў Р В РЎвЂ”Р В Р’ВµР РЋР вЂљР В Р’ВµР В Р’В»Р В Р’ВµР РЋРІР‚С™Р В Р’Вµ Р В РЎвЂ Р В Р’В±Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р В РЎвЂР В РЎвЂ",
      faqDesc: "Р В РЎС™Р РЋРІР‚в„– Р РЋР С“Р В РЎвЂўР В Р’В±Р РЋР вЂљР В Р’В°Р В Р’В»Р В РЎвЂ Р В РЎвЂўР РЋР С“Р В Р вЂ¦Р В РЎвЂўР В Р вЂ Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В Р вЂ Р В РЎвЂўР В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋР С“Р РЋРІР‚в„– Р В РЎвЂ”Р В РЎвЂў Р В РЎвЂ”Р В РЎвЂўР В РЎвЂР РЋР С“Р В РЎвЂќР РЋРЎвЂњ Р В Р’В±Р В РЎвЂР В Р’В»Р В Р’ВµР РЋРІР‚С™Р В РЎвЂўР В Р вЂ , Р В Р’В±Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋР вЂ№, Р В Р’В±Р В Р’В°Р В РЎвЂ“Р В Р’В°Р В Р’В¶Р РЋРЎвЂњ, Р В РЎвЂўР В РЎвЂ”Р В Р’В»Р В Р’В°Р РЋРІР‚С™Р В Р’Вµ Р В РЎвЂ Р РЋР С“Р В РЎвЂўР РЋРІР‚С™Р РЋР вЂљР РЋРЎвЂњР В РўвЂР В Р вЂ¦Р В РЎвЂР РЋРІР‚РЋР В Р’ВµР РЋР С“Р РЋРІР‚С™Р В Р вЂ Р РЋРЎвЂњ.",
      ask: "Р В РІР‚СћР РЋР С“Р РЋРІР‚С™Р РЋР Р‰ Р В Р вЂ Р В РЎвЂўР В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋР С“?",
      askPlaceholder: "Р В РЎСљР В Р’В°Р В РЎвЂ”Р РЋР вЂљР В РЎвЂР В РЎВР В Р’ВµР РЋР вЂљ: Р В РЎвЂќР В Р’В°Р В РЎвЂќ Р РЋР вЂљР В Р’В°Р В Р’В±Р В РЎвЂўР РЋРІР‚С™Р В Р’В°Р В Р’ВµР РЋРІР‚С™ Р В Р’В»Р В РЎвЂР В РЎВР В РЎвЂР РЋРІР‚С™ Р В Р’В±Р В Р’В°Р В РЎвЂ“Р В Р’В°Р В Р’В¶Р В Р’В°?",
      send: "Р В РЎвЂєР РЋРІР‚С™Р В РЎвЂ”Р РЋР вЂљР В Р’В°Р В Р вЂ Р В РЎвЂР РЋРІР‚С™Р РЋР Р‰",
      helpBadge: "Р В РЎСџР В РЎвЂўР В РЎВР В РЎвЂўР РЋРІР‚В°Р РЋР Р‰ Р В РЎвЂ Р В РЎвЂўР В РЎвЂ”Р В Р’В»Р В Р’В°Р РЋРІР‚С™Р В Р’В°",
      helpTitleA: "Р В РІР‚в„ўР В Р’В°Р В Р’В¶Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В РЎвЂР В Р вЂ¦Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР РЋРЎвЂњР В РЎвЂќР РЋРІР‚В Р В РЎвЂР В РЎвЂ",
      helpTitleB: "Р В РЎвЂ”Р В Р’ВµР РЋР вЂљР В Р’ВµР В РўвЂ Р В РЎвЂ”Р В Р’ВµР РЋР вЂљР В Р’ВµР В Р’В»Р В Р’ВµР РЋРІР‚С™Р В РЎвЂўР В РЎВ",
      helpDesc: "Р В РІР‚вЂќР В РўвЂР В Р’ВµР РЋР С“Р РЋР Р‰ Р В РЎВР В РЎвЂўР В Р’В¶Р В Р вЂ¦Р В РЎвЂў Р В Р’В±Р РЋРІР‚в„–Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂў Р В Р вЂ¦Р В Р’В°Р В РІвЂћвЂ“Р РЋРІР‚С™Р В РЎвЂ Р В РЎвЂР В Р вЂ¦Р РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР В РЎВР В Р’В°Р РЋРІР‚В Р В РЎвЂР РЋР вЂ№ Р В РЎвЂўР В Р’В± Р В РЎвЂўР В РЎвЂ”Р В Р’В»Р В Р’В°Р РЋРІР‚С™Р В Р’Вµ, Р РЋР РЉР В Р’В»Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В Р вЂ¦Р В РЎвЂўР В РЎВ Р В Р’В±Р В РЎвЂР В Р’В»Р В Р’ВµР РЋРІР‚С™Р В Р’Вµ Р В РЎвЂ Р В РЎвЂР В Р’В·Р В РЎВР В Р’ВµР В Р вЂ¦Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В РЎвЂ Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р В Р’В°.",
      helpCards: [
        {
          title: "Р В РІР‚ВР В Р’ВµР В Р’В·Р В РЎвЂўР В РЎвЂ”Р В Р’В°Р РЋР С“Р В Р вЂ¦Р В Р’В°Р РЋР РЏ Р В РЎвЂўР В РЎвЂ”Р В Р’В»Р В Р’В°Р РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’В° Р РЋР С“Р В Р’В°Р В РІвЂћвЂ“Р РЋРІР‚С™Р В Р’Вµ",
          text: "Р В РЎвЂєР В РЎвЂ”Р В Р’В»Р В Р’В°Р РЋРІР‚РЋР В РЎвЂР В Р вЂ Р В Р’В°Р В РІвЂћвЂ“Р РЋРІР‚С™Р В Р’Вµ Р В Р’В°Р В Р вЂ Р В РЎвЂР В Р’В°Р В Р’В±Р В РЎвЂР В Р’В»Р В Р’ВµР РЋРІР‚С™Р РЋРІР‚в„– Р В РЎвЂ Р РЋРЎвЂњР РЋР С“Р В Р’В»Р РЋРЎвЂњР В РЎвЂ“Р В РЎвЂ Р РЋРЎвЂњР В РўвЂР В РЎвЂўР В Р’В±Р В Р вЂ¦Р РЋРІР‚в„–Р В РЎВ Р В РўвЂР В Р’В»Р РЋР РЏ Р В Р вЂ Р В Р’В°Р РЋР С“ Р РЋР С“Р В РЎвЂ”Р В РЎвЂўР РЋР С“Р В РЎвЂўР В Р’В±Р В РЎвЂўР В РЎВ.",
          extra: "",
        },
        {
          title: "Р В Р’В§Р РЋРІР‚С™Р В РЎвЂў Р РЋРІР‚С™Р В Р’В°Р В РЎвЂќР В РЎвЂўР В Р’Вµ Р РЋР РЉР В Р’В»Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ Р В Р’В±Р В РЎвЂР В Р’В»Р В Р’ВµР РЋРІР‚С™?",
          text: "Р В РЎСџР В РЎвЂўР РЋР С“Р В Р’В»Р В Р’Вµ Р В РЎвЂ”Р В РЎвЂўР В РўвЂР РЋРІР‚С™Р В Р вЂ Р В Р’ВµР РЋР вЂљР В Р’В¶Р В РўвЂР В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ Р В Р’В±Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В РЎвЂ Р В Р вЂ Р РЋР С“Р В Р’Вµ Р В РўвЂР В Р’В°Р В Р вЂ¦Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р В Р’В° Р РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР В РЎВР В РЎвЂР РЋР вЂљР РЋРЎвЂњР РЋР вЂ№Р РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В Р вЂ  Р РЋР РЉР В Р’В»Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В Р вЂ¦Р В РЎвЂўР В РЎВ Р В Р вЂ Р В РЎвЂР В РўвЂР В Р’Вµ.",
          extra: "Р В РІР‚в„ў Р В РЎвЂўР В РўвЂР В Р вЂ¦Р В РЎвЂўР В РЎВ Р В РЎВР В Р’ВµР РЋР С“Р РЋРІР‚С™Р В Р’Вµ Р В РЎвЂўР РЋРІР‚С™Р В РЎвЂўР В Р’В±Р РЋР вЂљР В Р’В°Р В Р’В¶Р В Р’В°Р РЋР вЂ№Р РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В РЎВР В Р’В°Р РЋР вЂљР РЋРІвЂљВ¬Р РЋР вЂљР РЋРЎвЂњР РЋРІР‚С™, Р В Р вЂ Р РЋР вЂљР В Р’ВµР В РЎВР РЋР РЏ, Р В Р’В±Р В Р’В°Р В РЎвЂ“Р В Р’В°Р В Р’В¶, Р РЋРІР‚С™Р В Р’В°Р РЋР вЂљР В РЎвЂР РЋРІР‚С› Р В РЎвЂ Р В РўвЂР В Р’В°Р В Р вЂ¦Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В РЎвЂ”Р В Р’В°Р РЋР С“Р РЋР С“Р В Р’В°Р В Р’В¶Р В РЎвЂР РЋР вЂљР В Р’В°.",
        },
        {
          title: "Р В РЎв„ўР В Р’В°Р В РЎвЂќ Р РЋР вЂљР В Р’В°Р В Р’В±Р В РЎвЂўР РЋРІР‚С™Р В Р’В°Р В Р’ВµР РЋРІР‚С™ Р В РЎвЂўР В Р’В±Р В РЎВР В Р’ВµР В Р вЂ¦ Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р В Р’В°?",
          text: "Р В РІР‚в„ў Р В Р’В·Р В Р’В°Р В Р вЂ Р В РЎвЂР РЋР С“Р В РЎвЂР В РЎВР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В РЎвЂ Р В РЎвЂўР РЋРІР‚С™ Р В РЎвЂ”Р РЋР вЂљР В Р’В°Р В Р вЂ Р В РЎвЂР В Р’В» Р РЋРІР‚С™Р В Р’В°Р РЋР вЂљР В РЎвЂР РЋРІР‚С›Р В Р’В° Р В РЎВР В РЎвЂўР В Р’В¶Р В Р вЂ¦Р В РЎвЂў Р В РЎвЂР В Р’В·Р В РЎВР В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋРІР‚С™Р РЋР Р‰ Р В РўвЂР В Р’В°Р РЋРІР‚С™Р РЋРЎвЂњ, Р В Р вЂ¦Р В Р’В°Р В РЎвЂ”Р РЋР вЂљР В Р’В°Р В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В Р’Вµ Р В РЎвЂР В Р’В»Р В РЎвЂ Р РЋРІР‚С™Р В РЎвЂР В РЎвЂ” Р РЋРЎвЂњР РЋР С“Р В Р’В»Р РЋРЎвЂњР В РЎвЂ“Р В РЎвЂ.",
          extra: "Р В Р Р‹Р В Р’В»Р РЋРЎвЂњР В Р’В¶Р В Р’В±Р В Р’В° Р В РЎвЂ”Р В РЎвЂўР В РўвЂР В РўвЂР В Р’ВµР РЋР вЂљР В Р’В¶Р В РЎвЂќР В РЎвЂ Р В Р’В±Р РЋРІР‚в„–Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂў Р РЋР С“Р В РЎвЂўР РЋР вЂљР В РЎвЂР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р В РЎвЂР РЋР вЂљР РЋРЎвЂњР В Р’ВµР РЋРІР‚С™ Р В РЎвЂ”Р В РЎвЂў Р В РЎвЂР В Р’В·Р В РЎВР В Р’ВµР В Р вЂ¦Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР вЂ№ Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р В Р’В°.",
        },
      ],
      faqItems: [
        {
          question: "Р В РЎв„ўР В Р’В°Р В РЎвЂќР В РЎвЂР В Р’Вµ Р В РЎвЂќР В РЎвЂўР В РўвЂР РЋРІР‚в„– Р В Р вЂ¦Р РЋРЎвЂњР В Р’В¶Р В Р вЂ¦Р В РЎвЂў Р В Р вЂ Р В Р вЂ Р В РЎвЂўР В РўвЂР В РЎвЂР РЋРІР‚С™Р РЋР Р‰ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂ Р В РЎвЂ”Р В РЎвЂўР В РЎвЂР РЋР С“Р В РЎвЂќР В Р’Вµ Р В Р’В°Р В Р вЂ Р В РЎвЂР В Р’В°Р В Р’В±Р В РЎвЂР В Р’В»Р В Р’ВµР РЋРІР‚С™Р В Р’В°?",
          answer: "Р В Р’ВР РЋР С“Р В РЎвЂ”Р В РЎвЂўР В Р’В»Р РЋР Р‰Р В Р’В·Р РЋРЎвЂњР В РІвЂћвЂ“Р РЋРІР‚С™Р В Р’Вµ IATA-Р В РЎвЂќР В РЎвЂўР В РўвЂР РЋРІР‚в„– Р В Р’В°Р РЋР РЉР РЋР вЂљР В РЎвЂўР В РЎвЂ”Р В РЎвЂўР РЋР вЂљР РЋРІР‚С™Р В РЎвЂўР В Р вЂ : Р В Р вЂ¦Р В Р’В°Р В РЎвЂ”Р РЋР вЂљР В РЎвЂР В РЎВР В Р’ВµР РЋР вЂљ, TAS Р В РўвЂР В Р’В»Р РЋР РЏ Р В РЎС›Р В Р’В°Р РЋРІвЂљВ¬Р В РЎвЂќР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р В Р’В°, SAW Р В РЎвЂР В Р’В»Р В РЎвЂ IST Р В РўвЂР В Р’В»Р РЋР РЏ Р В Р Р‹Р РЋРІР‚С™Р В Р’В°Р В РЎВР В Р’В±Р РЋРЎвЂњР В Р’В»Р В Р’В°. Р В РІР‚СњР В Р’В°Р РЋРІР‚С™Р В Р’В° Р В Р вЂ Р В Р вЂ Р В РЎвЂўР В РўвЂР В РЎвЂР РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В Р вЂ  Р РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР В РЎВР В Р’В°Р РЋРІР‚С™Р В Р’Вµ YYYY-MM-DD.",
        },
        {
          question: "Р В РЎв„ўР В Р’В°Р В РЎвЂќ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋРІР‚В¦Р В РЎвЂўР В РўвЂР В РЎвЂР РЋРІР‚С™ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋРІР‚В Р В Р’ВµР РЋР С“Р РЋР С“ Р В Р’В±Р РЋР вЂљР В РЎвЂўР В Р вЂ¦Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋР РЏ?",
          answer: "Р В Р Р‹Р В Р вЂ¦Р В Р’В°Р РЋРІР‚РЋР В Р’В°Р В Р’В»Р В Р’В° Р В Р вЂ Р РЋРІР‚в„–Р В Р’В±Р В РЎвЂР РЋР вЂљР В Р’В°Р В Р’ВµР РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“, Р В Р’В·Р В Р’В°Р РЋРІР‚С™Р В Р’ВµР В РЎВ Р В Р вЂ Р В Р вЂ Р В РЎвЂўР В РўвЂР РЋР РЏР РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В РўвЂР В Р’В°Р В Р вЂ¦Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р В РЎвЂ”Р В Р’В°Р РЋР С“Р РЋР С“Р В Р’В°Р В Р’В¶Р В РЎвЂР РЋР вЂљР В Р’В° Р В РЎвЂ Р В РЎвЂ”Р В РЎвЂўР В РўвЂР РЋРІР‚С™Р В Р вЂ Р В Р’ВµР РЋР вЂљР В Р’В¶Р В РўвЂР В Р’В°Р В Р’ВµР РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В РЎвЂўР РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР В РЎВР В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В Р’Вµ. Р В РЎв„ўР В Р’В°Р В Р’В¶Р В РўвЂР РЋРІР‚в„–Р В РІвЂћвЂ“ Р РЋРІвЂљВ¬Р В Р’В°Р В РЎвЂ“ Р В РЎвЂ”Р В РЎвЂўР В РЎвЂќР В Р’В°Р В Р’В·Р РЋРІР‚в„–Р В Р вЂ Р В Р’В°Р В Р’ВµР РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В РЎвЂўР РЋРІР‚С™Р В РўвЂР В Р’ВµР В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂў.",
        },
        {
          question: "Р В РІР‚СљР В РўвЂР В Р’Вµ Р В РЎвЂўР РЋРІР‚С™Р В РЎвЂўР В Р’В±Р РЋР вЂљР В Р’В°Р В Р’В¶Р В Р’В°Р В Р’ВµР РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В РЎвЂР В Р вЂ¦Р РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР В РЎВР В Р’В°Р РЋРІР‚В Р В РЎвЂР РЋР РЏ Р В РЎвЂў Р В Р’В±Р В Р’В°Р В РЎвЂ“Р В Р’В°Р В Р’В¶Р В Р’Вµ Р В РЎвЂ Р РЋРЎвЂњР РЋР С“Р В Р’В»Р РЋРЎвЂњР В РЎвЂ“Р В Р’В°Р РЋРІР‚В¦?",
          answer: "Р В РЎСљР В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂўР РЋРІР‚РЋР В РЎвЂќР В Р’Вµ Р РЋР вЂљР В Р’ВµР В РІвЂћвЂ“Р РЋР С“Р В Р’В° Р В Р вЂ Р В РЎвЂР В РўвЂР В Р вЂ¦Р РЋРІР‚в„– Р В Р’В±Р В Р’В°Р В РЎвЂ“Р В Р’В°Р В Р’В¶, Р В Р вЂ Р РЋР вЂљР В Р’ВµР В РЎВР РЋР РЏ, Р В РўвЂР В Р’В»Р В РЎвЂР РЋРІР‚С™Р В Р’ВµР В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂўР РЋР С“Р РЋРІР‚С™Р РЋР Р‰ Р В РЎвЂ Р РЋРІР‚С™Р В Р’В°Р РЋР вЂљР В РЎвЂР РЋРІР‚С›. Р В РІР‚в„ў Р В РўвЂР В Р’ВµР РЋРІР‚С™Р В Р’В°Р В Р’В»Р РЋР РЏР РЋРІР‚В¦ Р В РЎвЂўР РЋРІР‚С™Р В РЎвЂўР В Р’В±Р РЋР вЂљР В Р’В°Р В Р’В¶Р В Р’В°Р РЋР вЂ№Р РЋРІР‚С™Р РЋР С“Р РЋР РЏ Р В РўвЂР В РЎвЂўР В РЎвЂ”Р В РЎвЂўР В Р’В»Р В Р вЂ¦Р В РЎвЂР РЋРІР‚С™Р В Р’ВµР В Р’В»Р РЋР Р‰Р В Р вЂ¦Р РЋРІР‚в„–Р В Р’Вµ Р РЋРЎвЂњР РЋР С“Р В Р’В»Р РЋРЎвЂњР В РЎвЂ“Р В РЎвЂ.",
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

  const activeAirportValue = useMemo(() => {
    if (activeAirportField === "from") return from
    if (activeAirportField === "to") return to
    if (activeAirportField?.startsWith("multi-")) {
      const [, indexRaw, field] = activeAirportField.split("-")
      const index = Number(indexRaw)
      const item = multiTrips[index]
      if (!item) return ""
      return field === "from" ? item.from : item.to
    }
    return ""
  }, [activeAirportField, from, to, multiTrips])

  const airportPanelOptions = useMemo(() => {
    const query = normalizeText(activeAirportValue)
    if (!query) {
      const priority = HOME_PRIORITY_AIRPORT_CODES
        .map((code) => locationOptions.find((option) => option.code === code))
        .filter((option): option is LocationOption => Boolean(option))

      const priorityCodes = new Set(priority.map((option) => option.code))
      const rest = locationOptions.filter((option) => !priorityCodes.has(option.code))
      return [...priority, ...rest].slice(0, 24)
    }
    return locationOptions.filter((option) => option.searchText.includes(query)).slice(0, 24)
  }, [activeAirportValue, locationOptions])

  const heroCopy = {
    uz: {
      title: "Aviation Tour bilan qulay va ishonchli avia sayohat",
      subtitle: "Xalqaro reyslar, tezkor bron va bir joyda jamlangan aeroport yo'nalishlari",
      learnMore: "Batafsil",
      tripModes: [
        { key: "round" as const, label: "Borib-kelish" },
        { key: "oneway" as const, label: "Bir tomonga" },
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
      title: "Aviation Tour РґР»СЏ СѓРґРѕР±РЅС‹С… Рё РЅР°РґРµР¶РЅС‹С… Р°РІРёР°РїСѓС‚РµС€РµСЃС‚РІРёР№",
      subtitle: "РњРµР¶РґСѓРЅР°СЂРѕРґРЅС‹Рµ СЂРµР№СЃС‹, Р±С‹СЃС‚СЂРѕРµ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ Рё РІСЃРµ Р°СЌСЂРѕРїРѕСЂС‚РЅС‹Рµ РЅР°РїСЂР°РІР»РµРЅРёСЏ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ",
      learnMore: "РџРѕРґСЂРѕР±РЅРµРµ",
      tripModes: [
        { key: "round" as const, label: "РўСѓРґР°-РѕР±СЂР°С‚РЅРѕ" },
        { key: "oneway" as const, label: "Р’ РѕРґРЅСѓ СЃС‚РѕСЂРѕРЅСѓ" },
        { key: "multi" as const, label: "РњСѓР»СЊС‚Рё-РіРѕСЂРѕРґ" },
      ],
      guestCabin: "РџР°СЃСЃР°Р¶РёСЂС‹ Рё РєР»Р°СЃСЃ",
      guestValue: passengerTouched ? `${pax} РїР°СЃСЃР°Р¶РёСЂ, Р­РєРѕРЅРѕРј` : "Р”РѕР±Р°РІРёС‚СЊ",
      travelWhen: "РљРѕРіРґР° Р»РµС‚РёС‚Рµ?",
      addDates: "Р”РѕР±Р°РІСЊС‚Рµ РґР°С‚Сѓ",
      fromTitle: "РћС‚РєСѓРґР°",
      toTitle: "РљСѓРґР°",
      inspirationTitleA: "Р РµР№СЃС‹ РёР·",
      inspirationTitleB: "РђР±Сѓ-Р”Р°Р±Рё",
      inspirationSubtitle: "РџСѓСЃС‚СЊ СЃР»РµРґСѓСЋС‰РµРµ РїСѓС‚РµС€РµСЃС‚РІРёРµ РІРґРѕС…РЅРѕРІРёС‚ РІР°СЃ",
      viewAll: "РЎРјРѕС‚СЂРµС‚СЊ РІСЃРµ",
      routePrefix: "РўСѓРґР°-РѕР±СЂР°С‚РЅРѕ - Р­РєРѕРЅРѕРј",
      fromPrice: "РћС‚",
      originPlaceholder: "РњРµСЃС‚Рѕ РІС‹Р»РµС‚Р°",
      destinationPlaceholder: "РњРµСЃС‚Рѕ РїСЂРёР»РµС‚Р°",
      searchButton: "РџРѕРёСЃРє",
      addFlight: "Р”РѕР±Р°РІРёС‚СЊ СЂРµР№СЃ",
      bookWithMiles: "Р‘СЂРѕРЅРёСЂРѕРІР°РЅРёРµ СЃ Tripzy",
      allAirports: "Р’СЃРµ Р°СЌСЂРѕРїРѕСЂС‚С‹",
      fromPanelTitle: "РђСЌСЂРѕРїРѕСЂС‚С‹ РІС‹Р»РµС‚Р°",
      toPanelTitle: "РђСЌСЂРѕРїРѕСЂС‚С‹ РїСЂРёР»РµС‚Р°",
      flightLabel: "Р РµР№СЃ",
      addSegment: "Р”РѕР±Р°РІРёС‚СЊ СЂРµР№СЃ",
    },
    en: {
      title: "Aviation Tour for comfortable and reliable air travel",
      subtitle: "International flights, fast booking, and airport routes gathered in one place",
      learnMore: "Learn more",
      tripModes: [
        { key: "round" as const, label: "Round trip" },
        { key: "oneway" as const, label: "One-way" },
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

  const airportPanelTitle =
    activeAirportField === "from" || activeAirportField?.endsWith("-from")
      ? heroCopy.fromPanelTitle
      : activeAirportField === "to" || activeAirportField?.endsWith("-to")
        ? heroCopy.toPanelTitle
        : heroCopy.allAirports

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveCitySlide((prev) => (prev + 1) % cityCarouselSlides.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [])

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

  return (
    <div className="overflow-x-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#f7f3ea_22%,#f4efe5_100%)] text-[#1d2430] dark:bg-[linear-gradient(180deg,#0b1529_0%,#101d36_26%,#14253f_26%,#14253f_100%)] dark:text-white">
      <section className="relative overflow-visible">
        <div className="relative min-h-[600px] overflow-visible pt-20 sm:min-h-[650px] md:pt-24 lg:min-h-[720px]">
          <div className="absolute inset-0 overflow-hidden">
            {cityCarouselSlides.map((slide, index) => (
              <div
                key={slide.name}
                className={[
                  "absolute inset-0 transition-all duration-1000 ease-out",
                  index === activeCitySlide ? "opacity-100 scale-100" : "opacity-0 scale-105",
                ].join(" ")}
              >
                <img
                  src={slide.image}
                  alt={slide.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            ))}
          </div>
          <div className="relative z-10 mx-auto flex max-w-[1540px] flex-col items-center px-3 sm:px-6 lg:px-8">
            <div className="flex min-h-[500px] w-full items-center justify-center pt-14 sm:min-h-[500px] sm:pt-12 md:min-h-[560px] md:pt-14">
            <motion.div
              initial={{ opacity: 0, y: 38 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.36, ease: "easeOut" }}
              className="relative w-full max-w-[1780px] md:-translate-y-12"
            >
              <div className="absolute left-1/2 top-[-30px] z-10 flex w-[calc(100%-20px)] max-w-[560px] -translate-x-1/2 items-center justify-between rounded-full border border-[#d5d8de] bg-white p-1 shadow-[0_10px_24px_rgba(17,24,39,0.08)] sm:top-[-34px] sm:inline-flex sm:w-auto sm:justify-start sm:p-1.5">
                {heroCopy.tripModes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setTripMode(mode.key)}
                    className={[
                      "rounded-full px-3 py-2.5 text-[12px] font-semibold transition sm:px-7 sm:py-3 sm:text-[14px]",
                      tripMode === mode.key
                        ? "bg-[#334e5e] text-white shadow-[0_10px_24px_rgba(51,78,94,0.24)]"
                        : "text-[#697386] hover:text-[#263442]",
                    ].join(" ")}
                  >
                    {searchUiCopy.tripModes[mode.key]}
                  </button>
                ))}
              </div>
              <div className="rounded-[24px] bg-white p-2 shadow-[0_24px_70px_rgba(9,15,23,0.18)] sm:rounded-[22px] sm:p-3 md:rounded-[24px] md:p-3.5">
              {tripMode === "multi" ? (
                <div className="space-y-5">
                  {multiTrips.map((trip, index) => (
                    <div key={`trip-${index}`}>
                      <div className="mb-3 text-[16px] font-semibold text-[#1d2430]">
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
                          swapIcon
                          onActivate={() => {
                            setCalendarOpen(false)
                            setOpenMultiDateIndex(null)
                            setActiveAirportField(`multi-${index}-to`)
                          }}
                          onDismiss={() => setActiveAirportField(null)}
                          useInlinePanel
                          active={activeAirportField === `multi-${index}-to`}
                        />
                        <div className="relative flex min-h-[72px] flex-col justify-center rounded-[18px] border border-[#e2e7ef] bg-[#f8fafc] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] xl:min-h-[76px]">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAirportField(null)
                              setCalendarOpen(false)
                              setOpenMultiDateIndex((prev) => (prev === index ? null : index))
                            }}
                            className="text-left"
                          >
                            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#334e6a]">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#efe3c7] text-[#b28743]">
                                <CalendarDays size={16} />
                              </span>
                              <span>{copy.date}</span>
                            </div>
                            <div className="mt-1 text-[16px] font-medium text-[#66758a]">
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
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#e8edf3] pt-5">
                    <PassengerField
                      pax={pax}
                      onChange={(value) => {
                        setPax(value)
                        setPassengerTouched(true)
                        setActiveAirportField(null)
                      }}
                      label={heroCopy.guestCabin}
                      valueLabel={heroCopy.guestValue}
                      icon={<UsersRound size={18} />}
                    />
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() =>
                          setMultiTrips((prev) => [...prev, { from: "", to: "", date: "" }])
                        }
                        className="border-b border-[#bc8e43] pb-1 text-[18px] font-medium text-[#2f3747]"
                      >
                        {heroCopy.addSegment}
                      </button>
                      <motion.button
                        type="button"
                        onClick={() => {
                          setActiveAirportField(null)
                          onSearch()
                        }}
                        className="inline-flex h-[56px] items-center justify-center rounded-[18px] bg-[#0f9ae7] px-7 text-[17px] font-bold text-white shadow-[0_16px_34px_rgba(15,154,231,0.24)] transition hover:brightness-105"
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
                    "relative overflow-visible rounded-[20px] border border-[#d9e1ec] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.12)] grid items-stretch divide-y divide-[#e4eaf2] sm:rounded-[22px] xl:divide-y-0 xl:divide-x",
                    tripMode === "round"
                      ? "xl:grid-cols-[2.3fr_0.9fr_0.9fr_0.85fr_220px]"
                      : "xl:grid-cols-[2.4fr_0.9fr_0.85fr_220px]",
                  ].join(" ")}
                >
                  <div className="relative grid items-stretch divide-y divide-[#e4eaf2] xl:grid-cols-2 xl:divide-x xl:divide-y-0">
                    <button
                      type="button"
                      onClick={() => {
                        const nextFrom = to
                        const nextTo = from
                        setFrom(nextFrom)
                        setTo(nextTo)
                        setActiveAirportField(null)
                      }}
                      className="absolute left-1/2 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8dee8] bg-white text-[#9da8b8] shadow-[0_10px_24px_rgba(15,23,42,0.14)] xl:flex"
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
                    label={searchUiCopy.passengers}
                    valueLabel={language === "ru" ? `${pax} пассажир` : language === "en" ? `${pax} passenger` : `${pax} yo'lovchi`}
                    icon={<UsersRound size={20} className="text-[#18a0ea]" />}
                    compact
                  />
                  <div className="relative flex min-h-[74px] flex-col justify-center bg-transparent px-6 py-3">
                    <button type="button" onClick={() => {
                      setActiveAirportField(null)
                      setOpenMultiDateIndex(null)
                      setCalendarOpen((prev) => !prev)
                    }} className="text-left">
                      <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#97a3b5]">
                        <span className="inline-flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center text-[#18a0ea]">
                            <CalendarDays size={20} />
                          </span>
                          <span>{searchUiCopy.depart}</span>
                        </span>
                      </div>
                      <div className="mt-1 text-[15px] font-semibold text-[#111827] xl:text-[16px]">
                        {date ? formatDisplayDate(date) : heroCopy.addDates}
                      </div>
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
                  {tripMode === "round" ? (
                    <div className="relative flex min-h-[74px] flex-col justify-center bg-transparent px-6 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAirportField(null)
                          setOpenMultiDateIndex(null)
                          setCalendarOpen(false)
                          setOpenMultiDateIndex(-2)
                        }}
                        className="text-left"
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#97a3b5]">
                          <span className="inline-flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center text-[#18a0ea]">
                              <CalendarDays size={20} />
                            </span>
                            <span>{searchUiCopy.return}</span>
                          </span>
                        </div>
                        <div className="mt-1 text-[15px] font-semibold text-[#111827] xl:text-[16px]">
                          {returnDate ? formatDisplayDate(returnDate) : heroCopy.addDates}
                        </div>
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
                    className="inline-flex min-h-[64px] items-center justify-center rounded-b-[18px] bg-[linear-gradient(135deg,#12a4ef_0%,#0593dc_100%)] px-6 text-[16px] font-bold text-white shadow-[0_16px_34px_rgba(15,154,231,0.24)] transition hover:brightness-105 sm:min-h-[70px] sm:text-[17px] xl:min-h-full xl:rounded-none xl:rounded-r-[20px]"
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    {searchUiCopy.search}
                  </motion.button>
                </div>
              )}

              {activeAirportField ? (
                <div className="mt-3 overflow-hidden rounded-[24px] border border-[#dfe5ec] bg-white shadow-[0_20px_40px_rgba(17,24,39,0.10)]">
                  <div className="flex items-center justify-between border-b border-[#edf1f5] px-6 py-4">
                    <div className="text-[18px] font-medium text-[#243042]">{airportPanelTitle}</div>
                    <button
                      type="button"
                      onClick={() => setActiveAirportField(null)}
                      className="inline-flex items-center rounded-full border border-[#d8e0ea] px-3 py-1.5 text-sm font-semibold text-[#516276] transition hover:bg-[#f8fafc]"
                    >
                      {searchUiCopy.close}
                    </button>
                  </div>
                  <div className="max-h-[540px] overflow-y-auto px-6 py-2">
                    {airportPanelOptions.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const value = `${option.code} - ${option.name}`
                          if (activeAirportField === "from") setFrom(value)
                          if (activeAirportField === "to") setTo(value)
                          if (activeAirportField?.startsWith("multi-")) {
                            const [, indexRaw, field] = activeAirportField.split("-")
                            const index = Number(indexRaw)
                            setMultiTrips((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, [field]: value }
                                  : item
                              )
                            )
                          }
                          setActiveAirportField(null)
                        }}
                        className="flex w-full items-center justify-between gap-4 border-b border-[#eef2f6] py-4 text-left last:border-b-0 hover:bg-[#f8fafc]"
                      >
                        <span className="flex min-w-0 items-center gap-4">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#f7f3ea] text-[#b28743]">
                            <MapPinned size={20} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[18px] font-semibold text-[#162235]">
                              {option.name}
                            </span>
                            <span className="mt-1 block text-[15px] text-[#65748b]">
                              {option.code}
                            </span>
                          </span>
                        </span>
                        <span className="rounded-[8px] bg-[#edf2f7] px-4 py-2 text-sm font-semibold text-[#46627f]">
                          {option.code}
                        </span>
                      </button>
                    ))}
                    {!airportPanelOptions.length ? (
                      <div className="py-8 text-center text-[15px] text-[#66758a]">
                        {searchUiCopy.airportNotFound}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              </div>
            </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-18 pt-14 sm:px-6 md:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-40 max-w-[980px] rounded-full bg-[radial-gradient(circle,rgba(92,134,211,0.12)_0%,rgba(92,134,211,0)_72%)] blur-3xl" />
        <div className="relative mx-auto max-w-[1440px] 2xl:max-w-[1600px]">
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
        <div className="relative mx-auto max-w-[1440px] 2xl:max-w-[1600px]">
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
  icon,
  swapIcon = false,
  onActivate,
  onDismiss,
  useInlinePanel = false,
  active = false,
  compact = false,
}: {
  label: string
  value: string
  placeholder: string
  options: LocationOption[]
  onChange: (value: string) => void
  icon?: ReactNode
  swapIcon?: boolean
  onActivate?: () => void
  onDismiss?: () => void
  useInlinePanel?: boolean
  active?: boolean
  compact?: boolean
}) {
  const { language } = useI18n()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const copy = {
    uz: { select: "tanlash", noResult: "Mos airport yoki shahar topilmadi.", chooseOption: "Variantni tanlang", close: "Ro'yxatni yopish" },
    ru: { select: "Р В Р вЂ Р РЋРІР‚в„–Р В Р’В±Р РЋР вЂљР В Р’В°Р РЋРІР‚С™Р РЋР Р‰", noResult: "Р В РЎСџР В РЎвЂўР В РўвЂР РЋРІР‚В¦Р В РЎвЂўР В РўвЂР РЋР РЏР РЋРІР‚В°Р В РЎвЂР В РІвЂћвЂ“ Р В Р’В°Р РЋР РЉР РЋР вЂљР В РЎвЂўР В РЎвЂ”Р В РЎвЂўР РЋР вЂљР РЋРІР‚С™ Р В РЎвЂР В Р’В»Р В РЎвЂ Р В РЎвЂ“Р В РЎвЂўР РЋР вЂљР В РЎвЂўР В РўвЂ Р В Р вЂ¦Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РІвЂћвЂ“Р В РўвЂР В Р’ВµР В Р вЂ¦.", chooseOption: "Р В РІР‚в„ўР РЋРІР‚в„–Р В Р’В±Р В Р’ВµР РЋР вЂљР В РЎвЂР РЋРІР‚С™Р В Р’Вµ Р В Р вЂ Р В Р’В°Р РЋР вЂљР В РЎвЂР В Р’В°Р В Р вЂ¦Р РЋРІР‚С™", close: "Р В РІР‚вЂќР В Р’В°Р В РЎвЂќР РЋР вЂљР РЋРІР‚в„–Р РЋРІР‚С™Р РЋР Р‰ Р РЋР С“Р В РЎвЂ”Р В РЎвЂР РЋР С“Р В РЎвЂўР В РЎвЂќ" },
    en: { select: "select", noResult: "No matching airport or city found.", chooseOption: "Choose an option", close: "Close list" },
  }[language]
  void copy
  const safeCopy = {
    uz: { select: "tanlash", noResult: "Mos aeroport yoki shahar topilmadi.", chooseOption: "Variantni tanlang", close: "Ro'yxatni yopish" },
    ru: { select: "Р Р†РЎвЂ№Р В±РЎР‚Р В°РЎвЂљРЎРЉ", noResult: "Р СџР С•Р Т‘РЎвЂ¦Р С•Р Т‘РЎРЏРЎвЂ°Р С‘Р в„– Р В°РЎРЊРЎР‚Р С•Р С—Р С•РЎР‚РЎвЂљ Р С‘Р В»Р С‘ Р С–Р С•РЎР‚Р С•Р Т‘ Р Р…Р Вµ Р Р…Р В°Р в„–Р Т‘Р ВµР Р….", chooseOption: "Р вЂ™РЎвЂ№Р В±Р ВµРЎР‚Р С‘РЎвЂљР Вµ Р Р†Р В°РЎР‚Р С‘Р В°Р Р…РЎвЂљ", close: "Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ РЎРѓР С—Р С‘РЎРѓР С•Р С”" },
    en: { select: "select", noResult: "No matching airport or city found.", chooseOption: "Choose an option", close: "Close list" },
  }[language]

  const filteredOptions = useMemo(() => {
    const query = normalizeText(value)
    if (!query) return options
    return options.filter((option) => option.searchText.includes(query))
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
          {safeCopy.select}
        </span>
      </button>
    ))
  ) : (
    <div className="px-4 py-4 text-sm text-[#627188]">
      {safeCopy.noResult}
    </div>
  )

  return (
    <label
      className={[
        compact
          ? "relative flex min-h-[68px] flex-col justify-center bg-transparent px-4 py-3 sm:min-h-[74px] sm:px-6"
          : "relative flex min-h-[72px] flex-col justify-center rounded-[18px] border bg-[#f8fafc] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] xl:min-h-[76px]",
        compact
          ? active
            ? "bg-[#f9fbfe]"
            : ""
          : active
            ? "border-[#243a52] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_0_0_1px_rgba(36,58,82,0.04)]"
            : "border-[#e2e7ef]",
      ].join(" ")}
    >
      {swapIcon && !compact ? (
        <span className="pointer-events-none absolute -left-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#e2e7ef] bg-white text-[#9ca4b2] shadow-[0_8px_18px_rgba(17,24,39,0.10)] xl:grid">
          <ArrowRightLeft size={15} />
        </span>
      ) : null}
      <div className={`flex items-center gap-2.5 ${compact ? "text-[10px] font-semibold uppercase tracking-[0.04em] text-[#97a3b5] sm:tracking-[0.06em]" : "text-[10px] font-semibold uppercase tracking-[0.08em] text-[#334e6a]"}`}>
        <span className={`grid ${compact ? "h-7 w-7 bg-transparent text-[#18a0ea] sm:h-8 sm:w-8" : "h-7 w-7 rounded-full bg-[#eef2f6] text-[#98a3b5]"} place-items-center`}>
          {icon ?? <Search size={16} />}
        </span>
        <span>{label}</span>
      </div>
      <input
        className={`mt-1 w-full bg-transparent outline-none placeholder:text-[#8a95a8] ${compact ? "text-[14px] font-semibold text-[#111827] sm:text-[15px] xl:text-[16px]" : "text-[15px] font-medium text-[#66758a] xl:text-[16px]"}`}
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
      {filteredOptions[0] && value.trim() ? (
        <div className={`mt-0.5 font-semibold text-[#8d98aa] ${compact ? "text-[10px] sm:text-[11px]" : "text-[12px]"}`}>{filteredOptions[0].code}</div>
      ) : null}
      {open && !useInlinePanel ? (
        <>
          <button
            type="button"
            aria-label={safeCopy.close}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[129] bg-[rgba(15,23,42,0.16)] backdrop-blur-[2px] xl:hidden"
          />
          <div className="fixed inset-x-3 bottom-3 z-[130] max-h-[62svh] overflow-hidden rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.96)_100%)] shadow-[0_24px_60px_rgba(17,24,39,0.16)] xl:absolute xl:left-0 xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:max-h-[320px] xl:rounded-[22px] xl:bg-white">
            <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-[#d8e1ee] xl:hidden" />
            <div className="border-b border-[#eef3f8] px-4 py-3 xl:hidden">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a879c]">
                {label}
              </div>
              <div className="mt-1 text-sm font-semibold text-[#1d2430]">
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
  )
}

function PassengerField({
  pax,
  onChange,
  label,
  valueLabel,
  icon,
  compact = false,
}: {
  pax: number
  onChange: (value: number) => void
  label?: string
  valueLabel?: string
  icon?: ReactNode
  compact?: boolean
}) {
  const { language } = useI18n()
  const [open, setOpen] = useState(false)
  const copy = {
    uz: { passenger: "Yo'lovchi", passengersCount: "Yo'lovchilar soni", people: "yo'lovchi", count: "ta", done: "Tayyor", close: "Yo'lovchi oynasini yopish" },
    ru: { passenger: "Р В РЎСџР В Р’В°Р РЋР С“Р РЋР С“Р В Р’В°Р В Р’В¶Р В РЎвЂР РЋР вЂљ", passengersCount: "Р В РЎв„ўР В РЎвЂўР В Р’В»Р В РЎвЂР РЋРІР‚РЋР В Р’ВµР РЋР С“Р РЋРІР‚С™Р В Р вЂ Р В РЎвЂў Р В РЎвЂ”Р В Р’В°Р РЋР С“Р РЋР С“Р В Р’В°Р В Р’В¶Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ ", people: "Р В РЎвЂ”Р В Р’В°Р РЋР С“Р РЋР С“Р В Р’В°Р В Р’В¶Р В РЎвЂР РЋР вЂљ", count: "", done: "Р В РІР‚СљР В РЎвЂўР РЋРІР‚С™Р В РЎвЂўР В Р вЂ Р В РЎвЂў", close: "Р В РІР‚вЂќР В Р’В°Р В РЎвЂќР РЋР вЂљР РЋРІР‚в„–Р РЋРІР‚С™Р РЋР Р‰ Р В РЎвЂўР В РЎвЂќР В Р вЂ¦Р В РЎвЂў Р В РЎвЂ”Р В Р’В°Р РЋР С“Р РЋР С“Р В Р’В°Р В Р’В¶Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ " },
    en: { passenger: "Passenger", passengersCount: "Passenger count", people: "passenger", count: "", done: "Done", close: "Close passenger panel" },
  }[language]
  void copy
  const safeCopy = {
    uz: { passenger: "Yo'lovchi", passengersCount: "Yo'lovchilar soni", people: "yo'lovchi", count: "ta", done: "Tayyor", close: "Yo'lovchi oynasini yopish", cabin: "Ekonom" },
    ru: { passenger: "Р СџР В°РЎРѓРЎРѓР В°Р В¶Р С‘РЎР‚", passengersCount: "Р С™Р С•Р В»Р С‘РЎвЂЎР ВµРЎРѓРЎвЂљР Р†Р С• Р С—Р В°РЎРѓРЎРѓР В°Р В¶Р С‘РЎР‚Р С•Р Р†", people: "Р С—Р В°РЎРѓРЎРѓР В°Р В¶Р С‘РЎР‚", count: "", done: "Р вЂњР С•РЎвЂљР С•Р Р†Р С•", close: "Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ Р С•Р С”Р Р…Р С• Р С—Р В°РЎРѓРЎРѓР В°Р В¶Р С‘РЎР‚Р С•Р Р†", cabin: "Р В­Р С”Р С•Р Р…Р С•Р С" },
    en: { passenger: "Passenger", passengersCount: "Passenger count", people: "passenger", count: "", done: "Done", close: "Close passenger panel", cabin: "Economy" },
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
    <div className={compact ? "relative flex min-h-[68px] flex-col justify-center bg-transparent px-4 py-3 sm:min-h-[74px] sm:px-6" : "relative flex min-h-[72px] flex-col justify-center rounded-[18px] border border-[#e2e7ef] bg-[#f8fafc] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] xl:min-h-[76px]"}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-left"
      >
        <div className={`flex items-center justify-between ${compact ? "text-[10px] font-semibold uppercase tracking-[0.04em] text-[#97a3b5] sm:tracking-[0.06em]" : "text-[10px] font-semibold uppercase tracking-[0.08em] text-[#334e6a]"}`}>
          <span className="inline-flex items-center gap-2.5">
            <span className={`grid place-items-center ${compact ? "h-7 w-7 text-[#18a0ea] sm:h-8 sm:w-8" : "h-7 w-7 rounded-full bg-[#eef2f6] text-[#b28743]"}`}>
              {icon ?? <UsersRound size={16} />}
            </span>
            <span>{label ?? safeCopy.passenger}</span>
          </span>
          <ChevronDown size={16} className={`text-[#8d98aa] transition ${open ? "rotate-180" : ""}`} />
        </div>
        <div className={`mt-1 ${compact ? "text-[14px] font-semibold text-[#111827] sm:text-[15px] xl:text-[16px]" : "text-[15px] font-semibold text-[#0f1b2e] xl:text-[16px]"}`}>{valueLabel ?? `${pax} ${safeCopy.people}`}</div>
        <div className="text-[11px] text-[#8d98aa] sm:text-[12px]">{safeCopy.cabin}</div>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={safeCopy.close}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[129] bg-[rgba(15,23,42,0.16)] backdrop-blur-[2px] xl:hidden"
          />
          <div className="fixed inset-x-3 bottom-3 z-[130] rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(246,249,255,0.96)_100%)] p-4 shadow-[0_24px_60px_rgba(17,24,39,0.16)] xl:absolute xl:left-auto xl:right-0 xl:top-[calc(100%+10px)] xl:bottom-auto xl:w-[240px] xl:rounded-[22px] xl:bg-white">
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#d8e1ee] xl:hidden" />
            <div className="text-sm font-semibold text-[#1d2430]">{safeCopy.passengersCount}</div>
            <div className="mt-3 flex items-center justify-between rounded-[18px] bg-[#f6f8fb] px-3 py-3">
              <button
                type="button"
                onClick={() => onChange(Math.max(1, pax - 1))}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-semibold text-[#1d2430] shadow-[0_6px_14px_rgba(17,24,39,0.08)]"
              >
                -
              </button>
              <div className="text-base font-bold text-[#1d2430]">{pax} {safeCopy.count}</div>
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

