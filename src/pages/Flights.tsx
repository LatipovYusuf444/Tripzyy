import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import {
  CalendarDays,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import heroImage from "@/assets/images/uzb-airways-desktop.jpg"
import FlightDetailsModal, {
  type Flight,
} from "@/components/site/FlightDetailsModal"
import { formatMoney } from "@/lib/money"
import { searchAir } from "@/shared/api/air/air.api"
import { bookingCart } from "@/shared/store/bookingCart"

const luxuryBtn =
  "border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-white shadow-[0_14px_28px_rgba(17,24,39,0.22)] hover:brightness-110"

const softPanel =
  "border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,249,255,0.92)_100%)] shadow-[0_20px_50px_rgba(17,24,39,0.08)]"

const flightsCache = new Map<string, { items: Flight[]; info: string | null }>()

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

type SearchCriteria = {
  from: string
  to: string
  date: string
  pax: number
}

type BackendFlightDebug = {
  id: string
  carrier: string
  origin: string
  destination: string
  departure: string
  arrival: string
  duration: number
  price: number
  currency?: string
}

export default function Flights() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [pax, setPax] = useState(1)

  const airline: string = ""
  const maxPrice: number | "" = ""
  const [sort, setSort] = useState<"best" | "cheap" | "fast">("best")

  const [items, setItems] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [lastInfo, setLastInfo] = useState<string | null>(null)
  const [backendDebug, setBackendDebug] = useState<BackendFlightDebug[]>([])

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Flight | null>(null)

  const lastAutoQueryRef = useRef("")
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const hydratedRef = useRef(false)

  useEffect(() => {
    const qFrom = sp.get("from") ?? ""
    const qTo = sp.get("to") ?? ""
    const qDate = sp.get("date") ?? ""
    const qPax = Number(sp.get("pax") ?? "1")
    const nextPax = !Number.isNaN(qPax) && qPax >= 1 ? qPax : 1

    setFrom(qFrom)
    setTo(qTo)
    setDate(qDate)
    setPax(nextPax)

    const hasSearchQuery = Boolean(qFrom && qTo && qDate)
    lastAutoQueryRef.current = hasSearchQuery
      ? JSON.stringify({ from: qFrom, to: qTo, date: qDate, pax: nextPax })
      : ""
    hydratedRef.current = true
  }, [sp])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const filtered = useMemo(() => {
    let list = items.filter((f) => {
      if (from && !f.from.toLowerCase().includes(from.toLowerCase())) return false
      if (to && !f.to.toLowerCase().includes(to.toLowerCase())) return false
      if (airline && !f.airline.toLowerCase().includes(airline.toLowerCase())) return false
      if (maxPrice !== "" && f.price > maxPrice) return false
      return true
    })

    if (sort === "cheap") list = [...list].sort((a, b) => a.price - b.price)
    if (sort === "fast") list = [...list].sort((a, b) => a.durationMin - b.durationMin)
    if (sort === "best") {
      list = [...list].sort(
        (a, b) =>
          a.price * 0.7 +
          a.durationMin * 0.3 -
          (b.price * 0.7 + b.durationMin * 0.3)
      )
    }

    return list
  }, [items, from, to, airline, maxPrice, sort])

  const toTime = (value?: string) => {
    if (!value) return "—"
    const t = value.split(" ")[1]
    return t ? t.slice(0, 5) : value
  }

  const runSearch = useCallback(
    async (criteria: SearchCriteria, showAlert: boolean) => {
      const { from, to, date, pax } = criteria
      const token = localStorage.getItem("access_token")
      if (!token) {
        if (showAlert) alert("Avval login qiling (token yo'q).")
        return
      }
      if (!from || !to || !date) {
        if (showAlert) alert("From, To va Sana to'ldiring.")
        return
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        if (showAlert) alert("Sana formati: YYYY-MM-DD")
        return
      }

      const queryKey = JSON.stringify({ from, to, date, pax })
      const cached = flightsCache.get(queryKey)
      if (cached) {
        setItems(cached.items)
        setLastInfo(cached.info)
        return
      }

      const requestId = ++requestIdRef.current
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      try {
        const res = await searchAir({
          adults: pax,
          children: 0,
          infants: 0,
          class: "Y",
          trips: [
            {
              origin: from,
              destination: to,
              departure: date,
            },
          ],
        }, { signal: controller.signal })

        if (requestId !== requestIdRef.current) return

        if (res.data.status !== "success" || !res.data.data?.options) {
          setItems([])
          setBackendDebug([])
          const msg = res.data.message || "Qidiruv xato"
          setLastInfo(`Backend: ${msg}`)
          if (showAlert) alert(msg)
          return
        }

        const mapped: Flight[] = res.data.data.options.map((opt) => {
          const trip = opt.trips[0]
          const seg = trip?.segments?.[0]
          const baggage =
            seg?.baggage || opt.packages?.families?.[0]?.baggageInfos?.[0] || "—"
          const services = ((opt.packages?.families?.[0]?.services ?? [])
            .map((s) => {
              const t = (s.description || "").toLowerCase()
              if (t.includes("wifi")) return "wifi" as const
              if (t.includes("meal") || t.includes("food")) return "meal" as const
              if (t.includes("priority")) return "priority" as const
              if (t.includes("support")) return "support" as const
              return null
            })
            .filter(Boolean) as Array<"wifi" | "meal" | "priority" | "support">)

          return {
            id: opt.id,
            from: trip?.origin || from,
            to: trip?.destination || to,
            airline: opt.carrier || seg?.carrier || "—",
            depart: toTime(seg?.departure),
            arrive: toTime(seg?.arrival),
            durationMin: trip?.duration || seg?.duration || 0,
            price: Number(opt.price || 0),
            currency: opt.currency || res.data.data?.currency,
            baggage,
            cabin: seg?.serviceClass === "C" ? "Business" : "Economy",
            refundable: false,
            services,
            flightNo: seg?.flightNumber
              ? `${seg?.carrier || ""}-${seg.flightNumber}`
              : "—",
          }
        })

        const rawOptions: BackendFlightDebug[] = res.data.data.options.map((opt) => {
          const trip = opt.trips[0]
          const seg = trip?.segments?.[0]

          return {
            id: opt.id,
            carrier: opt.carrier || seg?.carrier || "—",
            origin: trip?.origin || from,
            destination: trip?.destination || to,
            departure: seg?.departure || "—",
            arrival: seg?.arrival || "—",
            duration: trip?.duration || seg?.duration || 0,
            price: Number(opt.price || 0),
            currency: opt.currency || res.data.data?.currency,
          }
        })

        const info = `Backend: ${res.data.message} · options=${res.data.data.options.length} · currency=${res.data.data.currency}`
        setItems(mapped)
        setBackendDebug(rawOptions)
        setLastInfo(info)
        flightsCache.set(queryKey, { items: mapped, info })
      } catch (err: any) {
        if (requestId !== requestIdRef.current) return
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return
        const status = err?.response?.status
        const msg =
          status === 502
            ? "Backend vaqtincha javob bermayapti (502 Bad Gateway)."
            : err?.code === "ECONNABORTED"
              ? "Server juda sekin javob berdi. So'rov timeout bo'ldi."
              : err?.response?.data?.message || "Qidiruv xato"
        setItems([])
        setBackendDebug([])
        setLastInfo(`Backend: ${msg}`)
        if (showAlert) alert(msg)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          abortRef.current = null
        }
      }
    },
    []
  )

  const onSearch = () => {
    const criteria = { from: from.trim(), to: to.trim(), date: date.trim(), pax }
    const queryKey = JSON.stringify(criteria)
    lastAutoQueryRef.current = queryKey
    navigate(
      `/flights?${new URLSearchParams({
        from: criteria.from,
        to: criteria.to,
        date: criteria.date,
        pax: String(criteria.pax),
      }).toString()}`,
      { replace: true }
    )
    void runSearch(criteria, true)
  }

  useEffect(() => {
    if (!hydratedRef.current) return
    if (!from || !to || !date) return
    const queryKey = JSON.stringify({ from, to, date, pax })
    if (lastAutoQueryRef.current === queryKey) return

    lastAutoQueryRef.current = queryKey
    void runSearch({ from, to, date, pax }, false)
  }, [date, from, pax, runSearch, to])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const formatDate = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8)
    const y = digits.slice(0, 4)
    const m = digits.slice(4, 6)
    const d = digits.slice(6, 8)
    return [y, m, d].filter(Boolean).join("-")
  }

  const onPick = (f: Flight) => {
    setSelected(f)
    setOpen(true)
  }

  const onBook = (f: Flight) => {
    setOpen(false)

    const cart = bookingCart.get()
    bookingCart.set({
      ...cart,
      flightId: f.id,
      route: `${f.from} → ${f.to}`,
      date,
      pax,
      amount: f.price,
      currency: f.currency,
      passengers: cart.passengers ?? [],
    })

    navigate("/passengers")
  }

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f8_34%,#e7edf6_100%)] pt-20 text-[#1d2430]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(860px_340px_at_16%_0%,rgba(81,121,197,0.18),transparent_62%),radial-gradient(640px_280px_at_84%_4%,rgba(219,116,101,0.16),transparent_55%),radial-gradient(720px_320px_at_50%_28%,rgba(156,88,129,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.18)_72%,rgba(255,255,255,0)_100%)]" />

      <div className="relative mx-auto max-w-[1240px] px-5 py-12">
        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/60 p-4 shadow-[0_30px_90px_rgba(17,24,39,0.08)] backdrop-blur-md md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#fbfdff_0%,#f4f8ff_35%,#eef2fb_58%,#f7f1f5_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] md:p-8">
              <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(87,129,205,0.18)_0%,rgba(87,129,205,0)_72%)] blur-2xl" />
              <div className="pointer-events-none absolute bottom-4 right-6 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(216,114,109,0.16)_0%,rgba(216,114,109,0)_70%)] blur-2xl" />

              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f0] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6d87]">
                <Sparkles size={14} />
                Premium route selection
              </div>

              <h1 className="mt-6 max-w-[680px] text-[34px] font-black leading-[1.02] tracking-[-0.04em] text-[#1d2430] md:text-[48px]">
                Reyslar ichidan
                <span className="bg-[linear-gradient(135deg,#243a7a_0%,#a44c72_45%,#e36b3a_100%)] bg-clip-text text-transparent">
                  {" "}
                  eng qulay,{" "}
                </span>
                tez va didli tanlovni qiling
              </h1>

              <p className="mt-5 max-w-[600px] text-[15px] leading-8 text-[#627188] md:text-[16px]">
                Sayohatni faqat chipta bilan emas, taassurot bilan boshlang.
                Premium ko'rinish, aniq ma'lumot va qulay bron jarayonini bir
                joyda jamladik.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <InfoChip icon={CalendarDays} label="Sana" value={date || "Tanlanmagan"} />
                <InfoChip icon={Users} label="Yo'lovchi" value={`${pax} ta`} />
                <InfoChip
                  icon={PlaneTakeoff}
                  label="Yo'nalish"
                  value={`${from || "TAS"} → ${to || "SAW"}`}
                />
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <AccentStat
                  tone="blue"
                  title="Tez bron"
                  value="2 daqiqa"
                  text="Saralash, tanlash va yo'lovchi ma'lumotini kiritish oqimi soddalashtirilgan."
                />
                <AccentStat
                  tone="rose"
                  title="Shaffof narx"
                  value="No hidden fee"
                  text="Narx, valuta va reys tafsilotlari bir ko'rishda tushunarli bo'lib turadi."
                />
                <AccentStat
                  tone="gold"
                  title="Ishonch"
                  value="24/7 support"
                  text="Kuchli servis hissi beradigan toza, premium va ishonchli layout ishlatilgan."
                />
              </div>
            </div>

            <div className="relative min-h-[320px] overflow-hidden rounded-[32px] border border-white/70 bg-[#dce7f2] shadow-[0_20px_60px_rgba(18,27,45,0.10)]">
              <img
                src={heroImage}
                alt="Premium flights"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.04)_0%,rgba(17,24,39,0.34)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_32%)]" />

              <div className="absolute left-5 top-5 rounded-full border border-white/35 bg-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-sm">
                Luxury travel
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <div className="rounded-[24px] border border-white/30 bg-[rgba(12,20,38,0.46)] p-5 text-white backdrop-blur-md">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/65">
                    Curated journeys
                  </div>
                  <div className="mt-2 text-2xl font-black">
                    Osiyo va Yevropa bo'ylab nafis reyslar
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
                    <span className="rounded-full bg-white/12 px-3 py-1.5">Fast boarding</span>
                    <span className="rounded-full bg-white/12 px-3 py-1.5">Premium support</span>
                    <span className="rounded-full bg-white/12 px-3 py-1.5">Clear pricing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-6 rounded-[32px] p-5 backdrop-blur-sm ${softPanel}`}>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_210px]">
              <Field
                label="Qayerdan"
                value={from}
                placeholder="Masalan: TAS"
                onChange={setFrom}
              />
              <Field
                label="Qayerga"
                value={to}
                placeholder="Masalan: IST"
                onChange={setTo}
              />
              <Field
                label="Sana"
                value={date}
                placeholder="YYYY-MM-DD"
                onChange={(value) => setDate(formatDate(value))}
              />
              <button
                onClick={onSearch}
                disabled={loading}
                className={`h-14 rounded-[18px] font-semibold uppercase tracking-[0.12em] transition disabled:opacity-60 ${luxuryBtn}`}
              >
                {loading ? "Qidirilmoqda..." : "Qidirish"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#7f8ca0]">
                * Sana backendga `YYYY-MM-DD` formatda yuboriladi. Premium view,
                aniq narx va qulay bron oqimi uchun tayyorlandi.
              </div>

              <div className="flex flex-wrap gap-2">
                {(["best", "cheap", "fast"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={[
                      "h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition",
                      sort === k
                        ? luxuryBtn
                        : "border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] text-[#627188] hover:bg-white",
                    ].join(" ")}
                  >
                    {k === "best" ? "Best" : k === "cheap" ? "Cheap" : "Fast"}
                  </button>
                ))}
              </div>
            </div>

            {lastInfo ? <div className="mt-3 text-xs text-[#627188]">{lastInfo}</div> : null}
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {loading ? <InlineLoading /> : null}

          {!loading
            ? filtered.map((f, index) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: index * 0.04 }}
                  className="group relative overflow-hidden rounded-[30px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-6 shadow-[0_18px_45px_rgba(17,24,39,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(17,24,39,0.10)]"
                >
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-full bg-[linear-gradient(180deg,#3058a6_0%,#7b5d9a_52%,#df7d50_100%)] opacity-80" />
                  <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(95,129,201,0.12)_0%,rgba(95,129,201,0)_72%)] opacity-0 blur-2xl transition group-hover:opacity-100" />

                  <div className="flex flex-wrap items-center justify-between gap-5">
                    <div className="min-w-[260px] pl-2">
                      <div className="inline-flex rounded-full border border-[#e5ebf3] bg-[linear-gradient(135deg,#f8fbff_0%,#f1f5fb_100%)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#75839a]">
                        {f.airline}
                      </div>
                      <div className="mt-3 text-[28px] font-black tracking-[-0.03em] text-[#1d2430]">
                        {f.from} → {f.to}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#627188]">
                        <span className="rounded-full border border-[#e6ecf5] bg-[#f8fbff] px-3 py-1.5">
                          {f.depart} — {f.arrive}
                        </span>
                        <span className="rounded-full border border-[#e6ecf5] bg-[#f8fbff] px-3 py-1.5">
                          {fmtDuration(f.durationMin)}
                        </span>
                        <span className="rounded-full border border-[#e6ecf5] bg-[#f8fbff] px-3 py-1.5">
                          {f.baggage ?? "—"}
                        </span>
                        <span className="rounded-full border border-[#f0d7cc] bg-[#fff7f3] px-3 py-1.5 text-[#a55c41]">
                          {f.cabin ?? "Economy"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-[#75839a]">Narx</div>
                        <div className="mt-1 text-3xl font-black tracking-[-0.03em] text-[#1d2430]">
                          {formatMoney(f.price, f.currency)}
                        </div>
                      </div>

                      <button
                        className={`h-12 rounded-2xl px-6 font-semibold transition ${luxuryBtn}`}
                        onClick={() => onPick(f)}
                      >
                        Tanlash
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            : null}

          {!loading && filtered.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe3ef] bg-white px-6 py-12 text-center text-[#627188] shadow-[0_18px_40px_rgba(17,24,39,0.06)]">
              Hech narsa topilmadi.
            </div>
          ) : null}

          {!loading && backendDebug.length > 0 ? (
            <details className="rounded-[28px] border border-[#dbe3ef] bg-white p-6 shadow-[0_18px_40px_rgba(17,24,39,0.06)]">
              <summary className="cursor-pointer select-none text-sm font-semibold uppercase tracking-[0.14em] text-[#51627c]">
                Backenddan kelgan reyslar
              </summary>

              <div className="mt-4 overflow-hidden rounded-[20px] border border-[#e5ebf3]">
                <div className="grid grid-cols-[1.2fr_1fr_1.4fr_1.2fr_0.9fr] gap-3 bg-[#f7faff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718198]">
                  <div>Aviakompaniya</div>
                  <div>Yo'nalish</div>
                  <div>Vaqt</div>
                  <div>Davomiylik</div>
                  <div>Narx</div>
                </div>

                <div className="divide-y divide-[#edf2f7]">
                  {backendDebug.map((flight) => (
                    <div
                      key={flight.id}
                      className="grid grid-cols-[1.2fr_1fr_1.4fr_1.2fr_0.9fr] gap-3 px-4 py-3 text-sm text-[#253044]"
                    >
                      <div>
                        <div className="font-semibold">{flight.carrier}</div>
                        <div className="text-xs text-[#7b889c]">ID: {flight.id}</div>
                      </div>
                      <div className="font-semibold">
                        {flight.origin} → {flight.destination}
                      </div>
                      <div className="text-[#5f6e84]">
                        {flight.departure}
                        <br />
                        {flight.arrival}
                      </div>
                      <div className="text-[#5f6e84]">{fmtDuration(flight.duration)}</div>
                      <div className="font-semibold">
                        {formatMoney(flight.price, flight.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ) : null}
        </div>
      </div>

      <FlightDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        flight={selected}
        pax={pax}
        date={date}
        onBook={onBook}
      />
    </section>
  )
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <label className="rounded-[20px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] transition hover:border-[#cfd9e8] hover:bg-white">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97]">
        {label}
      </div>
      <input
        className="mt-2 w-full bg-transparent text-[15px] font-semibold text-[#1d2430] outline-none placeholder:text-[#93a0b4]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className="rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,250,255,0.92)_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0]">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-2 text-[15px] font-bold text-[#1d2430]">{value}</div>
    </div>
  )
}

function AccentStat({
  tone,
  title,
  value,
  text,
}: {
  tone: "blue" | "rose" | "gold"
  title: string
  value: string
  text: string
}) {
  const toneStyles = {
    blue: "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174]",
    rose: "border-[#f0d9df] bg-[linear-gradient(135deg,#fff8fa_0%,#fff1f3_100%)] text-[#8f4662]",
    gold: "border-[#f3e2bf] bg-[linear-gradient(135deg,#fffaf0_0%,#fff4da_100%)] text-[#8d5d16]",
  } as const

  return (
    <div
      className={`rounded-[24px] border p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] ${toneStyles[tone]}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
        <ShieldCheck size={14} />
        {title}
      </div>
      <div className="mt-2 text-xl font-black tracking-[-0.03em] text-[#1d2430]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[#627188]">{text}</p>
    </div>
  )
}

function InlineLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-[30px] border border-[#dbe3ef] bg-white px-6 py-6 shadow-[0_18px_45px_rgba(17,24,39,0.07)]">
        <div className="relative mb-6 overflow-hidden text-center">
          <span className="select-none text-[28px] font-black uppercase tracking-[0.18em] text-black/12 md:text-[36px]">
            ... LOADING
          </span>

          <motion.span
            className="absolute inset-0 select-none text-[28px] font-black uppercase tracking-[0.18em] text-black md:text-[36px]"
            animate={{
              clipPath: [
                "inset(0 100% 0 0)",
                "inset(0 0% 0 0)",
                "inset(0 0 0 0)",
              ],
            }}
            transition={{
              duration: 1.15,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            ... LOADING
          </motion.span>
        </div>

        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[28px] border border-[#dbe3ef] bg-[#fbfdff] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-[260px] flex-1">
                  <SkeletonLine className="h-4 w-[120px]" />
                  <SkeletonLine className="mt-3 h-8 w-[300px] max-w-full" />
                  <SkeletonLine className="mt-3 h-4 w-[380px] max-w-full" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <SkeletonLine className="ml-auto h-4 w-[60px]" />
                    <SkeletonLine className="mt-3 ml-auto h-9 w-[150px]" />
                  </div>
                  <SkeletonLine className="h-12 w-[132px] rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`overflow-hidden rounded-full bg-[#e9eef5] ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.45, 0.8, 0.45] }}
      transition={{
        duration: 1.4,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      <motion.div
        className="h-full w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]"
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </motion.div>
  )
}
