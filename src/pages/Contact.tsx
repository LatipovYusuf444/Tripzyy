import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function Contact() {
  return (
    <section className="relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#143a5f] via-[#0b1b2b] to-[#0A1220]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-14 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Contact
          </h1>
          <p className="mt-4 text-white/70 max-w-3xl mx-auto text-lg">
            Savollaringiz bormi? Biz 24/7 yordam beramiz. Forma orqali yozing yoki telefon qiling.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* form */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 md:p-8"
          >
            <div className="text-white text-xl font-bold">Bizga yozing</div>

            <form
              className="mt-6 space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                // TODO: backend ulash:
                // await http.post("/contact", { name, phone, message })
                alert("Demo ✅ Keyin backendga ulanadi")
              }}
            >
              <input
                className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-white/25"
                placeholder="Ism"
              />
              <input
                className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-white/25"
                placeholder="Telefon"
              />
              <input
                className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-white/25"
                placeholder="Email"
              />
              <textarea
                className="min-h-[120px] w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-white outline-none focus:border-white/25"
                placeholder="Xabaringiz..."
              />
              <button className="h-12 w-full rounded-2xl bg-[#FF7A00] font-semibold text-white hover:opacity-90 transition shadow-[0_18px_60px_rgba(255,122,0,0.25)]">
                Yuborish
              </button>

              <div className="text-xs text-white/50">
                TODO: backend ulanganida message DBga yoziladi yoki Telegram botga yuboriladi.
              </div>
            </form>
          </motion.div>

          {/* info */}
          <div className="space-y-4">
            <InfoCard icon={Phone} title="Telefon" value="+998 93 505 45 05" />
            <InfoCard icon={Mail} title="Email" value="info@tripzy.uz" />
            <InfoCard icon={MapPin} title="Manzil" value="Toshkent, Uzbekistan (demo)" />
            <InfoCard icon={Clock} title="Ish vaqti" value="09:00 — 23:00" />

            <div className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 text-white/70 text-sm">
              {/* TODO */}
              TODO: keyin Google Map embed va real office location qo‘shamiz.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoCard({
  icon: Icon,
  title,
  value,
}: {
  icon: any
  title: string
  value: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6"
    >
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white">
          <Icon size={20} />
        </span>
        <div>
          <div className="text-white/60 text-xs">{title}</div>
          <div className="text-white font-bold">{value}</div>
        </div>
      </div>
    </motion.div>
  )
}
