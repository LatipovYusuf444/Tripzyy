import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Mail, User2, ShieldCheck, LogOut, PencilLine, Save } from "lucide-react"
import { useNavigate } from "react-router-dom"
// import { http } from "@/shared/api/http" // ✅ backend ulaganda ochasan

export default function Profile() {
  const navigate = useNavigate()

  // ✅ demo user (keyin backenddan keladi)
  const [name, setName] = useState("Tripzy User")
  const [email] = useState("user@tripzy.uz")
  const [phone, setPhone] = useState("+998 90 000 00 00")
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const token = useMemo(() => localStorage.getItem("access_token"), [])

  const logout = async () => {
    localStorage.removeItem("access_token")
    window.dispatchEvent(new Event("tripzy-auth"))
    navigate("/register")
  }

  const onSave = async () => {
    setLoading(true)
    try {
      // ✅ BACKENDGA ULANDA:
      // const res = await http.get("/me")
      // setName(res.data.name) ...
      //
      // await http.patch("/me", { name, phone })

      setEditing(false)
      alert("Demo: Profil saqlandi ✅ (keyin backendga ulanadi)")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative overflow-hidden pt-24">
      {/* light luxury bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A5B86] via-[#0b1b2b] to-[#0A1220]" />
      <div className="pointer-events-none absolute -top-44 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-white/12 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-56 right-[-160px] h-[560px] w-[560px] rounded-full bg-[#FF7A00]/12 blur-[160px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 md:p-7 shadow-[0_45px_140px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white/85">
                <span className="h-2 w-2 rounded-full bg-[#FF7A00]" />
                TRIPZY • Profile
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-white/85
                           hover:bg-white/12 transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

            <div className="mt-6">
              <div className="text-3xl font-extrabold text-white leading-tight">
                {name}
              </div>
              <div className="mt-2 text-white/70 flex items-center gap-2">
                <Mail size={16} className="text-white/70" />
                {email}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3">
              <InfoPill title="Account status" value="Active" icon={<ShieldCheck size={18} />} />
              <InfoPill title="Token (demo)" value={token ? "Available" : "Missing"} icon={<ShieldCheck size={18} />} />
              <InfoPill title="Support" value="24/7 Premium" icon={<ShieldCheck size={18} />} />
            </div>

            <div className="mt-7 rounded-2xl border border-white/12 bg-white/5 p-4 text-white/70 text-sm">
              TODO: Backend ulanganida bu yerga: booking history, payment status, real user data chiqadi.
            </div>
          </motion.div>

          {/* right card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="lg:col-span-2 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 md:p-7 shadow-[0_45px_140px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">Profil ma’lumotlari</h1>
                <p className="mt-2 text-white/70">
                  Ma’lumotlaringizni yangilang. (Hozir demo, keyin backendga ulanadi.)
                </p>
              </div>

              <button
                onClick={() => setEditing((p) => !p)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-white/85
                           hover:bg-white/12 transition"
              >
                <PencilLine size={16} />
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Ism"
                icon={<User2 size={18} className="text-white/75" />}
                value={name}
                disabled={!editing}
                onChange={setName}
              />
              <Field
                label="Telefon"
                icon={<User2 size={18} className="text-white/75" />}
                value={phone}
                disabled={!editing}
                onChange={setPhone}
              />
              <div className="md:col-span-2">
                <Field
                  label="Email"
                  icon={<Mail size={18} className="text-white/75" />}
                  value={email}
                  disabled={true}
                  onChange={() => {}}
                />
                <div className="mt-2 text-xs text-white/50">
                  Email hozircha o‘zgartirilmaydi. Keyin OTP/email confirm qo‘shamiz.
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                disabled={!editing || loading}
                onClick={onSave}
                className="h-12 px-6 rounded-2xl bg-[#FF7A00] font-semibold text-white
                           hover:opacity-90 transition disabled:opacity-60
                           shadow-[0_18px_60px_rgba(255,122,0,0.25)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Save size={18} />
                  {loading ? "..." : "Save changes"}
                </span>
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/12 bg-white/5 p-4 text-white/70 text-sm">
              ✅ Backend ulanganida:
              <div className="mt-2 text-white/60 text-xs leading-relaxed">
                - GET <span className="text-white/75">/me</span> → user ma’lumotlarini olish<br />
                - PATCH <span className="text-white/75">/me</span> → name/phone update<br />
                - GET <span className="text-white/75">/bookings</span> → bronlar tarixi
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function InfoPill({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/12 grid place-items-center">
          {icon}
        </div>
        <div>
          <div className="text-white/60 text-xs">{title}</div>
          <div className="text-white font-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  value,
  disabled,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  value: string
  disabled: boolean
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="text-xs text-white/60 mb-2">{label}</div>
      <div
        className={[
          "h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 flex items-center gap-3 transition",
          disabled ? "opacity-80" : "focus-within:border-white/25",
        ].join(" ")}
      >
        <span className="shrink-0">{icon}</span>
        <input
          className="h-full w-full bg-transparent text-white outline-none placeholder:text-white/45"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
