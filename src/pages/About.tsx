import { motion } from "framer-motion"
import {
  CheckCircle,
  Plane,
  ShieldCheck,
  Headphones,
  Sparkles,
  Rocket,
  CreditCard,
  UserCheck,
  PlaneTakeoff,
  Globe,
  Clock,
  BadgeCheck,
  Building2,
  MessagesSquare,
  Shield,
} from "lucide-react"

const stats = [
  { value: "120+", label: "Yo‘nalishlar" },
  { value: "500+", label: "Kunlik reyslar (target)" },
  { value: "24/7", label: "Qo‘llab-quvvatlash" },
  { value: "100%", label: "Shaffof narx siyosati" },
]

const features = [
  {
    icon: Plane,
    title: "Tezkor qidiruv",
    desc: "Bir necha soniyada yo‘nalish, narx va vaqt bo‘yicha eng mos reyslar.",
  },
  {
    icon: ShieldCheck,
    title: "Ishonchli bron qilish",
    desc: "Shaffof tariflar, baggage shartlari va aniq yakuniy narx.",
  },
  {
    icon: Headphones,
    title: "Premium support",
    desc: "Savol bo‘lsa, tezkor yordam: Telegram/telefon orqali 24/7.",
  },
]

/** ✅ AVIATION-CONTENT: Bajarilgan ishlar (aviaga mos) */
const doneList = [
  "Premium landing dizayn: Hero + Flight Search + Yo‘nalishlar + Footer (bir xil luxury theme)",
  "Sahifalar tayyor: Home, About, Services, Flights, Contact, FAQ, Register",
  "Flight Search → /flights ga query bilan o‘tish (from/to/date/pax) — UX tayyor",
  "Flights page query paramsni o‘qib form’ni avtomatik to‘ldiradi (backendga tayyor)",
  "Component arxitektura: keyin API ulash uchun tayyor joylar (TODO) qoldirilgan",
]

/** ✅ AVIATION-CONTENT: Roadmap (aviabilet platforma oqimi) */
const roadmap = [
  {
    icon: Sparkles,
    title: "Premium UI/UX (landing)",
    desc: "Hero + qidiruv + yo‘nalishlar + sahifalar yagona premium style’da.",
    status: "done" as const,
  },
  {
    icon: Rocket,
    title: "Reys qidiruv API integratsiya",
    desc: "Real backend: search, filters, sorting, pagination, loading/error state.",
    status: "next" as const,
  },
  {
    icon: UserCheck,
    title: "Booking oqimi",
    desc: "Reys tanlash → Passenger ma’lumot → Tasdiqlash → E-ticket/Invoice.",
    status: "next" as const,
  },
  {
    icon: CreditCard,
    title: "Payment & status tracking",
    desc: "Click/Payme/Stripe, to‘lov statuslari, refund/void siyosati.",
    status: "later" as const,
  },
]

/** ✅ AVIATION-CONTENT: Team (aviaga mos rollar) */
const team = [
  {
    name: "Product & UX",
    role: "Bron jarayoni, premium UX, conversion",
    badge: "Core",
    icon: Building2,
  },
  {
    name: "Frontend Engineer",
    role: "React + Tailwind, Flight Search UI, performance",
    badge: "Core",
    icon: PlaneTakeoff,
  },
  {
    name: "Backend Engineer",
    role: "Flights API, booking, payment, ticketing",
    badge: "Core",
    icon: Shield,
  },
  {
    name: "Support & Operations",
    role: "Mijozlar bilan aloqa, 24/7 support, qaytarish siyosati",
    badge: "Care",
    icon: MessagesSquare,
  },
]

export default function About() {
  return (
    <section className="relative overflow-hidden pt-20">
      {/* ✅ BG OCHROQ (hero/footer bilan mos, lekin lightroq) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F2740] via-[#0B1E33] to-[#081626]" />

      {/* Luxury glows */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-white/12 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-40 right-[-120px] h-[420px] w-[420px] rounded-full bg-[#FF7A00]/14 blur-[120px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-20">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Biz haqimizda
          </h1>
          <div className="w-24 h-1 bg-[#FF7A00] mx-auto my-5 rounded-full" />
          <p className="text-lg md:text-xl text-white/85 leading-relaxed">
            <span className="text-white font-semibold">TRIPZY</span> — aviabiletlarni qidirish
            va bron qilish uchun premium platforma. Maqsadimiz: foydalanuvchiga{" "}
            <span className="text-white font-semibold">tez</span>,{" "}
            <span className="text-white font-semibold">ishonchli</span> va{" "}
            <span className="text-white font-semibold">shaffof</span> bron tajribasini berish.
          </p>
        </motion.div>

        {/* STATS */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="
                rounded-3xl border border-white/18
                bg-white/10 backdrop-blur-2xl
                p-6 text-center
                shadow-[0_35px_90px_rgba(0,0,0,0.45)]
              "
            >
              <div className="text-3xl md:text-4xl font-extrabold text-white">
                {s.value}
              </div>
              <div className="mt-2 text-white/70 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ✅ AVIATION GLASS SECTION */}
        <AviationGlassSection />

        {/* FEATURES */}
        <div className="mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-3xl md:text-4xl font-bold text-center text-white"
          >
            Nega TRIPZY?
          </motion.h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="
                    rounded-3xl border border-white/18
                    bg-white/10 backdrop-blur-2xl
                    p-8 shadow-[0_35px_90px_rgba(0,0,0,0.5)]
                  "
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#FF7A00]/18 flex items-center justify-center">
                      <Icon className="text-[#FF7A00]" size={26} />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{f.title}</h3>
                  </div>
                  <p className="mt-4 text-white/75 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ✅ DONE LIST (aviaga mos) */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="
            mt-20 max-w-5xl mx-auto
            rounded-[34px]
            border border-white/18
            bg-white/10 backdrop-blur-2xl
            p-10
            shadow-[0_40px_120px_rgba(0,0,0,0.55)]
          "
        >
          <h3 className="text-2xl md:text-3xl font-semibold text-white mb-6 text-center">
            Hozirgi bajarilgan ishlar (Aviabilet platforma)
          </h3>

          <ul className="space-y-4 text-white/85">
            {doneList.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle className="text-[#FF7A00] mt-1" size={20} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-white/65 text-sm">
            {/* TODO */}
            Keyingi bosqich: real flight API ulash, booking oqimi va payment.
          </p>
        </motion.div>

        {/* ✅ ROADMAP (aviaga mos) */}
        <div className="mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-3xl md:text-4xl font-bold text-center text-white"
          >
            Roadmap (Aviabilet platforma)
          </motion.h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {roadmap.map((r, i) => {
              const Icon = r.icon
              const badge =
                r.status === "done" ? "Tayyor" : r.status === "next" ? "Keyingi" : "Keyinroq"

              const badgeStyle =
                r.status === "done"
                  ? "bg-green-500/18 text-green-100 border-green-500/25"
                  : r.status === "next"
                  ? "bg-[#FF7A00]/18 text-[#FF7A00] border-[#FF7A00]/25"
                  : "bg-white/12 text-white/75 border-white/18"

              return (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="
                    rounded-3xl border border-white/18
                    bg-white/10 backdrop-blur-2xl
                    p-8 shadow-[0_35px_90px_rgba(0,0,0,0.55)]
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/12 flex items-center justify-center">
                        <Icon className="text-white" size={24} />
                      </div>

                      <div>
                        <div className="text-xl font-semibold text-white">{r.title}</div>
                        <div className="mt-2 text-white/75">{r.desc}</div>
                      </div>
                    </div>

                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
                      {badge}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ✅ TEAM (aviaga mos) */}
        <div className="mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-3xl md:text-4xl font-bold text-center text-white"
          >
            Jamoa
          </motion.h2>

          <p className="mt-4 text-center text-white/75 max-w-2xl mx-auto">
            Aviabilet platforma uchun kerak bo‘ladigan asosiy rollar. Keyin real ismlar va avatarlar qo‘shiladi.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m, i) => {
              const Icon = m.icon
              return (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="
                    rounded-3xl border border-white/18
                    bg-white/10 backdrop-blur-2xl
                    p-6 shadow-[0_35px_90px_rgba(0,0,0,0.55)]
                  "
                >
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-white/12 grid place-items-center">
                      <Icon className="text-white" size={22} />
                    </div>

                    <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs text-white/80">
                      {m.badge}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-lg font-semibold text-white">{m.name}</div>
                    <div className="mt-1 text-sm text-white/75">{m.role}</div>
                  </div>

                  <button
                    className="mt-5 w-full h-11 rounded-2xl bg-white/10 border border-white/15 text-white/90 hover:bg-white/15 transition"
                    onClick={() => alert("Keyin: Team profile / ijtimoiy linklar")}
                  >
                    Profil
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="mt-20 h-px w-full bg-white/12" />
      </div>
    </section>
  )
}

/* ✅ Aviation glass block (bg ochroq, glass kuchliroq) */
function AviationGlassSection() {
  return (
    <section className="relative mt-18 md:mt-20">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-white/12 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="
          relative mx-auto max-w-[1100px]
          rounded-[36px]
          border border-white/22
          bg-white/12
          backdrop-blur-2xl
          px-6 md:px-10 py-14
          shadow-[0_45px_140px_rgba(0,0,0,0.6)]
        "
      >
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Aviabiletlar haqida
          </h2>
          <div className="w-24 h-1 bg-[#FF7A00] mx-auto my-5 rounded-full" />
          <p className="text-lg md:text-xl text-white/85 leading-relaxed">
            TRIPZY — reyslarni solishtirish va bron qilishni qulaylashtiruvchi premium platforma.
            Biz sizga narx, vaqt, aeroport va baggage bo‘yicha eng mos variantni topishda yordam beramiz.
          </p>
        </div>

        <div className="mt-12 max-w-4xl mx-auto text-center">
          <p className="text-white/85 text-lg leading-relaxed">
            Platforma qidiruv natijalarini shaffof ko‘rsatishga mo‘ljallangan:
            yakuniy narx, tarif shartlari, qaytarish (refund) siyosati va reys tafsilotlari aniq bo‘ladi.
            Keyingi bosqichda real aviatsiya API’lari bilan ulanib, booking va payment ham to‘liq ishga tushadi.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard icon={PlaneTakeoff} title="Global reyslar" desc="Xalqaro yo‘nalishlar va aviakompaniyalar bilan integratsiya." />
          <GlassCard icon={Clock} title="Tezkor qidiruv" desc="Eng mos reyslarni soniyalar ichida topish imkoniyati." />
          <GlassCard icon={BadgeCheck} title="Shaffof narxlar" desc="Yashirin to‘lovlarsiz yakuniy narxni ko‘rsatish." />
          <GlassCard icon={Globe} title="Keng filtrlar" desc="Vaqt, narx, airport, baggage, class bo‘yicha filterlash." />
        </div>
      </motion.div>
    </section>
  )
}

function GlassCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: any
  title: string
  desc: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="
        rounded-2xl
        border border-white/22
        bg-white/12
        backdrop-blur-xl
        p-6
        shadow-[0_30px_80px_rgba(0,0,0,0.55)]
        hover:bg-white/16
        transition
      "
    >
      <div className="h-12 w-12 rounded-xl bg-white/16 flex items-center justify-center mb-4">
        <Icon className="text-white" size={24} />
      </div>
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-2 text-white/75 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  )
}
