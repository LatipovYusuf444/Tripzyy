import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "TRIPZY nima?",
    a: "TRIPZY premium aviabilet qidirish va bron qilish platformasi.",
  },
  {
    q: "Narxlar yashirin fee bormi?",
    a: "Yo'q. Biz shaffof narx ko'rsatishga harakat qilamiz. Yakuniy narx tizimdan olinadi.",
  },
  {
    q: "Bagaj qancha?",
    a: "Har bir reys taklifida bagaj miqdori alohida ko'rsatiladi.",
  },
  {
    q: "Refund (qaytarish) bormi?",
    a: "Ba'zi tariflar refundable bo'ladi. Taklif ichida ko'rsatiladi.",
  },
  {
    q: "To'lov qanday bo'ladi?",
    a: "To'lov usullari reys tanlash va bron jarayonida ko'rsatiladi.",
  },
  {
    q: "Qo'llab-quvvatlash?",
    a: "24/7 support. Kontakt sahifasidan yozishingiz mumkin.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="relative overflow-hidden pt-20">
      <div className="relative mx-auto max-w-[900px] px-5 py-14 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">FAQ</h1>
          <p className="mt-4 text-lg text-white/70">
            Eng ko'p beriladigan savollar va javoblar.
          </p>
        </motion.div>

        <div className="mt-10 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = open === idx
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-[22px] border border-white/15 bg-white/10 backdrop-blur-2xl"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-white"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <ChevronDown className={`transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 text-sm leading-relaxed text-white/70">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
