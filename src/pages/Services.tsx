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
        { label: "24/7", value: "Safar supporti" },
        { label: "Tour", value: "Tayyor paketlar" },
        { label: "Flight", value: "Aviabilet oqimi" },
        { label: "Safe", value: "Himoyalangan bron" },
      ],
      services: [
        { title: "Aviabilet bronlash", desc: "Ichki va xalqaro yo'nalishlar uchun qulay tariflarni tanlash va tez bron qilish.", icon: Plane },
        { title: "Tur paketlar", desc: "Aviachipta, yashash va dastur birlashtirilgan tayyor tur yechimlari.", icon: Palmtree },
        { title: "Mehmonxona bronlari", desc: "Safaringizga mos mehmonxona va joylashuv variantlarini tanlab berish.", icon: Building2 },
        { title: "Transfer xizmati", desc: "Aeroport, mehmonxona va uchrashuv nuqtalari orasida tartibli transfer.", icon: Timer },
        { title: "Visa support", desc: "Viza uchun hujjatlar tayyorlash va topshirish bosqichlarida ko'mak.", icon: Stamp },
        { title: "Safar sug'urtasi", desc: "Safar davomida qo'shimcha himoya va ishonch uchun sug'urta yechimlari.", icon: BadgeCheck },
        { title: "24/7 qo'llab-quvvatlash", desc: "Parvoz, bron va safar jarayonida doimiy aloqa va yordam.", icon: HeartHandshake },
        { title: "Tezkor support", desc: "Telefon va messenjer orqali tezkor javob va yo'naltirish.", icon: Headphones },
        { title: "Shaffof narxlar", desc: "Yashirin to'lovlarsiz, yakuniy summani oldindan aniq ko'rsatish.", icon: CreditCard },
        { title: "Bagaj va tarif qoidalari", desc: "Bagaj normasi, refund va change shartlarini tushunarli ko'rsatish.", icon: Luggage },
        { title: "Premium safar paketi", desc: "Priority xizmatlar, VIP support va tezkor qayta rasmiylashtirish.", icon: Sparkles },
        { title: "Korporativ safar", desc: "Kompaniyalar uchun xizmat safari, limit va hisobot yechimlari.", icon: Building2 },
        { title: "Ishonch va himoya", desc: "Ma'lumotlar xavfsizligi va to'lov oqimini nazorat qiluvchi himoya qatlamlari.", icon: ShieldCheck },
      ],
    },
    ru: {
      badge: "Услуги avia tour",
      titleA: "Основные услуги",
      titleB: "для вашей поездки",
      desc: "TRIPZY помогает управлять авиапоездкой и туром в одном месте. Авиабилеты, отели, трансфер, виза, страховка и корпоративные поездки собраны в одном потоке.",
      stats: [
        { label: "24/7", value: "Поддержка в пути" },
        { label: "Tour", value: "Готовые пакеты" },
        { label: "Flight", value: "Поток авиабилетов" },
        { label: "Safe", value: "Защищенное бронирование" },
      ],
      services: [
        { title: "Бронирование авиабилетов", desc: "Подбор удобных тарифов и быстрое бронирование внутренних и международных направлений.", icon: Plane },
        { title: "Турпакеты", desc: "Готовые тур-решения с авиабилетом, проживанием и программой.", icon: Palmtree },
        { title: "Бронирование отелей", desc: "Подбор подходящих отелей и вариантов размещения под вашу поездку.", icon: Building2 },
        { title: "Трансфер", desc: "Организованный трансфер между аэропортом, отелем и точками встречи.", icon: Timer },
        { title: "Визовая поддержка", desc: "Помощь в подготовке и подаче документов на визу.", icon: Stamp },
        { title: "Страхование поездки", desc: "Дополнительная защита и уверенность во время путешествия.", icon: BadgeCheck },
        { title: "Поддержка 24/7", desc: "Постоянная связь и помощь в процессе перелета, брони и поездки.", icon: HeartHandshake },
        { title: "Быстрый саппорт", desc: "Оперативные ответы и сопровождение по телефону и в мессенджерах.", icon: Headphones },
        { title: "Прозрачные цены", desc: "Без скрытых платежей, с заранее понятной итоговой суммой.", icon: CreditCard },
        { title: "Багаж и тарифные правила", desc: "Понятное объяснение норм багажа, refund и change условий.", icon: Luggage },
        { title: "Премиум пакет", desc: "Priority сервисы, VIP support и быстрое переоформление.", icon: Sparkles },
        { title: "Корпоративные поездки", desc: "Командировки, лимиты и отчетные решения для компаний.", icon: Building2 },
        { title: "Надежность и защита", desc: "Слои защиты для безопасности данных и платежного потока.", icon: ShieldCheck },
      ],
    },
    en: {
      badge: "Avia tour services",
      titleA: "Core services",
      titleB: "for your trip",
      desc: "TRIPZY helps manage flights and travel services in one place. Tickets, hotels, transfers, visas, insurance, and corporate travel are combined in one flow.",
      stats: [
        { label: "24/7", value: "Travel support" },
        { label: "Tour", value: "Ready packages" },
        { label: "Flight", value: "Flight flow" },
        { label: "Safe", value: "Protected booking" },
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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#e2e8ef_0%,#eef3f8_18%,#f8fbff_62%,#eaf0f7_100%)] pt-20 text-[#1d2430] dark:bg-[linear-gradient(180deg,#07111f_0%,#0a1730_24%,#102347_58%,#0a1730_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(860px_340px_at_16%_0%,rgba(81,121,197,0.16),transparent_62%),radial-gradient(640px_280px_at_84%_4%,rgba(219,116,101,0.12),transparent_55%),radial-gradient(720px_320px_at_50%_28%,rgba(156,88,129,0.08),transparent_60%)] dark:bg-[radial-gradient(920px_380px_at_16%_0%,rgba(78,118,204,0.24),transparent_58%),radial-gradient(760px_320px_at_84%_6%,rgba(126,82,194,0.16),transparent_56%),radial-gradient(760px_320px_at_50%_24%,rgba(40,87,168,0.22),transparent_62%)]" />

      <div className="relative mx-auto max-w-[1240px] px-4 py-10 sm:px-6 md:px-8 md:py-12">
        <div className="rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,249,255,0.92)_100%)] p-5 shadow-[0_28px_80px_rgba(17,24,39,0.08)] backdrop-blur-xl md:p-7 dark:border-[#2f4a78] dark:bg-[linear-gradient(180deg,rgba(9,21,42,0.92)_0%,rgba(13,27,53,0.9)_100%)] dark:shadow-[0_32px_90px_rgba(2,8,24,0.46)]">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-[#dce4ef] bg-[linear-gradient(135deg,#fbfdff_0%,#f4f8ff_36%,#eef3fb_62%,#f8f3f7_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:p-8 dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,35,69,0.96)_0%,rgba(16,31,60,0.94)_36%,rgba(20,39,74,0.92)_62%,rgba(28,28,62,0.94)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f0] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6d87] dark:border-[#3d5a8e] dark:bg-[rgba(18,34,64,0.78)] dark:text-[#cfe0fb]">
                <Sparkles size={14} />
                {copy.badge}
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 max-w-[680px] text-[34px] font-black leading-[1.02] tracking-[-0.04em] text-[#1d2430] md:text-[48px] dark:text-white"
              >
                {copy.titleA}
                <span className="bg-[linear-gradient(135deg,#243a7a_0%,#a44c72_45%,#e36b3a_100%)] bg-clip-text text-transparent">
                  {" "}{copy.titleB}
                </span>
              </motion.h1>

              <p className="mt-5 max-w-[620px] text-[15px] leading-8 text-[#627188] md:text-[16px] dark:text-[#a9bddb]">
                {copy.desc}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {copy.stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.06)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_22px_60px_rgba(2,8,24,0.34)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0] dark:text-[#93abd0]">
                    {item.label}
                  </div>
                  <div className="mt-2 text-xl font-black text-[#1d2430] dark:text-white">{item.value}</div>
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
                className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_20px_50px_rgba(17,24,39,0.06)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.34)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#edf5ff_0%,#dceaff_100%)] text-[#3b6db6] dark:bg-[linear-gradient(135deg,rgba(39,72,133,0.9)_0%,rgba(26,47,87,0.96)_100%)] dark:text-[#d4e2fb]">
                  <service.icon size={20} />
                </div>
                <div className="mt-4 text-lg font-black text-[#1d2430] dark:text-white">{service.title}</div>
                <div className="mt-2 text-sm leading-7 text-[#627188] dark:text-[#a9bddb]">{service.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
