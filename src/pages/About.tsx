import { motion } from "framer-motion"
import {
  BadgeCheck,
  ShieldCheck,
  Clock,
  Headphones,
  Plane,
  Sparkles,
} from "lucide-react"

const stats = [
  { label: "Yordam", value: "24/7", icon: Headphones },
  { label: "Hamkor aviakompaniya", value: "120+", icon: Plane },
  { label: "Qulay bron", value: "1 daqiqada", icon: Clock },
  { label: "Xavfsiz to‘lov", value: "Protected", icon: ShieldCheck },
]

const values = [
  {
    title: "Shaffof tariflar",
    desc: "Yashirin to‘lovlarsiz. Narx, bagaj va shartlar aniq ko‘rsatiladi.",
    icon: BadgeCheck,
  },
  {
    title: "Premium xizmat",
    desc: "VIP support, tezkor javob va individual yondashuv.",
    icon: Sparkles,
  },
  {
    title: "Ishonchli hamkorlar",
    desc: "Top aviakompaniyalar va to‘lov provayderlari bilan ishlaymiz.",
    icon: ShieldCheck,
  },
]

export default function About() {
  return (
    <section className="relative overflow-hidden pt-20">
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#153a5b] via-[#0b1b2b] to-[#0A1220]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-52 right-[-140px] h-[520px] w-[520px] rounded-full bg-[#FF7A00]/10 blur-[140px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-14 md:py-16">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white/80">
            <Sparkles size={16} />
            TRIPZY — Premium aviabilet platformasi
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Biz haqimizda
          </h1>

          <p className="mt-4 text-white/70 max-w-3xl mx-auto text-lg">
            TRIPZY — aviabiletlarni tez, qulay va ishonchli bron qilish uchun
            yaratilgan premium platforma. Bizning maqsad — foydalanuvchiga
            “luxury” darajadagi tajriba berish: shaffof narx, aniq shartlar va
            24/7 yordam.
          </p>
        </motion.div>

        {/* stats */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white">
                  <s.icon size={20} />
                </span>
                <div>
                  <div className="text-white/60 text-xs">{s.label}</div>
                  <div className="text-white text-xl font-bold">{s.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* story + values */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 text-white/85">
              <Plane size={18} />
              <span className="font-semibold">Bizning yondashuv</span>
            </div>
            <h2 className="mt-3 text-2xl md:text-3xl font-extrabold text-white">
              Aviabilet tanlash — endi premium tajriba
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              Biz foydalanuvchi vaqtini tejash uchun eng muhim narsalarni bir
              joyda ko‘rsatamiz: reys vaqti, bagaj, qaytarish shartlari, servislar
              va yakuniy narx. Keyinchalik backend ulanganida real-time reyslar,
              bron qilish va to‘lov jarayoni ham to‘liq ishlaydi.
            </p>

            <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4 text-white/70 text-sm">
              {/* TODO: backend ulanganida */}
              TODO: “Real reyslar”, “seat availability”, “rules & terms” backend
              API orqali keladi.
            </div>
          </motion.div>

          <div className="space-y-4">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white">
                    <v.icon size={20} />
                  </span>
                  <div>
                    <div className="text-white font-bold text-lg">{v.title}</div>
                    <div className="mt-1 text-white/70">{v.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-10 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div>
            <div className="text-white text-xl md:text-2xl font-extrabold">
              Reyslarni ko‘rishga tayyormisiz?
            </div>
            <div className="mt-1 text-white/70">
              Eng yaxshi takliflarni bir necha soniyada toping.
            </div>
          </div>

          <a
            href="/flights"
            className="h-12 px-6 rounded-2xl bg-[#FF7A00] text-white font-semibold hover:opacity-90 transition shadow-[0_18px_60px_rgba(255,122,0,0.25)]"
          >
            Reyslarni ko‘rish
          </a>
        </motion.div>
      </div>
    </section>
  )
}
