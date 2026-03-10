import { useEffect, useMemo, useState } from "react"
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, LogOut, UserCircle2, Users } from "lucide-react"
import logo from "@/assets/images/Tripzy.webp"
import { Button } from "@/components/ui/button"
import { bookingCart } from "@/shared/store/bookingCart"

// import { http } from "@/shared/api/http"

const navLinks = [
  { to: "/about", label: "Biz haqimizda" },
  { to: "/services", label: "Xizmatlarimiz" },
  { to: "/flights", label: "Reyslar" },

  // ✅ NEW: Passengers (karzinka)
  { to: "/passengers", label: "Yo‘lovchilar", icon: Users },

  { to: "/contact", label: "Aloqa" },
]

const menuVariants = {
  closed: { opacity: 0, y: -12, scale: 0.98 },
  open: { opacity: 1, y: 0, scale: 1 },
}

const listVariants = {
  closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const itemVariants = {
  closed: { opacity: 0, y: -8, filter: "blur(6px)" },
  open: { opacity: 1, y: 0, filter: "blur(0px)" },
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // ✅ Token kuzatish (demo)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"))
  const authed = useMemo(() => !!token, [token])

  // ✅ Passengers count (karzinka badge)
  const [paxCount, setPaxCount] = useState<number>(() => bookingCart.get().passengers.length)

  // ✅ boshqa joyda login/logout bo‘lsa ham navbar yangilansin
  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("access_token"))
    window.addEventListener("storage", onStorage)

    const onAuth = () => setToken(localStorage.getItem("access_token"))
    window.addEventListener("tripzy-auth", onAuth as EventListener)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("tripzy-auth", onAuth as EventListener)
    }
  }, [])

  // ✅ Cart o‘zgarishini kuzatish (badge yangilansin)
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

  // ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // mobile open bo‘lsa scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const logout = async () => {
    localStorage.removeItem("access_token")
    setToken(null)
    setOpen(false)
    navigate("/login")
  }

  const goAuth = () => {
    setOpen(false)
    navigate("/login")
  }

  const goProfile = () => {
    setOpen(false)
    navigate("/profile")
  }

  const isPassengers = location.pathname.startsWith("/passengers")

  const isHome = location.pathname === "/";
  const isAbout = location.pathname.startsWith("/about");

  return (
    <header className="w-full flex justify-center pt-6 px-4">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={[
          "relative overflow-hidden w-full max-w-[1200px] rounded-3xl sm:rounded-full px-5 sm:px-8 py-3 border shadow-[0_14px_40px_rgba(0,0,0,0.28)] md:shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
          isHome
            ? "bg-[#1b1f2a]/92 md:bg-[#0b0d12]/85 border-white/20 backdrop-blur-xl"
            : isAbout
              ? "bg-[#1b1f2a]/85 border-white/15 backdrop-blur-xl"
              : "bg-white/30 border-white/30 backdrop-blur-xl",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute inset-0",
            isHome
              ? "bg-gradient-to-r from-white/10 via-transparent to-white/10"
              : isAbout
                ? "bg-gradient-to-r from-white/10 via-transparent to-white/10"
                : "bg-gradient-to-r from-white/10 via-transparent to-white/10",
          ].join(" ")}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          initial={{ x: "-140%" }}
          animate={{ x: "140%" }}
          transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <img src={logo} alt="Tripzy" className="h-12 sm:h-14 w-28" />
          </Link>

          {/* ✅ Desktop menu */}
          <div className={`hidden md:flex items-center gap-7 font-semibold text-lg text-white`}>
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `relative transition ${isHome ? "hover:text-white" : "hover:text-white"} ${
                    isActive ? "text-white" : "text-white/90"
                  }`
                }
              >
                {/* ✅ Passengers badge desktop */}
                <span className="inline-flex items-center gap-2">
                  {"icon" in l && l.icon ? <l.icon size={18} /> : null}
                  {l.label}
                  {l.to === "/passengers" && paxCount > 0 && (
                    <span className="ml-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#8A3A5A] text-white text-[10px] grid place-items-center">
                      {paxCount}
                    </span>
                  )}
                </span>
              </NavLink>
            ))}
          </div>

          {/* ✅ Desktop Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {!authed ? (
              <Button
                onClick={goAuth}
                className={[
                  "rounded-full h-11 w-40 text-sm font-semibold cursor-pointer px-6 transition",
                  isHome
                    ? "bg-white text-[#0b0d12] shadow-[0_16px_40px_rgba(0,0,0,0.25)] hover:bg-white/90"
                    : "bg-white/90 text-[#0b0d12] shadow-[0_16px_40px_rgba(0,0,0,0.25)] hover:bg-white",
                ].join(" ")}
              >
                Register / Login
              </Button>
            ) : (
              <>
                <Button
                  onClick={goProfile}
                  className={[
                    "rounded-full h-11 px-5 text-sm border",
                    isHome
                      ? "bg-white/90 text-[#0b0d12] border-white/40 hover:bg-white"
                      : "bg-white/90 text-[#0b0d12] border-white/30 hover:bg-white",
                  ].join(" ")}
                >
                  <UserCircle2 className="mr-2" size={18} />
                  Profile
                </Button>
                <Button
                  onClick={logout}
                  className={[
                    "rounded-full h-11 px-5 text-sm border",
                    isHome
                      ? "bg-white/90 text-[#0b0d12] border-white/40 hover:bg-white"
                      : "bg-white/90 text-[#0b0d12] border-white/30 hover:bg-white",
                  ].join(" ")}
                >
                  <LogOut className="mr-2" size={18} />
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((p) => !p)}
            className={[
              "md:hidden inline-flex items-center justify-center rounded-xl w-9 h-9 transition",
              isHome
                ? "border border-[#c9a76b]/40 bg-white/60 text-[#2b2a26] hover:bg-white/70"
                : "border border-white/20 bg-white/20 text-white hover:bg-white/20",
            ].join(" ")}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.button
                type="button"
                aria-label="Close menu backdrop"
                className="fixed inset-0 bg-black/40 md:hidden z-40"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              {/* Mobile Menu */}
              <motion.div
                className={[
                  "md:hidden relative z-50 mt-3 rounded-3xl p-3 border shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
                  isHome
                    ? "bg-[#1b1f2a]/95 border-white/15"
                    : "bg-white/90 border-black/10",
                ].join(" ")}
                variants={menuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <motion.div
                  variants={listVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="flex flex-col"
                >
                  {navLinks.map((l) => (
                    <motion.div key={l.to} variants={itemVariants}>
                      <NavLink
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          [
                            "flex items-center justify-between px-4 py-3 rounded-2xl font-semibold transition",
                            isHome
                              ? isActive
                                ? "bg-white/15 text-white"
                                : "text-white/90 hover:bg-white/10"
                              : isActive
                                ? "bg-[#f1eef0] text-[#8A3A5A]"
                                : "text-[#2b2a26] hover:bg-[#f1eef0]",
                          ].join(" ")
                        }
                      >
                        <span className="inline-flex items-center gap-2">
                          {"icon" in l && l.icon ? <l.icon size={18} /> : null}
                          {l.label}
                        </span>

                        {/* ✅ Passengers badge mobile */}
                        {l.to === "/passengers" && paxCount > 0 && (
                          <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#8A3A5A] text-white text-[10px] grid place-items-center">
                            {paxCount}
                          </span>
                        )}
                      </NavLink>
                    </motion.div>
                  ))}

                  {/* ✅ Mobile Auth buttons */}
                  <motion.div variants={itemVariants} className="pt-2 space-y-2">
                      {!authed ? (
                        <Button
                          onClick={goAuth}
                          className={[
                            "w-full rounded-2xl py-5 text-sm transition shadow-[0_14px_40px_rgba(0,0,0,0.35)]",
                            isHome
                              ? "bg-white text-[#1b1f2a] hover:bg-white/90"
                              : "bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] text-white hover:brightness-110",
                          ].join(" ")}
                        >
                          Register / Login
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={goProfile}
                            className={[
                              "w-full rounded-2xl py-5 text-sm border transition",
                              isHome
                                ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                                : "bg-white text-[#2b2a26] border-black/10 hover:shadow-md",
                            ].join(" ")}
                          >
                            <UserCircle2 className="mr-2" size={16} />
                            Profile
                          </Button>
                          <Button
                            onClick={logout}
                            className={[
                              "w-full rounded-2xl py-5 text-sm border transition",
                              isHome
                                ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                                : "bg-white text-[#2b2a26] border-black/10 hover:shadow-md",
                            ].join(" ")}
                          >
                            <LogOut className="mr-2" size={16} />
                            Logout
                          </Button>
                        </>
                      )}
                  </motion.div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ✅ optional: kichik active indicator (passengers uchun) */}
        {isPassengers && (
          <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[120px] bg-[#8A3A5A]/80" />
        )}
      </motion.nav>
    </header>
  )
}
