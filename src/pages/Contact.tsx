import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Clock, Mail, MapPin, Phone, Send, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { formatUzPhoneInput } from "@/lib/phone"
import { useI18n } from "@/shared/i18n/i18n"

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const isPhone = (value: string) => {
  const digits = value.replace(/\D/g, "")
  return digits.length === 12 && digits.startsWith("998")
}

export default function Contact() {
  const { language } = useI18n()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+998")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const validationErrors = useMemo(() => {
    const errors: string[] = []
    if (name.trim().length < 2) errors.push("Ism kamida 2 ta harf bo'lishi kerak.")
    if (!isPhone(phone)) errors.push("Telefon raqam +998 90 123 45 67 formatda bo'lishi kerak.")
    if (!isEmail(email)) errors.push("Email noto'g'ri kiritilgan.")
    if (message.trim().length < 1) errors.push("Xabar matnini kiriting.")
    return errors
  }, [email, message, name, phone])

  const canSubmit = validationErrors.length === 0
  const contactBackendConnected = false
  const copy = {
    uz: {
      cards: [
        { icon: Phone, title: "Telefon", value: "+998 93 505 45 05", note: "Har kuni 09:00 - 23:00" },
        { icon: Mail, title: "Email", value: "info@tripzy.uz", note: "Tijorat va umumiy savollar uchun" },
        { icon: MapPin, title: "Manzil", value: "Toshkent, O'zbekiston", note: "Uchrashuv oldidan qo'ng'iroq qiling" },
        { icon: Clock, title: "Ish vaqti", value: "09:00 - 23:00", note: "Onlayn yordam davom etadi" },
      ],
      badge: "Aloqa markazi",
      titleA: "Aloqa va",
      titleB: "hamkorlik",
      titleC: "uchun yozing",
      desc: "Savollar, hamkorlik takliflari va korporativ so'rovlar uchun shu sahifa orqali tez bog'lanishingiz mumkin. Telefon, email va forma bir xil uslubda tartiblandi.",
      chips: [
        { label: "Telefon", value: "+998 formati", icon: Phone },
        { label: "Javob", value: "Tezkor aloqa", icon: ShieldCheck },
        { label: "Ish vaqti", value: "09:00 - 23:00", icon: Clock },
      ],
      formBadge: "Bizga yozing",
      formTitle: "Forma orqali murojaat",
      responsive: "Moslashuvchan",
      name: "Ism",
      phone: "Telefon",
      email: "Email",
      status: "Holat",
      ready: "Tayyor",
      checking: "Tekshirilmoqda",
      backendOff: "Yuborish xizmati ulanmagan",
      backendNote: "Bu bo'lim uchun haqiqiy yuborish xizmati hali ulanmagan.",
      message: "Xabar",
      send: "Yuborish",
      more: "Qo'shimcha ma'lumot",
      moreTitle: "Tashrif va aloqaga tayyor sahifa",
      moreTexts: [
        "Telefon maydoni endi `+998 90 123 45 67` formatda bir xil ishlaydi.",
        "Ranglar `Home` va `Flights` sahifalaridagi premium light uslubga moslandi.",
        "Hozircha bu forma haqiqiy yuborish xizmatiga ulanmagan va xabarni jo'natmaydi.",
      ],
      placeholders: {
        name: "Ismingiz",
        phone: "+998 90 123 45 67",
        email: "example@mail.com",
        message: "Hamkorlik yoki savolingizni yozing...",
      },
    },
    ru: {
      cards: [
        { icon: Phone, title: "Телефон", value: "+998 93 505 45 05", note: "Ежедневно 09:00 - 23:00" },
        { icon: Mail, title: "Email", value: "info@tripzy.uz", note: "Для коммерческих и общих запросов" },
        { icon: MapPin, title: "Адрес", value: "Ташкент, Узбекистан", note: "Позвоните перед визитом" },
        { icon: Clock, title: "Время работы", value: "09:00 - 23:00", note: "Онлайн поддержка продолжается" },
      ],
      badge: "Contact center",
      titleA: "Напишите для",
      titleB: "связи",
      titleC: "и партнерства",
      desc: "По вопросам, предложениям о сотрудничестве и корпоративным запросам можно быстро связаться через эту страницу.",
      chips: [
        { label: "Телефон", value: "+998 format", icon: Phone },
        { label: "Ответ", value: "Быстрая связь", icon: ShieldCheck },
        { label: "Время", value: "09:00 - 23:00", icon: Clock },
      ],
      formBadge: "Напишите нам",
      formTitle: "Обращение через форму",
      responsive: "Responsive",
      name: "Имя",
      phone: "Телефон",
      email: "Email",
      status: "Статус",
      ready: "Готово",
      checking: "Проверяется",
      backendOff: "Backend не подключен",
      backendNote: "Для этого раздела реальный submit endpoint пока не подключен.",
      message: "Сообщение",
      send: "Отправить",
      more: "Дополнительная информация",
      moreTitle: "Страница готова для связи и визита",
      moreTexts: [
        "Телефонный input теперь работает в едином формате `+998 90 123 45 67`.",
        "Цвета приведены к premium стилю страниц `Home` и `Flights`.",
        "Пока форма не подключена к backend и не отправляет реальный API запрос.",
      ],
      placeholders: {
        name: "Ваше имя",
        phone: "+998 90 123 45 67",
        email: "example@mail.com",
        message: "Напишите ваш вопрос или предложение...",
      },
    },
    en: {
      cards: [
        { icon: Phone, title: "Phone", value: "+998 93 505 45 05", note: "Daily 09:00 - 23:00" },
        { icon: Mail, title: "Email", value: "info@tripzy.uz", note: "For commercial and general inquiries" },
        { icon: MapPin, title: "Address", value: "Tashkent, Uzbekistan", note: "Please call before visiting" },
        { icon: Clock, title: "Working hours", value: "09:00 - 23:00", note: "Online assistance continues" },
      ],
      badge: "Contact center",
      titleA: "Write for",
      titleB: "contact",
      titleC: "and partnership",
      desc: "For questions, partnership proposals, and corporate requests, you can quickly reach us through this page.",
      chips: [
        { label: "Phone", value: "+998 format", icon: Phone },
        { label: "Response", value: "Fast contact", icon: ShieldCheck },
        { label: "Hours", value: "09:00 - 23:00", icon: Clock },
      ],
      formBadge: "Write to us",
      formTitle: "Contact via form",
      responsive: "Responsive",
      name: "Name",
      phone: "Phone",
      email: "Email",
      status: "Status",
      ready: "Ready",
      checking: "Checking",
      backendOff: "Submit service is not connected",
      backendNote: "A real submit service is not connected for this section yet.",
      message: "Message",
      send: "Send",
      more: "Additional info",
      moreTitle: "A page ready for contact and visits",
      moreTexts: [
        "The phone input now works consistently in `+998 90 123 45 67` format.",
        "Colors were matched to the premium style used on `Home` and `Flights`.",
        "This form is not connected to a real submit service yet and does not send a real request.",
      ],
      placeholders: {
        name: "Your name",
        phone: "+998 90 123 45 67",
        email: "example@mail.com",
        message: "Write your question or partnership request...",
      },
    },
  }[language]

  return (
    <section className="contact-page contact-light-page secondary-page-shell relative overflow-hidden pt-4">
      <div className="secondary-page-overlay pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1560px] px-4 py-6 sm:px-6 md:px-8 md:py-12 2xl:max-w-[1720px]">
        <div className="rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,249,255,0.92)_100%)] p-5 shadow-[0_28px_80px_rgba(17,24,39,0.08)] backdrop-blur-xl md:p-7 dark:border-[#2f4a78] dark:bg-[linear-gradient(180deg,rgba(9,21,42,0.92)_0%,rgba(13,27,53,0.9)_100%)] dark:shadow-[0_32px_90px_rgba(2,8,24,0.46)]">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-[#dce4ef] bg-[linear-gradient(135deg,#fbfdff_0%,#f4f8ff_36%,#eef3fb_62%,#f8f3f7_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:p-8 dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,35,69,0.96)_0%,rgba(16,31,60,0.94)_36%,rgba(20,39,74,0.92)_62%,rgba(28,28,62,0.94)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f0] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6d87] dark:border-[#3d5a8e] dark:bg-[rgba(18,34,64,0.78)] dark:text-[#cfe0fb]">
                <Sparkles size={14} />
                {copy.badge}
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 max-w-[680px] text-[34px] font-black leading-[1.02] tracking-[-0.04em] text-[#1d2430] md:text-[48px] dark:text-white"
              >
                {copy.titleA}
                <span className="bg-[linear-gradient(135deg,#243a7a_0%,#a44c72_45%,#e36b3a_100%)] bg-clip-text text-transparent">
                  {" "}{copy.titleB}{" "}
                </span>
                {copy.titleC}
              </motion.h1>

              <p className="mt-5 max-w-[620px] text-[15px] leading-8 text-[#627188] md:text-[16px] dark:text-[#a9bddb]">
                {copy.desc}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {copy.chips.map((chip) => (
                  <HeroChip key={chip.label} icon={chip.icon} label={chip.label} value={chip.value} />
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {copy.cards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.06)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_22px_60px_rgba(2,8,24,0.34)]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#edf5ff_0%,#dceaff_100%)] text-[#3b6db6] dark:bg-[linear-gradient(135deg,rgba(39,72,133,0.9)_0%,rgba(26,47,87,0.96)_100%)] dark:text-[#d4e2fb]">
                    <card.icon size={20} />
                  </div>
                  <div className="mt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0] dark:text-[#93abd0]">
                    {card.title}
                  </div>
                  <div className="mt-2 text-lg font-black text-[#1d2430] dark:text-white">{card.value}</div>
                  <div className="mt-2 text-sm leading-6 text-[#627188] dark:text-[#a9bddb]">{card.note}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="rounded-[30px] border border-[#dbe5f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_20px_50px_rgba(17,24,39,0.06)] md:p-6 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.34)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f8ca0] dark:text-[#93abd0]">
                    {copy.formBadge}
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#1d2430] dark:text-white">{copy.formTitle}</div>
                </div>
                <span className="rounded-full border border-[#dce7f3] bg-[#f7fbff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a6f8d] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                  {copy.responsive}
                </span>
              </div>

              <form
                className="mt-6 grid gap-3 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!canSubmit) {
                    toast.error(validationErrors[0] || "Forma maydonlarini to'g'ri to'ldiring.")
                    return
                  }
                  if (!contactBackendConnected) {
                    toast.info(copy.backendOff)
                    return
                  }
                  toast.success("Forma qabul qilindi.")
                  setName("")
                  setPhone("+998")
                  setEmail("")
                  setMessage("")
                }}
              >
                <Field
                  label={copy.name}
                  placeholder={copy.placeholders.name}
                  value={name}
                  onChange={setName}
                />
                <Field
                  label={copy.phone}
                  placeholder={copy.placeholders.phone}
                  value={phone}
                  onChange={(next) => setPhone(formatUzPhoneInput(next))}
                />
                <Field
                  label={copy.email}
                  placeholder={copy.placeholders.email}
                  value={email}
                  onChange={setEmail}
                />
                <div className="rounded-[22px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#93abd0]">
                    {copy.status}
                  </div>
                  <div className="mt-2 text-[15px] font-semibold text-[#1d2430] dark:text-white">
                    {!contactBackendConnected
                      ? copy.backendOff
                      : canSubmit
                        ? copy.ready
                        : copy.checking}
                  </div>
                  <div className="mt-1 text-xs text-[#7f8ca0] dark:text-[#a9bddb]">
                    {!contactBackendConnected
                      ? copy.backendNote
                      : canSubmit
                        ? "Forma yuborishga tayyor."
                        : validationErrors[0]}
                  </div>
                </div>

                <label className="block md:col-span-2">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97]">
                    {copy.message}
                  </div>
                  <textarea
                    className="min-h-[150px] w-full rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 text-[15px] font-medium text-[#1d2430] outline-none placeholder:text-[#93a0b4] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] transition focus:border-[#cfd9e8] focus:bg-white dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)] dark:text-white dark:placeholder:text-[#8ea5cb] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:focus:border-[#4d6fa8] dark:focus:bg-[rgba(24,43,80,0.96)]"
                    placeholder={copy.placeholders.message}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#ff8a33_0%,#ff7424_100%)] px-7 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_18px_45px_rgba(255,116,36,0.28)] transition hover:brightness-110 md:col-span-2"
                >
                  <Send size={16} />
                  {copy.send}
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="rounded-[30px] border border-[#dbe5f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_20px_50px_rgba(17,24,39,0.06)] md:p-6 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.34)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f8ca0] dark:text-[#93abd0]">
                {copy.more}
              </div>
              <div className="mt-2 text-2xl font-black text-[#1d2430] dark:text-white">
                {copy.moreTitle}
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#627188] dark:text-[#a9bddb]">
                {copy.moreTexts.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone
  label: string
  value: string
}) {
  return (
    <div className="rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,250,255,0.92)_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)] dark:shadow-[0_16px_34px_rgba(2,8,24,0.26)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0] dark:text-[#93abd0]">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-2 text-[15px] font-bold text-[#1d2430] dark:text-white">{value}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#93abd0]">
        {label}
      </div>
      <input
        className="h-12 w-full rounded-[18px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 text-[15px] font-medium text-[#1d2430] outline-none placeholder:text-[#93a0b4] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] transition focus:border-[#cfd9e8] focus:bg-white dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)] dark:text-white dark:placeholder:text-[#8ea5cb] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:focus:border-[#4d6fa8] dark:focus:bg-[rgba(24,43,80,0.96)]"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
