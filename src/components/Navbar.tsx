import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import logo from "@/assets/images/Tripzy.webp";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/about", label: "Biz haqimizda" },
  { to: "/services", label: "Xizmatlarimiz" },
  { to: "/flights", label: "Reyslar" },
  { to: "/contact", label: "Contact" },
];

const menuVariants = {
  closed: { opacity: 0, y: -12, scale: 0.98 },
  open: { opacity: 1, y: 0, scale: 1 },
};

const listVariants = {
  closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  closed: { opacity: 0, y: -8, filter: "blur(6px)" },
  open: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="w-full flex justify-center pt-5 px-4">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="
          relative overflow-hidden
          w-full max-w-[1200px]
          rounded-xl sm:rounded-full
          px-4 sm:px-6 py-3
          bg-gray-700/70 backdrop-blur-xl
          border border-white/10
          shadow-lg shadow-black/30
        "
      >
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          initial={{ x: "-140%" }}
          animate={{ x: "140%" }}
          transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <img src={logo} alt="Tripzy" className="h-15 sm:h-20 w-28" />
          </Link>

          <div className="hidden md:flex items-center gap-8 fonts font-semibold text-white text-xl text-h1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `transition hover:text-blue-200 ${isActive ? "text-blue-200" : "text-white/90"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop Register */}
          <div className="hidden md:block">
            <Link to="/register">
              <Button className="rounded-full text-h1 cursor-pointer bg-white/20 text-white border border-white/25 hover:bg-white/30 px-6">
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((p) => !p)}
            className="
              md:hidden
              inline-flex items-center justify-center
              rounded-xl
              border border-white/20
              bg-white/10
              text-white
              w-10 h-10
              hover:bg-white/20
              transition
            "
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
                className="
                  md:hidden
                  relative z-50
                  mt-3
                  rounded-2xl
                  bg-[#0A1220]/75 backdrop-blur-xl
                  border border-white/15
                  p-3
                "
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
                          `block px-4 py-3 rounded-xl fonts font-semibold
                           ${isActive ? "bg-white/10 text-blue-200" : "text-white/90 hover:bg-white/10"}
                           transition`
                        }
                      >
                        {l.label}
                      </NavLink>
                    </motion.div>
                  ))}

                  {/* ✅ Mobile Register (Link bilan) */}
                  <motion.div variants={itemVariants} className="pt-2">
                    <Link to="/register" onClick={() => setOpen(false)}>
                      <Button className="w-full rounded-xl bg-blue-400 text-white hover:opacity-90 py-6">
                        Register
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
