import { Outlet } from "react-router-dom";
import Navbar from "../components/site/Navbar";
import Footer from "../components/site/Footer";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar fixed */}
      <header className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </header>

      {/* Navbar balandligi qancha bo'lsa shuncha padding-top */}
      <main className="flex-1 text-[#e6e9ef] bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(138,58,90,0.35),transparent_60%),radial-gradient(900px_500px_at_80%_0%,rgba(231,178,109,0.2),transparent_55%),linear-gradient(180deg,#0b0d12_0%,#101320_45%,#0a0c13_100%)]">
        <Outlet />
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
