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
      <main className="flex-1 ">
        <Outlet />
      </main>

      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
