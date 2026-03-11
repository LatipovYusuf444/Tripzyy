import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { bookingCart } from "@/shared/store/bookingCart"
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

export type Flight = {
  id: string
  from: string
  to: string
  airline: string
  depart: string
  arrive: string
  durationMin: number
  price: number
  baggage?: string
  cabin?: "Economy" | "Business"
  refundable?: boolean
  services?: Array<"wifi" | "meal" | "priority" | "support">
  flightNo?: string
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

const overlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
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
    } as Flight)

  const [step, setStep] = useState<Step>("select")
  const [payer, setPayer] = useState<PayerInfo>({ email: "", phone: "", countryCode: "998" })
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
    bookingClass?: string
    serviceClass?: string
    operatingCarrier?: string
    terminalFrom?: string | null
    terminalTo?: string | null
    seatsAvailable?: number
    equipment?: string
    fareBasis?: string
  } | null>(null)

  // modal ochilganda reset
  useEffect(() => {
    if (!open) return
    setStep("select")
    setPayer({ email: "", phone: "", countryCode: "998" })
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

        const seg = res.data.data?.trips?.[0]?.segments?.[0]
        setOptionDetails({
          bookingClass: seg?.bookingClass,
          serviceClass: seg?.serviceClass,
          operatingCarrier: seg?.operatingCarrier,
          terminalFrom: seg?.departureTerminal,
          terminalTo: seg?.arrivalTerminal,
          seatsAvailable: seg?.seatsAvailable,
          equipment: seg?.equipment,
          fareBasis: seg?.fareBasis,
        })
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
        setToastMsg(res.data.message || "Booking xato")
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
          lastOrderId: res.data.data.orderID,
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
      const msg = err?.response?.data?.message || "Booking xato"
      setToastMsg(msg)
      setToastOpen(true)
      return
    } finally {
      setBookLoading(false)
    }

    // ✅ bookingCart ga hammasini yozamiz
    bookingCart.set({
      flightId: safeFlight.id,
      route: `${safeFlight.from} → ${safeFlight.to}`,
      date,
      pax: Math.max(1, pax),
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
          <motion.button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            variants={overlay}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[60] bg-black/55"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              fixed z-[70]
              left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[min(1240px,96vw)]
              max-h-[90vh]
              overflow-hidden
              rounded-[28px]
              border border-white/18
              bg-white/10
              backdrop-blur-2xl
              shadow-[0_45px_140px_rgba(0,0,0,0.65)]
            "
          >
            {/* header */}
            <div className="relative p-5 md:p-7 bg-gradient-to-b from-white/10 via-transparent to-transparent">
              <button
                onClick={onClose}
                className="
                  absolute right-4 top-4
                  h-10 w-10 rounded-xl
                  border border-white/20 bg-white/10
                  text-white hover:bg-white/20 transition
                  grid place-items-center
                "
              >
                <X size={18} />
              </button>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-white/70 text-sm">
                    {flight.airline} · {flightNo}
                  </div>
                  <div className="mt-1 text-2xl md:text-3xl font-extrabold text-white">
                    {flight.from} → {flight.to}
                  </div>
                  <div className="mt-2 text-white/70 text-sm">
                    Sana: <span className="text-white/85">{date || "—"}</span> · Yo'lovchi:{" "}
                    <span className="text-white/85">{Math.max(1, pax)}</span>
                  </div>
                </div>

                <div className="text-left md:text-right w-full md:w-auto">
                  <div className="text-white/60 text-xs">Yakuniy narx</div>
                  <div className="text-3xl font-extrabold text-white">${total}</div>
                  <div className="text-white/55 text-xs">tax + fee included (demo)</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                <span
                  className={[
                    "px-3 py-1 rounded-full border",
                    step === "select"
                      ? "bg-white/12 border-white/25 text-white"
                      : "bg-white/6 border-white/10 text-white/65",
                  ].join(" ")}
                >
                  1) Bron qilish
                </span>
                <span className="text-white/35">→</span>
                <span
                  className={[
                    "px-3 py-1 rounded-full border",
                    step === "details"
                      ? "bg-white/12 border-white/25 text-white"
                      : "bg-white/6 border-white/10 text-white/65",
                  ].join(" ")}
                >
                  2) Ma'lumotlar
                </span>
                <span className="text-white/35">→</span>
                <span
                  className={[
                    "px-3 py-1 rounded-full border",
                    step === "pay"
                      ? "bg-white/12 border-white/25 text-white"
                      : "bg-white/6 border-white/10 text-white/65",
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
            <div className="p-5 md:p-7 overflow-auto max-h-[calc(90vh-210px)] sm:max-h-[calc(90vh-190px)] md:max-h-[calc(90vh-170px)]">
              {step === "select" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                      <div className="text-white font-semibold">Tarif & shartlar</div>

                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/85">
                          {cabin}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-sm ${
                            refundable
                              ? "border-green-500/25 bg-green-500/15 text-green-100"
                              : "border-white/15 bg-white/10 text-white/75"
                          }`}
                        >
                          {refundable ? "Qaytarish mumkin" : "Qaytarilmaydi"}
                        </span>

                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/85 inline-flex items-center gap-2">
                          <Luggage size={14} />
                          {flight.baggage ?? "—"}
                        </span>
                      </div>

                      <div className="mt-4 text-white/65 text-sm leading-relaxed">
                        Tarif qoidalari, qaytarish shartlari va baggage tafsilotlari backenddan olinadi.
                      </div>

                      <div className="mt-4 text-white/70 text-sm">
                        {fareLoading && "Tariflar yuklanmoqda..."}
                        {!fareLoading && fareError && `Tariflar: ${fareError}`}
                        {!fareLoading && !fareError && fareData?.families?.length ? (
                          <div className="mt-2 space-y-2">
                            {fareData.families.map((f) => (
                              <div
                                key={f.id}
                                className="rounded-xl border border-white/12 bg-white/6 p-3"
                              >
                                <div className="text-white/90 font-semibold text-sm">
                                  {f.name}
                                </div>
                                <div className="mt-1 text-white/70 text-xs">
                                  Baggage: {f.baggageInfos?.join(", ") || "—"}
                                </div>
                                {f.services && f.services.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {f.services.map((s, i) => (
                                      <span
                                        key={`${f.id}-${i}`}
                                        className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[11px] text-white/75"
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
                        <div className="text-white/85 text-sm font-semibold">Option details</div>
                        <div className="mt-2 text-white/70 text-sm">
                          {optionDetailsLoading && "Option details yuklanmoqda..."}
                          {!optionDetailsLoading &&
                            optionDetailsError &&
                            `Option details: ${optionDetailsError}`}
                        </div>
                        {!optionDetailsLoading && !optionDetailsError && optionDetails && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Booking class: {optionDetails.bookingClass || "—"}
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Service class: {optionDetails.serviceClass || "—"}
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Operating carrier: {optionDetails.operatingCarrier || "—"}
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Seats: {optionDetails.seatsAvailable ?? "—"}
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Terminal (from): {optionDetails.terminalFrom || "—"}
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Terminal (to): {optionDetails.terminalTo || "—"}
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Equipment: {optionDetails.equipment || "—"}
                            </div>
                            <div className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80">
                              Fare basis: {optionDetails.fareBasis || "—"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="text-white/85 text-sm font-semibold">Fare families</div>
                        <div className="mt-2 text-white/70 text-sm">
                          {fareFamiliesLoading && "Fare families yuklanmoqda..."}
                          {!fareFamiliesLoading &&
                            fareFamiliesError &&
                            `Fare families: ${fareFamiliesError}`}
                          {!fareFamiliesLoading &&
                            !fareFamiliesError &&
                            fareFamiliesData.length === 0 &&
                            "Fare families topilmadi."}
                        </div>

                        {!fareFamiliesLoading && !fareFamiliesError && fareFamiliesData.length > 0 && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {fareFamiliesData.map((f) => (
                              <div
                                key={f.id}
                                className="rounded-xl border border-white/12 bg-white/6 p-3"
                              >
                                <div className="text-white/90 text-sm font-semibold">{f.name}</div>
                                <div className="mt-1 text-xs text-white/70">
                                  ID: {f.id}
                                </div>
                                <div className="mt-1 text-xs text-white/80">
                                  Qo'shimcha narx: {f.price ?? 0}
                                </div>
                                <div className="mt-1 text-xs text-white/70">
                                  Baggage: {f.baggageInfos?.join(", ") || "—"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="text-white/85 text-sm font-semibold">Fare rules</div>
                        <div className="mt-2 text-white/70 text-sm">
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
                                className="rounded-xl border border-white/12 bg-white/6 p-3"
                              >
                                <div className="text-white/90 text-sm font-semibold">
                                  {rule.flight} · {rule.fareBasis}
                                </div>
                                <div className="mt-2 space-y-2">
                                  {rule.categories.slice(0, 2).map((c) => (
                                    <div
                                      key={`${rule.flight}-${c.id}`}
                                      className="rounded-lg border border-white/10 bg-white/5 p-2"
                                    >
                                      <div className="text-white/85 text-xs font-semibold">
                                        {c.category}
                                      </div>
                                      <div className="mt-1 text-white/65 text-xs whitespace-pre-wrap">
                                        {c.text}
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

                    <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                      <div className="text-white font-semibold">Xizmatlar</div>

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
                            <div
                              key={`${text}-${i}`}
                              className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80"
                            >
                              {text}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 text-white/65 text-sm">
                        {backendServiceDescriptions.length > 0
                          ? "Yuqoridagi xizmatlar backenddan olindi."
                          : "Hozircha xizmatlar ro'yxati backenddan kelmadi."}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                      <div className="text-white font-semibold">Tanlov</div>
                      <div className="mt-3 text-white/70 text-sm">
                        Keyingi bosqichda: to'lovchi va yo'lovchilar ma'lumotlarini to'ldirasiz.
                      </div>

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

                      <div className="mt-3 text-xs text-white/55">
                        * Pax: {Math.max(1, pax)} ta yo'lovchi uchun forma chiqadi.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/8 p-5 text-white/70 text-sm">
                      <span className="text-white font-semibold">Eslatma:</span> Hozir demo.
                      Backend ulanganida real "checkout" ishlaydi.
                    </div>
                  </div>
                </div>
              )}

              {step === "details" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold inline-flex items-center gap-2">
                        <User size={18} />
                        To'lovchi ma'lumotlari
                      </div>
                      <div className="text-xs text-white/55">Email va telefon</div>
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
                        placeholder="901234567"
                        icon={Phone}
                        value={payer.phone}
                        onChange={(v) => setPayer((p) => ({ ...p, phone: v }))}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold inline-flex items-center gap-2">
                        <Users size={18} />
                        Yo'lovchilar ma'lumotlari
                      </div>
                      <div className="text-xs text-white/55">Jami: {Math.max(1, pax)} ta</div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {passengers.map((p, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/12 bg-white/6 p-4">
                          <div className="text-white/85 font-semibold text-sm">Yo'lovchi #{idx + 1}</div>

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
                                <div className="text-white/60 text-xs mb-2">Gender</div>
                                <select
                                  className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25 focus:bg-white/10 transition text-white"
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
                      className="h-12 rounded-2xl border border-white/15 bg-white/8 text-white/85 hover:bg-white/12 transition"
                    >
                      Orqaga
                    </button>
                  </div>
                </div>
              )}

              {step === "pay" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                    <div className="text-white font-semibold">To'lov usuli</div>
                    <div className="mt-2 text-white/70 text-sm">
                      Demo: hozircha faqat vizual tanlov. Backendga yuborilmaydi.
                    </div>
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
                              ? "border-white/35 bg-white/20 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                              : "border-white/12 bg-white/6 text-white/80 hover:bg-white/12",
                          ].join(" ")}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                    <div className="text-white font-semibold">Buyurtma yakunlash</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <PriceRow label="Yo'nalish" value={`${safeFlight.from} → ${safeFlight.to}`} />
                      <PriceRow label="Sana" value={date || "—"} />
                      <PriceRow label="Yo'lovchi soni" value={`${Math.max(1, pax)} ta`} />
                      <PriceRow label="Narx (jami)" value={`$${total}`} />
                    </div>
                    <div className="mt-3 text-xs text-white/60">
                      Tanlangan to'lov:{" "}
                      <span className="text-white/85 font-semibold">
                        {paymentMethod ? paymentMethod.toUpperCase() : "tanlanmagan"}
                      </span>
                    </div>
                  </div>

                  {errors.length > 0 && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-100 text-sm">
                      {errors[0]}
                    </div>
                  )}

                  <label className="mt-2 flex items-start gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={agreeData}
                      onChange={(e) => setAgreeData(e.target.checked)}
                      className="mt-0.5"
                    />
                    Yuqoridagi ma'lumotlar to'g'ri ekanligini tasdiqlayman
                  </label>
                  {!agreeData && (
                    <div className="text-xs text-white/55">
                      * Rasmiylashtirish uchun tasdiqlashni belgilang.
                    </div>
                  )}

                  {lastOrderId && (
                    <div className="text-xs text-emerald-200">
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
                      className="h-12 rounded-2xl border border-white/15 bg-white/8 text-white/85 hover:bg-white/12 transition"
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
    <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/12 grid place-items-center">
          <Icon className="text-white" size={18} />
        </div>
        <div>
          <div className="text-white/60 text-xs">{label}</div>
          <div className="text-white font-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}

function Mini({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-white/75 text-xs">
      <Icon size={14} className="text-white/80" />
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
      <div className="text-white/60 text-xs mb-2">{label}</div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          className={`
            h-12 w-full rounded-2xl bg-white/5 border border-white/10
            ${Icon ? "pl-10 pr-4" : "px-4"}
            outline-none focus:border-white/25 focus:bg-white/10 transition text-white
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
    <div className="rounded-2xl border border-white/12 bg-white/6 p-4">
      <div className="text-white/60 text-xs">{label}</div>
      <div className="text-white font-semibold mt-1">{value}</div>
    </div>
  )
}
