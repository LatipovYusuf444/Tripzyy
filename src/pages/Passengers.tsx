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
import { useI18n } from "@/shared/i18n/i18n"

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
  `${btnBase} border-[#dbe3ef] bg-white/90 text-[#1d2430] shadow-[0_12px_30px_rgba(17,24,39,0.08)] hover:bg-white lg:dark:border-[#30476f] lg:dark:bg-[rgba(20,35,66,0.84)] lg:dark:text-white lg:dark:shadow-[0_14px_28px_rgba(4,10,28,0.28)] lg:dark:hover:bg-[rgba(28,46,84,0.94)]`
const dangerButtonClass =
  `${btnBase} border-[#f0d8d9] bg-[linear-gradient(135deg,#fff7f7_0%,#fff0f1_100%)] text-[#9e4e5b] shadow-[0_12px_28px_rgba(158,78,91,0.10)] hover:bg-[#fff6f7] dark:border-[#5d4264] dark:bg-[linear-gradient(180deg,rgba(75,33,56,0.66)_0%,rgba(53,22,42,0.74)_100%)] dark:text-[#ffd5e0]`

export default function PassengersPage() {
  const { language } = useI18n()
  const copy = {
    uz: {
      pageTitle: "Rasmiylashtirish",
      flowDesc: "Bron tanlangan reys bo'yicha aloqa, yo'lovchi va tasdiqlash ma'lumotlarini shu sahifada yakunlaysiz.",
      flight: "Reys",
      date: "Sana",
      ticketCount: "Bilet soni",
      clearCart: "Karzinkani tozalash",
      book: "Bron ma'lumoti",
      payment: "Aloqa va to'lov",
      ticketIssue: "Rasmiylashtirish",
      step1Desc: "Tanlangan reys va tarifni tekshirish",
      step2Desc: "Bog'lanish ma'lumoti va to'lov usuli",
      step3Desc: "Yo'lovchilarni kiritish va yakunlash",
      stepHint: "* Bu sahifa bron tanlangandan keyin alohida ochiladi. Ichki bosqichlar bo'yicha xohlagan payt o'tish mumkin.",
      currentStep: "Joriy bosqich",
      stage: "bosqich",
      routeDetails: "Yo'nalish tafsilotlari",
      routeDetailsDesc: "Mahalliy jo'nash va kelish vaqtlari, terminal va reys tafsilotlari.",
      route: "Yo'nalish",
      cabin: "Kabina",
      baggage: "Bagaj",
      airline: "Aviakompaniya",
      flightNo: "Reys raqami",
      segments: "Segmentlar",
      terminal: "Terminal",
      price: "Narx",
      finalPriceServices: "Yakuniy narx va xizmatlar.",
      finalPrice: "Yakuniy narx",
      continue: "Davom etish",
      contactInfo: "Bog'lanish uchun ma'lumot",
      contactInfoDesc: "Chipta va o'zgarishlar bo'yicha xabarlar shu manzillarga yuboriladi.",
      countryCode: "Country code",
      email: "Elektron pochta",
      emailRepeat: "Elektron pochta (re-)",
      phone: "Telefon",
      continueBlock: "Davom etish",
      continueBlockDesc: "Ma'lumotlar to'liq bo'lsa, 3-bosqichga o'ting.",
      paymentMethod: "To'lov usuli",
      paymentMethodDesc: "To'lov usulini tanlang va bronni davom ettiring.",
      selectedPayment: "Tanlangan to'lov",
      unselected: "tanlanmagan",
      gatewayNotice: "Payment gateway hali backend bilan ulanmagan. Bu tanlov saqlanadi, lekin avtomatik to'lov oynasi ochilmaydi.",
      goStep3: "3-bosqichga o'tish",
      back: "Orqaga",
      passengerEntry: "Yo'lovchilarga kirish",
      passengerEntryDesc: "Har bir yo'lovchi uchun pasport va shaxsiy ma'lumotlar.",
      addPassenger: "Yo'lovchi qo'shish",
      noPassengers: "Hozircha yo'lovchi yo'q. \"Yo'lovchi qo'shish\" ni bosing.",
      paxHint: "* Pax:",
      paxHintSuffix: "ta. Checkoutdan keyin yo'lovchilar shu yerga tushadi.",
      confirmation: "Tasdiqlash",
      confirmationDesc: "Ma'lumotlarni tekshiring va rasmiylashtirishni yakunlang.",
      passenger: "Yo'lovchi",
      paymentShort: "To'lov",
      paymentApiNotice: "Hozirgi holat: booking API ishlaydi, lekin payment redirect yoki transaction callback frontendga ulanmagan.",
      checkoutTerms: "Tasdiqlash shartlari",
      confirmData: "Yuqoridagi ma'lumotlar to'g'ri ekanligini tasdiqlayman",
      agreeRules: "Men tanishdim va tarifning qoidalari va shartlariga roziman",
      checkout: "Rasmiylashtirish",
      issuePnr: "Issue PNR",
      cancelPnr: "Cancel PNR",
      voidPnr: "VOID PNR",
      orderDetails: "Order details",
      getOrderById: "Get Order by ID",
      status: "Status",
      client: "Client",
      service: "Service",
      reservation: "Reservation (PNR)",
      pnrCheck: "PNR tekshirish",
      pnrPlaceholder: "PNR locator (ABC123)",
      getPnr: "Get PNR",
      passengersCount: "Passengers",
      editPassenger: "Yo'lovchini tahrirlash",
      savePassenger: "Saqlash",
      firstName: "Ism",
      lastName: "Familiya",
      birthDate: "Tug'ilgan sana",
      gender: "Gender",
      citizenship: "Fuqarolik",
      passportNo: "Pasport seriya / raqam",
      passportIssued: "Pasport berilgan sana",
      passportExpiry: "Pasport amal qilish muddati",
      delete: "O'chirish",
      edit: "Tahrirlash",
      optionMissing: "Option ID topilmadi. Qidiruvni qayta bajaring.",
      incompleteData: "Ma'lumotlar to'liq emas.",
      bookingError: "Booking xato",
      orderMissing: "Order ID topilmadi.",
      cancelDone: "Cancel bajarildi",
      cancelError: "Cancel xato",
      issueDone: "Issue bajarildi",
      issueError: "Issue xato",
      voidDone: "VOID bajarildi",
      voidError: "VOID xato",
      locatorPrompt: "Locator kiriting. Masalan: ABC123",
      pnrNotFound: "PNR topilmadi",
      requestError: "PNR so'rovi xato",
      orderNotFound: "Order topilmadi",
      orderRequestError: "Order so'rovi xato",
      success: "Success",
    },
    ru: {
      pageTitle: "Оформление",
      flowDesc: "На этой отдельной странице вы завершаете контактные данные, пассажиров и подтверждение по выбранному бронированию.",
      flight: "Рейс",
      date: "Дата",
      ticketCount: "Количество билетов",
      clearCart: "Очистить корзину",
      book: "Данные брони",
      payment: "Контакты и оплата",
      ticketIssue: "Оформление",
      step1Desc: "Проверка выбранного рейса и тарифа",
      step2Desc: "Контактные данные и способ оплаты",
      step3Desc: "Данные пассажиров и завершение",
      stepHint: "* Эта страница открывается отдельно после выбора брони. Между внутренними этапами можно переключаться свободно.",
      currentStep: "Текущий этап",
      stage: "этап",
      routeDetails: "Детали маршрута",
      routeDetailsDesc: "Местное время вылета и прилета, терминалы и детали рейса.",
      route: "Маршрут",
      cabin: "Класс",
      baggage: "Багаж",
      airline: "Авиакомпания",
      flightNo: "Номер рейса",
      segments: "Сегменты",
      terminal: "Терминал",
      price: "Цена",
      finalPriceServices: "Итоговая цена и услуги.",
      finalPrice: "Итоговая цена",
      continue: "Продолжить",
      contactInfo: "Контактные данные",
      contactInfoDesc: "Уведомления о билете и изменениях будут отправляться сюда.",
      countryCode: "Country code",
      email: "Электронная почта",
      emailRepeat: "Электронная почта (повтор)",
      phone: "Телефон",
      continueBlock: "Продолжение",
      continueBlockDesc: "Если данные заполнены, переходите на 3-й этап.",
      paymentMethod: "Способ оплаты",
      paymentMethodDesc: "Выберите способ оплаты и продолжите бронирование.",
      selectedPayment: "Выбранная оплата",
      unselected: "не выбрано",
      gatewayNotice: "Payment gateway еще не подключен к backend. Выбор сохраняется, но автоматическое окно оплаты не откроется.",
      goStep3: "Перейти к этапу 3",
      back: "Назад",
      passengerEntry: "Данные пассажиров",
      passengerEntryDesc: "Паспортные и личные данные для каждого пассажира.",
      addPassenger: "Добавить пассажира",
      noPassengers: "Пассажиров пока нет. Нажмите «Добавить пассажира».",
      paxHint: "* Pax:",
      paxHintSuffix: ". После checkout пассажиры появятся здесь.",
      confirmation: "Подтверждение",
      confirmationDesc: "Проверьте данные и завершите оформление.",
      passenger: "Пассажир",
      paymentShort: "Оплата",
      paymentApiNotice: "Текущее состояние: booking API работает, но payment redirect или transaction callback не подключены к frontend.",
      checkoutTerms: "Условия подтверждения",
      confirmData: "Подтверждаю, что указанные выше данные верны",
      agreeRules: "Я ознакомился и согласен с правилами и условиями тарифа",
      checkout: "Оформить",
      issuePnr: "Issue PNR",
      cancelPnr: "Cancel PNR",
      voidPnr: "VOID PNR",
      orderDetails: "Детали заказа",
      getOrderById: "Получить заказ по ID",
      status: "Статус",
      client: "Клиент",
      service: "Сервис",
      reservation: "Бронирование (PNR)",
      pnrCheck: "Проверка PNR",
      pnrPlaceholder: "Локатор PNR (ABC123)",
      getPnr: "Получить PNR",
      passengersCount: "Пассажиры",
      editPassenger: "Редактировать пассажира",
      savePassenger: "Сохранить",
      firstName: "Имя",
      lastName: "Фамилия",
      birthDate: "Дата рождения",
      gender: "Пол",
      citizenship: "Гражданство",
      passportNo: "Серия / номер паспорта",
      passportIssued: "Дата выдачи паспорта",
      passportExpiry: "Срок действия паспорта",
      delete: "Удалить",
      edit: "Редактировать",
      optionMissing: "Option ID не найден. Выполните поиск заново.",
      incompleteData: "Данные заполнены не полностью.",
      bookingError: "Ошибка бронирования",
      orderMissing: "Order ID не найден.",
      cancelDone: "Cancel выполнен",
      cancelError: "Ошибка cancel",
      issueDone: "Issue выполнен",
      issueError: "Ошибка issue",
      voidDone: "VOID выполнен",
      voidError: "Ошибка VOID",
      locatorPrompt: "Введите locator. Например: ABC123",
      pnrNotFound: "PNR не найден",
      requestError: "Ошибка запроса PNR",
      orderNotFound: "Order не найден",
      orderRequestError: "Ошибка запроса Order",
      success: "Успешно",
    },
    en: {
      pageTitle: "Checkout",
      flowDesc: "This separate page is where you complete the contact, passenger, and confirmation details for the selected booking.",
      flight: "Flight",
      date: "Date",
      ticketCount: "Ticket count",
      clearCart: "Clear cart",
      book: "Booking details",
      payment: "Contact and payment",
      ticketIssue: "Checkout",
      step1Desc: "Review the selected flight and fare",
      step2Desc: "Contact details and payment method",
      step3Desc: "Passenger details and final confirmation",
      stepHint: "* This page opens separately after booking selection. You can switch between the internal steps at any time.",
      currentStep: "Current step",
      stage: "step",
      routeDetails: "Route details",
      routeDetailsDesc: "Local departure and arrival times, terminals, and flight details.",
      route: "Route",
      cabin: "Cabin",
      baggage: "Baggage",
      airline: "Airline",
      flightNo: "Flight number",
      segments: "Segments",
      terminal: "Terminal",
      price: "Price",
      finalPriceServices: "Final price and services.",
      finalPrice: "Final price",
      continue: "Continue",
      contactInfo: "Contact information",
      contactInfoDesc: "Ticket and change notifications will be sent to these contacts.",
      countryCode: "Country code",
      email: "Email",
      emailRepeat: "Email (repeat)",
      phone: "Phone",
      continueBlock: "Continue",
      continueBlockDesc: "If the data is complete, go to step 3.",
      paymentMethod: "Payment method",
      paymentMethodDesc: "Choose a payment method and continue the booking.",
      selectedPayment: "Selected payment",
      unselected: "not selected",
      gatewayNotice: "The payment gateway is not connected to the backend yet. The selection is saved, but no automatic payment window will open.",
      goStep3: "Go to step 3",
      back: "Back",
      passengerEntry: "Passenger entry",
      passengerEntryDesc: "Passport and personal details for each passenger.",
      addPassenger: "Add passenger",
      noPassengers: "No passengers yet. Click “Add passenger”.",
      paxHint: "* Pax:",
      paxHintSuffix: ". After checkout, passengers will appear here.",
      confirmation: "Confirmation",
      confirmationDesc: "Review the information and complete checkout.",
      passenger: "Passenger",
      paymentShort: "Payment",
      paymentApiNotice: "Current status: booking API works, but payment redirect or transaction callback is not connected to the frontend.",
      checkoutTerms: "Confirmation terms",
      confirmData: "I confirm that the information above is correct",
      agreeRules: "I have read and agree to the fare rules and conditions",
      checkout: "Checkout",
      issuePnr: "Issue PNR",
      cancelPnr: "Cancel PNR",
      voidPnr: "VOID PNR",
      orderDetails: "Order details",
      getOrderById: "Get Order by ID",
      status: "Status",
      client: "Client",
      service: "Service",
      reservation: "Reservation (PNR)",
      pnrCheck: "PNR check",
      pnrPlaceholder: "PNR locator (ABC123)",
      getPnr: "Get PNR",
      passengersCount: "Passengers",
      editPassenger: "Edit passenger",
      savePassenger: "Save",
      firstName: "First name",
      lastName: "Last name",
      birthDate: "Birth date",
      gender: "Gender",
      citizenship: "Citizenship",
      passportNo: "Passport series / number",
      passportIssued: "Passport issue date",
      passportExpiry: "Passport expiry date",
      delete: "Delete",
      edit: "Edit",
      optionMissing: "Option ID was not found. Please search again.",
      incompleteData: "The data is incomplete.",
      bookingError: "Booking error",
      orderMissing: "Order ID was not found.",
      cancelDone: "Cancel completed",
      cancelError: "Cancel error",
      issueDone: "Issue completed",
      issueError: "Issue error",
      voidDone: "VOID completed",
      voidError: "VOID error",
      locatorPrompt: "Enter a locator. Example: ABC123",
      pnrNotFound: "PNR was not found",
      requestError: "PNR request error",
      orderNotFound: "Order was not found",
      orderRequestError: "Order request error",
      success: "Success",
    },
  }[language]
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
    return `${copy.pageTitle}${r}${d}`
  }, [cart.route, cart.date, copy.pageTitle])

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
      setBookError(copy.optionMissing)
      return
    }
    if (!canCheckout) {
      setBookError(copy.incompleteData)
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
        setBookError(res.data.message || copy.bookingError)
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
      setBookError(err?.response?.data?.message || copy.bookingError)
    } finally {
      setBookLoading(false)
    }
  }

  const onCancelService = async () => {
    if (!lastOrderId) {
      setCancelMsg(copy.orderMissing)
      return
    }
    setCancelLoading(true)
    setCancelMsg(null)
    try {
      const res = await cancelOrderService(lastOrderId)
      setCancelMsg(res.data.message || copy.cancelDone)
    } catch (err: any) {
      setCancelMsg(err?.response?.data?.message || copy.cancelError)
    } finally {
      setCancelLoading(false)
    }
  }

  const onIssueOrder = async () => {
    if (!lastOrderId) {
      setIssueMsg(copy.orderMissing)
      return
    }
    setIssueLoading(true)
    setIssueMsg(null)
    try {
      const res = await issueOrder(lastOrderId)
      setIssueMsg(res.data.message || copy.issueDone)
    } catch (err: any) {
      setIssueMsg(err?.response?.data?.message || copy.issueError)
    } finally {
      setIssueLoading(false)
    }
  }

  const onVoidService = async () => {
    if (!lastOrderId) {
      setVoidMsg(copy.orderMissing)
      return
    }
    setVoidLoading(true)
    setVoidMsg(null)
    try {
      const res = await voidOrderService(lastOrderId)
      setVoidMsg(res.data.message || copy.voidDone)
    } catch (err: any) {
      setVoidMsg(err?.response?.data?.message || copy.voidError)
    } finally {
      setVoidLoading(false)
    }
  }

  const onGetPnr = async () => {
    const locator = pnrLocator.trim().toUpperCase()
    if (!locator) {
      setPnrMsg(copy.locatorPrompt)
      return
    }
    setPnrLoading(true)
    setPnrMsg(null)
    setPnrData(null)
    try {
      const res = await getAirPnrDetails(locator)
      if (res.data.status !== "success") {
        setPnrMsg(res.data.message || copy.pnrNotFound)
        return
      }
      setPnrData(res.data.data ?? null)
      setPnrMsg(res.data.message || copy.success)
    } catch (err: any) {
      setPnrMsg(err?.response?.data?.message || copy.requestError)
    } finally {
      setPnrLoading(false)
    }
  }

  const onGetOrder = async () => {
    const id = lastOrderId ?? cart.lastOrderId
    if (!id) {
      setOrderMsg(copy.orderMissing)
      return
    }
    setOrderLoading(true)
    setOrderMsg(null)
    setOrderData(null)
    try {
      const res = await getOrderById(id)
      if (res.data.status !== "success") {
        setOrderMsg(res.data.message || copy.orderNotFound)
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
      setOrderMsg(res.data.message || copy.success)
    } catch (err: any) {
      setOrderMsg(err?.response?.data?.message || copy.orderRequestError)
    } finally {
      setOrderLoading(false)
    }
  }
  return (
    <section className="checkout-mobile-light secondary-page-shell relative min-h-screen overflow-hidden bg-[#EEF1FB] pt-6 text-[#111A34] dark:bg-[#EEF1FB] dark:text-[#111A34] lg:dark:bg-transparent lg:dark:text-white">
      <div className="secondary-page-overlay pointer-events-none absolute inset-0" />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-[1500px] px-4 py-10 sm:px-6 xl:px-8 2xl:max-w-[1680px]"
      >
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1d2430] dark:text-white">{title}</h1>
            <p className="mt-2 text-[#627188] text-sm dark:text-[#d2e0f8]">
              {copy.flowDesc}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill icon={Ticket} label={copy.flight} value={cart.route ?? "—"} />
              <Pill icon={CalendarDays} label={copy.date} value={cart.date ?? "—"} />
              <Pill icon={Users2} label={copy.ticketCount} value={String(pax)} />
            </div>
          </div>

          <button
            onClick={onClearCart}
            className={`h-11 px-4 ${secondaryButtonClass}`}
            title={copy.clearCart}
          >
            {copy.clearCart}
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
          <span className="rounded-full border border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] px-3 py-1 text-[#234174] dark:border-[#4d6fa8] dark:bg-[linear-gradient(180deg,rgba(35,60,110,0.9)_0%,rgba(26,47,87,0.92)_100%)] dark:text-white">
            1. {copy.book}
          </span>
          <span className="text-[#9ba8ba] dark:text-[#8ea5cb]">→</span>
          <span className="rounded-full border border-[#dbe3ef] bg-white px-3 py-1 text-[#627188] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
            2. {copy.ticketIssue}
          </span>
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
              title={copy.book}
              desc={copy.step1Desc}
              onClick={() => setStep(1)}
            />
            <StepCard
              active={step === 2}
              done={step > 2}
              icon={CreditCard}
              title={copy.payment}
              desc={copy.step2Desc}
              onClick={() => setStep(2)}
            />
            <StepCard
              active={step === 3}
              done={step > 3}
              icon={BadgeCheck}
              title={copy.ticketIssue}
              desc={copy.step3Desc}
              onClick={() => setStep(3)}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-4 text-xs text-[#718198] dark:text-[#a9bddb]">
          {copy.stepHint}
        </motion.div>
        <motion.div variants={fadeUp} className="mt-3 flex items-center gap-2 text-xs text-[#627188] dark:text-[#d2e0f8]">
          <span>{copy.currentStep}:</span>
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
                {s}-{copy.stage}
              </button>
            ))}
          </div>
        </motion.div>

        {step === 1 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className={`lg:col-span-2 rounded-[28px] p-6 ${lightPanel}`}>
              <div className="text-lg font-extrabold dark:text-white">{copy.routeDetails}</div>
              <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                {copy.routeDetailsDesc}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label={copy.route} value={cart.route ?? "TAS → DXB"} />
                <InfoCard label={copy.date} value={cart.date ?? "2026-03-17"} />
                <InfoCard label={copy.cabin} value={cart.cabin ?? "—"} />
                <InfoCard
                  label={copy.baggage}
                  value={
                    [cart.baggage, cart.carryOn ? `carry-on ${cart.carryOn}` : ""]
                      .filter(Boolean)
                      .join(" · ") || "—"
                  }
                />
              </div>
              {cart.airline || cart.flightNo ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard label={copy.airline} value={cart.airline ?? "—"} />
                  <InfoCard label={copy.flightNo} value={cart.flightNo ?? "—"} />
                </div>
              ) : null}

              {cart.segments?.length ? (
                <div className="mt-4 rounded-2xl border border-[#dde5f0] bg-white/80 p-4">
                  <div className="text-sm font-semibold text-[#1d2430]">{copy.segments}</div>
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
                          <div>{copy.terminal}: {segment.departureTerminal || "—"} / {segment.arrivalTerminal || "—"}</div>
                          <div>{copy.baggage}: {segment.baggage || "—"}</div>
                          <div>Carry-on: {segment.carryOn || "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`rounded-[28px] p-6 ${lightPanel}`}>
              <div className="text-lg font-extrabold">{copy.price}</div>
              <div className="mt-2 text-[#627188] text-sm">{copy.finalPriceServices}</div>
              <div className="mt-5 rounded-2xl border border-[#f0d8cf] bg-[linear-gradient(135deg,#fff8f3_0%,#fff1f5_100%)] p-4 dark:border-[#4a3f5f] dark:bg-[linear-gradient(135deg,rgba(46,36,69,0.96)_0%,rgba(33,23,52,0.94)_100%)]">
                <div className="text-[#8d6d70] text-xs dark:text-[#d6bfd0]">{copy.finalPrice}</div>
                <div className="text-2xl font-extrabold text-[#b4586f] dark:text-[#ffd7e4]">
                  {formatMoney(cart.amount ?? 0, cart.currency || "UZS")}
                </div>
                <div className="mt-1 text-[#8d6d70] text-xs dark:text-[#d6bfd0]">Pax: {pax}</div>
              </div>
              <button
                onClick={() => setStep(2)}
                className={`mt-5 h-12 w-full ${primaryButtonClass}`}
              >
                {copy.continue}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className={`lg:col-span-2 rounded-[28px] p-6 ${lightPanel}`}>
              <div className="text-lg font-extrabold">{copy.contactInfo}</div>
              <div className="mt-2 text-[#627188] text-sm">
                {copy.contactInfoDesc}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label={copy.countryCode}
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
                  label={copy.email}
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
                  label={copy.emailRepeat}
                  icon={Mail}
                  value={confirmEmail}
                  onChange={(v) => setConfirmEmail(v)}
                  placeholder="name@example.com"
                />
                <Field
                  label={copy.phone}
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
              <div className="text-lg font-extrabold">{copy.continueBlock}</div>
              <div className="mt-2 text-[#627188] text-sm">
                {copy.continueBlockDesc}
              </div>
                <div className="mt-4 rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)]">
                  <div className="text-[#1d2430] font-semibold dark:text-white">{copy.paymentMethod}</div>
                  <div className="mt-2 text-[#627188] text-sm dark:text-[#a9bddb]">
                    {copy.paymentMethodDesc}
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
                  {copy.selectedPayment}:{" "}
                  <span className="text-[#1d2430] font-semibold dark:text-white">
                    {paymentMethod ? paymentMethod.toUpperCase() : copy.unselected}
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-[#6d5a2f] dark:bg-[rgba(82,63,23,0.45)] dark:text-[#ffe39c]">
                  {copy.gatewayNotice}
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={!canContinueStep2}
                className={`mt-5 h-12 w-full ${primaryButtonClass}`}
              >
                {copy.goStep3}
              </button>
              <button
                onClick={() => setStep(1)}
                className={`mt-3 h-11 w-full ${secondaryButtonClass}`}
              >
                {copy.back}
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
                    <div className="text-lg font-extrabold">{copy.passengerEntry}</div>
                    <div className="mt-1 text-[#627188] text-sm">
                      {copy.passengerEntryDesc}
                    </div>
                  </div>
                  <button
                    onClick={onAdd}
                    className={`h-11 min-w-[190px] gap-2 px-4 sm:ml-auto ${primaryButtonClass}`}
                  >
                    {copy.addPassenger} <Plus size={16} />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)]">
                  <div className="overflow-auto">
                    <table className="w-full min-w-[880px]">
                      <thead>
                        <tr className="text-left text-[#718198] text-sm">
                          <th className="px-3 py-3">#</th>
                          <th className="px-3 py-3">{copy.firstName}</th>
                          <th className="px-3 py-3">{copy.lastName}</th>
                          <th className="px-3 py-3">{copy.birthDate}</th>
                          <th className="px-3 py-3">{copy.citizenship}</th>
                          <th className="px-3 py-3">{copy.passportNo}</th>
                          <th className="px-3 py-3">{copy.passportExpiry}</th>
                          <th className="px-3 py-3">{copy.edit}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {cart.passengers.length === 0 ? (
                          <tr>
                            <td className="px-3 py-6 text-[#627188] dark:text-[#a9bddb]" colSpan={8}>
                              {copy.noPassengers}
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
                                    title={copy.edit}
                                  >
                                    <Pencil size={16} className="text-[#1C96C8]" />
                                  </button>

                                  <button
                                    onClick={() => onDelete(p.id)}
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#f0d8d9] bg-white transition hover:bg-[#fff5f6] dark:border-[#66415f] dark:bg-[rgba(45,27,50,0.82)] dark:hover:bg-[rgba(62,32,70,0.94)]"
                                    title={copy.delete}
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

                </div>
              </div>
            </div>

            <div className={`rounded-[28px] p-6 lg:sticky lg:top-28 ${lightPanel}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold">{copy.confirmation}</div>
                  <div className="mt-2 text-[#627188] text-sm">
                    {copy.confirmationDesc}
                  </div>
                </div>
                <div className="rounded-full border border-[#dbe3ef] bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#627188]">
                  3-bosqich
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label={copy.passenger} value={`${cart.passengers.length}/${pax}`} />
                <MiniStat
                  label={copy.paymentShort}
                  value={paymentMethod ? paymentMethod.toUpperCase() : copy.unselected}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-[#6d5a2f] dark:bg-[rgba(82,63,23,0.45)] dark:text-[#ffe39c]">
                {copy.paymentApiNotice}
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
                    <div className="text-xs uppercase tracking-[0.14em] text-[#8d6d70] dark:text-[#d6bfd0]">{copy.price}</div>
                    <div className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#b4586f] dark:text-[#ffd7e4]">
                      {formatMoney(cart.amount ?? 0, cart.currency || "UZS")}
                    </div>
                  </div>
                  <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#8d6d70] dark:bg-white/10 dark:text-[#f2d9e7]">
                    Pax: {pax}
                  </div>
                </div>
                <div className="mt-3 text-xs text-[#8d6d70] dark:text-[#d6bfd0]">
                  {copy.selectedPayment}:{" "}
                  <span className="font-semibold text-[#1d2430] dark:text-white">
                    {paymentMethod ? paymentMethod.toUpperCase() : copy.unselected}
                  </span>
                </div>
              </div>

              {bookError ? (
                <div className="mt-3 rounded-2xl border border-[#f1d9d9] bg-[#fff7f7] p-3 text-sm text-[#9e4e5b]">
                  {bookError}
                </div>
              ) : null}

              <div className="mt-4 rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
                <div className="text-sm font-semibold text-[#1d2430]">{copy.checkoutTerms}</div>
                <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#627188]">
                  <input
                    type="checkbox"
                    checked={agreeData}
                    onChange={(e) => setAgreeData(e.target.checked)}
                    className="mt-0.5"
                  />
                  {copy.confirmData}
                </label>
                <label className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#627188]">
                  <input
                    type="checkbox"
                    checked={agreeRules}
                    onChange={(e) => setAgreeRules(e.target.checked)}
                    className="mt-0.5"
                  />
                  {copy.agreeRules}
                </label>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={onBook}
                  disabled={!canCheckout || bookLoading}
                  className={`h-12 w-full ${primaryButtonClass}`}
                >
                  {bookLoading ? "..." : copy.checkout}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onIssueOrder}
                    disabled={!lastOrderId || issueLoading}
                    className={`h-11 w-full ${secondaryButtonClass}`}
                  >
                    {issueLoading ? "Issue..." : copy.issuePnr}
                  </button>
                  <button
                    onClick={onCancelService}
                    disabled={!lastOrderId || cancelLoading}
                    className={`h-11 w-full ${dangerButtonClass}`}
                  >
                    {cancelLoading ? "Cancel..." : copy.cancelPnr}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onVoidService}
                    disabled={!lastOrderId || voidLoading}
                    className={`h-11 w-full ${dangerButtonClass}`}
                  >
                    {voidLoading ? "VOID..." : copy.voidPnr}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className={`h-11 w-full ${secondaryButtonClass}`}
                  >
                    {copy.back}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4 border-t border-[#e7edf5] pt-5">
                <div className="rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
                  <div className="text-[#1d2430] font-semibold dark:text-white">{copy.orderDetails}</div>
                  <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">GET /orders/{`{id}`}</div>
                  <button
                    onClick={onGetOrder}
                    disabled={orderLoading || !(lastOrderId || cart.lastOrderId)}
                    className={`mt-3 h-10 w-full rounded-xl ${secondaryButtonClass}`}
                  >
                    {orderLoading ? "..." : copy.getOrderById}
                  </button>
                  {orderMsg && <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">{orderMsg}</div>}
                  {orderData && (
                    <div className="mt-2 space-y-1 text-xs text-[#627188] dark:text-[#a9bddb]">
                      <div>ID: {orderData.id ?? "—"}</div>
                      <div>{copy.status}: {orderData.status ?? "—"}</div>
                      <div>{copy.price}: {formatMoney(orderData.price ?? 0, orderData.currency)}</div>
                      <div>{copy.client}: {orderData.client ?? "—"}</div>
                      <div>{copy.service}: {orderData.serviceType ?? "—"}</div>
                      <div>{copy.reservation}: {orderData.reservationId ?? "—"}</div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
                  <div className="text-[#1d2430] font-semibold dark:text-white">{copy.pnrCheck}</div>
                  <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">
                    `GET /air/get-pnr?locator=ABC123`
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={pnrLocator}
                      onChange={(e) => setPnrLocator(e.target.value.toUpperCase())}
                      placeholder={copy.pnrPlaceholder}
                      className="h-10 flex-1 rounded-xl border border-[#dbe3ef] bg-white px-3 outline-none focus:border-[#c7d4e7]"
                    />
                    <button
                      onClick={onGetPnr}
                      disabled={pnrLoading}
                      className={`h-10 px-3 rounded-xl ${secondaryButtonClass}`}
                    >
                      {pnrLoading ? "..." : copy.getPnr}
                    </button>
                  </div>
                  {pnrMsg && <div className="mt-2 text-xs text-[#627188] dark:text-[#a9bddb]">{pnrMsg}</div>}
                  {pnrData && (
                    <div className="mt-3 space-y-2 text-xs text-[#627188] dark:text-[#a9bddb]">
                      <div>{copy.price}: {formatMoney(pnrData.price ?? 0, cart.currency || "UZS")}</div>
                      <div>{copy.segments}: {pnrData.segments?.length ?? 0}</div>
                      {pnrData.segments?.slice(0, 2).map((s, i) => (
                        <div key={i} className="rounded-lg border border-[#dde5f0] bg-white p-2">
                          {(s.origin || "—") + " → " + (s.destination || "—")} · {(s.carrier || "—")}
                          {(s.flightNumber && `-${s.flightNumber}`) || ""}
                          <div className="mt-1 text-[#718198]">
                            {s.departure || "—"} → {s.arrival || "—"} · Bagaj: {s.baggage || "—"}
                          </div>
                        </div>
                      ))}
                      <div>{copy.passengersCount}: {pnrData.passengers?.length ?? 0}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-[80] grid items-start overflow-y-auto bg-[rgba(15,23,42,0.45)] p-3 py-5 backdrop-blur-sm sm:p-4 md:place-items-center">
            <div
              className="
                w-full max-w-[560px]
                rounded-[24px]
                border border-white/80
                bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.94)_100%)]
                backdrop-blur-2xl
                shadow-[0_45px_140px_rgba(17,24,39,0.22)]
                p-4 sm:p-5
                dark:border-[#35507f]
                dark:bg-[linear-gradient(180deg,rgba(10,22,44,0.98)_0%,rgba(14,28,54,0.96)_100%)]
                dark:shadow-[0_45px_140px_rgba(2,8,24,0.65)]
              "
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-extrabold text-[#1d2430] dark:text-white">
                  {draft.id ? copy.editPassenger : copy.addPassenger}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-xl border border-[#dbe3ef] bg-white text-[#1d2430] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:hover:bg-[rgba(24,43,80,0.92)]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Field
                  label={copy.firstName}
                  value={draft.firstName}
                  onChange={(v) => setDraft((p) => ({ ...p, firstName: v }))}
                  placeholder={copy.firstName}
                />
                <Field
                  label={copy.lastName}
                  value={draft.lastName}
                  onChange={(v) => setDraft((p) => ({ ...p, lastName: v }))}
                  placeholder={copy.lastName}
                />
                <Field
                  label={copy.birthDate}
                  type="date"
                  value={draft.birthDate}
                  onChange={(v) => setDraft((p) => ({ ...p, birthDate: v }))}
                />
                <Field
                  label={copy.gender}
                  value={draft.gender ?? "M"}
                  onChange={(v) =>
                    setDraft((p) => ({ ...p, gender: (v.toUpperCase() === "F" ? "F" : "M") }))
                  }
                  placeholder="M / F"
                />
                <Field
                  label={copy.citizenship}
                  value={draft.citizenship}
                  onChange={(v) => setDraft((p) => ({ ...p, citizenship: v }))}
                  placeholder="O'zbekiston"
                />
                <Field
                  label={copy.countryCode}
                  value={draft.countryCode ?? "UZ"}
                  onChange={(v) => setDraft((p) => ({ ...p, countryCode: v.toUpperCase() }))}
                  placeholder="UZ"
                />
                <Field
                  label={copy.passportNo}
                  value={draft.passportNo}
                  onChange={(v) => setDraft((p) => ({ ...p, passportNo: v.toUpperCase() }))}
                  placeholder="AA1234567"
                />
                <Field
                  label={copy.passportIssued}
                  type="date"
                  value={draft.passportIssued ?? ""}
                  onChange={(v) => setDraft((p) => ({ ...p, passportIssued: v }))}
                />
                <Field
                  label={copy.passportExpiry}
                  type="date"
                  value={draft.passportExpiry}
                  onChange={(v) => setDraft((p) => ({ ...p, passportExpiry: v }))}
                />
              </div>

              <button
                onClick={onSave}
                disabled={!canSave}
                className={`mt-3 h-11 w-full ${primaryButtonClass}`}
              >
                {copy.savePassenger}
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
