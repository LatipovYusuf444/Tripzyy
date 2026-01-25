import { NavLink } from "react-router-dom"

export default function NotFound() {
  return (
    <section className="bg-[#0A1220]">
      <div className="mx-auto max-w-[900px] px-5 py-24 text-center">
        <div className="text-6xl font-extrabold">404</div>
        <p className="mt-4 text-white/70">Bunday sahifa topilmadi.</p>

        <div className="mt-8 flex justify-center">
          <NavLink
            to="/"
            className="h-12 px-6 rounded-2xl bg-[#FF7A00] font-semibold flex items-center hover:opacity-90 transition"
          >
            Home
          </NavLink>
        </div>
      </div>
    </section>
  )
}
