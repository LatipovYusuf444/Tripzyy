import { AnimatePresence, motion } from "framer-motion"
import { X, PlaneTakeoff, PlaneLanding, Clock, Luggage, BadgeCheck, ShieldCheck, Wifi, Coffee } from "lucide-react"

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
            <div className="relative h-[180px] w-full overflow-hidden">
              <img src={destination.image} alt={destination.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1220]/85 via-[#0A1220]/40 to-transparent" />

              <button
                onClick={onClose}
                className="absolute right-4 top-4 h-10 w-10 rounded-xl border border-white/20 bg-white/10
                           text-white hover:bg-white/20 transition grid place-items-center"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-white text-2xl md:text-3xl font-extrabold">{destination.title}</div>
                    <div className="text-white/75 mt-1">{destination.desc}</div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-white/85">
                    <BadgeCheck size={16} />
                    Premium offer preview
                  </div>
                </div>
              </div>
            </div>

            {/* body */}
            <div className="p-5 md:p-7 overflow-auto max-h-[calc(86vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Pill icon={PlaneLanding} label="Manzil" value={`${destination.city}${destination.country ? `, ${destination.country}` : ""}`} />
                <Pill icon={ShieldCheck} label="Sifat" value="Shaffof tariflar & shartlar" />
                <Pill icon={Clock} label="Takliflar" value={`${destination.offers.length} ta`} />
              </div>

              <div className="mt-6 space-y-4">
                <div className="text-white font-semibold text-lg">Reys takliflari</div>

                {destination.offers.length === 0 ? (
                  <div className="rounded-2xl border border-white/15 bg-white/8 p-5 text-white/70">
                    Hozircha demo reyslar yo‘q. Keyin backend ulanganida shu yerga real reyslar chiqadi.
                  </div>
                ) : (
                  destination.offers.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-2xl border border-white/18 bg-white/8 backdrop-blur-xl p-4 md:p-5 hover:bg-white/12 transition"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 text-white flex-wrap">
                            <span className="text-xl font-bold">{o.departTime}</span>
                            <span className="text-white/70">{o.fromCode} • {o.fromCity}</span>
                            <span className="text-white/40">—</span>
                            <span className="text-xl font-bold">{o.arriveTime}</span>
                            <span className="text-white/70">{o.toCode} • {o.toCity}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-white/75 text-sm">
                            <Tag icon={PlaneTakeoff} text={o.airline} />
                            <Tag icon={Clock} text={o.duration} />
                            <Tag icon={Luggage} text={o.baggage} />
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{o.cabin}</span>
                            <span
                              className={`rounded-full border px-3 py-1 ${
                                o.refundable ? "border-green-500/25 bg-green-500/15 text-green-100" : "border-white/15 bg-white/10 text-white/75"
                              }`}
                            >
                              {o.refundable ? "Refundable" : "No refund"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {o.services.includes("wifi") && <Mini icon={Wifi} text="Wi-Fi" />}
                            {o.services.includes("meal") && <Mini icon={Coffee} text="Meal" />}
                            {o.services.includes("priority") && <Mini icon={BadgeCheck} text="Priority" />}
                            {o.services.includes("support") && <Mini icon={ShieldCheck} text="24/7 Support" />}
                          </div>
                        </div>

                        <div className="md:w-[220px] flex md:flex-col items-center md:items-end justify-between gap-3">
                          <div className="text-white text-right">
                            <div className="text-2xl font-extrabold">{formatUZS(o.priceUZS)}</div>
                            <div className="text-white/60 text-xs">Yakuniy narx (tax + fee)</div>
                          </div>

                          <button
                            onClick={() => onBook(o)}
                            className="h-11 px-5 rounded-2xl bg-[#FF7A00] text-white font-semibold hover:opacity-95 transition
                                       shadow-[0_18px_50px_rgba(255,122,0,0.25)]"
                          >
                            Bron qilish
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 text-white/55 text-xs">
                        TODO: bu taklif backend API’dan keladi. Keyin seat availability, rules, terms qo‘shiladi.
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-white/15 bg-white/8 p-4 text-white/70 text-sm">
                <span className="font-semibold text-white">Eslatma:</span> Hozir demo ma’lumot. Backend ulanganida real reyslar bilan to‘ladi.
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
    <div className="rounded-2xl border border-white/18 bg-white/10 backdrop-blur-xl p-4">
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

function Tag({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
      <Icon size={14} className="text-white/85" />
      {text}
    </span>
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
