import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";

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

export default function About() {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const carouselTimer = useRef<number | null>(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const prefersReduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduce) {
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
      { threshold: 0.3 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

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

    carouselTimer.current = window.setInterval(step, 2600);
    return () => {
      if (carouselTimer.current) window.clearInterval(carouselTimer.current);
    };
  }, []);

  const pauseCarousel = () => {
    if (carouselTimer.current) window.clearInterval(carouselTimer.current);
  };

  const resumeCarousel = () => {
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
    }, 2600);
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
    <div className="relative bg-[#f5f5f5]">
      {/* HERO */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 pt-32 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-3xl text-black md:text-5xl font-extrabold leading-tight">
              Yevropa va dunyo bo‘ylab sayohatlar
            </h1>
            <p className="mt-3 text-[#4a5361] text-base md:text-lg">
              Biz bilan istalgan mamlakatga ishonchli, qulay va mazmunli tur
              paketlarini tanlang. Professional jamoa, shaffof narx va yuqori servis.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] text-white text-sm font-semibold transition shadow-[0_16px_40px_rgba(138,58,90,0.35)] hover:shadow-[0_20px_60px_rgba(138,58,90,0.45)] hover:brightness-110">
                Tur tanlash
              </button>
              <button className="h-11 px-5 rounded-xl border border-black/10 bg-white text-[#1b1f2a] text-sm font-semibold hover:shadow-md transition">
                Batafsil
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {heroImages.map((src) => (
              <div key={src} className="rounded-2xl overflow-hidden border border-black/10 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                <img src={src} alt="Tour" className="h-[220px] w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6" ref={statsRef}>
          <div className="bg-gradient-to-b from-[#5f7897] to-[#b7d6ea]">
            <div className="mx-auto max-w-[1200px] px-5 py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {stats.map((s) => (
                <StatItem key={s.title} data={s} animate={animate} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="text-lg font-extrabold tracking-wide text-[#ff6a00]">
                ATLAS AVIA TOUR
              </div>
              <p className="mt-3 text-[#4a5361] text-base leading-relaxed">
                <span className="font-semibold text-[#1b1f2a]">Trpzy AVIA TOUR</span> —
                O‘zbekistondagi yirik tur operatorlaridan biri bo‘lib, inbound va
                outbound turizm, shuningdek, yo‘lovchi avia tashuvlari bilan ham
                shug‘ullanadi.
              </p>
              <p className="mt-4 text-[#4a5361] text-base leading-relaxed">
                Sayohat agentligi <span className="font-semibold text-[#1b1f2a]">ATLAS AVIA TOUR</span>
                sizga dunyoning har bir go‘zal burchagini his qilish imkonini beruvchi
                eksklyuziv va qiziqarli tur mahsulotlarini taklif etadi.
              </p>
              <p className="mt-4 text-[#4a5361] text-base leading-relaxed">
                Biz faqat ishonchli hamkorlar bilan ishlaymiz. Mehmonxonalar tanlashda
                yuqori servis, qulaylik va to‘liq xavfsizlik tamoyillariga amal qilamiz.
                <span className="font-semibold text-[#1b1f2a]"> ATLAS AVIA TOUR</span> dunyoning eng
                ishonchli aviakompaniyalari bilan hamkorlik qiladi — bu mijozlarimiz
                uchun xavfsizlik va qulaylik kafolatidir.
              </p>

              <div className="mt-6 text-[#1b1f2a] font-semibold">
                ATLAS AVIA TOUR jamoasi sizga quyidagi xizmatlarni taklif etadi:
              </div>
              <ul className="mt-3 space-y-2 text-[#4a5361] text-sm">
                {[
                  "dunyo bo‘ylab aviachiptalar uchun eng qulay tariflar;",
                  "butun dunyo bo‘ylab keng mehmonxona bazasi;",
                  "istalgan yo‘nalishga unutilmas sayohatlar;",
                  "turizm sohasidagi zamonaviy texnologiyalar.",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ff6a00]" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
              <img
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80&fm=webp"
                alt="Travel"
                className="h-[360px] w-full object-cover rounded-xl"
                loading="lazy"
              />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
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
              <div key={x.title} className="flex gap-5 items-start">
                <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#ff6a00] text-[#ff6a00]">
                  <x.icon size={24} />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-wide text-[#1b1f2a]">{x.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-[#4a5361]">{x.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1200px] px-5">
          <h3 className="text-3xl md:text-4xl font-extrabold text-center">Xizmatlarimiz</h3>
          <div className="mt-3 text-center text-[#4a5361] text-base md:text-lg">Avia sayohatingiz uchun to‘liq servis.</div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {[
              { title: "Mehmonxona bronlari", icon: Building2 },
              { title: "Transport va transfer", icon: Plane },
              { title: "Ekskursiyalar", icon: Palmtree },
              { title: "Visa support", icon: Stamp },
              { title: "Sug‘urta", icon: BadgeCheck },
              { title: "24/7 qo‘llab-quvvatlash", icon: HeartHandshake },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-black/10 bg-white p-7 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ff6a00]/15 text-[#ff6a00]">
                    <s.icon size={22} />
                  </div>
                  <div className="text-lg font-semibold text-[#1b1f2a]">{s.title}</div>
                </div>
                <div className="mt-3 text-base text-[#6b7280]">
                  Har bir xizmat avia sayohatingizni qulay, tez va xavfsiz qiladi.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATES */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 text-center">
          <div className="text-sm tracking-widest font-semibold text-[#ff6a00]">SERTIFIKATLAR</div>
          <h3 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#1b1f2a]">BIZNING SERTIFIKATLAR</h3>
          <div className="mx-auto mt-5 h-1 w-16 bg-[#ff6a00]" />

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 items-center">
            {certImages.map((src, i) => (
              <div key={src} className="group rounded-xl border border-black/10 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.10)] overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.16)] transition">
                <img src={src} alt={`Sertifikat ${i + 1}`} className="h-full w-full object-cover aspect-[4/5] group-hover:scale-[1.02] transition" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 text-center">
          <div className="text-sm tracking-widest font-semibold text-[#ff6a00]">HAMKORLAR</div>
          <h3 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#1b1f2a]">BIZNING HAMKORLAR</h3>
          <div className="mx-auto mt-5 h-1 w-16 bg-[#ff6a00]" />

          <div className="mt-10 relative">
            <button type="button" aria-label="Oldingi" onClick={() => moveCarousel("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-black/10 bg-white shadow-md hover:shadow-lg transition">
              ‹
            </button>

            <div ref={carouselRef} onMouseEnter={pauseCarousel} onMouseLeave={resumeCarousel} className="overflow-hidden">
              <div className="flex gap-6 pr-6 w-max">
                {[...partnerLogos, ...partnerLogos].map((p, i) => (
                  <div key={`${p.name}-${i}`} data-partner-card className="min-w-[200px] h-20 rounded-xl border border-black/10 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)] grid place-items-center px-4">
                    <img src={p.logo} alt={p.name} className="max-h-12 w-auto object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            <button type="button" aria-label="Keyingi" onClick={() => moveCarousel("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-black/10 bg-white shadow-md hover:shadow-lg transition">
              ›
            </button>
          </div>
        </div>
      </section>

      {/* CONTACT / ORDER */}
      <section className="py-16">
        <div className="w-full px-5 md:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-black/10 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80&fm=webp" alt="Tropical resort" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/45" />

            <div className="relative z-10 min-h-[560px] grid grid-cols-1 lg:grid-cols-2 gap-10 p-9 md:p-14">
              <div className="rounded-2xl bg-white/95 p-7 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <div className="text-center text-lg md:text-xl font-semibold">Aloqa ma’lumotlari</div>
                <div className="mt-1 text-center text-sm text-[#6b7280]">Kontaktlaringizni qoldiring, biz siz bilan bog‘lanamiz</div>

                <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); alert("Arizangiz qabul qilindi (demo)"); }}>
                  <input className="h-12 w-full rounded-xl border border-black/10 px-4 outline-none" placeholder="Ism" />
                  <input className="h-12 w-full rounded-xl border border-black/10 px-4 outline-none" placeholder="Telefon" />
                  <input className="h-12 w-full rounded-xl border border-black/10 px-4 outline-none" placeholder="Qiziqqan yo‘nalish" />

                  <label className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <input type="checkbox" className="accent-[#ff6a00]" />
                    Shartlarga roziman
                  </label>

                  <button className="h-12 w-full rounded-xl bg-[#ff6a00] text-white text-sm font-semibold hover:brightness-105 transition">
                    Yuborish
                  </button>
                </form>
              </div>

              <div className="text-white">
                <div className="text-3xl md:text-4xl font-extrabold">HOZIROQ BUYURTMA QILING</div>
                <div className="mt-4 text-lg md:text-xl text-white/90">
                  Kontaktlaringizni qoldiring, siz uchun eng yaxshi tur paketini tanlaymiz.
                </div>
                <div className="mt-6 text-white/80">
                  Dunyo bo‘ylab qulay reyslar, mehmonxonalar va transfer xizmatlari.
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button className="h-11 px-6 rounded-xl bg-[#ff6a00] text-white text-sm font-semibold">Biz bilan bog‘lanish</button>
                  <button className="h-11 px-6 rounded-xl border border-white/30 text-white text-sm font-semibold">Xizmatlar haqida</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatItem({ data, animate }: { data: { icon: any; end: number; suffix: string; title: string; desc: string }; animate: boolean; }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) return;

    const duration = 1200;
    const end = data.end;

    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
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
    <div className="text-center h-full flex flex-col items-center">
      <Icon size={42} className="mx-auto text-[#8A3A5A]" />
      <div className="mt-4 text-4xl font-extrabold text-black">{display}</div>
      <div className="mt-2 text-sm font-semibold tracking-wide text-black min-h-[40px] flex items-center justify-center text-center">
        {data.title}
      </div>
      <div className="mt-4 text-base text-black/85 leading-relaxed min-h-[72px] flex items-center justify-center text-center">
        {data.desc}
      </div>
    </div>
  );
}
