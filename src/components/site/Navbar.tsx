import { useEffect, useMemo, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Menu, Search, UserCircle2, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { bookingCart } from "@/shared/store/bookingCart"

const leftLinks = [
  { to: "/flights", label: "Aeroport" },
  { to: "/about", label: "Biz haqimizda" },
  { to: "/passengers", label: "Yo'lovchilar", icon: Users },
]

const rightLinks = [
  { to: "/services", label: "Hamkorlar" },
  { to: "/contact", label: "Kontakt" },
]

const mobileLinks = [...leftLinks, ...rightLinks]

const menuVariants = {
  closed: { opacity: 0, y: -12, scale: 0.98 },
  open: { opacity: 1, y: 0, scale: 1 },
}

const actionBtnClass =
  "h-11 rounded-full border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] hover:brightness-110"

export default function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("access_token")
  )
  const [paxCount, setPaxCount] = useState<number>(
    () => bookingCart.get().passengers.length
  )

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

  return (
    <header className="fixed inset-x-0 top-0 z-[100] flex justify-center">
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full border-y border-[#d9dde4] bg-[rgba(240,243,247,0.92)] px-5 py-5 shadow-[0_8px_24px_rgba(37,55,89,0.04)] backdrop-blur-sm md:px-10"
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="hidden items-center gap-9 lg:flex">
            {leftLinks.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                label={link.label}
                icon={link.icon}
                badge={link.to === "/passengers" ? paxCount : 0}
              />
            ))}
          </div>

          <Link
            to="/"
            className="justify-self-center text-center leading-none text-[#161d2a]"
            onClick={() => setOpen(false)}
          >
            <div className="text-[10px] uppercase tracking-[0.55em] text-[#7d8593]">
              Tripzy
            </div>
            <div className="mt-1 font-serif text-[40px] font-semibold tracking-[0.16em] md:text-[52px]">
              Handling
            </div>
          </Link>

          <div className="hidden items-center justify-end gap-8 lg:flex">
            {rightLinks.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} />
            ))}

            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2a3140]">
              UZ
            </span>

            <button
              type="button"
              aria-label="Qidirish"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#2a3140] transition hover:bg-white/70"
            >
              <Search size={15} />
            </button>

            {!authed ? (
              <Button
                onClick={goAuth}
                className={`${actionBtnClass} px-6`}
              >
                Kirish
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={goProfile}
                  className={actionBtnClass}
                >
                  <UserCircle2 className="mr-2" size={15} />
                  Profil
                </Button>
                <Button
                  onClick={logout}
                  className={actionBtnClass}
                >
                  <LogOut className="mr-2" size={15} />
                  Chiqish
                </Button>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Menyuni ochish"
            onClick={() => setOpen((value) => !value)}
            className="justify-self-end rounded-md border border-white/60 bg-white/75 p-2 text-[#1d2430] lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-4 rounded-[18px] border border-white/60 bg-[rgba(255,255,255,0.86)] p-3 lg:hidden"
            >
              <div className="flex flex-col gap-1">
                {mobileLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-[#1d2430] transition",
                        isActive ? "bg-[#eef3f9]" : "hover:bg-[#f6f8fb]",
                      ].join(" ")
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      {"icon" in link && link.icon ? <link.icon size={16} /> : null}
                      {link.label}
                    </span>
                    {link.to === "/passengers" && paxCount > 0 ? (
                      <span className="rounded-full bg-[#eef3f9] px-2 py-0.5 text-[11px]">
                        {paxCount}
                      </span>
                    ) : null}
                  </NavLink>
                ))}

                {!authed ? (
                  <Button
                    onClick={goAuth}
                    className="mt-2 h-11 rounded-xl border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] hover:brightness-110"
                  >
                    Kirish
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={goProfile}
                      className="mt-2 h-11 rounded-xl border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] hover:brightness-110"
                    >
                      Profil
                    </Button>
                    <Button
                      onClick={logout}
                      className="h-11 rounded-xl border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] hover:brightness-110"
                    >
                      Chiqish
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
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
}: {
  to: string
  label: string
  icon?: typeof Users
  badge?: number
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.28em] transition",
          isActive ? "text-[#111827]" : "text-[#2d3544] hover:text-[#111827]",
        ].join(" ")
      }
    >
      {Icon ? <Icon size={14} strokeWidth={2.1} /> : null}
      <span>{label}</span>
      {badge > 0 ? (
        <span className="rounded-full bg-[#e8eef8] px-1.5 py-0.5 text-[10px] tracking-normal text-[#173260]">
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}
