import { useMemo, useState } from "react"
// TODO: backend ulaganda shuni ishlatasan:
// import http from "@/shared/api/http"

type Flight = {
  id: string
  from: string
  to: string
  airline: string
  depart: string
  arrive: string
  durationMin: number
  price: number
  baggage?: string
}

const MOCK: Flight[] = [
  { id: "1", from: "TAS", to: "IST", airline: "Turkish Airlines", depart: "09:40", arrive: "12:20", durationMin: 280, price: 220, baggage: "20kg" },
  { id: "2", from: "TAS", to: "DXB", airline: "FlyDubai", depart: "14:10", arrive: "17:40", durationMin: 210, price: 260, baggage: "25kg" },
  { id: "3", from: "TAS", to: "BKK", airline: "Emirates", depart: "22:00", arrive: "08:10", durationMin: 610, price: 640, baggage: "30kg" },
  { id: "4", from: "TAS", to: "SAW", airline: "Pegasus", depart: "05:30", arrive: "08:55", durationMin: 205, price: 170, baggage: "10kg" },
]

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export default function Flights() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [airline, setAirline] = useState("")
  const [maxPrice, setMaxPrice] = useState<number | "">("")
  const [sort, setSort] = useState<"best" | "cheap" | "fast">("best")

  const [items, setItems] = useState<Flight[]>(MOCK)
  const [loading, setLoading] = useState(false)

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

    // best (simple): cheap + fast balans
    if (sort === "best") {
      list = [...list].sort((a, b) => (a.price * 0.7 + a.durationMin * 0.3) - (b.price * 0.7 + b.durationMin * 0.3))
    }

    return list
  }, [items, from, to, airline, maxPrice, sort])

  const onSearch = async () => {
    setLoading(true)
    try {
      // TODO: Backend ulash:
      // const res = await http.post("/api/flights/search", { from, to, airline, maxPrice })
      // setItems(res.data.items)
      setItems(MOCK)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative bg-[#0A1220] pt-20 pb-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-14">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl text-white md:text-5xl font-bold">Reyslar</h1>
            <p className="mt-3 text-white/70">Filter + sort bilan eng mos reysni toping.</p>
          </div>

          <div className="flex gap-2 text-white">
            {(["best", "cheap", "fast"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={[
                  "h-10 px-4 rounded-2xl border text-sm font-semibold transition",
                  sort === k ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10",
                ].join(" ")}
              >
                {k === "best" ? "Best" : k === "cheap" ? "Cheap" : "Fast"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none text-white focus:border-white/25"
              placeholder="From (TAS)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              className="h-12 rounded-2xl bg-white/5 border text-white border-white/10 px-4 outline-none focus:border-white/25"
              placeholder="To (IST)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <input
              className="h-12 rounded-2xl bg-white/5 text-white border border-white/10 px-4 outline-none focus:border-white/25"
              placeholder="Airline"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
            />
            <input
              className="h-12 rounded-2xl bg-white/5 text-white border border-white/10 px-4 outline-none focus:border-white/25"
              placeholder="Max price"
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
            />
            <button
              onClick={onSearch}
              disabled={loading}
              className="h-12 rounded-2xl bg-[#FF7A00] font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Qidirilyapti..." : "Qidirish"}
            </button>
          </div>

          <div className="mt-3 text-xs text-white/55">
            {/* TODO: Backend ulaganda airport autocomplete + sana + pax */}
            * Keyin aeroport autocomplete (TAS/IST/DXB), sana va yo‘lovchi soni qo‘shiladi.
          </div>
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
                  <div className="mt-1 text-2xl font-bold">{f.from} → {f.to}</div>
                  <div className="mt-2 text-white/70 text-sm">
                    {f.depart} — {f.arrive} · {fmtDuration(f.durationMin)} · {f.baggage ?? "—"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-white/70 text-sm">Narx</div>
                    <div className="text-3xl font-extrabold">${f.price}</div>
                  </div>

                  <button
                    className="h-12 px-6 rounded-2xl bg-[#FF7A00] font-semibold hover:opacity-90 transition"
                    onClick={() => {
                      // TODO: booking flow:
                      // 1) /api/bookings/create
                      // 2) passenger info
                      // 3) payment
                      alert("Booking keyin backendga ulanadi ✅")
                    }}
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
    </section>
  )
}
