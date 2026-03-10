import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import heroMobile from "@/assets/images/avia1.webp";
import heroDesktop from "@/assets/images/uzb-airways-desktop.jpg";
import Napravleniya from "@/components/site/Napravleniya";
import { destinations as DEMO_DESTINATIONS } from "@/data/destinations";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
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
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 14 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 8,
    transition: { duration: 0.2 },
  },
};

function LuxuryGlow({
  className,
}: {
  className: string;
}) {
  return (
    <motion.div
      aria-hidden
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        x: [0, 30, -15, 0],
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

function FieldShell({
  children,
  hasError = false,
}: {
  children: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={[
        "relative rounded-xl transition",
        hasError ? "shadow-[0_0_0_1px_rgba(252,165,165,0.4)]" : "",
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}

function DropdownPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ShineButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-[35%] w-[28%] rotate-12 bg-white/20 blur-md"
        animate={{ x: ["0%", "430%"] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "easeInOut",
        }}
      />
    </motion.button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<"round" | "oneway" | "multi">("round");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [cabin, setCabin] = useState("Ekonom");
  const [paxOpen, setPaxOpen] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const paxRef = useRef<HTMLDivElement | null>(null);
  const [cabinOpen, setCabinOpen] = useState(false);
  const cabinRef = useRef<HTMLDivElement | null>(null);
  const [toOpen, setToOpen] = useState(false);
  const toRef = useRef<HTMLDivElement | null>(null);
  const [fromOpen, setFromOpen] = useState(false);
  const fromRef = useRef<HTMLDivElement | null>(null);
  const [errors, setErrors] = useState<{ from?: string; to?: string; date?: string }>({});
  const [shakeKey, setShakeKey] = useState(0);

  const totalPax = useMemo(() => adults + children + infants, [adults, children, infants]);
  const cabinOptions = useMemo(() => ["Ekonom", "Komfort", "Biznes", "Birinchi klass"], []);
  const destinationOptions = useMemo(() => {
    const seen = new Set<string>();
    return DEMO_DESTINATIONS.flatMap((d) => {
      const code = d.offers?.[0]?.toCode || d.city.slice(0, 3).toUpperCase();
      const key = `${d.city}-${code}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ city: d.city, country: d.country, code }];
    });
  }, []);

  const originOptions = useMemo(() => {
    const seen = new Set<string>();
    return DEMO_DESTINATIONS.flatMap((d) => {
      const offer = d.offers?.[0];
      if (!offer) return [];
      const key = `${offer.fromCity}-${offer.fromCode}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ city: offer.fromCity, country: "Uzbekistan", code: offer.fromCode }];
    });
  }, []);

  const filteredFrom = useMemo(() => {
    const q = from.trim().toLowerCase();
    const list = originOptions.filter((d) => {
      const hay = `${d.city} ${d.country} ${d.code}`.toLowerCase();
      return hay.includes(q);
    });
    return (q ? list : originOptions).slice(0, 6);
  }, [from, originOptions]);

  const filteredTo = useMemo(() => {
    const q = to.trim().toLowerCase();
    const list = destinationOptions.filter((d) => {
      const hay = `${d.city} ${d.country} ${d.code}`.toLowerCase();
      return hay.includes(q);
    });
    return (q ? list : destinationOptions).slice(0, 6);
  }, [to, destinationOptions]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (paxRef.current && !paxRef.current.contains(target)) setPaxOpen(false);
      if (cabinRef.current && !cabinRef.current.contains(target)) setCabinOpen(false);
      if (toRef.current && !toRef.current.contains(target)) setToOpen(false);
      if (fromRef.current && !fromRef.current.contains(target)) setFromOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const onSearch = () => {
    const next: { from?: string; to?: string; date?: string } = {};
    if (!from.trim()) next.from = "Qayerdan maydonini to‘ldiring";
    if (!to.trim()) next.to = "Qayerga maydonini to‘ldiring";
    if (!date) next.date = "Sana tanlang";

    setErrors(next);

    if (Object.keys(next).length > 0) {
      setShakeKey((v) => v + 1);
      return;
    }

    const q = new URLSearchParams({
      from,
      to,
      date,
      pax: String(totalPax),
    }).toString();

    navigate(`/flights?${q}`);
  };

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-black text-white">
        <motion.img
          src={heroMobile}
          alt="Uzbekistan Airways"
          className="absolute inset-0 h-full w-full object-cover object-center md:hidden"
          loading="lazy"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.img
          src={heroDesktop}
          alt="Uzbekistan Airways"
          className="absolute inset-0 hidden h-full w-full object-cover object-center md:block"
          loading="lazy"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_22%),radial-gradient(circle_at_top_right,rgba(122,46,78,0.28),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(93,122,151,0.22),transparent_24%)]" />

        <LuxuryGlow className="left-[-120px] top-[110px] h-[280px] w-[280px] bg-white/12" />
        <LuxuryGlow className="right-[-100px] top-[180px] h-[320px] w-[320px] bg-[#8A3A5A]/30" />
        <LuxuryGlow className="left-[28%] bottom-[10%] h-[220px] w-[220px] bg-[#5f7897]/20" />

        <div className="relative z-10 mx-auto max-w-[1200px] px-5 pt-36 pb-16">
          <motion.div
            variants={staggerWrap}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="max-w-[620px]"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm tracking-[0.3em] text-white/85 backdrop-blur-md"
            >
              TRIPZY AVIA
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight"
            >
              Qayerga <span className="text-white/90">uchmoqchisiz?</span>
              <br />
              Osmonda qulay sayohat qiling
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-white/80 text-lg leading-8"
            >
              Aviabiletlarni tez va qulay toping. Shaffof narxlar, ishonchli
              aviakompaniyalar va premium servis.
            </motion.p>
          </motion.div>

          <motion.div
            key={shakeKey}
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            animate={
              Object.keys(errors).length > 0
                ? { x: [0, -6, 6, -4, 4, -2, 2, 0] }
                : { x: 0 }
            }
            viewport={{ once: true }}
            transition={{
              opacity: { duration: 0.5 },
              y: { duration: 0.5 },
              scale: { duration: 0.5 },
              x: { duration: 0.45 },
            }}
            className="mt-10 max-w-[900px] rounded-[28px] border border-white/15 bg-white/15 text-white backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.40)]"
          >
            <div className="flex items-center gap-2 border-b border-white/15 px-4 py-3 text-xs font-semibold text-white">
              {[
                { id: "round", label: "Borib-qaytish" },
                { id: "oneway", label: "Bir tomonga" },
                { id: "multi", label: "Ko‘p shahar" },
              ].map((t) => {
                const active = tripType === t.id;
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    onClick={() => setTripType(t.id as "round" | "oneway" | "multi")}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={[
                      "relative h-9 px-4 rounded-xl transition border overflow-hidden",
                      active
                        ? "bg-white/20 text-white border-white/20 shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
                        : "bg-white/10 text-white/85 border-white/15 hover:bg-white/15",
                    ].join(" ")}
                  >
                    {active && (
                      <motion.span
                        layoutId="tripTypePill"
                        className="absolute inset-0 rounded-xl bg-white/10"
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4">
              <div ref={fromRef} className="relative">
                <FieldShell hasError={!!errors.from}>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    className={[
                      "h-12 w-full rounded-xl border px-4 outline-none transition bg-white/10 text-white placeholder:text-white/70 focus:border-white/60 focus:ring-2 focus:ring-white/20",
                      errors.from ? "border-red-300/70 bg-white/15" : "border-white/25",
                    ].join(" ")}
                    placeholder="Qayerdan (masalan: Toshkent - TAS)"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setFromOpen(true);
                    }}
                    onFocus={() => setFromOpen(true)}
                  />
                </FieldShell>

                <AnimatePresence>
                  {fromOpen && filteredFrom.length > 0 && (
                    <DropdownPanel className="absolute z-20 mt-2 w-[320px] rounded-2xl border border-white/15 bg-[#0f1218]/95 p-2 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                      <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
                        Ommabop ko‘rsatmalar
                      </div>
                      {filteredFrom.map((d, i) => (
                        <motion.button
                          key={`${d.city}-${d.code}`}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, delay: i * 0.03 }}
                          onClick={() => {
                            setFrom(`${d.city} (${d.code})`);
                            setFromOpen(false);
                          }}
                          className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                        >
                          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <div className="text-sm text-white">
                              {d.city}, {d.country}
                            </div>
                            <div className="text-xs text-white/70 tabular-nums min-w-[44px] text-right">
                              {d.code}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </DropdownPanel>
                  )}
                </AnimatePresence>
              </div>

              <div ref={toRef} className="relative">
                <FieldShell hasError={!!errors.to}>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    className={[
                      "h-12 w-full rounded-xl border px-4 outline-none transition bg-white/10 text-white placeholder:text-white/70 focus:border-white/60 focus:ring-2 focus:ring-white/20",
                      errors.to ? "border-red-300/70 bg-white/15" : "border-white/25",
                    ].join(" ")}
                    placeholder="Qayerga (masalan: Istanbul - IST)"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setToOpen(true);
                    }}
                    onFocus={() => setToOpen(true)}
                  />
                </FieldShell>

                <AnimatePresence>
                  {toOpen && filteredTo.length > 0 && (
                    <DropdownPanel className="absolute z-20 mt-2 w-[320px] rounded-2xl border border-white/15 bg-[#0f1218]/95 p-2 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                      <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
                        Ommabop ko‘rsatmalar
                      </div>
                      {filteredTo.map((d, i) => (
                        <motion.button
                          key={`${d.city}-${d.code}`}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, delay: i * 0.03 }}
                          onClick={() => {
                            setTo(`${d.city} (${d.code})`);
                            setToOpen(false);
                          }}
                          className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                        >
                          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <div className="text-sm text-white">
                              {d.city}, {d.country}
                            </div>
                            <div className="text-xs text-white/70 tabular-nums min-w-[44px] text-right">
                              {d.code}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </DropdownPanel>
                  )}
                </AnimatePresence>
              </div>

              <FieldShell hasError={!!errors.date}>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="date"
                  className={[
                    "h-12 w-full rounded-xl border px-4 outline-none transition bg-white/10 text-white placeholder:text-white/70 focus:border-white/60 focus:ring-2 focus:ring-white/20",
                    errors.date ? "border-red-300/70 bg-white/15" : "border-white/25",
                  ].join(" ")}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </FieldShell>

              <div ref={paxRef} className="relative">
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaxOpen((p) => !p);
                  }}
                  className="h-12 w-full rounded-xl border border-white/25 px-4 text-left bg-white/10 text-white flex items-center justify-between hover:bg-white/15 transition focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <span>{totalPax} yo‘lovchi</span>
                  <motion.span
                    animate={{ rotate: paxOpen ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    className="text-white/70"
                  >
                    👤
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {paxOpen && (
                    <DropdownPanel className="absolute z-20 mt-2 w-[280px] rounded-2xl border border-white/15 bg-[#0f1218]/95 p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      <div className="text-sm font-semibold text-white">
                        Yo‘lovchilar soni
                      </div>
                      <div className="mt-3 space-y-3 text-sm">
                        <PaxRow
                          label="Kattalar (12+)"
                          value={adults}
                          onDec={() => setAdults((v) => Math.max(1, v - 1))}
                          onInc={() => setAdults((v) => v + 1)}
                        />
                        <PaxRow
                          label="Bolalar (2–11)"
                          value={children}
                          onDec={() => setChildren((v) => Math.max(0, v - 1))}
                          onInc={() => setChildren((v) => v + 1)}
                        />
                        <PaxRow
                          label="Chaqaloq (2 yilgacha)"
                          value={infants}
                          onDec={() => setInfants((v) => Math.max(0, v - 1))}
                          onInc={() => setInfants((v) => v + 1)}
                        />
                      </div>
                    </DropdownPanel>
                  )}
                </AnimatePresence>
              </div>

              <div ref={cabinRef} className="relative">
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCabinOpen((p) => !p);
                  }}
                  className="h-12 w-full rounded-xl border border-white/25 px-4 pr-10 outline-none bg-white/10 text-white flex items-center justify-between hover:bg-white/15 transition focus:ring-2 focus:ring-white/20"
                >
                  <span>{cabin}</span>
                  <motion.span
                    animate={{ rotate: cabinOpen ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    className="text-white/70"
                  >
                    ▾
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {cabinOpen && (
                    <DropdownPanel className="absolute z-20 mt-2 w-full rounded-2xl border border-white/15 bg-[#0f1218]/95 p-2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      {cabinOptions.map((opt, i) => (
                        <motion.button
                          key={opt}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, delay: i * 0.03 }}
                          onClick={() => {
                            setCabin(opt);
                            setCabinOpen(false);
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left transition ${cabin === opt ? "bg-white/15 text-white" : "hover:bg-white/10 text-white/90"
                            }`}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </DropdownPanel>
                  )}
                </AnimatePresence>
              </div>

              <ShineButton
                onClick={onSearch}
                className="h-12 rounded-xl bg-white/10 text-white/90 font-semibold hover:bg-white/15 transition border border-white/15 shadow-[0_12px_32px_rgba(255,255,255,0.06)]"
              >
                Qidirish
              </ShineButton>
            </div>

            <AnimatePresence mode="wait">
              {(errors.from || errors.to || errors.date) && (
                <motion.div
                  key="errors"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="px-4 pb-4 text-xs text-red-200"
                >
                  {errors.from || errors.to || errors.date}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="px-4 pb-4 text-xs text-white/70"
            >
              * Hozir demo. Keyin real reyslar va tariflar ulanadi.
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-12 flex items-center gap-3 text-white/70"
          >
            <div className="text-xs tracking-[0.25em] uppercase">Pastga skroll</div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="flex h-9 w-6 items-start justify-center rounded-full border border-white/25 p-1"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-white/80"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Napravleniya />
    </>
  );
}

function PaxRow({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="flex items-center justify-between gap-3"
    >
      <span className="text-sm text-white/90">{label}</span>

      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={onDec}
          className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          -
        </motion.button>

        <motion.span
          key={value}
          initial={{ scale: 0.85, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-6 text-center font-semibold text-white"
        >
          {value}
        </motion.span>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={onInc}
          className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          +
        </motion.button>
      </div>
    </motion.div>
  );
}
