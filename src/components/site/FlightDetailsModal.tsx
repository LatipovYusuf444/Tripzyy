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
} from "lucide-react"

export type Flight = {
  id: string
  from: string
  to: string
  airline: string
  depart: string
  arrive: string
  durationMin: number
  price: number
  baggage?: string

  // ⬇️ demo fields (keyin backenddan keladi)
  cabin?: "Economy" | "Business"
  refundable?: boolean
  services?: Array<"wifi" | "meal" | "priority" | "support">
  flightNo?: string
}

const overlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
}

const panel = {
  hidden: { opacity: 0, y: 16, scale: 0.98, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" },
}

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export default function FlightDetailsModal({
  open,
  onClose,
  flight,
  pax,
  date,
  onBook,
}: {
  open: boolean
  onClose: () => void
  flight: Flight | null
  pax: number
  date: string
  onBook: (flight: Flight) => void
}) {
  if (!flight) return null

  const cabin = flight.cabin ?? "Economy"
  const refundable = flight.refundable ?? false
  const services = flight.services ?? ["support"]
  const flightNo = flight.flightNo ?? "TZ-102"

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
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

          {/* panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              fixed z-[70]
              left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[min(980px,92vw)]
              max-h-[86vh]
              overflow-hidden
              rounded-[28px]
              border border-white/18
              bg-white/10
              backdrop-blur-2xl
              shadow-[0_45px_140px_rgba(0,0,0,0.65)]
            "
          >
            {/* header */}
            <div className="relative p-5 md:p-7 bg-gradient-to-b from-white/10 via-transparent to-transparent">
              <button
                onClick={onClose}
                className="
                  absolute right-4 top-4
                  h-10 w-10 rounded-xl
                  border border-white/20 bg-white/10
                  text-white hover:bg-white/20 transition
                  grid place-items-center
                "
              >
                <X size={18} />
              </button>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-white/70 text-sm">{flight.airline} · {flightNo}</div>
                  <div className="mt-1 text-2xl md:text-3xl font-extrabold text-white">
                    {flight.from} → {flight.to}
                  </div>
                  <div className="mt-2 text-white/70 text-sm">
                    Sana: <span className="text-white/85">{date || "—"}</span> · Pax:{" "}
                    <span className="text-white/85">{pax}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white/60 text-xs">Yakuniy narx</div>
                  <div className="text-3xl font-extrabold text-white">${flight.price}</div>
                  <div className="text-white/55 text-xs">tax + fee included</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Pill icon={PlaneTakeoff} label="Uchish" value={flight.depart} />
                <Pill icon={PlaneLanding} label="Qo‘nish" value={flight.arrive} />
                <Pill icon={Clock} label="Davomiylik" value={fmtDuration(flight.durationMin)} />
              </div>
            </div>

            {/* body */}
            <div className="p-5 md:p-7 overflow-auto max-h-[calc(86vh-150px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* left */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                    <div className="text-white font-semibold">Tarif & shartlar</div>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/85">
                        {cabin}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-sm ${
                          refundable
                            ? "border-green-500/25 bg-green-500/15 text-green-100"
                            : "border-white/15 bg-white/10 text-white/75"
                        }`}
                      >
                        {refundable ? "Refundable" : "No refund"}
                      </span>

                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/85 inline-flex items-center gap-2">
                        <Luggage size={14} />
                        {flight.baggage ?? "—"}
                      </span>
                    </div>

                    <div className="mt-4 text-white/65 text-sm leading-relaxed">
                      Tarif qoidalari, qaytarish shartlari va baggage tafsilotlari backenddan keladi.
                      Hozircha demo ko‘rinish.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                    <div className="text-white font-semibold">Hizmatlar</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {services.includes("wifi") && <Mini icon={Wifi} text="Wi-Fi" />}
                      {services.includes("meal") && <Mini icon={Coffee} text="Meal" />}
                      {services.includes("priority") && <Mini icon={BadgeCheck} text="Priority" />}
                      {services.includes("support") && <Mini icon={ShieldCheck} text="24/7 Support" />}
                    </div>

                    <div className="mt-4 text-white/65 text-sm">
                      {/* TODO */}
                      TODO: Backend ulanganida “seat”, “transit”, “terminal/gate” ham qo‘shiladi.
                    </div>
                  </div>
                </div>

                {/* right */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
                    <div className="text-white font-semibold">Booking</div>
                    <div className="mt-3 text-white/70 text-sm">
                      Keyingi bosqichda:
                      Passenger info → tasdiqlash → e-ticket/invoice.
                    </div>

                    <button
                      onClick={() => onBook(flight)}
                      className="
                        mt-5 w-full h-12 rounded-2xl
                        bg-[#FF7A00] text-white font-semibold
                        hover:opacity-90 transition
                        shadow-[0_18px_50px_rgba(255,122,0,0.25)]
                      "
                    >
                      Bron qilish
                    </button>

                    <div className="mt-3 text-xs text-white/55">
                      {/* TODO */}
                      TODO: /booking route ochiladi yoki API orqali create booking qilinadi.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5 text-white/70 text-sm">
                    <span className="text-white font-semibold">Eslatma:</span> Bu modal hozir demo.
                    Backend API qo‘shilganda real reys data chiqadi.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Pill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/12 grid place-items-center">
          <Icon className="text-white" size={18} />
        </div>
        <div>
          <div className="text-white/60 text-xs">{label}</div>
          <div className="text-white font-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}

function Mini({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-white/75 text-xs">
      <Icon size={14} className="text-white/80" />
      {text}
    </span>
  )
}
