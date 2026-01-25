import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User2 } from "lucide-react"
// import { http } from "@/shared/api/http" // ✅ backend ulaganda ochasan

type Mode = "register" | "login"

type DemoUser = { name: string; email: string; password: string }

const USERS_KEY = "tripzy_users"

function getUsers(): DemoUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
  } catch {
    return []
  }
}
function setUsers(users: DemoUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// ✅ Demo token (backendda res.data.access bo‘ladi)
function makeToken(email: string) {
  return `demo_${btoa(email)}_${Date.now()}`
}

export default function RegisterPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>("register")
  const [loading, setLoading] = useState(false)

  // form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)

  const title = useMemo(() => (mode === "register" ? "Account yaratish" : "Kirish"), [mode])
  const subtitle = useMemo(
    () =>
      mode === "register"
        ? "Premium bron qilish uchun account yarating."
        : "Hisobingizga kiring va reyslarni bron qiling.",
    [mode]
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "register") {
        // ----------------------------
        // ✅ DEMO REGISTER (localStorage)
        // ----------------------------
        const users = getUsers()
        const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
        if (exists) {
          alert("Bu email bilan account bor. Login qiling ✅")
          setMode("login")
          return
        }

        users.push({ name, email, password })
        setUsers(users)

        // ✅ Registerdan keyin auto-login
        const token = makeToken(email)
        if (remember) localStorage.setItem("access_token", token)

        alert("Register + Login demo ✅")
        navigate("/") // ✅ kirgandan keyin home

        // ----------------------------
        // ✅ BACKENDGA ULANDA:
        // const res = await http.post("/auth/register", { name, email, password })
        // (backend loginni alohida qilsin desa, registerdan keyin login request yuborasan)
        // const res2 = await http.post("/auth/login", { email, password })
        // localStorage.setItem("access_token", res2.data.access)
        // navigate("/")
        // ----------------------------
        return
      }

      // ----------------------------
      // ✅ DEMO LOGIN
      // ----------------------------
      const users = getUsers()
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!user || user.password !== password) {
        alert("Email yoki parol xato ❌")
        return
      }

      const token = makeToken(email)
      if (remember) localStorage.setItem("access_token", token)

      alert("Login demo ✅")
      navigate("/")

      // ----------------------------
      // ✅ BACKENDGA ULANDA:
      // const res = await http.post("/auth/login", { email, password })
      // localStorage.setItem("access_token", res.data.access)
      // navigate("/")
      // ----------------------------
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A5B86] via-[#0b1b2b] to-[#0A1220]" />

      <div className="pointer-events-none absolute -top-44 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-white/12 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-56 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#FF7A00]/12 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 left-[-160px] h-[460px] w-[460px] rounded-full bg-white/8 blur-[140px]" />

      <div className="relative mx-auto max-w-[1100px] px-5 py-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-7 md:p-9 shadow-[0_45px_140px_rgba(0,0,0,0.55)]"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white/85">
              <span className="h-2 w-2 rounded-full bg-[#FF7A00]" />
              TRIPZY • Premium Flights
            </div>

            <h2 className="mt-6 text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Luxury bron qilish tajribasi — sodda, tez, ishonchli
            </h2>

            <p className="mt-4 text-white/70 leading-relaxed">
              Reyslarni qidiring, tariflarni solishtiring, bagaj va refund shartlarini ko‘ring —
              hammasi bir joyda. Backend ulanganida real reyslar va to‘lov oqimi qo‘shiladi.
            </p>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MiniCard title="24/7 Support" desc="Telegram/Call yordam" />
              <MiniCard title="Shaffof narx" desc="Yashirin fee yo‘q" />
              <MiniCard title="Premium servis" desc="Priority & VIP" />
              <MiniCard title="Secure" desc="Protected flow" />
            </div>

            <div className="mt-7 rounded-2xl border border-white/12 bg-white/5 p-4 text-white/70 text-sm">
              TODO: keyin email tasdiqlash (OTP) / token (JWT) / refresh flow qo‘shamiz.
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 md:p-8 shadow-[0_45px_140px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold text-white">{title}</h1>
                <p className="mt-2 text-white/70">{subtitle}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/8 p-1 flex">
                <TabBtn active={mode === "register"} onClick={() => setMode("register")} text="Register" />
                <TabBtn active={mode === "login"} onClick={() => setMode("login")} text="Login" />
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-7 space-y-3">
              <AnimatePresence initial={false}>
                {mode === "register" && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Field
                      icon={<User2 size={18} className="text-white/75" />}
                      placeholder="Ism"
                      value={name}
                      onChange={setName}
                      required
                      autoComplete="name"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field
                icon={<Mail size={18} className="text-white/75" />}
                placeholder="Email"
                type="email"
                value={email}
                onChange={setEmail}
                required
                autoComplete="email"
              />

              <div className="relative">
                <Field
                  icon={<Lock size={18} className="text-white/75" />}
                  placeholder="Parol"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />

                <button
                  type="button"
                  aria-label="Show password"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center
                             rounded-xl border border-white/12 bg-white/5 text-white/80 hover:bg-white/10 transition"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-white/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[#FF7A00]"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-white/70 hover:text-white transition"
                  onClick={() => alert("Demo: keyin Forgot Password qo‘shamiz ✅")}
                >
                  Parolni unutdingizmi?
                </button>
              </div>

              <button
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-[#FF7A00] font-semibold text-white
                           hover:opacity-90 transition disabled:opacity-60
                           shadow-[0_18px_60px_rgba(255,122,0,0.25)]"
              >
                {loading ? "..." : mode === "register" ? "Account yaratish" : "Kirish"}
              </button>

              <div className="text-xs text-white/50 leading-relaxed">
                {mode === "register" ? (
                  <>
                    Ulanadigan endpoint: <span className="text-white/65">POST /auth/register</span>
                  </>
                ) : (
                  <>
                    Ulanadigan endpoint: <span className="text-white/65">POST /auth/login</span>
                  </>
                )}
              </div>
            </form>

            <div className="mt-6 rounded-2xl border border-white/12 bg-white/5 p-4 text-white/70 text-sm">
              {mode === "register" ? (
                <>
                  Account bormi?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-white font-semibold hover:opacity-90 transition"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Yangi account kerakmi?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-white font-semibold hover:opacity-90 transition"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TabBtn({ active, onClick, text }: { active: boolean; onClick: () => void; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-10 px-4 rounded-xl text-sm font-semibold transition",
        active ? "bg-white/15 text-white border border-white/15" : "text-white/70 hover:text-white hover:bg-white/10",
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
    <div className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 flex items-center gap-3
                    focus-within:border-white/25 transition">
      <span className="shrink-0">{icon}</span>
      <input
        className="h-full w-full bg-transparent text-white outline-none placeholder:text-white/45"
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

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 backdrop-blur-xl p-4">
      <div className="text-white font-semibold">{title}</div>
      <div className="mt-1 text-white/65 text-sm">{desc}</div>
    </div>
  )
}
