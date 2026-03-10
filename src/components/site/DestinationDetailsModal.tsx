import { AnimatePresence, motion } from "framer-motion"
import {
  X,
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  Luggage,
  BadgeCheck,
  ShieldCheck,
  Wifi,
  Coffee,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

export type FlightOffer = {
  id: string
  fromCity: string
  fromCode: string
  toCity: string
  toCode: string
  departTime: string
  arriveTime: string
  duration: string
  airline: string
  priceUZS: number
  cabin: "Economy" | "Business"
  baggage: string
  refundable: boolean
  services: Array<"wifi" | "meal" | "priority" | "support">
}

export type DestinationItem = {
  title: string
  desc: string
  image: string
  city: string
  country?: string
  offers: FlightOffer[]
}

const overlay = { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
const panel = {
  hidden: { opacity: 0, y: 16, scale: 0.98, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" },
}

const formatUZS = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " UZS"
const formatDate = (d: Date) =>
  d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "long" })

export default function DestinationDetailsModal({
  open,
  onClose,
  destination,
  onBook,
}: {
  open: boolean
  onClose: () => void
  destination: DestinationItem | null
  onBook: (offer: FlightOffer) => void
}) {
  if (!destination) return null

  const [onlyRefundable, setOnlyRefundable] = useState(false)
  const [onlyBaggage, setOnlyBaggage] = useState(false)
  const [cabinFilter, setCabinFilter] = useState<"all" | "Economy" | "Business">("all")
  const [departRange, setDepartRange] = useState<[number, number]>([0, 24])
  const [arriveRange, setArriveRange] = useState<[number, number]>([0, 24])
  const [durationRange, setDurationRange] = useState<[number, number]>([3, 24])
  const [priceRange, setPriceRange] = useState<[number, number]>([1_200_000, 9_000_000])

  const offers = useMemo(() => {
    return destination.offers.filter((o) => {
      if (onlyRefundable && !o.refundable) return false
      if (onlyBaggage && !/\d+\s*kg/i.test(o.baggage)) return false
      if (cabinFilter !== "all" && o.cabin !== cabinFilter) return false

      const departHour = toHour(o.departTime)
      const arriveHour = toHour(o.arriveTime)
      const durationHours = toDurationHours(o.duration)

      if (departHour < departRange[0] || departHour > departRange[1]) return false
      if (arriveHour < arriveRange[0] || arriveHour > arriveRange[1]) return false
      if (durationHours < durationRange[0] || durationHours > durationRange[1]) return false
      if (o.priceUZS < priceRange[0] || o.priceUZS > priceRange[1]) return false

      return true
    })
  }, [
    destination.offers,
    onlyRefundable,
    onlyBaggage,
    cabinFilter,
    departRange,
    arriveRange,
    durationRange,
    priceRange,
  ])

  const todayLabel = formatDate(new Date())
  const fromCity = destination.offers[0]?.fromCity ?? "Toshkent"
  const fromCode = destination.offers[0]?.fromCode ?? "TAS"
  const toCity = destination.city
  const toCode = destination.offers[0]?.toCode ?? ""

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            variants={overlay}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[60] bg-black/55"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(1320px,96vw)] max-h-[90vh] overflow-hidden rounded-[32px] border border-black/10 bg-[#f6f7fb] shadow-[0_55px_160px_rgba(0,0,0,0.35)]"
          >
            <div className="relative border-b border-black/10 bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl md:text-3xl font-extrabold text-[#111827]">
                    {fromCity} <span className="text-[#6b7280]">({fromCode})</span>
                    <ArrowRight className="inline-block mx-2 text-[#9aa3af]" size={18} />
                    {toCity} {toCode ? <span className="text-[#6b7280]">({toCode})</span> : null}
                  </div>
                  <div className="mt-2 text-sm text-[#6b7280]">
                    {todayLabel} · 1 yo‘lovchi · {destination.offers[0]?.cabin ?? "Economy"}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-10 w-10 rounded-full border border-black/10 bg-white text-[#111827] hover:bg-black/5 transition grid place-items-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-auto max-h-[calc(90vh-76px)]">
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-7">
                <aside className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-base font-semibold text-[#111827]">
                    <SlidersHorizontal size={16} />
                    Filtrlar
                  </div>

                  <div className="mt-5 space-y-5 text-sm">
                    <FilterBlock title="Jo‘nash vaqti" subtitle={`${fromCity} – ${toCity}`}>
                      <div className="space-y-3">
                        <RangeRow
                          label="Jo‘nash"
                          value={`${pad(departRange[0])}:00 - ${pad(departRange[1])}:00`}
                          min={0}
                          max={24}
                          range={departRange}
                          onChange={setDepartRange}
                        />
                        <RangeRow
                          label="Kelish"
                          value={`${pad(arriveRange[0])}:00 - ${pad(arriveRange[1])}:00`}
                          min={0}
                          max={24}
                          range={arriveRange}
                          onChange={setArriveRange}
                        />
                      </div>
                    </FilterBlock>

                    <FilterBlock title="Sayohat vaqti" subtitle={`${fromCity} – ${toCity}`}>
                      <RangeRow
                        label="Davomiylik"
                        value={`${durationRange[0]} soat – ${durationRange[1]} soat`}
                        min={1}
                        max={30}
                        range={durationRange}
                        onChange={setDurationRange}
                      />
                    </FilterBlock>

                    <FilterBlock title="Narx">
                      <RangeRow
                        label="Umumiy narx"
                        value={`${formatUZS(priceRange[0])} – ${formatUZS(priceRange[1])}`}
                        min={500_000}
                        max={12_000_000}
                        step={100_000}
                        range={priceRange}
                        onChange={setPriceRange}
                      />
                    </FilterBlock>
                    <div>
                      <div className="text-xs text-[#6b7280]">Bagaj</div>
                      <label className="mt-2 flex items-center gap-2 text-[#111827]">
                        <input
                          type="checkbox"
                          className="accent-[#ff6a00]"
                          checked={onlyBaggage}
                          onChange={(e) => setOnlyBaggage(e.target.checked)}
                        />
                        Bagaj bilan
                      </label>
                    </div>

                    <div>
                      <div className="text-xs text-[#6b7280]">Qaytarish</div>
                      <label className="mt-2 flex items-center gap-2 text-[#111827]">
                        <input
                          type="checkbox"
                          className="accent-[#ff6a00]"
                          checked={onlyRefundable}
                          onChange={(e) => setOnlyRefundable(e.target.checked)}
                        />
                        Faqat qaytariladigan
                      </label>
                    </div>

                    <div>
                      <div className="text-xs text-[#6b7280]">Kabina</div>
                      <div className="mt-2 space-y-2">
                        {(["all", "Economy", "Business"] as const).map((c) => (
                          <label key={c} className="flex items-center gap-2 text-[#111827]">
                            <input
                              type="radio"
                              name="cabin"
                              className="accent-[#ff6a00]"
                              checked={cabinFilter === c}
                              onChange={() => setCabinFilter(c)}
                            />
                            {c === "all" ? "Barcha" : c}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-[#f7f7f9] p-4 text-xs text-[#6b7280]">
                      <CheckCircle2 size={14} className="inline-block mr-2 text-emerald-500" />
                      Filtrlar demo. Backend ulanganida to‘liq ishlaydi.
                    </div>
                  </div>
                </aside>

                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-semibold text-[#111827]">Reys takliflari</div>
                    <div className="text-sm text-[#6b7280]">{offers.length} ta natija</div>
                  </div>

                  {offers.length === 0 ? (
                    <div className="rounded-2xl border border-black/10 bg-white p-5 text-[#6b7280]">
                      Hozircha demo reyslar yo‘q. Keyin backend ulanganida shu yerga real reyslar chiqadi.
                    </div>
                  ) : (
                    offers.map((o) => (
                      <div
                        key={o.id}
                        className="rounded-3xl border border-black/10 bg-white p-5 md:p-6 shadow-sm hover:shadow-md transition"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-5">
                          <div>
                            <div className="flex items-center gap-3 flex-wrap text-[#111827]">
                              <span className="text-2xl font-extrabold">{o.departTime}</span>
                              <span className="text-[#6b7280]">{o.fromCode} · {o.fromCity}</span>
                              <span className="text-[#cbd5e1]">—</span>
                              <span className="text-2xl font-extrabold">{o.arriveTime}</span>
                              <span className="text-[#6b7280]">{o.toCode} · {o.toCity}</span>
                            </div>

                            <div className="mt-2 text-xs text-[#6b7280]">
                              {todayLabel} · {o.duration}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              <Tag icon={PlaneTakeoff} text={o.airline} />
                              <Tag icon={Clock} text={o.duration} />
                              <Tag icon={Luggage} text={o.baggage} />
                              <span className="rounded-full border border-black/10 bg-[#f7f7f9] px-3 py-1 text-[#111827]">
                                {o.cabin}
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1 ${
                                  o.refundable
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-black/10 bg-[#f7f7f9] text-[#6b7280]"
                                }`}
                              >
                                {o.refundable ? "Qaytariladi" : "Qaytarilmaydi"}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {o.services.includes("wifi") && <Mini icon={Wifi} text="Wi‑Fi" />}
                              {o.services.includes("meal") && <Mini icon={Coffee} text="Meal" />}
                              {o.services.includes("priority") && <Mini icon={BadgeCheck} text="Priority" />}
                              {o.services.includes("support") && <Mini icon={ShieldCheck} text="24/7 Support" />}
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between gap-3">
                            <div className="text-right">
                              <div className="text-3xl font-extrabold text-[#111827]">{formatUZS(o.priceUZS)}</div>
                              <div className="text-xs text-[#6b7280]">Yakuniy narx</div>
                            </div>

                            <button
                              onClick={() => onBook(o)}
                              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B] text-white font-semibold transition shadow-[0_18px_50px_rgba(138,58,90,0.35)] hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110"
                            >
                              Tanlash
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Tag({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f9] px-3 py-1 text-[#111827]">
      <Icon size={14} className="text-[#6b7280]" />
      {text}
    </span>
  )
}

function Mini({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f7f9] px-3 py-1 text-[#6b7280] text-xs">
      <Icon size={14} className="text-[#9aa3af]" />
      {text}
    </span>
  )
}

function FilterBlock({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[#111827]">{title}</div>
          {subtitle ? <div className="text-xs text-[#6b7280]">{subtitle}</div> : null}
        </div>
        <span className="text-[#9aa3af]">⌃</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function RangeRow({
  label,
  value,
  min,
  max,
  step = 1,
  range,
  onChange,
}: {
  label: string
  value: string
  min: number
  max: number
  step?: number
  range: [number, number]
  onChange: (r: [number, number]) => void
}) {
  const [from, to] = range
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-[#6b7280]">
        <span>{label}</span>
        <span className="rounded-full border border-black/5 bg-[#f7f7f9] px-2 py-0.5 text-[#111827]">
          {value}
        </span>
      </div>
      <div className="mt-2 grid gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={from}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), to)
            onChange([v, to])
          }}
          className="w-full accent-[#ff6a00]"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={to}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), from)
            onChange([from, v])
          }}
          className="w-full accent-[#ff6a00]"
        />
      </div>
    </div>
  )
}

function toHour(value: string) {
  const m = value.match(/(\d{1,2}):(\d{2})/)
  if (!m) return 0
  return Number(m[1]) + Number(m[2]) / 60
}

function toDurationHours(value: string) {
  const h = value.match(/(\d+)\s*h/)
  const m = value.match(/(\d+)\s*m/)
  const hours = h ? Number(h[1]) : 0
  const minutes = m ? Number(m[1]) : 0
  return hours + minutes / 60
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}
