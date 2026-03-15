import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Clock, Mail, MapPin, Phone, Send, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { formatUzPhoneInput } from "@/lib/phone"

const contactCards = [
  { icon: Phone, title: "Telefon", value: "+998 93 505 45 05", note: "Har kuni 09:00 - 23:00" },
  { icon: Mail, title: "Email", value: "info@tripzy.uz", note: "Tijorat va umumiy savollar uchun" },
  { icon: MapPin, title: "Manzil", value: "Toshkent, Uzbekistan", note: "Uchrashuv oldidan qo'ng'iroq qiling" },
  { icon: Clock, title: "Ish vaqti", value: "09:00 - 23:00", note: "Online support davom etadi" },
]

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const isPhone = (value: string) => {
  const digits = value.replace(/\D/g, "")
  return digits.length === 12 && digits.startsWith("998")
}

export default function Contact() {
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

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#e2e8ef_0%,#eef3f8_18%,#f8fbff_62%,#eaf0f7_100%)] pt-20 text-[#1d2430] dark:bg-[linear-gradient(180deg,#07111f_0%,#0a1730_24%,#102347_58%,#0a1730_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_360px_at_16%_0%,rgba(82,122,199,0.16),transparent_58%),radial-gradient(720px_300px_at_86%_4%,rgba(219,116,101,0.12),transparent_56%),radial-gradient(760px_280px_at_50%_24%,rgba(154,91,142,0.08),transparent_62%)] dark:bg-[radial-gradient(920px_380px_at_16%_0%,rgba(78,118,204,0.24),transparent_58%),radial-gradient(760px_320px_at_84%_6%,rgba(126,82,194,0.16),transparent_56%),radial-gradient(760px_320px_at_50%_24%,rgba(40,87,168,0.22),transparent_62%)]" />

      <div className="relative mx-auto max-w-[1240px] px-4 py-10 sm:px-6 md:px-8 md:py-12">
        <div className="rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,249,255,0.92)_100%)] p-5 shadow-[0_28px_80px_rgba(17,24,39,0.08)] backdrop-blur-xl md:p-7 dark:border-[#2f4a78] dark:bg-[linear-gradient(180deg,rgba(9,21,42,0.92)_0%,rgba(13,27,53,0.9)_100%)] dark:shadow-[0_32px_90px_rgba(2,8,24,0.46)]">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-[#dce4ef] bg-[linear-gradient(135deg,#fbfdff_0%,#f4f8ff_36%,#eef3fb_62%,#f8f3f7_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:p-8 dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,35,69,0.96)_0%,rgba(16,31,60,0.94)_36%,rgba(20,39,74,0.92)_62%,rgba(28,28,62,0.94)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f0] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6d87] dark:border-[#3d5a8e] dark:bg-[rgba(18,34,64,0.78)] dark:text-[#cfe0fb]">
                <Sparkles size={14} />
                Contact center
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 max-w-[680px] text-[34px] font-black leading-[1.02] tracking-[-0.04em] text-[#1d2430] md:text-[48px] dark:text-white"
              >
                Aloqa va
                <span className="bg-[linear-gradient(135deg,#243a7a_0%,#a44c72_45%,#e36b3a_100%)] bg-clip-text text-transparent">
                  {" "}hamkorlik{" "}
                </span>
                uchun yozing
              </motion.h1>

              <p className="mt-5 max-w-[620px] text-[15px] leading-8 text-[#627188] md:text-[16px] dark:text-[#a9bddb]">
                Savollar, hamkorlik takliflari va korporativ so'rovlar uchun shu sahifa orqali
                tez bog'lanishingiz mumkin. Telefon, email va forma bir xil uslubda tartiblandi.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <HeroChip icon={Phone} label="Telefon" value="+998 format" />
                <HeroChip icon={ShieldCheck} label="Javob" value="Tezkor aloqa" />
                <HeroChip icon={Clock} label="Ish vaqti" value="09:00 - 23:00" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {contactCards.map((card, index) => (
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
                    Bizga yozing
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#1d2430] dark:text-white">Forma orqali murojaat</div>
                </div>
                <span className="rounded-full border border-[#dce7f3] bg-[#f7fbff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a6f8d] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]">
                  Responsive
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
                    toast.info("Kontakt forma hali backendga ulanmagan. Hozircha faqat frontend validation ishlayapti.")
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
                  label="Ism"
                  placeholder="Ismingiz"
                  value={name}
                  onChange={setName}
                />
                <Field
                  label="Telefon"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(next) => setPhone(formatUzPhoneInput(next))}
                />
                <Field
                  label="Email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={setEmail}
                />
                <div className="rounded-[22px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#93abd0]">
                    Holat
                  </div>
                  <div className="mt-2 text-[15px] font-semibold text-[#1d2430] dark:text-white">
                    {!contactBackendConnected
                      ? "Backend ulanmagan"
                      : canSubmit
                        ? "Tayyor"
                        : "Tekshirilmoqda"}
                  </div>
                  <div className="mt-1 text-xs text-[#7f8ca0] dark:text-[#a9bddb]">
                    {!contactBackendConnected
                      ? "Bu bo'lim uchun real submit endpoint hali ulanmagan."
                      : canSubmit
                        ? "Forma yuborishga tayyor."
                        : validationErrors[0]}
                  </div>
                </div>

                <label className="block md:col-span-2">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97]">
                    Xabar
                  </div>
                  <textarea
                    className="min-h-[150px] w-full rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 text-[15px] font-medium text-[#1d2430] outline-none placeholder:text-[#93a0b4] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] transition focus:border-[#cfd9e8] focus:bg-white dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)] dark:text-white dark:placeholder:text-[#8ea5cb] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:focus:border-[#4d6fa8] dark:focus:bg-[rgba(24,43,80,0.96)]"
                    placeholder="Hamkorlik yoki savolingizni yozing..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#ff8a33_0%,#ff7424_100%)] px-7 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_18px_45px_rgba(255,116,36,0.28)] transition hover:brightness-110 md:col-span-2"
                >
                  <Send size={16} />
                  Yuborish
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
                Qo'shimcha ma'lumot
              </div>
              <div className="mt-2 text-2xl font-black text-[#1d2430] dark:text-white">
                Tashrif va aloqaga tayyor sahifa
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#627188] dark:text-[#a9bddb]">
                <p>
                  Telefon input endi `+998 90 123 45 67` formatda bir xil ishlaydi.
                </p>
                <p>
                  Ranglar `Home` va `Flights` sahifalaridagi premium light uslubga moslandi.
                </p>
                <p>
                  Hozircha bu forma backendga ulanmagan, submit qilganda real API ga so'rov yubormaydi.
                </p>
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
