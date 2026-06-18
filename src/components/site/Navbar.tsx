import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  ChevronDown,
  Menu,
  MoonStar,
  SunMedium,
  X,
  type LucideIcon,
} from "lucide-react"

import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler"
import logoImage from "@/assets/images/logo.tour.png"
import { bookingCart } from "@/shared/store/bookingCart"
import {
  getStoredTheme,
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

const compactNavbarLightClass =
  "border-b border-[#e1e1e1] bg-[#f1f1f1] shadow-[0_8px_24px_rgba(17,24,39,0.05)]"

const homeScrolledNavbarLightClass =
  "border-b border-[#e3dfd8] bg-[#f2f0ec] shadow-[0_8px_24px_rgba(77,70,61,0.05)]"

const compactNavbarDarkClass =
  "border-b border-transparent bg-[linear-gradient(180deg,rgba(8,18,44,0.97)_0%,rgba(5,11,30,0.94)_100%)] shadow-[0_14px_38px_rgba(2,8,24,0.50)] backdrop-blur-[22px]"

const compactControlLightClass =
  "border border-[#dde8f5] bg-white text-[#0f172a] shadow-[0_4px_14px_rgba(0,40,120,0.06)]"

const compactControlDarkClass =
  "border border-[#4a6799]/80 bg-[linear-gradient(180deg,rgba(12,26,58,0.96)_0%,rgba(7,16,40,0.92)_100%)] text-white shadow-[0_14px_30px_rgba(2,8,24,0.42)] backdrop-blur-[18px]"

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
  const location = useLocation()
  const isHome = location.pathname === "/"
  const { language, setLanguage } = useI18n()
  const languageMenuRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [theme, setTheme] = useState<SiteTheme>(() => getStoredTheme())
  const [hasHomeScrolled, setHasHomeScrolled] = useState(false)
  const [paxCount, setPaxCount] = useState<number>(
    () => bookingCart.get().passengers.length
  )
  const isCompactNavbar = !isHome
  const isHomeScrolled = isHome && hasHomeScrolled
  const useCompactNavTone = isCompactNavbar || isHomeScrolled

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

  useEffect(() => {
    if (!isHome) {
      setHasHomeScrolled(false)
      return
    }

    const updateHomeScroll = () => setHasHomeScrolled(window.scrollY > 24)

    updateHomeScroll()
    window.addEventListener("scroll", updateHomeScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", updateHomeScroll)
    }
  }, [isHome])





  const copy = {
    uz: {
      leftLinks: [
        { to: "/flights", label: "Reyslar" },
        { to: "/about", label: "Biz haqimizda" },
      ] as NavLinkItem[],      rightLinks: [
        { to: "/services", label: "Xizmatlar" },
        { to: "/contact", label: "Kontakt" },
      ] as NavLinkItem[],
      home: "Bosh sahifa",
      themeDark: "Tungi",
      themeLight: "Yorug'",
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
  const homeLanguageShellClass =
    theme === "dark"
      ? "border border-[#5d7fba]/65 bg-[linear-gradient(180deg,rgba(10,22,52,0.96)_0%,rgba(6,13,34,0.92)_100%)] p-0.5 shadow-[0_18px_42px_rgba(2,8,24,0.48)] backdrop-blur-[14px]"
      : "border border-[#d8e3f0] !bg-[#ffffff] p-0.5 shadow-[0_8px_22px_rgba(49,87,143,0.12)]"
  const compactNavbarGlassClass =
    theme === "dark" ? compactNavbarDarkClass : compactNavbarLightClass
  const homeScrolledNavbarClass =
    theme === "dark" ? compactNavbarDarkClass : homeScrolledNavbarLightClass
  const compactControlGlassClass =
    theme === "dark" ? compactControlDarkClass : compactControlLightClass
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
              ? "w-full px-4 pb-4 pt-7 transition-[background-color,border-color,box-shadow] duration-300 md:px-6 md:pb-4 md:pt-8 lg:pb-5 lg:pt-6"
              : "w-full px-4 py-4 transition-[background-color,border-color,box-shadow] duration-300 md:px-6 md:py-4 lg:py-2.5",
          isHome
            ? isHomeScrolled
              ? homeScrolledNavbarClass
              : "border-b border-white/20 bg-transparent shadow-none"
            : compactNavbarGlassClass,
        ].join(" ")}
      >
        <div className={`mx-auto flex !max-w-[1640px] items-center justify-between gap-4 ${isCompactNavbar ? "lg:gap-8" : "lg:gap-10"}`}>
          <Link
            to="/"
            className={`hidden shrink-0 items-center justify-center lg:flex ${isCompactNavbar ? "tripzy-logo-crop-mobile overflow-hidden" : "tripzy-logo-crop-home-desktop overflow-hidden"}`}
            onClick={() => setOpen(false)}
            aria-label={copy.home}
          >
            <img
              src={logoImage}
              alt="Tripzy logo"
              className={
                isCompactNavbar
                  ? "tripzy-logo-image-mobile block h-auto max-w-none object-contain"
                  : "tripzy-logo-image-home-desktop block h-auto max-w-none object-contain transition-[filter,transform] duration-300"
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
                  isHome={isHome && !isHomeScrolled}
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
                  className={`flex items-center gap-1 rounded-full ${useCompactNavTone ? compactLanguageShellClass : homeLanguageShellClass}`}
                >
                  <button
                    type="button"
                    onClick={() => setLanguageMenuOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={languageMenuOpen}
                    className={`inline-flex items-center gap-2 rounded-full font-bold uppercase tracking-[0.06em] transition-all duration-200 ${useCompactNavTone ? compactControlGlassClass : `${homeGlassBtnClass}`} ${isCompactNavbar ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-[11px]"}`}
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
                    className={`absolute left-0 top-[calc(100%+10px)] z-[120] min-w-[132px] overflow-hidden rounded-[20px] p-2 backdrop-blur-[18px] ${useCompactNavTone ? compactDropdownPanelClass : "border border-[#d7e4f4] bg-white/90 shadow-[0_18px_40px_rgba(49,87,143,0.12)] dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(17,33,66,0.95)_0%,rgba(17,33,66,0.92)_100%)] dark:shadow-[0_22px_50px_rgba(2,8,24,0.32)]"}`}
                    >
                      {otherLanguages.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setLanguage(lang)
                            setLanguageMenuOpen(false)
                          }}
                          className={`flex w-full items-center rounded-[14px] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] transition ${useCompactNavTone ? compactDropdownItemClass : "text-[#2a3a58] hover:bg-[#e8f0fc] hover:text-[#0052a5] dark:text-white/82 dark:hover:bg-white/8 dark:hover:text-white"}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <ThemeTogglerButton
                type="button"
                aria-label={copy.switchTheme}
                theme={theme}
                onThemeChange={setTheme}
                direction="ltr"
                unstyled
                className={`inline-flex items-center gap-2 rounded-full font-semibold uppercase tracking-[0.08em] transition ${useCompactNavTone ? `${compactControlGlassClass} ${compactControlHoverClass}` : homeGlassBtnClass} ${isCompactNavbar ? "h-9 px-3 text-[10px]" : "h-11 px-4 text-[11px]"}`}
                renderIcon={(currentTheme) =>
                  currentTheme === "dark" ? (
                    <SunMedium size={isCompactNavbar ? 12 : 14} />
                  ) : (
                    <MoonStar size={isCompactNavbar ? 12 : 14} />
                  )
                }
                label={theme === "dark" ? copy.themeLight : copy.themeDark}
              />

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
            className={`ml-auto inline-flex items-center justify-center rounded-2xl transition lg:hidden ${useCompactNavTone ? compactControlGlassClass : "border border-[#d7e4f4] bg-white/64 text-[#111827] shadow-[0_8px_20px_rgba(49,87,143,0.10)] hover:bg-white/80 dark:border-[#5d7fba]/50 dark:bg-[linear-gradient(180deg,rgba(20,42,84,0.72)_0%,rgba(9,24,54,0.56)_100%)] dark:text-white dark:shadow-[0_18px_42px_rgba(2,8,24,0.32)]"} ${isCompactNavbar ? "h-11 w-11" : "h-12 w-12"}`}
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
                className="fixed inset-0 z-[105] bg-slate-950/20 backdrop-blur-[3px] dark:bg-[rgba(4,10,28,0.58)] lg:hidden"
              />
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuVariants}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className={`fixed inset-x-[15px] z-[106] mx-auto overflow-hidden shadow-[0_24px_64px_rgba(17,24,39,0.18)] backdrop-blur-[22px] lg:hidden ${theme === "dark" ? "max-w-[390px] rounded-[22px] border border-[#41639b]/70 bg-[linear-gradient(180deg,rgba(17,39,78,0.92)_0%,rgba(7,20,48,0.88)_100%)] p-2.5 shadow-[0_24px_64px_rgba(2,8,24,0.52)]" : "max-w-[370px] rounded-[24px] border border-[#eee9e2] bg-[#fffdfb] p-0 text-[#071427]"} ${isCompactNavbar ? "top-[84px] max-h-[calc(100svh-98px)]" : "top-[78px] max-h-[calc(100svh-92px)]"}`}
              >
                <div className={theme === "dark" ? "" : "px-5 py-4"}>
                <div className={`mb-4 flex items-start justify-between ${theme === "dark" ? "border-b border-[#405d90]/55 pb-2.5" : ""}`}>
                  <div>
                    <div className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${theme === "dark" ? "text-[#a7bce2]" : "text-[#b7afa6]"}`}>
                      {copy.menu}
                    </div>
                    <div className={`mt-1.5 text-[19px] font-black leading-none tracking-[-0.025em] ${theme === "dark" ? "text-white" : "text-[#071427]"}`}>
                      {copy.navigation}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={`grid place-items-center rounded-full transition ${theme === "dark" ? "h-9 w-9 border border-[#5572a8]/70 bg-[rgba(23,45,86,0.78)] text-white" : "h-10 w-10 bg-[#f4f1ed] text-[#071427] shadow-[inset_0_0_0_1px_rgba(210,202,193,0.32),0_8px_18px_rgba(32,24,16,0.05)] hover:bg-[#eee9e3]"}`}
                  >
                    <X size={theme === "dark" ? 17 : 20} strokeWidth={2.4} />
                  </button>
                </div>

                <div className="max-h-[calc(100svh-160px)] overflow-y-auto">
                  <div className={`flex flex-col ${theme === "dark" ? "gap-1.5" : "gap-2.5"}`}>
                    <div className={`flex items-center gap-2 p-1.5 ${theme === "dark" ? "rounded-[16px] border border-[#3d5b8e]/70 bg-[rgba(10,28,62,0.68)]" : "rounded-[16px] border border-[#eee9e2] bg-[#fffdfb] shadow-[0_8px_18px_rgba(32,24,16,0.025)]"}`}>
                      {(["uz", "ru", "en"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={[
                            "flex-1 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.04em] transition",
                            language === lang
                              ? theme === "dark"
                                ? "bg-[linear-gradient(135deg,#5d86ff_0%,#3d6fee_100%)] text-white shadow-[0_10px_24px_rgba(61,111,238,0.22)]"
                                : "bg-[linear-gradient(90deg,#001b7a_0%,#05288f_48%,#5f8cff_100%)] text-white shadow-[0_10px_22px_rgba(5,40,143,0.24)]"
                              : theme === "dark"
                                ? "text-[#d7e4ff] hover:bg-white/8"
                                : "text-[#101722] hover:bg-[#f4f1ed]",
                          ].join(" ")}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    <ThemeTogglerButton
                      type="button"
                      aria-label={copy.switchTheme}
                      theme={theme}
                      onThemeChange={setTheme}
                      direction="ltr"
                      unstyled
                      className={`flex items-center justify-between font-bold transition ${theme === "dark" ? "rounded-[16px] border border-[#3d5b8e]/70 bg-[rgba(10,28,62,0.68)] px-3 py-2.5 text-[13px] text-white" : "rounded-[16px] bg-[#f8f5f1] px-5 py-3 text-[13px] text-[#071427] shadow-[0_8px_18px_rgba(32,24,16,0.025)] hover:bg-[#f3eee8]"}`}
                      renderIcon={() => <span className="hidden" aria-hidden />}
                      label={
                        <>
                            <span className="inline-flex items-center gap-3">
                            <span className={`grid place-items-center rounded-full ${theme === "dark" ? "h-7 w-7 bg-[#15366d] text-[#bfe0ff]" : "h-7 w-7 bg-transparent text-[#071427]"}`}>
                              {theme === "dark" ? <SunMedium size={15} /> : <MoonStar size={20} />}
                            </span>
                            <span>{theme === "dark" ? copy.lightMode : copy.darkMode}</span>
                          </span>
                          <span className={`rounded-full font-black ${theme === "dark" ? "bg-[#193a70] px-2.5 py-1 text-[10px] text-[#dbeafe]" : "bg-[#eeeae5] px-3 py-1.5 text-[11px] text-[#071427]"}`}>
                            {theme === "dark" ? "ON" : "OFF"}
                          </span>
                        </>
                      }
                    />

                    {mobileLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          [
                            "flex items-center justify-between transition",
                            theme === "dark"
                              ? [
                                  "rounded-[18px] border px-4 py-3 text-sm font-semibold",
                                  isActive
                                    ? "border-[#5f8dd4] bg-[rgba(26,80,151,0.58)] text-white"
                                    : "border-[#3d5b8e]/70 bg-[rgba(10,28,62,0.68)] text-[#e8f0ff] hover:bg-[rgba(18,50,103,0.72)]",
                                ].join(" ")
                              : [
                                  "rounded-[16px] border border-[#eee9e2] bg-[#fffdfb] px-5 py-3 text-[13px] font-bold text-[#071427] shadow-[0_8px_18px_rgba(32,24,16,0.025)] hover:bg-[#f8f5f1]",
                                  isActive ? "border-[#e5ded5] bg-[#fffdfb]" : "",
                                ].join(" "),
                          ].join(" ")
                        }
                      >
                        <span className="inline-flex items-center gap-4 px-0.5">
                          {link.icon ? (
                            <span className={`grid place-items-center rounded-full ${theme === "dark" ? "h-7 w-7 bg-[#15366d] text-[#bfe0ff]" : "h-8 w-8 bg-[#f3f0eb] text-[#071427]"}`}>
                              <link.icon size={16} />
                            </span>
                          ) : (
                            <span className={`grid place-items-center rounded-full font-black uppercase ${theme === "dark" ? "h-7 w-7 bg-[#15366d] text-[10px] tracking-[0.14em] text-[#bfe0ff]" : "h-8 w-8 bg-[#f3f0eb] text-[10px] tracking-[0.02em] text-[#071427]"}`}>
                              {link.label.slice(0, 2)}
                            </span>
                          )}
                          <span>{link.label}</span>
                        </span>

                        {link.to === "/checkout" && paxCount > 0 ? (
                          <span className="rounded-full bg-[#eef3f9] px-2.5 py-1 text-[10px] font-semibold text-[#244268] dark:bg-[#193a70] dark:text-[#dbeafe]">
                            {paxCount}
                          </span>
                        ) : null}
                      </NavLink>
                    ))}

                    <Link
                      to="/flights"
                      onClick={() => setOpen(false)}
                      className="mt-1.5 inline-flex items-center justify-center gap-4 rounded-[15px] bg-[linear-gradient(90deg,#001b7a_0%,#05288f_48%,#5f8cff_100%)] px-5 py-3 text-[13px] font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(5,40,143,0.30)] transition hover:brightness-[1.04] active:scale-[0.99]"
                    >
                      Qidirish
                      <ArrowRight size={19} strokeWidth={2.2} />
                    </Link>
                  </div>
                </div>
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

        const accent = {
          line: "linear-gradient(90deg,#001b7a 0%,#05288f 48%,#5f8cff 100%)",
          glow: "rgba(5,40,143,0.30)",
        }

        return (
          <>
            {Icon ? <Icon size={14} strokeWidth={2.1} style={{ color: textColor }} /> : null}
            <span className="relative" style={{ color: textColor }}>
              {label}
              <span
                aria-hidden
                className={[
                  "pointer-events-none absolute left-0 right-0 -bottom-[8px] h-[10px] origin-left rounded-full blur-[8px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
                ].join(" ")}
                style={{ background: accent.glow }}
              />
              <span
                aria-hidden
                className={[
                  "pointer-events-none absolute left-0 right-0 -bottom-[3px] h-[2.5px] origin-left rounded-full shadow-[0_8px_18px_rgba(5,40,143,0.30)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
