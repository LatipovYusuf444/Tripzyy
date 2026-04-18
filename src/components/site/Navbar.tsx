import { useEffect, useMemo, useRef, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown,
  LogOut,
  Menu,
  MoonStar,
  SunMedium,
  UserCircle2,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import logoImage from "@/assets/images/logo.png"
import {
  clearAccessToken,
  getAccessToken,
  getAuthUser,
  type StoredAuthUser,
} from "@/shared/auth/token"
import { bookingCart } from "@/shared/store/bookingCart"
import {
  getStoredTheme,
  setTheme as setSiteTheme,
  type SiteTheme,
} from "@/shared/theme/theme"
import { useI18n } from "@/shared/i18n/i18n"

const backdropVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
}

const menuVariants = {
  closed: { opacity: 0, y: 24, scale: 0.98 },
  open: { opacity: 1, y: 0, scale: 1 },
}

const actionBtnClass =
  "h-10 rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.1em] transition hover:brightness-110 " +
  "border-[rgba(122,164,255,0.32)] bg-[linear-gradient(180deg,rgba(14,29,67,0.9)_0%,rgba(11,24,58,0.82)_100%)] text-white shadow-[0_18px_34px_rgba(5,12,30,0.34)] backdrop-blur-[18px]"


const compactNavbarLightClass =
  "border-b border-[#e6eef8] bg-white shadow-[0_8px_28px_rgba(17,24,39,0.07)]"

const compactNavbarDarkClass =
  "border-b border-transparent bg-[linear-gradient(180deg,rgba(8,18,44,0.97)_0%,rgba(5,11,30,0.94)_100%)] shadow-[0_14px_38px_rgba(2,8,24,0.50)] backdrop-blur-[22px]"

const compactControlLightClass =
  "border border-[#dde8f5] bg-white text-[#0f172a] shadow-[0_4px_14px_rgba(0,40,120,0.06)]"

const compactControlDarkClass =
  "border border-[#4a6799]/80 bg-[linear-gradient(180deg,rgba(12,26,58,0.96)_0%,rgba(7,16,40,0.92)_100%)] text-white shadow-[0_14px_30px_rgba(2,8,24,0.42)] backdrop-blur-[18px]"

const compactActionLightClass =
  "h-9 rounded-full border border-[#dde8f5] !bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_4px_12px_rgba(0,40,120,0.08)] transition hover:!bg-white"

const compactActionDarkClass =
  "h-9 rounded-full border border-[#5a78b1]/80 !bg-[linear-gradient(180deg,rgba(14,30,66,0.98)_0%,rgba(8,18,44,0.96)_100%)] px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_16px_34px_rgba(2,8,24,0.46)] transition hover:brightness-110"

const homeActionBtnBaseClass =
  "h-10 rounded-full border px-5 text-[10px] font-semibold uppercase tracking-[0.1em] transition"

const homeActionBtnLightClass =
  `${homeActionBtnBaseClass} border-[#d8e3f0] !bg-[#ffffff] text-white shadow-[0_8px_22px_rgba(49,87,143,0.12)] hover:!bg-[#ffffff]`

const homeActionBtnDarkClass =
  `${homeActionBtnBaseClass} border-[#5d7fba]/65 bg-[linear-gradient(180deg,rgba(10,22,52,0.97)_0%,rgba(6,13,34,0.94)_100%)] text-white shadow-[0_18px_42px_rgba(2,8,24,0.52)] backdrop-blur-[14px] hover:brightness-110`

const homeGlassBtnLightClass =
  "border border-[#d8e3f0] !bg-[#ffffff] text-[#0f172a] shadow-[0_8px_22px_rgba(49,87,143,0.12)] transition hover:!bg-[#ffffff]"

const homeGlassBtnDarkClass =
  "border border-[#5d7fba]/65 bg-[linear-gradient(180deg,rgba(10,22,52,0.96)_0%,rgba(6,13,34,0.92)_100%)] text-white shadow-[0_18px_42px_rgba(2,8,24,0.48)] backdrop-blur-[14px] transition hover:bg-[rgba(16,34,72,0.98)]"

type NavLinkItem = {
  to: string
  label: string
  icon?: LucideIcon
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === "/"
  const isCompactNavbar = !isHome
  const { language, setLanguage } = useI18n()
  const languageMenuRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [user, setUser] = useState<StoredAuthUser | null>(() => getAuthUser())
  const [theme, setTheme] = useState<SiteTheme>(() => getStoredTheme())
  const [paxCount, setPaxCount] = useState<number>(
    () => bookingCart.get().passengers.length
  )

  const authed = useMemo(() => !!token, [token])

  useEffect(() => {
    const syncAuthState = () => {
      setToken(getAccessToken())
      setUser(getAuthUser())
    }

    window.addEventListener("storage", syncAuthState)
    window.addEventListener("tripzy-auth", syncAuthState as EventListener)

    return () => {
      window.removeEventListener("storage", syncAuthState)
      window.removeEventListener("tripzy-auth", syncAuthState as EventListener)
    }
  }, [])

  useEffect(() => {
    const read = () => setPaxCount(bookingCart.get().passengers.length)

    read()
    window.addEventListener("storage", read)
    window.addEventListener("booking_cart_changed", read as EventListener)

    return () => {
      window.removeEventListener("storage", read)
      window.removeEventListener("booking_cart_changed", read as EventListener)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current) return
      if (!languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageMenuOpen(false)
    }

    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("keydown", onEscape)

    return () => {
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("keydown", onEscape)
    }
  }, [])

  useEffect(() => {
    const syncTheme = () => setTheme(getStoredTheme())

    syncTheme()
    window.addEventListener("storage", syncTheme)
    window.addEventListener("tripzy-theme-change", syncTheme as EventListener)

    return () => {
      window.removeEventListener("storage", syncTheme)
      window.removeEventListener(
        "tripzy-theme-change",
        syncTheme as EventListener
      )
    }
  }, [])

  const goAuth = () => {
    setOpen(false)
    navigate("/login")
  }

  const goProfile = () => {
    setOpen(false)
    navigate("/profile")
  }

  const logout = () => {
    clearAccessToken()
    setToken(null)
    setUser(null)
    setOpen(false)
    window.dispatchEvent(new Event("tripzy-auth"))
    navigate("/login")
  }

  const userInitials = useMemo(() => {
    if (!user?.fullName) return "TZ"

    return user.fullName
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }, [user])

const userMemberLabel =
    language === "uz"
      ? "Tripzy a'zosi"
      : language === "ru"
        ? "Участник Tripzy"
        : "Tripzy member"

  const onToggleTheme = () => {
    const nextTheme: SiteTheme = theme === "dark" ? "light" : "dark"
    setTheme(setSiteTheme(nextTheme))
  }

  const copy = {
    uz: {
      leftLinks: [
        { to: "/flights", label: "Reyslar" },
        { to: "/about", label: "Biz haqimizda" },
      ] as NavLinkItem[],
      rightLinks: [
        { to: "/services", label: "Xizmatlar" },
        { to: "/contact", label: "Kontakt" },
      ] as NavLinkItem[],
      home: "Bosh sahifa",
      themeDark: "Tungi",
      themeLight: "Yorug'",
      login: "Kirish",
      profile: "Profil",
      logout: "Chiqish",
      menu: "Menyu",
      navigation: "Navigatsiya",
      darkMode: "Tungi rejim",
      lightMode: "Yorug' rejim",
      openMenu: "Menyuni ochish",
      closeMenu: "Menyuni yopish",
      switchTheme: "Temani almashtirish",
    },
    ru: {
      leftLinks: [
        { to: "/flights", label: "Рейсы" },
        { to: "/about", label: "О нас" },
      ] as NavLinkItem[],
      rightLinks: [
        { to: "/services", label: "Услуги" },
        { to: "/contact", label: "Контакты" },
      ] as NavLinkItem[],
      home: "Главная Tripzy",
      themeDark: "Dark",
      themeLight: "Light",
      login: "Вход",
      profile: "Профиль",
      logout: "Выход",
      menu: "Меню",
      navigation: "Навигация",
      darkMode: "Темный режим",
      lightMode: "Светлый режим",
      openMenu: "Открыть меню",
      closeMenu: "Закрыть меню",
      switchTheme: "Переключить тему",
    },
    en: {
      leftLinks: [
        { to: "/flights", label: "Flights" },
        { to: "/about", label: "About" },
      ] as NavLinkItem[],
      rightLinks: [
        { to: "/services", label: "Services" },
        { to: "/contact", label: "Contact" },
      ] as NavLinkItem[],
      home: "Tripzy home",
      themeDark: "Dark",
      themeLight: "Light",
      login: "Login",
      profile: "Profile",
      logout: "Logout",
      menu: "Menu",
      navigation: "Navigation",
      darkMode: "Dark mode",
      lightMode: "Light mode",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      switchTheme: "Switch theme",
    },
  }[language]

  const desktopLinks = [...copy.leftLinks, ...copy.rightLinks]
  const mobileLinks = [...copy.leftLinks, ...copy.rightLinks]
  const otherLanguages = (["uz", "ru", "en"] as const).filter(
    (lang) => lang !== language
  )
  const homeGlassBtnClass =
    theme === "dark" ? homeGlassBtnDarkClass : homeGlassBtnLightClass
  const homeActionBtnClass =
    theme === "dark" ? homeActionBtnDarkClass : homeActionBtnLightClass
  const homeLanguageShellClass =
    theme === "dark"
      ? "border border-[#5d7fba]/65 bg-[linear-gradient(180deg,rgba(10,22,52,0.96)_0%,rgba(6,13,34,0.92)_100%)] p-0.5 shadow-[0_18px_42px_rgba(2,8,24,0.48)] backdrop-blur-[14px]"
      : "border border-[#d8e3f0] !bg-[#ffffff] p-0.5 shadow-[0_8px_22px_rgba(49,87,143,0.12)]"
  const compactNavbarGlassClass =
    theme === "dark" ? compactNavbarDarkClass : compactNavbarLightClass
  const compactControlGlassClass =
    theme === "dark" ? compactControlDarkClass : compactControlLightClass
  const compactActionBtnClass =
    theme === "dark" ? compactActionDarkClass : compactActionLightClass
  const compactLanguageShellClass =
    theme === "dark"
      ? "border border-[#4a6799]/80 bg-[rgba(8,18,44,0.96)] p-0.5 shadow-[0_14px_30px_rgba(2,8,24,0.44)] backdrop-blur-[14px]"
      : "border border-[#dde8f5] bg-white p-0.5 shadow-[0_4px_14px_rgba(0,40,120,0.06)]"
  const compactDropdownPanelClass =
    theme === "dark"
      ? "border border-[#5a78b1]/70 bg-[linear-gradient(180deg,rgba(8,18,46,0.99)_0%,rgba(5,12,32,0.98)_100%)] shadow-[0_22px_50px_rgba(2,8,24,0.58)]"
      : "border border-[#dde8f5] bg-white shadow-[0_18px_40px_rgba(0,60,180,0.12)]"
  const compactDropdownItemClass =
    theme === "dark"
      ? "text-white/82 hover:bg-white/10 hover:text-white"
      : "text-[#0f172a] hover:bg-[#e8f0fc] hover:text-[#0052a5]"
  const compactControlHoverClass =
    theme === "dark" ? "hover:bg-[rgba(36,67,122,0.78)]" : "hover:bg-[#f8fbff]"

  return (
    <header className="fixed inset-x-0 top-0 z-100">
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={[
          isCompactNavbar
            ? "w-full px-4 py-3 transition-[background-color,border-color,box-shadow] duration-300 md:px-6 md:py-3 lg:px-10 lg:py-7 xl:py-8"
            : isHome
              ? "w-full px-4 pb-4 pt-7 transition-[background-color,border-color,box-shadow] duration-300 md:px-6 md:pb-4 md:pt-8 lg:py-2.5"
              : "w-full px-4 py-4 transition-[background-color,border-color,box-shadow] duration-300 md:px-6 md:py-4 lg:py-2.5",
          isHome
            ? "border-b border-transparent bg-transparent shadow-none"
            : compactNavbarGlassClass,
        ].join(" ")}
      >
        <div className={`mx-auto flex !max-w-[1640px] items-center justify-between gap-4 ${isCompactNavbar ? "lg:gap-8" : "lg:gap-10"}`}>
          <Link
            to="/"
            className={`hidden shrink-0 items-center justify-center lg:flex ${isCompactNavbar ? "tripzy-logo-crop-mobile overflow-hidden" : ""}`}
            onClick={() => setOpen(false)}
            aria-label={copy.home}
          >
            <img
              src={logoImage}
              alt="Tripzy logo"
              className={
                isCompactNavbar
                  ? "tripzy-logo-image-mobile block h-auto max-w-none object-contain"
                  : "block h-auto object-contain drop-shadow-[0_12px_30px_rgba(3,8,24,0.32)] transition-[filter,transform] duration-300 dark:drop-shadow-[0_14px_30px_rgba(2,8,24,0.40)] !w-[334px]"
              }
            />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center lg:flex">
            <div className={`flex min-w-0 flex-1 items-center justify-center ${isCompactNavbar ? "gap-5 px-3 xl:gap-7 xl:px-5 2xl:gap-8 2xl:px-8" : "gap-5 px-6 xl:gap-8 xl:px-10 2xl:gap-9 2xl:px-14"}`}>
              {desktopLinks.map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  icon={link.icon}
                  badge={link.to === "/checkout" ? paxCount : 0}
                  isHome={isHome}
                  theme={theme}
                  forceDark={false}
                />
              ))}
            </div>

            <div className={`flex shrink-0 items-center ${isCompactNavbar ? "ml-4 gap-2.5 xl:ml-6" : "ml-8 gap-3.5 xl:ml-10"}`}>
              <div
                ref={languageMenuRef}
                className="relative"
              >
                <div
                  className={`flex items-center gap-1 rounded-full ${isCompactNavbar ? compactLanguageShellClass : homeLanguageShellClass}`}
                >
                  <button
                    type="button"
                    onClick={() => setLanguageMenuOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={languageMenuOpen}
                    className={`inline-flex items-center gap-2 rounded-full font-bold uppercase tracking-[0.06em] transition-all duration-200 ${isCompactNavbar ? compactControlGlassClass : `${homeGlassBtnClass}`} ${isCompactNavbar ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-[11px]"}`}
                  >
                    <span>{language}</span>
                    <ChevronDown
                      size={isCompactNavbar ? 12 : 14}
                      className={`text-current/70 transition ${languageMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {languageMenuOpen ? (
                    <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                    className={`absolute left-0 top-[calc(100%+10px)] z-[120] min-w-[132px] overflow-hidden rounded-[20px] p-2 backdrop-blur-[18px] ${isCompactNavbar ? compactDropdownPanelClass : "border border-[#d7e4f4] bg-white/90 shadow-[0_18px_40px_rgba(49,87,143,0.12)] dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(17,33,66,0.95)_0%,rgba(17,33,66,0.92)_100%)] dark:shadow-[0_22px_50px_rgba(2,8,24,0.32)]"}`}
                    >
                      {otherLanguages.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setLanguage(lang)
                            setLanguageMenuOpen(false)
                          }}
                          className={`flex w-full items-center rounded-[14px] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] transition ${isCompactNavbar ? compactDropdownItemClass : "text-[#2a3a58] hover:bg-[#e8f0fc] hover:text-[#0052a5] dark:text-white/82 dark:hover:bg-white/8 dark:hover:text-white"}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <button
                type="button"
                aria-label={copy.switchTheme}
                onClick={onToggleTheme}
                className={`inline-flex items-center gap-2 rounded-full font-semibold uppercase tracking-[0.08em] transition ${isCompactNavbar ? `${compactControlGlassClass} ${compactControlHoverClass}` : homeGlassBtnClass} ${isCompactNavbar ? "h-9 px-3 text-[10px]" : "h-11 px-4 text-[11px]"}`}
              >
                {theme === "dark" ? <SunMedium size={isCompactNavbar ? 12 : 14} /> : <MoonStar size={isCompactNavbar ? 12 : 14} />}
                {theme === "dark" ? copy.themeLight : copy.themeDark}
              </button>

              {!authed ? (
                  <Button
                    onClick={goAuth}
                    className={isCompactNavbar ? compactActionBtnClass : isHome ? homeActionBtnClass : `${actionBtnClass} px-5`}
                  >
                  {copy.login}
                </Button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={goProfile}
                    className={`grid shrink-0 place-items-center rounded-full font-bold uppercase tracking-[0.12em] transition hover:opacity-80 ${isCompactNavbar ? compactControlGlassClass : homeGlassBtnClass} ${isCompactNavbar ? "h-9 w-9 text-[10px]" : "h-10 w-10 text-[11px]"}`}
                  >
                    {userInitials}
                  </button>
                  <Button
                    onClick={logout}
                    className={isCompactNavbar ? compactActionBtnClass : isHome ? homeActionBtnClass : actionBtnClass}
                  >
                    <LogOut className="mr-1.5" size={14} />
                    {copy.logout}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/"
            className={`flex items-center justify-start overflow-hidden lg:hidden ${isCompactNavbar ? "tripzy-logo-crop-mobile" : "tripzy-logo-crop-home-mobile"}`}
            onClick={() => setOpen(false)}
            aria-label={copy.home}
          >
            <img
              src={logoImage}
              alt="Tripzy logo"
              className={`block h-auto max-w-none object-contain ${isCompactNavbar ? "tripzy-logo-image-mobile" : "tripzy-logo-image-home-mobile"}`}
            />
          </Link>

          <button
            type="button"
            aria-label={copy.openMenu}
            onClick={() => setOpen((value) => !value)}
            className={`ml-auto inline-flex items-center justify-center rounded-2xl transition lg:hidden ${isCompactNavbar ? compactControlGlassClass : "border border-[#d7e4f4] bg-white/64 text-[#111827] shadow-[0_8px_20px_rgba(49,87,143,0.10)] hover:bg-white/80 dark:border-[#5d7fba]/50 dark:bg-[linear-gradient(180deg,rgba(20,42,84,0.72)_0%,rgba(9,24,54,0.56)_100%)] dark:text-white dark:shadow-[0_18px_42px_rgba(2,8,24,0.32)]"} ${isCompactNavbar ? "h-11 w-11" : "h-12 w-12"}`}
          >
            {open ? <X size={isCompactNavbar ? 22 : 22} /> : <Menu size={isCompactNavbar ? 22 : 22} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <>
              <motion.button
                type="button"
                aria-label={copy.closeMenu}
                initial="closed"
                animate="open"
                exit="closed"
                variants={backdropVariants}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[105] backdrop-blur-[3px] dark:bg-[rgba(4,10,28,0.52)] lg:hidden"
              />
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuVariants}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className={`fixed inset-x-3 z-[106] overflow-hidden rounded-[24px] border border-[#e5edf7] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(246,249,255,0.97)_100%)] p-3 shadow-[0_24px_70px_rgba(17,24,39,0.14)] backdrop-blur-[22px] dark:border-[#405d90]/70 dark:bg-[linear-gradient(180deg,rgba(17,36,72,0.9)_0%,rgba(8,22,50,0.84)_100%)] dark:shadow-[0_28px_80px_rgba(2,8,24,0.48)] lg:hidden ${isCompactNavbar ? "top-[96px] max-h-[calc(100svh-110px)]" : "top-[88px] max-h-[calc(100svh-102px)]"}`}
              >
                <div className="mb-3 flex items-center justify-between border-b border-[#e6edf6] pb-3 dark:border-[#405d90]/55">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d8593] dark:text-[#9fb8e4]">
                      {copy.menu}
                    </div>
                    <div className="mt-1 text-xl font-black tracking-[-0.04em] text-[#161d2a] dark:text-white">
                      {copy.navigation}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[#d9e3ef] bg-white text-[#1d2430] shadow-[0_10px_24px_rgba(17,24,39,0.08)] hover:bg-[#f8fbff] dark:border-[#5572a8]/70 dark:bg-[rgba(23,45,86,0.74)] dark:text-white dark:shadow-[0_14px_30px_rgba(2,8,24,0.24)]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-[calc(100svh-220px)] overflow-y-auto pr-1">
                  <div className="flex flex-col gap-2">
                    {authed ? (
                      <button
                        type="button"
                        onClick={goProfile}
                        className="flex items-center gap-3 rounded-[20px] border border-[#e7edf6] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 text-left shadow-[0_10px_24px_rgba(17,24,39,0.05)]"
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#4b79ff_0%,#1a3e93_100%)] text-sm font-bold uppercase tracking-[0.12em] text-white">
                          {userInitials}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a879c]">
                            {userMemberLabel}
                          </span>
                          <span className="mt-1 block truncate text-[15px] font-bold text-[#1d2430]">
                            {user?.fullName || copy.profile}
                          </span>
                          <span className="block truncate text-xs text-[#627188]">
                            {user?.email}
                          </span>
                        </span>
                      </button>
                    ) : null}

                    <div className="flex items-center gap-2 rounded-[18px] border border-[#e7edf6] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-2">
                      {(["uz", "ru", "en"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={[
                            "flex-1 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                            language === lang
                              ? "bg-[linear-gradient(135deg,#5d86ff_0%,#3d6fee_100%)] text-white shadow-[0_10px_24px_rgba(61,111,238,0.22)]"
                              : "text-[#2a3140] hover:bg-[#f3f7fc]",
                          ].join(" ")}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="flex items-center justify-between rounded-[18px] border border-[#e7edf6] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-3 text-sm font-semibold text-[#1d2430] transition hover:bg-[#f8fbff]"
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f6fc] text-[#28466f]">
                          {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
                        </span>
                        <span>{theme === "dark" ? copy.lightMode : copy.darkMode}</span>
                      </span>
                      <span className="rounded-full bg-[#eef3f9] px-2.5 py-1 text-[11px] font-semibold text-[#244268]">
                        {theme === "dark" ? "ON" : "OFF"}
                      </span>
                    </button>

                    {mobileLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          [
                            "flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm font-semibold text-[#1d2430] transition",
                            isActive
                              ? "border-[#d8e5f8] bg-[linear-gradient(180deg,#f4f8ff_0%,#edf4ff_100%)] shadow-[0_10px_24px_rgba(71,120,197,0.08)]"
                              : "border-[#e7edf6] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] hover:bg-[#f8fbff]",
                          ].join(" ")
                        }
                      >
                        <span className="inline-flex items-center gap-3">
                          {link.icon ? (
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f6fc] text-[#28466f]">
                              <link.icon size={16} />
                            </span>
                          ) : (
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f6fc] text-[11px] font-bold uppercase tracking-[0.14em] text-[#28466f]">
                              {link.label.slice(0, 2)}
                            </span>
                          )}
                          <span>{link.label}</span>
                        </span>

                        {link.to === "/checkout" && paxCount > 0 ? (
                          <span className="rounded-full bg-[#eef3f9] px-2.5 py-1 text-[11px] font-semibold text-[#244268]">
                            {paxCount}
                          </span>
                        ) : null}
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-[#e6edf6] pt-3">
                  {!authed ? (
                    <Button
                      onClick={goAuth}
                      className="h-10 w-full rounded-[16px] border border-[#cfe0f5] bg-[linear-gradient(135deg,#5d86ff_0%,#3d6fee_100%)] px-4 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(61,111,238,0.20)] hover:brightness-110"
                    >
                      {copy.login}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={goProfile}
                        className="h-10 rounded-[16px] border border-[#d7e4f4] bg-[linear-gradient(180deg,#ffffff_0%,#eef4fb_100%)] px-4 text-[13px] font-semibold text-[#1d2430] shadow-[0_10px_20px_rgba(49,87,143,0.08)] hover:bg-white"
                      >
                        <UserCircle2 className="mr-1.5" size={15} />
                        {copy.profile}
                      </Button>
                      <Button
                        onClick={logout}
                        className="h-10 rounded-[16px] border border-[#e8d7dd] bg-[linear-gradient(180deg,#fff9fb_0%,#fff1f4_100%)] px-4 text-[13px] font-semibold text-[#a54864] shadow-[0_10px_20px_rgba(165,72,100,0.08)] hover:bg-[#fff5f7] dark:border-[#5d4264] dark:bg-[linear-gradient(180deg,rgba(75,33,56,0.66)_0%,rgba(53,22,42,0.74)_100%)] dark:text-[#ffd5e0]"
                      >
                        {copy.logout}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  badge = 0,
  isHome,
  theme,
  forceDark = false,
}: {
  to: string
  label: string
  icon?: LucideIcon
  badge?: number
  isHome: boolean
  theme: SiteTheme
  forceDark?: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 pb-2 pt-1 font-semibold uppercase tracking-[0.12em] transition duration-300",
          "text-[12px] xl:text-[13px] 2xl:text-[14px]",
          isActive ? "translate-y-[-1px]" : "hover:translate-y-[-1px]",
        ].join(" ")
      }
    >
      {({ isActive }) => {
        const lightText = "#111827"
        const darkText = "#ffffff"
        const textColor = isHome || forceDark ? darkText : theme === "dark" ? darkText : lightText

        const accentMap: Record<string, { line: string; glow: string }> = {
          "/flights": { line: "linear-gradient(90deg,#2f7fe0 0%,#7fb7ff 100%)", glow: "rgba(47,127,224,0.28)" },
          "/about": { line: "linear-gradient(90deg,#111827 0%,#4b5563 55%,#9ca3af 100%)", glow: "rgba(75,85,99,0.22)" },
          "/checkout": { line: "linear-gradient(90deg,#0f172a 0%,#2563eb 45%,#60a5fa 100%)", glow: "rgba(37,99,235,0.24)" },
          "/services": { line: "linear-gradient(90deg,#1d4ed8 0%,#38bdf8 50%,#93c5fd 100%)", glow: "rgba(56,189,248,0.24)" },
          "/contact": { line: "linear-gradient(90deg,#374151 0%,#111827 55%,#2563eb 100%)", glow: "rgba(55,65,81,0.22)" },
        }

        const accent = accentMap[to] ?? accentMap["/flights"]

        return (
          <>
            {Icon ? <Icon size={14} strokeWidth={2.1} style={{ color: textColor }} /> : null}
            <span className="relative" style={{ color: textColor }}>
              {label}
              <span
                aria-hidden
                className={[
                  "pointer-events-none absolute left-0 right-0 -bottom-[8px] h-[10px] rounded-full blur-[8px] transition-all duration-700 ease-out",
                  isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
                ].join(" ")}
                style={{ background: accent.glow }}
              />
              <span
                aria-hidden
                className={[
                  "pointer-events-none absolute left-0 right-0 -bottom-[3px] h-[2.5px] origin-left rounded-full transition-transform duration-700 ease-out",
                  isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                ].join(" ")}
                style={{ background: accent.line }}
              />
            </span>
            {badge > 0 ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] tracking-normal"
                style={{
                  color: textColor,
                  background: isHome || forceDark ? "rgba(255,255,255,0.14)" : theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(17,24,39,0.08)",
                }}
              >
                {badge}
              </span>
            ) : null}
          </>
        )
      }}
    </NavLink>
  )
}
