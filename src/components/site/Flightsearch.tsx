import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useI18n } from "@/shared/i18n/i18n"

type SearchForm = {
  from: string
  to: string
  date: string
  pax: number
}

export default function FlightSearch() {
  const navigate = useNavigate()
  const { language } = useI18n()
  const copy = {
    uz: {
      invalidDate: "Sana formati: YYYY-MM-DD",
      from: "Qayerdan",
      to: "Qayerga",
      search: "Qidirish",
      dateHint: "* Sana backendga `YYYY-MM-DD` formatda yuboriladi. Keyin aeroport autocomplete (TAS/IST/DXB) va qaytish sanasi qo'shiladi.",
      passenger: "Yo'lovchi",
      count: "ta",
    },
    ru: {
      invalidDate: "Формат даты: YYYY-MM-DD",
      from: "Откуда",
      to: "Куда",
      search: "Поиск",
      dateHint: "* Дата отправляется в backend в формате `YYYY-MM-DD`. Затем добавятся autocomplete аэропортов (TAS/IST/DXB) и дата возврата.",
      passenger: "Пассажиры",
      count: "",
    },
    en: {
      invalidDate: "Date format: YYYY-MM-DD",
      from: "From",
      to: "To",
      search: "Search",
      dateHint: "* The date is sent to the backend in `YYYY-MM-DD` format. Airport autocomplete (TAS/IST/DXB) and return date will be added later.",
      passenger: "Passenger",
      count: "",
    },
  }[language]

  const [form, setForm] = useState<SearchForm>({
    from: "Toshkent",
    to: "Istanbul",
    date: "",
    pax: 1,
  })

  const isValid = useMemo(() => form.from.trim().length > 0 && form.to.trim().length > 0, [form.from, form.to])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      toast.error(copy.invalidDate)
      return
    }

    const q = new URLSearchParams({
      from: form.from,
      to: form.to,
      date: form.date,
      pax: String(form.pax),
    }).toString()

    navigate(`/flights?${q}`)
  }

  const formatDate = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8)
    const y = digits.slice(0, 4)
    const m = digits.slice(4, 6)
    const d = digits.slice(6, 8)
    return [y, m, d].filter(Boolean).join("-")
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#0A1220]/60 p-4 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-white/25 focus:bg-white/10" placeholder={copy.from} value={form.from} onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))} />
        <input className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-white/25 focus:bg-white/10" placeholder={copy.to} value={form.to} onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))} />
        <input type="text" className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-white/25 focus:bg-white/10" placeholder="YYYY-MM-DD" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: formatDate(e.target.value) }))} />

        <button type="submit" disabled={!isValid} className="h-12 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] font-semibold text-white transition shadow-[0_18px_60px_rgba(138,58,90,0.35)] hover:brightness-110 hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] disabled:cursor-not-allowed disabled:opacity-60">
          {copy.search}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-white/60">{copy.dateHint}</div>

        <div className="flex items-center gap-2 text-sm text-white/80">
          <span>{copy.passenger}:</span>
          <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <button type="button" className="h-10 w-10 transition hover:bg-white/10" onClick={() => setForm((p) => ({ ...p, pax: Math.max(1, p.pax - 1) }))}>
              -
            </button>
            <div className="flex h-10 min-w-[70px] items-center justify-center px-4 font-semibold">
              {form.pax} {copy.count}
            </div>
            <button type="button" className="h-10 w-10 transition hover:bg-white/10" onClick={() => setForm((p) => ({ ...p, pax: Math.min(9, p.pax + 1) }))}>
              +
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
