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
  hidden: { opacity: 0, y: 34, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const staggerWrap: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const softScale: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

function LuxuryGlow({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`absolute rounded-full blur-3xl ${className}`} />;
}

function ShineOverlay() {
  return <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[-14%] w-[26%] rotate-12 bg-white/12 blur-md" />;
}

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
  const carouselTimer = useRef<number | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [carouselActive, setCarouselActive] = useState(false);

  const copy = getCopy(language);
  const stats = statMeta.map((item, index) => ({ ...item, ...copy.stats[index] }));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(!!mq.matches || (navigator.hardwareConcurrency ?? 4) <= 6);
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

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || reduceMotion) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => setCarouselActive(e.isIntersecting));
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || reduceMotion || !carouselActive) {
      if (carouselTimer.current) window.clearInterval(carouselTimer.current);
      return;
    }
    const step = () => {
      const card = el.querySelector<HTMLElement>("[data-partner-card]");
      if (!card) return;
      const cardW = card.offsetWidth + 24;
      el.scrollBy({ left: cardW, behavior: "smooth" });
      if (el.scrollLeft >= el.scrollWidth / 2) el.scrollTo({ left: 0, behavior: "auto" });
    };
    carouselTimer.current = window.setInterval(step, 5200);
    return () => {
      if (carouselTimer.current) window.clearInterval(carouselTimer.current);
    };
  }, [reduceMotion, carouselActive]);

  const pauseCarousel = () => {
    if (carouselTimer.current) window.clearInterval(carouselTimer.current);
  };

  const resumeCarousel = () => {
    if (reduceMotion || !carouselActive) return;
    if (carouselTimer.current) window.clearInterval(carouselTimer.current);
    carouselTimer.current = window.setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>("[data-partner-card]");
      if (!card) return;
      const cardW = card.offsetWidth + 24;
      el.scrollBy({ left: cardW, behavior: "smooth" });
      if (el.scrollLeft >= el.scrollWidth / 2) el.scrollTo({ left: 0, behavior: "auto" });
    }, 5200);
  };

  const moveCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-partner-card]");
    if (!card) return;
    const cardW = card.offsetWidth + 24;
    el.scrollBy({ left: dir === "left" ? -cardW : cardW, behavior: "smooth" });
  };

  return (
    <div className="secondary-page-shell relative overflow-hidden bg-white text-[#111827] dark:bg-transparent" style={{ backgroundColor: "#ffffff" }}>
      <div className="pointer-events-none absolute inset-0 hidden dark:block secondary-page-overlay" />
      {!reduceMotion && (
        <>
          <LuxuryGlow className="left-[-120px] top-[120px] h-[280px] w-[280px] bg-[#ff6a00]/20" />
          <LuxuryGlow className="right-[-100px] top-[380px] h-[320px] w-[320px] bg-[#8A3A5A]/20" />
          <LuxuryGlow className="left-[25%] bottom-[10%] h-[240px] w-[240px] bg-[#5f7897]/20" />
        </>
      )}
      <section ref={heroRef} className="relative bg-white dark:bg-transparent" style={{ backgroundColor: "#ffffff" }}>
        <div className="absolute inset-0 bg-white dark:bg-[radial-gradient(circle_at_top_left,rgba(57,98,188,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(119,72,175,0.18),transparent_32%),linear-gradient(to_bottom,rgba(8,18,38,0.78),rgba(7,17,31,0.28))]" />
        <motion.div className="relative mx-auto max-w-[1500px] px-5 pb-10 pt-32 md:px-8 2xl:max-w-[1680px]">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <motion.div variants={staggerWrap} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
              <motion.h1 variants={fadeUp} className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-tight md:text-5xl xl:text-6xl">
                {copy.heroTitleStart}{" "}
                <span className="bg-gradient-to-r from-[#7A2E4E] via-[#A0526B] to-[#ff6a00] bg-clip-text text-transparent">{copy.heroTitleAccent}</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 max-w-[600px] text-base leading-8 text-[#4a5361] dark:text-[#a9bddb] md:text-lg">
                {copy.heroText}
              </motion.p>
              <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
                <motion.button whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="group h-12 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] px-6 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(138,58,90,0.35)] transition hover:shadow-[0_24px_70px_rgba(138,58,90,0.45)]">
                  <span className="inline-flex items-center gap-2">
                    {copy.chooseTour}
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </motion.button>
                <motion.button whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-12 rounded-2xl border border-black/10 bg-white/80 px-6 text-sm font-semibold text-[#1b1f2a] backdrop-blur transition hover:shadow-xl dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:hover:bg-[rgba(24,43,80,0.96)]">
                  {copy.details}
                </motion.button>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[#5b6470] dark:text-[#a9bddb]">
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
                <motion.div key={src} variants={softScale} whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.4 }} className={`group relative overflow-hidden rounded-[28px] border border-[#dbe5f2] bg-white/92 shadow-[0_18px_60px_rgba(17,24,39,0.10)] backdrop-blur dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.72)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)] ${i === 1 ? "mt-10" : ""}`}>
                  <motion.img src={src} alt="Tour" loading="lazy" className="h-[240px] w-full object-cover md:h-[280px]" whileHover={{ scale: 1.08 }} transition={{ duration: 0.8, ease: "easeOut" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10" />
                  {!reduceMotion && <ShineOverlay />}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
        <div className="mt-6" ref={statsRef}>
          <div className="relative overflow-hidden rounded-[32px] border border-[#dbe5f2] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[linear-gradient(135deg,#102347_0%,#15315f_48%,#0c1d3d_100%)] dark:shadow-[0_24px_60px_rgba(2,8,24,0.34)]">
            <div className="absolute inset-0 bg-transparent dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_48%)]" />
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerWrap} className="relative mx-auto grid max-w-[1500px] grid-cols-2 gap-6 px-5 py-12 md:grid-cols-3 md:px-8 lg:grid-cols-6 2xl:max-w-[1680px]">
              {stats.map((s) => (
                <motion.div key={s.title} variants={softScale}>
                  <StatItem data={s} animate={animate} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative bg-white py-16 dark:bg-transparent">
        <div className="mx-auto max-w-[1500px] px-5 md:px-8 2xl:max-w-[1680px]">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerWrap} className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <div className="text-lg font-extrabold tracking-[0.2em] text-[#ff6a00] dark:text-[#ff9b57]">{copy.aboutKicker}</div>
              <p className="mt-4 text-base leading-8 text-[#4a5361] dark:text-[#a9bddb]">{copy.aboutP1}</p>
              <p className="mt-4 text-base leading-8 text-[#4a5361] dark:text-[#a9bddb]">{copy.aboutP2}</p>
              <p className="mt-4 text-base leading-8 text-[#4a5361] dark:text-[#a9bddb]">{copy.aboutP3}</p>
              <div className="mt-6 font-semibold text-[#1b1f2a] dark:text-white">{copy.serviceIntro}</div>
              <ul className="mt-4 space-y-3 text-sm text-[#4a5361] dark:text-[#a9bddb]">
                {copy.serviceList.map((x, i) => (
                  <motion.li key={x} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[#ff6a00] shadow-[0_0_18px_rgba(255,106,0,0.7)]" />
                    <span>{x}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={softScale} whileHover={{ y: -6 }} className="group relative overflow-hidden rounded-[28px] border border-[#dbe5f2] bg-white p-4 shadow-[0_22px_60px_rgba(17,24,39,0.08)] backdrop-blur dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.78)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]">
              <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80&fm=webp" alt="Travel" className="h-[380px] w-full rounded-2xl object-cover transition duration-700 group-hover:scale-[1.04]" loading="lazy" />
              <div className="absolute inset-4 rounded-2xl ring-1 ring-white/40" />
              {!reduceMotion && <ShineOverlay />}
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={staggerWrap} className="mt-12 grid grid-cols-1 gap-7 md:grid-cols-3">
            {copy.benefits.map((x) => (
              <motion.div key={x.title} variants={softScale} whileHover={{ y: -8, scale: 1.01 }} className="group relative overflow-hidden rounded-[24px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.34)]">
                <motion.div className="absolute inset-0 bg-gradient-to-br from-[#ff6a00]/0 via-[#ff6a00]/0 to-[#8A3A5A]/0" whileHover={{ background: "linear-gradient(135deg, rgba(255,106,0,0.06), rgba(138,58,90,0.08))" }} />
                {!reduceMotion && <ShineOverlay />}
                <div className="relative flex items-start gap-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#ff6a00]/30 bg-[#ff6a00]/10 text-[#ff6a00] shadow-[0_10px_25px_rgba(255,106,0,0.12)] dark:border-[#6b4a27] dark:bg-[rgba(82,63,23,0.4)] dark:text-[#ffb37e] dark:shadow-[0_14px_28px_rgba(2,8,24,0.24)]">
                    <x.icon size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-wide text-[#1b1f2a] dark:text-white">{x.title}</div>
                    <div className="mt-2 text-sm leading-7 text-[#4a5361] dark:text-[#a9bddb]">{x.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="bg-white py-16 dark:bg-transparent">
        <div className="mx-auto max-w-[1500px] px-5 text-center md:px-8 2xl:max-w-[1680px]">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={staggerWrap}>
            <motion.div variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#ff6a00] dark:text-[#ff9b57]">
              {copy.certificates}
            </motion.div>
            <motion.h3 variants={fadeUp} className="mt-3 text-3xl font-extrabold text-[#1b1f2a] dark:text-white md:text-4xl">
              {copy.ourCertificates}
            </motion.h3>
            <motion.div variants={fadeUp} className="mx-auto mt-5 h-1 w-16 bg-[#ff6a00]" />
            <div className="mt-10 grid grid-cols-1 items-center gap-6 sm:grid-cols-2 lg:grid-cols-6">
              {certImages.map((src, i) => (
                <motion.div key={src} variants={softScale} whileHover={{ y: -8, scale: 1.03 }} className="group relative overflow-hidden rounded-2xl border border-[#dbe5f2] bg-white shadow-[0_14px_36px_rgba(17,24,39,0.08)] hover:shadow-[0_22px_70px_rgba(17,24,39,0.14)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.82)] dark:shadow-[0_20px_55px_rgba(2,8,24,0.34)] dark:hover:shadow-[0_28px_80px_rgba(2,8,24,0.46)]">
                  <img src={src} alt={`${copy.certificateAlt} ${i + 1}`} className="aspect-[4/5] h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
                  {!reduceMotion && <ShineOverlay />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-transparent">
        <div className="mx-auto max-w-[1500px] px-5 text-center md:px-8 2xl:max-w-[1680px]">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={staggerWrap}>
            <motion.div variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#ff6a00] dark:text-[#ff9b57]">
              {copy.partners}
            </motion.div>
            <motion.h3 variants={fadeUp} className="mt-3 text-3xl font-extrabold text-[#1b1f2a] dark:text-white md:text-4xl">
              {copy.ourPartners}
            </motion.h3>
            <motion.div variants={fadeUp} className="mx-auto mt-5 h-1 w-16 bg-[#ff6a00]" />
            <motion.div variants={fadeUp} className="relative mt-10">
              <button type="button" aria-label={copy.prev} onClick={() => moveCarousel("left")} className="absolute -left-4 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full border border-[#dbe5f2] bg-white shadow-md backdrop-blur transition hover:shadow-xl dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.88)] dark:text-white dark:shadow-[0_16px_34px_rgba(2,8,24,0.34)]">
                ‹
              </button>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-20 bg-gradient-to-r from-white to-transparent dark:from-[#0a1730]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-20 bg-gradient-to-l from-white to-transparent dark:from-[#0a1730]" />
              <div ref={carouselRef} onMouseEnter={pauseCarousel} onMouseLeave={resumeCarousel} className="overflow-hidden">
                <div className="flex w-max gap-6 pr-6">
                  {[...partnerLogos, ...partnerLogos].map((p, i) => (
                    <motion.div key={`${p.name}-${i}`} data-partner-card whileHover={{ y: -6, scale: 1.02 }} className="group grid h-24 min-w-[210px] place-items-center rounded-2xl border border-[#dbe5f2] bg-white px-5 shadow-[0_12px_28px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.82)] dark:shadow-[0_18px_40px_rgba(2,8,24,0.34)]">
                      <img src={p.logo} alt={p.name} className="max-h-12 w-auto object-contain transition duration-500 group-hover:scale-105" loading="lazy" />
                    </motion.div>
                  ))}
                </div>
              </div>
              <button type="button" aria-label={copy.next} onClick={() => moveCarousel("right")} className="absolute -right-4 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full border border-[#dbe5f2] bg-white shadow-md backdrop-blur transition hover:shadow-xl dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.88)] dark:text-white dark:shadow-[0_16px_34px_rgba(2,8,24,0.34)]">
                ›
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="w-full px-5 md:px-8">
          <motion.div initial={{ opacity: 0, y: 32, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[32px] border border-black/10 shadow-[0_35px_100px_rgba(0,0,0,0.22)] dark:border-[#35507f] dark:shadow-[0_40px_110px_rgba(2,8,24,0.46)]">
            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80&fm=webp" alt="Tropical resort" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,106,0,0.18),transparent_28%)]" />
            <div className="relative z-10 grid min-h-[560px] grid-cols-1 gap-10 p-9 md:p-14 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -24, filter: "blur(8px)" }} whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/90 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.92)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_28px_80px_rgba(2,8,24,0.42)] md:p-8">
                {!reduceMotion && <ShineOverlay />}
                <div className="relative text-center text-lg font-semibold md:text-xl">{copy.contactTitle}</div>
                <div className="relative mt-1 text-center text-sm text-[#6b7280] dark:text-[#a9bddb]">{copy.contactText}</div>
                <form className="relative mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success(copy.applied); }}>
                  <LuxuryInput placeholder={copy.name} phoneWord={copy.phone} />
                  <LuxuryInput placeholder={copy.phone} phoneWord={copy.phone} />
                  <LuxuryInput placeholder={copy.route} phoneWord={copy.phone} />
                  <label className="flex items-center gap-2 text-xs text-[#6b7280] dark:text-[#a9bddb]">
                    <input type="checkbox" className="accent-[#ff6a00]" />
                    {copy.agree}
                  </label>
                  <motion.button whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }} className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#ff6a00] to-[#ff8c3a] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,106,0,0.28)] transition hover:brightness-105">
                    {copy.send}
                  </motion.button>
                </form>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 24, filter: "blur(8px)" }} whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }} className="flex flex-col justify-center text-white">
                <div className="text-3xl font-extrabold leading-tight md:text-5xl">{copy.orderTitle}</div>
                <div className="mt-4 max-w-[520px] text-lg leading-8 text-white/90 md:text-xl">{copy.orderText}</div>
                <div className="mt-6 max-w-[540px] leading-8 text-white/80">{copy.orderSub}</div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <motion.button whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-12 rounded-2xl bg-[#ff6a00] px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,106,0,0.30)]">
                    {copy.contactUs}
                  </motion.button>
                  <motion.button whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-12 rounded-2xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur dark:border-[#4a6aa3] dark:bg-[rgba(20,35,66,0.38)]">
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
      whileFocus={{ scale: 1.01 }}
      className="h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 outline-none transition focus:border-[#ff6a00]/40 focus:shadow-[0_0_0_4px_rgba(255,106,0,0.12)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:placeholder:text-[#8ea5cb] dark:focus:border-[#4d6fa8] dark:focus:shadow-[0_0_0_4px_rgba(77,111,168,0.18)]"
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
    <motion.div whileHover={{ y: -8, scale: 1.02 }} className="group relative h-full overflow-hidden rounded-[24px] border border-[#dbe5f2] bg-white p-5 text-center backdrop-blur-md shadow-[0_18px_40px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[rgba(18,34,64,0.58)] dark:shadow-[0_22px_50px_rgba(2,8,24,0.3)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fbff] via-white to-transparent dark:from-white/8 dark:via-white/4" />
      <div className="relative flex flex-col items-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#fff3eb_0%,#ffe6d6_100%)] shadow-[0_10px_25px_rgba(255,106,0,0.10)] dark:bg-[rgba(24,43,80,0.8)] dark:shadow-[0_14px_28px_rgba(2,8,24,0.26)]">
          <Icon size={34} className="text-[#8A3A5A] dark:text-[#d7a7bd]" />
        </div>
        <div className="mt-4 text-4xl font-extrabold text-[#111827] dark:text-white">{display}</div>
        <div className="mt-2 flex min-h-[40px] items-center justify-center text-center text-sm font-semibold tracking-wide text-[#111827] dark:text-white">{data.title}</div>
        <div className="mt-4 flex min-h-[72px] items-center justify-center text-center text-sm leading-relaxed text-[#4a5361] dark:text-[#cfe0fb] md:text-base">{data.desc}</div>
      </div>
    </motion.div>
  );
}
