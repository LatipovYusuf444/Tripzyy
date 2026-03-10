import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroMobile from "@/assets/images/avia1.webp";
import heroDesktop from "@/assets/images/uzb-airways-desktop.jpg";
import Napravleniya from "@/components/site/Napravleniya";
import { destinations as DEMO_DESTINATIONS } from "@/data/destinations";

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
    if (Object.keys(next).length > 0) return;

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
      <section className="relative min-h-[100svh] bg-black text-white">
        <img
          src={heroMobile}
          alt="Uzbekistan Airways"
          className="absolute inset-0 h-full w-full object-cover object-center md:hidden"
          loading="lazy"
        />
        <img
          src={heroDesktop}
          alt="Uzbekistan Airways"
          className="absolute inset-0 h-full w-full hidden md:block object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/55" />

        <div className="relative z-10 mx-auto max-w-[1200px] px-5 pt-36 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-[620px]"
          >
            <div className="text-sm tracking-[0.3em] text-white/80">TRIPZY AVIA</div>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">
              Qayerga <span className="text-white/90">uchmoqchisiz?</span>
              <br />
              Osmonda qulay sayohat qiling
            </h1>
            <p className="mt-4 text-white/80 text-lg">
              Aviabiletlarni tez va qulay toping. Shaffof narxlar, ishonchli
              aviakompaniyalar va premium servis.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-10 max-w-[900px] rounded-2xl bg-white/25 text-white backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center gap-2 border-b border-white/15 px-4 py-3 text-xs font-semibold text-white">
              {[
                { id: "round", label: "Borib-qaytish" },
                { id: "oneway", label: "Bir tomonga" },
                { id: "multi", label: "Ko‘p shahar" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTripType(t.id as "round" | "oneway" | "multi")}
                  className={[
                    "h-8 px-3 rounded-lg transition",
                    tripType === t.id
                      ? "bg-white/20 text-white border border-white/20"
                      : "bg-white/10 text-white/85 border border-white/15 hover:bg-white/15",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4">
              <div ref={fromRef} className="relative">
                <input
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

                {fromOpen && filteredFrom.length > 0 && (
                  <div className="absolute z-20 mt-2 w-[320px] rounded-2xl border border-white/15 bg-[#0f1218]/95 p-2 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
                      Ommabop ko‘rsatmalar
                    </div>
                    {filteredFrom.map((d) => (
                      <button
                        key={`${d.city}-${d.code}`}
                        type="button"
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
                          <div className="text-xs text-white/70 tabular-nums min-w-[44px] text-right">{d.code}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={toRef} className="relative">
                <input
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

                {toOpen && filteredTo.length > 0 && (
                  <div className="absolute z-20 mt-2 w-[320px] rounded-2xl border border-white/15 bg-[#0f1218]/95 p-2 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
                      Ommabop ko‘rsatmalar
                    </div>
                    {filteredTo.map((d) => (
                      <button
                        key={`${d.city}-${d.code}`}
                        type="button"
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
                          <div className="text-xs text-white/70 tabular-nums min-w-[44px] text-right">{d.code}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="date"
                className={[
                  "h-12 rounded-xl border px-4 outline-none transition bg-white/10 text-white placeholder:text-white/70 focus:border-white/60 focus:ring-2 focus:ring-white/20",
                  errors.date ? "border-red-300/70 bg-white/15" : "border-white/25",
                ].join(" ")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <div ref={paxRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaxOpen((p) => !p);
                  }}
                  className="h-12 w-full rounded-xl border border-white/25 px-4 text-left bg-white/10 text-white flex items-center justify-between hover:bg-white/15 transition focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <span>{totalPax} yo‘lovchi</span>
                  <span className="text-white/70">👤</span>
                </button>

                {paxOpen && (
                  <div className="absolute z-20 mt-2 w-[280px] rounded-2xl border border-white/15 bg-[#0f1218]/95 p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
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
                  </div>
                )}
              </div>

              <div ref={cabinRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCabinOpen((p) => !p);
                  }}
                  className="h-12 w-full rounded-xl border border-white/25 px-4 pr-10 outline-none bg-white/10 text-white flex items-center justify-between hover:bg-white/15 transition focus:ring-2 focus:ring-white/20"
                >
                  <span>{cabin}</span>
                  <span className="text-white/70">▾</span>
                </button>

                {cabinOpen && (
                  <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/15 bg-[#0f1218]/95 p-2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    {cabinOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setCabin(opt);
                          setCabinOpen(false);
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left transition ${
                          cabin === opt ? "bg-white/15 text-white" : "hover:bg-white/10 text-white/90"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={onSearch}
                className="h-12 rounded-xl bg-white/10 text-white/90 font-semibold hover:bg-white/15 transition border border-white/15"
              >
                Qidirish
              </button>
            </div>

            {(errors.from || errors.to || errors.date) && (
              <div className="px-4 pb-4 text-xs text-red-200">
                {errors.from || errors.to || errors.date}
              </div>
            )}

            <div className="px-4 pb-4 text-xs text-white/70">
              * Hozir demo. Keyin real reyslar va tariflar ulanadi.
            </div>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/90">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDec}
          className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          -
        </button>
        <span className="w-6 text-center font-semibold text-white">{value}</span>
        <button
          type="button"
          onClick={onInc}
          className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          +
        </button>
      </div>
    </div>
  );
}
