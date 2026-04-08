import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { bookingCart } from "@/shared/store/bookingCart"
import { formatMoney } from "@/lib/money"
import { formatUzPhoneInput } from "@/lib/phone"
import { getAccessToken } from "@/shared/auth/token"
import { useI18n } from "@/shared/i18n/i18n"
import {
  bookAir,
  getAirOptionDetails,
  getAirOptionFareFamilies,
  getAirOptionRules,
  getBrandedFares,
} from "@/shared/api/air/air.api"
import type { AirOptionRule, BrandedFaresResponse } from "@/types/air"
import {
  X,
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  Luggage,
  BadgeCheck,
  ShieldCheck,
  Wifi,
  Coffee,
  User,
  Users,
  Mail,
  Phone,
} from "lucide-react"

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

const cleanRuleText = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim()

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
  return text
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
          [/^CARRY ON HAND BAGGAGE$/i, "Qo'l yuki"],
          [/^CARRY ON BAGGAGE$/i, "Qo'l yuki"],
          [/^CABIN BAG 1 PIECE 7 KG$/i, "1 dona 7 kg qo'l yuki"],
          [/^CHECKED BAGGAGE UP TO 25 KGS$/i, "25 kg gacha topshiriladigan bagaj"],
          [/^CHECKED BAGGAGE UP TO 30 KGS$/i, "30 kg gacha topshiriladigan bagaj"],
          [/^CHECKED BAGGAGE UP TO 35 KGS$/i, "35 kg gacha topshiriladigan bagaj"],
          [/^UPTO50LB 23KG BAGGAGE$/i, "23 kg gacha bagaj"],
          [/^UPTO70LB 32KG BAGGAGE$/i, "32 kg gacha bagaj"],
          [/^SPECIAL MEAL$/i, "Maxsus ovqat"],
          [/^PRE PAID BAGGAGE$/i, "Oldindan bagaj qo'shish"],
          [/^DEDICATED CHECK IN$/i, "Alohida ro'yxatdan o'tish"],
          [/^PRE RESERVED SEAT ASSIGNMENT$/i, "Oldindan joy tanlash"],
          [/^PREMIUM SEAT$/i, "Premium o'rindiq"],
          [/^REFUNDABLE TICKET$/i, "Qaytariladigan chipta"],
          [/^CHANGEABLE TICKET$/i, "O'zgartiriladigan chipta"],
          [/^MEAL BEVERAGE$/i, "Ovqat va ichimlik"],
          [/^LOUNGE ACCESS$/i, "Kutish zalidan foydalanish"],
          [/^HOTEL ACCOMMODATIONS$/i, "Mehmonxona joylashuvi"],
          [/^50 PCT QMILES ACCUMULATION$/i, "50% Qmiles to'planadi"],
          [/^75 PCT QMILES ACCUMULATION$/i, "75% Qmiles to'planadi"],
          [/^100 PCT QMILES ACCUMULATION$/i, "100% Qmiles to'planadi"],
          [/^CHECKED BAGGAGE/i, "Topshiriladigan bagaj"],
          [/^CABIN BAG/i, "Qo'l yuki"],
        ]
      : [
          [/^CARRY ON HAND BAGGAGE$/i, "Ручная кладь"],
          [/^CARRY ON BAGGAGE$/i, "Ручная кладь"],
          [/^CABIN BAG 1 PIECE 7 KG$/i, "1 место ручной клади 7 кг"],
          [/^CHECKED BAGGAGE UP TO 25 KGS$/i, "Багаж до 25 кг"],
          [/^CHECKED BAGGAGE UP TO 30 KGS$/i, "Багаж до 30 кг"],
          [/^CHECKED BAGGAGE UP TO 35 KGS$/i, "Багаж до 35 кг"],
          [/^UPTO50LB 23KG BAGGAGE$/i, "Багаж до 23 кг"],
          [/^UPTO70LB 32KG BAGGAGE$/i, "Багаж до 32 кг"],
          [/^SPECIAL MEAL$/i, "Специальное питание"],
          [/^PRE PAID BAGGAGE$/i, "Предоплаченный багаж"],
          [/^DEDICATED CHECK IN$/i, "Отдельная регистрация"],
          [/^PRE RESERVED SEAT ASSIGNMENT$/i, "Предварительный выбор места"],
          [/^PREMIUM SEAT$/i, "Премиум место"],
          [/^REFUNDABLE TICKET$/i, "Возвратный билет"],
          [/^CHANGEABLE TICKET$/i, "Изменяемый билет"],
          [/^MEAL BEVERAGE$/i, "Питание и напитки"],
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
}: {
  open: boolean
  onClose: () => void
  flight: Flight | null
  pax: number
  date: string
}) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const copy = {
    uz: {
      bookingError: "Booking xato",
      optionMissing: "Option ID topilmadi. Qidiruvni qayta bajaring.",
      invalidData: "Ma'lumotlar to'liq emas.",
      loginFirst: "Avval login qiling (token yo'q).",
      bookingSuccess: "Booking muvaffaqiyatli. Order ID:",
      headerDate: "Sana",
      headerPax: "Yo'lovchi",
      finalPrice: "Yakuniy narx",
      taxesIncluded: "Soliq va yig'imlar bilan",
      step1: "1) Bron qilish",
      step2: "2) Ma'lumotlar",
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
      fareIncluded: "Ichida bor",
      fareChargeable: "Qo'shimcha to'lanadi",
      fareUnavailable: "Mavjud emas",
      extraPrice: "Qo'shimcha narx",
      rules: "Tarif qoidalari",
      rulesLoading: "Qoidalar yuklanmoqda...",
      noRules: "Qoidalar hozircha yo'q (backend `data: []` qaytardi).",
      services: "Xizmatlar",
      meal: "Ovqat",
      support: "24/7 Qo'llab-quvvatlash",
      continue: "Davom etish",
      enterPassengerInfo: "Yo'lovchi ma'lumotlarini kiriting.",
      select: "Tanlash",
      formOpensFor: "ta yo'lovchi uchun forma ochiladi.",
      payerDetails: "To'lovchi ma'lumotlari",
      emailPhone: "Email va telefon",
      countryCode: "Mamlakat kodi",
      phoneNumber: "Telefon raqam",
      passengersDetails: "Yo'lovchilar ma'lumotlari",
      total: "Jami",
      passenger: "Yo'lovchi",
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
      finishOrder: "Buyurtma yakunlash",
      route: "Yo'nalish",
      passengerCount: "Yo'lovchi soni",
      totalPrice: "Narx (jami)",
      selectedPayment: "Tanlangan to'lov",
      unselected: "tanlanmagan",
      confirmData: "Yuqoridagi ma'lumotlar to'g'ri ekanligini tasdiqlayman",
      markConfirmation: "* Rasmiylashtirish uchun tasdiqlashni belgilang.",
      checkout: "Rasmiylashtirish",
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
      step1: "1) Бронирование",
      step2: "2) Данные",
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
      fareChargeable: "Оплачивается отдельно",
      fareUnavailable: "Недоступно",
      extraPrice: "Доплата",
      rules: "Правила тарифа",
      rulesLoading: "Загрузка правил...",
      noRules: "Правил пока нет (backend вернул `data: []`).",
      services: "Услуги",
      meal: "Питание",
      support: "Поддержка 24/7",
      continue: "Продолжить",
      enterPassengerInfo: "Введите данные пассажиров.",
      select: "Выбрать",
      formOpensFor: "пассажиров будет в форме.",
      payerDetails: "Данные плательщика",
      emailPhone: "Email и телефон",
      countryCode: "Country code",
      phoneNumber: "Телефон",
      passengersDetails: "Данные пассажиров",
      total: "Всего",
      passenger: "Пассажир",
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
      finishOrder: "Завершение заказа",
      route: "Маршрут",
      passengerCount: "Количество пассажиров",
      totalPrice: "Цена (итого)",
      selectedPayment: "Выбранная оплата",
      unselected: "не выбрано",
      confirmData: "Подтверждаю правильность указанных выше данных",
      markConfirmation: "* Для оформления отметьте подтверждение.",
      checkout: "Оформить",
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
      step1: "1) Booking",
      step2: "2) Details",
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
      fareChargeable: "Chargeable",
      fareUnavailable: "Unavailable",
      extraPrice: "Extra price",
      rules: "Fare rules",
      rulesLoading: "Loading rules...",
      noRules: "No rules yet (backend returned `data: []`).",
      services: "Services",
      meal: "Meal",
      support: "24/7 support",
      continue: "Continue",
      enterPassengerInfo: "Enter passenger details.",
      select: "Select",
      formOpensFor: "passengers will open in the form.",
      payerDetails: "Payer details",
      emailPhone: "Email and phone",
      countryCode: "Country code",
      phoneNumber: "Phone number",
      passengersDetails: "Passenger details",
      total: "Total",
      passenger: "Passenger",
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
      finishOrder: "Complete order",
      route: "Route",
      passengerCount: "Passenger count",
      totalPrice: "Price (total)",
      selectedPayment: "Selected payment",
      unselected: "not selected",
      confirmData: "I confirm that the information above is correct",
      markConfirmation: "* Mark the confirmation to proceed.",
      checkout: "Checkout",
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
      cabin: "Economy",
      refundable: false,
      services: ["support"],
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
  const [paymentMethod, setPaymentMethod] = useState<
    "click" | "payme" | "uzum" | "paynet" | "visa" | ""
  >("")
  const [fareLoading, setFareLoading] = useState(false)
  const [fareError, setFareError] = useState<string | null>(null)
  const [fareData, setFareData] = useState<BrandedFaresResponse["data"] | null>(null)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const [rulesData, setRulesData] = useState<AirOptionRule[]>([])
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
    setRulesLoading(false)
    setRulesError(null)
    setRulesData([])
    setFareFamiliesLoading(false)
    setFareFamiliesError(null)
    setFareFamiliesData([])
    setSelectedFareId(null)
    setOptionDetailsLoading(false)
    setOptionDetailsError(null)
    setOptionDetails(null)
  }, [language, open, safeFlight.id])

  useEffect(() => {
    if (!toastOpen) return
    const t = setTimeout(() => setToastOpen(false), 3500)
    return () => clearTimeout(t)
  }, [toastOpen])

  // pax o'zgarsa passengers array moslashadi (kiritilganlar yo'qolmaydi)
  useEffect(() => {
    if (!open) return
    setPassengers((prev) => resizePassengers(prev, pax))
  }, [pax, open])

  useEffect(() => {
    if (!open) return
    if (!safeFlight.id) return
    const token = getAccessToken()
    if (!token) return

    let alive = true
    setFareLoading(true)
    setFareError(null)

    getBrandedFares({ optionID: safeFlight.id })
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setFareError(res.data.message || copy.fares)
          setFareData(null)
          return
        }
        setFareData(res.data.data ?? null)
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || copy.fares
        setFareError(msg)
        setFareData(null)
      })
      .finally(() => {
        if (alive) setFareLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, safeFlight.id])

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
    const token = getAccessToken()
    if (!token) return

    let alive = true
    setOptionDetailsLoading(true)
    setOptionDetailsError(null)

    getAirOptionDetails(safeFlight.id)
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setOptionDetailsError(res.data.message || copy.flightDetails)
          setOptionDetails(null)
          return
        }

        const segments = mapSegmentsFromTrips(res.data.data?.trips)

        setOptionDetails({ segments })
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || copy.flightDetails
        setOptionDetailsError(msg)
        setOptionDetails(null)
      })
      .finally(() => {
        if (alive) setOptionDetailsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, safeFlight.id])

  useEffect(() => {
    if (!open) return
    if (!safeFlight.id) return
    const token = getAccessToken()
    if (!token) return

    let alive = true
    setFareFamiliesLoading(true)
    setFareFamiliesError(null)

    getAirOptionFareFamilies(safeFlight.id)
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setFareFamiliesError(res.data.message || copy.farePackages)
          setFareFamiliesData([])
          return
        }

        const mapped: FareFamilyOption[] = (res.data.data ?? []).map((option: any, index: number) => {
          const trip = option.trips?.[0]
          const services = trip?.brandServices ?? []
          const segments = mapSegmentsFromTrips(option.trips)
          const firstSegment = segments[0]
          const brandedBaggage = services
            .filter((service: any) => service?.type === "baggage")
            .map((service: any) => service?.description)

          return {
            id: option.id,
            name: (trip?.brandName || trip?.brandID || `FARE ${index + 1}`).toUpperCase(),
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
            depart: trip?.departure ?? safeFlight.depart,
            arrive: trip?.arrival ?? safeFlight.arrive,
            departDate: trip?.departure ?? safeFlight.departDate,
            arriveDate: trip?.arrival ?? safeFlight.arriveDate,
            durationMin: trip?.duration ?? safeFlight.durationMin,
            from: trip?.origin ?? safeFlight.from,
            to: trip?.destination ?? safeFlight.to,
            cabin: firstSegment?.serviceClass ?? safeFlight.cabin,
            segments,
            isDefault: option.id === safeFlight.id,
          }
        })

        setFareFamiliesData(mapped)
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || copy.farePackages
        setFareFamiliesError(msg)
        setFareFamiliesData([])
      })
      .finally(() => {
        if (alive) setFareFamiliesLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, safeFlight.id])

  useEffect(() => {
    if (!open) return
    if (!safeFlight.id) return
    const token = getAccessToken()
    if (!token) return

    let alive = true
    setRulesLoading(true)
    setRulesError(null)

    getAirOptionRules(safeFlight.id)
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setRulesError(res.data.message || copy.rules)
          setRulesData([])
          return
        }
        setRulesData(res.data.data ?? [])
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || copy.rules
        setRulesError(msg)
        setRulesData([])
      })
      .finally(() => {
        if (alive) setRulesLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, safeFlight.id])

  const backendServiceDescriptions = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    fareData?.families?.forEach((f) => {
      f.services?.forEach((s) => {
        const text = (s.description || "").trim()
        if (!text) return
        if (seen.has(text)) return
        seen.add(text)
        list.push(text)
      })
    })
    fareFamiliesData.forEach((f) => {
      f.serviceDescriptions?.forEach((text) => {
        const clean = (text || "").trim()
        if (!clean || seen.has(clean)) return
        seen.add(clean)
        list.push(clean)
      })
    })
    return list
  }, [fareData, fareFamiliesData])

  const selectedFare = useMemo(
    () => fareFamiliesData.find((fare) => fare.id === selectedFareId) ?? null,
    [fareFamiliesData, selectedFareId]
  )

  const bookingFlight = useMemo<Flight>(() => {
    if (!selectedFare) return safeFlight

    return {
      ...safeFlight,
      id: selectedFare.id,
      from: selectedFare.from ?? safeFlight.from,
      to: selectedFare.to ?? safeFlight.to,
      airline: selectedFare.airline ?? safeFlight.airline,
      departDate: selectedFare.departDate ?? safeFlight.departDate,
      depart: selectedFare.depart ?? safeFlight.depart,
      arriveDate: selectedFare.arriveDate ?? safeFlight.arriveDate,
      arrive: selectedFare.arrive ?? safeFlight.arrive,
      durationMin: selectedFare.durationMin ?? safeFlight.durationMin,
      price: selectedFare.price || safeFlight.price,
      currency: selectedFare.currency ?? safeFlight.currency,
      baggage: selectedFare.baggage ?? safeFlight.baggage,
      cabin: selectedFare.cabin ?? safeFlight.cabin,
      refundable: selectedFare.refundable ?? safeFlight.refundable,
      carryOn: selectedFare.carryOn ?? safeFlight.carryOn,
      segments:
        selectedFare.segments && selectedFare.segments.length > 0
          ? selectedFare.segments
          : safeFlight.segments,
    }
  }, [safeFlight, selectedFare])

  const cabin = bookingFlight.cabin ?? "—"
  const refundable = bookingFlight.refundable ?? false
  const services = safeFlight.services ?? ["support"]
  const flightNo = safeFlight.flightNo ?? "TZ-102"
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

  const canSubmit = errors.length === 0 && agreeData

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
      const token = getAccessToken()
      if (!token) {
        setToastMsg(copy.loginFirst)
        setToastOpen(true)
        return
      }

      const res = await bookAir({
        optionID: bookingFlight.id,
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
      setLastOrderId(res.data.data?.orderID ?? null)
      setToastMsg(`${copy.bookingSuccess} ${res.data.data?.orderID ?? "—"}`)
      setToastOpen(true)
      if (res.data.data?.orderID) {
        const curr = bookingCart.get()
        bookingCart.set({
          ...curr,
          flightId: bookingFlight.id,
          route: `${bookingFlight.from} → ${bookingFlight.to}`,
          date,
          pax: Math.max(1, pax),
          lastOrderId: res.data.data.orderID,
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
              orderId: res.data.data.orderID,
              route: `${bookingFlight.from} → ${bookingFlight.to}`,
              date,
              createdAt: new Date().toISOString(),
            },
          ],
        })
      }
    } catch (err: any) {
      const msg = translateBookingError(err?.response?.data?.message || copy.bookingError, language)
      setToastMsg(msg)
      setToastOpen(true)
      return
    } finally {
      setBookLoading(false)
    }
    onClose()
    navigate("/passengers")
  }

  // UI umuman render qilmaymiz (lekin hooklar ishlayveradi)
  if (!flight) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              fixed inset-0 z-[70]
              w-screen h-[100dvh]
              flex flex-col
              overflow-hidden
              rounded-none
              border-0
              bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f8_42%,#e8eef6_100%)]
              backdrop-blur-2xl
              shadow-[0_45px_140px_rgba(17,24,39,0.18)]
              dark:bg-[linear-gradient(180deg,#0d1830_0%,#111e39_26%,#15254a_62%,#11203d_100%)]
              dark:shadow-[0_45px_140px_rgba(4,10,28,0.42)]
            "
          >
            {/* header */}
            <div className="relative border-b border-[#dbe3ef] p-5 md:p-7 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(245,249,255,0.82)_100%)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(16,31,60,0.94)_0%,rgba(19,35,67,0.9)_100%)]">
              <button
                onClick={onClose}
                className="
                  absolute right-5 top-5 z-10
                  h-10 w-10 rounded-xl
                  border border-[#d7e1ee] bg-white/90
                  text-[#1d2430] hover:bg-white transition
                  dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-white dark:hover:bg-[rgba(28,46,84,0.94)]
                  grid place-items-center
                "
              >
                <X size={18} />
              </button>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pr-14 md:pr-16">
                <div>
                  <div className="text-[#627188] text-sm dark:text-[#d2e0f8]">
                    {bookingFlight.airline} · {flightNo}
                  </div>
                  <div className="mt-1 text-2xl md:text-3xl font-extrabold text-[#1d2430] dark:text-white">
                    {bookingFlight.from} → {bookingFlight.to}
                  </div>
                  <div className="mt-2 text-[#627188] text-sm dark:text-[#d2e0f8]">
                    {copy.headerDate}: <span className="text-[#1d2430] dark:text-white">{date || "—"}</span> · {copy.headerPax}:{" "}
                    <span className="text-[#1d2430] dark:text-white">{Math.max(1, pax)}</span>
                  </div>
                </div>

                <div className="text-left md:text-right w-full md:w-auto">
                  <div className="text-[#718198] text-xs dark:text-[#a9bddb]">{copy.finalPrice}</div>
                  <div className="text-3xl font-extrabold text-[#1d2430] dark:text-white">
                    {formatMoney(total, bookingFlight.currency)}
                  </div>
                  <div className="text-[#718198] text-xs dark:text-[#a9bddb]">{copy.taxesIncluded}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                <span
                  className={[
                    "px-3 py-1 rounded-full border",
                    step === "select"
                      ? "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174] dark:border-[#4d6fa8] dark:bg-[linear-gradient(180deg,rgba(35,60,110,0.9)_0%,rgba(26,47,87,0.92)_100%)] dark:text-white"
                      : "border-[#dbe3ef] bg-white text-[#627188] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]",
                  ].join(" ")}
                >
                  {copy.step1}
                </span>
                <span className="text-[#9ba8ba] dark:text-[#8ea5cb]">→</span>
                <span
                  className={[
                    "px-3 py-1 rounded-full border",
                    step === "details"
                      ? "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174] dark:border-[#4d6fa8] dark:bg-[linear-gradient(180deg,rgba(35,60,110,0.9)_0%,rgba(26,47,87,0.92)_100%)] dark:text-white"
                      : "border-[#dbe3ef] bg-white text-[#627188] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]",
                  ].join(" ")}
                >
                  {copy.step2}
                </span>
                <span className="text-[#9ba8ba] dark:text-[#8ea5cb]">→</span>
                <span
                  className={[
                    "px-3 py-1 rounded-full border",
                    step === "pay"
                      ? "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174] dark:border-[#4d6fa8] dark:bg-[linear-gradient(180deg,rgba(35,60,110,0.9)_0%,rgba(26,47,87,0.92)_100%)] dark:text-white"
                      : "border-[#dbe3ef] bg-white text-[#627188] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]",
                  ].join(" ")}
                >
                  {copy.step3}
                </span>
              </div>

              {step === "select" && (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Pill icon={PlaneTakeoff} label={copy.depart} value={bookingFlight.depart} />
                  <Pill icon={PlaneLanding} label={copy.arrive} value={bookingFlight.arrive} />
                  <Pill icon={Clock} label={copy.duration} value={fmtDuration(bookingFlight.durationMin, language)} />
                </div>
              )}
            </div>

            {/* body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 pb-24 md:p-7">
              {step === "select" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                      <div className="text-[#1d2430] font-semibold dark:text-white">{copy.fareRules}</div>

                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full border border-[#dbe3ef] bg-[#f8fbff] px-3 py-1 text-[#234174] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d7e5ff]">
                          {cabin}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-sm ${
                            refundable
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-[#dbe3ef] bg-white text-[#627188] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]"
                          }`}
                        >
                          {refundable ? copy.refundable : copy.nonRefundable}
                        </span>

                        <span className="rounded-full border border-[#dbe3ef] bg-white px-3 py-1 text-[#51627c] inline-flex items-center gap-2 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                          <Luggage size={14} />
                          {bookingFlight.baggage ?? "—"}
                        </span>

                        <span className="rounded-full border border-[#dbe3ef] bg-white px-3 py-1 text-[#51627c] inline-flex items-center gap-2 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                          <Luggage size={14} />
                          {copy.carryOn}: {bookingFlight.carryOn ?? "—"}
                        </span>
                      </div>

                      <div className="mt-4 text-[#627188] text-sm leading-relaxed dark:text-[#a9bddb]">
                        {copy.fareTerms}
                      </div>

                      <div className="mt-4 text-[#627188] text-sm dark:text-[#a9bddb]">
                        {fareLoading && copy.faresLoading}
                        {!fareLoading && fareError && `${copy.fares}: ${fareError}`}
                        {!fareLoading && !fareError && fareFamiliesData.length === 0 && fareData?.families?.length ? (
                          <div className="mt-2 space-y-2">
                            {fareData.families.map((f) => (
                              <div key={f.id} className="rounded-[20px] border border-[#e2e9f2] bg-white p-3 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                                <div className="text-[#1d2430] font-semibold text-sm dark:text-white">{f.name}</div>
                                <div className="mt-1 text-[#627188] text-xs dark:text-[#a9bddb]">
                                  {copy.baggage}: {f.baggageInfos?.join(", ") || "—"}
                                </div>
                                {f.services && f.services.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {f.services.map((s, i) => (
                                      <span
                                        key={`${f.id}-${i}`}
                                        className="rounded-full border border-[#e2e9f2] bg-[#f7faff] px-2.5 py-1 text-[11px] text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]"
                                      >
                                        {s.description}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <div className="text-[#1d2430] text-sm font-semibold dark:text-white">{copy.flightDetails}</div>
                        <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                          {optionDetailsLoading && copy.flightDetailsLoading}
                          {!optionDetailsLoading &&
                            optionDetailsError &&
                            `${copy.flightDetails}: ${optionDetailsError}`}
                        </div>
                        {itinerarySegments.length > 0 ? (
                          <div className="mt-3 space-y-3">
                            {itinerarySegments.map((segment, index) => (
                              <div key={segment.id} className="rounded-[20px] border border-[#e2e9f2] bg-white p-3 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-[#1d2430] text-sm font-semibold dark:text-white">
                                    {copy.segment} {index + 1}: {segment.origin} → {segment.destination}
                                  </div>
                                  <div className="text-xs text-[#7b889c] dark:text-[#93abd0]">
                                    {segment.carrier || "—"} {segment.flightNumber || ""}
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.time}: {segment.departure} → {segment.arrival}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.duration}: {segment.duration ? fmtDuration(segment.duration, language) : "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.departTerminal}: {segment.departureTerminal || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.arriveTerminal}: {segment.arrivalTerminal || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.baggage}: {segment.baggage || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.carryOn}: {segment.carryOn || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.bookingClass}: {segment.bookingClass || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.serviceClass}: {segment.serviceClass || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.operatingAirline}: {segment.operatingCarrier || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.seatsAvailable}: {segment.seatsAvailable ?? "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.aircraftType}: {segment.equipment || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    {copy.fareCode}: {segment.fareBasis || "—"}
                                  </div>
                                </div>
                                {segment.layover ? (
                                  <div className="mt-2 text-xs text-[#7b889c] dark:text-[#93abd0]">
                                    {copy.layover}: {fmtDuration(segment.layover, language)}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <div className="text-[#1d2430] text-sm font-semibold dark:text-white">{copy.farePackages}</div>
                        <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
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
                          <div className="mt-4 space-y-4">
                            <div className="rounded-[22px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)]">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#9fb4d7]">
                                {copy.chooseFare}
                              </div>
                              <div className="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-3">
                                {fareFamiliesData.map((f) => {
                                  const active = selectedFareId === f.id
                                  return (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => setSelectedFareId(f.id)}
                                      className={[
                                        "rounded-[24px] border p-4 text-left transition",
                                        active
                                          ? "border-[#1f7ae0] bg-[linear-gradient(180deg,#eff6ff_0%,#f8fbff_100%)] shadow-[0_20px_45px_rgba(31,122,224,0.14)] dark:border-[#5d97ff] dark:bg-[linear-gradient(180deg,rgba(24,47,96,0.94)_0%,rgba(19,37,72,0.92)_100%)]"
                                          : "border-[#e2e9f2] bg-white hover:border-[#c7d8ef] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:hover:border-[#4d6fa8]",
                                      ].join(" ")}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <div className="text-base font-bold text-[#1d2430] dark:text-white">
                                            {f.name}
                                          </div>
                                          <div className="mt-1 text-xs text-[#7b889c] dark:text-[#93abd0]">
                                            {formatMoney(f.price, f.currency ?? bookingFlight.currency)}
                                          </div>
                                        </div>
                                        {active ? (
                                          <span className="rounded-full bg-[#1f7ae0] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                            {copy.selectedFare}
                                          </span>
                                        ) : null}
                                      </div>

                                      <div className="mt-3 space-y-3 text-xs">
                                        <div>
                                          <div className="font-semibold text-emerald-700 dark:text-[#9ef0c6]">
                                            {copy.fareIncluded}
                                          </div>
                                          <div className="mt-1 space-y-1 text-[#52627b] dark:text-[#d4e2fb]">
                                            {(f.includedServices.length ? f.includedServices : [f.carryOn, f.baggage]
                                              .filter(Boolean) as string[]).map((item) => (
                                              <div key={`${f.id}-included-${item}`}>• {item}</div>
                                            ))}
                                          </div>
                                        </div>

                                        {f.chargeableServices.length > 0 && (
                                          <div>
                                            <div className="font-semibold text-amber-700 dark:text-[#ffd38a]">
                                              {copy.fareChargeable}
                                            </div>
                                            <div className="mt-1 space-y-1 text-[#52627b] dark:text-[#d4e2fb]">
                                              {f.chargeableServices.slice(0, 6).map((item) => (
                                                <div key={`${f.id}-chargeable-${item}`}>• {item}</div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {f.unavailableServices.length > 0 && (
                                          <div>
                                            <div className="font-semibold text-rose-700 dark:text-[#ffb2bf]">
                                              {copy.fareUnavailable}
                                            </div>
                                            <div className="mt-1 space-y-1 text-[#52627b] dark:text-[#d4e2fb]">
                                              {f.unavailableServices.slice(0, 4).map((item) => (
                                                <div key={`${f.id}-na-${item}`}>• {item}</div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {selectedFare && (
                              <div className="rounded-[22px] border border-[#dbe3ef] bg-white p-4 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-[#1d2430] dark:text-white">
                                      {copy.selectedFare}: {selectedFare.name}
                                    </div>
                                    <div className="mt-1 text-xs text-[#7b889c] dark:text-[#93abd0]">
                                      {copy.selectedFareReady}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-[#7b889c] dark:text-[#93abd0]">{copy.total}</div>
                                    <div className="text-lg font-bold text-[#1d2430] dark:text-white">
                                      {formatMoney(total, bookingFlight.currency)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="text-[#1d2430] text-sm font-semibold dark:text-white">{copy.rules}</div>
                        <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                          {rulesLoading && copy.rulesLoading}
                          {!rulesLoading && rulesError && `${copy.rules}: ${rulesError}`}
                          {!rulesLoading && !rulesError && rulesData.length === 0 && (
                            <span>{copy.noRules}</span>
                          )}
                        </div>
                        {!rulesLoading && !rulesError && rulesData.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {rulesData.slice(0, 2).map((rule, idx) => (
                              <div
                                key={`${rule.flight}-${idx}`}
                                className="rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)]"
                              >
                                <div className="text-[#1d2430] text-sm font-semibold dark:text-white">
                                  {rule.flight} · {rule.fareBasis}
                                </div>
                                <div className="mt-2 space-y-2">
                                  {rule.categories.slice(0, 2).map((c) => (
                                    <div
                                      key={`${rule.flight}-${c.id}`}
                                      className="rounded-[18px] border border-[#e2e9f2] bg-white p-3"
                                    >
                                      <div className="text-[#234174] text-xs font-semibold uppercase tracking-[0.12em]">
                                        {c.category}
                                      </div>
                                      <div className="mt-2 text-[#5f6e84] text-sm whitespace-pre-wrap leading-6">
                                        {cleanRuleText(c.text)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                      <div className="text-[#1d2430] font-semibold dark:text-white">{copy.services}</div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {services.includes("wifi") && <Mini icon={Wifi} text="Wi-Fi" />}
                        {services.includes("meal") && <Mini icon={Coffee} text={copy.meal} />}
                        {services.includes("priority") && <Mini icon={BadgeCheck} text="Priority" />}
                        {services.includes("support") && (
                          <Mini icon={ShieldCheck} text={copy.support} />
                        )}
                      </div>

                      {backendServiceDescriptions.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {backendServiceDescriptions.slice(0, 12).map((text, i) => (
                            <div key={`${text}-${i}`} className="rounded-[16px] border border-[#e2e9f2] bg-white px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                              {text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                      <div className="text-[#1d2430] font-semibold dark:text-white">{copy.continue}</div>
                      <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">{copy.enterPassengerInfo}</div>

                      {selectedFare && (
                        <div className="mt-4 rounded-[18px] border border-[#e2e9f2] bg-white px-3 py-3 text-sm text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                          <div className="font-semibold text-[#1d2430] dark:text-white">
                            {copy.selectedFare}: {selectedFare.name}
                          </div>
                          <div className="mt-1 text-xs text-[#7b889c] dark:text-[#93abd0]">
                            {formatMoney(total, bookingFlight.currency)}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setStep("details")}
                        className="
                          mt-5 w-full h-12 rounded-2xl
                          bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                          text-white font-semibold transition
                          shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                          hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                        "
                      >
                        {copy.select}
                      </button>

                      <div className="mt-3 rounded-[18px] border border-[#e2e9f2] bg-white px-3 py-3 text-sm text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                        {Math.max(1, pax)} {copy.formOpensFor}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === "details" && (
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                    <div className="flex items-center justify-between">
                      <div className="text-[#1d2430] font-semibold inline-flex items-center gap-2 dark:text-white">
                        <User size={18} />
                        {copy.payerDetails}
                      </div>
                      <div className="text-xs text-[#7b889c] dark:text-[#93abd0]">{copy.emailPhone}</div>
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

                  <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                    <div className="flex items-center justify-between">
                      <div className="text-[#1d2430] font-semibold inline-flex items-center gap-2 dark:text-white">
                        <Users size={18} />
                        {copy.passengersDetails}
                      </div>
                      <div className="text-xs text-[#7b889c] dark:text-[#93abd0]">{copy.total}: {Math.max(1, pax)}</div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {passengers.map((p, idx) => (
                        <div key={idx} className="rounded-[24px] border border-[#e2e9f2] bg-white p-4 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                          <div className="text-[#1d2430] font-semibold text-sm dark:text-white">{copy.passenger} #{idx + 1}</div>

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
                                <div className="mb-2 text-xs text-[#7b889c] dark:text-[#93abd0]">{copy.gender}</div>
                                <select
                                  className="h-12 w-full rounded-2xl border border-[#dbe3ef] bg-[#fbfdff] px-4 text-[#1d2430] outline-none transition focus:border-[#b9cce7] focus:bg-white dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:focus:border-[#4d6fa8]"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setStep("pay")}
                      className="
                        h-12 rounded-2xl
                        bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                        text-white font-semibold transition
                        shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                        hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                      "
                    >
                      {copy.continue}
                    </button>
                    <button
                      onClick={() => setStep("select")}
                      className="h-12 rounded-2xl border border-[#dbe3ef] bg-white text-[#52627b] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(24,43,80,0.92)]"
                    >
                      {copy.back}
                    </button>
                  </div>
                </div>
              )}

              {step === "pay" && (
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                    <div className="text-[#1d2430] font-semibold dark:text-white">{copy.paymentMethod}</div>
                    <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">{copy.chooseMethod}</div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { id: "click", label: "Click" },
                        { id: "payme", label: "Payme" },
                        { id: "uzum", label: "Uzum" },
                        { id: "paynet", label: "Paynet" },
                        { id: "visa", label: "Visa / Master" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={[
                            "h-11 rounded-2xl border text-sm font-semibold transition",
                            paymentMethod === m.id
                              ? "border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-white shadow-[0_14px_28px_rgba(17,24,39,0.22)]"
                              : "border-[#dbe3ef] bg-white text-[#52627b] hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(24,43,80,0.92)]",
                          ].join(" ")}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                    <div className="text-[#1d2430] font-semibold dark:text-white">{copy.finishOrder}</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <PriceRow label={copy.route} value={`${bookingFlight.from} → ${bookingFlight.to}`} />
                      <PriceRow label={copy.headerDate} value={date || "—"} />
                      <PriceRow label={copy.passengerCount} value={String(Math.max(1, pax))} />
                      <PriceRow label={copy.totalPrice} value={formatMoney(total, bookingFlight.currency)} />
                    </div>
                    <div className="mt-3 text-xs text-[#7b889c] dark:text-[#93abd0]">
                      {copy.selectedPayment}:{" "}
                      <span className="text-[#1d2430] font-semibold dark:text-white">
                        {paymentMethod ? paymentMethod.toUpperCase() : copy.unselected}
                      </span>
                    </div>
                  </div>

                  {errors.length > 0 && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-100 text-sm">
                      {errors[0]}
                    </div>
                  )}

                  <label className="mt-2 flex items-start gap-2 text-xs text-[#627188] dark:text-[#a9bddb]">
                    <input
                      type="checkbox"
                      checked={agreeData}
                      onChange={(e) => setAgreeData(e.target.checked)}
                      className="mt-0.5"
                    />
                    {copy.confirmData}
                  </label>
                  {!agreeData && (
                    <div className="text-xs text-[#8a97aa] dark:text-[#93abd0]">
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
                      className="
                        h-12 rounded-2xl
                        bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                        text-white font-semibold transition
                        shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                        hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {bookLoading ? "..." : copy.checkout}
                    </button>
                    <button
                      onClick={() => setStep("details")}
                      className="h-12 rounded-2xl border border-[#dbe3ef] bg-white text-[#52627b] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(24,43,80,0.92)]"
                    >
                      {copy.back}
                    </button>
                  </div>
                </div>
              )}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Pill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.24)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1f5fa] dark:bg-[rgba(31,51,89,0.88)]">
          <Icon className="text-[#52627b] dark:text-[#9fb4d7]" size={18} />
        </div>
        <div>
          <div className="text-xs text-[#7b889c] dark:text-[#a9bddb]">{label}</div>
          <div className="font-semibold text-[#1d2430] dark:text-white">{value}</div>
        </div>
      </div>
    </div>
  )
}

function Mini({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white px-3 py-1 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-[#d4e2fb]">
      <Icon size={14} className="text-[#627188] dark:text-[#9fb4d7]" />
      {text}
    </span>
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
      <div className="mb-2 text-xs text-[#7b889c] dark:text-[#a9bddb]">{label}</div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a97aa] dark:text-[#9fb4d7]">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          className={`
            h-12 w-full rounded-2xl border border-[#dbe3ef] bg-[#fbfdff] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)]
            ${Icon ? "pl-10 pr-4" : "px-4"}
            text-[#1d2430] outline-none transition placeholder:text-[#9aa5b5] focus:border-[#b9cce7] focus:bg-white dark:text-white dark:placeholder:text-[#8ea5cb] dark:focus:bg-[rgba(28,46,84,0.94)]
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
    <div className="rounded-[20px] border border-[#e2e9f2] bg-white p-4 dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)]">
      <div className="text-xs text-[#7b889c] dark:text-[#a9bddb]">{label}</div>
      <div className="mt-1 font-semibold text-[#1d2430] dark:text-white">{value}</div>
    </div>
  )
}
