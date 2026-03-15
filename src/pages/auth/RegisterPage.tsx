import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { login } from "@/shared/api/auth/auth.api"
import { useI18n } from "@/shared/i18n/i18n"

type Mode = "register" | "login"

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(17,24,39,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(53,89,170,0.34)_0%,rgba(17,27,52,0.96)_52%,rgba(30,55,104,0.9)_100%)] dark:shadow-[0_22px_50px_rgba(2,8,24,0.42)]"

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe3ef] bg-white/90 px-5 text-sm font-semibold text-[#1d2430] shadow-[0_12px_30px_rgba(17,24,39,0.08)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:shadow-[0_16px_34px_rgba(2,8,24,0.28)] dark:hover:bg-[rgba(24,43,80,0.94)]"

const panelClass =
  "rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.92)_100%)] shadow-[0_24px_70px_rgba(17,24,39,0.08)] backdrop-blur-xl dark:border-[#2f4a78] dark:bg-[linear-gradient(180deg,rgba(9,21,42,0.92)_0%,rgba(13,27,53,0.9)_100%)] dark:shadow-[0_32px_90px_rgba(2,8,24,0.46)]"

export default function RegisterPage({ initialMode = "register" }: { initialMode?: Mode }) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const copy = {
    uz: {
      registerOff: "Register vaqtincha o'chirilgan. Iltimos, login qiling.",
      loginError: "Login xato",
      loginSuccess: "Login muvaffaqiyatli",
      premiumAccess: "Tripzy Premium Access",
      heroTitle: "Luxury bron qilish tajribasi, sodda va ishonchli kirish bilan",
      heroDesc: "Reyslarni qidiring, tariflarni solishtiring, bagaj va refund shartlarini ko'ring. Kirish oqimi real backend bilan ishlaydi.",
      supportTitle: "24/7 Support",
      supportDesc: "Telegram va call yordam",
      clearPrice: "Shaffof narx",
      clearPriceDesc: "Yashirin fee yo'q",
      premiumService: "Premium servis",
      premiumServiceDesc: "Priority va VIP oqim",
      secureTitle: "Secure",
      secureDesc: "Protected login flow",
      registerClosed: "Register vaqtincha yopilgan",
      registerClosedDesc: "Fayl saqlandi. Keyin real backend register endpoint to'liq tayyor bo'lganda qayta ochiladi.",
      login: "Kirish",
      loginDesc: "Hisobingizga kiring va reyslarni bron qiling.",
      remember: "Remember me",
      forgot: "Parolni unutdingizmi?",
      forgotSoon: "Parolni tiklash bo'limi tez orada qo'shiladi",
      password: "Parol",
      authEndpoint: "Auth endpoint",
      endpointLabel: "Ulanadigan endpoint:",
      registerDisabled: "Register vaqtincha o'chirilgan. Hozir faqat login orqali kirish mumkin.",
      backHome: "Bosh sahifaga qaytish",
      showPassword: "Show password",
      registerTab: "Register",
      loginTab: "Login",
    },
    ru: {
      registerOff: "Регистрация временно отключена. Пожалуйста, войдите.",
      loginError: "Ошибка входа",
      loginSuccess: "Вход выполнен успешно",
      premiumAccess: "Tripzy Premium Access",
      heroTitle: "Luxury бронирование с простым и надежным входом",
      heroDesc: "Ищите рейсы, сравнивайте тарифы, багаж и условия refund. Вход работает с реальным backend.",
      supportTitle: "24/7 Support",
      supportDesc: "Помощь через Telegram и звонок",
      clearPrice: "Прозрачная цена",
      clearPriceDesc: "Без скрытых комиссий",
      premiumService: "Премиум сервис",
      premiumServiceDesc: "Priority и VIP поток",
      secureTitle: "Secure",
      secureDesc: "Защищенный вход",
      registerClosed: "Регистрация временно закрыта",
      registerClosedDesc: "Файл сохранен. Когда реальный backend register endpoint будет готов, раздел снова откроется.",
      login: "Вход",
      loginDesc: "Войдите в аккаунт и бронируйте рейсы.",
      remember: "Запомнить меня",
      forgot: "Забыли пароль?",
      forgotSoon: "Раздел восстановления пароля скоро будет добавлен",
      password: "Пароль",
      authEndpoint: "Auth endpoint",
      endpointLabel: "Подключаемый endpoint:",
      registerDisabled: "Регистрация временно отключена. Сейчас доступен только вход.",
      backHome: "Вернуться на главную",
      showPassword: "Показать пароль",
      registerTab: "Register",
      loginTab: "Login",
    },
    en: {
      registerOff: "Registration is temporarily disabled. Please log in.",
      loginError: "Login error",
      loginSuccess: "Login successful",
      premiumAccess: "Tripzy Premium Access",
      heroTitle: "A luxury booking experience with simple and reliable access",
      heroDesc: "Search flights, compare fares, baggage, and refund rules. The login flow works with the real backend.",
      supportTitle: "24/7 Support",
      supportDesc: "Telegram and call support",
      clearPrice: "Transparent pricing",
      clearPriceDesc: "No hidden fees",
      premiumService: "Premium service",
      premiumServiceDesc: "Priority and VIP flow",
      secureTitle: "Secure",
      secureDesc: "Protected login flow",
      registerClosed: "Registration is temporarily closed",
      registerClosedDesc: "The file is saved. When the real backend register endpoint is fully ready, this section will reopen.",
      login: "Login",
      loginDesc: "Sign in to your account and book flights.",
      remember: "Remember me",
      forgot: "Forgot password?",
      forgotSoon: "Password recovery will be added soon",
      password: "Password",
      authEndpoint: "Auth endpoint",
      endpointLabel: "Connected endpoint:",
      registerDisabled: "Registration is temporarily disabled. Only login is available right now.",
      backHome: "Back to home",
      showPassword: "Show password",
      registerTab: "Register",
      loginTab: "Login",
    },
  }[language]
  const registerDisabled = true

  const [mode, setMode] = useState<Mode>(registerDisabled ? "login" : initialMode)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === "register") {
      toast.info(copy.registerOff)
      setMode("login")
      return
    }

    setLoading(true)
    try {
      const res = await login({ email, password })
      const token = res.data?.data?.token
      if (!token) {
        toast.error(res.data?.message || copy.loginError)
        return
      }

      if (remember) localStorage.setItem("access_token", token)
      else sessionStorage.setItem("access_token", token)

      window.dispatchEvent(new Event("tripzy-auth"))
      toast.success(copy.loginSuccess)
      navigate("/")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || copy.loginError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f8_36%,#e7edf5_100%)] pt-20 text-[#1d2430] dark:bg-[linear-gradient(180deg,#07111f_0%,#0a1730_24%,#102347_58%,#0a1730_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(760px_320px_at_14%_0%,rgba(88,122,196,0.16),transparent_62%),radial-gradient(560px_260px_at_88%_6%,rgba(219,121,104,0.14),transparent_56%),radial-gradient(680px_320px_at_48%_36%,rgba(157,90,129,0.08),transparent_62%)] dark:bg-[radial-gradient(920px_380px_at_16%_0%,rgba(78,118,204,0.24),transparent_58%),radial-gradient(760px_320px_at_84%_6%,rgba(126,82,194,0.16),transparent_56%),radial-gradient(760px_320px_at_50%_24%,rgba(40,87,168,0.22),transparent_62%)]" />

      <div className="relative mx-auto max-w-[1120px] px-4 py-10 sm:px-5 sm:py-14 md:py-16">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={`overflow-hidden p-7 md:p-9 ${panelClass}`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#627188] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#cfe0fb]">
              <span className="h-2 w-2 rounded-full bg-[#8A3A5A]" />
              {copy.premiumAccess}
            </div>

            <h2 className="mt-6 max-w-[520px] text-3xl font-extrabold leading-tight text-[#1d2430] md:text-4xl dark:text-white">
              {copy.heroTitle}
            </h2>

            <p className="mt-4 max-w-[560px] leading-8 text-[#627188] dark:text-[#a9bddb]">
              {copy.heroDesc}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <FeatureCard
                title={copy.supportTitle}
                desc={copy.supportDesc}
                tone="blue"
              />
              <FeatureCard
                title={copy.clearPrice}
                desc={copy.clearPriceDesc}
                tone="rose"
              />
              <FeatureCard
                title={copy.premiumService}
                desc={copy.premiumServiceDesc}
                tone="gold"
              />
              <FeatureCard
                title="Secure"
                desc={copy.secureDesc}
                tone="blue"
              />
            </div>

            <div className="mt-7 rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(135deg,#fbfdff_0%,#f4f8ff_46%,#f8f2f5_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,35,69,0.96)_0%,rgba(16,31,60,0.94)_46%,rgba(30,24,53,0.94)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#fff7f9_0%,#fff0f3_100%)] text-[#9b506b] shadow-[0_12px_30px_rgba(155,80,107,0.12)] dark:bg-[linear-gradient(135deg,rgba(65,36,68,0.94)_0%,rgba(48,25,53,0.96)_100%)] dark:text-[#f1bfd1] dark:shadow-[0_16px_34px_rgba(2,8,24,0.24)]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="font-semibold text-[#1d2430] dark:text-white">{copy.registerClosed}</div>
                  <div className="mt-1 text-sm leading-6 text-[#627188] dark:text-[#a9bddb]">
                    {copy.registerClosedDesc}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className={`p-6 md:p-8 ${panelClass}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1d2430] dark:text-white">{copy.login}</h1>
                <p className="mt-2 text-[#627188] dark:text-[#a9bddb]">
                  {copy.loginDesc}
                </p>
              </div>

              <div className="flex rounded-2xl border border-[#dde5f0] bg-white/90 p-1 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
                <TabBtn active={false} onClick={() => {}} text={copy.registerTab} disabled />
                <TabBtn active onClick={() => setMode("login")} text={copy.loginTab} />
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <Field
                icon={<Mail size={18} className="text-[#8ca0bc]" />}
                placeholder="Email"
                type="email"
                value={email}
                onChange={setEmail}
                required
                autoComplete="email"
              />

              <div className="relative">
                <Field
                  icon={<Lock size={18} className="text-[#8ca0bc]" />}
                  placeholder={copy.password}
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  aria-label={copy.showPassword}
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl border border-[#dbe3ef] bg-white text-[#627188] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(24,43,80,0.94)]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-[#627188] dark:text-[#a9bddb]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[#8A3A5A]"
                  />
                  {copy.remember}
                </label>

                <button
                  type="button"
                  className="text-left text-[#627188] transition hover:text-[#1d2430] sm:text-right dark:text-[#a9bddb] dark:hover:text-white"
                  onClick={() => toast.info(copy.forgotSoon)}
                >
                  {copy.forgot}
                </button>
              </div>

              <button disabled={loading} className={`h-12 w-full ${primaryButtonClass}`}>
                {loading ? "..." : copy.login}
              </button>

              <div className="rounded-2xl border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)]">
                <div className="text-xs uppercase tracking-[0.14em] text-[#7b8aa0] dark:text-[#93abd0]">
                  {copy.authEndpoint}
                </div>
                <div className="mt-2 text-sm text-[#627188] dark:text-[#a9bddb]">
                  {copy.endpointLabel}{" "}
                  <span className="font-semibold text-[#1d2430] dark:text-white">POST /auth/login</span>
                </div>
              </div>
            </form>

            <div className="mt-6 rounded-2xl border border-[#f0e0b8] bg-[linear-gradient(135deg,#fffaf2_0%,#fff2db_100%)] p-4 text-sm text-[#7c6328] dark:border-[#6d5a2f] dark:bg-[rgba(82,63,23,0.45)] dark:text-[#ffe39c]">
              {copy.registerDisabled}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/")}
                className={`h-11 w-full sm:w-auto ${secondaryButtonClass}`}
              >
                {copy.backHome}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TabBtn({
  active,
  onClick,
  text,
  disabled = false,
}: {
  active: boolean
  onClick: () => void
  text: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "h-10 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        active
          ? "border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-white dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(53,89,170,0.34)_0%,rgba(17,27,52,0.96)_52%,rgba(30,55,104,0.9)_100%)]"
          : "text-[#627188] hover:bg-[#f8fbff] hover:text-[#1d2430] dark:text-[#a9bddb] dark:hover:bg-[rgba(24,43,80,0.94)] dark:hover:text-white",
      ].join(" ")}
    >
      {text}
    </button>
  )
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[#dbe3ef] bg-white px-4 shadow-[0_8px_20px_rgba(17,24,39,0.04)] transition focus-within:border-[#c7d4e7] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:shadow-[0_14px_28px_rgba(2,8,24,0.24)] dark:focus-within:border-[#4d6fa8]">
      <span className="shrink-0">{icon}</span>
      <input
        className="h-full w-full bg-transparent text-[15px] font-medium text-[#0f172a] caret-[#0f172a] outline-none placeholder:text-[#7c8da5] [-webkit-text-fill-color:#0f172a] autofill:[-webkit-text-fill-color:#0f172a] dark:text-white dark:caret-white dark:placeholder:text-[#8ea5cb] dark:[-webkit-text-fill-color:#ffffff] dark:autofill:[-webkit-text-fill-color:#ffffff]"
        placeholder={placeholder}
        value={value}
        type={type}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}

function FeatureCard({
  title,
  desc,
  tone,
}: {
  title: string
  desc: string
  tone: "blue" | "rose" | "gold"
}) {
  const toneStyles = {
    blue: "border-[#dce7fb] bg-[linear-gradient(135deg,#f5f9ff_0%,#e8f1ff_100%)] dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(20,35,66,0.84)_0%,rgba(26,47,87,0.9)_100%)]",
    rose: "border-[#f1d9df] bg-[linear-gradient(135deg,#fff7f9_0%,#fff0f3_100%)] dark:border-[#5d3e5e] dark:bg-[linear-gradient(135deg,rgba(56,31,55,0.88)_0%,rgba(42,25,46,0.94)_100%)]",
    gold: "border-[#f0e0b8] bg-[linear-gradient(135deg,#fffaf2_0%,#fff2db_100%)] dark:border-[#6d5a2f] dark:bg-[linear-gradient(135deg,rgba(82,63,23,0.45)_0%,rgba(58,45,20,0.52)_100%)]",
  } as const

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] ${toneStyles[tone]}`}>
      <div className="font-semibold text-[#1d2430] dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-[#627188] dark:text-[#a9bddb]">{desc}</div>
    </div>
  )
}
