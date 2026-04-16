import { Outlet, useLocation } from "react-router-dom"

import Footer from "../components/site/Footer"
import Navbar from "../components/site/Navbar"

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === "/"

  return (
    <div className={`flex min-h-screen flex-col ${isHome ? "bg-[#edf2f6]" : "bg-white dark:bg-white lg:dark:bg-[#081327]"}`}>
      <header className="fixed left-0 top-0 z-50 w-full">
        <Navbar />
      </header>

      <main
        className={[
          "flex-1",
          isHome ? "pt-[86px] md:pt-[94px] xl:pt-[102px]" : "pt-[88px] md:pt-[94px] xl:pt-[102px]",
          isHome
            ? "bg-[linear-gradient(180deg,#e9f1f8_0%,#eef3f7_28%,#edf2f6_100%)] text-[#1d2430]"
            : "bg-white text-[#1d2430] dark:bg-white dark:text-[#1d2430] lg:dark:bg-[linear-gradient(180deg,#081327_0%,#0c1b37_30%,#102347_68%,#0b1730_100%)] lg:dark:text-white",
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
