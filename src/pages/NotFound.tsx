import { motion } from "framer-motion"
import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#143a5f] via-[#0b1b2b] to-[#0A1220]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[900px] px-5 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-10"
        >
          <div className="text-white text-7xl font-extrabold">404</div>
          <div className="mt-2 text-white text-2xl font-bold">
            Sahifa topilmadi
          </div>
          <div className="mt-3 text-white/70">
            Siz izlagan sahifa mavjud emas yoki ko‘chirilgan bo‘lishi mumkin.
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="h-12 px-6 rounded-2xl bg-[#FF7A00] text-white font-semibold hover:opacity-90 transition"
            >
              Bosh sahifaga qaytish
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
