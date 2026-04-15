import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  LogOut,
  Mail,
  PencilLine,
  Save,
  ShieldCheck,
  Sparkles,
  User2,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { formatUzPhoneInput } from "@/lib/phone"
import { clearAccessToken, getAccessToken, getAuthUser } from "@/shared/auth/token"
import { useI18n } from "@/shared/i18n/i18n"

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(17,24,39,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(53,89,170,0.34)_0%,rgba(17,27,52,0.96)_52%,rgba(30,55,104,0.9)_100%)] dark:shadow-[0_22px_50px_rgba(2,8,24,0.42)]"

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe3ef] bg-white/90 px-5 text-sm font-semibold text-[#1d2430] shadow-[0_12px_30px_rgba(17,24,39,0.08)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:shadow-[0_16px_34px_rgba(2,8,24,0.28)] dark:hover:bg-[rgba(24,43,80,0.94)]"

const panelClass =
  "rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,249,255,0.92)_100%)] shadow-[0_24px_70px_rgba(17,24,39,0.08)] backdrop-blur-xl dark:border-[#2f4a78] dark:bg-[linear-gradient(180deg,rgba(9,21,42,0.92)_0%,rgba(13,27,53,0.9)_100%)] dark:shadow-[0_32px_90px_rgba(2,8,24,0.46)]"

export default function Profile() {
  const navigate = useNavigate()
  const { language } = useI18n()
  const copy = {
    uz: {
      saved: "Profil ma'lumotlari saqlandi",
      badge: "Tripzy profili",
      logout: "Chiqish",
      accountStatus: "Akkaunt holati",
      active: "Faol",
      token: "Token",
      available: "Mavjud",
      missing: "Mavjud emas",
      support: "Yordam",
      premiumSupport: "24/7 premium",
      title: "Profil ma'lumotlari",
      desc: "Ma'lumotlaringizni yangilang va profilingizni tartibga keltiring.",
      cancel: "Cancel",
      edit: "Edit",
      name: "Ism",
      phone: "Telefon",
      email: "Email",
      emailHint: "Email hozircha o'zgartirilmaydi. Keyin OTP yoki email confirm qo'shiladi.",
      overview: "Profil ko'rinishi",
      status: "Holat",
      security: "Xavfsizlik",
      protected: "Himoyalangan",
      fare: "Tarif",
      premiumFare: "Premium",
      actions: "Tez amallar",
      actionsDesc: "Tahrirlashni yoqing, ism va telefonni yangilang, so'ng saqlang.",
      saveChanges: "O'zgarishlarni saqlash",
    },
    ru: {
      saved: "Данные профиля сохранены",
      badge: "Профиль Tripzy",
      logout: "Выход",
      accountStatus: "Статус аккаунта",
      active: "Активен",
      token: "Токен",
      available: "Есть",
      missing: "Нет",
      support: "Поддержка",
      premiumSupport: "24/7 Premium",
      title: "Данные профиля",
      desc: "Обновите информацию и приведите профиль в порядок.",
      cancel: "Отмена",
      edit: "Редактировать",
      name: "Имя",
      phone: "Телефон",
      email: "Email",
      emailHint: "Email пока нельзя изменить. Позже добавим OTP или подтверждение по email.",
      overview: "Обзор профиля",
      status: "Статус",
      security: "Безопасность",
      protected: "Защищено",
      fare: "Тариф",
      premiumFare: "Премиум",
      actions: "Быстрые действия",
      actionsDesc: "Включите редактирование, обновите имя и телефон, затем сохраните.",
      saveChanges: "Сохранить изменения",
    },
    en: {
      saved: "Profile details saved",
      badge: "Tripzy Profile",
      logout: "Logout",
      accountStatus: "Account status",
      active: "Active",
      token: "Token",
      available: "Available",
      missing: "Missing",
      support: "Support",
      premiumSupport: "24/7 Premium",
      title: "Profile details",
      desc: "Update your information and keep your profile organized.",
      cancel: "Cancel",
      edit: "Edit",
      name: "Name",
      phone: "Phone",
      email: "Email",
      emailHint: "Email cannot be changed yet. OTP or email confirmation will be added later.",
      overview: "Profile overview",
      status: "Status",
      security: "Security",
      protected: "Protected",
      fare: "Fare",
      premiumFare: "Premium",
      actions: "Quick actions",
      actionsDesc: "Enable editing, update your name and phone, then save.",
      saveChanges: "Save changes",
    },
  }[language]

  const storedUser = getAuthUser()
  const [name, setName] = useState(storedUser?.fullName || "Tripzy User")
  const [email] = useState(storedUser?.email || "user@tripzy.uz")
  const [phone, setPhone] = useState("+998")
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const token = useMemo(() => getAccessToken(), [])

  const logout = async () => {
    clearAccessToken()
    window.dispatchEvent(new Event("tripzy-auth"))
    navigate("/login")
  }

  const onSave = async () => {
    setLoading(true)
    try {
      setEditing(false)
      toast.success(copy.saved)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="secondary-page-shell relative overflow-hidden pt-24">
      <div className="secondary-page-overlay pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14 xl:px-8 2xl:max-w-[1680px]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={`overflow-hidden p-6 md:p-7 ${panelClass}`}
          >
            <div className="pointer-events-none absolute" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#627188] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#cfe0fb]">
                <span className="h-2 w-2 rounded-full bg-[#8A3A5A]" />
                {copy.badge}
              </div>

              <button onClick={logout} className={`h-11 ${secondaryButtonClass}`}>
                <LogOut size={16} />
                {copy.logout}
              </button>
            </div>

            <div className="mt-7 rounded-[26px] border border-[#e3eaf4] bg-[linear-gradient(135deg,#fbfdff_0%,#f5f9ff_42%,#f9f2f5_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,35,69,0.96)_0%,rgba(16,31,60,0.94)_42%,rgba(30,24,53,0.94)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-[linear-gradient(135deg,#eef5ff_0%,#e5eefc_100%)] text-[#31569e] shadow-[0_12px_30px_rgba(49,86,158,0.12)] dark:bg-[linear-gradient(135deg,rgba(39,72,133,0.9)_0%,rgba(26,47,87,0.96)_100%)] dark:text-[#d4e2fb] dark:shadow-[0_16px_34px_rgba(2,8,24,0.24)]">
                  <User2 size={28} />
                </div>
                <div className="min-w-0">
                  <div className="text-3xl font-extrabold leading-tight text-[#1d2430] dark:text-white">
                    {name}
                  </div>
                  <div className="mt-2 flex items-center gap-2 break-all text-sm text-[#627188] dark:text-[#a9bddb]">
                    <Mail size={16} className="text-[#7f8ea5]" />
                    {email}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <InfoPill title={copy.accountStatus} value={copy.active} accent="blue" icon={<ShieldCheck size={18} />} />
                <InfoPill title={copy.token} value={token ? copy.available : copy.missing} accent="rose" icon={<ShieldCheck size={18} />} />
                <InfoPill title={copy.support} value={copy.premiumSupport} accent="gold" icon={<Sparkles size={18} />} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className={`lg:col-span-2 p-6 md:p-7 ${panelClass}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1d2430] md:text-4xl dark:text-white">
                  {copy.title}
                </h1>
                <p className="mt-2 max-w-[620px] text-[#627188] dark:text-[#a9bddb]">
                  {copy.desc}
                </p>
              </div>

              <button
                onClick={() => setEditing((p) => !p)}
                className={`h-11 ${editing ? primaryButtonClass : secondaryButtonClass}`}
              >
                <PencilLine size={16} />
                {editing ? copy.cancel : copy.edit}
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <Field label={copy.name} icon={<User2 size={18} className="text-[#7f8ea5]" />} value={name} disabled={!editing} onChange={setName} />
              <Field label={copy.phone} icon={<User2 size={18} className="text-[#7f8ea5]" />} value={phone} disabled={!editing} onChange={(v) => setPhone(formatUzPhoneInput(v))} />
              <div className="md:col-span-2">
                <Field label={copy.email} icon={<Mail size={18} className="text-[#7f8ea5]" />} value={email} disabled onChange={() => {}} />
                <div className="mt-2 text-xs text-[#7b8aa0] dark:text-[#93abd0]">
                  {copy.emailHint}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[26px] border border-[#e3eaf4] bg-[linear-gradient(135deg,#fbfdff_0%,#f4f8ff_46%,#f8f2f5_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,35,69,0.96)_0%,rgba(16,31,60,0.94)_46%,rgba(30,24,53,0.94)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b8aa0] dark:text-[#93abd0]">
                  {copy.overview}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatCard label={copy.status} value={copy.active} />
                  <StatCard label={copy.security} value={copy.protected} />
                  <StatCard label={copy.fare} value={copy.premiumFare} />
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[26px] border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-5 dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(20,35,66,0.84)_0%,rgba(15,29,57,0.96)_100%)]">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b8aa0] dark:text-[#93abd0]">
                    {copy.actions}
                  </div>
                  <div className="mt-2 text-sm text-[#627188] dark:text-[#a9bddb]">
                    {copy.actionsDesc}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    disabled={!editing || loading}
                    onClick={onSave}
                    className={`h-12 w-full sm:w-auto ${primaryButtonClass}`}
                  >
                    <Save size={18} />
                    {loading ? "..." : copy.saveChanges}
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

function InfoPill({
  title,
  value,
  icon,
  accent,
}: {
  title: string
  value: string
  icon: React.ReactNode
  accent: "blue" | "rose" | "gold"
}) {
  const accentStyles = {
    blue: "bg-[linear-gradient(135deg,#f5f9ff_0%,#e8f1ff_100%)] border-[#dce7fb] text-[#31569e] dark:bg-[linear-gradient(135deg,rgba(30,55,104,0.92)_0%,rgba(20,35,66,0.96)_100%)] dark:border-[#4067a5] dark:text-[#d6e6ff]",
    rose: "bg-[linear-gradient(135deg,#fff7f9_0%,#fff0f3_100%)] border-[#f1d9df] text-[#9b506b] dark:bg-[linear-gradient(135deg,rgba(69,34,71,0.94)_0%,rgba(38,28,59,0.96)_100%)] dark:border-[#6d4c8f] dark:text-[#f3d7ea]",
    gold: "bg-[linear-gradient(135deg,#fffaf2_0%,#fff2db_100%)] border-[#f0e0b8] text-[#93631a] dark:bg-[linear-gradient(135deg,rgba(73,54,22,0.94)_0%,rgba(39,32,25,0.96)_100%)] dark:border-[#7d6632] dark:text-[#f5e2a8]",
  } as const

  return (
    <div
      className={`rounded-2xl border p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:shadow-[0_16px_34px_rgba(2,8,24,0.28)] ${accentStyles[accent]}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 dark:bg-[rgba(255,255,255,0.08)]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.14em] text-[#7b8aa0] dark:text-[#93abd0]">{title}</div>
          <div className="font-semibold text-[#1d2430] dark:text-white">{value}</div>
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
      <div className="mb-2 text-xs text-[#7b8aa0] dark:text-[#93abd0]">{label}</div>
      <div
        className={[
          "flex h-12 w-full items-center gap-3 rounded-2xl border border-[#dbe3ef] bg-white px-4 shadow-[0_8px_20px_rgba(17,24,39,0.04)] transition dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:shadow-[0_16px_34px_rgba(2,8,24,0.22)]",
          disabled ? "opacity-80" : "focus-within:border-[#c7d4e7] dark:focus-within:border-[#537dc2]",
        ].join(" ")}
      >
        <span className="shrink-0">{icon}</span>
        <input
          className="h-full w-full bg-transparent text-[#1d2430] outline-none placeholder:text-[#97a5ba] dark:text-white dark:placeholder:text-[#8ba4ca]"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dde5f0] bg-white/85 p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:shadow-[0_16px_34px_rgba(2,8,24,0.22)]">
      <div className="text-xs uppercase tracking-[0.14em] text-[#7b8aa0] dark:text-[#93abd0]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#1d2430] dark:text-white">{value}</div>
    </div>
  )
}
