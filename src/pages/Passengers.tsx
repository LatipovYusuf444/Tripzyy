// src/pages/Passengers.tsx
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { formatMoney } from "@/lib/money"
import { formatUzPhoneInput } from "@/lib/phone"
import {
  Pencil,
  Trash2,
  Plus,
  Ticket,
  CalendarDays,
  Users2,
  ClipboardCheck,
  CreditCard,
  BadgeCheck,
  Mail,
  Phone,
} from "lucide-react"
import { bookingCart, type Passenger, type PayerInfo, uid } from "@/shared/store/bookingCart"
import {
  cancelOrderService,
  getOrderById,
  issueOrder,
  voidOrderService,
} from "@/shared/api/order/order.api"
import { bookAir, getAirPnrDetails } from "@/shared/api/air/air.api"

type Draft = Omit<Passenger, "id"> & { id?: string }

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

const primaryBtn =
  "bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-white shadow-[0_18px_50px_rgba(17,24,39,0.22)] hover:brightness-110 dark:border-[#35507f] dark:bg-[linear-gradient(135deg,#4b79ff_0%,#2f63df_45%,#214fb8_100%)] dark:shadow-[0_18px_40px_rgba(33,79,184,0.34)]"

const lightPanel =
  "border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.92)_100%)] backdrop-blur-xl shadow-[0_25px_70px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_25px_70px_rgba(4,10,28,0.42)]"

const btnBase =
  "inline-flex items-center justify-center rounded-2xl border text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"

const primaryButtonClass = `${btnBase} border-[#1a2231]/10 ${primaryBtn}`
const secondaryButtonClass =
  `${btnBase} border-[#dbe3ef] bg-white/90 text-[#1d2430] shadow-[0_12px_30px_rgba(17,24,39,0.08)] hover:bg-white dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:shadow-[0_14px_28px_rgba(4,10,28,0.28)] dark:hover:bg-[rgba(28,46,84,0.94)]`
const dangerButtonClass =
  `${btnBase} border-[#f0d8d9] bg-[linear-gradient(135deg,#fff7f7_0%,#fff0f1_100%)] text-[#9e4e5b] shadow-[0_12px_28px_rgba(158,78,91,0.10)] hover:bg-[#fff6f7] dark:border-[#5d4264] dark:bg-[linear-gradient(180deg,rgba(75,33,56,0.66)_0%,rgba(53,22,42,0.74)_100%)] dark:text-[#ffd5e0]`

export default function PassengersPage() {
  const [cart, setCart] = useState(() => bookingCart.get())
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    firstName: "",
    lastName: "",
    birthDate: "",
    citizenship: "O'zbekiston",
    passportNo: "",
    passportExpiry: "",
    passportIssued: "",
    gender: "M",
    countryCode: "UZ",
  })
  const [payer, setPayer] = useState<PayerInfo>(
    () =>
      cart.payer
        ? { ...cart.payer, phone: formatUzPhoneInput(cart.payer.phone || "+998") }
        : { email: "", phone: "+998", countryCode: "998" }
  )
  const [confirmEmail, setConfirmEmail] = useState("")
  const [agreeData, setAgreeData] = useState(false)
  const [agreeRules, setAgreeRules] = useState(false)
  const [bookLoading, setBookLoading] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<number | null>(null)
  const [bookError, setBookError] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelMsg, setCancelMsg] = useState<string | null>(null)
  const [issueLoading, setIssueLoading] = useState(false)
  const [issueMsg, setIssueMsg] = useState<string | null>(null)
  const [voidLoading, setVoidLoading] = useState(false)
  const [voidMsg, setVoidMsg] = useState<string | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderMsg, setOrderMsg] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<{
    id?: number
    status?: string
    currency?: string
    price?: number
    client?: string
    serviceType?: string
    reservationId?: string
  } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<
    "click" | "payme" | "uzum" | "paynet" | "visa" | ""
  >(cart.paymentMethod ?? "")
  const [pnrLocator, setPnrLocator] = useState("")
  const [pnrLoading, setPnrLoading] = useState(false)
  const [pnrMsg, setPnrMsg] = useState<string | null>(null)
  const [pnrData, setPnrData] = useState<{
    price?: number
    segments?: Array<{
      origin?: string
      destination?: string
      carrier?: string
      flightNumber?: string
      departure?: string
      arrival?: string
      baggage?: string
    }>
    passengers?: Array<{
      firstName?: string
      lastName?: string
      type?: string
      title?: string
    }>
  } | null>(null)

  const refresh = () => setCart(bookingCart.get())

  useEffect(() => {
    refresh()

    // ✅ cart boshqa joyda update bo'lsa ham shu page yangilansin
    const on = () => refresh()
    window.addEventListener("booking_cart_changed", on)
    return () => window.removeEventListener("booking_cart_changed", on)
  }, [])

  useEffect(() => {
    setPayer(
      cart.payer
        ? { ...cart.payer, phone: formatUzPhoneInput(cart.payer.phone || "+998") }
        : { email: "", phone: "+998", countryCode: "998" }
    )
  }, [cart.payer?.email, cart.payer?.phone, cart.payer?.countryCode])

  useEffect(() => {
    setPaymentMethod(cart.paymentMethod ?? "")
  }, [cart.paymentMethod])

  const title = useMemo(() => {
    const r = cart.route ? ` · ${cart.route}` : ""
    const d = cart.date ? ` · ${cart.date}` : ""
    return `Yo'lovchilar (Karzinka)${r}${d}`
  }, [cart.route, cart.date])

  const onAdd = () => {
    setDraft({
      firstName: "",
      lastName: "",
      birthDate: "",
      citizenship: "O'zbekiston",
      passportNo: "",
      passportExpiry: "",
      passportIssued: "",
      gender: "M",
      countryCode: "UZ",
    })
    setOpen(true)
  }

  const onEdit = (p: Passenger) => {
    setDraft({ ...p })
    setOpen(true)
  }

  const onDelete = (id: string) => {
    bookingCart.removePassenger(id)
    refresh()
  }

  const onClearCart = () => {
    bookingCart.clear()
    refresh()
    setStep(1)
  }

  const canSave =
    draft.firstName?.trim() &&
    draft.lastName?.trim() &&
    draft.birthDate?.trim() &&
    draft.citizenship?.trim() &&
    draft.passportNo?.trim() &&
    draft.passportExpiry?.trim() &&
    draft.passportIssued?.trim() &&
    draft.countryCode?.trim()

  const canContinueStep2 =
    payer.email.trim().length > 5 &&
    payer.email.includes("@") &&
    confirmEmail.trim().length > 5 &&
    payer.email.trim().toLowerCase() === confirmEmail.trim().toLowerCase() &&
    payer.phone.trim().length >= 7 &&
    (payer.countryCode ?? "").trim().length >= 1 &&
    paymentMethod !== ""

  const canCheckout =
    cart.passengers.length >= Math.max(1, (cart.pax ?? cart.passengers.length) || 1) &&
    agreeData &&
    agreeRules

  const onSave = () => {
    if (!canSave) return

    const p: Passenger = {
      id: draft.id ?? uid(),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      birthDate: draft.birthDate,
      citizenship: draft.citizenship.trim(),
      passportNo: draft.passportNo.trim().toUpperCase(),
      passportExpiry: draft.passportExpiry,
      passportIssued: draft.passportIssued,
      gender: draft.gender,
      countryCode: draft.countryCode?.toUpperCase(),
    }

    bookingCart.upsertPassenger(p)
    refresh()
    setOpen(false)
  }

  const pax = Math.max(1, (cart.pax ?? cart.passengers.length) || 1)

  const onBook = async () => {
    setBookError(null)
    setLastOrderId(null)
    setCancelMsg(null)
    setIssueMsg(null)
    setVoidMsg(null)
    if (!cart.flightId) {
      setBookError("Option ID topilmadi. Qidiruvni qayta bajaring.")
      return
    }
    if (!canCheckout) {
      setBookError("Ma'lumotlar to'liq emas.")
      return
    }

    setBookLoading(true)
    try {
      const res = await bookAir({
        optionID: cart.flightId,
        email: payer.email.trim(),
        countryCode: (payer.countryCode ?? "998").trim(),
        phoneNumber: payer.phone.replace(/\D/g, ""),
        passengers: cart.passengers.map((p) => ({
          type: "ADT",
          firstName: p.firstName,
          lastName: p.lastName,
          gender: p.gender ?? "M",
          dob: p.birthDate,
          countryCode: p.countryCode ?? "UZ",
          documentType: 1,
          documentNumber: p.passportNo,
          documentIssued: p.passportIssued ?? p.birthDate,
          documentExpires: p.passportExpiry,
        })),
      })

      if (res.data.status !== "success") {
        setBookError(res.data.message || "Booking xato")
        return
      }
      setLastOrderId(res.data.data?.orderID ?? null)
      if (res.data.data?.orderID) {
        const curr = bookingCart.get()
        bookingCart.set({
          ...curr,
          lastOrderId: res.data.data.orderID,
          paymentMethod,
          paymentStatus: "pending",
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
      setBookError(err?.response?.data?.message || "Booking xato")
    } finally {
      setBookLoading(false)
    }
  }

  const onCancelService = async () => {
    if (!lastOrderId) {
      setCancelMsg("Order ID topilmadi.")
      return
    }
    setCancelLoading(true)
    setCancelMsg(null)
    try {
      const res = await cancelOrderService(lastOrderId)
      setCancelMsg(res.data.message || "Cancel bajarildi")
    } catch (err: any) {
      setCancelMsg(err?.response?.data?.message || "Cancel xato")
    } finally {
      setCancelLoading(false)
    }
  }

  const onIssueOrder = async () => {
    if (!lastOrderId) {
      setIssueMsg("Order ID topilmadi.")
      return
    }
    setIssueLoading(true)
    setIssueMsg(null)
    try {
      const res = await issueOrder(lastOrderId)
      setIssueMsg(res.data.message || "Issue bajarildi")
    } catch (err: any) {
      setIssueMsg(err?.response?.data?.message || "Issue xato")
    } finally {
      setIssueLoading(false)
    }
  }

  const onVoidService = async () => {
    if (!lastOrderId) {
      setVoidMsg("Order ID topilmadi.")
      return
    }
    setVoidLoading(true)
    setVoidMsg(null)
    try {
      const res = await voidOrderService(lastOrderId)
      setVoidMsg(res.data.message || "VOID bajarildi")
    } catch (err: any) {
      setVoidMsg(err?.response?.data?.message || "VOID xato")
    } finally {
      setVoidLoading(false)
    }
  }

  const onGetPnr = async () => {
    const locator = pnrLocator.trim().toUpperCase()
    if (!locator) {
      setPnrMsg("Locator kiriting. Masalan: ABC123")
      return
    }
    setPnrLoading(true)
    setPnrMsg(null)
    setPnrData(null)
    try {
      const res = await getAirPnrDetails(locator)
      if (res.data.status !== "success") {
        setPnrMsg(res.data.message || "PNR topilmadi")
        return
      }
      setPnrData(res.data.data ?? null)
      setPnrMsg(res.data.message || "Success")
    } catch (err: any) {
      setPnrMsg(err?.response?.data?.message || "PNR so'rovi xato")
    } finally {
      setPnrLoading(false)
    }
  }

  const onGetOrder = async () => {
    const id = lastOrderId ?? cart.lastOrderId
    if (!id) {
      setOrderMsg("Order ID topilmadi.")
      return
    }
    setOrderLoading(true)
    setOrderMsg(null)
    setOrderData(null)
    try {
      const res = await getOrderById(id)
      if (res.data.status !== "success") {
        setOrderMsg(res.data.message || "Order topilmadi")
        return
      }
      const item = res.data.data?.[0]
      setOrderData({
        id: item?.id,
        status: item?.status,
        currency: item?.currency,
        price: item?.price,
        client: item?.client,
        serviceType: item?.services?.[0]?.type,
        reservationId: item?.services?.[0]?.reservation?.id,
      })
      setOrderMsg(res.data.message || "Success")
    } catch (err: any) {
      setOrderMsg(err?.response?.data?.message || "Order so'rovi xato")
    } finally {
      setOrderLoading(false)
    }
  }
  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f8_34%,#e8edf5_100%)] pt-24 text-[#1d2430] dark:bg-[linear-gradient(180deg,#0d1830_0%,#111e39_26%,#15254a_62%,#11203d_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(760px_320px_at_14%_0%,rgba(88,122,196,0.16),transparent_62%),radial-gradient(560px_260px_at_88%_6%,rgba(219,121,104,0.14),transparent_56%),radial-gradient(680px_320px_at_48%_36%,rgba(157,90,129,0.08),transparent_62%)] dark:bg-[radial-gradient(760px_320px_at_14%_0%,rgba(75,114,201,0.2),transparent_62%),radial-gradient(560px_260px_at_88%_6%,rgba(72,104,176,0.18),transparent_56%),radial-gradient(680px_320px_at_48%_36%,rgba(47,71,122,0.18),transparent_62%)]" />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-[1200px] px-5 py-10"
      >
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1d2430] dark:text-white">{title}</h1>
            <p className="mt-2 text-[#627188] text-sm dark:text-[#d2e0f8]">
              Reys tanlaganingdan keyin bron qilish jarayoni 3 bosqichda yakunlanadi.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill icon={Ticket} label="Reys" value={cart.route ?? "—"} />
              <Pill icon={CalendarDays} label="Sana" value={cart.date ?? "—"} />
              <Pill icon={Users2} label="Bilet soni" value={`${pax} ta`} />
            </div>
          </div>

          <button
            onClick={onClearCart}
            className={`h-11 px-4 ${secondaryButtonClass}`}
            title="Karzinkani tozalash"
          >
            Karzinkani tozalash
          </button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className={`mt-8 rounded-3xl p-5 ${lightPanel}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StepCard
              active={step === 1}
              done={step > 1}
              icon={ClipboardCheck}
              title="Bron qilish"
              desc="Reys ma'lumotlari va tanlovni tekshirish"
              onClick={() => setStep(1)}
            />
            <StepCard
              active={step === 2}
              done={step > 2}
              icon={CreditCard}
              title="To'lov"
              desc="Bog'lanish va to'lov ma'lumotlari"
              onClick={() => setStep(2)}
            />
            <StepCard
              active={step === 3}
              done={step > 3}
              icon={BadgeCheck}
              title="Chipta olish"
              desc="Yo'lovchi ma'lumotlari va tasdiqlash"
              onClick={() => setStep(3)}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-4 text-xs text-[#718198] dark:text-[#a9bddb]">
          * Bosqich kartasiga bosib o‘tish mumkin. To‘lov bo‘limi 2-bosqichda chiqadi.
        </motion.div>
        <motion.div variants={fadeUp} className="mt-3 flex items-center gap-2 text-xs text-[#627188] dark:text-[#d2e0f8]">
          <span>Joriy bosqich:</span>
          <span className="rounded-full border border-[#dbe3ef] bg-white/90 px-2.5 py-1 text-[#1d2430] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-white">
            {step}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s as 1 | 2 | 3)}
                className={[
                  "h-8 px-3 rounded-full border text-xs font-semibold transition",
                  step === s
                    ? "bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] border-[#1a2231]/10 text-white"
                    : "bg-white/80 border-[#dbe3ef] text-[#627188] hover:bg-white dark:border-[#35507f] dark:bg-[rgba(18,34,64,0.78)] dark:text-[#d7e5ff] dark:hover:bg-[rgba(24,43,80,0.92)]",
                ].join(" ")}
              >
                {s}-bosqich
              </button>
            ))}
          </div>
        </motion.div>

        {step === 1 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className={`lg:col-span-2 rounded-[28px] p-6 ${lightPanel}`}>
              <div className="text-lg font-extrabold dark:text-white">Yo'nalish tafsilotlari</div>
              <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                Mahalliy jo'nash va kelish vaqtlari, terminal va reys tafsilotlari.
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Yo'nalish" value={cart.route ?? "TAS → DXB"} />
                <InfoCard label="Sana" value={cart.date ?? "2026-03-17"} />
                <InfoCard label="Kabina" value={cart.cabin ?? "—"} />
                <InfoCard
                  label="Bagaj"
                  value={
                    [cart.baggage, cart.carryOn ? `carry-on ${cart.carryOn}` : ""]
                      .filter(Boolean)
                      .join(" · ") || "—"
                  }
                />
              </div>
              {cart.airline || cart.flightNo ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard label="Aviakompaniya" value={cart.airline ?? "—"} />
                  <InfoCard label="Reys raqami" value={cart.flightNo ?? "—"} />
                </div>
              ) : null}

              {cart.segments?.length ? (
                <div className="mt-4 rounded-2xl border border-[#dde5f0] bg-white/80 p-4">
                  <div className="text-sm font-semibold text-[#1d2430]">Segmentlar</div>
                  <div className="mt-3 space-y-3">
                    {cart.segments.map((segment, index) => (
                      <div key={segment.id} className="rounded-2xl border border-[#e6edf6] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-[#1d2430]">
                            {index + 1}. {segment.origin} → {segment.destination}
                          </div>
                          <div className="text-xs text-[#627188]">
                            {segment.carrier || "—"}{segment.flightNumber ? `-${segment.flightNumber}` : ""}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#627188]">
                          <div>{segment.departure} → {segment.arrival}</div>
                          <div>Terminal: {segment.departureTerminal || "—"} / {segment.arrivalTerminal || "—"}</div>
                          <div>Bagaj: {segment.baggage || "—"}</div>
                          <div>Carry-on: {segment.carryOn || "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`rounded-[28px] p-6 ${lightPanel}`}>
              <div className="text-lg font-extrabold">Narx</div>
              <div className="mt-2 text-[#627188] text-sm">Yakuniy narx va xizmatlar.</div>
              <div className="mt-5 rounded-2xl border border-[#f0d8cf] bg-[linear-gradient(135deg,#fff8f3_0%,#fff1f5_100%)] p-4 dark:border-[#4a3f5f] dark:bg-[linear-gradient(135deg,rgba(46,36,69,0.96)_0%,rgba(33,23,52,0.94)_100%)]">
                <div className="text-[#8d6d70] text-xs dark:text-[#d6bfd0]">Yakuniy narx</div>
                <div className="text-2xl font-extrabold text-[#b4586f] dark:text-[#ffd7e4]">
                  {formatMoney(cart.amount ?? 0, cart.currency || "UZS")}
                </div>
                <div className="mt-1 text-[#8d6d70] text-xs dark:text-[#d6bfd0]">Pax: {pax} ta</div>
              </div>
              <button
                onClick={() => setStep(2)}
                className={`mt-5 h-12 w-full ${primaryButtonClass}`}
              >
                Davom etish
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className={`lg:col-span-2 rounded-[28px] p-6 ${lightPanel}`}>
              <div className="text-lg font-extrabold">Bog'lanish uchun ma'lumot</div>
              <div className="mt-2 text-[#627188] text-sm">
                Chipta va o'zgarishlar bo'yicha xabarlar shu manzillarga yuboriladi.
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Country code"
                  value={payer.countryCode ?? ""}
                  onChange={(v) =>
                    setPayer((p) => {
                      const next = { ...p, countryCode: v.replace(/\D/g, "") }
                      bookingCart.patch({ payer: next })
                      return next
                    })
                  }
                  placeholder="998"
                />
                <Field
                  label="Elektron pochta"
                  icon={Mail}
                  value={payer.email}
                  onChange={(v) =>
                    setPayer((p) => {
                      const next = { ...p, email: v }
                      bookingCart.patch({ payer: next })
                      return next
                    })
                  }
                  placeholder="name@example.com"
                />
                <Field
                  label="Elektron pochta (re-)"
                  icon={Mail}
                  value={confirmEmail}
                  onChange={(v) => setConfirmEmail(v)}
                  placeholder="name@example.com"
                />
                <Field
                  label="Telefon"
                  icon={Phone}
                  value={payer.phone}
                  onChange={(v) =>
                    setPayer((p) => {
                      const next = { ...p, phone: formatUzPhoneInput(v) }
                      bookingCart.patch({ payer: next })
                      return next
                    })
                  }
                  placeholder="+998 95 559 54 44"
                />
              </div>
            </div>

            <div className={`rounded-[28px] p-6 ${lightPanel}`}>
              <div className="text-lg font-extrabold">Davom etish</div>
              <div className="mt-2 text-[#627188] text-sm">
                Ma'lumotlar to'liq bo'lsa, 3-bosqichga o'ting.
              </div>
                <div className="mt-4 rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)]">
                  <div className="text-[#1d2430] font-semibold dark:text-white">To'lov usuli</div>
                  <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                    To'lov usulini tanlang va bronni davom ettiring.
                  </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
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
                      onClick={() => {
                        const nextMethod = m.id as "click" | "payme" | "uzum" | "paynet" | "visa"
                        setPaymentMethod(nextMethod)
                        bookingCart.patch({ paymentMethod: nextMethod })
                      }}
                      className={[
                        `h-11 ${btnBase}`,
                        paymentMethod === m.id
                          ? `border-[#1a2231]/10 ${primaryBtn}`
                          : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(24,43,80,0.92)]",
                      ].join(" ")}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-[#627188] dark:text-[#a9bddb]">
                  Tanlangan to'lov:{" "}
                  <span className="text-[#1d2430] font-semibold dark:text-white">
                    {paymentMethod ? paymentMethod.toUpperCase() : "tanlanmagan"}
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-[#6d5a2f] dark:bg-[rgba(82,63,23,0.45)] dark:text-[#ffe39c]">
                  Payment gateway hali backend bilan ulanmagan. Bu tanlov saqlanadi, lekin avtomatik to'lov oynasi ochilmaydi.
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={!canContinueStep2}
                className={`mt-5 h-12 w-full ${primaryButtonClass}`}
              >
                3-bosqichga o'tish
              </button>
              <button
                onClick={() => setStep(1)}
                className={`mt-3 h-11 w-full ${secondaryButtonClass}`}
              >
                Orqaga
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className={`rounded-[28px] p-6 ${lightPanel}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold">Yo'lovchilarga kirish</div>
                    <div className="mt-1 text-[#627188] text-sm">
                      Har bir yo'lovchi uchun pasport va shaxsiy ma'lumotlar.
                    </div>
                  </div>
                  <button
                    onClick={onAdd}
                    className={`h-11 min-w-[190px] gap-2 px-4 sm:ml-auto ${primaryButtonClass}`}
                  >
                    Yo'lovchi qo'shish <Plus size={16} />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)]">
                  <div className="overflow-auto">
                    <table className="w-full min-w-[880px]">
                      <thead>
                        <tr className="text-left text-[#718198] text-sm">
                          <th className="px-3 py-3">#</th>
                          <th className="px-3 py-3">Ism</th>
                          <th className="px-3 py-3">Familiya</th>
                          <th className="px-3 py-3">Tug'ilgan sana</th>
                          <th className="px-3 py-3">Fuqarolik</th>
                          <th className="px-3 py-3">Pasport</th>
                          <th className="px-3 py-3">Amal qilish</th>
                          <th className="px-3 py-3">Amal</th>
                        </tr>
                      </thead>

                      <tbody>
                        {cart.passengers.length === 0 ? (
                          <tr>
                            <td className="px-3 py-6 text-[#627188] dark:text-[#a9bddb]" colSpan={8}>
                              Hozircha yo'lovchi yo'q. "Yo'lovchi qo'shish" ni bosing.
                            </td>
                          </tr>
                        ) : (
                          cart.passengers.map((p, idx) => (
                            <tr
                              key={p.id}
                              className="border-t border-[#edf2f7] bg-white/60 transition hover:bg-white dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.64)] dark:hover:bg-[rgba(24,43,80,0.88)]"
                            >
                              <td className="px-3 py-4 text-[#627188] dark:text-[#a9bddb]">{idx + 1}</td>
                              <td className="px-3 py-4 font-semibold text-[#1d2430] dark:text-white">{p.firstName}</td>
                              <td className="px-3 py-4 font-semibold text-[#1d2430] dark:text-white">{p.lastName}</td>
                              <td className="px-3 py-4 text-[#627188] dark:text-[#a9bddb]">{p.birthDate}</td>
                              <td className="px-3 py-4 text-[#627188] dark:text-[#a9bddb]">{p.citizenship}</td>
                              <td className="px-3 py-4 font-mono text-[#1d2430] dark:text-white">{p.passportNo}</td>
                              <td className="px-3 py-4 text-[#627188] dark:text-[#a9bddb]">{p.passportExpiry}</td>
                              <td className="px-3 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onEdit(p)}
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#dbe3ef] bg-white transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:hover:bg-[rgba(24,43,80,0.92)]"
                                    title="Tahrirlash"
                                  >
                                    <Pencil size={16} className="text-[#1C96C8]" />
                                  </button>

                                  <button
                                    onClick={() => onDelete(p.id)}
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#f0d8d9] bg-white transition hover:bg-[#fff5f6] dark:border-[#66415f] dark:bg-[rgba(45,27,50,0.82)] dark:hover:bg-[rgba(62,32,70,0.94)]"
                                    title="O'chirish"
                                  >
                                    <Trash2 size={16} className="text-[#8A3A5A]" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 text-xs text-[#718198] dark:text-[#93abd0]">
                    * Pax: {pax} ta. Checkoutdan keyin yo'lovchilar shu yerga tushadi.
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-[28px] p-6 lg:sticky lg:top-28 ${lightPanel}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold">Tasdiqlash</div>
                  <div className="mt-2 text-[#627188] text-sm">
                    Ma'lumotlarni tekshiring va rasmiylashtirishni yakunlang.
                  </div>
                </div>
                <div className="rounded-full border border-[#dbe3ef] bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#627188]">
                  3-bosqich
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label="Yo'lovchi" value={`${cart.passengers.length}/${pax}`} />
                <MiniStat
                  label="To'lov"
                  value={paymentMethod ? paymentMethod.toUpperCase() : "Tanlanmagan"}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-[#6d5a2f] dark:bg-[rgba(82,63,23,0.45)] dark:text-[#ffe39c]">
                Hozirgi holat: booking API ishlaydi, lekin payment redirect yoki transaction callback frontendga ulanmagan.
              </div>

              {lastOrderId ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Order ID: {lastOrderId}
                </div>
              ) : null}

              {cancelMsg ? (
                <div className="mt-3 rounded-2xl border border-[#f1d9d9] bg-[#fff7f7] px-4 py-3 text-sm text-[#9e4e5b]">
                  {cancelMsg}
                </div>
              ) : null}
              {issueMsg ? (
                <div className="mt-3 rounded-2xl border border-[#dbe3ef] bg-[#f8fbff] px-4 py-3 text-sm text-[#627188]">
                  {issueMsg}
                </div>
              ) : null}
              {voidMsg ? (
                <div className="mt-3 rounded-2xl border border-[#f1d9d9] bg-[#fff7f7] px-4 py-3 text-sm text-[#9e4e5b]">
                  {voidMsg}
                </div>
              ) : null}

              <div className="mt-4 rounded-[24px] border border-[#f0d8cf] bg-[linear-gradient(135deg,#fff8f3_0%,#fff1f5_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-[#4a3f5f] dark:bg-[linear-gradient(135deg,rgba(46,36,69,0.96)_0%,rgba(33,23,52,0.94)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[#8d6d70] dark:text-[#d6bfd0]">Narx</div>
                    <div className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#b4586f] dark:text-[#ffd7e4]">
                      {formatMoney(cart.amount ?? 0, cart.currency || "UZS")}
                    </div>
                  </div>
                  <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#8d6d70] dark:bg-white/10 dark:text-[#f2d9e7]">
                    Pax: {pax}
                  </div>
                </div>
                <div className="mt-3 text-xs text-[#8d6d70] dark:text-[#d6bfd0]">
                  To'lov:{" "}
                  <span className="font-semibold text-[#1d2430] dark:text-white">
                    {paymentMethod ? paymentMethod.toUpperCase() : "tanlanmagan"}
                  </span>
                </div>
              </div>

              {bookError ? (
                <div className="mt-3 rounded-2xl border border-[#f1d9d9] bg-[#fff7f7] p-3 text-sm text-[#9e4e5b]">
                  {bookError}
                </div>
              ) : null}

              <div className="mt-4 rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
                <div className="text-sm font-semibold text-[#1d2430]">Tasdiqlash shartlari</div>
                <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#627188]">
                  <input
                    type="checkbox"
                    checked={agreeData}
                    onChange={(e) => setAgreeData(e.target.checked)}
                    className="mt-0.5"
                  />
                  Yuqoridagi ma'lumotlar to'g'ri ekanligini tasdiqlayman
                </label>
                <label className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#627188]">
                  <input
                    type="checkbox"
                    checked={agreeRules}
                    onChange={(e) => setAgreeRules(e.target.checked)}
                    className="mt-0.5"
                  />
                  Men tanishdim va tarifning qoidalari va shartlariga roziman
                </label>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={onBook}
                  disabled={!canCheckout || bookLoading}
                  className={`h-12 w-full ${primaryButtonClass}`}
                >
                  {bookLoading ? "..." : "Rasmiylashtirish"}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onIssueOrder}
                    disabled={!lastOrderId || issueLoading}
                    className={`h-11 w-full ${secondaryButtonClass}`}
                  >
                    {issueLoading ? "Issue..." : "Issue PNR"}
                  </button>
                  <button
                    onClick={onCancelService}
                    disabled={!lastOrderId || cancelLoading}
                    className={`h-11 w-full ${dangerButtonClass}`}
                  >
                    {cancelLoading ? "Cancel..." : "Cancel PNR"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onVoidService}
                    disabled={!lastOrderId || voidLoading}
                    className={`h-11 w-full ${dangerButtonClass}`}
                  >
                    {voidLoading ? "VOID..." : "VOID PNR"}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className={`h-11 w-full ${secondaryButtonClass}`}
                  >
                    Orqaga
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4 border-t border-[#e7edf5] pt-5">
                <div className="rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
                  <div className="text-[#1d2430] font-semibold dark:text-white">Order details</div>
                  <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">GET /orders/{`{id}`}</div>
                  <button
                    onClick={onGetOrder}
                    disabled={orderLoading || !(lastOrderId || cart.lastOrderId)}
                    className={`mt-3 h-10 w-full rounded-xl ${secondaryButtonClass}`}
                  >
                    {orderLoading ? "..." : "Get Order by ID"}
                  </button>
                  {orderMsg && <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">{orderMsg}</div>}
                  {orderData && (
                    <div className="mt-2 space-y-1 text-xs text-[#627188] dark:text-[#a9bddb]">
                      <div>ID: {orderData.id ?? "—"}</div>
                      <div>Status: {orderData.status ?? "—"}</div>
                      <div>Narx: {formatMoney(orderData.price ?? 0, orderData.currency)}</div>
                      <div>Client: {orderData.client ?? "—"}</div>
                      <div>Service: {orderData.serviceType ?? "—"}</div>
                      <div>Reservation (PNR): {orderData.reservationId ?? "—"}</div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
                  <div className="text-[#1d2430] font-semibold dark:text-white">PNR tekshirish</div>
                  <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">
                    `GET /air/get-pnr?locator=ABC123`
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={pnrLocator}
                      onChange={(e) => setPnrLocator(e.target.value.toUpperCase())}
                      placeholder="PNR locator (ABC123)"
                      className="h-10 flex-1 rounded-xl border border-[#dbe3ef] bg-white px-3 outline-none focus:border-[#c7d4e7]"
                    />
                    <button
                      onClick={onGetPnr}
                      disabled={pnrLoading}
                      className={`h-10 px-3 rounded-xl ${secondaryButtonClass}`}
                    >
                      {pnrLoading ? "..." : "Get PNR"}
                    </button>
                  </div>
                  {pnrMsg && <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">{pnrMsg}</div>}
                  {pnrData && (
                    <div className="mt-3 space-y-2 text-xs text-[#627188] dark:text-[#a9bddb]">
                      <div>Narx: {formatMoney(pnrData.price ?? 0, cart.currency || "UZS")}</div>
                      <div>Segments: {pnrData.segments?.length ?? 0}</div>
                      {pnrData.segments?.slice(0, 2).map((s, i) => (
                        <div key={i} className="rounded-lg border border-[#dde5f0] bg-white p-2">
                          {(s.origin || "—") + " → " + (s.destination || "—")} · {(s.carrier || "—")}
                          {(s.flightNumber && `-${s.flightNumber}`) || ""}
                          <div className="mt-1 text-[#718198]">
                            {s.departure || "—"} → {s.arrival || "—"} · Bagaj: {s.baggage || "—"}
                          </div>
                        </div>
                      ))}
                      <div>Passengers: {pnrData.passengers?.length ?? 0}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-[80] bg-[rgba(15,23,42,0.45)] backdrop-blur-sm grid place-items-center p-4">
            <div
              className="
                w-full max-w-[720px]
                rounded-[28px]
                border border-white/80
                bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.94)_100%)]
                backdrop-blur-2xl
                shadow-[0_45px_140px_rgba(17,24,39,0.22)]
                p-5
                dark:border-[#35507f]
                dark:bg-[linear-gradient(180deg,rgba(10,22,44,0.98)_0%,rgba(14,28,54,0.96)_100%)]
                dark:shadow-[0_45px_140px_rgba(2,8,24,0.65)]
              "
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-extrabold text-[#1d2430] dark:text-white">
                  {draft.id ? "Yo'lovchini tahrirlash" : "Yo'lovchi qo'shish"}
                </div>
                <button
                onClick={() => setOpen(false)}
                  className="h-10 w-10 rounded-xl border border-[#dbe3ef] bg-white text-[#1d2430] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:hover:bg-[rgba(24,43,80,0.92)]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Ism"
                  value={draft.firstName}
                  onChange={(v) => setDraft((p) => ({ ...p, firstName: v }))}
                  placeholder="Ism"
                />
                <Field
                  label="Familiya"
                  value={draft.lastName}
                  onChange={(v) => setDraft((p) => ({ ...p, lastName: v }))}
                  placeholder="Familiya"
                />
                <Field
                  label="Tug'ilgan sana"
                  type="date"
                  value={draft.birthDate}
                  onChange={(v) => setDraft((p) => ({ ...p, birthDate: v }))}
                />
                <Field
                  label="Gender"
                  value={draft.gender ?? "M"}
                  onChange={(v) =>
                    setDraft((p) => ({ ...p, gender: (v.toUpperCase() === "F" ? "F" : "M") }))
                  }
                  placeholder="M / F"
                />
                <Field
                  label="Fuqarolik"
                  value={draft.citizenship}
                  onChange={(v) => setDraft((p) => ({ ...p, citizenship: v }))}
                  placeholder="O'zbekiston"
                />
                <Field
                  label="Country code"
                  value={draft.countryCode ?? "UZ"}
                  onChange={(v) => setDraft((p) => ({ ...p, countryCode: v.toUpperCase() }))}
                  placeholder="UZ"
                />
                <Field
                  label="Pasport seriya / raqam"
                  value={draft.passportNo}
                  onChange={(v) => setDraft((p) => ({ ...p, passportNo: v.toUpperCase() }))}
                  placeholder="AA1234567"
                />
                <Field
                  label="Pasport berilgan sana"
                  type="date"
                  value={draft.passportIssued ?? ""}
                  onChange={(v) => setDraft((p) => ({ ...p, passportIssued: v }))}
                />
                <Field
                  label="Pasport amal qilish muddati"
                  type="date"
                  value={draft.passportExpiry}
                  onChange={(v) => setDraft((p) => ({ ...p, passportExpiry: v }))}
                />
              </div>

              <button
                onClick={onSave}
                disabled={!canSave}
                className={`mt-4 h-12 w-full ${primaryButtonClass}`}
              >
                Saqlash
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </section>
  )
}

function Pill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#dde5f0] bg-white/90 px-4 py-2 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.24)]">
      <Icon size={14} className="text-[#6e7f96] dark:text-[#9fb4d7]" />
      <div className="text-xs text-[#7b8aa0] dark:text-[#a9bddb]">{label}:</div>
      <div className="text-sm font-semibold text-[#1d2430] dark:text-white">{value}</div>
    </div>
  )
}

function StepCard({
  icon: Icon,
  title,
  desc,
  active,
  done,
  onClick,
}: {
  icon: any
  title: string
  desc: string
  active?: boolean
  done?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={`
        w-full text-left
        rounded-2xl border
        ${active ? "border-[#cbd7e8] bg-white dark:border-[#4d6fa8] dark:bg-[linear-gradient(180deg,rgba(35,60,110,0.9)_0%,rgba(26,47,87,0.92)_100%)]" : "border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)]"}
        p-4 shadow-[0_18px_40px_rgba(17,24,39,0.07)]
        ${onClick ? "cursor-pointer hover:bg-white transition" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            h-11 w-11 rounded-2xl grid place-items-center
            ${done ? "bg-[linear-gradient(135deg,#eef5ff_0%,#dce9ff_100%)] text-[#3058a6] dark:bg-[linear-gradient(135deg,rgba(57,95,170,0.34)_0%,rgba(43,72,128,0.38)_100%)] dark:text-[#cfe0ff]" : "bg-[linear-gradient(135deg,#fff6f7_0%,#f6f8ff_100%)] text-[#7b6a8f] dark:bg-[linear-gradient(135deg,rgba(44,60,102,0.44)_0%,rgba(34,49,82,0.42)_100%)] dark:text-[#d7c9ef]"}
          `}
        >
          <Icon size={18} />
        </div>
        <div>
          <div className="text-[#1d2430] font-semibold dark:text-white">{title}</div>
          <div className="text-[#718198] text-xs dark:text-[#a9bddb]">{desc}</div>
        </div>
      </div>
    </button>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)]">
      <div className="text-[#7b8aa0] text-xs dark:text-[#a9bddb]">{label}</div>
      <div className="mt-1 text-[#1d2430] font-semibold dark:text-white">{value}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 py-3 dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)]">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7b8aa0] dark:text-[#a9bddb]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#1d2430] dark:text-white">{value}</div>
    </div>
  )
}

function Field({
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
      <div className="text-[#7b8aa0] text-xs mb-2 dark:text-[#a9bddb]">{label}</div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ca0bc] dark:text-[#9fb4d7]">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`
            h-12 w-full rounded-2xl
            bg-white border border-[#dbe3ef] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)]
            ${Icon ? "pl-10 pr-4" : "px-4"}
            outline-none
            focus:border-[#c7d4e7] focus:bg-white dark:focus:bg-[rgba(28,46,84,0.94)]
            transition text-[#1d2430] placeholder:text-[#97a5ba] dark:text-white dark:placeholder:text-[#8ea5cb]
          `}
        />
      </div>
    </label>
  )
}
