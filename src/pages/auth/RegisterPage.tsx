import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Eye, EyeOff, Headphones, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"

import dubaiImage from "@/assets/SHaharlar/dubai-marina-cityscape-skyline-skyscrapers-buildings-city-2560x1440-4870.jpg"
import { login } from "@/shared/api/auth/auth.api"
import { getAccessToken } from "@/shared/auth/token"
import { useI18n } from "@/shared/i18n/i18n"

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[22px] border border-[#e0c48f]/35 bg-[linear-gradient(135deg,#d0a04d_0%,#bc8e43_45%,#8c6322_100%)] px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_20px_48px_rgba(140,99,34,0.30)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[20px] border border-[#d5deea] bg-white/88 px-5 text-sm font-semibold text-[#1a2436] shadow-[0_14px_34px_rgba(16,24,40,0.08)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"

const copyByLanguage = {
  uz: {
    loginError: "Login xato",
    loginSuccess: "Login muvaffaqiyatli",
    premiumAccess: "Aviation Tour Signature Access",
    heroTitle: "Luxury avia bron qilish uchun xavfsiz va premium kirish",
    heroDesc:
      "Real backendga ulangan tizim orqali reyslarni qidiring, narxlarni solishtiring va bronlarni ishonchli boshqaring.",
    supportTitle: "24/7 premium yordam",
    supportDesc: "Telegram va operator orqali tezkor javob",
    clearPrice: "Shaffof narxlar",
    clearPriceDesc: "Yashirin komissiyasiz real tariflar",
    secureTitle: "Himoyalangan kirish",
    secureDesc: "Token va sessiya oqimi real backend bilan ishlaydi",
    formEyebrow: "Tripzy account",
    login: "Kirish",
    loginDesc: "Hisobingizga kiring va xalqaro reyslarni qulay bron qiling.",
    emailLabel: "Email manzil",
    passwordLabel: "Parol",
    forgot: "Parolni unutdingizmi?",
    forgotSoon: "Parolni tiklash bo'limi tez orada qo'shiladi",
    backHome: "Bosh sahifaga qaytish",
    showPassword: "Parolni ko'rsatish",
    hidePassword: "Parolni yashirish",
    signInButton: "Kirish",
    liveBackend: "Real backend ulangan",
    trustLine: "Aviation Tour uchun premium, tezkor va ishonchli kirish",
  },
  ru: {
    loginError: "Ошибка входа",
    loginSuccess: "Вход выполнен успешно",
    premiumAccess: "Aviation Tour Signature Access",
    heroTitle: "Премиальный и безопасный вход для luxury бронирования авиарейсов",
    heroDesc:
      "Ищите рейсы, сравнивайте цены и управляйте бронированием через интерфейс, подключенный к реальному backend.",
    supportTitle: "Премиум поддержка 24/7",
    supportDesc: "Быстрый ответ через Telegram и оператора",
    clearPrice: "Прозрачные цены",
    clearPriceDesc: "Реальные тарифы без скрытых комиссий",
    secureTitle: "Защищенный вход",
    secureDesc: "Поток token и session работает с реальным backend",
    formEyebrow: "Tripzy account",
    login: "Вход",
    loginDesc: "Войдите в аккаунт и бронируйте международные рейсы в удобном формате.",
    emailLabel: "Email адрес",
    passwordLabel: "Пароль",
    forgot: "Забыли пароль?",
    forgotSoon: "Раздел восстановления пароля скоро будет добавлен",
    backHome: "Вернуться на главную",
    showPassword: "Показать пароль",
    hidePassword: "Скрыть пароль",
    signInButton: "Войти",
    liveBackend: "Реальный backend подключен",
    trustLine: "Премиальный, быстрый и надежный вход для Aviation Tour",
  },
  en: {
    loginError: "Login error",
    loginSuccess: "Login successful",
    premiumAccess: "Aviation Tour Signature Access",
    heroTitle: "A premium and secure sign-in for luxury flight booking",
    heroDesc:
      "Search flights, compare fares, and manage bookings through a refined interface connected to the real backend.",
    supportTitle: "24/7 premium support",
    supportDesc: "Fast help through Telegram and live operator support",
    clearPrice: "Transparent pricing",
    clearPriceDesc: "Real fares with no hidden fees",
    secureTitle: "Protected sign-in",
    secureDesc: "Token and session flow run against the real backend",
    formEyebrow: "Tripzy account",
    login: "Login",
    loginDesc: "Sign in to your account and book international flights with ease.",
    emailLabel: "Email address",
    passwordLabel: "Password",
    forgot: "Forgot password?",
    forgotSoon: "Password recovery will be added soon",
    backHome: "Back to home",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signInButton: "Sign in",
    liveBackend: "Real backend connected",
    trustLine: "Premium, fast, and reliable access for Aviation Tour",
  },
} as const

export default function RegisterPage({ initialMode: _initialMode }: { initialMode?: string }) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const copy = copyByLanguage[language] ?? copyByLanguage.en
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (token) navigate("/")
  }, [navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      const res = await login({ email, password })
      const token = res.data?.data?.token
      if (!token) {
        toast.error(res.data?.message || copy.loginError)
        return
      }

      localStorage.setItem("access_token", token)
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
    <section className="relative min-h-screen overflow-hidden bg-[#f5f0e6] pt-20 text-[#172033]">
      <div className="absolute inset-0">
        <img src={dubaiImage} alt="Dubai skyline" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,16,28,0.78)_0%,rgba(10,16,28,0.58)_38%,rgba(10,16,28,0.22)_72%,rgba(10,16,28,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(211,171,94,0.30),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(255,238,198,0.16),transparent_22%)]" />
      </div>

      <div className="relative mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-9rem)] items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-[680px] text-white"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/92 backdrop-blur-md">
              <Sparkles size={14} />
              {copy.premiumAccess}
            </div>

            <h1 className="mt-6 max-w-[720px] font-['Georgia'] text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white [text-shadow:0_12px_34px_rgba(0,0,0,0.5)] sm:text-5xl lg:text-[66px]">
              {copy.heroTitle}
            </h1>

            <p className="mt-5 max-w-[620px] text-base leading-8 text-white/86 [text-shadow:0_6px_18px_rgba(0,0,0,0.42)] sm:text-lg">
              {copy.heroDesc}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <FeaturePill icon={<Headphones size={18} />} title={copy.supportTitle} text={copy.supportDesc} />
              <FeaturePill icon={<Sparkles size={18} />} title={copy.clearPrice} text={copy.clearPriceDesc} />
              <FeaturePill icon={<ShieldCheck size={18} />} title={copy.secureTitle} text={copy.secureDesc} />
            </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/90">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e7c27a]/45 bg-[#c79743]/18 px-4 py-2 backdrop-blur-sm">
                  <ShieldCheck size={15} className="text-[#f1d18e]" />
                  {copy.liveBackend}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 px-4 py-2 backdrop-blur-sm">
                  <Sparkles size={15} className="text-[#f4deb1]" />
                  {copy.trustLine}
                </div>
              </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="w-full"
          >
            <div className="rounded-[34px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,245,237,0.93)_100%)] p-5 shadow-[0_26px_90px_rgba(8,15,28,0.26)] backdrop-blur-xl sm:p-7 lg:p-8">
              <div className="rounded-[28px] border border-[#e7dcc6] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f2e8_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#e8dcc3] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#86632b]">
                      <Sparkles size={12} />
                      {copy.formEyebrow}
                    </div>
                    <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#182133] sm:text-[46px]">
                      {copy.login}
                    </h2>
                    <p className="mt-3 max-w-[480px] text-[15px] leading-7 text-[#617089] sm:text-base">
                      {copy.loginDesc}
                    </p>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <Field
                    label={copy.emailLabel}
                    icon={<Mail size={18} className="text-[#8b6b34]" />}
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                    autoComplete="email"
                  />

                  <div className="relative">
                    <Field
                      label={copy.passwordLabel}
                      icon={<Lock size={18} className="text-[#8b6b34]" />}
                      placeholder={copy.passwordLabel}
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      required
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      aria-label={showPass ? copy.hidePassword : copy.showPassword}
                      onClick={() => setShowPass((prev) => !prev)}
                      className="absolute right-3 top-[42px] grid h-10 w-10 place-items-center rounded-[16px] border border-[#e5d9c5] bg-white text-[#64748b] shadow-[0_8px_20px_rgba(16,24,40,0.06)] transition hover:bg-[#fff9ef]"
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1 text-sm">
                    <button
                      type="button"
                      className="text-[#67758a] transition hover:text-[#172033]"
                      onClick={() => toast.info(copy.forgotSoon)}
                    >
                      {copy.forgot}
                    </button>
                  </div>

                  <button disabled={loading} className={`h-14 w-full ${primaryButtonClass}`}>
                    {loading ? "..." : copy.signInButton}
                    {!loading ? <ArrowRight size={17} /> : null}
                  </button>
                </form>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className={`h-12 ${secondaryButtonClass}`}
                  >
                    {copy.backHome}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7c632f]">
        {label}
      </div>
      <div className="flex h-14 w-full items-center gap-3 rounded-[22px] border border-[#e4d8c4] bg-white/94 px-4 shadow-[0_10px_28px_rgba(17,24,39,0.05)] transition focus-within:border-[#d0a14f] focus-within:bg-white">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fbf4e5]">
          {icon}
        </span>
        <input
          className="h-full w-full bg-transparent text-[15px] font-medium text-[#172033] caret-[#172033] outline-none placeholder:text-[#8a97aa] [-webkit-text-fill-color:#172033] autofill:[-webkit-text-fill-color:#172033]"
          placeholder={placeholder}
          value={value}
          type={type}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </label>
  )
}

function FeaturePill({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-[24px] border border-white/16 bg-white/10 p-4 text-white shadow-[0_14px_34px_rgba(0,0,0,0.12)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#c59746]/24 text-[#f3d79f]">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs leading-5 text-white/76">{text}</div>
        </div>
      </div>
    </div>
  )
}
