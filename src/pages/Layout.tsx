import { Outlet, useLocation } from "react-router-dom"

import Footer from "../components/site/Footer"
import Navbar from "../components/site/Navbar"

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === "/"

  return (
    <div className={`layout-shell flex min-h-screen flex-col ${isHome ? "bg-[#edf2f6]" : "bg-[#EEF1FB] dark:bg-[#07152f]"}`}>
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
        <Outlet />
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  )
}
