import { motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Cake,
  DollarSign,
  Heart,
  HeartHandshake,
  Map,
  Palmtree,
  Plane,
  Smile,
  Stamp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { formatUzPhoneInput } from "@/lib/phone";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { useI18n } from "@/shared/i18n/i18n";

const statMeta = [
  { icon: Cake, end: 7, suffix: "" },
  { icon: Map, end: 100, suffix: "+" },
  { icon: BadgeCheck, end: 20, suffix: "+" },
  { icon: HeartHandshake, end: 650, suffix: "+" },
  { icon: Plane, end: 600, suffix: "" },
  { icon: Smile, end: 96, suffix: "%" },
];

const heroImages = [
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80&fm=webp",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80&fm=webp",
];

const certImages = [
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80&fm=webp",
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80&fm=webp",
  "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=800&q=80&fm=webp",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80&fm=webp",
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80&fm=webp",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80&fm=webp",
];

const partnerLogos = [
  { name: "Uzbekistan Airways", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Uzbekistan_Airways_logo.svg" },
  { name: "Qanot Sharq", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Qanot_Sharq_logo.svg" },
  { name: "Jazeera Airways", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Jazeera_Airways_logo.svg" },
  { name: "Air Arabia", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Air_Arabia_Logo.svg" },
  { name: "Air Astana", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Air_Astana_Logo.jpg" },
  { name: "Korean Air", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Korean_Air_2025.svg" },
  { name: "Turkish Airlines", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Turkish_Airlines_logo_2019.svg" },
  { name: "Lufthansa", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Lufthansa_Logo_2018.svg" },
  { name: "Emirates", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Emirates_Logo.svg" },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const staggerWrap: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const softScale: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function getCopy(language: "uz" | "ru" | "en") {
  return {
    uz: {
      heroTitleStart: "Yevropa va dunyo bo'ylab",
      heroTitleAccent: "unutilmas sayohatlar",
      heroText: "Biz bilan istalgan mamlakatga ishonchli, qulay va mazmunli tur paketlarini tanlang. Professional jamoa, shaffof narx va yuqori servis.",
      chooseTour: "Tur tanlash",
      details: "Batafsil",
      trustedService: "Ishonchli xizmat",
      premiumSupport: "Premium support",
      stats: [
        { title: "YILLAR", desc: "7 yildan beri ishimizni mehr bilan qilamiz" },
        { title: "YO'NALISHLAR", desc: "Siz tanlagan istalgan manzilga tur paketlari" },
        { title: "PROFESSIONAL XODIMLAR", desc: "20 dan ortiq sertifikatlangan mutaxassislar" },
        { title: "MIJOZLAR", desc: "650 dan ortiq baxtli sayohatchilar" },
        { title: "AVIACOMPANIYA HAMKORLAR", desc: "Dunyo bo'yicha 600+ aviakompaniya bilan hamkorlik" },
        { title: "MAMNUN MIJOZLAR", desc: "Mijozlarimizning 96% qayta buyurtma beradi" },
      ],
      aboutKicker: "TRIPZY AVIA TOUR",
      aboutP1: "Tripzy Avia Tour O'zbekistondagi yirik tur operatorlaridan biri bo'lib, inbound va outbound turizm, shuningdek yo'lovchi avia tashuvlari bilan shug'ullanadi.",
      aboutP2: "Tripzy Avia Tour sizga dunyoning har bir go'zal burchagini his qilish imkonini beruvchi eksklyuziv va qiziqarli tur mahsulotlarini taklif etadi.",
      aboutP3: "Biz faqat ishonchli hamkorlar bilan ishlaymiz. Mehmonxonalar tanlashda yuqori servis, qulaylik va to'liq xavfsizlik tamoyillariga amal qilamiz. Tripzy Avia Tour dunyoning eng ishonchli aviakompaniyalari bilan hamkorlik qiladi, bu mijozlarimiz uchun xavfsizlik va qulaylik kafolatidir.",
      serviceIntro: "Tripzy Avia Tour jamoasi sizga quyidagi xizmatlarni taklif etadi:",
      serviceList: [
        "dunyo bo'ylab aviachiptalar uchun eng qulay tariflar;",
        "butun dunyo bo'ylab keng mehmonxona bazasi;",
        "istalgan yo'nalishga unutilmas sayohatlar;",
        "turizm sohasidagi zamonaviy texnologiyalar.",
      ],
      benefits: [
        { title: "ENG QULAY NARXLAR", desc: "Aviabiletlar va tur paketlari uchun eng yaxshi narxlarni kafolatlaymiz.", icon: DollarSign },
        { title: "VIZA YORDAMI", desc: "Zarur hujjatlarni tayyorlash va viza masalalarini hal qilishda ko'mak.", icon: Stamp },
        { title: "PROFESSIONAL JAMOA", desc: "24/7 xizmat ko'rsatadigan mutaxassislar bilan ishonchli yordam.", icon: Users },
        { title: "ENG YAXSHI MEHMONXONALAR", desc: "Reytingi yuqori va ishonchli mehmonxonalarni tavsiya qilamiz.", icon: Building2 },
        { title: "UNUTILMAS SAYOHATLAR", desc: "Yorqin va esda qolarli marshrutlar hamda sayohat tajribasi.", icon: Palmtree },
        { title: "INDIVIDUAL YONDASHUV", desc: "Sizning qiziqishlaringiz va xohishlaringizga mos dastur tuzamiz.", icon: Heart },
      ],
      certificates: "SERTIFIKATLAR",
      ourCertificates: "BIZNING SERTIFIKATLAR",
      certificateAlt: "Sertifikat",
      partners: "HAMKORLAR",
      ourPartners: "BIZNING HAMKORLAR",
      prev: "Oldingi",
      next: "Keyingi",
      contactTitle: "Aloqa ma'lumotlari",
      contactText: "Kontaktlaringizni qoldiring, biz siz bilan bog'lanamiz",
      name: "Ism",
      phone: "Telefon",
      route: "Qiziqqan yo'nalish",
      agree: "Shartlarga roziman",
      send: "Yuborish",
      applied: "Arizangiz qabul qilindi",
      orderTitle: "HOZIROQ BUYURTMA QILING",
      orderText: "Kontaktlaringizni qoldiring, siz uchun eng yaxshi tur paketini tanlaymiz.",
      orderSub: "Dunyo bo'ylab qulay reyslar, mehmonxonalar va transfer xizmatlari.",
      contactUs: "Biz bilan bog'lanish",
      aboutServices: "Xizmatlar haqida",
    },
    ru: {
      heroTitleStart: "По Европе и миру",
      heroTitleAccent: "незабываемые путешествия",
      heroText: "Выбирайте с нами надежные, удобные и содержательные турпакеты в любую страну. Профессиональная команда, прозрачные цены и высокий сервис.",
      chooseTour: "Выбрать тур",
      details: "Подробнее",
      trustedService: "Надежный сервис",
      premiumSupport: "Премиальная поддержка",
      stats: [
        { title: "ЛЕТ", desc: "7 лет работаем с заботой и вниманием" },
        { title: "НАПРАВЛЕНИЯ", desc: "Турпакеты в любое выбранное вами направление" },
        { title: "ПРОФЕССИОНАЛЬНЫЕ СОТРУДНИКИ", desc: "Более 20 сертифицированных специалистов" },
        { title: "КЛИЕНТЫ", desc: "Более 650 довольных путешественников" },
        { title: "АВИАКОМПАНИИ-ПАРТНЕРЫ", desc: "Сотрудничество с 600+ авиакомпаниями по всему миру" },
        { title: "ДОВОЛЬНЫЕ КЛИЕНТЫ", desc: "96% наших клиентов оформляют заказы повторно" },
      ],
      aboutKicker: "TRIPZY AVIA TOUR",
      aboutP1: "Tripzy Avia Tour — один из крупных туроператоров Узбекистана, работающий в сфере въездного и выездного туризма, а также пассажирских авиаперевозок.",
      aboutP2: "Tripzy Avia Tour предлагает эксклюзивные и интересные туристические продукты, которые помогут вам почувствовать красоту каждого уголка мира.",
      aboutP3: "Мы работаем только с надежными партнерами. При подборе отелей придерживаемся принципов высокого сервиса, комфорта и полной безопасности. Tripzy Avia Tour сотрудничает с самыми надежными авиакомпаниями мира, что гарантирует нашим клиентам безопасность и удобство.",
      serviceIntro: "Команда Tripzy Avia Tour предлагает вам следующие услуги:",
      serviceList: [
        "самые выгодные тарифы на авиабилеты по всему миру;",
        "широкая база отелей по всему миру;",
        "незабываемые путешествия по любым направлениям;",
        "современные технологии в сфере туризма.",
      ],
      benefits: [
        { title: "ЛУЧШИЕ ЦЕНЫ", desc: "Гарантируем лучшие цены на авиабилеты и турпакеты.", icon: DollarSign },
        { title: "ПОМОЩЬ С ВИЗОЙ", desc: "Помогаем подготовить документы и решить визовые вопросы.", icon: Stamp },
        { title: "ПРОФЕССИОНАЛЬНАЯ КОМАНДА", desc: "Надежная поддержка от специалистов, работающих 24/7.", icon: Users },
        { title: "ЛУЧШИЕ ОТЕЛИ", desc: "Рекомендуем только надежные отели с высоким рейтингом.", icon: Building2 },
        { title: "НЕЗАБЫВАЕМЫЕ ПУТЕШЕСТВИЯ", desc: "Яркие маршруты и впечатления, которые запомнятся надолго.", icon: Palmtree },
        { title: "ИНДИВИДУАЛЬНЫЙ ПОДХОД", desc: "Подбираем программу под ваши интересы и пожелания.", icon: Heart },
      ],
      certificates: "СЕРТИФИКАТЫ",
      ourCertificates: "НАШИ СЕРТИФИКАТЫ",
      certificateAlt: "Сертификат",
      partners: "ПАРТНЕРЫ",
      ourPartners: "НАШИ ПАРТНЕРЫ",
      prev: "Назад",
      next: "Далее",
      contactTitle: "Контактная информация",
      contactText: "Оставьте свои контакты, и мы свяжемся с вами",
      name: "Имя",
      phone: "Телефон",
      route: "Интересующее направление",
      agree: "Согласен с условиями",
      send: "Отправить",
      applied: "Ваша заявка принята",
      orderTitle: "ОФОРМИТЕ ЗАЯВКУ СЕЙЧАС",
      orderText: "Оставьте контакты, и мы подберем для вас лучший турпакет.",
      orderSub: "Удобные рейсы, отели и трансферы по всему миру.",
      contactUs: "Связаться с нами",
      aboutServices: "Об услугах",
    },
    en: {
      heroTitleStart: "Across Europe and the world",
      heroTitleAccent: "unforgettable journeys",
      heroText: "Choose reliable, comfortable, and meaningful tour packages to any country with us. A professional team, transparent pricing, and high service standards.",
      chooseTour: "Choose tour",
      details: "Learn more",
      trustedService: "Trusted service",
      premiumSupport: "Premium support",
      stats: [
        { title: "YEARS", desc: "7 years of dedicated work with care" },
        { title: "DESTINATIONS", desc: "Tour packages to any destination you choose" },
        { title: "PROFESSIONAL STAFF", desc: "More than 20 certified specialists" },
        { title: "CLIENTS", desc: "More than 650 happy travelers" },
        { title: "AIRLINE PARTNERS", desc: "Cooperation with 600+ airlines worldwide" },
        { title: "SATISFIED CLIENTS", desc: "96% of our clients book with us again" },
      ],
      aboutKicker: "TRIPZY AVIA TOUR",
      aboutP1: "Tripzy Avia Tour is one of Uzbekistan's major tour operators, working in inbound and outbound tourism as well as passenger air transportation.",
      aboutP2: "Tripzy Avia Tour offers exclusive and engaging travel products that help you experience the beauty of every corner of the world.",
      aboutP3: "We work only with trusted partners. When selecting hotels, we follow the principles of high service, comfort, and full safety. Tripzy Avia Tour cooperates with the world's most reliable airlines, ensuring safety and convenience for our clients.",
      serviceIntro: "The Tripzy Avia Tour team offers you the following services:",
      serviceList: [
        "the most competitive airfare rates worldwide;",
        "a wide global hotel base;",
        "memorable trips to any destination;",
        "modern technologies in tourism.",
      ],
      benefits: [
        { title: "BEST PRICES", desc: "We guarantee the best prices for airline tickets and tour packages.", icon: DollarSign },
        { title: "VISA ASSISTANCE", desc: "Support with document preparation and visa-related issues.", icon: Stamp },
        { title: "PROFESSIONAL TEAM", desc: "Reliable assistance from specialists available 24/7.", icon: Users },
        { title: "BEST HOTELS", desc: "We recommend only trusted hotels with high ratings.", icon: Building2 },
        { title: "MEMORABLE JOURNEYS", desc: "Bright routes and travel experiences that stay with you.", icon: Palmtree },
        { title: "PERSONAL APPROACH", desc: "We design programs tailored to your interests and wishes.", icon: Heart },
      ],
      certificates: "CERTIFICATES",
      ourCertificates: "OUR CERTIFICATES",
      certificateAlt: "Certificate",
      partners: "PARTNERS",
      ourPartners: "OUR PARTNERS",
      prev: "Previous",
      next: "Next",
      contactTitle: "Contact details",
      contactText: "Leave your contacts and we will get back to you",
      name: "Name",
      phone: "Phone",
      route: "Interested destination",
      agree: "I agree to the terms",
      send: "Send",
      applied: "Your request has been received",
      orderTitle: "BOOK NOW",
      orderText: "Leave your contacts and we will select the best tour package for you.",
      orderSub: "Convenient flights, hotels, and transfer services worldwide.",
      contactUs: "Contact us",
      aboutServices: "About services",
    },
  }[language];
}

export default function About() {
  const { language } = useI18n();
  const statsRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);

  const copy = getCopy(language);
  const stats = statMeta.map((item, index) => ({ ...item, ...copy.stats[index] }));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(!!mq.matches || (navigator.hardwareConcurrency ?? 4) <= 8);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    if (reduceMotion) return void setAnimate(true);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setAnimate(true);
          io.disconnect();
        }
      });
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  const moveCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-partner-card]");
    if (!card) return;
    const cardW = card.offsetWidth + 24;
    el.scrollBy({ left: dir === "left" ? -cardW : cardW, behavior: "smooth" });
  };

  return (
    <div className="about-page secondary-page-shell relative overflow-hidden bg-[#ECEAE5] text-[#111A34] dark:bg-transparent dark:text-white">
      <section ref={heroRef} className="relative bg-transparent">
        <div className="absolute inset-0 bg-[#ECEAE5] dark:bg-transparent" />
        <motion.div className="relative mx-auto max-w-[1320px] px-5 pb-8 pt-4 md:px-8 md:pt-6 2xl:max-w-[1480px]">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <motion.div variants={staggerWrap} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
              <motion.h1 variants={fadeUp} className="mt-3 text-3xl font-extrabold leading-[1.06] tracking-tight md:text-4xl xl:text-5xl">
                {copy.heroTitleStart}{" "}
                <span className="bg-gradient-to-r from-[#7A2E4E] via-[#A0526B] to-[#ff6a00] bg-clip-text text-transparent">{copy.heroTitleAccent}</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-3 max-w-[560px] text-sm leading-7 text-[#4a5361] dark:text-[#a9bddb] md:text-base">
                {copy.heroText}
              </motion.p>
              <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-3">
                <motion.button whileTap={{ scale: 0.98 }} className="group h-10 rounded-xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(138,58,90,0.18)] transition">
                  <span className="inline-flex items-center gap-2">
                    {copy.chooseTour}
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.98 }} className="h-10 rounded-xl border border-[#E3E8F7] bg-white px-5 text-sm font-semibold text-[#111A34] shadow-[0_8px_18px_rgba(70,90,140,0.08)] transition dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white">
                  {copy.details}
                </motion.button>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#5b6470] dark:text-[#a9bddb]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                  {copy.trustedService}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00] shadow-[0_0_20px_rgba(255,106,0,0.8)]" />
                  {copy.premiumSupport}
                </div>
              </motion.div>
            </motion.div>
            <motion.div variants={staggerWrap} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="grid grid-cols-2 gap-4">
              {heroImages.map((src, i) => (
                <motion.div key={src} variants={softScale} transition={{ duration: 0.3 }} className={`group relative overflow-hidden rounded-[22px] border border-[#E3E8F7] bg-white shadow-[0_12px_28px_rgba(70,90,140,0.09)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.72)] dark:shadow-[0_20px_56px_rgba(2,8,24,0.34)] ${i === 1 ? "mt-6" : ""}`}>
                  <motion.img src={src} alt="Tour" loading="lazy" decoding="async" className="h-[190px] w-full object-cover md:h-[230px]" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
        <div className="mt-4" ref={statsRef}>
          <div className="relative overflow-hidden rounded-[26px] border border-[#E3E8F7] bg-white shadow-[0_14px_38px_rgba(70,90,140,0.09)] dark:border-[#35507f]/60 dark:bg-[linear-gradient(180deg,rgba(14,32,72,0.82)_0%,rgba(7,18,46,0.78)_100%)] dark:shadow-[0_16px_42px_rgba(2,8,24,0.30)]">
            <div className="absolute inset-0 bg-white/70 dark:bg-transparent" />
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerWrap} className="relative mx-auto grid max-w-[1240px] grid-cols-2 gap-3 px-5 py-5 md:grid-cols-3 md:px-7 lg:grid-cols-6 2xl:max-w-[1380px]">
              {stats.map((s) => (
                <motion.div key={s.title} variants={softScale}>
                  <StatItem data={s} animate={animate} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative bg-transparent py-10">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8 2xl:max-w-[1480px]">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerWrap} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <div className="text-base font-extrabold tracking-[0.18em] text-[#ff6a00] dark:text-[#ff9b57]">{copy.aboutKicker}</div>
              <p className="mt-3 text-sm leading-7 text-[#4a5361] dark:text-[#a9bddb]">{copy.aboutP1}</p>
              <p className="mt-3 text-sm leading-7 text-[#4a5361] dark:text-[#a9bddb]">{copy.aboutP2}</p>
              <p className="mt-3 text-sm leading-7 text-[#4a5361] dark:text-[#a9bddb]">{copy.aboutP3}</p>
              <div className="mt-5 font-semibold text-[#1b1f2a] dark:text-white">{copy.serviceIntro}</div>
              <ul className="mt-3 space-y-2 text-sm text-[#4a5361] dark:text-[#a9bddb]">
                {copy.serviceList.map((x, i) => (
                  <motion.li key={x} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[#ff6a00] shadow-[0_0_18px_rgba(255,106,0,0.7)]" />
                    <span>{x}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={softScale} className="group relative overflow-hidden rounded-[24px] border border-[#E3E8F7] bg-white p-3 shadow-[0_14px_36px_rgba(70,90,140,0.09)] dark:border-[#35507f]/60 dark:bg-[rgba(18,38,76,0.72)]">
              <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80&fm=webp" alt="Travel" className="h-[300px] w-full rounded-2xl object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-4 rounded-2xl ring-1 ring-white/40" />
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={staggerWrap} className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
            {copy.benefits.map((x) => (
              <motion.div key={x.title} variants={softScale} className="about-benefit-card group relative overflow-hidden rounded-[16px] border border-[#E3E8F7] bg-white p-3.5 shadow-[0_10px_24px_rgba(70,90,140,0.06)] dark:border-[#35507f]/55 dark:bg-[rgba(18,38,76,0.66)]">
                <div className="relative flex items-start gap-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#ff6a00]/30 bg-[#ff6a00]/10 text-[#ff6a00] shadow-[0_8px_18px_rgba(255,106,0,0.09)]">
                    <x.icon size={18} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold tracking-wide text-[#111A34] dark:text-white">{x.title}</div>
                    <div className="mt-1 text-[13px] leading-5 text-[#6F7898] dark:text-[#a9bddb]">{x.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="bg-[#ECEAE5] py-10 dark:bg-transparent">
        <div className="mx-auto max-w-[1320px] px-5 text-center md:px-8 2xl:max-w-[1480px]">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={staggerWrap}>
            <motion.div variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#ff6a00] dark:text-[#ff9b57]">
              {copy.certificates}
            </motion.div>
            <motion.h3 variants={fadeUp} className="mt-2 text-2xl font-extrabold text-[#1b1f2a] dark:text-white md:text-3xl">
              {copy.ourCertificates}
            </motion.h3>
            <motion.div variants={fadeUp} className="mx-auto mt-4 h-1 w-14 bg-[#ff6a00]" />
            <div className="mt-7 grid grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {certImages.map((src, i) => (
                <motion.div key={src} variants={softScale} className="group relative overflow-hidden rounded-xl border border-[#E3E8F7] bg-white shadow-[0_10px_22px_rgba(70,90,140,0.07)] dark:border-[#35507f]/55 dark:bg-[rgba(18,38,76,0.66)]">
                  <img src={src} alt={`${copy.certificateAlt} ${i + 1}`} className="aspect-[4/5] h-full w-full object-cover" loading="lazy" decoding="async" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#ECEAE5] py-10 dark:bg-transparent">
        <div className="mx-auto max-w-[1320px] px-5 text-center md:px-8 2xl:max-w-[1480px]">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={staggerWrap}>
            <motion.div variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#ff6a00] dark:text-[#ff9b57]">
              {copy.partners}
            </motion.div>
            <motion.h3 variants={fadeUp} className="mt-2 text-2xl font-extrabold text-[#1b1f2a] dark:text-white md:text-3xl">
              {copy.ourPartners}
            </motion.h3>
            <motion.div variants={fadeUp} className="mx-auto mt-4 h-1 w-14 bg-[#ff6a00]" />
            <motion.div variants={fadeUp} className="relative mt-7">
              <button type="button" aria-label={copy.prev} onClick={() => moveCarousel("left")} className="absolute -left-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-[#E3E8F7] bg-white text-[#111A34] shadow-md transition dark:border-[#35507f]/55 dark:bg-[rgba(18,38,76,0.72)] dark:text-white">
                ‹
              </button>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-20 bg-gradient-to-r from-white to-transparent dark:from-[#07152f]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-20 bg-gradient-to-l from-white to-transparent dark:from-[#07152f]" />
              <div ref={carouselRef} className="overflow-hidden">
                <div className="flex w-max gap-4 pr-4">
                  {[...partnerLogos, ...partnerLogos].map((p, i) => (
                    <motion.div key={`${p.name}-${i}`} data-partner-card className="group grid h-20 min-w-[180px] place-items-center rounded-xl border border-[#E3E8F7] bg-white px-4 shadow-[0_10px_22px_rgba(70,90,140,0.07)] dark:border-[#35507f]/55 dark:bg-[rgba(18,38,76,0.66)]">
                      <img src={p.logo} alt={p.name} className="max-h-10 w-auto object-contain" loading="lazy" decoding="async" />
                    </motion.div>
                  ))}
                </div>
              </div>
              <button type="button" aria-label={copy.next} onClick={() => moveCarousel("right")} className="absolute -right-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-[#E3E8F7] bg-white text-[#111A34] shadow-md transition dark:border-[#35507f]/55 dark:bg-[rgba(18,38,76,0.72)] dark:text-white">
                ›
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="w-full px-5 md:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="about-order-card relative overflow-hidden rounded-[24px] border border-[#E3E8F7] bg-white shadow-[0_14px_36px_rgba(70,90,140,0.08)] dark:border-[#35507f]/60 dark:bg-[linear-gradient(180deg,rgba(14,32,72,0.88)_0%,rgba(7,18,46,0.84)_100%)]">
            <div className="relative z-10 grid min-h-[420px] grid-cols-1 gap-7 p-6 md:p-9 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="relative overflow-hidden rounded-[22px] border border-[#E3E8F7] bg-white p-5 shadow-[0_12px_28px_rgba(70,90,140,0.06)] dark:border-[#35507f]/55 dark:bg-[rgba(18,38,76,0.72)] md:p-6">
                <div className="relative text-center text-base font-semibold md:text-lg">{copy.contactTitle}</div>
                <div className="relative mt-1 text-center text-sm text-[#6b7280]">{copy.contactText}</div>
                <form className="relative mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success(copy.applied); }}>
                  <LuxuryInput placeholder={copy.name} phoneWord={copy.phone} />
                  <LuxuryInput placeholder={copy.phone} phoneWord={copy.phone} />
                  <LuxuryInput placeholder={copy.route} phoneWord={copy.phone} />
                  <label className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <Checkbox
                      size="sm"
                      className="border-[#ff6a00]/45 bg-white text-[#ff6a00] data-[state=checked]:border-[#ff6a00] data-[state=checked]:bg-[#ff6a00] data-[state=checked]:text-white"
                    />
                    {copy.agree}
                  </label>
                  <motion.button whileTap={{ scale: 0.99 }} className="h-11 w-full rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#ff8c3a] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,106,0,0.16)] transition">
                    {copy.send}
                  </motion.button>
                </form>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 }} className="flex flex-col justify-center text-[#111A34] dark:text-white">
                <div className="text-2xl font-extrabold leading-tight md:text-4xl">{copy.orderTitle}</div>
                <div className="mt-3 max-w-[500px] text-base leading-7 text-[#6F7898] dark:text-[#a9bddb] md:text-lg">{copy.orderText}</div>
                <div className="mt-4 max-w-[520px] text-sm leading-7 text-[#6F7898] dark:text-[#a9bddb] md:text-base">{copy.orderSub}</div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <motion.button whileTap={{ scale: 0.98 }} className="h-11 rounded-xl bg-[#ff6a00] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,106,0,0.18)]">
                    {copy.contactUs}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.98 }} className="h-11 rounded-xl border border-[#dbe5f2] bg-white px-5 text-sm font-semibold text-[#1b1f2a] shadow-[0_8px_18px_rgba(17,24,39,0.05)]">
                    {copy.aboutServices}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function LuxuryInput({ placeholder, phoneWord }: { placeholder: string; phoneWord: string }) {
  const isPhone = placeholder.toLowerCase().includes(phoneWord.toLowerCase());
  const [value, setValue] = useState(isPhone ? "+998" : "");

  return (
    <motion.input
      className="h-11 w-full rounded-xl border border-[#E3E8F7] bg-white px-4 text-sm text-[#111A34] outline-none transition focus:border-[#ff6a00]/40 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.10)] dark:border-[#35507f]/55 dark:bg-[rgba(14,28,58,0.72)] dark:text-white dark:placeholder:text-[#8ea5cb]"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(isPhone ? formatUzPhoneInput(e.target.value) : e.target.value)}
    />
  );
}

function StatItem({ data, animate }: { data: { icon: LucideIcon; end: number; suffix: string; title: string; desc: string }; animate: boolean }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) return;
    const duration = 1400;
    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(data.end * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      startRef.current = null;
    };
  }, [animate, data.end]);

  const Icon = data.icon;
  const display = useMemo(() => `${val}${data.suffix}`, [val, data.suffix]);

  return (
    <motion.div className="about-stat-card group relative h-full overflow-hidden rounded-[18px] border border-[#E3E8F7] bg-white p-4 text-center shadow-[0_10px_24px_rgba(70,90,140,0.06)] dark:border-[#35507f]/55 dark:bg-[rgba(18,38,76,0.66)]">
      <div className="absolute inset-0 bg-white dark:bg-transparent" />
      <div className="relative flex flex-col items-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[linear-gradient(135deg,#fff3eb_0%,#ffe6d6_100%)] shadow-[0_8px_18px_rgba(255,106,0,0.09)] dark:bg-[linear-gradient(135deg,rgba(42,28,18,0.82)_0%,rgba(60,28,14,0.74)_100%)]">
          <Icon size={26} className="text-[#8A3A5A] dark:text-[#ffb07a]" />
        </div>
        <div className="mt-3 text-3xl font-extrabold text-[#111A34] dark:text-white">{display}</div>
        <div className="mt-1.5 flex min-h-[34px] items-center justify-center text-center text-xs font-semibold tracking-wide text-[#111A34] dark:text-white">{data.title}</div>
        <div className="mt-3 flex min-h-[56px] items-center justify-center text-center text-xs leading-relaxed text-[#6F7898] dark:text-[#a9bddb] md:text-sm">{data.desc}</div>
      </div>
    </motion.div>
  );
}
