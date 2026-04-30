import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { bookingCart } from "@/shared/store/bookingCart"
import { formatMoney } from "@/lib/money"
import { formatUzPhoneInput } from "@/lib/phone"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"
import { ensureAccessToken } from "@/shared/auth/session"
import { useI18n } from "@/shared/i18n/i18n"
import {
  bookAir,
  getAirOptionDetails,
  getAirOptionFareFamilies,
  getBrandedFares,
  searchAir,
} from "@/shared/api/air/air.api"
import type { BrandedFaresResponse } from "@/types/air"
import {
  issueOrder,
  cancelOrderService,
  getOrderById,
  voidOrderService,
} from "@/shared/api/order/order.api"
import {
  X,
  ArrowLeft,
  ChevronDown,
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  Luggage,
  User,
  Users,
  Mail,
  Phone,
  MousePointerClick,
  WalletCards,
  CircleDollarSign,
  HandCoins,
  CreditCard,
} from "lucide-react"

const brandBlueGradient = "!bg-[linear-gradient(135deg,#021373_0%,#020F59_48%,#8491D9_100%)]"
const brandBlueSoftGradient = "!bg-[linear-gradient(135deg,#F1F6FF_0%,#FFFFFF_46%,#E7EEFF_100%)]"
const brandFocus = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E7BFF]/25 focus-visible:ring-offset-2"
const brandPrimaryAction =
  `border border-[#5f72c7]/35 ${brandBlueGradient} text-white shadow-[0_14px_30px_rgba(2,19,115,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(2,19,115,0.28)] disabled:cursor-not-allowed disabled:opacity-50 ${brandFocus}`
const brandSecondaryAction =
  "border border-[#C8D3E0] bg-[#EBEBEB] text-[#174A8B] shadow-[0_10px_24px_rgba(23,74,139,0.08)] transition hover:bg-[#E1E7EF] disabled:cursor-not-allowed disabled:opacity-45"

function AccordionSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string
  subtitle?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#D9D5CE] bg-white shadow-none dark:border-[#D9D5CE] dark:bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-[#F3F1ED] sm:px-4"
      >
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-[#111A34] dark:text-[#111A34]">{title}</span>
          {subtitle ? <span className="mt-0.5 block text-[11px] leading-4 text-[#77716A] dark:text-[#77716A]">{subtitle}</span> : null}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D9D5CE] bg-[#F3F1ED] text-[#174A8B]"
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#EEEAE4] px-3.5 pb-3 pt-2.5 sm:px-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export type FlightSegment = {
  id: string
  origin: string
  destination: string
  departure: string
  arrival: string
  departureTerminal?: string | null
  arrivalTerminal?: string | null
  baggage?: string
  carryOn?: string
  bookingClass?: string
  serviceClass?: string
  carrier?: string
  operatingCarrier?: string
  duration?: number
  layover?: number
  equipment?: string
  fareBasis?: string
  flightNumber?: string
  seatsAvailable?: number
}

export type Flight = {
  id: string
  from: string
  to: string
  airline: string
  airlineName?: string
  airlineLogo?: string
  departDate?: string
  depart: string
  arriveDate?: string
  arrive: string
  durationMin: number
  price: number
  currency?: string
  baggage?: string
  cabin?: string
  refundable?: boolean
  services?: Array<"wifi" | "meal" | "priority" | "support">
  flightNo?: string
  carryOn?: string
  stopsCount?: number
  seatsAvailable?: number
  segments?: FlightSegment[]
}

type Step = "select" | "details" | "pay"

type PayerInfo = {
  email: string
  phone: string
  name?: string
  countryCode?: string
}

type PassengerForm = {
  firstName: string
  lastName: string
  birthDate: string
  passportNo: string
  passportExpiry: string
  passportIssued: string
  citizenship: string
  gender: "M" | "F"
  countryCode: string
}

type FareFamilyOption = {
  id: string
  name: string
  price: number
  currency?: string
  baggageInfos: string[]
  serviceDescriptions: string[]
  includedServices: string[]
  chargeableServices: string[]
  unavailableServices: string[]
  carryOn?: string
  baggage?: string
  refundable?: boolean
  changeable?: boolean
  airline?: string
  depart?: string
  arrive?: string
  departDate?: string
  arriveDate?: string
  durationMin?: number
  from?: string
  to?: string
  cabin?: string
  segments?: FlightSegment[]
  isDefault?: boolean
  seatsAvailable?: number
}

const panel = {
  hidden: { opacity: 0, y: 16, scale: 0.98, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" },
}

const fmtDuration = (mins: number, language: "uz" | "ru" | "en") => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (language === "ru") return `${h} ч ${m} мин`
  if (language === "en") return `${h}h ${m}m`
  return `${h} soat ${m} daqiqa`
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
const isPhone = (s: string) => s.replace(/\D/g, "").length >= 9

const translateBookingError = (message: string | undefined, language: "uz" | "ru" | "en") => {
  const text = (message || "").trim()
  if (!text) {
    return language === "ru"
      ? "Ошибка бронирования"
      : language === "en"
        ? "Booking error"
        : "Booking xato"
  }
  if (/Не удалось взять места по запрошенным параметрам/i.test(text)) {
    return language === "ru"
      ? "По выбранному тарифу мест не осталось. Выполните поиск заново и выберите другой вариант."
      : language === "en"
        ? "No seats are left for the selected fare. Search again and choose another option."
        : "Tanlangan tarif bo'yicha joy qolmagan. Reysni qayta qidirib, boshqa variantni tanlang."
  }
  if (/Ошибка создания брони/i.test(text)) {
    return language === "ru"
      ? "Не удалось создать бронь. Возможно, тариф или наличие мест изменились."
      : language === "en"
        ? "Unable to create the booking. The fare or seat availability may have changed."
        : "Bron yaratib bo'lmadi. Tarif yoki joy holati o'zgargan bo'lishi mumkin."
  }
  if (isExpiredOfferMessage(text)) {
    return language === "ru"
      ? "Предложение истекло или больше недоступно. Мы обновили поиск, попробуйте оформить еще раз."
      : language === "en"
        ? "The offer expired or is no longer available. We refreshed the search; please try checkout again."
        : "Offer muddati tugagan yoki mavjud emas. Qidiruv yangilandi, rasmiylashtirishni yana bir marta bosing."
  }
  return text
}

const translateBackendInfoError = (
  message: string | undefined,
  fallback: string,
  language: "uz" | "ru" | "en"
) => {
  const text = (message || "").trim()
  if (!text) return fallback

  if (
    /Возникла внутренняя ошибка сервера/i.test(text) ||
    /Internal server error/i.test(text) ||
    /Server Error/i.test(text)
  ) {
    return language === "ru"
      ? "Сервис временно недоступен. Попробуйте еще раз чуть позже."
      : language === "en"
        ? "The service is temporarily unavailable. Please try again a bit later."
        : "Xizmat vaqtincha ishlamayapti. Birozdan keyin yana urinib ko'ring."
  }

  if (/not found/i.test(text) || /не найден/i.test(text)) {
    return language === "ru"
      ? "Информация по выбранному варианту не найдена."
      : language === "en"
        ? "Details for the selected option were not found."
        : "Tanlangan variant bo'yicha ma'lumot topilmadi."
  }

  if (/unauthorized|forbidden|token/i.test(text)) {
    return language === "ru"
      ? "Сессия истекла. Выполните вход заново."
      : language === "en"
        ? "Your session has expired. Please log in again."
        : "Sessiya tugagan. Qaytadan login qiling."
  }

  return text
}

const isExpiredOfferMessage = (message?: string) =>
  /not found|expired|срок действ|не найден|topilmadi|muddati/i.test(message || "")

const toDateOnly = (value?: string) => {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  return (trimmed.split(" ")[0] || trimmed.split("T")[0] || "").slice(0, 10)
}

const toTimeOnly = (value?: string) => {
  if (!value) return ""
  const trimmed = value.trim()
  const timePart = trimmed.includes("T") ? trimmed.split("T")[1] : trimmed.split(" ")[1]
  return (timePart || trimmed).slice(0, 5)
}

const parseBackendDateTime = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().replace(" ", "T")
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const resolveFlightDurationMinutes = ({
  trips,
  segments,
  fallbackMinutes,
}: {
  trips?: any[]
  segments?: FlightSegment[]
  fallbackMinutes?: number
}) => {
  const safeTrips = trips ?? []
  const safeSegments = segments ?? []
  const tripDuration = safeTrips.reduce((sum, trip) => sum + Number(trip?.duration || 0), 0)
  const segmentDuration = safeSegments.reduce((sum, segment) => {
    return sum + Number(segment.duration || 0) + Number(segment.layover || 0)
  }, 0)
  const firstDeparture = parseBackendDateTime(safeTrips[0]?.departure || safeSegments[0]?.departure)
  const lastArrival = parseBackendDateTime(
    safeTrips[safeTrips.length - 1]?.arrival || safeSegments[safeSegments.length - 1]?.arrival
  )
  const endpointDuration =
    firstDeparture && lastArrival
      ? Math.max(0, Math.round((lastArrival.getTime() - firstDeparture.getTime()) / 60000))
      : 0

  if (segmentDuration > 0 && endpointDuration > segmentDuration * 2) return segmentDuration
  if (tripDuration > 0 && endpointDuration > tripDuration * 2) return tripDuration
  if (endpointDuration > 0 && endpointDuration <= 1440) return endpointDuration
  if (segmentDuration > 0) return segmentDuration
  if (tripDuration > 0) return tripDuration
  return Number(fallbackMinutes || 0)
}

const cabinToSearchClass = (value?: string): "Y" | "B" | "F" => {
  const text = (value || "").toUpperCase()
  if (text.includes("F") || text.includes("FIRST") || text.includes("BIRINCHI") || text.includes("ПЕРВ")) return "F"
  if (text.includes("B") || text.includes("C") || text.includes("J") || text.includes("BUSINESS") || text.includes("BIZNES") || text.includes("БИЗ")) return "B"
  return "Y"
}

const segmentsSignature = (segments: FlightSegment[] | undefined) =>
  (segments ?? [])
    .map((segment) => `${segment.carrier || segment.operatingCarrier || ""}-${segment.flightNumber || ""}`.toUpperCase())
    .filter((value) => value !== "-")

const scoreSearchOption = (option: any, target: Flight) => {
  const optionTrips = option?.trips ?? []
  const optionSegments = mapSegmentsFromTrips(optionTrips)
  const targetSignature = segmentsSignature(target.segments)
  const optionSignature = segmentsSignature(optionSegments)
  let score = 0

  if (option.id === target.id) score += 100
  if ((option.carrier || "").toUpperCase() === (target.airline || "").toUpperCase()) score += 15
  if ((optionTrips[0]?.origin || optionSegments[0]?.origin) === target.from) score += 10
  if ((optionTrips[optionTrips.length - 1]?.destination || optionSegments[optionSegments.length - 1]?.destination) === target.to) score += 10
  if (targetSignature.length && targetSignature.every((item) => optionSignature.includes(item))) score += 50
  if (toDateOnly(optionTrips[0]?.departure || optionSegments[0]?.departure) === toDateOnly(target.departDate || target.segments?.[0]?.departure)) score += 8

  return score
}

function makePassengers(pax: number): PassengerForm[] {
  return Array.from({ length: Math.max(1, pax) }).map(() => ({
    firstName: "",
    lastName: "",
    birthDate: "",
    passportNo: "",
    passportExpiry: "",
    passportIssued: "",
    citizenship: "O'zbekiston",
    gender: "M",
    countryCode: "UZ",
  }))
}

// pax o'zgarsa arrayni moslab beradi, eski kiritilganlarni saqlaydi
function resizePassengers(prev: PassengerForm[], pax: number): PassengerForm[] {
  const n = Math.max(1, pax)
  if (prev.length === n) return prev
  if (prev.length > n) return prev.slice(0, n)
  return [...prev, ...makePassengers(n - prev.length)]
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => (value || "").trim()).filter(Boolean))]
}

function translateServiceText(text: string, language: "uz" | "ru" | "en") {
  const value = text.trim()
  if (!value || language === "en") return value

  const replacements: Array<[RegExp, string]> =
    language === "uz"
      ? [
          // Bagaj
          [/^CARRY ON HAND BAGGAGE$/i, "Qo'l yuki"],
          [/^CARRY ON BAGGAGE$/i, "Qo'l yuki"],
          [/^CARRY BAG UP TO (\d+)\s*KG$/i, "$1 kg gacha qo'l yuki"],
          [/^CABIN BAG 1 PIECE 7 KG$/i, "1 dona 7 kg qo'l yuki"],
          [/^CHECKED BAGGAGE UP TO 15 KGS?$/i, "15 kg gacha topshiriladigan bagaj"],
          [/^CHECKED BAGGAGE UP TO 20 KGS?$/i, "20 kg gacha topshiriladigan bagaj"],
          [/^CHECKED BAGGAGE UP TO 23 KGS?$/i, "23 kg gacha topshiriladigan bagaj"],
          [/^CHECKED BAGGAGE UP TO 25 KGS?$/i, "25 kg gacha topshiriladigan bagaj"],
          [/^CHECKED BAGGAGE UP TO 30 KGS?$/i, "30 kg gacha topshiriladigan bagaj"],
          [/^CHECKED BAGGAGE UP TO 35 KGS?$/i, "35 kg gacha topshiriladigan bagaj"],
          [/^UPTO50LB 23KG BAGGAGE$/i, "23 kg gacha bagaj"],
          [/^UPTO70LB 32KG BAGGAGE$/i, "32 kg gacha bagaj"],
          [/^1 CHECKED BAG$/i, "1 dona topshiriladigan bagaj"],
          [/^2 CHECKED BAGS?$/i, "2 dona topshiriladigan bagaj"],
          [/^BAGGAGE ALLOWANCE$/i, "Bagaj miqdori"],
          [/^CHECKED BAGGAGE/i, "Topshiriladigan bagaj"],
          [/^CABIN BAG/i, "Qo'l yuki"],
          // O'rindiq
          [/^STANDARD SEAT RESERVATION$/i, "Standart joy tanlash"],
          [/^PRE RESERVED SEAT ASSIGNMENT$/i, "Oldindan joy tanlash (pullik)"],
          [/^PREFERRED SEAT RESERVATION$/i, "Tanlangan joy bron qilish (pullik)"],
          [/^EXTRA LEGROOM SEAT RESERVATION$/i, "Keng joy bron qilish (pullik)"],
          [/^PREMIUM SEAT$/i, "Premium o'rindiq"],
          [/^SEAT SELECTION$/i, "Joy tanlash"],
          [/^FREE SEAT SELECTION$/i, "Bepul joy tanlash"],
          [/^ROUND.?TRIP SEAT RESER(VATION)?$/i, "Borib-kelish uchun joy tanlash"],
          // Chipta o'zgartirish / qaytarish
          [/^REFUNDABLE TICKET$/i, "Qaytariladigan chipta"],
          [/^NON.?REFUNDABLE$/i, "Qaytarilmaydi"],
          [/^REFUND AFTER DEPARTURE$/i, "Uchishdan keyin qaytarish"],
          [/^REFUND BEFORE DEPARTURE$/i, "Uchishdan oldin qaytarish"],
          [/^CHANGEABLE TICKET$/i, "O'zgartiriladigan chipta"],
          [/^CHANGE BEFORE DEPARTURE$/i, "Uchishdan oldin o'zgartirish (pullik)"],
          [/^CHANGE AFTER DEPARTURE$/i, "Uchishdan keyin o'zgartirish"],
          [/^CHANGE IN ORIGIN\s*(FTI)?$/i, "Jo'nash sanasini o'zgartirish"],
          [/^CANCELLATION$/i, "Bekor qilish"],
          // Online
          [/^CHECKING IN ONLINE\s*(FTI)?$/i, "Onlayn ro'yxatdan o'tish (pullik)"],
          [/^ONLINE CHECK.?IN$/i, "Onlayn ro'yxatdan o'tish"],
          [/^AIRPORT CHECK.?IN$/i, "Aeroportda ro'yxatdan o'tish"],
          [/^DEDICATED CHECK IN$/i, "Alohida ro'yxatdan o'tish"],
          // Ovqat
          [/^SPECIAL MEAL$/i, "Maxsus ovqat"],
          [/^MEAL BEVERAGE$/i, "Ovqat va ichimlik"],
          [/^MEAL ACCRUAL$/i, "Ovqat (yig'im hisoblanadi)"],
          [/^MEAL SERVICE$/i, "Ovqat xizmati"],
          // Upgrade / lounge
          [/^UPGRADE ELIGIBILITY$/i, "Upgrade imkoniyati (pullik)"],
          [/^LOUNGE ACCESS$/i, "Kutish zalidan foydalanish"],
          [/^PRIORITY BOARDING$/i, "Ustuvor posadka"],
          [/^HOTEL ACCOMMODATIONS$/i, "Mehmonxona joylashuvi"],
          [/^PRE PAID BAGGAGE$/i, "Oldindan bagaj to'lash"],
          // Miles
          [/^50 PCT QMILES ACCUMULATION$/i, "50% Qmiles to'planadi"],
          [/^75 PCT QMILES ACCUMULATION$/i, "75% Qmiles to'planadi"],
          [/^100 PCT QMILES ACCUMULATION$/i, "100% Qmiles to'planadi"],
          [/^MILES ACCRUAL$/i, "Millar to'planadi"],
        ]
      : [
          [/^CARRY ON HAND BAGGAGE$/i, "Ручная кладь"],
          [/^CARRY ON BAGGAGE$/i, "Ручная кладь"],
          [/^CARRY BAG UP TO (\d+)\s*KG$/i, "Ручная кладь до $1 кг"],
          [/^CABIN BAG 1 PIECE 7 KG$/i, "1 место ручной клади 7 кг"],
          [/^CHECKED BAGGAGE UP TO 15 KGS?$/i, "Багаж до 15 кг"],
          [/^CHECKED BAGGAGE UP TO 20 KGS?$/i, "Багаж до 20 кг"],
          [/^CHECKED BAGGAGE UP TO 23 KGS?$/i, "Багаж до 23 кг"],
          [/^CHECKED BAGGAGE UP TO 25 KGS?$/i, "Багаж до 25 кг"],
          [/^CHECKED BAGGAGE UP TO 30 KGS?$/i, "Багаж до 30 кг"],
          [/^CHECKED BAGGAGE UP TO 35 KGS?$/i, "Багаж до 35 кг"],
          [/^UPTO50LB 23KG BAGGAGE$/i, "Багаж до 23 кг"],
          [/^UPTO70LB 32KG BAGGAGE$/i, "Багаж до 32 кг"],
          [/^STANDARD SEAT RESERVATION$/i, "Стандартный выбор места"],
          [/^PREFERRED SEAT RESERVATION$/i, "Выбор предпочтительного места (платно)"],
          [/^EXTRA LEGROOM SEAT RESERVATION$/i, "Место с доп. пространством (платно)"],
          [/^CHANGE BEFORE DEPARTURE$/i, "Изменение до вылета (платно)"],
          [/^CHANGE IN ORIGIN\s*(FTI)?$/i, "Изменение даты вылета"],
          [/^REFUND AFTER DEPARTURE$/i, "Возврат после вылета"],
          [/^CHECKING IN ONLINE\s*(FTI)?$/i, "Онлайн регистрация (платно)"],
          [/^UPGRADE ELIGIBILITY$/i, "Возможность апгрейда (платно)"],
          [/^ROUND.?TRIP SEAT RESER(VATION)?$/i, "Бронь места туда-обратно"],
          [/^SPECIAL MEAL$/i, "Специальное питание"],
          [/^PRE PAID BAGGAGE$/i, "Предоплаченный багаж"],
          [/^DEDICATED CHECK IN$/i, "Отдельная регистрация"],
          [/^PRE RESERVED SEAT ASSIGNMENT$/i, "Предварительный выбор места"],
          [/^PREMIUM SEAT$/i, "Премиум место"],
          [/^REFUNDABLE TICKET$/i, "Возвратный билет"],
          [/^CHANGEABLE TICKET$/i, "Изменяемый билет"],
          [/^MEAL BEVERAGE$/i, "Питание и напитки"],
          [/^MEAL ACCRUAL$/i, "Питание (начисляется сбор)"],
          [/^LOUNGE ACCESS$/i, "Доступ в лаунж"],
          [/^HOTEL ACCOMMODATIONS$/i, "Размещение в отеле"],
          [/^50 PCT QMILES ACCUMULATION$/i, "Начисление 50% Qmiles"],
          [/^75 PCT QMILES ACCUMULATION$/i, "Начисление 75% Qmiles"],
          [/^100 PCT QMILES ACCUMULATION$/i, "Начисление 100% Qmiles"],
        ]

  for (const [pattern, translated] of replacements) {
    if (pattern.test(value)) return translated
  }

  return value
}

function translateFareName(name: string, language: "uz" | "ru" | "en"): string {
  const upper = (name || "").trim().toUpperCase()
  const compact = upper.replace(/[^A-Z0-9]/g, "")
  const map: Record<string, { uz: string; ru: string; en: string }> = {
    ECLASSIC:   { uz: "Klassik",        ru: "Классик",      en: "Classic" },
    ECONVENIEN: { uz: "Qulay",          ru: "Удобный",      en: "Convenient" },
    ECONVENIENT:{ uz: "Qulay",          ru: "Удобный",      en: "Convenient" },
    ECOMFORT:   { uz: "Komfort",        ru: "Комфорт",      en: "Comfort" },
    CLASSIC:    { uz: "Klassik",        ru: "Классик",      en: "Classic" },
    CONVENIEN:  { uz: "Qulay",          ru: "Удобный",      en: "Convenient" },
    CONVENIENT: { uz: "Qulay",          ru: "Удобный",      en: "Convenient" },
    FLEX:       { uz: "Moslashuvchan",  ru: "Флекс",        en: "Flex" },
    ECONOMY:    { uz: "Ekonom",         ru: "Эконом",       en: "Economy" },
    ECO:        { uz: "Ekonom",         ru: "Эконом",       en: "Economy" },
    STANDARD:   { uz: "Standart",       ru: "Стандарт",     en: "Standard" },
    LITE:       { uz: "Yengil",         ru: "Лайт",         en: "Lite" },
    LIGHT:      { uz: "Yengil",         ru: "Лайт",         en: "Light" },
    BASIC:      { uz: "Asosiy",         ru: "Базовый",      en: "Basic" },
    BASE:       { uz: "Asosiy",         ru: "Базовый",      en: "Base" },
    COMFORT:    { uz: "Komfort",        ru: "Комфорт",      en: "Comfort" },
    BUSINESS:   { uz: "Biznes",         ru: "Бизнес",       en: "Business" },
    PREMIUM:    { uz: "Premium",        ru: "Премиум",      en: "Premium" },
    PLUS:       { uz: "Plus",           ru: "Плюс",         en: "Plus" },
    SAVER:      { uz: "Tejamkor",       ru: "Сейвер",       en: "Saver" },
    PROMO:      { uz: "Aksiya",         ru: "Промо",        en: "Promo" },
    FULL:       { uz: "To'liq",         ru: "Полный",       en: "Full" },
    REFUNDABLE: { uz: "Qaytariladigan", ru: "Возвратный",   en: "Refundable" },
    OPTIMAL:    { uz: "Optimal",        ru: "Оптимальный",  en: "Optimal" },
  }
  for (const [key, val] of Object.entries(map)) {
    if (
      upper === key ||
      compact === key ||
      upper.startsWith(key + " ") ||
      upper.endsWith(" " + key) ||
      compact === `E${key}`
    ) {
      return val[language]
    }
  }
  if (language === "en") return name
  return name
}

function paymentMethodTone(id: string, active: boolean) {
  const tones: Record<string, { active: string; idle: string }> = {
    click: {
      active: "border-[#0077FF] !bg-[linear-gradient(135deg,#0077FF_0%,#00B2FF_100%)] text-white shadow-[0_14px_28px_rgba(0,119,255,0.24)]",
      idle: "border-[#68B6FF] !bg-[linear-gradient(135deg,#BFE0FF_0%,#D8EEFF_48%,#8FC8FF_100%)] text-[#004EA8] shadow-[0_8px_18px_rgba(0,119,255,0.10)] hover:border-[#168DFF] hover:shadow-[0_12px_24px_rgba(0,119,255,0.18)]",
    },
    payme: {
      active: "border-[#00AEEF] !bg-[linear-gradient(135deg,#00AEEF_0%,#18D4FF_100%)] text-white shadow-[0_14px_28px_rgba(0,174,239,0.24)]",
      idle: "border-[#54D5FF] !bg-[linear-gradient(135deg,#B6F0FF_0%,#D8FAFF_48%,#84E5FF_100%)] text-[#006D9C] shadow-[0_8px_18px_rgba(0,174,239,0.10)] hover:border-[#00BEEE] hover:shadow-[0_12px_24px_rgba(0,174,239,0.18)]",
    },
    uzum: {
      active: "border-[#6D28D9] !bg-[linear-gradient(135deg,#6D28D9_0%,#A855F7_100%)] text-white shadow-[0_14px_28px_rgba(109,40,217,0.24)]",
      idle: "border-[#B878FF] !bg-[linear-gradient(135deg,#DCC2FF_0%,#EEE0FF_48%,#C79BFF_100%)] text-[#5B21B6] shadow-[0_8px_18px_rgba(109,40,217,0.10)] hover:border-[#9654F4] hover:shadow-[0_12px_24px_rgba(109,40,217,0.18)]",
    },
    paynet: {
      active: "border-[#15A34A] !bg-[linear-gradient(135deg,#0A8F3C_0%,#22C55E_56%,#A3E635_100%)] text-white shadow-[0_14px_28px_rgba(21,163,74,0.24)]",
      idle: "border-[#7DDC93] !bg-[linear-gradient(135deg,#CFF7D8_0%,#E9FBEF_48%,#9BE8A9_100%)] text-[#086B31] shadow-[0_8px_18px_rgba(21,163,74,0.10)] hover:border-[#22C55E] hover:shadow-[0_12px_24px_rgba(21,163,74,0.18)]",
    },
    visa: {
      active: "border-[#1A1F71] !bg-[linear-gradient(135deg,#1A1F71_0%,#2563EB_52%,#EB001B_100%)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]",
      idle: "border-[#8BA4FF] !bg-[linear-gradient(135deg,#C8D5FF_0%,#E1E8FF_42%,#FFC4CC_100%)] text-[#11185E] shadow-[0_8px_18px_rgba(26,31,113,0.10)] hover:border-[#5578FF] hover:shadow-[0_12px_24px_rgba(26,31,113,0.18)]",
    },
  }
  const tone = tones[id] ?? tones.click
  return active ? tone.active : tone.idle
}

function paymentMethodIcon(id: string) {
  if (id === "click") return MousePointerClick
  if (id === "payme") return WalletCards
  if (id === "uzum") return CircleDollarSign
  if (id === "paynet") return HandCoins
  return CreditCard
}

function mapSegmentsFromTrips(trips: any[] | undefined): FlightSegment[] {
  return (
    trips?.flatMap((trip: any) =>
      (trip.segments ?? []).map((seg: any, index: number) => ({
        id: `${trip.id || trip.origin || "trip"}-${index}`,
        origin: seg.origin ?? trip.origin ?? "—",
        destination: seg.destination ?? trip.destination ?? "—",
        departure: seg.departure ?? "—",
        arrival: seg.arrival ?? "—",
        departureTerminal: seg.departureTerminal,
        arrivalTerminal: seg.arrivalTerminal,
        baggage: seg.baggage,
        carryOn: seg.carryOn,
        bookingClass: seg.bookingClass,
        serviceClass: seg.serviceClass,
        carrier: seg.carrier,
        operatingCarrier: seg.operatingCarrier,
        duration: seg.duration,
        layover: seg.layover,
        equipment: seg.equipment,
        fareBasis: seg.fareBasis,
        flightNumber: seg.flightNumber,
        seatsAvailable: seg.seatsAvailable,
      }))
    ) ?? []
  )
}

export default function FlightDetailsModal({
  open,
  onClose,
  flight,
  pax,
  date,
  pageMode = false,
  stayOnPage = false,
}: {
  open: boolean
  onClose: () => void
  flight: Flight | null
  pax: number
  date: string
  pageMode?: boolean
  stayOnPage?: boolean
}) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const copy = {
    uz: {
      bookingError: "Bron qilishda xatolik",
      optionMissing: "Reys topilmadi. Qidiruvni qayta bajaring.",
      invalidData: "Ma'lumotlar to'liq emas.",
      loginFirst: "Avval tizimga kiring.",
      bookingSuccess: "Bron muvaffaqiyatli amalga oshirildi. Buyurtma ID:",
      headerDate: "Sana",
      headerPax: "Yo'lovchi",
      finalPrice: "Yakuniy narx",
      taxesIncluded: "Soliq va yig'imlar bilan",
      step1: "1) Tarif tanlash",
      step2: "2) Rasmiylashtirish",
      step3: "3) To'lov",
      depart: "Uchish",
      arrive: "Qo'nish",
      duration: "Davomiylik",
      fareRules: "Tarif & shartlar",
      refundable: "Qaytarish mumkin",
      nonRefundable: "Qaytarilmaydi",
      carryOn: "Qo'l yuki",
      fareTerms: "Tanlangan tarifning asosiy shartlari va bagaj ma'lumoti.",
      faresLoading: "Tariflar yuklanmoqda...",
      fares: "Tariflar",
      baggage: "Bagaj",
      flightDetails: "Reys tafsilotlari",
      flightDetailsLoading: "Reys tafsilotlari yuklanmoqda...",
      farePackages: "Tarif paketlari",
      farePackagesLoading: "Tarif paketlari yuklanmoqda...",
      farePackagesNotFound: "Tarif paketlari topilmadi.",
      chooseFare: "Tarifni tanlang",
      selectedFare: "Tanlangan tarif",
      selectedFareReady: "Shu tarif bilan bron qilinadi.",
      fareIncluded: "O'z ichiga oladi",
      fareChargeable: "Ruxsat berilgan",
      fareUnavailable: "Ruxsat berilmagan",
      seatsLeft: "ta o'rindiqlar qoldi",
      extraPrice: "Qo'shimcha narx",
      services: "Xizmatlar",
      meal: "Ovqat",
      support: "24/7 Qo'llab-quvvatlash",
      continue: "Davom etish",
      enterPassengerInfo: "Tanlangan tarif saqlanadi. Yo'lovchi ma'lumotlari va to'lov shu sahifada to'ldiriladi.",
      select: "Yo'lovchi ma'lumotlarini kiritish",
      formOpensFor: "ta yo'lovchi uchun ma'lumotlar shu yerda ochiladi.",
      payerDetails: "To'lovchi ma'lumotlari",
      emailPhone: "Email va telefon",
      countryCode: "Mamlakat kodi",
      phoneNumber: "Telefon raqam",
      passengersDetails: "Yo'lovchilar ma'lumotlari",
      total: "Jami",
      passenger: "Yo'lovchi",
      addPassenger: "Yo'lovchi qo'shish",
      removePassenger: "Yo'lovchini o'chirish",
      firstName: "Ism",
      lastName: "Familiya",
      birthDate: "Tug'ilgan sana",
      passportIssued: "Pasport berilgan sana",
      citizenship: "Fuqarolik",
      gender: "Jins",
      passportExpiry: "Pasport amal qilish muddati",
      passportNumber: "Pasport seriya / raqam",
      back: "Orqaga",
      paymentMethod: "To'lov usuli",
      chooseMethod: "Mos usulni tanlang.",
      paymentApiNotice: "To'lov usuli saqlanadi. Payment redirect/callback frontendga ulanmagan.",
      finishOrder: "Buyurtma yakunlash",
      route: "Yo'nalish",
      passengerCount: "Yo'lovchi soni",
      totalPrice: "Narx (jami)",
      selectedPayment: "Tanlangan to'lov",
      unselected: "tanlanmagan",
      confirmData: "Yuqoridagi ma'lumotlar to'g'ri ekanligini tasdiqlayman",
      markConfirmation: "* Rasmiylashtirish uchun tasdiqlashni belgilang.",
      checkout: "Rasmiylashtirish",
      refreshingOffer: "Offer yangilanmoqda...",
      issuePnr: "Issue PNR",
      cancelPnr: "Cancel PNR",
      voidPnr: "VOID PNR",
      getOrderById: "Order holatini tekshirish",
      orderMissing: "Order ID topilmadi.",
      issueDone: "Issue so'rovi yuborildi.",
      issueError: "Issue qilishda xatolik.",
      cancelDone: "Cancel so'rovi yuborildi.",
      cancelError: "Cancel qilishda xatolik.",
      voidDone: "VOID so'rovi yuborildi.",
      voidError: "VOID qilishda xatolik.",
      orderNotFound: "Order topilmadi.",
      orderRequestError: "Order so'rovida xatolik.",
      success: "Muvaffaqiyatli",
      status: "Status",
      client: "Mijoz",
      service: "Xizmat",
      reservation: "Rezervatsiya",
      toastTitle: "Xatolik",
      segment: "Segment",
      time: "Vaqt",
      departTerminal: "Jo'nash terminali",
      arriveTerminal: "Kelish terminali",
      bookingClass: "Bron klassi",
      serviceClass: "Xizmat klassi",
      operatingAirline: "Operatsion aviakompaniya",
      seatsAvailable: "Bo'sh o'rinlar",
      aircraftType: "Samolyot turi",
      fareCode: "Tarif kodi",
      layover: "Kutish vaqti",
    },
    ru: {
      bookingError: "Ошибка бронирования",
      optionMissing: "Option ID не найден. Выполните поиск заново.",
      invalidData: "Данные заполнены не полностью.",
      loginFirst: "Сначала выполните вход (нет token).",
      bookingSuccess: "Бронирование успешно. Order ID:",
      headerDate: "Дата",
      headerPax: "Пассажиры",
      finalPrice: "Итоговая цена",
      taxesIncluded: "С налогами и сборами",
      step1: "1) Выбор тарифа",
      step2: "2) Оформление",
      step3: "3) Оплата",
      depart: "Вылет",
      arrive: "Прилет",
      duration: "Длительность",
      fareRules: "Тариф и условия",
      refundable: "Можно вернуть",
      nonRefundable: "Невозвратный",
      carryOn: "Ручная кладь",
      fareTerms: "Основные условия выбранного тарифа и информация о багаже.",
      faresLoading: "Загрузка тарифов...",
      fares: "Тарифы",
      baggage: "Багаж",
      flightDetails: "Детали рейса",
      flightDetailsLoading: "Загрузка деталей рейса...",
      farePackages: "Пакеты тарифа",
      farePackagesLoading: "Загрузка пакетов тарифа...",
      farePackagesNotFound: "Пакеты тарифа не найдены.",
      chooseFare: "Выберите тариф",
      selectedFare: "Выбранный тариф",
      selectedFareReady: "Бронирование будет выполнено по этому тарифу.",
      fareIncluded: "Включено",
      fareChargeable: "Разрешено",
      fareUnavailable: "Не разрешено",
      seatsLeft: "мест осталось",
      extraPrice: "Доплата",
      services: "Услуги",
      meal: "Питание",
      support: "Поддержка 24/7",
      continue: "Продолжить",
      enterPassengerInfo: "Выбранный тариф сохранится. Данные пассажиров и оплата заполняются здесь же.",
      select: "Ввести данные пассажира",
      formOpensFor: "пассажиров будут заполнены здесь же.",
      payerDetails: "Данные плательщика",
      emailPhone: "Email и телефон",
      countryCode: "Country code",
      phoneNumber: "Телефон",
      passengersDetails: "Данные пассажиров",
      total: "Всего",
      passenger: "Пассажир",
      addPassenger: "Добавить пассажира",
      removePassenger: "Удалить пассажира",
      firstName: "Имя",
      lastName: "Фамилия",
      birthDate: "Дата рождения",
      passportIssued: "Дата выдачи паспорта",
      citizenship: "Гражданство",
      gender: "Пол",
      passportExpiry: "Срок действия паспорта",
      passportNumber: "Серия / номер паспорта",
      back: "Назад",
      paymentMethod: "Способ оплаты",
      chooseMethod: "Выберите подходящий способ.",
      paymentApiNotice: "Способ оплаты сохраняется. Payment redirect/callback не подключен к frontend.",
      finishOrder: "Завершение заказа",
      route: "Маршрут",
      passengerCount: "Количество пассажиров",
      totalPrice: "Цена (итого)",
      selectedPayment: "Выбранная оплата",
      unselected: "не выбрано",
      confirmData: "Подтверждаю правильность указанных выше данных",
      markConfirmation: "* Для оформления отметьте подтверждение.",
      checkout: "Оформить",
      refreshingOffer: "Обновляем offer...",
      issuePnr: "Issue PNR",
      cancelPnr: "Cancel PNR",
      voidPnr: "VOID PNR",
      getOrderById: "Проверить статус Order",
      orderMissing: "Order ID не найден.",
      issueDone: "Issue запрос отправлен.",
      issueError: "Ошибка Issue.",
      cancelDone: "Cancel запрос отправлен.",
      cancelError: "Ошибка Cancel.",
      voidDone: "VOID запрос отправлен.",
      voidError: "Ошибка VOID.",
      orderNotFound: "Order не найден.",
      orderRequestError: "Ошибка запроса Order.",
      success: "Успешно",
      status: "Статус",
      client: "Клиент",
      service: "Услуга",
      reservation: "Резервация",
      toastTitle: "Ошибка",
      segment: "Сегмент",
      time: "Время",
      departTerminal: "Терминал вылета",
      arriveTerminal: "Терминал прилета",
      bookingClass: "Класс бронирования",
      serviceClass: "Класс обслуживания",
      operatingAirline: "Оперирующая авиакомпания",
      seatsAvailable: "Свободные места",
      aircraftType: "Тип самолета",
      fareCode: "Код тарифа",
      layover: "Время ожидания",
    },
    en: {
      bookingError: "Booking error",
      optionMissing: "Option ID was not found. Please search again.",
      invalidData: "The data is incomplete.",
      loginFirst: "Please log in first (token missing).",
      bookingSuccess: "Booking successful. Order ID:",
      headerDate: "Date",
      headerPax: "Passengers",
      finalPrice: "Final price",
      taxesIncluded: "Including taxes and fees",
      step1: "1) Fare selection",
      step2: "2) Checkout",
      step3: "3) Payment",
      depart: "Departure",
      arrive: "Arrival",
      duration: "Duration",
      fareRules: "Fare & conditions",
      refundable: "Refundable",
      nonRefundable: "Non-refundable",
      carryOn: "Carry-on",
      fareTerms: "Main conditions of the selected fare and baggage information.",
      faresLoading: "Loading fares...",
      fares: "Fares",
      baggage: "Baggage",
      flightDetails: "Flight details",
      flightDetailsLoading: "Loading flight details...",
      farePackages: "Fare packages",
      farePackagesLoading: "Loading fare packages...",
      farePackagesNotFound: "No fare packages found.",
      chooseFare: "Choose a fare",
      selectedFare: "Selected fare",
      selectedFareReady: "Booking will be made with this fare.",
      fareIncluded: "Included",
      fareChargeable: "Allowed",
      fareUnavailable: "Not allowed",
      seatsLeft: "seats left",
      extraPrice: "Extra price",
      services: "Services",
      meal: "Meal",
      support: "24/7 support",
      continue: "Continue",
      enterPassengerInfo: "The selected fare is saved. Passenger details and payment are completed on this page.",
      select: "Enter passenger details",
      formOpensFor: "passengers will be handled here.",
      payerDetails: "Payer details",
      emailPhone: "Email and phone",
      countryCode: "Country code",
      phoneNumber: "Phone number",
      passengersDetails: "Passenger details",
      total: "Total",
      passenger: "Passenger",
      addPassenger: "Add passenger",
      removePassenger: "Remove passenger",
      firstName: "First name",
      lastName: "Last name",
      birthDate: "Birth date",
      passportIssued: "Passport issue date",
      citizenship: "Citizenship",
      gender: "Gender",
      passportExpiry: "Passport expiry date",
      passportNumber: "Passport series / number",
      back: "Back",
      paymentMethod: "Payment method",
      chooseMethod: "Choose a suitable method.",
      paymentApiNotice: "The payment method is saved. Payment redirect/callback is not connected to the frontend.",
      finishOrder: "Complete order",
      route: "Route",
      passengerCount: "Passenger count",
      totalPrice: "Price (total)",
      selectedPayment: "Selected payment",
      unselected: "not selected",
      confirmData: "I confirm that the information above is correct",
      markConfirmation: "* Mark the confirmation to proceed.",
      checkout: "Checkout",
      refreshingOffer: "Refreshing offer...",
      issuePnr: "Issue PNR",
      cancelPnr: "Cancel PNR",
      voidPnr: "VOID PNR",
      getOrderById: "Check order status",
      orderMissing: "Order ID was not found.",
      issueDone: "Issue request sent.",
      issueError: "Issue error.",
      cancelDone: "Cancel request sent.",
      cancelError: "Cancel error.",
      voidDone: "VOID request sent.",
      voidError: "VOID error.",
      orderNotFound: "Order was not found.",
      orderRequestError: "Order request error.",
      success: "Success",
      status: "Status",
      client: "Client",
      service: "Service",
      reservation: "Reservation",
      toastTitle: "Error",
      segment: "Segment",
      time: "Time",
      departTerminal: "Departure terminal",
      arriveTerminal: "Arrival terminal",
      bookingClass: "Booking class",
      serviceClass: "Service class",
      operatingAirline: "Operating carrier",
      seatsAvailable: "Seats available",
      aircraftType: "Aircraft type",
      fareCode: "Fare code",
      layover: "Layover",
    },
  }[language]

  // ✅ safeFlight hooklar bir xil ishlashi uchun
  const safeFlight =
    flight ??
    ({
      id: "",
      from: "",
      to: "",
      airline: "",
      depart: "",
      arrive: "",
      durationMin: 0,
      price: 0,
      baggage: "—",
      cabin: "—",
      refundable: false,
      services: [],
      flightNo: "—",
      carryOn: "—",
      segments: [],
    } as Flight)

  const [step, setStep] = useState<Step>("select")
  const [payer, setPayer] = useState<PayerInfo>({ email: "", phone: "+998", countryCode: "998" })
  const [passengers, setPassengers] = useState<PassengerForm[]>(() => makePassengers(pax))
  const [agreeData, setAgreeData] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [bookLoading, setBookLoading] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<number | null>(null)
  const [issueLoading, setIssueLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [voidLoading, setVoidLoading] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderData, setOrderData] = useState<{
    id?: number
    serviceId?: number
    status?: string
    currency?: string
    price?: number
    client?: string
    serviceType?: string
    reservationId?: string
  } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<
    "click" | "payme" | "uzum" | "paynet" | "visa" | ""
  >("")
  const [fareLoading, setFareLoading] = useState(false)
  const [fareError, setFareError] = useState<string | null>(null)
  const [fareData, setFareData] = useState<BrandedFaresResponse["data"] | null>(null)
  const [fareFamiliesLoading, setFareFamiliesLoading] = useState(false)
  const [fareFamiliesError, setFareFamiliesError] = useState<string | null>(null)
  const [fareFamiliesData, setFareFamiliesData] = useState<
    FareFamilyOption[]
  >([])
  const [selectedFareId, setSelectedFareId] = useState<string | null>(null)
  const [optionDetailsLoading, setOptionDetailsLoading] = useState(false)
  const [optionDetailsError, setOptionDetailsError] = useState<string | null>(null)
  const [optionDetails, setOptionDetails] = useState<{
    segments: FlightSegment[]
  } | null>(null)
  const [openInfoSections, setOpenInfoSections] = useState({
    fareRules: false,
    flightDetails: false,
  })
  const bookingTopRef = useRef<HTMLDivElement>(null)
  const selectTopRef = useRef<HTMLDivElement>(null)
  const detailsTopRef = useRef<HTMLDivElement>(null)
  const payTopRef = useRef<HTMLDivElement>(null)

  const scrollToBookingNode = (node: HTMLElement | null) => {
    if (!node) return
    if (!pageMode) {
      node.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
    const top = node.getBoundingClientRect().top + window.scrollY - (pageMode ? 96 : 24)
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
  }

  const toggleInfoSection = (section: "fareRules" | "flightDetails") => {
    setOpenInfoSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  const setBookingStep = (next: Step) => {
    setStep(next)
    const node =
      next === "select" ? selectTopRef.current ?? bookingTopRef.current :
        next === "details" ? detailsTopRef.current :
          payTopRef.current
    window.setTimeout(() => scrollToBookingNode(node), 0)
  }

  // modal ochilganda reset
  useEffect(() => {
    if (!open) return
    setStep("select")
    setPayer({ email: "", phone: "+998", countryCode: "998" })
    setPassengers(makePassengers(pax))
    setAgreeData(false)
    setToastOpen(false)
    setToastMsg("")
    setBookLoading(false)
    setLastOrderId(null)
    setPaymentMethod("")
    setFareLoading(false)
    setFareError(null)
    setFareData(null)
    setFareFamiliesLoading(false)
    setFareFamiliesError(null)
    setFareFamiliesData([])
    setSelectedFareId(null)
    setOptionDetailsLoading(false)
    setOptionDetailsError(null)
    setOptionDetails(null)
  }, [language, open, safeFlight.id])

  useEffect(() => {
    if (!open || pageMode) return

    const bodyOverflow = document.body.style.overflow
    const htmlOverscroll = document.documentElement.style.overscrollBehavior

    document.body.style.overflow = "hidden"
    document.documentElement.style.overscrollBehavior = "none"

    return () => {
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overscrollBehavior = htmlOverscroll
    }
  }, [open])

  useEffect(() => {
    if (!toastOpen) return
    const t = setTimeout(() => setToastOpen(false), 3500)
    return () => clearTimeout(t)
  }, [toastOpen])

  useEffect(() => {
    if (!open) return
    const node =
      step === "select" ? selectTopRef.current ?? bookingTopRef.current :
        step === "details" ? detailsTopRef.current :
          payTopRef.current
    const frame = window.requestAnimationFrame(() => scrollToBookingNode(node))
    const timer = window.setTimeout(() => scrollToBookingNode(node), 120)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [open, step])

  // pax o'zgarsa passengers array moslashadi (kiritilganlar yo'qolmaydi)
  useEffect(() => {
    if (!open) return
    setPassengers((prev) => resizePassengers(prev, pax))
  }, [pax, open])

  useEffect(() => {
    if (!open) return
    if (!safeFlight.id) return

    let alive = true
    setFareLoading(true)
    setFareError(null)

    ensureAccessToken()
      .then((token) => {
        if (!token) throw new Error(copy.loginFirst)
        return getBrandedFares({ optionID: safeFlight.id })
      })
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setFareError(translateBackendInfoError(res.data.message, copy.fares, language))
          setFareData(null)
          return
        }
        setFareData(res.data.data ?? null)
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = translateBackendInfoError(err?.response?.data?.message, copy.fares, language)
        setFareError(msg)
        setFareData(null)
      })
      .finally(() => {
        if (alive) setFareLoading(false)
      })

    return () => {
      alive = false
    }
  }, [copy.fares, language, open, safeFlight.id])

  useEffect(() => {
    if (!open) return
    if (fareFamiliesData.length === 0) {
      setSelectedFareId(safeFlight.id || null)
      return
    }

    setSelectedFareId((prev) => {
      if (prev && fareFamiliesData.some((fare) => fare.id === prev)) return prev
      const preferred = fareFamiliesData.find((fare) => fare.isDefault) ?? fareFamiliesData[0]
      return preferred?.id ?? safeFlight.id ?? null
    })
  }, [open, fareFamiliesData, safeFlight.id])

  useEffect(() => {
    if (!open) return
    if (!safeFlight.id) return

    let alive = true
    setOptionDetailsLoading(true)
    setOptionDetailsError(null)

    ensureAccessToken()
      .then((token) => {
        if (!token) throw new Error(copy.loginFirst)
        return getAirOptionDetails(safeFlight.id)
      })
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setOptionDetailsError(
            translateBackendInfoError(res.data.message, copy.flightDetails, language)
          )
          setOptionDetails(null)
          return
        }

        const segments = mapSegmentsFromTrips(res.data.data?.trips)

        setOptionDetails({ segments })
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = translateBackendInfoError(
          err?.response?.data?.message,
          copy.flightDetails,
          language
        )
        setOptionDetailsError(msg)
        setOptionDetails(null)
      })
      .finally(() => {
        if (alive) setOptionDetailsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [copy.flightDetails, language, open, safeFlight.id])

  useEffect(() => {
    if (!open) return
    if (!safeFlight.id) return

    let alive = true
    setFareFamiliesLoading(true)
    setFareFamiliesError(null)

    ensureAccessToken()
      .then((token) => {
        if (!token) throw new Error(copy.loginFirst)
        return getAirOptionFareFamilies(safeFlight.id)
      })
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setFareFamiliesError(
            translateBackendInfoError(res.data.message, copy.farePackages, language)
          )
          setFareFamiliesData([])
          return
        }

        const mapped: FareFamilyOption[] = (res.data.data ?? []).map((option: any, index: number) => {
          const trip = option.trips?.[0]
          const lastTrip = option.trips?.[option.trips.length - 1] ?? trip
          const services = trip?.brandServices ?? []
          const segments = mapSegmentsFromTrips(option.trips)
          const firstSegment = segments[0]
          const lastSegment = segments[segments.length - 1]
          const brandedBaggage = services
            .filter((service: any) => service?.type === "baggage")
            .map((service: any) => service?.description)
          const departureValue = trip?.departure || firstSegment?.departure
          const arrivalValue = lastTrip?.arrival || lastSegment?.arrival
          const durationMin = resolveFlightDurationMinutes({
            trips: option.trips,
            segments,
            fallbackMinutes: safeFlight.durationMin,
          })

          return {
            id: option.id,
            name: translateFareName(trip?.brandName || trip?.brandID || `Tarif ${index + 1}`, language),
            price: Number(option.price ?? option.passengerInfos?.[0]?.total ?? 0),
            currency: option.currency ?? safeFlight.currency,
            baggageInfos: uniqueStrings([firstSegment?.baggage, ...brandedBaggage]),
            serviceDescriptions: uniqueStrings(
              services.map((service: any) => translateServiceText(service?.description || "", language))
            ),
            includedServices: uniqueStrings(
              services
                .filter((service: any) => service?.paymentType === "included")
                .map((service: any) => translateServiceText(service?.description || "", language))
            ),
            chargeableServices: uniqueStrings(
              services
                .filter((service: any) => service?.paymentType === "chargeable")
                .map((service: any) => translateServiceText(service?.description || "", language))
            ),
            unavailableServices: uniqueStrings(
              services
                .filter((service: any) => service?.paymentType === "na")
                .map((service: any) => translateServiceText(service?.description || "", language))
            ),
            carryOn: firstSegment?.carryOn,
            baggage: firstSegment?.baggage,
            refundable: option.isRefundable,
            changeable: option.isChangeable,
            airline: option.carrier ?? safeFlight.airline,
            depart: toTimeOnly(departureValue) || safeFlight.depart,
            arrive: toTimeOnly(arrivalValue) || safeFlight.arrive,
            departDate: toDateOnly(departureValue) || safeFlight.departDate,
            arriveDate: toDateOnly(arrivalValue) || safeFlight.arriveDate,
            durationMin: durationMin || safeFlight.durationMin,
            from: trip?.origin ?? firstSegment?.origin ?? safeFlight.from,
            to: lastTrip?.destination ?? lastSegment?.destination ?? safeFlight.to,
            cabin: firstSegment?.serviceClass ?? safeFlight.cabin,
            segments,
            isDefault: option.id === safeFlight.id,
            seatsAvailable: option.seatsAvailable ?? trip?.seatsAvailable ?? firstSegment?.seatsAvailable ?? null,
          }
        })

        setFareFamiliesData(mapped)
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = translateBackendInfoError(
          err?.response?.data?.message,
          copy.farePackages,
          language
        )
        setFareFamiliesError(msg)
        setFareFamiliesData([])
      })
      .finally(() => {
        if (alive) setFareFamiliesLoading(false)
      })

    return () => {
      alive = false
    }
  }, [copy.farePackages, language, open, safeFlight.id])

  const selectedFare = useMemo(
    () => fareFamiliesData.find((fare) => fare.id === selectedFareId) ?? null,
    [fareFamiliesData, selectedFareId]
  )

  const bookingFlight = useMemo<Flight>(() => {
    if (!selectedFare) return safeFlight
    const fareSegments = selectedFare.segments && selectedFare.segments.length > 0
      ? selectedFare.segments
      : safeFlight.segments ?? []
    const firstSegment = fareSegments[0]
    const lastSegment = fareSegments[fareSegments.length - 1]
    const departSource = selectedFare.depart || firstSegment?.departure || safeFlight.depart
    const arriveSource = selectedFare.arrive || lastSegment?.arrival || safeFlight.arrive

    return {
      ...safeFlight,
      id: selectedFare.id,
      from: selectedFare.from ?? safeFlight.from,
      to: selectedFare.to ?? safeFlight.to,
      airline: selectedFare.airline ?? safeFlight.airline,
      departDate: toDateOnly(selectedFare.departDate || firstSegment?.departure) || safeFlight.departDate,
      depart: toTimeOnly(departSource) || safeFlight.depart,
      arriveDate: toDateOnly(selectedFare.arriveDate || lastSegment?.arrival) || safeFlight.arriveDate,
      arrive: toTimeOnly(arriveSource) || safeFlight.arrive,
      durationMin: selectedFare.durationMin ?? safeFlight.durationMin,
      price: selectedFare.price || safeFlight.price,
      currency: selectedFare.currency ?? safeFlight.currency,
      baggage: selectedFare.baggage ?? safeFlight.baggage,
      cabin: selectedFare.cabin ?? safeFlight.cabin,
      refundable: selectedFare.refundable ?? safeFlight.refundable,
      carryOn: selectedFare.carryOn ?? safeFlight.carryOn,
      segments: fareSegments,
    }
  }, [safeFlight, selectedFare])

  const cabin = bookingFlight.cabin ?? "—"
  const refundable = bookingFlight.refundable ?? false
  const flightNo = safeFlight.flightNo ?? "—"
  const itinerarySegments = useMemo(
    () =>
      bookingFlight.segments?.length
        ? bookingFlight.segments
        : optionDetails?.segments.length
          ? optionDetails.segments
          : safeFlight.segments ?? [],
    [bookingFlight.segments, optionDetails?.segments, safeFlight.segments]
  )

  const total = useMemo(
    () => bookingFlight.price,
    [bookingFlight.price]
  )
  const passengerCount = Math.max(1, passengers.length)

  const getFreshBookableOptionId = async () => {
    const departure =
      toDateOnly(date) ||
      toDateOnly(bookingFlight.departDate) ||
      toDateOnly(itinerarySegments[0]?.departure)

    if (!bookingFlight.from || !bookingFlight.to || !departure) {
      return bookingFlight.id
    }

    const res = await searchAir({
      adults: passengerCount,
      children: 0,
      infants: 0,
      class: cabinToSearchClass(bookingFlight.cabin),
      trips: [
        {
          origin: bookingFlight.from,
          destination: bookingFlight.to,
          departure,
        },
      ],
    })

    if (res.data.status !== "success" || !res.data.data?.options?.length) {
      throw new Error(res.data.message || copy.optionMissing)
    }

    const best = [...res.data.data.options]
      .map((option) => ({ option, score: scoreSearchOption(option, bookingFlight) }))
      .sort((a, b) => b.score - a.score || Number(a.option.price || 0) - Number(b.option.price || 0))[0]?.option

    return best?.id || bookingFlight.id
  }

  const proceedToFormalization = () => {
    if (!bookingFlight.id) {
      setToastMsg(copy.optionMissing)
      setToastOpen(true)
      return
    }

    const curr = bookingCart.get()
    bookingCart.set({
      ...curr,
      flightId: bookingFlight.id,
      route: `${bookingFlight.from} → ${bookingFlight.to}`,
      date,
      pax: passengerCount,
      amount: total,
      currency: bookingFlight.currency,
      airline: bookingFlight.airline,
      flightNo: bookingFlight.flightNo,
      cabin: bookingFlight.cabin,
      baggage: bookingFlight.baggage,
      carryOn: bookingFlight.carryOn,
      segments: bookingFlight.segments ?? [],
    })

    if (stayOnPage) {
      setBookingStep("details")
      return
    }

    onClose()
    navigate("/checkout")
  }

  const errors = useMemo(() => {
    const e: string[] = []

    if (!payer.email.trim() || !isEmail(payer.email)) e.push(`${copy.payerDetails}: email`)
    if (!payer.phone.trim() || !isPhone(payer.phone)) e.push(`${copy.payerDetails}: phone`)
    if (!payer.countryCode?.trim()) e.push(`${copy.payerDetails}: ${copy.countryCode}`)

    passengers.forEach((p, idx) => {
      if (!p.firstName.trim()) e.push(`${copy.passenger} ${idx + 1}: ${copy.firstName}`)
      if (!p.lastName.trim()) e.push(`${copy.passenger} ${idx + 1}: ${copy.lastName}`)
      if (!p.birthDate) e.push(`${copy.passenger} ${idx + 1}: ${copy.birthDate}`)
      if (!p.passportIssued) e.push(`${copy.passenger} ${idx + 1}: ${copy.passportIssued}`)
      if (!p.passportNo.trim()) e.push(`${copy.passenger} ${idx + 1}: ${copy.passportNumber}`)
      if (!p.passportExpiry) e.push(`${copy.passenger} ${idx + 1}: ${copy.passportExpiry}`)
      if (!p.citizenship.trim()) e.push(`${copy.passenger} ${idx + 1}: ${copy.citizenship}`)
      if (!p.countryCode.trim()) e.push(`${copy.passenger} ${idx + 1}: ${copy.countryCode}`)
    })

    return e
  }, [payer, passengers])

  const canSubmit = errors.length === 0 && paymentMethod !== "" && agreeData

  const submit = async () => {
    if (!bookingFlight.id) {
      setToastMsg(copy.optionMissing)
      setToastOpen(true)
      return
    }
    if (!canSubmit) {
      const head = errors[0] ?? copy.invalidData
      const more = errors.length > 1 ? ` + ${errors.length - 1}` : ""
      setToastMsg(`${head}${more}`)
      setToastOpen(true)
      return
    }

    setBookLoading(true)
    setLastOrderId(null)
    try {
      const token = await ensureAccessToken()
      if (!token) {
        setToastMsg(copy.loginFirst)
        setToastOpen(true)
        return
      }

      setToastMsg(copy.refreshingOffer)
      setToastOpen(true)
      const optionID = await getFreshBookableOptionId()

      const res = await bookAir({
        optionID,
        email: payer.email.trim(),
        countryCode: payer.countryCode?.trim() || "998",
        phoneNumber: payer.phone.replace(/\D/g, ""),
        passengers: passengers.map((p) => ({
          type: "ADT",
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          gender: p.gender,
          dob: p.birthDate,
          countryCode: p.countryCode.trim() || "UZ",
          documentType: 1,
          documentNumber: p.passportNo.trim().toUpperCase(),
          documentIssued: p.passportIssued,
          documentExpires: p.passportExpiry,
        })),
      })

      if (res.data.status !== "success") {
        setToastMsg(translateBookingError(res.data.message, language))
        setToastOpen(true)
        return
      }
      const orderID = res.data.data?.orderID ?? null
      setLastOrderId(orderID)
      setToastMsg(
        orderID
          ? `${copy.bookingSuccess} Order ID: ${orderID}. ${language === "ru" ? "Возвращаемся к рейсам..." : language === "en" ? "Returning to flights..." : "Reyslar bo'limiga qaytilmoqda..."}`
          : copy.bookingSuccess
      )
      setToastOpen(true)
      if (orderID) {
        const curr = bookingCart.get()
        bookingCart.set({
          ...curr,
          flightId: optionID,
          route: `${bookingFlight.from} → ${bookingFlight.to}`,
          date,
          pax: passengerCount,
          lastOrderId: orderID,
          amount: total,
          currency: bookingFlight.currency,
          airline: bookingFlight.airline,
          flightNo: bookingFlight.flightNo,
          cabin: bookingFlight.cabin,
          baggage: bookingFlight.baggage,
          carryOn: bookingFlight.carryOn,
          paymentMethod,
          paymentStatus: "pending",
          segments: bookingFlight.segments ?? [],
          payer,
          passengers: passengers.map((p) => ({
            id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            birthDate: p.birthDate,
            citizenship: p.citizenship.trim(),
            passportNo: p.passportNo.trim().toUpperCase(),
            passportIssued: p.passportIssued,
            passportExpiry: p.passportExpiry,
            gender: p.gender,
              countryCode: p.countryCode,
          })),
          history: [
            ...(curr.history ?? []),
            {
              orderId: orderID,
              route: `${bookingFlight.from} → ${bookingFlight.to}`,
              date,
              createdAt: new Date().toISOString(),
            },
          ],
        })
        window.setTimeout(() => {
          onClose()
          navigate("/flights")
        }, 1600)
      }
    } catch (err: any) {
      const msg = translateBookingError(err?.response?.data?.message || copy.bookingError, language)
      setToastMsg(msg)
      setToastOpen(true)
      return
    } finally {
      setBookLoading(false)
    }
    if (!stayOnPage) {
      onClose()
      navigate("/checkout")
    }
  }

  const activeOrderId = lastOrderId

  const resolvePrimaryServiceId = async (orderId: number) => {
    const res = await getOrderById(orderId)
    if (res.data.status !== "success") {
      throw new Error(res.data.message || copy.orderNotFound)
    }

    const item = res.data.data?.[0]
    const serviceId = item?.services?.[0]?.serviceId
    if (!serviceId) {
      throw new Error(copy.orderNotFound)
    }

    setOrderData({
      id: item?.id,
      serviceId,
      status: item?.status,
      currency: item?.currency,
      price: item?.price,
      client: item?.client,
      serviceType: item?.services?.[0]?.type,
      reservationId: item?.services?.[0]?.reservation?.id,
    })

    return serviceId
  }

  const runOrderAction = async (
    action: "issue" | "cancel" | "void",
    setLoading: (value: boolean) => void
  ) => {
    if (!activeOrderId) {
      setToastMsg(copy.orderMissing)
      setToastOpen(true)
      return
    }

    setLoading(true)
    try {
      const actionId =
        action === "issue"
          ? activeOrderId
          : await resolvePrimaryServiceId(activeOrderId)

      const res =
        action === "issue"
          ? await issueOrder(actionId)
          : action === "cancel"
            ? await cancelOrderService(actionId)
            : await voidOrderService(actionId)

      const fallback =
        action === "issue"
          ? copy.issueDone
          : action === "cancel"
            ? copy.cancelDone
            : copy.voidDone
      setToastMsg(res.data.message || fallback)
      setToastOpen(true)
    } catch (err: any) {
      const fallback =
        action === "issue"
          ? copy.issueError
          : action === "cancel"
            ? copy.cancelError
            : copy.voidError
      setToastMsg(err?.response?.data?.message || err?.message || fallback)
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const checkOrderStatus = async () => {
    if (!activeOrderId) {
      setToastMsg(copy.orderMissing)
      setToastOpen(true)
      return
    }

    setOrderLoading(true)
    setOrderData(null)
    try {
      const res = await getOrderById(activeOrderId)
      if (res.data.status !== "success") {
        setToastMsg(res.data.message || copy.orderNotFound)
        setToastOpen(true)
        return
      }
      const item = res.data.data?.[0]
      setOrderData({
        id: item?.id,
        serviceId: item?.services?.[0]?.serviceId,
        status: item?.status,
        currency: item?.currency,
        price: item?.price,
        client: item?.client,
        serviceType: item?.services?.[0]?.type,
        reservationId: item?.services?.[0]?.reservation?.id,
      })
      setToastMsg(res.data.message || copy.success)
      setToastOpen(true)
    } catch (err: any) {
      setToastMsg(err?.response?.data?.message || copy.orderRequestError)
      setToastOpen(true)
    } finally {
      setOrderLoading(false)
    }
  }

  // UI umuman render qilmaymiz (lekin hooklar ishlayveradi)
  if (!flight) return null

  if (pageMode) {
    return (
      <div ref={bookingTopRef} className="flight-details-light relative min-h-screen bg-[#ECEAE5]">
        <div className="bg-white">
            {/* header */}
            <div className="relative border-b border-[#D9D5CE] bg-[linear-gradient(135deg,#FFFFFF_0%,#F3F8FF_46%,#F4FFF9_100%)] p-3.5 md:p-5 dark:border-[#D9D5CE] dark:bg-white">
              <button
                onClick={onClose}
                className="
                  absolute right-5 top-5 z-10
                  h-10 w-10 rounded-xl
                  border border-[#D9D5CE] bg-white/90
                  text-[#111A34] hover:bg-[#F3F1ED] transition
                  dark:border-[#D9D5CE] dark:bg-white dark:text-[#111A34] dark:hover:bg-[#F3F1ED]
                  grid place-items-center
                "
              >
                <X size={18} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mb-4 inline-flex h-9 items-center gap-2 rounded-full border border-[#D9D5CE] bg-white px-3 text-xs font-semibold text-[#174A8B] shadow-[0_10px_24px_rgba(23,74,139,0.08)] transition hover:-translate-y-0.5 hover:border-[#174A8B]/35 hover:bg-[#F3F1ED] dark:border-[#D9D5CE] dark:bg-white dark:text-[#174A8B] dark:hover:bg-[#F3F1ED]"
              >
                <ArrowLeft size={15} />
                {copy.back}
              </button>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pr-14 md:pr-16">
                <div>
                  <div className="text-[#5F5A54] text-xs dark:text-[#5F5A54]">
                    {bookingFlight.airline} · {flightNo}
                  </div>
                  <div className="mt-1 text-xl md:text-2xl font-extrabold text-[#111A34] dark:text-[#111A34]">
                    {bookingFlight.from} → {bookingFlight.to}
                  </div>
                  <div className="mt-1.5 text-[#5F5A54] text-xs dark:text-[#5F5A54]">
                    {copy.headerDate}: <span className="text-[#111A34] dark:text-[#111A34]">{date || "—"}</span> · {copy.headerPax}:{" "}
                    <span className="text-[#111A34] dark:text-[#111A34]">{passengerCount}</span>
                  </div>
                </div>

                <div className="text-left md:text-right w-full md:w-auto">
                  <div className="text-[#77716A] text-xs dark:text-[#77716A]">{copy.finalPrice}</div>
                  <div className="text-2xl font-extrabold text-[#111A34] dark:text-[#111A34]">
                    {formatMoney(total, bookingFlight.currency)}
                  </div>
                  <div className="text-[#77716A] text-xs dark:text-[#77716A]">{copy.taxesIncluded}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px]">
                <span
                  className={[
                    "px-2.5 py-0.5 rounded-full border",
                    "border-[#174A8B] bg-[#174A8B] text-white dark:border-[#174A8B] dark:bg-[#174A8B] dark:text-white",
                  ].join(" ")}
                >
                  {copy.step1}
                </span>
                <span className="text-[#77716A] dark:text-[#77716A]">→</span>
                <span
                  className={[
                    "px-2.5 py-0.5 rounded-full border",
                    "border-[#174A8B] bg-[#174A8B] text-white dark:border-[#174A8B] dark:bg-[#174A8B] dark:text-white",
                  ].join(" ")}
                >
                  {copy.step2}
                </span>
                <span className="text-[#77716A] dark:text-[#77716A]">→</span>
                <span
                  className={[
                    "px-2.5 py-0.5 rounded-full border",
                    "border-[#174A8B] bg-[#174A8B] text-white dark:border-[#174A8B] dark:bg-[#174A8B] dark:text-white",
                  ].join(" ")}
                >
                  {copy.step3}
                </span>
              </div>

              {(
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <Pill icon={PlaneTakeoff} label={copy.depart} value={bookingFlight.depart} />
                  <Pill icon={PlaneLanding} label={copy.arrive} value={bookingFlight.arrive} />
                  <Pill icon={Clock} label={copy.duration} value={fmtDuration(bookingFlight.durationMin, language)} />
                </div>
              )}
            </div>

            {/* body */}
            <div className="px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-4 md:p-5 md:pb-24">
              {(
                <div ref={selectTopRef} className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="rounded-[20px] border border-[#CFE0F7] bg-[linear-gradient(135deg,#FFFFFF_0%,#F3F8FF_58%,#EEF7FF_100%)] p-4 shadow-[0_12px_28px_rgba(23,74,139,0.06)] dark:border-[#D9D5CE] dark:bg-white dark:shadow-none">
                      <AccordionSection
                        title={copy.fareRules}
                        subtitle={copy.fareTerms}
                        open={openInfoSections.fareRules}
                        onToggle={() => toggleInfoSection("fareRules")}
                      >

                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded-full border border-[#D9D5CE] bg-[#F3F1ED] px-2.5 py-0.5 text-[#174A8B] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#174A8B]">
                          {cabin}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs ${
                            refundable
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-[#D9D5CE] bg-white text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-white dark:text-[#5F5A54]"
                          }`}
                        >
                          {refundable ? copy.refundable : copy.nonRefundable}
                        </span>

                        <span className="rounded-full border border-[#D9D5CE] bg-white px-2.5 py-0.5 text-[#5F5A54] inline-flex items-center gap-1.5 dark:border-[#D9D5CE] dark:bg-white dark:text-[#5F5A54]">
                          <Luggage size={12} />
                          {bookingFlight.baggage ?? "—"}
                        </span>

                        <span className="rounded-full border border-[#D9D5CE] bg-white px-2.5 py-0.5 text-[#5F5A54] inline-flex items-center gap-1.5 dark:border-[#D9D5CE] dark:bg-white dark:text-[#5F5A54]">
                          <Luggage size={12} />
                          {copy.carryOn}: {bookingFlight.carryOn ?? "—"}
                        </span>
                      </div>

                      <div className="mt-3 text-[#5F5A54] text-xs dark:text-[#5F5A54]">
                        {fareLoading && copy.faresLoading}
                        {!fareLoading && fareError && `${copy.fares}: ${fareError}`}
                        {!fareLoading && !fareError && fareFamiliesData.length === 0 && fareData?.families?.length ? (
                          <div className="mt-2 space-y-2">
                            {fareData.families.map((f) => (
                              <div key={f.id} className="rounded-[16px] border border-[#D9D5CE] bg-white p-3 dark:border-[#D9D5CE] dark:bg-white">
                                <div className="text-[#111A34] font-semibold text-sm dark:text-[#111A34]">{translateFareName(f.name, language)}</div>
                                <div className="mt-1 text-[#5F5A54] text-xs dark:text-[#5F5A54]">
                                  {copy.baggage}: {f.baggageInfos?.join(", ") || "—"}
                                </div>
                                {f.services && f.services.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {f.services.map((s, i) => (
                                      <span
                                        key={`${f.id}-${i}`}
                                        className="rounded-full border border-[#D9D5CE] bg-[#F3F1ED] px-2.5 py-1 text-[11px] text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]"
                                      >
                                        {translateServiceText(s.description || "", language) || s.description}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      </AccordionSection>

                      <div className="mt-3">
                        <AccordionSection
                        title={copy.flightDetails}
                          subtitle={
                            optionDetailsLoading
                              ? copy.flightDetailsLoading
                              : optionDetailsError
                                ? optionDetailsError
                                : itinerarySegments.length
                                  ? `${itinerarySegments.length} ${copy.segment}`
                                  : undefined
                          }
                          open={openInfoSections.flightDetails}
                          onToggle={() => toggleInfoSection("flightDetails")}
                        >
                        <div className="mt-2 text-[#5F5A54] text-xs dark:text-[#5F5A54]">
                          {optionDetailsLoading && copy.flightDetailsLoading}
                          {!optionDetailsLoading &&
                            optionDetailsError &&
                            `${copy.flightDetails}: ${optionDetailsError}`}
                        </div>
                        {itinerarySegments.length > 0 ? (
                          <div className="mt-3 space-y-3">
                            {itinerarySegments.map((segment, index) => (
                              <div key={segment.id} className="rounded-[16px] border border-[#D9D5CE] bg-white p-3 dark:border-[#D9D5CE] dark:bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-[#111A34] text-sm font-semibold dark:text-[#111A34]">
                                    {copy.segment} {index + 1}: {segment.origin} → {segment.destination}
                                  </div>
                                  <div className="text-xs text-[#77716A] dark:text-[#77716A]">
                                    {segment.carrier || "—"} {segment.flightNumber || ""}
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.time}: {segment.departure} → {segment.arrival}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.duration}: {segment.duration ? fmtDuration(segment.duration, language) : "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.departTerminal}: {segment.departureTerminal || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.arriveTerminal}: {segment.arrivalTerminal || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.baggage}: {segment.baggage || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.carryOn}: {segment.carryOn || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.bookingClass}: {segment.bookingClass || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.serviceClass}: {segment.serviceClass || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.operatingAirline}: {segment.operatingCarrier || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.seatsAvailable}: {segment.seatsAvailable ?? "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.aircraftType}: {segment.equipment || "—"}
                                  </div>
                                  <div className="rounded-[12px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                                    {copy.fareCode}: {segment.fareBasis || "—"}
                                  </div>
                                </div>
                                {segment.layover ? (
                                  <div className="mt-2 text-xs text-[#77716A] dark:text-[#77716A]">
                                    {copy.layover}: {fmtDuration(segment.layover, language)}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        </AccordionSection>
                      </div>

                      <div className="mt-3">
                        <div className="text-[#111A34] text-[13px] font-semibold dark:text-[#111A34]">{copy.farePackages}</div>
                        <div className="mt-1.5 text-[#5F5A54] text-xs dark:text-[#5F5A54]">
                          {fareFamiliesLoading && copy.farePackagesLoading}
                          {!fareFamiliesLoading &&
                            fareFamiliesError &&
                            `${copy.farePackages}: ${fareFamiliesError}`}
                          {!fareFamiliesLoading &&
                            !fareFamiliesError &&
                            fareFamiliesData.length === 0 &&
                            copy.farePackagesNotFound}
                        </div>

                        {!fareFamiliesLoading && !fareFamiliesError && fareFamiliesData.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {/* ── Fare cards row ── */}
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                              {fareFamiliesData.map((f, idx) => {
                                const active = selectedFareId === f.id
                                const isBest = idx === 1
                                const fareTone = {
                                  active: `border-[#5f72c7]/35 ${brandBlueGradient} text-white shadow-[0_16px_30px_rgba(2,19,115,0.24)]`,
                                  idle: `border-[#D7E2F5] ${brandBlueSoftGradient} text-[#111A34] hover:border-[#5f72c7]/45 hover:shadow-[0_14px_28px_rgba(2,19,115,0.12)]`,
                                }
                                return (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setSelectedFareId(f.id)}
                                    className={[
                                      "group relative overflow-hidden rounded-[14px] border p-3 text-left transition-all duration-300 hover:-translate-y-0.5",
                                      active ? fareTone.active : fareTone.idle,
                                      brandFocus,
                                      "dark:border-[#D9D5CE] dark:bg-white dark:bg-none dark:text-[#174A8B] dark:hover:bg-[#F3F1ED] dark:hover:shadow-none",
                                    ].join(" ")}
                                  >
                                    <span className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/45 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60 dark:hidden" />
                                    {isBest && (
                                      <span className={`absolute left-1/2 top-1 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#5f72c7]/35 ${brandBlueGradient} px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-[0_4px_10px_rgba(2,19,115,0.30)]`}>
                                        Eng zo'r
                                      </span>
                                    )}
                                    <div className="flex items-start gap-2.5">
                                      <span className={[
                                        "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition",
                                        active ? "border-white bg-white" : "border-[#D9D5CE] dark:border-[#D9D5CE]",
                                      ].join(" ")}>
                                        {active && <span className="block h-full w-full scale-50 rounded-full bg-[#1c2433]" />}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div className={`text-[13px] font-bold ${active ? "text-white" : "text-[#111A34] dark:text-[#111A34]"}`}>
                                          {translateFareName(f.name, language)}
                                        </div>
                                        <div className={`mt-1 text-[16px] font-black leading-tight ${active ? "text-white" : "text-[#111A34] dark:text-[#111A34]"}`}>
                                          {formatMoney(f.price, f.currency ?? bookingFlight.currency)}
                                        </div>
                                        {f.seatsAvailable != null && (
                                          <div className={`mt-1 text-[10px] font-medium ${active ? "text-white/80" : "text-[#516072] dark:text-[#77716A]"}`}>
                                            {f.seatsAvailable} {copy.seatsLeft}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>

                            {/* ── Selected fare rules: 3-column ── */}
                            {selectedFare && (
                              <div className="rounded-[14px] border border-[#D9D5CE] bg-white p-3 dark:border-[#D9D5CE] dark:bg-white">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                  {/* Included */}
                                  <div>
                                    <div className="mb-2 text-[12px] font-bold text-[#111A34] dark:text-[#111A34]">
                                      {copy.fareIncluded}
                                    </div>
                                    <div className="space-y-2">
                                      {(selectedFare.includedServices.length
                                        ? selectedFare.includedServices
                                        : [selectedFare.carryOn, selectedFare.baggage].filter(Boolean) as string[]
                                      ).map((item) => (
                                        <div key={`inc-${item}`} className="flex items-start gap-1.5 text-[11px] text-[#374151] dark:text-[#374151]">
                                          <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-white">
                                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          </span>
                                          <span>{item}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Chargeable / Allowed */}
                                  <div>
                                    <div className="mb-2 text-[12px] font-bold text-[#111A34] dark:text-[#111A34]">
                                      {copy.fareChargeable}
                                    </div>
                                    <div className="space-y-2">
                                      {selectedFare.chargeableServices.length === 0 ? (
                                        <div className="flex items-start gap-1.5 text-[11px] text-[#374151] dark:text-[#374151]">
                                          <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-white">
                                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          </span>
                                          <span>—</span>
                                        </div>
                                      ) : selectedFare.chargeableServices.map((item) => (
                                        <div key={`chg-${item}`} className="flex items-start gap-1.5 text-[11px] text-[#374151] dark:text-[#374151]">
                                          <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-white">
                                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          </span>
                                          <span>{item}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Unavailable */}
                                  <div>
                                    <div className="mb-2 text-[12px] font-bold text-[#111A34] dark:text-[#111A34]">
                                      {copy.fareUnavailable}
                                    </div>
                                    <div className="space-y-2">
                                      {selectedFare.unavailableServices.length === 0 ? (
                                        <div className="text-[11px] text-[#9aacbf] dark:text-[#6a8ab0]">—</div>
                                      ) : selectedFare.unavailableServices.map((item) => (
                                        <div key={`na-${item}`} className="flex items-start gap-1.5 text-[11px] text-[#374151] dark:text-[#374151]">
                                          <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#ef4444] text-white">
                                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 2l4 4M6 2L2 6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                          </span>
                                          <span>{item}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Total footer */}
                                <div className="mt-3 flex items-center justify-between border-t border-[#D9D5CE] pt-2.5 dark:border-[#D9D5CE]">
                                  <div className="text-[11px] text-[#77716A] dark:text-[#77716A]">
                                    {copy.selectedFare}: <span className="font-semibold text-[#111A34] dark:text-[#111A34]">{translateFareName(selectedFare.name, language)}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] text-[#77716A] dark:text-[#77716A]">{copy.total}</div>
                                    <div className="text-[14px] font-black text-[#111A34] dark:text-[#111A34]">
                                      {formatMoney(total, bookingFlight.currency)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[20px] border border-[#DDE6C8] bg-[linear-gradient(135deg,#FFFFFF_0%,#F6FFF1_54%,#EEFBE5_100%)] p-4 shadow-[0_12px_28px_rgba(87,131,42,0.06)] dark:border-[#D9D5CE] dark:bg-white dark:shadow-none">
                      <div className="text-[#111A34] text-sm font-semibold dark:text-[#111A34]">{copy.continue}</div>
                      <div className="mt-1.5 text-[#5F5A54] text-xs leading-5 dark:text-[#5F5A54]">{copy.enterPassengerInfo}</div>

                      {selectedFare && (
                        <div className="mt-3 rounded-[14px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2.5 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                          <div className="font-semibold text-[#111A34] dark:text-[#111A34]">
                            {copy.selectedFare}: {translateFareName(selectedFare.name, language)}
                          </div>
                          <div className="mt-1 text-xs text-[#77716A] dark:text-[#77716A]">
                            {formatMoney(total, bookingFlight.currency)}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={proceedToFormalization}
                        className={`mt-4 h-10 w-full rounded-xl text-sm font-semibold ${brandPrimaryAction}`}
                      >
                        {copy.select}
                      </button>

                      <div className="mt-2.5 rounded-[14px] border border-[#D9D5CE] bg-[#F3F1ED] px-3 py-2.5 text-xs text-[#5F5A54] dark:border-[#D9D5CE] dark:bg-[#F3F1ED] dark:text-[#5F5A54]">
                        {passengerCount} {copy.formOpensFor}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#B9D4FF,#B9E9D2)]" />
                <div className="rounded-full border border-[#CFE0F7] bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#174A8B] shadow-[0_10px_24px_rgba(23,74,139,0.07)]">
                  {copy.step2}
                </div>
                <div className="h-px flex-1 bg-[linear-gradient(90deg,#B9E9D2,#F4C6D7,transparent)]" />
              </div>

              {(
                <div ref={detailsTopRef} className="scroll-mt-28 space-y-5">
                  <div className="relative overflow-hidden rounded-[22px] border border-[#CFE0F7] bg-[linear-gradient(135deg,#F4F9FF_0%,#FFFFFF_48%,#EEF7FF_100%)] p-5 pl-6 shadow-[0_14px_32px_rgba(23,74,139,0.08)] dark:border-[#D9D5CE] dark:bg-white dark:bg-none dark:shadow-none">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-[#174A8B]" />
                    <div className="flex items-center justify-between">
                      <div className="text-[#111A34] font-semibold inline-flex items-center gap-2 dark:text-[#111A34]">
                        <User size={18} />
                        {copy.payerDetails}
                      </div>
                      <div className="text-xs text-[#77716A] dark:text-[#77716A]">{copy.emailPhone}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label={copy.countryCode}
                        placeholder="998"
                        value={payer.countryCode ?? ""}
                        onChange={(v) => setPayer((p) => ({ ...p, countryCode: v.replace(/\D/g, "") }))}
                      />
                      <Input
                        label="Email"
                        placeholder="example@gmail.com"
                        icon={Mail}
                        value={payer.email}
                        onChange={(v) => setPayer((p) => ({ ...p, email: v }))}
                      />
                      <Input
                        label={copy.phoneNumber}
                        placeholder="+998 95 559 54 44"
                        icon={Phone}
                        value={payer.phone}
                        onChange={(v) =>
                          setPayer((p) => ({ ...p, phone: formatUzPhoneInput(v) }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#B9E9D2)]" />
                    <div className="rounded-full border border-[#B9E9D2] bg-[#F0FCF7] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#157347]">
                      {copy.passengersDetails}
                    </div>
                    <div className="h-px flex-1 bg-[linear-gradient(90deg,#B9E9D2,transparent)]" />
                  </div>

                  <div className="relative overflow-hidden rounded-[28px] border border-[#B9E9D2] bg-[linear-gradient(112deg,#F0FCF7_0%,#FFFFFF_48%,#ECFDF3_100%)] p-6 pl-7 shadow-[0_24px_54px_rgba(22,163,74,0.10)] dark:border-[#D9D5CE] dark:bg-white dark:bg-none dark:shadow-none">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-[#22A06B]" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[#111A34] font-semibold inline-flex items-center gap-2 dark:text-[#111A34]">
                        <Users size={18} />
                        {copy.passengersDetails}
                      </div>
                      <div className="text-xs text-[#77716A] dark:text-[#77716A]">{copy.total}: {passengerCount}</div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {passengers.map((p, idx) => (
                        <div
                          key={idx}
                          className="scroll-mt-28 rounded-[18px] border border-[#D9D5CE] bg-[#F8F7F4] p-4 dark:border-[#D9D5CE] dark:bg-[#F8F7F4]"
                        >
                          <div className="text-[#111A34] font-semibold text-sm dark:text-[#111A34]">{copy.passenger} #{idx + 1}</div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              label={copy.firstName}
                              placeholder={copy.firstName}
                              value={p.firstName}
                              onChange={(v) =>
                                setPassengers((arr) => {
                                  const next = [...arr]
                                  next[idx] = { ...next[idx], firstName: v }
                                  return next
                                })
                              }
                            />
                            <Input
                              label={copy.lastName}
                              placeholder={copy.lastName}
                              value={p.lastName}
                              onChange={(v) =>
                                setPassengers((arr) => {
                                  const next = [...arr]
                                  next[idx] = { ...next[idx], lastName: v }
                                  return next
                                })
                              }
                            />
                            <Input
                              label={copy.birthDate}
                              type="date"
                              value={p.birthDate}
                              onChange={(v) =>
                                setPassengers((arr) => {
                                  const next = [...arr]
                                  next[idx] = { ...next[idx], birthDate: v }
                                  return next
                                })
                              }
                            />
                            <Input
                              label={copy.passportIssued}
                              type="date"
                              value={p.passportIssued}
                              onChange={(v) =>
                                setPassengers((arr) => {
                                  const next = [...arr]
                                  next[idx] = { ...next[idx], passportIssued: v }
                                  return next
                                })
                              }
                            />
                            <Input
                              label={copy.citizenship}
                              placeholder="Uzbekistan"
                              value={p.citizenship}
                              onChange={(v) =>
                                setPassengers((arr) => {
                                  const next = [...arr]
                                  next[idx] = { ...next[idx], citizenship: v }
                                  return next
                                })
                              }
                            />
                            <Input
                              label={copy.countryCode}
                              placeholder="UZ"
                              value={p.countryCode}
                              onChange={(v) =>
                                setPassengers((arr) => {
                                  const next = [...arr]
                                  next[idx] = { ...next[idx], countryCode: v.toUpperCase() }
                                  return next
                                })
                              }
                            />
                            <div className="md:col-span-2">
                              <label className="block">
                                <div className="mb-2 text-xs text-[#77716A] dark:text-[#77716A]">{copy.gender}</div>
                                <select
                                  className="h-12 w-full rounded-2xl border border-[#D9D5CE] bg-white px-4 text-[#111A34] outline-none transition focus:border-[#174A8B]/45 focus:bg-white dark:border-[#D9D5CE] dark:bg-white dark:text-[#111A34] dark:focus:border-[#174A8B]/45"
                                  value={p.gender}
                                  onChange={(e) =>
                                    setPassengers((arr) => {
                                      const next = [...arr]
                                      next[idx] = { ...next[idx], gender: e.target.value as "M" | "F" }
                                      return next
                                    })
                                  }
                                >
                                  <option value="M">M</option>
                                  <option value="F">F</option>
                                </select>
                              </label>
                            </div>
                            <Input
                              label={copy.passportExpiry}
                              type="date"
                              value={p.passportExpiry}
                              onChange={(v) =>
                                setPassengers((arr) => {
                                  const next = [...arr]
                                  next[idx] = { ...next[idx], passportExpiry: v }
                                  return next
                                })
                              }
                            />
                            <div className="md:col-span-2">
                              <Input
                                label={copy.passportNumber}
                                placeholder="AA1234567"
                                value={p.passportNo}
                                onChange={(v) =>
                                  setPassengers((arr) => {
                                    const next = [...arr]
                                    next[idx] = { ...next[idx], passportNo: v.toUpperCase() }
                                    return next
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#D5C6FF)]" />
                    <div className="rounded-full border border-[#D5C6FF] bg-[#F7F2FF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6D3BC7]">
                      {copy.step3}
                    </div>
                    <div className="h-px flex-1 bg-[linear-gradient(90deg,#D5C6FF,transparent)]" />
                  </div>

                  <div className="relative overflow-hidden rounded-[22px] border border-[#D5C6FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F2FF_56%,#F0E8FF_100%)] p-5 pl-6 shadow-[0_14px_32px_rgba(109,59,199,0.08)] dark:border-[#D9D5CE] dark:bg-white dark:shadow-none">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-[#7C3AED]" />
                    <div className="text-[#111A34] font-semibold dark:text-[#111A34]">{copy.paymentMethod}</div>
                    <div className="mt-2 text-[#5F5A54] text-sm dark:text-[#5F5A54]">{copy.chooseMethod}</div>
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                      {[
                        { id: "click", label: "Click" },
                        { id: "payme", label: "Payme" },
                        { id: "uzum", label: "Uzum" },
                        { id: "paynet", label: "Paynet" },
                        { id: "visa", label: "Visa / Master" },
                      ].map((m) => {
                        const Icon = paymentMethodIcon(m.id)
                        return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={[
                            "flex h-14 items-center justify-center gap-3 rounded-[18px] border text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5",
                            paymentMethodTone(m.id, paymentMethod === m.id),
                            "dark:border-[#D9D5CE] dark:bg-[#EBEBEB] dark:bg-none dark:text-[#174A8B] dark:hover:bg-[#F3F1ED] dark:hover:shadow-none",
                          ].join(" ")}
                        >
                          <Icon size={21} strokeWidth={2.1} />
                          {m.label}
                        </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[22px] border border-[#F2C6D3] bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF5F8_52%,#FDF2F8_100%)] p-5 pl-6 shadow-[0_14px_32px_rgba(190,67,102,0.07)] dark:border-[#D9D5CE] dark:bg-white dark:shadow-none">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-[#D9467A]" />
                    <div className="text-[#111A34] font-semibold dark:text-[#111A34]">{copy.finishOrder}</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <PriceRow label={copy.route} value={`${bookingFlight.from} → ${bookingFlight.to}`} />
                      <PriceRow label={copy.headerDate} value={date || "—"} />
                      <PriceRow label={copy.passengerCount} value={String(passengerCount)} />
                      <PriceRow label={copy.totalPrice} value={formatMoney(total, bookingFlight.currency)} />
                    </div>
                    <div className="mt-3 text-xs text-[#77716A] dark:text-[#77716A]">
                      {copy.selectedPayment}:{" "}
                      <span className="font-semibold text-[#111A34] dark:text-[#111A34]">
                        {paymentMethod ? paymentMethod.toUpperCase() : copy.unselected}
                      </span>
                    </div>
                  </div>

                  <label className="mt-2 flex items-start gap-2 text-xs text-[#5F5A54] dark:text-[#5F5A54]">
                    <Checkbox
                      checked={agreeData}
                      onCheckedChange={(checked) => setAgreeData(checked === true)}
                      size="sm"
                      className="mt-0.5 border-[#174A8B]/35 bg-white text-white data-[state=checked]:border-[#174A8B] data-[state=checked]:bg-[#174A8B]"
                    />
                    {copy.confirmData}
                  </label>
                  {!agreeData && (
                    <div className="text-xs text-[#77716A] dark:text-[#77716A]">
                      {copy.markConfirmation}
                    </div>
                  )}

                  {lastOrderId && (
                    <div className="text-xs text-emerald-700 dark:text-[#a7f0ce]">
                      Order ID: {lastOrderId}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={submit}
                      disabled={!canSubmit || bookLoading}
                      className={`h-12 rounded-2xl font-semibold ${brandPrimaryAction}`}
                    >
                      {bookLoading ? "..." : copy.checkout}
                    </button>
                    <button
                      onClick={() => setBookingStep("select")}
                      className={`h-12 rounded-2xl font-semibold ${brandSecondaryAction}`}
                    >
                      {copy.back}
                    </button>
                  </div>

                  {activeOrderId && (
                    <div className="rounded-[22px] border border-[#D9D5CE] bg-white p-5 shadow-none dark:border-[#D9D5CE] dark:bg-white">
                      <div className="text-[#111A34] font-semibold dark:text-[#111A34]">Order ID: {activeOrderId}</div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => runOrderAction("issue", setIssueLoading)}
                          disabled={issueLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandPrimaryAction}`}
                        >
                          {issueLoading ? "Issue..." : copy.issuePnr}
                        </button>
                        <button
                          type="button"
                          onClick={checkOrderStatus}
                          disabled={orderLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandSecondaryAction}`}
                        >
                          {orderLoading ? "..." : copy.getOrderById}
                        </button>
                        <button
                          type="button"
                          onClick={() => runOrderAction("cancel", setCancelLoading)}
                          disabled={cancelLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandSecondaryAction}`}
                        >
                          {cancelLoading ? "Cancel..." : copy.cancelPnr}
                        </button>
                        <button
                          type="button"
                          onClick={() => runOrderAction("void", setVoidLoading)}
                          disabled={voidLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandSecondaryAction}`}
                        >
                          {voidLoading ? "VOID..." : copy.voidPnr}
                        </button>
                      </div>

                      {orderData && (
                        <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-[#D9D5CE] bg-[#F3F1ED] p-4 text-xs text-[#5F5A54] sm:grid-cols-2">
                          <div>ID: {orderData?.id ?? "—"}</div>
                          <div>{copy.status}: {orderData?.status ?? "—"}</div>
                          <div>{copy.totalPrice}: {formatMoney(orderData?.price ?? 0, orderData?.currency)}</div>
                          <div>{copy.client}: {orderData?.client ?? "—"}</div>
                          <div>{copy.service}: {orderData?.serviceType ?? "—"}</div>
                          <div>{copy.reservation}: {orderData?.reservationId ?? "—"}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {false && step === "pay" && (
                <div ref={payTopRef} className="scroll-mt-28 space-y-4">
                  <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(112deg,#DCEBFF_0%,#E6E0FF_38%,#F4E3FA_72%,#FFE3EF_100%)] p-6 shadow-[0_24px_54px_rgba(23,74,139,0.13)] dark:border-[#D9D5CE] dark:bg-white dark:bg-none dark:shadow-none">
                    <div className="text-[#111A34] font-semibold dark:text-[#111A34]">{copy.paymentMethod}</div>
                    <div className="mt-2 text-[#5F5A54] text-sm dark:text-[#5F5A54]">{copy.chooseMethod}</div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { id: "click", label: "Click" },
                        { id: "payme", label: "Payme" },
                        { id: "uzum", label: "Uzum" },
                        { id: "paynet", label: "Paynet" },
                        { id: "visa", label: "Visa / Master" },
                      ].map((m) => {
                        const Icon = paymentMethodIcon(m.id)
                        return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={[
                            "flex h-14 items-center justify-center gap-3 rounded-[18px] border text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5",
                            paymentMethodTone(m.id, paymentMethod === m.id),
                            "dark:border-[#D9D5CE] dark:bg-[#EBEBEB] dark:bg-none dark:text-[#174A8B] dark:hover:bg-[#F3F1ED] dark:hover:shadow-none",
                          ].join(" ")}
                        >
                          <Icon size={21} strokeWidth={2.1} />
                          {m.label}
                        </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[#D9D5CE] bg-white p-5 shadow-none dark:border-[#D9D5CE] dark:bg-white dark:shadow-none">
                    <div className="text-[#111A34] font-semibold dark:text-[#111A34]">{copy.finishOrder}</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <PriceRow label={copy.route} value={`${bookingFlight.from} → ${bookingFlight.to}`} />
                      <PriceRow label={copy.headerDate} value={date || "—"} />
                      <PriceRow label={copy.passengerCount} value={String(passengerCount)} />
                      <PriceRow label={copy.totalPrice} value={formatMoney(total, bookingFlight.currency)} />
                    </div>
                    <div className="mt-3 text-xs text-[#77716A] dark:text-[#77716A]">
                      {copy.selectedPayment}:{" "}
                      <span className="text-[#111A34] font-semibold dark:text-[#111A34]">
                        {paymentMethod ? paymentMethod.toUpperCase() : copy.unselected}
                      </span>
                    </div>
                  </div>

                  <label className="mt-2 flex items-start gap-2 text-xs text-[#5F5A54] dark:text-[#5F5A54]">
                    <Checkbox
                      checked={agreeData}
                      onCheckedChange={(checked) => setAgreeData(checked === true)}
                      size="sm"
                      className="mt-0.5 border-[#174A8B]/35 bg-white text-white data-[state=checked]:border-[#174A8B] data-[state=checked]:bg-[#174A8B]"
                    />
                    {copy.confirmData}
                  </label>
                  {!agreeData && (
                    <div className="text-xs text-[#77716A] dark:text-[#77716A]">
                      {copy.markConfirmation}
                    </div>
                  )}

                  {lastOrderId && (
                    <div className="text-xs text-emerald-700 dark:text-[#a7f0ce]">
                      Order ID: {lastOrderId}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={submit}
                      disabled={!canSubmit || bookLoading}
                      className={`h-12 rounded-2xl font-semibold ${brandPrimaryAction}`}
                    >
                      {bookLoading ? "..." : copy.checkout}
                    </button>
                    <button
                      onClick={() => setBookingStep("details")}
                      className={`h-12 rounded-2xl font-semibold ${brandSecondaryAction}`}
                    >
                      {copy.back}
                    </button>
                  </div>

                  {activeOrderId && (
                    <div className="rounded-[22px] border border-[#D9D5CE] bg-white p-5 shadow-none dark:border-[#D9D5CE] dark:bg-white">
                      <div className="text-[#111A34] font-semibold dark:text-[#111A34]">Order ID: {activeOrderId}</div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => runOrderAction("issue", setIssueLoading)}
                          disabled={issueLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandPrimaryAction}`}
                        >
                          {issueLoading ? "Issue..." : copy.issuePnr}
                        </button>
                        <button
                          type="button"
                          onClick={checkOrderStatus}
                          disabled={orderLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandSecondaryAction}`}
                        >
                          {orderLoading ? "..." : copy.getOrderById}
                        </button>
                        <button
                          type="button"
                          onClick={() => runOrderAction("cancel", setCancelLoading)}
                          disabled={cancelLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandSecondaryAction}`}
                        >
                          {cancelLoading ? "Cancel..." : copy.cancelPnr}
                        </button>
                        <button
                          type="button"
                          onClick={() => runOrderAction("void", setVoidLoading)}
                          disabled={voidLoading}
                          className={`h-11 rounded-2xl font-semibold ${brandSecondaryAction}`}
                        >
                          {voidLoading ? "VOID..." : copy.voidPnr}
                        </button>
                      </div>

                      {orderData ? (
                        <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-[#D9D5CE] bg-[#F3F1ED] p-4 text-xs text-[#5F5A54] sm:grid-cols-2">
                          <div>ID: {orderData?.id ?? "—"}</div>
                          <div>{copy.status}: {orderData?.status ?? "—"}</div>
                          <div>{copy.totalPrice}: {formatMoney(orderData?.price ?? 0, orderData?.currency)}</div>
                          <div>{copy.client}: {orderData?.client ?? "—"}</div>
                          <div>{copy.service}: {orderData?.serviceType ?? "—"}</div>
                          <div>{copy.reservation}: {orderData?.reservationId ?? "—"}</div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toastOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-5 bottom-5 z-[90] w-[min(360px,90vw)]"
                >
                  <div className="rounded-2xl border border-white/15 bg-[#1a1c24]/90 backdrop-blur-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold text-sm">{copy.toastTitle}</div>
                        <div className="text-white/75 text-xs mt-1">{toastMsg}</div>
                      </div>
                      <button
                        onClick={() => setToastOpen(false)}
                        className="h-7 w-7 rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          variants={panel}
          initial="hidden"
          animate="show"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="
            flight-details-light
            fixed inset-0 z-[70]
            h-[100svh] max-h-[100svh] w-screen
            overflow-hidden
            rounded-none
            border-0
            bg-white
            shadow-[0_24px_70px_rgba(17,24,39,0.10)]
            supports-[height:100dvh]:h-[100dvh]
            supports-[height:100dvh]:max-h-[100dvh]
            dark:bg-white
            dark:shadow-[0_24px_70px_rgba(17,24,39,0.10)]
          "
        >
          <div className="h-full overflow-y-auto overscroll-y-contain bg-white [-webkit-overflow-scrolling:touch]">
            <div className="bg-white">
              {/* Re-renders same content via pageMode path */}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Pill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  const normalizedLabel = label.toLowerCase()
  const tone = normalizedLabel.includes("qo") || normalizedLabel.includes("arrival") || normalizedLabel.includes("прил")
    ? "landing"
    : normalizedLabel.includes("dav") || normalizedLabel.includes("duration") || normalizedLabel.includes("длит")
      ? "duration"
      : "takeoff"
  const toneClasses = {
    takeoff: {
      card: "border-[#9FC7FF] !bg-[linear-gradient(135deg,#DBECFF_0%,#EEF6FF_48%,#CFE4FF_100%)] hover:border-[#5B9BFF] hover:shadow-[0_18px_38px_rgba(37,99,235,0.18)]",
      iconWrap: "!bg-[linear-gradient(135deg,#BBD9FF_0%,#F2F8FF_100%)] text-[#1554C8]",
      glow: "bg-[#3B82F6]",
    },
    landing: {
      card: "border-[#F4C98D] !bg-[linear-gradient(135deg,#FFE8C7_0%,#FFF5E8_48%,#FFDDB3_100%)] hover:border-[#F0A645] hover:shadow-[0_18px_38px_rgba(234,88,12,0.17)]",
      iconWrap: "!bg-[linear-gradient(135deg,#FFD39C_0%,#FFF4E6_100%)] text-[#D94F08]",
      glow: "bg-[#F97316]",
    },
    duration: {
      card: "border-[#93DDB6] !bg-[linear-gradient(135deg,#D8F7E7_0%,#ECFFF5_48%,#C8F0DD_100%)] hover:border-[#49B97F] hover:shadow-[0_18px_38px_rgba(22,163,74,0.17)]",
      iconWrap: "!bg-[linear-gradient(135deg,#BDF0D4_0%,#F1FFF7_100%)] text-[#0F8F3E]",
      glow: "bg-[#22C55E]",
    },
  }[tone]

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.006 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={[
        "group relative overflow-hidden rounded-[16px] border p-4 shadow-none transition-all duration-300",
        toneClasses.card,
        "dark:border-[#D9D5CE] dark:bg-white dark:bg-none dark:shadow-none",
      ].join(" ")}
    >
      <div className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20 ${toneClasses.glow}`} />
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.78),0_8px_18px_rgba(31,41,55,0.07)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 dark:bg-[#F3F1ED] dark:text-[#174A8B] ${toneClasses.iconWrap}`}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-xs font-medium text-[#516072] dark:text-[#77716A]">{label}</div>
          <div className="font-bold text-[#111A34] dark:text-[#111A34]">{value}</div>
        </div>
      </div>
    </motion.div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  icon?: any
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs text-[#77716A] dark:text-[#77716A]">{label}</div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77716A] dark:text-[#77716A]">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          className={`
            h-12 w-full rounded-2xl border border-[#D9D5CE] bg-white dark:border-[#D9D5CE] dark:bg-white
            ${Icon ? "pl-10 pr-4" : "px-4"}
            text-[#111A34] outline-none transition placeholder:text-[#9A948C] focus:border-[#174A8B]/45 focus:bg-white dark:text-[#111A34] dark:placeholder:text-[#9A948C] dark:focus:bg-white
          `}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#D9D5CE] bg-[#F8F7F4] p-4 dark:border-[#D9D5CE] dark:bg-[#F8F7F4]">
      <div className="text-xs text-[#77716A] dark:text-[#77716A]">{label}</div>
      <div className="mt-1 font-semibold text-[#111A34] dark:text-[#111A34]">{value}</div>
    </div>
  )
}
