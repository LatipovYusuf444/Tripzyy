import { useEffect, useMemo, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
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
  { to: "/passengers", label: "Yo'lovchilar", icon: Users },
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
  const [open, setOpen] = useState(false)

  // ✅ Token kuzatish (demo)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"))
  const authed = useMemo(() => !!token, [token])

  // ✅ Passengers count (karzinka badge)
  const [paxCount, setPaxCount] = useState<number>(() => bookingCart.get().passengers.length)

  // ✅ boshqa joyda login/logout bo'lsa ham navbar yangilansin
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

  // ✅ Cart o'zgarishini kuzatish (badge yangilansin)
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

  // mobile open bo'lsa scroll lock
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

  return (
    <header className="w-full flex justify-center pt-6 px-4">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={[
          "relative overflow-hidden w-full max-w-[1200px] rounded-[28px] sm:rounded-full px-5 sm:px-8 py-3",
          "border border-white/10 bg-[#0b0d12]/75 backdrop-blur-2xl",
          "shadow-[0_18px_60px_rgba(0,0,0,0.45)]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-[#7A2E4E]/40 via-transparent to-[#E7B26D]/30 blur-2xl opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/10" />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-140%" }}
          animate={{ x: "140%" }}
          transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <img src={logo} alt="Tripzy" className="h-12 sm:h-14 w-28" />
          </Link>

          {/* ✅ Desktop menu */}
          <div className="hidden md:flex items-center gap-6 text-white/80">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  [
                    "relative px-2 py-1 text-sm lg:text-base font-semibold transition",
                    "after:content-[''] after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full",
                    "after:rounded-full after:bg-gradient-to-r after:from-[#E7B26D] after:via-[#D99AAE] after:to-[#7A2E4E]",
                    "after:transition after:duration-300 after:origin-left",
                    isActive
                      ? "text-white after:scale-x-100"
                      : "text-white/70 hover:text-white after:scale-x-0 hover:after:scale-x-100",
                  ].join(" ")
                }
              >
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
                className="rounded-full h-11 px-6 text-sm font-semibold bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#C08A5C] text-white shadow-[0_18px_40px_rgba(138,58,90,0.45)] hover:brightness-110"
              >
                Register / Login
              </Button>
            ) : (
              <>
                <Button
                  onClick={goProfile}
                  className="rounded-full h-11 px-5 text-sm border border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  <UserCircle2 className="mr-2" size={18} />
                  Profile
                </Button>
                <Button
                  onClick={logout}
                  className="rounded-full h-11 px-5 text-sm border border-white/15 bg-white/10 text-white hover:bg-white/15"
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
            className="md:hidden inline-flex items-center justify-center rounded-xl w-9 h-9 border border-white/15 bg-white/10 text-white hover:bg-white/15 transition"
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
                className="md:hidden relative z-50 mt-3 rounded-3xl p-3 border border-white/10 bg-[#0b0d12]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
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
                            isActive
                              ? "bg-white/15 text-white"
                              : "text-white/85 hover:bg-white/10",
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
                        className="w-full rounded-2xl py-5 text-sm transition shadow-[0_14px_40px_rgba(0,0,0,0.35)] bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#C08A5C] text-white hover:brightness-110"
                      >
                        Register / Login
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={goProfile}
                          className="w-full rounded-2xl py-5 text-sm border border-white/15 bg-white/10 text-white hover:bg-white/15"
                        >
                          <UserCircle2 className="mr-2" size={16} />
                          Profile
                        </Button>
                        <Button
                          onClick={logout}
                          className="w-full rounded-2xl py-5 text-sm border border-white/15 bg-white/10 text-white hover:bg-white/15"
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

        {/* active indicator olib tashlandi */}
      </motion.nav>
    </header>
  )
}
