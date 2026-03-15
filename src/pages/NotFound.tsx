import { motion } from "framer-motion"
import { Link } from "react-router-dom"

import { useI18n } from "@/shared/i18n/i18n"

export default function NotFound() {
  const { language } = useI18n()

  const copy = {
    uz: {
      title: "Sahifa topilmadi",
      desc: "Siz izlagan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.",
      back: "Bosh sahifaga qaytish",
    },
    ru: {
      title: "Страница не найдена",
      desc: "Страница, которую вы ищете, не существует или могла быть перемещена.",
      back: "Вернуться на главную",
    },
    en: {
      title: "Page not found",
      desc: "The page you are looking for does not exist or may have been moved.",
      back: "Back to home",
    },
  }[language]

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-[900px] px-5 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[28px] border border-white/15 bg-white/10 p-10 backdrop-blur-2xl"
        >
          <div className="text-7xl font-extrabold text-white">404</div>
          <div className="mt-2 text-2xl font-bold text-white">{copy.title}</div>
          <div className="mt-3 text-white/70">{copy.desc}</div>

          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="h-12 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] px-6 font-semibold text-white transition shadow-[0_18px_60px_rgba(138,58,90,0.35)] hover:brightness-110 hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)]"
            >
              {copy.back}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
