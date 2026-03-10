import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Clock, Sparkles } from "lucide-react"

const info = [
  { label: "Telefon", value: "+998 93 505 45 05", icon: Phone },
  { label: "Email", value: "info@tripzy.uz", icon: Mail },
  { label: "Manzil", value: "Toshkent, Uzbekistan", icon: MapPin },
  { label: "Ish vaqti", value: "09:00 — 23:00", icon: Clock },
]

export default function Location() {
  return (
    <section className="relative pt-16 pb-16 bg-[#f3f3f3] text-[#1b1f2a]">

      <div className="relative mx-auto max-w-[1200px] px-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[#4a5361]">
            <Sparkles size={16} />
            Support Center
          </div>
          <h2 className="mt-5 text-3xl md:text-4xl font-extrabold">
            Bizning ofis va aloqa
          </h2>
          <p className="mt-3 text-[#4a5361] max-w-3xl mx-auto text-base md:text-lg">
            Savollaringiz bo‘lsa, 24/7 yordam beramiz. Luxury darajadagi support va
            shaffof xizmat.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-black/10 bg-white p-6 md:p-7 shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
          >
            <div className="text-lg md:text-xl font-extrabold">
              Aloqa ma’lumotlari
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {info.map((x) => (
                <div
                  key={x.label}
                  className="rounded-2xl border border-black/10 bg-[#f8f8f8] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#4a5361] border border-black/10">
                      <x.icon size={18} />
                    </span>
                    <div>
                      <div className="text-[#6b7280] text-xs">{x.label}</div>
                      <div className="text-[#1b1f2a] font-semibold">{x.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-[#f8f8f8] p-4 text-[#4a5361] text-sm">
              Premium mijozlar uchun alohida VIP liniya va tezkor javoblar mavjud.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
          >
            <div className="relative h-[320px]">
              {/* Real map (OpenStreetMap embed, no API key) */}
              <iframe
                title="Tripzy HQ Map"
                className="absolute inset-0 h-full w-full"
                src="https://www.openstreetmap.org/export/embed.html?bbox=69.2000%2C41.2500%2C69.3000%2C41.3500&amp;layer=mapnik&amp;marker=41.3111%2C69.2797"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/30 pointer-events-none" />

              <div className="absolute left-6 top-6 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-[#1b1f2a] text-sm backdrop-blur">
                TRIPZY HQ
              </div>
              <div className="absolute bottom-6 left-6 text-white">
                <div className="text-xl font-bold">Toshkent</div>
                <div className="text-white/80 text-sm">Luxury support markazi</div>
              </div>
            </div>
            <div className="p-6 text-[#4a5361] text-sm">
              Xarita real ishlaydi. Manzilni o‘zgartirish kerak bo‘lsa, koordinatani ayting.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
