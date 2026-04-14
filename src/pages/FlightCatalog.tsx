import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarDays, PlaneLanding, PlaneTakeoff, RefreshCcw, Search, Tickets, UserRound } from "lucide-react"

import { searchAir } from "@/shared/api/air/air.api"
import type { AirSearchResponse } from "@/types/air"
import { formatMoney } from "@/lib/money"
import { getAccessToken } from "@/shared/auth/token"

type CatalogForm = {
  from: string
  to: string
  date: string
  pax: number
}

const LAST_SUCCESSFUL_SEARCH_KEY = "last_successful_air_search_v1"

const getDefaultDate = () => {
  const base = new Date()
  base.setDate(base.getDate() + 1)
  const yyyy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, "0")
  const dd = String(base.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const getTime = (value?: string) => {
  if (!value) return "—"
  const parts = value.split(" ")
  return parts[1]?.slice(0, 5) || value
}

const getDate = (value?: string) => {
  if (!value) return "—"
  return value.split(" ")[0] || value
}

const uniqueText = (values: Array<string | undefined | null>) =>
  Array.from(
    new Set(values.map((value) => (value || "").trim()).filter(Boolean))
  )

export default function FlightCatalog() {
  const [sp, setSp] = useSearchParams()
  const [form, setForm] = useState<CatalogForm>({
    from: "LON",
    to: "FRA",
    date: getDefaultDate(),
    pax: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<AirSearchResponse | null>(null)

  useEffect(() => {
    let nextForm: CatalogForm = {
      from: sp.get("from") || "",
      to: sp.get("to") || "",
      date: sp.get("date") || "",
      pax: Number(sp.get("pax") || "1"),
    }

    if (!nextForm.from || !nextForm.to || !nextForm.date) {
      try {
        const stored = localStorage.getItem(LAST_SUCCESSFUL_SEARCH_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<CatalogForm>
          nextForm = {
            from: parsed.from || nextForm.from || "LON",
            to: parsed.to || nextForm.to || "FRA",
            date: parsed.date || nextForm.date || getDefaultDate(),
            pax: parsed.pax && parsed.pax >= 1 ? parsed.pax : nextForm.pax >= 1 ? nextForm.pax : 1,
          }
        }
      } catch {
        nextForm = {
          from: nextForm.from || "LON",
          to: nextForm.to || "FRA",
          date: nextForm.date || getDefaultDate(),
          pax: nextForm.pax >= 1 ? nextForm.pax : 1,
        }
      }
    }

    setForm({
      from: (nextForm.from || "LON").toUpperCase(),
      to: (nextForm.to || "FRA").toUpperCase(),
      date: nextForm.date || getDefaultDate(),
      pax: nextForm.pax >= 1 ? nextForm.pax : 1,
    })
  }, [sp])

  useEffect(() => {
    if (!form.from || !form.to || !form.date) return

    let alive = true
    setLoading(true)
    setError(null)

    searchAir({
      adults: Math.max(1, form.pax),
      children: 0,
      infants: 0,
      class: "Y",
      trips: [
        {
          origin: form.from,
          destination: form.to,
          departure: form.date,
        },
      ],
    })
      .then((res) => {
        if (!alive) return
        setResponse(res.data)
        if (res.data.status !== "success") {
          setError(res.data.message || "Backend error")
          return
        }
        try {
          localStorage.setItem(LAST_SUCCESSFUL_SEARCH_KEY, JSON.stringify(form))
        } catch {
          // ignore localStorage errors
        }
      })
      .catch((err: any) => {
        if (!alive) return
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Backenddan ma'lumot olib bo'lmadi."
        setError(message)
        setResponse(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [form])

  const options = response?.data?.options ?? []
  const routeGroups = useMemo(() => {
    return options.reduce<Record<string, number>>((acc, option) => {
      const trip = option.trips?.[0]
      const key = `${trip?.origin || "—"} → ${trip?.destination || "—"}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }, [options])

  const tokenExists = Boolean(getAccessToken())

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams({
      from: form.from.trim().toUpperCase(),
      to: form.to.trim().toUpperCase(),
      date: form.date,
      pax: String(Math.max(1, form.pax)),
    })
    setSp(next, { replace: true })
  }

  return (
    <section className="secondary-page-shell min-h-screen px-4 pb-16 pt-24 sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1560px] 2xl:max-w-[1720px]">
        <div className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,248,255,0.94)_100%)] p-6 shadow-[0_24px_70px_rgba(17,24,39,0.09)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.95)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_24px_70px_rgba(4,10,28,0.4)] md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#61728a] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-[#d4e2fb]">
                <Tickets size={14} />
                Raw Backend Catalog
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
                Backend qaytargan barcha reyslar katalogi
              </h1>
              <p className="mt-3 max-w-[820px] text-sm leading-7 text-[#5d6d87] dark:text-[#c9daf8] sm:text-base">
                Bu sahifa frontend filtrlarsiz backend response ichidagi reyslarni kartalar ko‘rinishida chiqaradi.
                Shu yerda haqiqatan kelayotgan route, sana, vaqt va narxlarni to‘g‘ridan-to‘g‘ri ko‘rasiz.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/flights"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#dbe3ef] bg-white px-5 text-sm font-semibold text-[#334257] transition hover:bg-[#f8fbff] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb]"
              >
                Asosiy flights sahifasi
              </Link>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 grid gap-3 xl:grid-cols-[1fr_1fr_1fr_140px_170px]">
            <Field
              icon={<PlaneTakeoff size={16} />}
              label="Origin"
              value={form.from}
              onChange={(value) => setForm((prev) => ({ ...prev, from: value.toUpperCase() }))}
              placeholder="LON"
            />
            <Field
              icon={<PlaneLanding size={16} />}
              label="Destination"
              value={form.to}
              onChange={(value) => setForm((prev) => ({ ...prev, to: value.toUpperCase() }))}
              placeholder="FRA"
            />
            <DateField
              value={form.date}
              onChange={(value) => setForm((prev) => ({ ...prev, date: value }))}
            />
            <Field
              icon={<UserRound size={16} />}
              label="Passengers"
              value={String(form.pax)}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  pax: Math.max(1, Number(value.replace(/\D/g, "") || "1")),
                }))
              }
              placeholder="1"
            />
            <button
              type="submit"
              className="inline-flex h-[58px] items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] px-6 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(17,24,39,0.22)] transition hover:brightness-110"
            >
              <Search size={16} />
              Qidirish
            </button>
          </form>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <MetaCard
              title="Search summary"
              lines={[
                `Auth token: ${tokenExists ? "bor" : "yo'q"}`,
                `Status: ${response?.status || (loading ? "loading" : "—")}`,
                `Message: ${response?.message || "—"}`,
                `Options: ${options.length}`,
                `Currency: ${response?.data?.currency || "—"}`,
                `Min price: ${response?.data?.minPrice ? formatMoney(response.data.minPrice, response.data.currency) : "—"}`,
                `Max price: ${response?.data?.maxPrice ? formatMoney(response.data.maxPrice, response.data.currency) : "—"}`,
              ]}
            />
            <MetaCard
              title="Route distribution"
              lines={
                Object.entries(routeGroups).length
                  ? Object.entries(routeGroups)
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, count]) => `${key}: ${count} ta`)
                  : ["Hozircha route yo'q"]
              }
            />
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-[#dbe3ef] bg-white/80 px-4 py-3 text-sm text-[#5c6c84] shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.82)] dark:text-[#d4e2fb]">
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            <span>
              {loading
                ? "Backenddan reyslar olinmoqda..."
                : error
                  ? `Xato: ${error}`
                  : `${options.length} ta raw option topildi`}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {options.map((option, index) => (
            <RawFlightCard
              key={`${option.id}-${index}`}
              option={option}
              currency={response?.data?.currency}
            />
          ))}
        </div>

        {!loading && !options.length ? (
          <div className="mt-8 rounded-[28px] border border-[#dbe3ef] bg-white px-6 py-14 text-center text-[#627188] shadow-[0_18px_40px_rgba(17,24,39,0.06)] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d2e0f8]">
            Backenddan hozircha reys kelmadi yoki auth bilan muammo bor.
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="rounded-[20px] border border-[#dbe3ef] bg-white/90 px-4 py-3 shadow-[0_10px_20px_rgba(17,24,39,0.04)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71829a] dark:text-[#9fb4d7]">
        {icon}
        {label}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent text-[15px] font-semibold text-[#1d2430] outline-none placeholder:text-[#93a0b4] dark:text-white dark:placeholder:text-[#8ea5cb]"
      />
    </label>
  )
}

function DateField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="rounded-[20px] border border-[#dbe3ef] bg-white/90 px-4 py-3 shadow-[0_10px_20px_rgba(17,24,39,0.04)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71829a] dark:text-[#9fb4d7]">
        <CalendarDays size={16} />
        Departure
      </div>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-transparent text-[15px] font-semibold text-[#1d2430] outline-none dark:text-white"
      />
    </label>
  )
}

function MetaCard({
  title,
  lines,
}: {
  title: string
  lines: string[]
}) {
  return (
    <div className="rounded-[24px] border border-[#dbe3ef] bg-white/85 p-5 shadow-[0_12px_30px_rgba(17,24,39,0.05)] dark:border-[#35507f] dark:bg-[rgba(20,35,66,0.84)]">
      <div className="text-sm font-black uppercase tracking-[0.16em] text-[#3b4b61] dark:text-[#d4e2fb]">
        {title}
      </div>
      <div className="mt-3 space-y-2 text-sm text-[#627188] dark:text-[#c7d8f6]">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  )
}

function RawFlightCard({
  option,
  currency,
}: {
  option: NonNullable<AirSearchResponse["data"]>["options"][number]
  currency?: string
}) {
  const trip = option.trips?.[0]
  const segments = trip?.segments ?? []
  const segmentAirlines = uniqueText(segments.map((segment) => segment.carrier || segment.operatingCarrier))
  const baggages = uniqueText(segments.map((segment) => segment.baggage))
  const carryOns = uniqueText(segments.map((segment) => segment.carryOn))
  const firstSegment = segments[0]
  const lastSegment = segments[segments.length - 1]
  const totalPrice = Number(option.price || 0)

  return (
    <article className="rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,249,255,0.92)_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_24px_54px_rgba(4,10,28,0.38)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#76879d] dark:text-[#9fb4d7]">
            Option ID
          </div>
          <div className="mt-1 break-all text-sm font-medium text-[#3f4f66] dark:text-[#d4e2fb]">
            {option.id}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#76879d] dark:text-[#9fb4d7]">
            Total price
          </div>
          <div className="mt-1 text-2xl font-black text-[#1d67ff] dark:text-[#8cb9ff]">
            {formatMoney(totalPrice, option.currency || currency)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Info label="Trip route" value={`${trip?.origin || "—"} → ${trip?.destination || "—"}`} />
        <Info label="Departure" value={`${getDate(firstSegment?.departure)} ${getTime(firstSegment?.departure)}`} />
        <Info label="Arrival" value={`${getDate(lastSegment?.arrival)} ${getTime(lastSegment?.arrival)}`} />
        <Info label="Duration" value={trip?.duration ? `${trip.duration} min` : "—"} />
        <Info label="Stops" value={String(trip?.numberOfStops ?? Math.max(0, segments.length - 1))} />
        <Info label="Airlines" value={segmentAirlines.join(", ") || option.carrier || "—"} />
        <Info label="Baggage" value={baggages.join(" · ") || "—"} />
        <Info label="Carry on" value={carryOns.join(" · ") || "—"} />
        <Info label="Refundable" value={option.isRefundable ? "Yes" : "No"} />
      </div>

      <div className="mt-5">
        <div className="text-sm font-black uppercase tracking-[0.16em] text-[#3b4b61] dark:text-[#d4e2fb]">
          Segments
        </div>
        <div className="mt-3 space-y-3">
          {segments.map((segment, index) => (
            <div
              key={`${segment.flightNumber || "segment"}-${index}`}
              className="rounded-[22px] border border-[#e3ebf6] bg-white/90 p-4 dark:border-[#30476f] dark:bg-[rgba(18,32,60,0.92)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold text-[#1d2430] dark:text-white">
                  {segment.origin} → {segment.destination}
                </div>
                <div className="text-sm text-[#607089] dark:text-[#bdd0ef]">
                  {segment.carrier || segment.operatingCarrier || "—"} {segment.flightNumber || ""}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Departure" value={`${getDate(segment.departure)} ${getTime(segment.departure)}`} compact />
                <Info label="Arrival" value={`${getDate(segment.arrival)} ${getTime(segment.arrival)}`} compact />
                <Info label="Class" value={`${segment.serviceClass || "—"} / ${segment.bookingClass || "—"}`} compact />
                <Info label="Seats" value={String(segment.seatsAvailable ?? "—")} compact />
                <Info label="Baggage" value={segment.baggage || "—"} compact />
                <Info label="Carry on" value={segment.carryOn || "—"} compact />
                <Info label="Equipment" value={segment.equipment || "—"} compact />
                <Info label="Layover" value={segment.layover ? `${segment.layover} min` : "0 min"} compact />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

function Info({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className={`rounded-[18px] border border-[#e4ecf6] bg-white/88 px-4 py-3 dark:border-[#30476f] dark:bg-[rgba(22,40,74,0.84)] ${compact ? "text-sm" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b8ba0] dark:text-[#9fb4d7]">
        {label}
      </div>
      <div className="mt-1 font-semibold text-[#1d2430] dark:text-white">
        {value}
      </div>
    </div>
  )
}
