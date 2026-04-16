import { motion } from "framer-motion"
import {
  BadgeCheck,
  Building2,
  CreditCard,
  Headphones,
  HeartHandshake,
  Luggage,
  Palmtree,
  Plane,
  ShieldCheck,
  Sparkles,
  Stamp,
  Timer,
} from "lucide-react"
import { useI18n } from "@/shared/i18n/i18n"

export default function Services() {
  const { language } = useI18n()
  const copy = {
    uz: {
      badge: "Avia tour xizmatlari",
      titleA: "Safaringiz uchun",
      titleB: "asosiy xizmatlar",
      desc: "TRIPZY avia safar va tur jarayonini bir joyda boshqarishga yordam beradi. Aviabilet, mehmonxona, transfer, viza, sug'urta va korporativ safar xizmatlari bitta oqimda jamlangan.",
      stats: [
        { label: "24/7", value: "Safar yordami", desc: "Safar davomida doimiy aloqa va tezkor yordam ko'rsatiladi." },
        { label: "Tour", value: "Tayyor paketlar", desc: "Aviachipta, mehmonxona va dastur jamlangan qulay yechimlar." },
        { label: "Flight", value: "Aviabilet oqimi", desc: "Parvoz qidirish, solishtirish va bron qilish bir oqimda ishlaydi." },
        { label: "Safe", value: "Himoyalangan bron", desc: "Buyurtma va to'lov jarayoni ishonchli himoya bilan boshqariladi." },
      ],
      services: [
        { title: "Aviabilet bronlash", desc: "Ichki va xalqaro yo'nalishlar uchun qulay tariflarni tanlash va tez bron qilish.", icon: Plane },
        { title: "Tur paketlar", desc: "Aviachipta, yashash va dastur birlashtirilgan tayyor tur yechimlari.", icon: Palmtree },
        { title: "Mehmonxona bronlari", desc: "Safaringizga mos mehmonxona va joylashuv variantlarini tanlab berish.", icon: Building2 },
        { title: "Transfer xizmati", desc: "Aeroport, mehmonxona va uchrashuv nuqtalari orasida tartibli transfer.", icon: Timer },
        { title: "Viza yordami", desc: "Viza uchun hujjatlar tayyorlash va topshirish bosqichlarida ko'mak.", icon: Stamp },
        { title: "Safar sug'urtasi", desc: "Safar davomida qo'shimcha himoya va ishonch uchun sug'urta yechimlari.", icon: BadgeCheck },
        { title: "24/7 qo'llab-quvvatlash", desc: "Parvoz, bron va safar jarayonida doimiy aloqa va yordam.", icon: HeartHandshake },
        { title: "Tezkor yordam", desc: "Telefon va messenjer orqali tezkor javob va yo'naltirish.", icon: Headphones },
        { title: "Shaffof narxlar", desc: "Yashirin to'lovlarsiz, yakuniy summani oldindan aniq ko'rsatish.", icon: CreditCard },
        { title: "Bagaj va tarif qoidalari", desc: "Bagaj normasi, qaytarish va almashtirish shartlarini tushunarli ko'rsatish.", icon: Luggage },
        { title: "Premium safar paketi", desc: "Ustuvor xizmatlar, VIP yordam va tezkor qayta rasmiylashtirish.", icon: Sparkles },
        { title: "Korporativ safar", desc: "Kompaniyalar uchun xizmat safari, limit va hisobot yechimlari.", icon: Building2 },
        { title: "Ishonch va himoya", desc: "Ma'lumotlar xavfsizligi va to'lov oqimini nazorat qiluvchi himoya qatlamlari.", icon: ShieldCheck },
      ],
    },
    ru: {
      badge: "Avia tour услуги",
      titleA: "Основные услуги",
      titleB: "для вашей поездки",
      desc: "TRIPZY помогает управлять авиапоездкой и туром в одном месте. Авиабилеты, отели, трансфер, виза, страховка и корпоративные поездки собраны в одном потоке.",
      stats: [
        { label: "24/7", value: "Поддержка в пути", desc: "Во время поездки вы получаете постоянную связь и быструю помощь." },
        { label: "Tour", value: "Готовые пакеты", desc: "Удобные решения с авиабилетами, проживанием и программой." },
        { label: "Flight", value: "Поток авиабилетов", desc: "Поиск, сравнение и бронирование работают в одном процессе." },
        { label: "Safe", value: "Защищённое бронирование", desc: "Заказ и оплата проходят с надёжной защитой." },
      ],
      services: [
        { title: "Бронирование авиабилетов", desc: "Подбор удобных тарифов и быстрое бронирование внутренних и международных направлений.", icon: Plane },
        { title: "Турпакеты", desc: "Готовые тур-решения с авиабилетом, проживанием и программой.", icon: Palmtree },
        { title: "Бронирование отелей", desc: "Подбор подходящих отелей и вариантов размещения под вашу поездку.", icon: Building2 },
        { title: "Трансфер", desc: "Организованный трансфер между аэропортом, отелем и точками встречи.", icon: Timer },
        { title: "Визовая поддержка", desc: "Помощь в подготовке и подаче документов на визу.", icon: Stamp },
        { title: "Страхование поездки", desc: "Дополнительная защита и уверенность во время путешествия.", icon: BadgeCheck },
        { title: "Поддержка 24/7", desc: "Постоянная связь и помощь во время перелёта, брони и поездки.", icon: HeartHandshake },
        { title: "Быстрая помощь", desc: "Оперативные ответы и сопровождение по телефону и в мессенджерах.", icon: Headphones },
        { title: "Прозрачные цены", desc: "Без скрытых платежей, с заранее понятной итоговой суммой.", icon: CreditCard },
        { title: "Багаж и тарифные правила", desc: "Понятное объяснение норм багажа, условий возврата и обмена.", icon: Luggage },
        { title: "Премиум пакет", desc: "Приоритетные услуги, VIP-поддержка и быстрое переоформление.", icon: Sparkles },
        { title: "Корпоративные поездки", desc: "Командировки, лимиты и отчётные решения для компаний.", icon: Building2 },
        { title: "Надёжность и защита", desc: "Слои защиты для безопасности данных и платёжного потока.", icon: ShieldCheck },
      ],
    },
    en: {
      badge: "Avia tour services",
      titleA: "Core services",
      titleB: "for your trip",
      desc: "TRIPZY helps manage flights and travel services in one place. Tickets, hotels, transfers, visas, insurance, and corporate travel are combined in one flow.",
      stats: [
        { label: "24/7", value: "Travel support", desc: "Continuous contact and fast assistance during the whole trip." },
        { label: "Tour", value: "Ready packages", desc: "Convenient bundles with flights, stays, and travel programs." },
        { label: "Flight", value: "Flight flow", desc: "Search, compare, and book flights in one simple process." },
        { label: "Safe", value: "Protected booking", desc: "Orders and payments are secured with reliable protection layers." },
      ],
      services: [
        { title: "Flight booking", desc: "Pick convenient fares and book domestic and international routes quickly.", icon: Plane },
        { title: "Tour packages", desc: "Ready tour solutions combining flights, stays, and programs.", icon: Palmtree },
        { title: "Hotel booking", desc: "Select hotel and stay options that fit your trip.", icon: Building2 },
        { title: "Transfer service", desc: "Organized transfer between the airport, hotel, and meeting points.", icon: Timer },
        { title: "Visa support", desc: "Support with visa documents and submission steps.", icon: Stamp },
        { title: "Travel insurance", desc: "Extra protection and confidence during your journey.", icon: BadgeCheck },
        { title: "24/7 assistance", desc: "Ongoing support during flights, booking, and travel.", icon: HeartHandshake },
        { title: "Fast support", desc: "Quick replies and guidance via phone and messenger.", icon: Headphones },
        { title: "Transparent pricing", desc: "No hidden fees, with a clear final amount upfront.", icon: CreditCard },
        { title: "Baggage and fare rules", desc: "Clear explanation of baggage, refund, and change conditions.", icon: Luggage },
        { title: "Premium travel pack", desc: "Priority services, VIP support, and fast reissue flow.", icon: Sparkles },
        { title: "Corporate travel", desc: "Business trip, limit, and reporting solutions for companies.", icon: Building2 },
        { title: "Trust and protection", desc: "Protection layers for secure data and payment flow.", icon: ShieldCheck },
      ],
    },
  }[language]

  return (
    <section className="secondary-page-shell relative overflow-hidden pt-4 md:pt-20">
      <div className="secondary-page-overlay pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1560px] px-4 py-6 sm:px-6 md:px-8 md:py-12 2xl:max-w-[1720px]">
        <div className="rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,249,255,0.92)_100%)] p-5 shadow-[0_28px_80px_rgba(17,24,39,0.08)] backdrop-blur-xl md:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-[#dce4ef] bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(244,248,255,0.88)_36%,rgba(238,243,251,0.82)_62%,rgba(248,243,247,0.74)_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f0] bg-[rgba(255,255,255,0.82)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6d87]">
                <Sparkles size={14} />
                {copy.badge}
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 max-w-[680px] text-[34px] font-black leading-[1.02] tracking-[-0.04em] text-[#1d2430] md:text-[48px]"
              >
                {copy.titleA}
                <span className="bg-[linear-gradient(135deg,#243a7a_0%,#a44c72_45%,#e36b3a_100%)] bg-clip-text text-transparent">
                  {" "}{copy.titleB}
                </span>
              </motion.h1>

              <p className="mt-5 max-w-[620px] text-[15px] leading-8 text-[#627188] md:text-[16px]">
                {copy.desc}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {copy.stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,251,255,0.84)_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.06)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0]">
                    {item.label}
                  </div>
                  <div className="mt-2 text-xl font-black text-[#1d2430]">{item.value}</div>
                  <div className="mt-3 text-sm leading-6 text-[#627188]">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {copy.services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.02 }}
                whileHover={{ y: -4 }}
                className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,251,255,0.84)_100%)] p-5 shadow-[0_20px_50px_rgba(17,24,39,0.06)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#edf5ff_0%,#dceaff_100%)] text-[#3b6db6]">
                  <service.icon size={20} />
                </div>
                <div className="mt-4 text-lg font-black text-[#1d2430]">{service.title}</div>
                <div className="mt-2 text-sm leading-7 text-[#627188]">{service.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
