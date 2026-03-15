import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { useI18n } from "@/shared/i18n/i18n"

export default function FAQ() {
  const { language } = useI18n()
  const copy = {
    uz: {
      title: "FAQ",
      desc: "Eng ko'p beriladigan savollar va javoblar.",
      items: [
        { q: "TRIPZY nima?", a: "TRIPZY premium aviabilet qidirish va bron qilish platformasi." },
        { q: "Narxlar yashirin fee bormi?", a: "Yo'q. Biz shaffof narx ko'rsatishga harakat qilamiz. Yakuniy narx tizimdan olinadi." },
        { q: "Bagaj qancha?", a: "Har bir reys taklifida bagaj miqdori alohida ko'rsatiladi." },
        { q: "Refund (qaytarish) bormi?", a: "Ba'zi tariflar refundable bo'ladi. Taklif ichida ko'rsatiladi." },
        { q: "To'lov qanday bo'ladi?", a: "To'lov usullari reys tanlash va bron jarayonida ko'rsatiladi." },
        { q: "Qo'llab-quvvatlash?", a: "24/7 support. Kontakt sahifasidan yozishingiz mumkin." },
      ],
    },
    ru: {
      title: "FAQ",
      desc: "Самые частые вопросы и ответы.",
      items: [
        { q: "Что такое TRIPZY?", a: "TRIPZY — премиальная платформа для поиска и бронирования авиабилетов." },
        { q: "Есть ли скрытые комиссии?", a: "Нет. Мы стараемся показывать прозрачную цену. Итоговая сумма приходит из системы." },
        { q: "Сколько багажа?", a: "Количество багажа указывается отдельно в каждом предложении рейса." },
        { q: "Есть ли возврат?", a: "Некоторые тарифы refundable. Это указано внутри предложения." },
        { q: "Как проходит оплата?", a: "Способы оплаты показываются при выборе рейса и в процессе бронирования." },
        { q: "Поддержка?", a: "Поддержка 24/7. Вы можете написать через страницу контактов." },
      ],
    },
    en: {
      title: "FAQ",
      desc: "Frequently asked questions and answers.",
      items: [
        { q: "What is TRIPZY?", a: "TRIPZY is a premium flight search and booking platform." },
        { q: "Are there hidden fees?", a: "No. We aim to show transparent pricing. The final amount comes from the system." },
        { q: "How much baggage is included?", a: "The baggage allowance is shown separately for each flight offer." },
        { q: "Is refund available?", a: "Some fares are refundable. This is shown inside the offer." },
        { q: "How does payment work?", a: "Payment methods are shown during flight selection and booking." },
        { q: "Support?", a: "24/7 support. You can contact us through the contact page." },
      ],
    },
  }[language]
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="relative overflow-hidden pt-20">
      <div className="relative mx-auto max-w-[900px] px-5 py-14 md:py-16">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-center">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">{copy.title}</h1>
          <p className="mt-4 text-lg text-white/70">{copy.desc}</p>
        </motion.div>

        <div className="mt-10 space-y-3">
          {copy.items.map((faq, idx) => {
            const isOpen = open === idx
            return (
              <div key={faq.q} className="overflow-hidden rounded-[22px] border border-white/15 bg-white/10 backdrop-blur-2xl">
                <button onClick={() => setOpen(isOpen ? null : idx)} className="flex w-full items-center justify-between px-5 py-4 text-left text-white">
                  <span className="font-semibold">{faq.q}</span>
                  <ChevronDown className={`transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      <div className="px-5 pb-5 text-sm leading-relaxed text-white/70">{faq.a}</div>
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
