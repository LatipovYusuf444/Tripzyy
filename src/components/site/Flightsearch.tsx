import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

type SearchForm = {
  from: string
  to: string
  date: string
  pax: number
}

export default function FlightSearch() {
  const navigate = useNavigate()

  const [form, setForm] = useState<SearchForm>({
    from: "Toshkent",
    to: "Istanbul",
    date: "",
    pax: 1,
  })

  const isValid = useMemo(() => {
    return form.from.trim().length > 0 && form.to.trim().length > 0
  }, [form.from, form.to])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    const q = new URLSearchParams({
      from: form.from,
      to: form.to,
      date: form.date,
      pax: String(form.pax),
    }).toString()

    navigate(`/flights?${q}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#0A1220]/60 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.45)] p-4 md:p-5 text-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25 focus:bg-white/10 transition"
          placeholder="Qayerdan"
          value={form.from}
          onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
        />
        <input
          className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25 focus:bg-white/10 transition"
          placeholder="Qayerga"
          value={form.to}
          onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
        />
        <input
          type="date"
          className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25 focus:bg-white/10 transition"
          value={form.date}
          onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
        />

        <button
          type="submit"
          disabled={!isValid}
          className="h-12 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] font-semibold text-white transition
                     shadow-[0_18px_60px_rgba(138,58,90,0.35)] hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Qidirish
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-white/60">
          * Keyin aeroport autocomplete (TAS/IST/DXB) va qaytish sanasi qo‘shiladi.
        </div>

        <div className="flex items-center gap-2 text-sm text-white/80">
          <span>Yo‘lovchi:</span>
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              type="button"
              className="h-10 w-10 hover:bg-white/10 transition"
              onClick={() => setForm((p) => ({ ...p, pax: Math.max(1, p.pax - 1) }))}
            >
              −
            </button>
            <div className="h-10 px-4 flex items-center justify-center min-w-[70px] font-semibold">
              {form.pax} ta
            </div>
            <button
              type="button"
              className="h-10 w-10 hover:bg-white/10 transition"
              onClick={() => setForm((p) => ({ ...p, pax: Math.min(9, p.pax + 1) }))}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
