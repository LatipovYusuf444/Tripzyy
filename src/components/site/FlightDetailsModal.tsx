import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { bookingCart } from "@/shared/store/bookingCart"
import { formatMoney } from "@/lib/money"
import { formatUzPhoneInput } from "@/lib/phone"
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
  depart: string
  arrive: string
  durationMin: number
  price: number
  currency?: string
  baggage?: string
  cabin?: "Economy" | "Business"
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

const panel = {
  hidden: { opacity: 0, y: 16, scale: 0.98, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" },
}

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
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

const translateBookingError = (message?: string) => {
  const text = (message || "").trim()
  if (!text) return "Booking xato"
  if (/Не удалось взять места по запрошенным параметрам/i.test(text)) {
    return "Tanlangan tarif bo'yicha joy qolmagan. Reysni qayta qidirib, boshqa variantni tanlang."
  }
  if (/Ошибка создания брони/i.test(text)) {
    return "Bron yaratib bo'lmadi. Tarif yoki joy holati o'zgargan bo'lishi mumkin."
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

export default function FlightDetailsModal({
  open,
  onClose,
  flight,
  pax,
  date,
  onBook,
}: {
  open: boolean
  onClose: () => void
  flight: Flight | null
  pax: number
  date: string
  onBook: (flight: Flight) => void
}) {
  const navigate = useNavigate()

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
    Array<{
      id: string
      name: string
      price?: number
      baggageInfos?: string[]
      serviceDescriptions?: string[]
    }>
  >([])
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
    setOptionDetailsLoading(false)
    setOptionDetailsError(null)
    setOptionDetails(null)
  }, [open, safeFlight.id])

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
    const token = localStorage.getItem("access_token")
    if (!token) return

    let alive = true
    setFareLoading(true)
    setFareError(null)

    getBrandedFares({ optionID: safeFlight.id })
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setFareError(res.data.message || "Fare topilmadi")
          setFareData(null)
          return
        }
        setFareData(res.data.data ?? null)
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || "Fare topilmadi"
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
    if (!safeFlight.id) return
    const token = localStorage.getItem("access_token")
    if (!token) return

    let alive = true
    setOptionDetailsLoading(true)
    setOptionDetailsError(null)

    getAirOptionDetails(safeFlight.id)
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setOptionDetailsError(res.data.message || "Option details topilmadi")
          setOptionDetails(null)
          return
        }

        const segments =
          res.data.data?.trips?.flatMap((trip) =>
            (trip.segments ?? []).map((seg, index) => ({
              id: `${trip.id}-${index}`,
              origin: seg.origin ?? trip.origin,
              destination: seg.destination ?? trip.destination,
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

        setOptionDetails({ segments })
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || "Option details topilmadi"
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
    const token = localStorage.getItem("access_token")
    if (!token) return

    let alive = true
    setFareFamiliesLoading(true)
    setFareFamiliesError(null)

    getAirOptionFareFamilies(safeFlight.id)
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setFareFamiliesError(res.data.message || "Fare families topilmadi")
          setFareFamiliesData([])
          return
        }

        const option = res.data.data?.find((x) => x.id === safeFlight.id) ?? res.data.data?.[0]
        const families = option?.packages?.families ?? []
        const combinations = option?.packages?.combinations ?? []

        const mapped = families.map((f) => {
          const combo = combinations.find((c) => c.familyIDs?.includes(f.id))
          return {
            id: f.id,
            name: f.name,
            price: combo?.price,
            baggageInfos: f.baggageInfos ?? [],
            serviceDescriptions: (f.services ?? []).map((s) => s.description).filter(Boolean),
          }
        })

        setFareFamiliesData(mapped)
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || "Fare families topilmadi"
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
    const token = localStorage.getItem("access_token")
    if (!token) return

    let alive = true
    setRulesLoading(true)
    setRulesError(null)

    getAirOptionRules(safeFlight.id)
      .then((res) => {
        if (!alive) return
        if (res.data.status !== "success") {
          setRulesError(res.data.message || "Tarif qoidalari topilmadi")
          setRulesData([])
          return
        }
        setRulesData(res.data.data ?? [])
      })
      .catch((err: any) => {
        if (!alive) return
        const msg = err?.response?.data?.message || "Tarif qoidalari topilmadi"
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

  const cabin = safeFlight.cabin ?? "Economy"
  const refundable = safeFlight.refundable ?? false
  const services = safeFlight.services ?? ["support"]
  const flightNo = safeFlight.flightNo ?? "TZ-102"
  const itinerarySegments = useMemo(
    () => (optionDetails?.segments.length ? optionDetails.segments : safeFlight.segments ?? []),
    [optionDetails?.segments, safeFlight.segments]
  )
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

  const taxPerPax = 30
  const total = useMemo(
    () => (safeFlight.price + taxPerPax) * Math.max(1, pax),
    [safeFlight.price, pax]
  )

  const errors = useMemo(() => {
    const e: string[] = []

    if (!payer.email.trim() || !isEmail(payer.email)) e.push("Email noto'g'ri kiritilgan.")
    if (!payer.phone.trim() || !isPhone(payer.phone)) e.push("Telefon raqam noto'g'ri kiritilgan.")
    if (!payer.countryCode?.trim()) e.push("Telefon country code kiritilmagan.")

    passengers.forEach((p, idx) => {
      if (!p.firstName.trim()) e.push(`${idx + 1}-yo'lovchi: Ism kiritilmagan.`)
      if (!p.lastName.trim()) e.push(`${idx + 1}-yo'lovchi: Familiya kiritilmagan.`)
      if (!p.birthDate) e.push(`${idx + 1}-yo'lovchi: Tug'ilgan sana kiritilmagan.`)
      if (!p.passportIssued) e.push(`${idx + 1}-yo'lovchi: Pasport berilgan sana kiritilmagan.`)
      if (!p.passportNo.trim()) e.push(`${idx + 1}-yo'lovchi: Pasport seriya/raqam kiritilmagan.`)
      if (!p.passportExpiry) e.push(`${idx + 1}-yo'lovchi: Pasport amal qilish muddati kiritilmagan.`)
      if (!p.citizenship.trim()) e.push(`${idx + 1}-yo'lovchi: Fuqarolik kiritilmagan.`)
      if (!p.countryCode.trim()) e.push(`${idx + 1}-yo'lovchi: Country code kiritilmagan.`)
    })

    return e
  }, [payer, passengers])

  const canSubmit = errors.length === 0 && agreeData

  const submit = async () => {
    if (!safeFlight.id) {
      setToastMsg("Option ID topilmadi. Qidiruvni qayta bajaring.")
      setToastOpen(true)
      return
    }
    if (!canSubmit) {
      const head = errors[0] ?? "Ma'lumotlar to'liq emas."
      const more = errors.length > 1 ? ` + yana ${errors.length - 1} ta` : ""
      setToastMsg(`${head}${more}`)
      setToastOpen(true)
      return
    }

    setBookLoading(true)
    setLastOrderId(null)
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setToastMsg("Avval login qiling (token yo'q).")
        setToastOpen(true)
        return
      }

      const res = await bookAir({
        optionID: safeFlight.id,
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
        setToastMsg(translateBookingError(res.data.message))
        setToastOpen(true)
        return
      }
      setLastOrderId(res.data.data?.orderID ?? null)
      setToastMsg(`Booking muvaffaqiyatli. Order ID: ${res.data.data?.orderID ?? "—"}`)
      setToastOpen(true)
      if (res.data.data?.orderID) {
        const curr = bookingCart.get()
        bookingCart.set({
          ...curr,
          flightId: safeFlight.id,
          route: `${safeFlight.from} → ${safeFlight.to}`,
          date,
          pax: Math.max(1, pax),
          lastOrderId: res.data.data.orderID,
          amount: total,
          currency: safeFlight.currency,
          airline: safeFlight.airline,
          flightNo: safeFlight.flightNo,
          cabin: safeFlight.cabin,
          baggage: safeFlight.baggage,
          carryOn: safeFlight.carryOn,
          paymentMethod,
          paymentStatus: "pending",
          segments: safeFlight.segments ?? [],
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
              route: curr.route,
              date: curr.date,
              createdAt: new Date().toISOString(),
            },
          ],
        })
      }
    } catch (err: any) {
      const msg = translateBookingError(err?.response?.data?.message || "Booking xato")
      setToastMsg(msg)
      setToastOpen(true)
      return
    } finally {
      setBookLoading(false)
    }

    // ✅ bookingCart ga hammasini yozamiz
    bookingCart.set({
      ...bookingCart.get(),
      flightId: safeFlight.id,
      route: `${safeFlight.from} → ${safeFlight.to}`,
      date,
      pax: Math.max(1, pax),
      amount: total,
      currency: safeFlight.currency,
      airline: safeFlight.airline,
      flightNo: safeFlight.flightNo,
      cabin: safeFlight.cabin,
      baggage: safeFlight.baggage,
      carryOn: safeFlight.carryOn,
      paymentMethod,
      paymentStatus: "not_connected",
      segments: safeFlight.segments ?? [],
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
    })

    // eski oqim kerak bo'lsa qoldiramiz (parent close qiladi)
    onBook(safeFlight)

    // ✅ passengers pagega tushadi (karzinka)
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
                    {flight.airline} · {flightNo}
                  </div>
                  <div className="mt-1 text-2xl md:text-3xl font-extrabold text-[#1d2430] dark:text-white">
                    {flight.from} → {flight.to}
                  </div>
                  <div className="mt-2 text-[#627188] text-sm dark:text-[#d2e0f8]">
                    Sana: <span className="text-[#1d2430] dark:text-white">{date || "—"}</span> · Yo'lovchi:{" "}
                    <span className="text-[#1d2430] dark:text-white">{Math.max(1, pax)}</span>
                  </div>
                </div>

                <div className="text-left md:text-right w-full md:w-auto">
                  <div className="text-[#718198] text-xs dark:text-[#a9bddb]">Yakuniy narx</div>
                  <div className="text-3xl font-extrabold text-[#1d2430] dark:text-white">
                    {formatMoney(total, safeFlight.currency)}
                  </div>
                  <div className="text-[#718198] text-xs dark:text-[#a9bddb]">Soliq va yig'imlar bilan</div>
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
                  1) Bron qilish
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
                  2) Ma'lumotlar
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
                  3) To'lov
                </span>
              </div>

              {step === "select" && (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Pill icon={PlaneTakeoff} label="Uchish" value={flight.depart} />
                  <Pill icon={PlaneLanding} label="Qo'nish" value={flight.arrive} />
                  <Pill icon={Clock} label="Davomiylik" value={fmtDuration(flight.durationMin)} />
                </div>
              )}
            </div>

            {/* body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 pb-24 md:p-7">
              {step === "select" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                      <div className="text-[#1d2430] font-semibold dark:text-white">Tarif & shartlar</div>

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
                          {refundable ? "Qaytarish mumkin" : "Qaytarilmaydi"}
                        </span>

                        <span className="rounded-full border border-[#dbe3ef] bg-white px-3 py-1 text-[#51627c] inline-flex items-center gap-2 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                          <Luggage size={14} />
                          {flight.baggage ?? "—"}
                        </span>

                        <span className="rounded-full border border-[#dbe3ef] bg-white px-3 py-1 text-[#51627c] inline-flex items-center gap-2 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                          <Luggage size={14} />
                          Carry-on: {flight.carryOn ?? "—"}
                        </span>
                      </div>

                      <div className="mt-4 text-[#627188] text-sm leading-relaxed dark:text-[#a9bddb]">
                        Tanlangan tarifning asosiy shartlari va bagaj ma'lumoti.
                      </div>

                      <div className="mt-4 text-[#627188] text-sm dark:text-[#a9bddb]">
                        {fareLoading && "Tariflar yuklanmoqda..."}
                        {!fareLoading && fareError && `Tariflar: ${fareError}`}
                        {!fareLoading && !fareError && fareData?.families?.length ? (
                          <div className="mt-2 space-y-2">
                            {fareData.families.map((f) => (
                              <div key={f.id} className="rounded-[20px] border border-[#e2e9f2] bg-white p-3 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                                <div className="text-[#1d2430] font-semibold text-sm dark:text-white">{f.name}</div>
                                <div className="mt-1 text-[#627188] text-xs dark:text-[#a9bddb]">
                                  Bagaj: {f.baggageInfos?.join(", ") || "—"}
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
                        <div className="text-[#1d2430] text-sm font-semibold dark:text-white">Reys tafsilotlari</div>
                        <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                          {optionDetailsLoading && "Reys tafsilotlari yuklanmoqda..."}
                          {!optionDetailsLoading &&
                            optionDetailsError &&
                            `Reys tafsilotlari: ${optionDetailsError}`}
                        </div>
                        {itinerarySegments.length > 0 ? (
                          <div className="mt-3 space-y-3">
                            {itinerarySegments.map((segment, index) => (
                              <div key={segment.id} className="rounded-[20px] border border-[#e2e9f2] bg-white p-3 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-[#1d2430] text-sm font-semibold dark:text-white">
                                    Segment {index + 1}: {segment.origin} → {segment.destination}
                                  </div>
                                  <div className="text-xs text-[#7b889c] dark:text-[#93abd0]">
                                    {segment.carrier || "—"} {segment.flightNumber || ""}
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Vaqt: {segment.departure} → {segment.arrival}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Davomiylik: {segment.duration ? fmtDuration(segment.duration) : "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Jo'nash terminali: {segment.departureTerminal || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Kelish terminali: {segment.arrivalTerminal || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Bagaj: {segment.baggage || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Qo'l yuki: {segment.carryOn || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Bron klassi: {segment.bookingClass || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Xizmat klassi: {segment.serviceClass || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Operatsion aviakompaniya: {segment.operatingCarrier || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Bo'sh o'rinlar: {segment.seatsAvailable ?? "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Samolyot turi: {segment.equipment || "—"}
                                  </div>
                                  <div className="rounded-[16px] border border-[#edf2f7] bg-[#f8fbff] px-3 py-2 text-xs text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(26,47,87,0.86)] dark:text-[#d4e2fb]">
                                    Tarif kodi: {segment.fareBasis || "—"}
                                  </div>
                                </div>
                                {segment.layover ? (
                                  <div className="mt-2 text-xs text-[#7b889c] dark:text-[#93abd0]">
                                    Kutish vaqti: {fmtDuration(segment.layover)}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <div className="text-[#1d2430] text-sm font-semibold dark:text-white">Tarif paketlari</div>
                        <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                          {fareFamiliesLoading && "Tarif paketlari yuklanmoqda..."}
                          {!fareFamiliesLoading &&
                            fareFamiliesError &&
                            `Tarif paketlari: ${fareFamiliesError}`}
                          {!fareFamiliesLoading &&
                            !fareFamiliesError &&
                            fareFamiliesData.length === 0 &&
                            "Tarif paketlari topilmadi."}
                        </div>

                        {!fareFamiliesLoading && !fareFamiliesError && fareFamiliesData.length > 0 && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {fareFamiliesData.map((f) => (
                              <div key={f.id} className="rounded-[20px] border border-[#e2e9f2] bg-white p-3 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                                <div className="text-[#1d2430] text-sm font-semibold dark:text-white">{f.name}</div>
                                <div className="mt-1 text-xs text-[#7b889c] dark:text-[#93abd0]">
                                  ID: {f.id}
                                </div>
                                <div className="mt-1 text-xs text-[#52627b] dark:text-[#d4e2fb]">
                                  Qo'shimcha narx: {formatMoney(f.price ?? 0, safeFlight.currency)}
                                </div>
                                <div className="mt-1 text-xs text-[#7b889c] dark:text-[#93abd0]">
                                  Bagaj: {f.baggageInfos?.join(", ") || "—"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="text-[#1d2430] text-sm font-semibold dark:text-white">Tarif qoidalari</div>
                        <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                          {rulesLoading && "Qoidalar yuklanmoqda..."}
                          {!rulesLoading && rulesError && `Qoidalar: ${rulesError}`}
                          {!rulesLoading && !rulesError && rulesData.length === 0 && (
                            <span>Qoidalar hozircha yo'q (backend `data: []` qaytardi).</span>
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
                      <div className="text-[#1d2430] font-semibold dark:text-white">Xizmatlar</div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {services.includes("wifi") && <Mini icon={Wifi} text="Wi-Fi" />}
                        {services.includes("meal") && <Mini icon={Coffee} text="Ovqat" />}
                        {services.includes("priority") && <Mini icon={BadgeCheck} text="Priority" />}
                        {services.includes("support") && (
                          <Mini icon={ShieldCheck} text="24/7 Qo'llab-quvvatlash" />
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
                      <div className="text-[#1d2430] font-semibold dark:text-white">Davom etish</div>
                      <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">Yo'lovchi ma'lumotlarini kiriting.</div>

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
                        Tanlash
                      </button>

                      <div className="mt-3 rounded-[18px] border border-[#e2e9f2] bg-white px-3 py-3 text-sm text-[#52627b] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                        {Math.max(1, pax)} ta yo'lovchi uchun forma ochiladi.
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
                        To'lovchi ma'lumotlari
                      </div>
                      <div className="text-xs text-[#7b889c] dark:text-[#93abd0]">Email va telefon</div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Country code"
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
                        label="Telefon raqam"
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
                        Yo'lovchilar ma'lumotlari
                      </div>
                      <div className="text-xs text-[#7b889c] dark:text-[#93abd0]">Jami: {Math.max(1, pax)} ta</div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {passengers.map((p, idx) => (
                        <div key={idx} className="rounded-[24px] border border-[#e2e9f2] bg-white p-4 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                          <div className="text-[#1d2430] font-semibold text-sm dark:text-white">Yo'lovchi #{idx + 1}</div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              label="Ism"
                              placeholder="Ism"
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
                              label="Familiya"
                              placeholder="Familiya"
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
                              label="Tug'ilgan sana"
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
                              label="Pasport berilgan sana"
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
                              label="Fuqarolik"
                              placeholder="O'zbekiston"
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
                              label="Country code"
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
                                <div className="mb-2 text-xs text-[#7b889c] dark:text-[#93abd0]">Jins</div>
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
                              label="Pasport amal qilish muddati"
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
                                label="Pasport seriya / raqam"
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
                      Davom etish
                    </button>
                    <button
                      onClick={() => setStep("select")}
                      className="h-12 rounded-2xl border border-[#dbe3ef] bg-white text-[#52627b] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(24,43,80,0.92)]"
                    >
                      Orqaga
                    </button>
                  </div>
                </div>
              )}

              {step === "pay" && (
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
                    <div className="text-[#1d2430] font-semibold dark:text-white">To'lov usuli</div>
                    <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">Mos usulni tanlang.</div>
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
                    <div className="text-[#1d2430] font-semibold dark:text-white">Buyurtma yakunlash</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <PriceRow label="Yo'nalish" value={`${safeFlight.from} → ${safeFlight.to}`} />
                      <PriceRow label="Sana" value={date || "—"} />
                      <PriceRow label="Yo'lovchi soni" value={`${Math.max(1, pax)} ta`} />
                      <PriceRow label="Narx (jami)" value={formatMoney(total, safeFlight.currency)} />
                    </div>
                    <div className="mt-3 text-xs text-[#7b889c] dark:text-[#93abd0]">
                      Tanlangan to'lov:{" "}
                      <span className="text-[#1d2430] font-semibold dark:text-white">
                        {paymentMethod ? paymentMethod.toUpperCase() : "tanlanmagan"}
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
                    Yuqoridagi ma'lumotlar to'g'ri ekanligini tasdiqlayman
                  </label>
                  {!agreeData && (
                    <div className="text-xs text-[#8a97aa] dark:text-[#93abd0]">
                      * Rasmiylashtirish uchun tasdiqlashni belgilang.
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
                      {bookLoading ? "..." : "Rasmiylashtirish"}
                    </button>
                    <button
                      onClick={() => setStep("details")}
                      className="h-12 rounded-2xl border border-[#dbe3ef] bg-white text-[#52627b] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(24,43,80,0.92)]"
                    >
                      Orqaga
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
                        <div className="text-white font-semibold text-sm">Xatolik</div>
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
