import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

import DestinationDetailsModal, {
  type DestinationItem,
  type FlightOffer,
} from "@/components/site/DestinationDetailsModal"

import { destinations as DEMO_DESTINATIONS } from "@/data/destinations"
// import { http } from "@/shared/api/http"

export default function Napravleniya() {
  const [showAll, setShowAll] = useState(false)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<DestinationItem | null>(null)

  const [destinations, setDestinations] =
    useState<DestinationItem[]>(DEMO_DESTINATIONS)

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

  const onBook = (offer: FlightOffer) => {
    setOpen(false)
    navigate(
      `/flights?from=${encodeURIComponent(offer.fromCode)}&to=${encodeURIComponent(
        offer.toCode
      )}&date=&pax=1`
    )
  }

  return (
    <section className="relative bg-[#0A1220] pt-20 pb-20 px-5">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ommabop yo‘nalishlar
          </h2>
          <div className="w-24 h-1 bg-[#FF7A00] mx-auto my-4 rounded-full" />
          <p className="text-lg md:text-xl text-[#C7CCD6]">
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
                  className="relative group rounded-3xl overflow-hidden cursor-pointer border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
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
                    <p className="text-sm text-[#D1D5DB] mt-1">{item.desc}</p>
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
              className="h-14 px-8 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/15 transition"
            >
              {showAll ? "Yopish" : "Ko'proq Ko'rish"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-16 h-px w-full bg-white/10" />

      <DestinationDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        destination={selected}
        onBook={onBook}
      />
    </section>
  )
}
