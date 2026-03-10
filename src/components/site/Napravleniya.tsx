import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

import DestinationDetailsModal, {
  type DestinationItem,
  type FlightOffer,
} from "@/components/site/DestinationDetailsModal"
import FlightDetailsModal, { type Flight } from "@/components/site/FlightDetailsModal"

import { destinations as DEMO_DESTINATIONS } from "@/data/destinations"
// import { http } from "@/shared/api/http"

export default function Napravleniya() {
  const [showAll, setShowAll] = useState(false)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<DestinationItem | null>(null)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutFlight, setCheckoutFlight] = useState<Flight | null>(null)
  const [checkoutDate, setCheckoutDate] = useState("")
  const [checkoutPax, setCheckoutPax] = useState(1)

  const [destinations] = useState<DestinationItem[]>(DEMO_DESTINATIONS)

  const seasonalSets = useMemo(() => {
    const pick = (title: string) => destinations.find((d) => d.title === title)
    return [
      {
        id: "qish",
        title: "Qishgi",
        subtitle: "Issiq va quyoshli yo‘nalishlar",
        items: [pick("BAA"), pick("Misr"), pick("Malayziya")].filter(Boolean) as DestinationItem[],
      },
      {
        id: "yoz",
        title: "Yozgi",
        subtitle: "Dengiz va orollar uchun",
        items: [pick("Indoneziya"), pick("Tailand"), pick("Vyetnam")].filter(Boolean) as DestinationItem[],
      },
      {
        id: "kuz",
        title: "Kuzgi",
        subtitle: "Shahar va madaniyat sayohatlari",
        items: [pick("Turkiya"), pick("Italiya"), pick("Fransiya")].filter(Boolean) as DestinationItem[],
      },
    ]
  }, [destinations])

  const [seasonOpen, setSeasonOpen] = useState(false)
  const [activeSeason, setActiveSeason] = useState<{
    id: string
    title: string
    subtitle: string
    items: DestinationItem[]
  } | null>(null)

  const visibleItems = useMemo(
    () => (showAll ? destinations : destinations.slice(0, 3)),
    [showAll, destinations]
  )

  useEffect(() => {
    if (!showAll) return
    const t = requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    return () => cancelAnimationFrame(t)
  }, [showAll])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ✅ BACKEND ULASH (optional)
  // useEffect(() => {
  //   async function loadDestinations() {
  //     try {
  //       // Backend endpoint:
  //       // GET /api/destinations
  //       // Response: DestinationItem[]
  //       const res = await http.get<DestinationItem[]>("/destinations")
  //       setDestinations(res.data)
  //     } catch (e) {
  //       // xato bo‘lsa demo qoladi
  //       console.log("destinations load error", e)
  //     }
  //   }
  //   loadDestinations()
  // }, [])

  const onCardClick = (item: DestinationItem) => {
    setSelected(item)
    setOpen(true)
  }

  const durationToMin = (value: string) => {
    const h = value.match(/(\d+)\s*h/i)
    const m = value.match(/(\d+)\s*m/i)
    const hours = h ? Number(h[1]) : 0
    const minutes = m ? Number(m[1]) : 0
    return hours * 60 + minutes
  }

  const mapOfferToFlight = (offer: FlightOffer): Flight => {
    return {
      id: offer.id,
      from: offer.fromCode,
      to: offer.toCode,
      airline: offer.airline,
      depart: offer.departTime,
      arrive: offer.arriveTime,
      durationMin: durationToMin(offer.duration),
      price: Math.round(offer.priceUZS / 12_500),
      baggage: offer.baggage,
      cabin: offer.cabin,
      refundable: offer.refundable,
      services: offer.services,
      flightNo: `${offer.fromCode}-${offer.toCode}`,
    }
  }

  const onBook = (offer: FlightOffer) => {
    setOpen(false)

    const flight = mapOfferToFlight(offer)
    setCheckoutFlight(flight)
    setCheckoutDate(new Date().toISOString().slice(0, 10))
    setCheckoutPax(1)
    setCheckoutOpen(true)
  }

  return (
    <section className="relative pt-16 pb-16 px-5 bg-transparent text-white">
      <div className="relative mx-auto max-w-[1200px]">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Ommabop yo‘nalishlar
          </h2>
          <div className="w-20 h-[2px] bg-[#c7d2fe] mx-auto my-3 rounded-full" />
          <p className="text-base md:text-lg text-white/70">
            Eng mashhur va sevimli sayohat yo‘nalishlari
          </p>
        </div>

        <div ref={gridRef}>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {visibleItems.map((item, index) => (
                <motion.div
                  layout
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.35, delay: showAll ? index * 0.03 : 0 }}
                  whileHover={{ y: -10 }}
                  onClick={() => onCardClick(item)}
                  className="relative group rounded-2xl overflow-hidden cursor-pointer border border-black/5 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
                >
                  <img
                    className="w-full h-[280px] object-cover scale-100 group-hover:scale-110 transition-transform duration-700"
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                        Batafsil
                      </span>
                    </div>
                    <p className="text-sm text-white/90 mt-1">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {destinations.length > 3 && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setShowAll((p) => !p)}
              className="h-12 px-6 rounded-full bg-white/10 text-white border border-white/15 hover:bg-white/15 transition"
            >
              {showAll ? "Yopish" : "Ko'proq Ko'rish"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-16 h-px w-full bg-black/10" />

      {/* Seasonal destinations */}
      {seasonalSets.length > 0 && (
        <div className="relative mx-auto mt-16 max-w-[1200px]">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">
              Sezonli yo‘nalishlar
            </h3>
            <div className="w-16 h-[2px] bg-[#c7d2fe] mx-auto my-3 rounded-full" />
            <p className="text-sm md:text-base text-white/70">
              Fasl bo‘yicha mos mamlakatlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 place-items-center">
            {seasonalSets.map((season, index) => {
              const hero = season.items[0]
              return (
                <motion.div
                  key={season.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="flex flex-col items-center text-center"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSeason(season)
                      setSeasonOpen(true)
                    }}
                    className="group relative h-[220px] w-[220px] rounded-full overflow-hidden border border-black/10 shadow-[0_22px_60px_rgba(0,0,0,0.2)]"
                  >
                    {hero && (
                      <img
                        src={hero.image}
                        alt={season.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-700"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-white font-semibold tracking-wide text-lg">
                        {season.title}
                      </div>
                    </div>
                  </button>

                  <div className="mt-7 grid gap-2.5 text-base text-white/80">
                    {season.items.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => onCardClick(item)}
                        className="px-3 py-1 rounded-full hover:bg-white/10 transition"
                      >
                        {item.city}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {seasonOpen && activeSeason && (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_22px_60px_rgba(0,0,0,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {activeSeason.title} yo‘nalishlar
                  </div>
                  <div className="text-sm text-white/70">{activeSeason.subtitle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSeasonOpen(false)}
                  className="h-10 px-4 rounded-full border border-white/15 bg-white/10 text-white text-sm hover:bg-white/15 transition"
                >
                  Yopish
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeSeason.items.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    onClick={() => onCardClick(item)}
                    className="relative group rounded-2xl overflow-hidden cursor-pointer border border-black/5 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
                  >
                    <img
                      className="w-full h-[220px] object-cover scale-100 group-hover:scale-110 transition-transform duration-700"
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/70">
                        {activeSeason.title}
                      </div>
                      <div className="mt-2 text-xl font-bold text-white">
                        {item.city}, {item.country}
                      </div>
                      <div className="mt-1 text-sm text-white/80">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <DestinationDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        destination={selected}
        onBook={onBook}
      />

      <FlightDetailsModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        flight={checkoutFlight}
        pax={checkoutPax}
        date={checkoutDate}
        onBook={() => setCheckoutOpen(false)}
      />
    </section>
  )
}
