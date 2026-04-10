import type { FormEvent, ReactNode } from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react"
import { toast } from "sonner"

import dubaiImage from "@/assets/SHaharlar/dubai-marina-cityscape-skyline-skyscrapers-buildings-city-2560x1440-4870.jpg"
import { login, register } from "@/shared/api/auth/auth.api"
import { getAccessToken, setAccessToken, setAuthUser } from "@/shared/auth/token"
import { useI18n } from "@/shared/i18n/i18n"

type Mode = "login" | "register"

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#9c5cff]/40 bg-[linear-gradient(135deg,#8b4dff_0%,#6a26d9_52%,#4f0fb4_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(103,42,214,0.44)] transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"

const copyByLanguage = {
  uz: {
    loginError: "Login xato",
    loginSuccess: "Login muvaffaqiyatli",
    registerError: "Ro'yxatdan o'tishda xatolik",
    registerServerError: "Backend register endpointi hozir 500 qaytaryapti. Birozdan keyin yana urinib ko'ring.",
    registerSuccess: "Ro'yxatdan o'tish muvaffaqiyatli. Endi login qiling.",
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    loginDesc: "Hisobingizga kiring va bronlarni davom ettiring.",
    registerDesc: "Yangi akkaunt yarating va Tripzy bilan tez boshlang.",
    fullNameLabel: "Foydalanuvchi nomi",
    emailLabel: "Elektron pochta",
    passwordLabel: "Parol",
    forgot: "Parolni unutdingizmi?",
    forgotSoon: "Parolni tiklash bo'limi tez orada qo'shiladi",
    backHome: "Bosh sahifa",
    showPassword: "Parolni ko'rsatish",
    hidePassword: "Parolni yashirish",
    signInButton: "Kirish",
    signUpButton: "Ro'yxatdan o'tish",
    newUser: "Hisobingiz yo'qmi?",
    haveAccount: "Akkauntingiz bormi?",
    goRegister: "Ro'yxatdan o'tish",
    goLogin: "Kirish",
    welcomeBack: "Xush kelibsiz!",
    welcomeJoin: "Yangi akkaunt",
    rightCopyLogin: "Tripzy akkauntingiz orqali bronlaringizni boshqaring.",
    rightCopyRegister: "Profil ochib, bron qilishni boshlang.",
    overlayTitleLogin: "Kirish",
    overlayTitleRegister: "Ro'yxatdan o'tish",
    home: "Bosh sahifa",
  },
  ru: {
    loginError: "Ошибка входа",
    loginSuccess: "Вход выполнен успешно",
    registerError: "Ошибка регистрации",
    registerServerError: "Backend endpoint регистрации сейчас возвращает 500. Попробуйте позже.",
    registerSuccess: "Регистрация успешна. Теперь выполните вход.",
    login: "Login",
    register: "Sign Up",
    loginDesc: "Войдите в аккаунт и продолжите бронирование.",
    registerDesc: "Создайте новый аккаунт и быстро начните работу с Tripzy.",
    fullNameLabel: "Username",
    emailLabel: "Email",
    passwordLabel: "Password",
    forgot: "Забыли пароль?",
    forgotSoon: "Восстановление пароля скоро будет добавлено",
    backHome: "На главную",
    showPassword: "Показать пароль",
    hidePassword: "Скрыть пароль",
    signInButton: "Login",
    signUpButton: "Sign Up",
    newUser: "Нет аккаунта?",
    haveAccount: "Уже есть аккаунт?",
    goRegister: "Sign Up",
    goLogin: "Login",
    welcomeBack: "WELCOME BACK!",
    welcomeJoin: "JOIN TRIPZY!",
    rightCopyLogin: "Управляйте поиском, тарифами и бронированиями из одного аккаунта Tripzy.",
    rightCopyRegister: "Создайте новый профиль и начните искать, сохранять и бронировать рейсы быстрее.",
    overlayTitleLogin: "Login",
    overlayTitleRegister: "Sign Up",
    home: "На главную",
  },
  en: {
    loginError: "Login error",
    loginSuccess: "Login successful",
    registerError: "Registration error",
    registerServerError: "The backend register endpoint is currently returning 500. Please try again later.",
    registerSuccess: "Registration successful. Please log in now.",
    login: "Login",
    register: "Sign Up",
    loginDesc: "Sign in to your account and continue your bookings.",
    registerDesc: "Create a new account and get started with Tripzy faster.",
    fullNameLabel: "Username",
    emailLabel: "Email",
    passwordLabel: "Password",
    forgot: "Forgot password?",
    forgotSoon: "Password recovery will be added soon",
    backHome: "Back Home",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signInButton: "Login",
    signUpButton: "Sign Up",
    newUser: "Don't have an account?",
    haveAccount: "Already have an account?",
    goRegister: "Sign Up",
    goLogin: "Login",
    welcomeBack: "WELCOME BACK!",
    welcomeJoin: "JOIN TRIPZY!",
    rightCopyLogin: "Manage your searches, fares, and bookings from one Tripzy account.",
    rightCopyRegister: "Create a new profile and start finding, saving, and booking flights faster.",
    overlayTitleLogin: "Login",
    overlayTitleRegister: "Sign Up",
    home: "Home",
  },
} as const

export default function RegisterPage({
  initialMode = "register",
}: {
  initialMode?: string
}) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const copy = copyByLanguage[language] ?? copyByLanguage.en
  const [mode, setMode] = useState<Mode>(initialMode === "register" ? "register" : "login")
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)

  const isRegister = mode === "register"

  useEffect(() => {
    const token = getAccessToken()
    if (token) navigate("/")
  }, [navigate])

  useEffect(() => {
    setMode(initialMode === "register" ? "register" : "login")
  }, [initialMode])

  const buildDisplayName = (rawEmail: string) => {
    const base = rawEmail.split("@")[0]?.trim() || "Tripzy User"
    const parts = base
      .split(/[._-]+/)
      .map((part) => part.trim())
      .filter(Boolean)

    if (!parts.length) return "Tripzy User"

    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode)
    setShowPass(false)
    navigate(nextMode === "login" ? "/login" : "/register", { replace: true })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      if (mode === "register") {
        await register({
          full_name: fullName,
          email,
          password,
        })

        toast.success(copy.registerSuccess)
        switchMode("login")
        setPassword("")
        return
      }

      const res = await login({ email, password })
      const token = res.data?.data?.token
      if (!token) {
        toast.error(res.data?.message || copy.loginError)
        return
      }

      setAccessToken(token)
      setAuthUser({
        fullName: fullName.trim() || buildDisplayName(email),
        email,
      })
      window.dispatchEvent(new Event("tripzy-auth"))
      toast.success(copy.loginSuccess)
      navigate("/")
    } catch (err: any) {
      const statusCode = err?.response?.status
      const serverMessage =
        mode === "register" && statusCode >= 500
          ? copy.registerServerError
          : mode === "register"
            ? copy.registerError
            : copy.loginError

      toast.error(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string" ? err.response.data : null) ||
          serverMessage
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-white">
      <div className="absolute inset-0">
        <img
          src={dubaiImage}
          alt="Tripzy background"
          className="h-full w-full object-cover opacity-[0.05]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(117,87,199,0.10),transparent_22%),radial-gradient(circle_at_85%_14%,rgba(117,87,199,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f6f7fb_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1320px] items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="mb-6 flex justify-center lg:hidden">
              <div className="inline-flex rounded-full border border-white/12 bg-white/6 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <TogglePill active={isRegister} onClick={() => switchMode("register")}>
                {copy.register}
              </TogglePill>
              <TogglePill active={!isRegister} onClick={() => switchMode("login")}>
                {copy.login}
              </TogglePill>
            </div>
          </div>

          <div className="grid gap-6 lg:hidden">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-[30px] border border-[#8f52ff]/45 bg-[linear-gradient(180deg,rgba(27,9,52,0.94)_0%,rgba(14,4,28,0.98)_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
            >
              <AuthPromoPanel mode={mode} title={isRegister ? copy.welcomeJoin : copy.welcomeBack} body={isRegister ? copy.rightCopyRegister : copy.rightCopyLogin} mobile />
              <div className="border-t border-white/10 p-5 sm:p-7">
                <AuthFormCard
                  mode={mode}
                  copy={copy}
                  loading={loading}
                  fullName={fullName}
                  setFullName={setFullName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  showPass={showPass}
                  setShowPass={setShowPass}
                  onSubmit={onSubmit}
                  switchMode={switchMode}
                  onBackHome={() => navigate("/")}
                />
              </div>
            </motion.div>
          </div>

          <div className="relative hidden min-h-[650px] overflow-hidden rounded-[34px] border border-[#d9ddea] bg-[linear-gradient(180deg,#ffffff_0%,#f8f9fd_100%)] shadow-[0_30px_90px_rgba(86,95,126,0.16)] lg:block">
            <div className="absolute inset-0 border border-white/70" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(117,87,199,0.08),transparent_24%),radial-gradient(circle_at_82%_24%,rgba(117,87,199,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0)_100%)]" />

            <motion.div
              className="absolute inset-y-0 z-20 w-1/2 p-8 xl:p-10"
              animate={{ x: isRegister ? "100%" : "0%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <AuthFormShell
                mode={mode}
                copy={copy}
                onSwitchMode={switchMode}
                onBackHome={() => navigate("/")}
              >
                <AuthFormCard
                  mode={mode}
                  copy={copy}
                  loading={loading}
                  fullName={fullName}
                  setFullName={setFullName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  showPass={showPass}
                  setShowPass={setShowPass}
                  onSubmit={onSubmit}
                  switchMode={switchMode}
                  onBackHome={() => navigate("/")}
                  compactFooter
                />
              </AuthFormShell>
            </motion.div>

            <motion.div
              className="absolute inset-y-0 z-10 w-1/2"
              animate={{ x: isRegister ? "0%" : "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <AuthPromoPanel mode={mode} title={isRegister ? copy.welcomeBack : copy.welcomeJoin} body={isRegister ? copy.rightCopyLogin : copy.rightCopyRegister} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AuthFormShell({
  mode,
  copy,
  onSwitchMode,
  onBackHome,
  children,
}: {
  mode: Mode
  copy: (typeof copyByLanguage)[keyof typeof copyByLanguage]
  onSwitchMode: (mode: Mode) => void
  onBackHome: () => void
  children: ReactNode
}) {
  return (
    <div className="relative flex h-full flex-col rounded-[28px] border border-[#dfe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfe_100%)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_40px_rgba(86,95,126,0.10)] xl:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
        <div className="inline-flex rounded-full border border-[#d7dced] bg-[#f4f6fb] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <TogglePill active={mode === "register"} onClick={() => onSwitchMode("register")}>
            {copy.register}
          </TogglePill>
          <TogglePill active={mode === "login"} onClick={() => onSwitchMode("login")}>
            {copy.login}
          </TogglePill>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="rounded-full border border-[#d7dced] bg-[#f6f7fb] px-4 py-2 text-xs font-medium text-[#4e5870] transition hover:bg-white hover:text-[#1b2333]"
        >
          {copy.home}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center">{children}</div>
    </div>
  )
}

function AuthFormCard({
  mode,
  copy,
  loading,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  showPass,
  setShowPass,
  onSubmit,
  switchMode,
  onBackHome,
  compactFooter = false,
}: {
  mode: Mode
  copy: (typeof copyByLanguage)[keyof typeof copyByLanguage]
  loading: boolean
  fullName: string
  setFullName: (value: string) => void
  email: string
  setEmail: (value: string) => void
  password: string
  setPassword: (value: string) => void
  showPass: boolean
  setShowPass: (value: boolean | ((prev: boolean) => boolean)) => void
  onSubmit: (e: FormEvent) => Promise<void>
  switchMode: (mode: Mode) => void
  onBackHome: () => void
  compactFooter?: boolean
}) {
  const isRegister = mode === "register"

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="w-full"
    >
      <div className="mb-7">
        <h1 className="max-w-[360px] text-[42px] font-black leading-[0.95] tracking-[-0.06em] text-[#171c2b]">
          {isRegister ? copy.overlayTitleRegister : copy.overlayTitleLogin}
        </h1>
        <p className="mt-3 max-w-[360px] text-sm leading-6 text-[#6d768d]">
          {isRegister ? copy.registerDesc : copy.loginDesc}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {isRegister ? (
          <Field
            label={copy.fullNameLabel}
            icon={<User size={16} className="text-[#7060a8]" />}
            placeholder={copy.fullNameLabel}
            type="text"
            value={fullName}
            onChange={setFullName}
            required
            autoComplete="name"
          />
        ) : null}

        <Field
          label={copy.emailLabel}
          icon={<Mail size={16} className="text-[#7060a8]" />}
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
            icon={<Lock size={16} className="text-[#7060a8]" />}
            placeholder={copy.passwordLabel}
            type={showPass ? "text" : "password"}
            value={password}
            onChange={setPassword}
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
          />

          <button
            type="button"
            aria-label={showPass ? copy.hidePassword : copy.showPassword}
            onClick={() => setShowPass((prev) => !prev)}
            className="absolute right-0 top-[34px] grid h-12 w-12 place-items-center text-[#7c6ea8] transition hover:text-[#4a3a7d]"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {!isRegister ? (
          <div className="flex justify-start">
            <button
              type="button"
              className="text-xs text-[#7b8499] transition hover:text-[#3d4761]"
              onClick={() => toast.info(copy.forgotSoon)}
            >
              {copy.forgot}
            </button>
          </div>
        ) : null}

        <button disabled={loading} className={`h-12 w-full ${primaryButtonClass}`}>
          {loading ? "..." : isRegister ? copy.signUpButton : copy.signInButton}
          {!loading ? <ArrowRight size={16} /> : null}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-[#707a91]">
        {isRegister ? copy.haveAccount : copy.newUser}{" "}
        <button
          type="button"
          onClick={() => switchMode(isRegister ? "login" : "register")}
          className="font-semibold text-[#6f4cc6] transition hover:text-[#5133a6]"
        >
          {isRegister ? copy.goLogin : copy.goRegister}
        </button>
      </div>

      {!compactFooter ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onBackHome}
            className="rounded-full border border-[#dce0ec] bg-[#f7f8fc] px-5 py-2.5 text-sm text-[#56607a] transition hover:bg-white hover:text-[#171c2b]"
          >
            {copy.backHome}
          </button>
        </div>
      ) : null}
    </motion.div>
  )
}

function AuthPromoPanel({
  mode,
  title,
  body,
  mobile = false,
}: {
  mode: Mode
  title: string
  body: string
  mobile?: boolean
}) {
  const isRegister = mode === "register"
  const clipPath = isRegister
    ? "polygon(0 0,100% 0,72% 100%,0 100%)"
    : "polygon(28% 0,100% 0,100% 100%,0 100%)"

  return (
    <motion.div
      animate={{ clipPath }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className={`relative h-full overflow-hidden border-[#9b5cff]/50 ${
        mobile ? "min-h-[270px] border-b" : "border-l"
      }`}
      style={mobile ? undefined : { clipPath }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#7d56d8_0%,#6f45cf_42%,#4f2ea9_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.18),transparent_18%),radial-gradient(circle_at_76%_35%,rgba(255,255,255,0.10),transparent_22%)]" />
      <div className="absolute inset-0 border border-[#8d6de0]/40" />

      <motion.div
        key={`${mode}-${mobile ? "mobile" : "desktop"}`}
        initial={{ opacity: 0, x: isRegister ? -16 : 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className={`relative flex h-full ${
          isRegister ? "justify-start" : "justify-end"
        }`}
      >
        <div
          className={`flex h-full w-full max-w-[420px] flex-col justify-center p-8 sm:p-10 ${
            isRegister ? "items-start text-left" : "items-end text-right"
          } ${mobile ? "!items-start !text-left" : ""}`}
        >
          <h2 className="max-w-[250px] text-4xl font-black leading-[0.94] tracking-[-0.06em] text-white sm:text-[52px]">
            {title}
          </h2>

          <p className="mt-4 max-w-[270px] text-sm leading-6 text-white/78 sm:text-[15px]">
            {body}
          </p>
        </div>
      </motion.div>
    </motion.div>
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
  icon: ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-medium tracking-[0.08em] text-[#7a8399]">
        {label}
      </div>
      <div className="flex h-13 w-full items-center gap-3 rounded-[16px] border border-[#dbe0ec] bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fc_100%)] px-3 transition focus-within:border-[#8d6fe1] focus-within:bg-white">
        <input
          className="h-full w-full bg-transparent text-[15px] font-medium text-[#171c2b] outline-none placeholder:text-[#97a0b4] [-webkit-text-fill-color:#171c2b] autofill:[-webkit-text-fill-color:#171c2b]"
          placeholder={placeholder}
          value={value}
          type={type}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
        <span className="grid h-8 w-8 shrink-0 place-items-center text-[#7259c4]">
          {icon}
        </span>
      </div>
    </label>
  )
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-[linear-gradient(135deg,#8a67e2_0%,#6b49c7_100%)] text-white shadow-[0_10px_24px_rgba(103,42,214,0.18)]"
          : "text-[#697389] hover:text-[#1c2434]"
      }`}
    >
      {children}
    </button>
  )
}
