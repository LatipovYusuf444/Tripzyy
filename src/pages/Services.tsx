import { motion } from "framer-motion"
import {
  ShieldCheck,
  Headphones,
  BadgeCheck,
  CreditCard,
  Luggage,
  Sparkles,
  Building2,
  Timer,
} from "lucide-react"

const services = [
  { title: "24/7 Support", desc: "Telegram/Call orqali tezkor yordam.", icon: Headphones },
  { title: "Shaffof narxlar", desc: "Yashirin fee yo‘q. Yakuniy narx aniq.", icon: BadgeCheck },
  { title: "Xavfsiz to‘lov", desc: "PCI-ready oqim (backend ulanganida).", icon: CreditCard },
  { title: "Bagaj & qoidalar", desc: "Bagaj, qaytarish va o‘zgartirish shartlari.", icon: Luggage },
  { title: "Premium paket", desc: "Priority, VIP support, tez qayta rasmiylashtirish.", icon: Sparkles },
  { title: "Korporativ xizmat", desc: "Kompaniyalar uchun hisobot va limit.", icon: Building2 },
  { title: "Ishonch & himoya", desc: "To‘lov va ma’lumotlar himoyasi.", icon: ShieldCheck },
  { title: "Tez bron", desc: "Minimal vaqt, maksimal qulaylik.", icon: Timer },
]

export default function Services() {
  return (
    <section className="relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#12324f] via-[#0b1b2b] to-[#0A1220]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-14 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Xizmatlarimiz
          </h1>
          <p className="mt-4 text-white/70 max-w-3xl mx-auto text-lg">
            Biz TRIPZY’da aviabilet topishdan boshlab bron qilishgacha bo‘lgan
            jarayonni premium darajada qilamiz.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] hover:bg-white/12 transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white">
                <s.icon size={20} />
              </div>
              <div className="mt-4 text-white font-bold text-lg">{s.title}</div>
              <div className="mt-2 text-white/70 text-sm leading-relaxed">
                {s.desc}
              </div>

              <div className="mt-4 text-xs text-white/50">
                {/* TODO backend */}
                TODO: backend ulanganida servislar real tarifga bog‘lanadi.
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
