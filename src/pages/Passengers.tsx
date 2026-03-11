// src/pages/Passengers.tsx
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
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
    () => cart.payer ?? { email: "", phone: "", countryCode: "998" }
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
  >("")
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
    setPayer(cart.payer ?? { email: "", phone: "", countryCode: "998" })
  }, [cart.payer?.email, cart.payer?.phone, cart.payer?.countryCode])

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
    <section className="relative min-h-screen text-white pt-24">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-[1200px] px-5 py-10"
      >
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{title}</h1>
            <p className="mt-2 text-white/70 text-sm">
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
            className="
              h-11 px-4 rounded-2xl
              border border-white/15 bg-white/10
              text-white/85 font-semibold
              hover:bg-white/15 transition
            "
            title="Karzinkani tozalash"
          >
            Karzinkani tozalash
          </button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
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

        <motion.div variants={fadeUp} className="mt-4 text-xs text-white/60">
          * Bosqich kartasiga bosib o‘tish mumkin. To‘lov bo‘limi 2-bosqichda chiqadi.
        </motion.div>
        <motion.div variants={fadeUp} className="mt-3 flex items-center gap-2 text-xs text-white/70">
          <span>Joriy bosqich:</span>
          <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-white/85">
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
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                ].join(" ")}
              >
                {s}-bosqich
              </button>
            ))}
          </div>
        </motion.div>

        {step === 1 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-[28px] border border-white/12 bg-white/7 backdrop-blur-2xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
              <div className="text-lg font-extrabold">Yo'nalish tafsilotlari</div>
              <div className="mt-2 text-white/70 text-sm">
                Mahalliy jo'nash va kelish vaqtlari, terminal va reys tafsilotlari.
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Yo'nalish" value={cart.route ?? "TAS → DXB"} />
                <InfoCard label="Sana" value={cart.date ?? "2026-03-17"} />
                <InfoCard label="Kabina" value="Economy / Business" />
                <InfoCard label="Bagaj" value="20kg + 7kg cabin" />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/7 backdrop-blur-2xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
              <div className="text-lg font-extrabold">Narx</div>
              <div className="mt-2 text-white/70 text-sm">Yakuniy narx va xizmatlar.</div>
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <div className="text-white/70 text-xs">Yakuniy narx</div>
                <div className="text-2xl font-extrabold text-[#F4D7E3]">3 887 401 UZS</div>
                <div className="mt-1 text-white/60 text-xs">Pax: {pax} ta</div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="
                  mt-5 h-12 w-full rounded-2xl
                  bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                  text-white font-semibold transition
                  shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                  hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                "
              >
                Davom etish
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-[28px] border border-white/12 bg-white/7 backdrop-blur-2xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
              <div className="text-lg font-extrabold">Bog'lanish uchun ma'lumot</div>
              <div className="mt-2 text-white/70 text-sm">
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
                      const next = { ...p, phone: v }
                      bookingCart.patch({ payer: next })
                      return next
                    })
                  }
                  placeholder="+998 XX XXX XX XX"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/7 backdrop-blur-2xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
              <div className="text-lg font-extrabold">Davom etish</div>
              <div className="mt-2 text-white/70 text-sm">
                Ma'lumotlar to'liq bo'lsa, 3-bosqichga o'ting.
              </div>
              <div className="mt-4 rounded-2xl border border-white/12 bg-white/6 p-4">
                <div className="text-white font-semibold">To'lov usuli</div>
                <div className="mt-2 text-white/70 text-sm">
                  Demo: hozircha faqat tanlash. Backendga yuborilmaydi.
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
                <div className="mt-3 text-xs text-white/60">
                  Tanlangan to'lov:{" "}
                  <span className="text-white/85 font-semibold">
                    {paymentMethod ? paymentMethod.toUpperCase() : "tanlanmagan"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={!canContinueStep2}
                className="
                  mt-5 h-12 w-full rounded-2xl
                  bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                  text-white font-semibold transition
                  shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                  hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                3-bosqichga o'tish
              </button>
              <button
                onClick={() => setStep(1)}
                className="mt-3 h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition"
              >
                Orqaga
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="rounded-[28px] border border-white/12 bg-white/7 backdrop-blur-2xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold">Yo'lovchilarga kirish</div>
                    <div className="mt-1 text-white/70 text-sm">
                      Har bir yo'lovchi uchun pasport va shaxsiy ma'lumotlar.
                    </div>
                  </div>
                  <button
                    onClick={onAdd}
                    className="
                      h-11 px-4 rounded-2xl
                      bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                      text-white font-semibold
                      inline-flex items-center gap-2
                      transition
                      shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                      hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                    "
                  >
                    Yo'lovchi qo'shish <Plus size={16} />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="overflow-auto">
                    <table className="w-full min-w-[880px]">
                      <thead>
                        <tr className="text-left text-white/60 text-sm">
                          <th className="py-3 px-3">#</th>
                          <th className="py-3 px-3">Ism</th>
                          <th className="py-3 px-3">Familiya</th>
                          <th className="py-3 px-3">Tug'ilgan sana</th>
                          <th className="py-3 px-3">Fuqarolik</th>
                          <th className="py-3 px-3">Pasport</th>
                          <th className="py-3 px-3">Amal qilish</th>
                          <th className="py-3 px-3">Amal</th>
                        </tr>
                      </thead>

                      <tbody>
                        {cart.passengers.length === 0 ? (
                          <tr>
                            <td className="py-6 px-3 text-white/65" colSpan={8}>
                              Hozircha yo'lovchi yo'q. "Yo'lovchi qo'shish" ni bosing.
                            </td>
                          </tr>
                        ) : (
                          cart.passengers.map((p, idx) => (
                            <tr
                              key={p.id}
                              className="border-t border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                            >
                              <td className="py-4 px-3 text-white/70">{idx + 1}</td>
                              <td className="py-4 px-3 text-white font-semibold">{p.firstName}</td>
                              <td className="py-4 px-3 text-white font-semibold">{p.lastName}</td>
                              <td className="py-4 px-3 text-white/75">{p.birthDate}</td>
                              <td className="py-4 px-3 text-white/75">{p.citizenship}</td>
                              <td className="py-4 px-3 text-white/85 font-mono">{p.passportNo}</td>
                              <td className="py-4 px-3 text-white/75">{p.passportExpiry}</td>
                              <td className="py-4 px-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onEdit(p)}
                                    className="
                                      h-9 w-9 rounded-xl
                                      border border-white/15 bg-white/10
                                      hover:bg-white/15 transition
                                      grid place-items-center
                                    "
                                    title="Tahrirlash"
                                  >
                                    <Pencil size={16} className="text-[#1C96C8]" />
                                  </button>

                                  <button
                                    onClick={() => onDelete(p.id)}
                                    className="
                                      h-9 w-9 rounded-xl
                                      border border-white/15 bg-white/10
                                      hover:bg-white/15 transition
                                      grid place-items-center
                                    "
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

                  <div className="mt-3 text-xs text-white/55">
                    * Pax: {pax} ta. Checkoutdan keyin yo'lovchilar shu yerga tushadi.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/7 backdrop-blur-2xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
              <div className="text-lg font-extrabold">Tasdiqlash</div>
              <div className="mt-2 text-white/70 text-sm">
                Ma'lumotlarni tekshiring va rasmiylashtirishni yakunlang.
              </div>
              {lastOrderId && (
                <div className="mt-3 text-emerald-200 text-sm">
                  Order ID: {lastOrderId}
                </div>
              )}
              {cancelMsg && (
                <div className="mt-3 text-sm text-white/80">
                  {cancelMsg}
                </div>
              )}
              {issueMsg && (
                <div className="mt-3 text-sm text-white/80">
                  {issueMsg}
                </div>
              )}
              {voidMsg && (
                <div className="mt-3 text-sm text-white/80">
                  {voidMsg}
                </div>
              )}

              <div className="mt-4 rounded-2xl bg-white/10 p-4">
                <div className="text-white/70 text-xs">Narx</div>
                <div className="text-2xl font-extrabold text-[#F4D7E3]">3 887 401 UZS</div>
                <div className="mt-2 text-xs text-white/60">
                  To'lov:{" "}
                  <span className="text-white/85 font-semibold">
                    {paymentMethod ? paymentMethod.toUpperCase() : "tanlanmagan"}
                  </span>
                </div>
              </div>
              {bookError && (
                <div className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-red-100 text-sm">
                  {bookError}
                </div>
              )}
              {lastOrderId && (
                <div className="mt-3 text-emerald-200 text-sm">
                  Order ID: {lastOrderId}
                </div>
              )}

              <label className="mt-4 flex items-start gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={agreeData}
                  onChange={(e) => setAgreeData(e.target.checked)}
                  className="mt-0.5"
                />
                Yuqoridagi ma'lumotlar to'g'ri ekanligini tasdiqlayman
              </label>
              <label className="mt-2 flex items-start gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  className="mt-0.5"
                />
                Men tanishdim va tarifning qoidalari va shartlariga roziman
              </label>

              <button
                onClick={onBook}
                disabled={!canCheckout || bookLoading}
                className="
                  mt-4 h-12 w-full rounded-2xl
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
                onClick={onCancelService}
                disabled={!lastOrderId || cancelLoading}
                className="
                  mt-3 h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {cancelLoading ? "Cancel..." : "Cancel PNR"}
              </button>
              <button
                onClick={onIssueOrder}
                disabled={!lastOrderId || issueLoading}
                className="
                  mt-3 h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {issueLoading ? "Issue..." : "Issue PNR"}
              </button>
              <button
                onClick={onVoidService}
                disabled={!lastOrderId || voidLoading}
                className="
                  mt-3 h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {voidLoading ? "VOID..." : "VOID PNR"}
              </button>
              <button
                onClick={() => setStep(2)}
                className="mt-3 h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition"
              >
                Orqaga
              </button>

              <div className="mt-4 rounded-2xl border border-white/12 bg-white/6 p-4">
                <div className="text-white font-semibold">Order details</div>
                <div className="mt-2 text-xs text-white/65">GET /orders/{`{id}`}</div>
                <button
                  onClick={onGetOrder}
                  disabled={orderLoading || !(lastOrderId || cart.lastOrderId)}
                  className="mt-3 h-10 w-full rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 transition disabled:opacity-60"
                >
                  {orderLoading ? "..." : "Get Order by ID"}
                </button>
                {orderMsg && <div className="mt-2 text-xs text-white/80">{orderMsg}</div>}
                {orderData && (
                  <div className="mt-2 text-xs text-white/80 space-y-1">
                    <div>ID: {orderData.id ?? "—"}</div>
                    <div>Status: {orderData.status ?? "—"}</div>
                    <div>
                      Narx: {orderData.price ?? "—"} {orderData.currency ?? ""}
                    </div>
                    <div>Client: {orderData.client ?? "—"}</div>
                    <div>Service: {orderData.serviceType ?? "—"}</div>
                    <div>Reservation (PNR): {orderData.reservationId ?? "—"}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/12 bg-white/6 p-4">
                <div className="text-white font-semibold">PNR tekshirish</div>
                <div className="mt-2 text-xs text-white/65">
                  `GET /air/get-pnr?locator=ABC123`
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={pnrLocator}
                    onChange={(e) => setPnrLocator(e.target.value.toUpperCase())}
                    placeholder="PNR locator (ABC123)"
                    className="h-10 flex-1 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:border-white/25"
                  />
                  <button
                    onClick={onGetPnr}
                    disabled={pnrLoading}
                    className="h-10 px-3 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 transition disabled:opacity-60"
                  >
                    {pnrLoading ? "..." : "Get PNR"}
                  </button>
                </div>
                {pnrMsg && <div className="mt-2 text-xs text-white/80">{pnrMsg}</div>}
                {pnrData && (
                  <div className="mt-3 text-xs text-white/80 space-y-2">
                    <div>Narx: {pnrData.price ?? "—"}</div>
                    <div>Segments: {pnrData.segments?.length ?? 0}</div>
                    {pnrData.segments?.slice(0, 2).map((s, i) => (
                      <div key={i} className="rounded-lg border border-white/12 bg-white/6 p-2">
                        {(s.origin || "—") + " → " + (s.destination || "—")} · {(s.carrier || "—")}
                        {(s.flightNumber && `-${s.flightNumber}`) || ""}
                        <div className="text-white/65 mt-1">
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
        )}

        {open && (
          <div className="fixed inset-0 z-[80] bg-black/55 grid place-items-center p-4">
            <div
              className="
                w-full max-w-[720px]
                rounded-[28px]
                border border-white/18
                bg-white/10
                backdrop-blur-2xl
                shadow-[0_45px_140px_rgba(0,0,0,0.65)]
                p-5
              "
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-extrabold text-white">
                  {draft.id ? "Yo'lovchini tahrirlash" : "Yo'lovchi qo'shish"}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-10 w-10 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition text-white"
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
                className="
                  mt-4 h-12 w-full rounded-2xl
                  bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                  text-white font-semibold transition
                  shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                  hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
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
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2">
      <Icon size={14} className="text-white/70" />
      <div className="text-xs text-white/60">{label}:</div>
      <div className="text-sm font-semibold text-white/90">{value}</div>
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
        ${active ? "border-white/30 bg-white/15" : "border-white/10 bg-white/6"}
        p-4 shadow-[0_18px_40px_rgba(0,0,0,0.25)]
        ${onClick ? "cursor-pointer hover:bg-white/10 transition" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            h-11 w-11 rounded-2xl grid place-items-center
            ${done ? "bg-[#1C96C8]/25 text-[#CFEFFF]" : "bg-white/10 text-white"}
          `}
        >
          <Icon size={18} />
        </div>
        <div>
          <div className="text-white font-semibold">{title}</div>
          <div className="text-white/65 text-xs">{desc}</div>
        </div>
      </div>
    </button>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <div className="text-white/60 text-xs">{label}</div>
      <div className="mt-1 text-white font-semibold">{value}</div>
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
      <div className="text-white/60 text-xs mb-2">{label}</div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
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
            bg-white/5 border border-white/10
            ${Icon ? "pl-10 pr-4" : "px-4"}
            outline-none
            focus:border-white/25 focus:bg-white/10
            transition text-white
          `}
        />
      </div>
    </label>
  )
}
