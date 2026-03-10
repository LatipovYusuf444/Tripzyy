import { motion } from "framer-motion"
import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">

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
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] text-white font-semibold transition
                         shadow-[0_18px_60px_rgba(138,58,90,0.35)] hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110"
            >
              Bosh sahifaga qaytish
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
