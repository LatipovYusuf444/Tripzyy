import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  { q: "TRIPZY nima?", a: "TRIPZY — premium aviabilet qidirish va bron qilish platformasi (demo). Backend ulanganida real reyslar chiqadi." },
  { q: "Narxlar yashirin fee bormi?", a: "Yo‘q. Biz shaffof ko‘rsatishga harakat qilamiz. Yakuniy narx backenddan keladi." },
  { q: "Bagaj qancha?", a: "Har bir reys taklifida bagaj ko‘rsatiladi. Keyin backenddan real bagaj keladi." },
  { q: "Refund (qaytarish) bormi?", a: "Ba’zi tariflar refundable bo‘ladi. Taklif ichida ko‘rsatiladi." },
  { q: "To‘lov qanday bo‘ladi?", a: "Hozir demo. Keyin Click/Payme/Visa/Master orqali backendda payment integratsiya qilinadi." },
  { q: "Qo‘llab-quvvatlash?", a: "24/7 support. Kontakt sahifasidan yozishingiz mumkin." },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#143a5f] via-[#0b1b2b] to-[#0A1220]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[900px] px-5 py-14 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">FAQ</h1>
          <p className="mt-4 text-white/70 text-lg">
            Eng ko‘p beriladigan savollar va javoblar.
          </p>
        </motion.div>

        <div className="mt-10 space-y-3">
          {faqs.map((f, idx) => {
            const isOpen = open === idx
            return (
              <div
                key={f.q}
                className="rounded-[22px] border border-white/15 bg-white/10 backdrop-blur-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-white"
                >
                  <span className="font-semibold">{f.q}</span>
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
                      <div className="px-5 pb-5 text-white/70 text-sm leading-relaxed">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center text-xs text-white/50">
          TODO: backend ulanganida FAQ lar admin paneldan boshqariladi.
        </div>
      </div>
    </section>
  )
}
