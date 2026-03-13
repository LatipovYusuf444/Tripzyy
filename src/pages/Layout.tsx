import { Outlet } from "react-router-dom"

import Footer from "../components/site/Footer"
import Navbar from "../components/site/Navbar"

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#edf2f6]">
      <header className="fixed left-0 top-0 z-50 w-full">
        <Navbar />
      </header>

      <main className="flex-1 bg-[linear-gradient(180deg,#e9f1f8_0%,#eef3f7_28%,#edf2f6_100%)] text-[#1d2430]">
        <Outlet />
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  )
}
