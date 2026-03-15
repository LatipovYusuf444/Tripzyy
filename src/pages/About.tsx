import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Cake,
  Map,
  BadgeCheck,
  HeartHandshake,
  Plane,
  Smile,
  DollarSign,
  Stamp,
  Users,
  Building2,
  Palmtree,
  Heart,
  ArrowRight,
} from "lucide-react";
import { formatUzPhoneInput } from "@/lib/phone";

const stats = [
  {
    icon: Cake,
    end: 7,
    suffix: "",
    title: "YILLAR",
    desc: "7 yildan beri ishimizni mehr bilan qilamiz",
  },
  {
    icon: Map,
    end: 100,
    suffix: "+",
    title: "YO‘NALISHLAR",
    desc: "Siz tanlagan istalgan manzilga tur paketlari",
  },
  {
    icon: BadgeCheck,
    end: 20,
    suffix: "+",
    title: "PROFESSIONAL XODIMLAR",
    desc: "20 dan ortiq sertifikatlangan mutaxassislar",
  },
  {
    icon: HeartHandshake,
    end: 650,
    suffix: "+",
    title: "MIJOZLAR",
    desc: "650 dan ortiq baxtli sayohatchilar",
  },
  {
    icon: Plane,
    end: 600,
    suffix: "",
    title: "AVIACOMPANIYA HAMKORLAR",
    desc: "Dunyo bo‘yicha 600+ aviakompaniya bilan hamkorlik",
  },
  {
    icon: Smile,
    end: 96,
    suffix: "%",
    title: "MAMNUN MIJOZLAR",
    desc: "Mijozlarimizning 96% qayta buyurtma beradi",
  },
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
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerWrap: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const softScale: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

function LuxuryGlow({
  className = "",
}: {
  className?: string;
}) {
  return (
    <motion.div
      aria-hidden
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        x: [0, 22, -12, 0],
        y: [0, -20, 18, 0],
        scale: [1, 1.08, 0.96, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    />
  );
}

function ShineOverlay() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -left-[35%] w-[28%] rotate-12 bg-white/20 blur-md"
      animate={{ x: ["0%", "430%"] }}
      transition={{
        duration: 2.8,
        repeat: Infinity,
        repeatDelay: 1.8,
        ease: "easeInOut",
      }}
    />
  );
}

export default function About() {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const carouselTimer = useRef<number | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [carouselActive, setCarouselActive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, reduceMotion ? 1 : 0.75]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(!!mq.matches);
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

    if (reduceMotion) {
      setAnimate(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setAnimate(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || reduceMotion) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setCarouselActive(e.isIntersecting));
      },
      { threshold: 0.2 }
    );

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

      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollTo({ left: 0, behavior: "auto" });
      }
    };

    carouselTimer.current = window.setInterval(step, 2400);
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

      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollTo({ left: 0, behavior: "auto" });
      }
    }, 2400);
  };

  const moveCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-partner-card]");
    if (!card) return;
    const cardW = card.offsetWidth + 24;
    el.scrollBy({
      left: dir === "left" ? -cardW : cardW,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative overflow-hidden bg-[#f7f7f8] text-[#111827] dark:bg-[linear-gradient(180deg,#07111f_0%,#0a1730_24%,#102347_58%,#0a1730_100%)] dark:text-white">
      {!reduceMotion && (
        <>
          <LuxuryGlow className="left-[-120px] top-[120px] h-[280px] w-[280px] bg-[#ff6a00]/20" />
          <LuxuryGlow className="right-[-100px] top-[380px] h-[320px] w-[320px] bg-[#8A3A5A]/20" />
          <LuxuryGlow className="left-[25%] bottom-[10%] h-[240px] w-[240px] bg-[#5f7897]/20" />
        </>
      )}

      {/* HERO */}
      <section ref={heroRef} className="relative bg-white dark:bg-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,106,0,0.08),transparent_35%),radial-gradient(circle_at_top_right,rgba(138,58,90,0.08),transparent_32%),linear-gradient(to_bottom,rgba(255,255,255,1),rgba(250,250,250,1))] dark:bg-[radial-gradient(circle_at_top_left,rgba(57,98,188,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(119,72,175,0.18),transparent_32%),linear-gradient(to_bottom,rgba(8,18,38,0.78),rgba(7,17,31,0.28))]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto max-w-[1200px] px-5 pt-32 pb-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              variants={staggerWrap}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              
              <motion.h1
                variants={fadeUp}
                className="mt-5 text-3xl md:text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight"
              >
                Yevropa va dunyo bo‘ylab{" "}
                <span className="bg-gradient-to-r from-[#7A2E4E] via-[#A0526B] to-[#ff6a00] bg-clip-text text-transparent">
                  unutilmas sayohatlar
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-[600px] text-[#4a5361] text-base md:text-lg leading-8 dark:text-[#a9bddb]"
              >
                Biz bilan istalgan mamlakatga ishonchli, qulay va mazmunli tur
                paketlarini tanlang. Professional jamoa, shaffof narx va yuqori servis.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-7 flex flex-wrap gap-3"
              >
                <motion.button
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group h-12 px-6 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] text-white text-sm font-semibold transition shadow-[0_18px_50px_rgba(138,58,90,0.35)] hover:shadow-[0_24px_70px_rgba(138,58,90,0.45)]"
                >
                  <span className="inline-flex items-center gap-2">
                    Tur tanlash
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-12 px-6 rounded-2xl border border-black/10 bg-white/80 backdrop-blur text-[#1b1f2a] text-sm font-semibold hover:shadow-xl transition dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:hover:bg-[rgba(24,43,80,0.96)]"
                >
                  Batafsil
                </motion.button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[#5b6470] dark:text-[#a9bddb]"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                  Ishonchli xizmat
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00] shadow-[0_0_20px_rgba(255,106,0,0.8)]" />
                  Premium support
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={staggerWrap}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="grid grid-cols-2 gap-4"
            >
              {heroImages.map((src, i) => (
                <motion.div
                  key={src}
                  variants={softScale}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className={`group relative overflow-hidden rounded-[28px] border border-white/50 bg-white/70 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.72)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)] ${
                    i === 1 ? "mt-10" : ""
                  }`}
                >
                  <motion.img
                    src={src}
                    alt="Tour"
                    loading="lazy"
                    className="h-[240px] md:h-[280px] w-full object-cover"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10" />
                  {!reduceMotion && <ShineOverlay />}
                  
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-6" ref={statsRef}>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#dfe9f1] via-[#bfd2e3] to-[#91aac3] dark:bg-[linear-gradient(135deg,#102347_0%,#15315f_48%,#0c1d3d_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25),transparent_45%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_48%)]" />
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerWrap}
              className="relative mx-auto max-w-[1200px] px-5 py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
            >
              {stats.map((s) => (
                <motion.div key={s.title} variants={softScale}>
                  <StatItem data={s} animate={animate} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative py-16 bg-white dark:bg-transparent">
        <div className="mx-auto max-w-[1200px] px-5">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerWrap}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start"
          >
            <motion.div variants={fadeUp}>
              <div className="text-lg font-extrabold tracking-[0.2em] text-[#ff6a00] dark:text-[#ff9b57]">
                TRPZY AVIA TOUR
              </div>

              <p className="mt-4 text-[#4a5361] text-base leading-8 dark:text-[#a9bddb]">
                <span className="font-semibold text-[#1b1f2a] dark:text-white">
                  TRPZY AVIA TOUR
                </span>{" "}
                — O‘zbekistondagi yirik tur operatorlaridan biri bo‘lib, inbound va
                outbound turizm, shuningdek, yo‘lovchi avia tashuvlari bilan ham
                shug‘ullanadi.
              </p>

              <p className="mt-4 text-[#4a5361] text-base leading-8 dark:text-[#a9bddb]">
                Sayohat agentligi{" "}
                <span className="font-semibold text-[#1b1f2a] dark:text-white">
                  TRPZY AVIA TOUR
                </span>{" "}
                sizga dunyoning har bir go‘zal burchagini his qilish imkonini
                beruvchi eksklyuziv va qiziqarli tur mahsulotlarini taklif etadi.
              </p>

              <p className="mt-4 text-[#4a5361] text-base leading-8 dark:text-[#a9bddb]">
                Biz faqat ishonchli hamkorlar bilan ishlaymiz. Mehmonxonalar
                tanlashda yuqori servis, qulaylik va to‘liq xavfsizlik
                tamoyillariga amal qilamiz.
                <span className="font-semibold text-[#1b1f2a] dark:text-white">
                  {" "}
                  TRPZY AVIA TOUR
                </span>{" "}
                dunyoning eng ishonchli aviakompaniyalari bilan hamkorlik qiladi —
                bu mijozlarimiz uchun xavfsizlik va qulaylik kafolatidir.
              </p>

              <div className="mt-6 text-[#1b1f2a] font-semibold dark:text-white">
                TRPZY AVIA TOUR jamoasi sizga quyidagi xizmatlarni taklif etadi:
              </div>

              <ul className="mt-4 space-y-3 text-[#4a5361] text-sm dark:text-[#a9bddb]">
                {[
                  "dunyo bo‘ylab aviachiptalar uchun eng qulay tariflar;",
                  "butun dunyo bo‘ylab keng mehmonxona bazasi;",
                  "istalgan yo‘nalishga unutilmas sayohatlar;",
                  "turizm sohasidagi zamonaviy texnologiyalar.",
                ].map((x, i) => (
                  <motion.li
                    key={x}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[#ff6a00] shadow-[0_0_18px_rgba(255,106,0,0.7)]" />
                    <span>{x}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={softScale}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-[28px] border border-white/50 bg-white/80 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.12)] backdrop-blur dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.78)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.38)]"
            >
              <img
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80&fm=webp"
                alt="Travel"
                className="h-[380px] w-full rounded-2xl object-cover transition duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-4 rounded-2xl ring-1 ring-white/40" />
              {!reduceMotion && <ShineOverlay />}
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerWrap}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-7"
          >
            {[
              {
                title: "ENG QULAY NARXLAR",
                desc: "Aviabiletlar va tur paketlari uchun eng yaxshi narxlarni kafolatlaymiz.",
                icon: DollarSign,
              },
              {
                title: "VIZA YORDAMI",
                desc: "Zarur hujjatlarni tayyorlash va viza masalalarini hal qilishda ko‘mak.",
                icon: Stamp,
              },
              {
                title: "PROFESSIONAL JAMOA",
                desc: "24/7 xizmat ko‘rsatadigan mutaxassislar bilan ishonchli yordam.",
                icon: Users,
              },
              {
                title: "ENG YAXSHI MEHMONXONALAR",
                desc: "Reytingi yuqori va ishonchli mehmonxonalarni tavsiya qilamiz.",
                icon: Building2,
              },
              {
                title: "UNUTILMAS SAYOHATLAR",
                desc: "Yorqin va esda qolarli marshrutlar hamda sayohat tajribasi.",
                icon: Palmtree,
              },
              {
                title: "INDIVIDUAL YONDASHUV",
                desc: "Sizning qiziqishlaringiz va xohishlaringizga mos dastur tuzamiz.",
                icon: Heart,
              },
            ].map((x) => (
              <motion.div
                key={x.title}
                variants={softScale}
                whileHover={{ y: -8, scale: 1.01 }}
                className="group relative overflow-hidden rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.96)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_24px_70px_rgba(2,8,24,0.34)]"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#ff6a00]/0 via-[#ff6a00]/0 to-[#8A3A5A]/0"
                  whileHover={{
                    background:
                      "linear-gradient(135deg, rgba(255,106,0,0.06), rgba(138,58,90,0.08))",
                  }}
                />
                {!reduceMotion && <ShineOverlay />}
                <div className="relative flex gap-5 items-start">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#ff6a00]/30 bg-[#ff6a00]/10 text-[#ff6a00] shadow-[0_10px_25px_rgba(255,106,0,0.12)] dark:border-[#6b4a27] dark:bg-[rgba(82,63,23,0.4)] dark:text-[#ffb37e] dark:shadow-[0_14px_28px_rgba(2,8,24,0.24)]">
                    <x.icon size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-wide text-[#1b1f2a] dark:text-white">
                      {x.title}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-[#4a5361] dark:text-[#a9bddb]">
                      {x.desc}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CERTIFICATES */}
      <section className="py-16 bg-white dark:bg-transparent">
        <div className="mx-auto max-w-[1200px] px-5 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerWrap}
          >
            <motion.div
              variants={fadeUp}
              className="text-sm tracking-widest font-semibold text-[#ff6a00] dark:text-[#ff9b57]"
            >
              SERTIFIKATLAR
            </motion.div>

            <motion.h3
              variants={fadeUp}
              className="mt-3 text-3xl md:text-4xl font-extrabold text-[#1b1f2a] dark:text-white"
            >
              BIZNING SERTIFIKATLAR
            </motion.h3>

            <motion.div
              variants={fadeUp}
              className="mx-auto mt-5 h-1 w-16 bg-[#ff6a00]"
            />

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 items-center">
              {certImages.map((src, i) => (
                <motion.div
                  key={src}
                  variants={softScale}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_14px_36px_rgba(0,0,0,0.10)] hover:shadow-[0_22px_70px_rgba(0,0,0,0.18)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.82)] dark:shadow-[0_20px_55px_rgba(2,8,24,0.34)] dark:hover:shadow-[0_28px_80px_rgba(2,8,24,0.46)]"
                >
                  <img
                    src={src}
                    alt={`Sertifikat ${i + 1}`}
                    className="aspect-[4/5] h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
                  {!reduceMotion && <ShineOverlay />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-16 bg-[#fcfcfd] dark:bg-transparent">
        <div className="mx-auto max-w-[1200px] px-5 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerWrap}
          >
            <motion.div
              variants={fadeUp}
              className="text-sm tracking-widest font-semibold text-[#ff6a00] dark:text-[#ff9b57]"
            >
              HAMKORLAR
            </motion.div>

            <motion.h3
              variants={fadeUp}
              className="mt-3 text-3xl md:text-4xl font-extrabold text-[#1b1f2a] dark:text-white"
            >
              BIZNING HAMKORLAR
            </motion.h3>

            <motion.div
              variants={fadeUp}
              className="mx-auto mt-5 h-1 w-16 bg-[#ff6a00]"
            />

            <motion.div variants={fadeUp} className="mt-10 relative">
              <button
                type="button"
                aria-label="Oldingi"
                onClick={() => moveCarousel("left")}
                className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 h-11 w-11 rounded-full border border-black/10 bg-white/90 shadow-md backdrop-blur hover:shadow-xl transition dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.88)] dark:text-white dark:shadow-[0_16px_34px_rgba(2,8,24,0.34)]"
              >
                ‹
              </button>

              <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-20 bg-gradient-to-r from-[#fcfcfd] to-transparent dark:from-[#0a1730]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-20 bg-gradient-to-l from-[#fcfcfd] to-transparent dark:from-[#0a1730]" />

              <div
                ref={carouselRef}
                onMouseEnter={pauseCarousel}
                onMouseLeave={resumeCarousel}
                className="overflow-hidden"
              >
                <div className="flex gap-6 pr-6 w-max">
                  {[...partnerLogos, ...partnerLogos].map((p, i) => (
                    <motion.div
                      key={`${p.name}-${i}`}
                      data-partner-card
                      whileHover={{ y: -6, scale: 1.02 }}
                      className="group min-w-[210px] h-24 rounded-2xl border border-black/5 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)] grid place-items-center px-5 dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.82)] dark:shadow-[0_18px_40px_rgba(2,8,24,0.34)]"
                    >
                      <img
                        src={p.logo}
                        alt={p.name}
                        className="max-h-12 w-auto object-contain transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                aria-label="Keyingi"
                onClick={() => moveCarousel("right")}
                className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 h-11 w-11 rounded-full border border-black/10 bg-white/90 shadow-md backdrop-blur hover:shadow-xl transition dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.88)] dark:text-white dark:shadow-[0_16px_34px_rgba(2,8,24,0.34)]"
              >
                ›
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CONTACT / ORDER */}
      <section className="py-16">
        <div className="w-full px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[32px] border border-black/10 shadow-[0_35px_100px_rgba(0,0,0,0.22)] dark:border-[#35507f] dark:shadow-[0_40px_110px_rgba(2,8,24,0.46)]"
          >
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80&fm=webp"
              alt="Tropical resort"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,106,0,0.18),transparent_28%)]" />

            <div className="relative z-10 min-h-[560px] grid grid-cols-1 lg:grid-cols-2 gap-10 p-9 md:p-14">
              <motion.div
                initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/90 p-7 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,29,57,0.92)_0%,rgba(12,23,45,0.9)_100%)] dark:shadow-[0_28px_80px_rgba(2,8,24,0.42)]"
              >
                {!reduceMotion && <ShineOverlay />}
                <div className="relative text-center text-lg md:text-xl font-semibold">
                  Aloqa ma’lumotlari
                </div>
                <div className="relative mt-1 text-center text-sm text-[#6b7280] dark:text-[#a9bddb]">
                  Kontaktlaringizni qoldiring, biz siz bilan bog‘lanamiz
                </div>

                <form
                  className="relative mt-6 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Arizangiz qabul qilindi");
                  }}
                >
                  <LuxuryInput placeholder="Ism" />
                  <LuxuryInput placeholder="Telefon" />
                  <LuxuryInput placeholder="Qiziqqan yo‘nalish" />

                  <label className="flex items-center gap-2 text-xs text-[#6b7280] dark:text-[#a9bddb]">
                    <input type="checkbox" className="accent-[#ff6a00]" />
                    Shartlarga roziman
                  </label>

                  <motion.button
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#ff6a00] to-[#ff8c3a] text-white text-sm font-semibold shadow-[0_18px_40px_rgba(255,106,0,0.28)] hover:brightness-105 transition"
                  >
                    Yuborish
                  </motion.button>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="flex flex-col justify-center text-white"
              >
                <div className="text-3xl md:text-5xl font-extrabold leading-tight">
                  HOZIROQ BUYURTMA QILING
                </div>

                <div className="mt-4 max-w-[520px] text-lg md:text-xl text-white/90 leading-8">
                  Kontaktlaringizni qoldiring, siz uchun eng yaxshi tur paketini tanlaymiz.
                </div>

                <div className="mt-6 max-w-[540px] text-white/80 leading-8">
                  Dunyo bo‘ylab qulay reyslar, mehmonxonalar va transfer xizmatlari.
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 px-6 rounded-2xl bg-[#ff6a00] text-white text-sm font-semibold shadow-[0_16px_40px_rgba(255,106,0,0.30)]"
                  >
                    Biz bilan bog‘lanish
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 px-6 rounded-2xl border border-white/30 bg-white/10 backdrop-blur text-white text-sm font-semibold dark:border-[#4a6aa3] dark:bg-[rgba(20,35,66,0.38)]"
                  >
                    Xizmatlar haqida
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

function LuxuryInput({ placeholder }: { placeholder: string }) {
  const isPhone = placeholder.toLowerCase().includes("telefon");
  const [value, setValue] = useState(isPhone ? "+998" : "");

  return (
    <motion.input
      whileFocus={{ scale: 1.01 }}
      className="h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 outline-none transition focus:border-[#ff6a00]/40 focus:shadow-[0_0_0_4px_rgba(255,106,0,0.12)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-white dark:placeholder:text-[#8ea5cb] dark:focus:border-[#4d6fa8] dark:focus:shadow-[0_0_0_4px_rgba(77,111,168,0.18)]"
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        setValue(isPhone ? formatUzPhoneInput(next) : next);
      }}
    />
  );
}

function StatItem({
  data,
  animate,
}: {
  data: {
    icon: any;
    end: number;
    suffix: string;
    title: string;
    desc: string;
  };
  animate: boolean;
}) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) return;

    const duration = 1400;
    const end = data.end;

    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(end * eased));
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
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative h-full overflow-hidden rounded-[24px] border border-white/25 bg-white/20 p-5 text-center backdrop-blur-md shadow-[0_18px_40px_rgba(255,255,255,0.06)] dark:border-[#35507f] dark:bg-[rgba(18,34,64,0.58)] dark:shadow-[0_22px_50px_rgba(2,8,24,0.3)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-white/8 dark:via-white/4" />
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/50 shadow-[0_10px_25px_rgba(0,0,0,0.08)] dark:bg-[rgba(24,43,80,0.8)] dark:shadow-[0_14px_28px_rgba(2,8,24,0.26)]">
          <Icon size={34} className="text-[#8A3A5A] dark:text-[#d7a7bd]" />
        </div>

        <div className="mt-4 text-4xl font-extrabold text-black dark:text-white">
          {display}
        </div>

        <div className="mt-2 min-h-[40px] flex items-center justify-center text-center text-sm font-semibold tracking-wide text-black dark:text-white">
          {data.title}
        </div>

        <div className="mt-4 min-h-[72px] flex items-center justify-center text-center text-sm md:text-base text-black/80 leading-relaxed dark:text-[#cfe0fb]">
          {data.desc}
        </div>
      </motion.div>
    </motion.div>
  );
}
