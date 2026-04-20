import { Outlet, useLocation, useOutlet } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"

import Footer from "../components/site/Footer"
import Navbar from "../components/site/Navbar"

export default function Layout() {
  const location = useLocation()
  const outlet = useOutlet()
  const isHome = location.pathname === "/"

  return (
    <div className={`layout-shell ${isHome ? "home-layout" : "non-home-layout"} flex min-h-screen flex-col ${isHome ? "bg-[#edf2f6]" : "bg-[#EEF1FB] dark:bg-[#07152f]"}`}>
      <header className="fixed left-0 top-0 z-50 w-full">
        <Navbar />
      </header>

      <main
        className={[
          "layout-main flex-1",
          isHome ? "pt-[86px] md:pt-[94px] xl:pt-[102px]" : "pt-[88px] md:pt-[94px] lg:pt-23.5 xl:pt-25.5",
          isHome
            ? "bg-[linear-gradient(180deg,#e9f1f8_0%,#eef3f7_28%,#edf2f6_100%)] text-[#1d2430]"
            : "bg-[#EEF1FB] text-[#111A34] dark:bg-[#07152f] dark:text-white",
        ].join(" ")}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full transform-gpu will-change-[opacity,transform,filter]"
          >
            {outlet ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  )
}
