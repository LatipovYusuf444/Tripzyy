import { useEffect, useMemo, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  LogOut,
  Menu,
  MoonStar,
  SunMedium,
  UserCircle2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import logoImage from "@/assets/images/logo.png"
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
  "h-11 rounded-full border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(17,24,39,0.18)] transition hover:brightness-110 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(53,89,170,0.34)_0%,rgba(17,27,52,0.96)_52%,rgba(30,55,104,0.9)_100%)] dark:text-white dark:shadow-[0_16px_36px_rgba(4,10,28,0.42)]"

type NavLinkItem = {
  to: string
  label: string
  icon?: LucideIcon
}

export default function Navbar() {
  const navigate = useNavigate()
  const { language, setLanguage } = useI18n()

  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("access_token")
  )
  const [theme, setTheme] = useState<SiteTheme>(() => getStoredTheme())
  const [paxCount, setPaxCount] = useState<number>(
    () => bookingCart.get().passengers.length
  )
  const [isScrolled, setIsScrolled] = useState(false)

  const authed = useMemo(() => !!token, [token])

  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("access_token"))
    const onAuth = () => setToken(localStorage.getItem("access_token"))

    window.addEventListener("storage", onStorage)
    window.addEventListener("tripzy-auth", onAuth as EventListener)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("tripzy-auth", onAuth as EventListener)
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
    const onScroll = () => setIsScrolled(window.scrollY > 28)

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => window.removeEventListener("scroll", onScroll)
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
    localStorage.removeItem("access_token")
    setToken(null)
    setOpen(false)
    navigate("/login")
  }

  const onToggleTheme = () => {
    const nextTheme: SiteTheme = theme === "dark" ? "light" : "dark"
    setTheme(setSiteTheme(nextTheme))
  }

  const copy = {
    uz: {
      leftLinks: [
        { to: "/flights", label: "Aeroport" },
        { to: "/about", label: "Biz haqimizda" },
        { to: "/passengers", label: "Yo'lovchilar", icon: Users },
      ] as NavLinkItem[],
      rightLinks: [
        { to: "/services", label: "Xizmatlar" },
        { to: "/contact", label: "Kontakt" },
      ] as NavLinkItem[],
      home: "Tripzy bosh sahifa",
      themeDark: "Dark",
      themeLight: "Light",
      login: "Kirish",
      profile: "Profil",
      logout: "Chiqish",
      menu: "Menyu",
      navigation: "Navigatsiya",
      darkMode: "Dark blue mode",
      lightMode: "Light mode",
      openMenu: "Menyuni ochish",
      closeMenu: "Menyuni yopish",
      switchTheme: "Temani almashtirish",
    },
    ru: {
      leftLinks: [
        { to: "/flights", label: "Аэропорт" },
        { to: "/about", label: "О нас" },
        { to: "/passengers", label: "Пассажиры", icon: Users },
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
        { to: "/flights", label: "Airport" },
        { to: "/about", label: "About" },
        { to: "/passengers", label: "Passengers", icon: Users },
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
      darkMode: "Dark blue mode",
      lightMode: "Light mode",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      switchTheme: "Switch theme",
    },
  }[language]

  const desktopLinks = [...copy.leftLinks, ...copy.rightLinks]
  const mobileLinks = [...copy.leftLinks, ...copy.rightLinks]

  return (
    <header className="fixed inset-x-0 top-0 z-[100]">
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={[
          "w-full border-b border-[#d9dde4] bg-[rgba(240,243,247,0.92)] px-4 shadow-[0_8px_24px_rgba(37,55,89,0.04)] backdrop-blur-sm transition-[padding,background-color,box-shadow] duration-300 dark:border-[#38517f]/70 dark:bg-[rgba(8,18,38,0.50)] dark:shadow-[0_12px_32px_rgba(3,8,24,0.34)] md:px-5",
          isScrolled ? "py-2 md:py-1.5" : "py-3 md:py-2.5",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 lg:gap-5">
          <Link
            to="/"
            className="hidden shrink-0 items-center justify-center lg:flex"
            onClick={() => setOpen(false)}
            aria-label={copy.home}
          >
            <img
              src={logoImage}
              alt="Tripzy logo"
              className={[
                "block h-auto object-contain drop-shadow-[0_10px_24px_rgba(17,24,39,0.10)] transition-[width,filter] duration-300 dark:drop-shadow-[0_14px_30px_rgba(2,8,24,0.40)]",
                isScrolled ? "w-[158px] xl:w-[170px]" : "w-[172px] xl:w-[184px]",
              ].join(" ")}
            />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-between lg:flex">
            <div className="flex min-w-0 items-center gap-6 xl:gap-7">
              {desktopLinks.map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  icon={link.icon}
                  badge={link.to === "/passengers" ? paxCount : 0}
                  compact={isScrolled}
                />
              ))}
            </div>

            <div className="ml-5 flex shrink-0 items-center gap-2.5 xl:gap-3">
              <div className="flex items-center gap-1 rounded-full border border-[#dde4ee] bg-white/85 p-1 shadow-[0_8px_20px_rgba(17,24,39,0.06)] dark:border-[#36507f] dark:bg-[rgba(20,35,66,0.82)] dark:shadow-[0_12px_28px_rgba(4,10,28,0.34)]">
                {(["uz", "ru", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={[
                      "rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                      isScrolled ? "py-0.5" : "py-1.5",
                      language === lang
                        ? "bg-[#1c2433] text-white dark:bg-[#4b79ff]"
                        : "text-[#2a3140] hover:bg-[#f3f7fc] dark:text-white/80 dark:hover:bg-white/10",
                    ].join(" ")}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-label={copy.switchTheme}
                onClick={onToggleTheme}
                className={[
                  "inline-flex items-center gap-2 rounded-full border border-[#dde4ee] bg-white/85 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#243042] shadow-[0_8px_20px_rgba(17,24,39,0.06)] transition hover:bg-white dark:border-[#36507f] dark:bg-[rgba(20,35,66,0.82)] dark:text-white dark:shadow-[0_12px_28px_rgba(4,10,28,0.34)] dark:hover:bg-[rgba(28,46,84,0.94)]",
                  isScrolled ? "h-8.5" : "h-9.5",
                ].join(" ")}
              >
                {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
                {theme === "dark" ? copy.themeLight : copy.themeDark}
              </button>

              {!authed ? (
                <Button onClick={goAuth} className={`${actionBtnClass} px-6`}>
                  {copy.login}
                </Button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Button onClick={goProfile} className={actionBtnClass}>
                    <UserCircle2 className="mr-2" size={16} />
                    {copy.profile}
                  </Button>
                  <Button onClick={logout} className={actionBtnClass}>
                    <LogOut className="mr-2" size={16} />
                    {copy.logout}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center justify-start lg:hidden"
            onClick={() => setOpen(false)}
            aria-label={copy.home}
          >
            <img
              src={logoImage}
              alt="Tripzy logo"
              className="block h-auto w-[150px] object-contain sm:w-[158px]"
            />
          </Link>

          <button
            type="button"
            aria-label={copy.openMenu}
            onClick={() => setOpen((value) => !value)}
            className="ml-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[#1d2430] shadow-[0_10px_24px_rgba(17,24,39,0.08)] transition hover:bg-white dark:border-[#36507f] dark:bg-[rgba(18,33,62,0.86)] dark:text-white dark:shadow-[0_12px_28px_rgba(4,10,28,0.28)] lg:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
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
                className="fixed inset-0 z-[105] bg-[rgba(15,23,42,0.22)] backdrop-blur-[3px] dark:bg-[rgba(4,10,28,0.52)] lg:hidden"
              />
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuVariants}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="fixed inset-x-3 top-[88px] z-[106] max-h-[calc(100svh-102px)] overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,253,0.96)_100%)] p-3 shadow-[0_24px_70px_rgba(17,24,39,0.16)] dark:border-[#36507f] dark:bg-[linear-gradient(180deg,rgba(13,24,48,0.98)_0%,rgba(18,32,60,0.97)_100%)] dark:shadow-[0_28px_70px_rgba(4,10,28,0.56)] lg:hidden"
              >
                <div className="mb-3 flex items-center justify-between border-b border-[#e6edf6] pb-3 dark:border-[#2c416a]">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d8593] dark:text-[#9fb4d7]">
                      {copy.menu}
                    </div>
                    <div className="mt-1 text-xl font-black tracking-[-0.04em] text-[#161d2a] dark:text-white">
                      {copy.navigation}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[#d9e3ef] bg-white text-[#1d2430] shadow-[0_10px_24px_rgba(17,24,39,0.08)] dark:border-[#36507f] dark:bg-[rgba(24,39,72,0.9)] dark:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-[calc(100svh-220px)] overflow-y-auto pr-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-[18px] border border-[#e7edf6] bg-white/85 p-2 dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.82)]">
                      {(["uz", "ru", "en"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={[
                            "flex-1 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                            language === lang
                              ? "bg-[#1c2433] text-white dark:bg-[#4b79ff]"
                              : "text-[#2a3140] hover:bg-[#f3f7fc] dark:text-white/80 dark:hover:bg-white/10",
                          ].join(" ")}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="flex items-center justify-between rounded-[18px] border border-[#e7edf6] bg-white/85 px-4 py-3 text-sm font-semibold text-[#1d2430] transition hover:bg-[#f8fbff] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.82)] dark:text-white dark:hover:bg-[rgba(28,46,84,0.94)]"
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f6fc] text-[#28466f] dark:bg-[rgba(56,85,136,0.24)] dark:text-[#dbe8ff]">
                          {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
                        </span>
                        <span>{theme === "dark" ? copy.lightMode : copy.darkMode}</span>
                      </span>
                      <span className="rounded-full bg-[#eef3f9] px-2.5 py-1 text-[11px] font-semibold text-[#244268] dark:bg-[rgba(57,90,146,0.24)] dark:text-[#dbe8ff]">
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
                            "flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm font-semibold text-[#1d2430] transition dark:text-white",
                            isActive
                              ? "border-[#d8e5f8] bg-[linear-gradient(180deg,#f4f8ff_0%,#edf4ff_100%)] shadow-[0_10px_24px_rgba(71,120,197,0.08)] dark:border-[#4d6fa8] dark:bg-[linear-gradient(180deg,rgba(35,60,110,0.9)_0%,rgba(26,47,87,0.92)_100%)] dark:shadow-[0_16px_34px_rgba(4,10,28,0.36)]"
                              : "border-[#e7edf6] bg-white/85 hover:bg-[#f8fbff] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.82)] dark:hover:bg-[rgba(28,46,84,0.94)]",
                          ].join(" ")
                        }
                      >
                        <span className="inline-flex items-center gap-3">
                          {link.icon ? (
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f6fc] text-[#28466f] dark:bg-[rgba(56,85,136,0.24)] dark:text-[#dbe8ff]">
                              <link.icon size={16} />
                            </span>
                          ) : (
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f6fc] text-[11px] font-bold uppercase tracking-[0.14em] text-[#28466f] dark:bg-[rgba(56,85,136,0.24)] dark:text-[#dbe8ff]">
                              {link.label.slice(0, 2)}
                            </span>
                          )}
                          <span>{link.label}</span>
                        </span>

                        {link.to === "/passengers" && paxCount > 0 ? (
                          <span className="rounded-full bg-[#eef3f9] px-2.5 py-1 text-[11px] font-semibold text-[#244268] dark:bg-[rgba(57,90,146,0.24)] dark:text-[#dbe8ff]">
                            {paxCount}
                          </span>
                        ) : null}
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-[#e6edf6] pt-3 dark:border-[#2c416a]">
                  {!authed ? (
                    <Button
                      onClick={goAuth}
                      className="h-12 w-full rounded-[18px] border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-sm font-semibold text-white shadow-[0_14px_32px_rgba(17,24,39,0.22)] hover:brightness-110"
                    >
                      {copy.login}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={goProfile}
                        className="h-12 rounded-[18px] border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-sm font-semibold text-white shadow-[0_14px_32px_rgba(17,24,39,0.22)] hover:brightness-110"
                      >
                        {copy.profile}
                      </Button>
                      <Button
                        onClick={logout}
                        className="h-12 rounded-[18px] border border-[#e8d7dd] bg-[linear-gradient(180deg,#fff9fb_0%,#fff1f4_100%)] text-sm font-semibold text-[#a54864] shadow-[0_10px_24px_rgba(165,72,100,0.08)] hover:bg-[#fff5f7] dark:border-[#5d4264] dark:bg-[linear-gradient(180deg,rgba(75,33,56,0.66)_0%,rgba(53,22,42,0.74)_100%)] dark:text-[#ffd5e0]"
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
  compact = false,
}: {
  to: string
  label: string
  icon?: LucideIcon
  badge?: number
  compact?: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative inline-flex items-center gap-1.5 whitespace-nowrap pb-1.5 font-semibold uppercase tracking-[0.12em] transition",
          compact ? "text-[11px] xl:text-[12px]" : "text-[12px] xl:text-[13px]",
          isActive
            ? "text-[#111827] after:scale-x-100 after:opacity-100 dark:text-white"
            : "text-[#2d3544] hover:text-[#111827] after:scale-x-70 after:opacity-70 dark:text-white/78 dark:hover:text-white",
          "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-[linear-gradient(90deg,#86a8df_0%,#416fcb_55%,#9bc6ff_100%)] after:opacity-0 after:transition after:duration-300 hover:after:scale-x-100 hover:after:opacity-100 dark:after:bg-[linear-gradient(90deg,#8fb2ff_0%,#4b79ff_55%,#c1daff_100%)]",
        ].join(" ")
      }
    >
      {Icon ? <Icon size={16} strokeWidth={2.1} /> : null}
      <span>{label}</span>
      {badge > 0 ? (
        <span className="rounded-full bg-[#e8eef8] px-1.5 py-0.5 text-[10px] tracking-normal text-[#173260] dark:bg-[rgba(57,90,146,0.24)] dark:text-[#dbe8ff]">
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}
