import { useEffect, useMemo, useState } from "react"
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
import { getStoredTheme, type SiteTheme } from "@/shared/theme/theme"

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
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(() => getStoredTheme())

  const token = useMemo(() => getAccessToken(), [])

  useEffect(() => {
    const syncTheme = () => setSiteTheme(getStoredTheme())

    syncTheme()
    window.addEventListener("storage", syncTheme)
    window.addEventListener("tripzy-theme-change", syncTheme as EventListener)

    return () => {
      window.removeEventListener("storage", syncTheme)
      window.removeEventListener("tripzy-theme-change", syncTheme as EventListener)
    }
  }, [])

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

  const isDarkTheme = siteTheme === "dark"
  const pageClass = isDarkTheme
    ? "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(54,103,199,0.22)_0%,rgba(9,24,54,0)_34%),linear-gradient(180deg,#07152f_0%,#0b1e42_46%,#061226_100%)] pt-4 text-white md:pt-6"
    : "relative min-h-screen overflow-hidden bg-[#EEF1FB] pt-4 text-[#111A34] md:pt-6"
  const glowClass = isDarkTheme
    ? "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(92,154,255,0.2)_0%,rgba(92,154,255,0)_30%),radial-gradient(circle_at_84%_12%,rgba(125,167,255,0.12)_0%,rgba(125,167,255,0)_34%)]"
    : "hidden"
  const panelToneClass = isDarkTheme
    ? "rounded-[30px] border border-[#5d7fba]/45 bg-[linear-gradient(180deg,rgba(18,38,76,0.72)_0%,rgba(9,24,54,0.58)_100%)] shadow-[0_32px_90px_rgba(2,8,24,0.46)] backdrop-blur-[18px]"
    : "rounded-[30px] border border-[#E3E8F7] bg-[#F7F9FF] shadow-[0_24px_70px_rgba(70,90,140,0.10)]"
  const secondaryBtnToneClass = isDarkTheme
    ? "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#5d7fba]/55 bg-[linear-gradient(180deg,rgba(20,42,84,0.78)_0%,rgba(9,24,54,0.62)_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(2,8,24,0.34)] backdrop-blur-[14px] transition hover:bg-[rgba(36,67,122,0.78)] disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E3E8F7] bg-[#F7F9FF] px-5 text-sm font-semibold text-[#111A34] shadow-[0_12px_30px_rgba(70,90,140,0.10)] transition hover:bg-[#EEF1FB] disabled:cursor-not-allowed disabled:opacity-60"
  const primaryBtnToneClass = isDarkTheme
    ? "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#6ea8ff]/45 bg-[linear-gradient(135deg,rgba(74,143,255,0.72)_0%,rgba(36,98,220,0.88)_54%,rgba(19,49,121,0.92)_100%)] px-5 text-sm font-semibold text-white shadow-[0_22px_50px_rgba(2,8,24,0.42)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1d4ed8]/20 bg-[linear-gradient(135deg,#2f8cff_0%,#2563eb_54%,#1d4ed8_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(37,99,235,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
  const badgeClass = isDarkTheme
    ? "inline-flex items-center gap-2 rounded-full border border-[#5d7fba]/45 bg-[rgba(13,30,62,0.56)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4e2fb]"
    : "inline-flex items-center gap-2 rounded-full border border-[#E3E8F7] bg-[#F7F9FF] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F7898] shadow-[0_8px_22px_rgba(70,90,140,0.08)]"
  const innerCardClass = isDarkTheme
    ? "rounded-[26px] border border-[#5d7fba]/45 bg-[linear-gradient(135deg,rgba(18,38,76,0.76)_0%,rgba(9,24,54,0.56)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(2,8,24,0.34)] backdrop-blur-[16px]"
    : "rounded-[26px] border border-[#E3E8F7] bg-[#F2F5FD] p-5 shadow-[0_18px_46px_rgba(70,90,140,0.08)]"
  const mutedTextClass = isDarkTheme ? "text-[#a9bddb]" : "text-[#627188]"
  const labelTextClass = isDarkTheme ? "text-[#b9cceb]" : "text-[#64748b]"
  const headingTextClass = isDarkTheme ? "text-white" : "text-[#0f172a]"

  return (
    <section className={pageClass}>
      <div className={glowClass} />

      <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8 2xl:max-w-[1680px]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={`overflow-hidden p-6 md:p-7 ${panelToneClass}`}
          >
            <div className="pointer-events-none absolute" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={badgeClass}>
                <span className={`h-2 w-2 rounded-full ${isDarkTheme ? "bg-[#8fd0ff]" : "bg-[#2f8cff]"}`} />
                {copy.badge}
              </div>

              <button onClick={logout} className={`h-11 ${secondaryBtnToneClass}`}>
                <LogOut size={16} />
                {copy.logout}
              </button>
            </div>

            <div className={`mt-7 ${innerCardClass}`}>
              <div className="flex items-start gap-4">
                <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border shadow-[0_12px_30px_rgba(49,86,158,0.12)] ${isDarkTheme ? "border-[#5d7fba]/42 bg-[rgba(42,82,150,0.28)] text-[#d4e2fb]" : "border-[#dbe8fb] bg-white text-[#31569e]"}`}>
                  <User2 size={28} />
                </div>
                <div className="min-w-0">
                  <div className={`text-3xl font-extrabold leading-tight ${headingTextClass}`}>
                    {name}
                  </div>
                  <div className={`mt-2 flex items-center gap-2 break-all text-sm ${mutedTextClass}`}>
                    <Mail size={16} className={isDarkTheme ? "text-[#9fc7ff]" : "text-[#7f8ea5]"} />
                    {email}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <InfoPill title={copy.accountStatus} value={copy.active} accent="blue" icon={<ShieldCheck size={18} />} isDark={isDarkTheme} />
                <InfoPill title={copy.token} value={token ? copy.available : copy.missing} accent="rose" icon={<ShieldCheck size={18} />} isDark={isDarkTheme} />
                <InfoPill title={copy.support} value={copy.premiumSupport} accent="gold" icon={<Sparkles size={18} />} isDark={isDarkTheme} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className={`lg:col-span-2 p-6 md:p-7 ${panelToneClass}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className={`text-3xl font-extrabold md:text-4xl ${headingTextClass}`}>
                  {copy.title}
                </h1>
                <p className={`mt-2 max-w-[620px] ${mutedTextClass}`}>
                  {copy.desc}
                </p>
              </div>

              <button
                onClick={() => setEditing((p) => !p)}
                className={`h-11 ${editing ? primaryBtnToneClass : secondaryBtnToneClass}`}
              >
                <PencilLine size={16} />
                {editing ? copy.cancel : copy.edit}
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <Field label={copy.name} icon={<User2 size={18} />} value={name} disabled={!editing} onChange={setName} isDark={isDarkTheme} />
              <Field label={copy.phone} icon={<User2 size={18} />} value={phone} disabled={!editing} onChange={(v) => setPhone(formatUzPhoneInput(v))} isDark={isDarkTheme} />
              <div className="md:col-span-2">
                <Field label={copy.email} icon={<Mail size={18} />} value={email} disabled onChange={() => {}} isDark={isDarkTheme} />
                <div className={`mt-2 text-xs ${labelTextClass}`}>
                  {copy.emailHint}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className={innerCardClass}>
                <div className={`text-sm font-semibold uppercase tracking-[0.16em] ${labelTextClass}`}>
                  {copy.overview}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatCard label={copy.status} value={copy.active} isDark={isDarkTheme} />
                  <StatCard label={copy.security} value={copy.protected} isDark={isDarkTheme} />
                  <StatCard label={copy.fare} value={copy.premiumFare} isDark={isDarkTheme} />
                </div>
              </div>

              <div className={`flex flex-col justify-between ${innerCardClass}`}>
                <div>
                  <div className={`text-sm font-semibold uppercase tracking-[0.16em] ${labelTextClass}`}>
                    {copy.actions}
                  </div>
                  <div className={`mt-2 text-sm ${mutedTextClass}`}>
                    {copy.actionsDesc}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    disabled={!editing || loading}
                    onClick={onSave}
                    className={`h-12 w-full sm:w-auto ${primaryBtnToneClass}`}
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
  isDark,
}: {
  title: string
  value: string
  icon: React.ReactNode
  accent: "blue" | "rose" | "gold"
  isDark: boolean
}) {
  const accentStyles = isDark
    ? {
        blue: "border-[#5d7fba]/45 bg-[linear-gradient(135deg,rgba(30,55,104,0.72)_0%,rgba(13,30,62,0.58)_100%)] text-[#d6e6ff]",
        rose: "border-[#6d7fb3]/40 bg-[linear-gradient(135deg,rgba(42,48,94,0.66)_0%,rgba(13,30,62,0.58)_100%)] text-[#f3d7ea]",
        gold: "border-[#7d8ab8]/38 bg-[linear-gradient(135deg,rgba(59,60,91,0.62)_0%,rgba(13,30,62,0.58)_100%)] text-[#f5e2a8]",
      }
    : {
        blue: "border-[#E3E8F7] bg-[#F7F9FF] text-[#5C7CFA]",
        rose: "border-[#E3E8F7] bg-[#F7F9FF] text-[#9b506b]",
        gold: "border-[#E3E8F7] bg-[#F7F9FF] text-[#93631a]",
      }

  return (
    <div
      className={`rounded-2xl border p-4 ${isDark ? "shadow-[0_16px_34px_rgba(2,8,24,0.28)] backdrop-blur-[14px]" : "shadow-[0_10px_24px_rgba(17,24,39,0.05)]"} ${accentStyles[accent]}`}
    >
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl border text-current ${isDark ? "border-[#5d7fba]/30 bg-[rgba(255,255,255,0.08)]" : "border-[#E3E8F7] bg-[#F7F9FF] shadow-[0_8px_18px_rgba(70,90,140,0.08)]"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className={`text-xs uppercase tracking-[0.14em] ${isDark ? "text-[#b9cceb]" : "text-[#64748b]"}`}>{title}</div>
          <div className={`font-semibold ${isDark ? "text-white" : "text-[#0f172a]"}`}>{value}</div>
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
  isDark,
}: {
  label: string
  icon: React.ReactNode
  value: string
  disabled: boolean
  onChange: (v: string) => void
  isDark: boolean
}) {
  return (
    <div>
      <div className={`mb-2 text-xs ${isDark ? "text-[#b9cceb]" : "text-[#64748b]"}`}>{label}</div>
      <div
        className={[
          "flex h-12 w-full items-center gap-3 rounded-2xl border px-4 transition",
          isDark
            ? "border-[#5d7fba]/45 bg-[rgba(13,30,62,0.58)] shadow-[0_16px_34px_rgba(2,8,24,0.22)] backdrop-blur-[12px]"
            : "border-[#dbe3ef] bg-white shadow-[0_8px_20px_rgba(17,24,39,0.04)]",
          disabled ? "opacity-90" : isDark ? "focus-within:border-[#78b8ff]" : "focus-within:border-[#8ebcff]",
        ].join(" ")}
      >
        <span className={`shrink-0 ${isDark ? "text-[#9fc7ff]" : "text-[#64748b]"}`}>{icon}</span>
        <input
          className={`h-full w-full bg-transparent outline-none ${isDark ? "text-white placeholder:text-[#9fb8e4]" : "text-[#0f172a] placeholder:text-[#64748b]"}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-[#5d7fba]/42 bg-[rgba(13,30,62,0.58)] shadow-[0_16px_34px_rgba(2,8,24,0.22)] backdrop-blur-[12px]" : "border-[#dde5f0] bg-white shadow-[0_10px_24px_rgba(17,24,39,0.05)]"}`}>
      <div className={`text-xs uppercase tracking-[0.14em] ${isDark ? "text-[#b9cceb]" : "text-[#64748b]"}`}>{label}</div>
      <div className={`mt-1 text-lg font-semibold ${isDark ? "text-white" : "text-[#0f172a]"}`}>{value}</div>
    </div>
  )
}
