import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import FlightDetailsModal, { type Flight } from "@/components/site/FlightDetailsModal"
import { bookingCart } from "@/shared/store/bookingCart"
import { searchAir } from "@/shared/api/air/air.api"
import { formatMoney } from "@/lib/money"

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
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
  const [autoLoaded, setAutoLoaded] = useState(false)

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Flight | null>(null)

  useEffect(() => {
    const qFrom = sp.get("from") ?? ""
    const qTo = sp.get("to") ?? ""
    const qDate = sp.get("date") ?? ""
    const qPax = Number(sp.get("pax") ?? "1")

    setFrom(qFrom || "TAS")
    setTo(qTo || "SAW")
    setDate(qDate || "2026-03-20")
    if (!Number.isNaN(qPax) && qPax >= 1) setPax(qPax)
    setAutoLoaded(false)
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
        (a, b) => a.price * 0.7 + a.durationMin * 0.3 - (b.price * 0.7 + b.durationMin * 0.3)
      )
    }

    return list
  }, [items, from, to, airline, maxPrice, sort])

  const toTime = (value?: string) => {
    if (!value) return "—"
    const t = value.split(" ")[1]
    return t ? t.slice(0, 5) : value
  }

  const runSearch = useCallback(async (showAlert: boolean) => {
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
      })

      if (res.data.status !== "success" || !res.data.data?.options) {
        setItems([])
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
          flightNo: seg?.flightNumber ? `${seg?.carrier || ""}-${seg.flightNumber}` : "—",
        }
      })

      setItems(mapped)
      setLastInfo(
        `Backend: ${res.data.message} · options=${res.data.data.options.length} · currency=${res.data.data.currency}`
      )
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Qidiruv xato"
      setItems([])
      setLastInfo(`Backend: ${msg}`)
      if (showAlert) alert(msg)
    } finally {
      setLoading(false)
    }
  }, [date, from, pax, to])

  const onSearch = () => {
    void runSearch(true)
  }

  useEffect(() => {
    if (autoLoaded) return
    if (!from || !to || !date) return
    setAutoLoaded(true)
    void runSearch(false)
  }, [autoLoaded, date, from, runSearch, to])

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

  // ✅ MUHIM: booking cartga yozamiz va passengers pagega o'tamiz
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
      // passengers oldin kiritilgan bo'lsa saqlanib qoladi
      passengers: cart.passengers ?? [],
    })

    navigate("/passengers")
  }

  return (
    <section className="relative text-white pt-20">
      <div className="relative mx-auto max-w-[1200px] px-5 py-14">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">Reyslar</h1>
            <p className="mt-3 text-white/70">
              Sana: <span className="text-white/85">{date || "—"}</span> · Yo'lovchi:{" "}
              <span className="text-white/85">{pax}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {(["best", "cheap", "fast"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={[
                  "h-10 px-4 rounded-2xl border text-sm font-semibold transition",
                  sort === k
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10",
                ].join(" ")}
              >
                {k === "best" ? "Best" : k === "cheap" ? "Cheap" : "Fast"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25"
              placeholder="From (TAS)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25"
              placeholder="To (IST)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <input
              type="text"
              className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25"
              placeholder="YYYY-MM-DD"
              value={date}
              onChange={(e) => setDate(formatDate(e.target.value))}
            />
            <button
              onClick={onSearch}
              disabled={loading}
              className="h-12 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] font-semibold text-white transition
                         shadow-[0_18px_60px_rgba(138,58,90,0.35)] hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                         disabled:opacity-60"
            >
              {loading ? "Qidirilmoqda..." : "Qidirish"}
            </button>
          </div>

          <div className="mt-3 text-xs text-white/55">
            * Keyin real natija, pagination va "booking" oqimi qo'shiladi.
          </div>
          <div className="mt-2 text-xs text-white/55">
            * Sana backendga `YYYY-MM-DD` formatda yuboriladi.
          </div>
          {lastInfo && (
            <div className="mt-2 text-xs text-white/70">
              {lastInfo}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          {filtered.map((f) => (
            <div
              key={f.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between flex-wrap gap-5">
                <div className="min-w-[260px]">
                  <div className="text-white/70 text-sm">{f.airline}</div>
                  <div className="mt-1 text-2xl font-bold">
                    {f.from} → {f.to}
                  </div>
                  <div className="mt-2 text-white/70 text-sm">
                    {f.depart} — {f.arrive} · {fmtDuration(f.durationMin)} · {f.baggage ?? "—"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-white/70 text-sm">Narx</div>
                    <div className="text-3xl font-extrabold">{formatMoney(f.price, f.currency)}</div>
                  </div>

                  <button
                    className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] font-semibold text-white transition
                               shadow-[0_18px_60px_rgba(138,58,90,0.35)] hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110"
                    onClick={() => onPick(f)}
                  >
                    Tanlash
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center text-white/70 py-10">Hech narsa topilmadi.</div>
          )}
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
