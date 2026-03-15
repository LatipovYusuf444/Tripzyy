import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { ArrowRight, CalendarDays, Clock3, Filter, Plane, PlaneLanding, PlaneTakeoff, Sparkles, Ticket, Users } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import heroImage from "@/assets/images/uzb-airways-desktop.jpg"
import FareCalendarPicker from "@/components/site/FareCalendarPicker"
import FlightDetailsModal, { type Flight } from "@/components/site/FlightDetailsModal"
import { formatMoney } from "@/lib/money"
import { searchAir } from "@/shared/api/air/air.api"
import { AIRPORT_CACHE_KEY, DEFAULT_AIRPORT_DIRECTORY } from "@/shared/air/airportDirectory"
import { FEATURED_ROUTE_CARDS_KEY, type FeaturedRouteCard } from "@/shared/air/featuredRoutes"
import { bookingCart } from "@/shared/store/bookingCart"

const luxuryBtn =
  "border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] text-white shadow-[0_14px_28px_rgba(17,24,39,0.22)] hover:brightness-110"
const softPanel =
  "border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,249,255,0.92)_100%)] shadow-[0_20px_50px_rgba(17,24,39,0.08)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(15,27,52,0.96)_0%,rgba(19,35,67,0.92)_100%)] dark:shadow-[0_22px_60px_rgba(4,10,28,0.38)]"
const flightsCache = new Map<string, { items: Flight[]; info: string | null }>()
const LAST_SUCCESSFUL_SEARCH_KEY = "last_successful_air_search_v1"
const LAST_AIR_RESULT_META_KEY = "last_air_result_meta_v1"

type SearchCriteria = { from: string; to: string; date: string; pax: number }
type LocationOption = { code: string; name: string; searchText: string }

type SearchDataLike = {
  currency?: string
  options?: any[]
  carriers?: Array<{ code: string; name: string; logo?: string }>
  cities?: Array<{ code: string; name: string }>
  airports?: Array<{ code: string; name: string }>
}

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h} soat ${m} daqiqa`
}

const toTime = (value?: string) => {
  if (!value) return "—"
  const t = value.split(" ")[1]
  return t ? t.slice(0, 5) : value
}

const toApiAsset = (path?: string) => {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const base = (import.meta.env.VITE_API_URL || "https://b2b.skyup.uz/api").replace(/\/api\/?$/i, "")
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

const formatCompactPrice = (amount: number, currency?: string) => {
  if ((currency || "").toUpperCase() === "UZS" && amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2).replace(".", ",")} mln UZS`
  }
  return formatMoney(amount, currency)
}

const getFlightBadge = (flight: Flight, index: number) => {
  if (index === 0) return { label: "Eng arzon", tone: "green" as const }
  if ((flight.stopsCount ?? 0) === 0 && flight.durationMin <= 300) {
    return { label: "To'g'ridan-to'g'ri", tone: "sky" as const }
  }
  const departureHour = Number(flight.depart.split(":")[0] ?? NaN)
  const arrivalHour = Number(flight.arrive.split(":")[0] ?? NaN)
  if (!Number.isNaN(departureHour) && departureHour < 12) {
    return { label: "Ertalab jo'naydi", tone: "blue" as const }
  }
  if (!Number.isNaN(arrivalHour) && arrivalHour >= 18) {
    return { label: "Kechqurun yetadi", tone: "violet" as const }
  }
  if ((flight.seatsAvailable ?? 99) <= 5) {
    return { label: `Oxirgi ${flight.seatsAvailable} o'rin`, tone: "rose" as const }
  }
  return null
}

const hasBaggage = (value?: string) => Boolean(value && value !== "—" && value.trim())

const formatAllowanceList = (values: Array<string | undefined | null>, fallback = "—") => {
  const cleaned = Array.from(
    new Set(
      values
        .map((value) => (value || "").trim())
        .filter((value) => value && value !== "—")
    )
  )
  return cleaned.length ? cleaned.join(" · ") : fallback
}

const isRefundableOption = (texts: string[]) =>
  /refund|refundable|return|cancel|exchange|flex|flexible|qaytar/i.test(
    texts.join(" ").toLowerCase()
  )

const matchDepartureBucket = (
  time: string,
  bucket: "all" | "morning" | "day" | "evening"
) => {
  if (bucket === "all") return true
  const [hoursRaw] = time.split(":")
  const hours = Number(hoursRaw)
  if (Number.isNaN(hours)) return true
  if (bucket === "morning") return hours < 12
  if (bucket === "day") return hours >= 12 && hours < 18
  return hours >= 18
}

const getSuggestedDepartureDate = () => {
  const base = new Date()
  base.setDate(base.getDate() + 14)
  const yyyy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, "0")
  const dd = String(base.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const DEFAULT_AUTO_SEARCH: SearchCriteria = {
  from: "TAS",
  to: "IST",
  date: getSuggestedDepartureDate(),
  pax: 1,
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

const resolveLocationCode = (value: string, options: LocationOption[]) => {
  const raw = value.trim()
  if (!raw) return ""

  const upper = raw.toUpperCase()
  const exactCode = options.find((option) => option.code === upper)
  if (exactCode) return exactCode.code

  const prefixCode = upper.match(/^([A-Z]{3})\b/)
  if (prefixCode) {
    const option = options.find((item) => item.code === prefixCode[1])
    if (option) return option.code
  }

  const normalized = normalizeText(raw)
  const exactName = options.find((option) => normalizeText(option.name) === normalized)
  if (exactName) return exactName.code

  const firstMatch = options.find((option) => option.searchText.includes(normalized))
  return firstMatch?.code ?? (upper.length <= 3 ? upper : "")
}

export default function Flights() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [pax, setPax] = useState(1)
  const [sort, setSort] = useState<"best" | "cheap" | "fast">("best")
  const [airlineFilter, setAirlineFilter] = useState("all")
  const [cabinFilter, setCabinFilter] = useState<"all" | "Economy" | "Business">("all")
  const [maxDuration, setMaxDuration] = useState<number | null>(null)
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null)
  const [departureFilter, setDepartureFilter] = useState<
    "all" | "morning" | "day" | "evening"
  >("all")
  const [onlyBaggage, setOnlyBaggage] = useState(false)
  const [onlyRefundable, setOnlyRefundable] = useState(false)

  const [items, setItems] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [lastInfo, setLastInfo] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Flight | null>(null)
  const [dynamicAirportLabels, setDynamicAirportLabels] = useState<Record<string, string>>(DEFAULT_AIRPORT_DIRECTORY)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const lastAutoQueryRef = useRef("")
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const hydratedRef = useRef(false)

  const airportLabels = useMemo(
    () => ({ ...DEFAULT_AIRPORT_DIRECTORY, ...dynamicAirportLabels }),
    [dynamicAirportLabels]
  )

  const locationOptions = useMemo(() => {
    const map = new Map<string, LocationOption>()

    for (const [code, name] of Object.entries(airportLabels)) {
      map.set(code, { code, name, searchText: normalizeText(`${code} ${name}`) })
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [airportLabels])

  const resolvedFrom = useMemo(() => resolveLocationCode(from, locationOptions), [from, locationOptions])
  const resolvedTo = useMemo(() => resolveLocationCode(to, locationOptions), [to, locationOptions])

  const formatAirport = useCallback(
    (code?: string) => {
      if (!code) return "Noma'lum"
      const upper = code.toUpperCase()
      const city = airportLabels[upper]
      return city ? `${city} (${upper})` : upper
    },
    [airportLabels]
  )

  const formatRoute = useCallback(
    (origin?: string, destination?: string) =>
      `${formatAirport(origin)} → ${formatAirport(destination)}`,
    [formatAirport]
  )

  const toFeaturedCards = useCallback(
    (flights: Flight[], criteria: SearchCriteria): FeaturedRouteCard[] =>
      flights.slice(0, 6).map((flight, index) => ({
        id: `${flight.id}-${index}`,
        flightId: flight.id,
        from: flight.from,
        to: flight.to,
        fromLabel: formatAirport(flight.from),
        toLabel: formatAirport(flight.to),
        date: criteria.date,
        pax: criteria.pax,
        airline: flight.airline,
        airlineName: flight.airlineName || flight.airline,
        depart: flight.depart,
        arrive: flight.arrive,
        durationMin: flight.durationMin,
        price: flight.price,
        currency: flight.currency,
        baggage: flight.baggage,
        carryOn: flight.carryOn,
        stopsCount: flight.stopsCount ?? 0,
        searchedAt: new Date().toISOString(),
      })),
    [formatAirport]
  )

  const mergeFeaturedCards = useCallback((nextCards: FeaturedRouteCard[]) => {
    let existing: FeaturedRouteCard[] = []

    try {
      const raw = localStorage.getItem(FEATURED_ROUTE_CARDS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as FeaturedRouteCard[]
        if (Array.isArray(parsed)) existing = parsed
      }
    } catch {
      existing = []
    }

    const merged = new Map<string, FeaturedRouteCard>()

    for (const item of [...existing, ...nextCards]) {
      const key = `${item.from}-${item.to}`
      const prev = merged.get(key)

      if (!prev) {
        merged.set(key, item)
        continue
      }

      if (item.price < prev.price) {
        merged.set(key, item)
        continue
      }

      const prevTime = new Date(prev.searchedAt || 0).getTime()
      const nextTime = new Date(item.searchedAt || 0).getTime()
      if (nextTime > prevTime) {
        merged.set(key, { ...prev, searchedAt: item.searchedAt })
      }
    }

    const result = Array.from(merged.values())
      .sort((a, b) => {
        const aTime = new Date(a.searchedAt || 0).getTime()
        const bTime = new Date(b.searchedAt || 0).getTime()
        return bTime - aTime || a.price - b.price
      })
      .slice(0, 120)

    localStorage.setItem(FEATURED_ROUTE_CARDS_KEY, JSON.stringify(result))
  }, [])

  const mapLocationLabels = useCallback((data?: SearchDataLike) => {
    const next: Record<string, string> = {}
    for (const city of data?.cities ?? []) next[city.code.toUpperCase()] = city.name
    for (const airport of data?.airports ?? []) next[airport.code.toUpperCase()] = airport.name
    return next
  }, [])

  const mapResponseToFlights = useCallback(
    (data: SearchDataLike | undefined, criteria: SearchCriteria) => {
      const options = data?.options ?? []
      const carriersMap = new Map(
        (data?.carriers ?? []).map((carrier) => [
          carrier.code?.toUpperCase(),
          {
            name: carrier.name,
            logo: toApiAsset(carrier.logo),
          },
        ])
      )
      const mapped: Flight[] = options.map((opt) => {
        const trip = opt.trips?.[0]
        const seg = trip?.segments?.[0]
        const family = opt.packages?.families?.[0]
        const carrierCode = (opt.carrier || seg?.carrier || "").toUpperCase()
        const carrierMeta = carriersMap.get(carrierCode)
        const segments = (trip?.segments ?? []).map((segment: any, index: number) => ({
          id: `${trip?.id || opt.id}-${index}`,
          origin: segment?.origin || trip?.origin || criteria.from,
          destination: segment?.destination || trip?.destination || criteria.to,
          departure: segment?.departure || "—",
          arrival: segment?.arrival || "—",
          departureTerminal: segment?.departureTerminal,
          arrivalTerminal: segment?.arrivalTerminal,
          baggage: segment?.baggage || "—",
          carryOn: segment?.carryOn || "—",
          bookingClass: segment?.bookingClass,
          serviceClass: segment?.serviceClass,
          carrier: segment?.carrier,
          operatingCarrier: segment?.operatingCarrier,
          duration: segment?.duration,
          layover: segment?.layover,
          equipment: segment?.equipment,
          fareBasis: segment?.fareBasis,
          flightNumber: segment?.flightNumber,
          seatsAvailable: segment?.seatsAvailable,
        }))
        const baggage = formatAllowanceList([
          ...segments.map((segment: any) => segment.baggage),
          ...(family?.baggageInfos ?? []),
        ])
        const carryOn = formatAllowanceList(segments.map((segment: any) => segment.carryOn))
        const familyServices = family?.services ?? []
        const services = familyServices
          .map((service: any) => {
            const text = `${service.type} ${service.description}`.toLowerCase()
            if (text.includes("wifi")) return "wifi" as const
            if (text.includes("meal") || text.includes("food")) return "meal" as const
            if (text.includes("priority")) return "priority" as const
            if (text.includes("support")) return "support" as const
            return null
          })
          .filter(Boolean) as Array<"wifi" | "meal" | "priority" | "support">
        const refundable = isRefundableOption([
          family?.name || "",
          ...familyServices.map((service: any) => `${service.type} ${service.description}`),
        ])
        const price =
          Number(opt.price || 0) ||
          Number(opt.passengerInfos?.reduce((sum: number, item: any) => sum + Number(item?.total || 0), 0) || 0)
        const primarySegment = segments[0]
        const lastSegment = segments[segments.length - 1]
        const flightNo = segments.length
          ? segments
              .map((segment: any) =>
                segment.flightNumber ? `${segment.carrier || segment.operatingCarrier || ""}-${segment.flightNumber}` : null
              )
              .filter(Boolean)
              .join(" · ")
          : "—"

        return {
          id: opt.id,
          from: trip?.origin || criteria.from,
          to: trip?.destination || criteria.to,
          airline: carrierCode || "—",
          airlineName: carrierMeta?.name || opt.carrier || seg?.carrier || "—",
          airlineLogo: carrierMeta?.logo,
          depart: toTime(primarySegment?.departure),
          arrive: toTime(lastSegment?.arrival),
          durationMin: trip?.duration || seg?.duration || 0,
          price,
          currency: opt.currency || data?.currency,
          baggage,
          cabin: seg?.serviceClass === "C" ? "Business" : "Economy",
          refundable: Boolean(opt.isRefundable ?? refundable),
          services,
          flightNo,
          carryOn,
          stopsCount: Math.max(0, Number(trip?.numberOfStops ?? (segments.length ? segments.length - 1 : 0))),
          seatsAvailable: Math.min(...segments.map((segment: any) => Number(segment.seatsAvailable || 99))),
          segments,
        }
      })

      return { mapped, labels: mapLocationLabels(data) }
    },
    [mapLocationLabels]
  )

  useEffect(() => {
    let qFrom = sp.get("from") ?? ""
    let qTo = sp.get("to") ?? ""
    let qDate = sp.get("date") ?? ""
    let qPax = Number(sp.get("pax") ?? "1")

    if (!qFrom || !qTo || !qDate) {
      try {
        const stored = localStorage.getItem(LAST_SUCCESSFUL_SEARCH_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<SearchCriteria>
          qFrom = parsed.from ?? qFrom
          qTo = parsed.to ?? qTo
          qDate = parsed.date ?? qDate
          qPax = Number(parsed.pax ?? qPax)
        }
      } catch {
        // ignore invalid localStorage
      }
    }

    if (!qFrom || !qTo || !qDate) {
      try {
        const stored = localStorage.getItem(FEATURED_ROUTE_CARDS_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as FeaturedRouteCard[]
          const latest = Array.isArray(parsed)
            ? [...parsed].sort((a, b) => {
                const aTime = new Date(a.searchedAt || 0).getTime()
                const bTime = new Date(b.searchedAt || 0).getTime()
                return bTime - aTime || a.price - b.price
              })[0]
            : undefined

          if (latest) {
            qFrom = latest.from
            qTo = latest.to
            qDate = latest.date
            qPax = Number(latest.pax ?? qPax)
          }
        }
      } catch {
        // ignore invalid localStorage
      }
    }

    if (!qFrom || !qTo || !qDate) {
      qFrom = DEFAULT_AUTO_SEARCH.from
      qTo = DEFAULT_AUTO_SEARCH.to
      qDate = DEFAULT_AUTO_SEARCH.date
      qPax = DEFAULT_AUTO_SEARCH.pax
    }

    const nextPax = !Number.isNaN(qPax) && qPax >= 1 ? qPax : 1

    setFrom(qFrom)
    setTo(qTo)
    setDate(qDate)
    setPax(nextPax)
    lastAutoQueryRef.current =
      qFrom && qTo && qDate
        ? JSON.stringify({ from: qFrom, to: qTo, date: qDate, pax: nextPax })
        : ""
    hydratedRef.current = true
  }, [sp])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AIRPORT_CACHE_KEY)
      if (!stored) {
        setDynamicAirportLabels(DEFAULT_AIRPORT_DIRECTORY)
        return
      }
      const parsed = JSON.parse(stored) as Record<string, string>
      setDynamicAirportLabels({ ...DEFAULT_AIRPORT_DIRECTORY, ...parsed })
    } catch {
      setDynamicAirportLabels(DEFAULT_AIRPORT_DIRECTORY)
    }
  }, [])

  const runSearch = useCallback(async (criteria: SearchCriteria, showAlert: boolean) => {
    const token =
      localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    const { from, to, date, pax } = criteria

    if (!token) {
      if (showAlert) toast.error("Avval login qiling.")
      return
    }
    if (!from || !to || !date) {
      if (showAlert) toast.error("Qayerdan, qayerga va sanani to'ldiring.")
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      if (showAlert) toast.error("Sana formati: YYYY-MM-DD")
      return
    }

    const queryKey = JSON.stringify(criteria)
    const cached = flightsCache.get(queryKey)
    if (cached) {
      setItems(cached.items)
      setLastInfo(cached.info)
      return
    }

    const requestId = ++requestIdRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    try {
      const res = await searchAir(
        {
          adults: pax,
          children: 0,
          infants: 0,
          class: "Y",
          trips: [{ origin: from, destination: to, departure: date }],
        },
        { signal: controller.signal }
      )

      if (requestId !== requestIdRef.current) return

      if (res.data.status !== "success" || !res.data.data?.options?.length) {
        setItems([])
        const msg = res.data.message || "Qidiruv xato"
        setLastInfo(`Backend: ${msg}`)
        if (showAlert) toast.error(msg)
        return
      }

      const { mapped, labels } = mapResponseToFlights(res.data.data, criteria)
      setDynamicAirportLabels((prev) => {
        const next = { ...prev, ...labels }
        localStorage.setItem(AIRPORT_CACHE_KEY, JSON.stringify(next))
        return next
      })

      const info = `Backend: ${res.data.message} · options=${res.data.data.options.length} · currency=${res.data.data.currency}`
      setItems(mapped)
      setLastInfo(info)
      flightsCache.set(queryKey, { items: mapped, info })
      localStorage.setItem(LAST_SUCCESSFUL_SEARCH_KEY, JSON.stringify(criteria))
      localStorage.setItem(
        LAST_AIR_RESULT_META_KEY,
        JSON.stringify({
          from: criteria.from,
          to: criteria.to,
          date: criteria.date,
          pax: criteria.pax,
          count: mapped.length,
          info,
          updatedAt: new Date().toISOString(),
        })
      )
      mergeFeaturedCards(toFeaturedCards(mapped, criteria))
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return
      const status = err?.response?.status
      const msg =
        status === 502
          ? "Backend vaqtincha javob bermayapti (502 Bad Gateway)."
          : err?.code === "ECONNABORTED"
            ? "Server juda sekin javob berdi. So'rov timeout bo'ldi."
            : err?.response?.data?.message || "Qidiruv xato"
      setItems([])
      setLastInfo(`Backend: ${msg}`)
      if (showAlert) toast.error(msg)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        abortRef.current = null
      }
    }
  }, [mapResponseToFlights, mergeFeaturedCards, toFeaturedCards])

  const onSearch = () => {
    const criteria = {
      from: resolvedFrom,
      to: resolvedTo,
      date: date.trim(),
      pax,
    }
    if (!criteria.from || !criteria.to) {
      toast.error("Jo'nash va manzil uchun to'g'ri variantni tanlang.")
      return
    }
    lastAutoQueryRef.current = JSON.stringify(criteria)
    navigate(
      `/flights?${new URLSearchParams({
        ...criteria,
        pax: String(criteria.pax),
      }).toString()}`,
      { replace: true }
    )
    void runSearch(criteria, true)
  }

  useEffect(() => {
    if (!hydratedRef.current || !from || !to || !date) return
    const criteria = {
      from: resolvedFrom,
      to: resolvedTo,
      date,
      pax,
    }
    if (!criteria.from || !criteria.to) return
    const queryKey = JSON.stringify(criteria)
    if (lastAutoQueryRef.current === queryKey) return
    lastAutoQueryRef.current = queryKey
    navigate(
      `/flights?${new URLSearchParams({
        from: criteria.from,
        to: criteria.to,
        date: criteria.date,
        pax: String(criteria.pax),
      }).toString()}`,
      { replace: true }
    )
    void runSearch(criteria, false)
  }, [date, from, navigate, pax, resolvedFrom, resolvedTo, runSearch, to])

  useEffect(() => () => abortRef.current?.abort(), [])

  const sourceItems = items

  const airlines = useMemo(
    () => ["all", ...Array.from(new Set(sourceItems.map((item) => item.airline).filter(Boolean)))],
    [sourceItems]
  )
  const maxPrice = useMemo(
    () => (sourceItems.length ? Math.max(...sourceItems.map((item) => item.price)) : 0),
    [sourceItems]
  )
  const maxTripDuration = useMemo(
    () => (sourceItems.length ? Math.max(...sourceItems.map((item) => item.durationMin)) : 0),
    [sourceItems]
  )
  const hasRefundableFlights = useMemo(
    () => sourceItems.some((flight) => flight.refundable),
    [sourceItems]
  )

  useEffect(() => {
    if (maxPrice) setMaxPriceFilter(maxPrice)
  }, [maxPrice])

  useEffect(() => {
    if (maxTripDuration) setMaxDuration(maxTripDuration)
  }, [maxTripDuration])

  const filtered = useMemo(() => {
    let list = sourceItems.filter((flight) => {
      if (resolvedFrom && flight.from.toUpperCase() !== resolvedFrom.toUpperCase()) return false
      if (resolvedTo && flight.to.toUpperCase() !== resolvedTo.toUpperCase()) return false
      if (airlineFilter !== "all" && flight.airline !== airlineFilter) return false
      if (cabinFilter !== "all" && flight.cabin !== cabinFilter) return false
      if (maxPriceFilter !== null && flight.price > maxPriceFilter) return false
      if (maxDuration !== null && flight.durationMin > maxDuration) return false
      if (!matchDepartureBucket(flight.depart, departureFilter)) return false
      if (onlyBaggage && !hasBaggage(flight.baggage)) return false
      if (onlyRefundable && !flight.refundable) return false
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
  }, [
    airlineFilter,
    cabinFilter,
    sourceItems,
    departureFilter,
    maxDuration,
    maxPriceFilter,
    onlyBaggage,
    onlyRefundable,
    resolvedFrom,
    resolvedTo,
    sort,
  ])

  const highlightCards = useMemo(() => {
    if (!filtered.length) return []
    const cheapest = [...filtered].sort((a, b) => a.price - b.price)[0]
    const fastest = [...filtered].sort((a, b) => a.durationMin - b.durationMin)[0]
    const best = [...filtered].sort(
      (a, b) => a.price * 0.7 + a.durationMin * 0.3 - (b.price * 0.7 + b.durationMin * 0.3)
    )[0]

    return [
      { key: "cheap", badge: "Eng arzon", tone: "blue" as const, flight: cheapest },
      { key: "best", badge: "Optimal", tone: "gold" as const, flight: best },
      { key: "fast", badge: "Eng tez", tone: "rose" as const, flight: fastest },
    ]
  }, [filtered])

  const onPick = (flight: Flight) => {
    setSelected(flight)
    setOpen(true)
  }

  const onBook = (flight: Flight) => {
    setOpen(false)
    const cart = bookingCart.get()
    bookingCart.set({
      ...cart,
      flightId: flight.id,
      route: formatRoute(flight.from, flight.to),
      date,
      pax,
      amount: flight.price,
      currency: flight.currency,
      airline: flight.airline,
      flightNo: flight.flightNo,
      cabin: flight.cabin,
      baggage: flight.baggage,
      carryOn: flight.carryOn,
      segments: flight.segments ?? cart.segments ?? [],
      passengers: cart.passengers ?? [],
    })
    navigate("/passengers")
  }

  const onSwapRoute = () => {
    setFrom(to)
    setTo(from)
  }

  const onClearSearch = () => {
    setFrom("")
    setTo("")
    setDate("")
    setItems([])
    setLastInfo(null)
    lastAutoQueryRef.current = ""
    localStorage.removeItem(LAST_SUCCESSFUL_SEARCH_KEY)
    localStorage.removeItem(LAST_AIR_RESULT_META_KEY)
    navigate("/flights", { replace: true })
  }

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f8_34%,#e7edf6_100%)] pt-20 text-[#1d2430] dark:bg-[linear-gradient(180deg,#0d1830_0%,#111e39_26%,#15254a_62%,#11203d_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(860px_340px_at_16%_0%,rgba(81,121,197,0.18),transparent_62%),radial-gradient(640px_280px_at_84%_4%,rgba(219,116,101,0.16),transparent_55%),radial-gradient(720px_320px_at_50%_28%,rgba(156,88,129,0.08),transparent_60%)] dark:bg-[radial-gradient(860px_340px_at_16%_0%,rgba(75,114,201,0.22),transparent_62%),radial-gradient(640px_280px_at_84%_4%,rgba(72,104,176,0.18),transparent_55%),radial-gradient(720px_320px_at_50%_28%,rgba(47,71,122,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-[1280px] px-4 py-10 sm:px-5 sm:py-12">
        <div className={`overflow-visible rounded-[36px] border p-4 shadow-[0_30px_90px_rgba(17,24,39,0.08)] backdrop-blur-md dark:shadow-[0_32px_90px_rgba(4,10,28,0.42)] md:p-6 ${softPanel}`}>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#fbfdff_0%,#f4f8ff_35%,#eef2fb_58%,#f7f1f5_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] dark:bg-[linear-gradient(135deg,rgba(16,31,60,0.96)_0%,rgba(19,35,67,0.92)_35%,rgba(22,42,79,0.94)_58%,rgba(24,44,82,0.98)_100%)] dark:shadow-[inset_0_1px_0_rgba(147,182,255,0.08)] md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f0] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6d87] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-[#d4e2fb]">
                <Sparkles size={14} />
                Premium route selection
              </div>
              <h1 className="mt-6 max-w-[680px] text-[34px] font-black leading-[1.02] tracking-[-0.04em] text-[#1d2430] dark:text-white md:text-[48px]">
                Reyslar ichidan
                <span className="bg-[linear-gradient(135deg,#243a7a_0%,#a44c72_45%,#e36b3a_100%)] bg-clip-text text-transparent"> eng qulay </span>
                tanlovni qiling
              </h1>
              <p className="mt-5 max-w-[600px] text-[15px] leading-8 text-[#627188] dark:text-[#d2e0f8] md:text-[16px]">
                Backenddan kelgan real reyslarni qidiring, solishtiring va bron qiling.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <InfoChip icon={CalendarDays} label="Sana" value={date || "Tanlanmagan"} />
                <InfoChip icon={Users} label="Yo'lovchi" value={`${pax} ta`} />
                <InfoChip
                  icon={PlaneTakeoff}
                  label="Yo'nalish"
                  value={resolvedFrom && resolvedTo ? formatRoute(resolvedFrom, resolvedTo) : "Yo'nalish kiriting"}
                />
              </div>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-[32px] border border-white/70 bg-[#dce7f2] shadow-[0_20px_60px_rgba(18,27,45,0.10)] dark:border-[#35507f] dark:bg-[rgba(18,33,62,0.86)] dark:shadow-[0_22px_60px_rgba(4,10,28,0.42)]">
              <img src={heroImage} alt="Premium flights" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.08)_0%,rgba(17,24,39,0.34)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <div className="rounded-[24px] border border-white/30 bg-[rgba(12,20,38,0.46)] p-5 text-white backdrop-blur-md">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/65">Curated journeys</div>
                  <div className="mt-2 text-2xl font-black">Aviakompaniyalar va qulay tariflar</div>
                  <p className="mt-2 text-sm leading-7 text-white/75">Search, compare, filter va booking oqimi backend bilan birga ishlashda davom etadi.</p>
                </div>
              </div>
            </div>
          </div>

            <div className={`mt-6 overflow-visible rounded-[32px] p-5 backdrop-blur-sm ${softPanel}`}>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_210px]">
              <AutocompleteField label="Qayerdan" value={from} placeholder="Masalan: TAS yoki London" options={locationOptions} onChange={setFrom} />
              <AutocompleteField label="Qayerga" value={to} placeholder="Masalan: IST yoki Frankfurt" options={locationOptions} onChange={setTo} />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCalendarOpen((prev) => !prev)}
                  className="flex h-full min-h-[56px] w-full flex-col justify-center rounded-[20px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] transition hover:border-[#cfd9e8] hover:bg-white dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.28)] dark:hover:bg-[rgba(28,46,84,0.94)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#9fb4d7]">Sana</div>
                  <div className="mt-2 text-[15px] font-semibold text-[#1d2430] dark:text-white">
                    {date || "Narxli kalendarni ochish"}
                  </div>
                </button>
                {calendarOpen ? (
                  <FareCalendarPicker
                    from={resolvedFrom}
                    to={resolvedTo}
                    pax={pax}
                    value={date}
                    onChange={(nextDate) => {
                      setDate(nextDate)
                      setCalendarOpen(false)
                    }}
                    onClose={() => setCalendarOpen(false)}
                  />
                ) : null}
              </div>
              <button onClick={onSearch} disabled={loading} className={`h-14 rounded-[18px] font-semibold uppercase tracking-[0.12em] transition disabled:opacity-60 ${luxuryBtn}`}>{loading ? "Qidirilmoqda..." : "Qidirish"}</button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#7f8ca0] dark:text-[#a9bddb]">* Shahar nomi yoki IATA kod yozsangiz, autocomplete ishlaydi. Sana blokida backenddan olinadigan minimal narxli kalendar ochiladi.</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onSwapRoute} disabled={!from && !to} className="h-10 rounded-full border border-[#dbe3ef] bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#627188] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(28,46,84,0.94)]">Swap</button>
                <button type="button" onClick={onClearSearch} disabled={!from && !to && !date && items.length === 0} className="h-10 rounded-full border border-[#dbe3ef] bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#627188] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(28,46,84,0.94)]">Clear</button>
                {(["best", "cheap", "fast"] as const).map((item) => <button key={item} onClick={() => setSort(item)} className={["h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition", sort === item ? luxuryBtn : "border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] text-[#627188] hover:bg-white dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(28,46,84,0.94)]"].join(" ")}>{item === "best" ? "Best" : item === "cheap" ? "Cheap" : "Fast"}</button>)}
              </div>
            </div>
            {lastInfo ? <div className="mt-3 text-xs text-[#627188] dark:text-[#c7d8f6]">{lastInfo}</div> : null}
          </div>
        </div>

        {highlightCards.length > 0 ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {highlightCards.map((card) => (
              <TopDealCard key={card.key} badge={card.badge} tone={card.tone} flight={card.flight} onPick={onPick} formatRoute={formatRoute} />
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className={`rounded-[30px] p-5 ${softPanel}`}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#627188] dark:text-[#d4e2fb]"><Filter size={15} />Filtrlar</div>
            <div className="mt-5 space-y-5">
              <FilterBlock title="Narx oralig'i">
                <input type="range" min={0} max={Math.max(maxPrice, 1)} value={maxPriceFilter ?? Math.max(maxPrice, 1)} onChange={(e) => setMaxPriceFilter(Number(e.target.value))} className="w-full accent-[#4f8bd6]" />
                <div className="mt-2 flex items-center justify-between text-xs text-[#627188]"><span>0</span><span>{formatMoney(maxPriceFilter ?? maxPrice, sourceItems[0]?.currency || "UZS")}</span></div>
              </FilterBlock>
              <FilterBlock title="Parvoz davomiyligi">
                <input type="range" min={0} max={Math.max(maxTripDuration, 60)} value={maxDuration ?? Math.max(maxTripDuration, 60)} onChange={(e) => setMaxDuration(Number(e.target.value))} className="w-full accent-[#4f8bd6]" />
                <div className="mt-2 text-xs text-[#627188]">{fmtDuration(maxDuration ?? maxTripDuration)}</div>
              </FilterBlock>
              <FilterBlock title="Jo'nash vaqti">
                <div className="grid grid-cols-2 gap-2">{[
                  { key: "all", label: "Barchasi" },
                  { key: "morning", label: "06:00 gacha" },
                  { key: "day", label: "12:00-18:00" },
                  { key: "evening", label: "18:00 dan keyin" },
                ].map((item) => <button key={item.key} type="button" onClick={() => setDepartureFilter(item.key as "all" | "morning" | "day" | "evening")} className={["rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] transition", departureFilter === item.key ? "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174]" : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff]"].join(" ")}>{item.label}</button>)}</div>
              </FilterBlock>
              <FilterBlock title="Qo'shimcha qulayliklar">
                <div className="space-y-3">
                  <ToggleButton active={onlyBaggage} onClick={() => setOnlyBaggage((prev) => !prev)} title="Bagaj bor" subtitle="Faqat bagajli tariflar" />
                  <ToggleButton active={onlyRefundable} disabled={!hasRefundableFlights} onClick={() => setOnlyRefundable((prev) => !prev)} title="Refundable" subtitle={hasRefundableFlights ? "Qaytarish mumkin bo'lgan tariflar" : "Backend hozir refundable tarif qaytarmadi"} />
                </div>
              </FilterBlock>
              <FilterBlock title="Kabina turi">
                <div className="space-y-2">{(["all", "Economy", "Business"] as const).map((item) => <button key={item} type="button" onClick={() => setCabinFilter(item)} className={["flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition", cabinFilter === item ? `${luxuryBtn} border-[#1a2231]/10` : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff]"].join(" ")}><span>{item === "all" ? "Barchasi" : item}</span><Ticket size={15} /></button>)}</div>
              </FilterBlock>
              <FilterBlock title="Aviakompaniya">
                <div className="space-y-2">{airlines.map((item) => <button key={item} type="button" onClick={() => setAirlineFilter(item)} className={["flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition", airlineFilter === item ? "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] text-[#234174]" : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff]"].join(" ")}><span className="truncate">{item === "all" ? "Barcha kompaniyalar" : item}</span><span className="text-xs uppercase">{item === "all" ? sourceItems.length : sourceItems.filter((flight) => flight.airline === item).length}</span></button>)}</div>
              </FilterBlock>
            </div>
          </aside>

          <div className="space-y-4">
            {!loading && sourceItems.length > 0 ? (
              <div className="rounded-[24px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 text-sm text-[#51627c] shadow-[0_12px_30px_rgba(17,24,39,0.05)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:text-[#d2e0f8] dark:shadow-[0_14px_32px_rgba(4,10,28,0.28)]">
                Hozir ro'yxatda <span className="font-black text-[#1d2430] dark:text-white">{filtered.length}</span> ta ko'rinayotgan reys bor.
                {" Bu natijalar sizning qidiruvingiz bo'yicha yangilandi."}
              </div>
            ) : null}
            {loading ? <InlineLoading /> : null}
            {!loading && filtered.length > 0 ? filtered.map((flight, index) => <FlightRowCard key={flight.id} flight={flight} index={index} onPick={onPick} formatRoute={formatRoute} />) : null}
            {!loading && filtered.length === 0 ? <div className="rounded-[28px] border border-[#dbe3ef] bg-white px-6 py-12 text-center text-[#627188] shadow-[0_18px_40px_rgba(17,24,39,0.06)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:text-[#d2e0f8] dark:shadow-[0_18px_40px_rgba(4,10,28,0.28)]">Hozircha reys topilmadi. Yo'nalish, sana va yo'lovchi sonini kiriting.</div> : null}
          </div>
        </div>
      </div>

      <FlightDetailsModal open={open} onClose={() => setOpen(false)} flight={selected} pax={pax} date={date} onBook={onBook} />
    </section>
  )
}

function AutocompleteField({ label, value, placeholder, options, onChange }: { label: string; value: string; placeholder: string; options: LocationOption[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const filteredOptions = useMemo(() => {
    const query = normalizeText(value)
    if (!query) return options.slice(0, 8)
    return options.filter((option) => option.searchText.includes(query)).slice(0, 8)
  }, [options, value])

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  const pickOption = (option: LocationOption) => {
    onChange(`${option.code} - ${option.name}`)
    setOpen(false)
    setActiveIndex(0)
  }

  return (
    <label className="relative rounded-[20px] border border-[#dbe3ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_20px_rgba(17,24,39,0.03)] transition hover:border-[#cfd9e8] hover:bg-white dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.28)] dark:hover:bg-[rgba(28,46,84,0.94)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7f97] dark:text-[#9fb4d7]">{label}</div>
      <input
        className="mt-2 w-full bg-transparent text-[15px] font-semibold text-[#1d2430] outline-none placeholder:text-[#93a0b4] dark:text-white dark:placeholder:text-[#8ea5cb]"
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!filteredOptions.length) return
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
            setActiveIndex((prev) => (prev + 1) % filteredOptions.length)
          }
          if (e.key === "ArrowUp") {
            e.preventDefault()
            setOpen(true)
            setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
          }
          if (e.key === "Enter" && open) {
            e.preventDefault()
            pickOption(filteredOptions[activeIndex] ?? filteredOptions[0])
          }
          if (e.key === "Escape") {
            setOpen(false)
          }
        }}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
      />
      {open && filteredOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[320px] overflow-y-auto rounded-[22px] border border-[#dbe3ef] bg-white shadow-[0_22px_55px_rgba(17,24,39,0.14)] dark:border-[#35507f] dark:bg-[linear-gradient(180deg,rgba(13,24,48,0.98)_0%,rgba(18,32,60,0.97)_100%)] dark:shadow-[0_22px_55px_rgba(4,10,28,0.42)]">
          {filteredOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onMouseEnter={() => setActiveIndex(filteredOptions.findIndex((item) => item.code === option.code))}
              onMouseDown={(e) => {
                e.preventDefault()
                pickOption(option)
              }}
              onClick={() => pickOption(option)}
              className={[
                "flex w-full items-center justify-between border-b border-[#eef3f8] px-4 py-3 text-left transition last:border-b-0",
                filteredOptions[activeIndex]?.code === option.code ? "bg-[#f8fbff] dark:bg-[rgba(28,46,84,0.94)]" : "hover:bg-[#f8fbff] dark:hover:bg-[rgba(28,46,84,0.94)]",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-semibold text-[#1d2430] dark:text-white">{option.name}</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-[#7f8ca0] dark:text-[#9fb4d7]">{option.code}</span>
              </span>
              <span className="rounded-full border border-[#dce7f3] bg-[#f7fbff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5a6f8d] dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-[#d4e2fb]">
                tanlash
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  )
}

function InfoChip({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,250,255,0.92)_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.05)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.24)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8ca0] dark:text-[#9fb4d7]"><Icon size={14} />{label}</div>
      <div className="mt-2 text-[15px] font-bold text-[#1d2430] dark:text-white">{value}</div>
    </div>
  )
}

function TopDealCard({ badge, tone, flight, onPick, formatRoute }: { badge: string; tone: "blue" | "gold" | "rose"; flight: Flight; onPick: (flight: Flight) => void; formatRoute: (origin?: string, destination?: string) => string }) {
  const toneStyles = {
    blue: "border-[#d8e6ff] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] dark:border-[#35507f] dark:bg-[linear-gradient(135deg,rgba(18,33,62,0.96)_0%,rgba(22,40,74,0.94)_100%)]",
    gold: "border-[#f3e2bf] bg-[linear-gradient(135deg,#fffaf0_0%,#fff4da_100%)] dark:border-[#5c5771] dark:bg-[linear-gradient(135deg,rgba(24,38,68,0.96)_0%,rgba(46,43,74,0.94)_100%)]",
    rose: "border-[#f0d9df] bg-[linear-gradient(135deg,#fff8fa_0%,#fff1f3_100%)] dark:border-[#5f4e73] dark:bg-[linear-gradient(135deg,rgba(25,37,68,0.96)_0%,rgba(56,40,76,0.94)_100%)]",
  } as const

  return (
    <div className={`rounded-[30px] border p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:shadow-[0_20px_50px_rgba(4,10,28,0.34)] ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6e84] dark:bg-[rgba(34,56,98,0.92)] dark:text-[#eef4ff]">{badge}</div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f8ca0] dark:text-[#9fb4d7]">{flight.airline}</div>
      </div>
      <div className="mt-4 text-xl font-black text-[#1d2430] dark:text-[#f4f8ff]">{formatRoute(flight.from, flight.to)}</div>
      <div className="mt-2 text-sm text-[#627188] dark:text-[#b8cceb]">{flight.depart} — {flight.arrive} · {fmtDuration(flight.durationMin)}</div>
      <div className="mt-4 text-2xl font-black text-[#1d2430] dark:text-white">{formatMoney(flight.price, flight.currency)}</div>
      <button type="button" onClick={() => onPick(flight)} className={`mt-4 h-11 w-full rounded-2xl text-sm font-semibold ${luxuryBtn}`}>Tarifni ko'rish</button>
    </div>
  )
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#dde5f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.04)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.9)_0%,rgba(16,31,60,0.92)_100%)] dark:shadow-[0_14px_28px_rgba(4,10,28,0.24)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#627188] dark:text-[#d4e2fb]">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function ToggleButton({ active, disabled = false, onClick, title, subtitle }: { active: boolean; disabled?: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={[
      "flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition",
      active ? `${luxuryBtn} border-[#1a2231]/10` : "border-[#dbe3ef] bg-white text-[#627188] hover:bg-[#f8fbff] dark:border-[#30476f] dark:bg-[rgba(20,35,66,0.84)] dark:text-[#d4e2fb] dark:hover:bg-[rgba(28,46,84,0.94)]",
      disabled ? "cursor-not-allowed opacity-55 hover:bg-white dark:hover:bg-[rgba(20,35,66,0.84)]" : "",
    ].join(" ")}>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className={`mt-1 text-xs ${active ? "text-white/70" : "text-[#8a97aa] dark:text-[#9fb4d7]"}`}>{subtitle}</div>
      </div>
      <div className={["relative h-7 w-12 rounded-full border transition", active ? "border-white/25 bg-white/15" : "border-[#d9e3ef] bg-[#f3f7fc] dark:border-[#35507f] dark:bg-[rgba(31,51,89,0.9)]"].join(" ")}>
        <span className={["absolute top-1 h-5 w-5 rounded-full transition", active ? "left-6 bg-white" : "left-1 bg-[#90a2bb] dark:bg-[#c9d8f4]"].join(" ")} />
      </div>
    </button>
  )
}

function FlightRowCard({ flight, index, onPick, formatRoute }: { flight: Flight; index: number; onPick: (flight: Flight) => void; formatRoute: (origin?: string, destination?: string) => string }) {
  const badge = getFlightBadge(flight, index)
  const firstSegment = flight.segments?.[0]
  const lastSegment = flight.segments?.[flight.segments.length - 1]
  const departureTerminal = firstSegment?.departureTerminal
  const arrivalTerminal = lastSegment?.arrivalTerminal
  const badgeTone =
    badge?.tone === "green"
      ? "bg-[#31b44b]"
      : badge?.tone === "blue"
        ? "bg-[#2f8cff]"
        : badge?.tone === "violet"
          ? "bg-[#4aa4d9]"
          : badge?.tone === "rose"
            ? "bg-[#ffedf1] text-[#ef476f]"
            : badge?.tone === "sky"
              ? "bg-[#e8f6ed] text-[#27a745]"
              : ""
  const isDirect = (flight.stopsCount ?? 0) === 0

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: index * 0.04 }} className="group overflow-hidden rounded-[34px] border border-[#dde4ee] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(17,24,39,0.10)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.92)_0%,rgba(16,31,60,0.96)_100%)] dark:shadow-[0_20px_50px_rgba(4,10,28,0.34)] dark:hover:shadow-[0_26px_58px_rgba(4,10,28,0.42)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {badge ? (
            <div className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${badgeTone || "bg-[#31b44b] text-white"}`}>
              {badge.label}
            </div>
          ) : null}
          <div className="mt-3 text-[20px] font-black tracking-[-0.03em] text-[#151c28] dark:text-white">
            {formatCompactPrice(flight.price, flight.currency)}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#445167] dark:text-[#d4e2fb]">
            <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 dark:bg-[rgba(31,51,89,0.88)]">{flight.baggage ? `${flight.baggage} bagaj` : "Bagaj yo'q"}</span>
            <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 dark:bg-[rgba(31,51,89,0.88)]">{flight.carryOn ? `Qo'l yuki ${flight.carryOn}` : "Qo'l yuki yo'q"}</span>
            {flight.seatsAvailable ? <span className="rounded-full bg-[#fff0f3] px-2.5 py-1 text-[#d94b64]">Yana {flight.seatsAvailable} ta joy</span> : null}
          </div>
        </div>
        <button type="button" onClick={() => onPick(flight)} className="shrink-0 rounded-2xl border border-[#e5ebf3] bg-[#f7f9fc] px-4 py-2 text-sm font-semibold text-[#1d2430] transition hover:bg-white dark:border-[#35507f] dark:bg-[rgba(22,40,74,0.84)] dark:text-white dark:hover:bg-[rgba(28,46,84,0.94)]">
          Ko'rish
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3">
          {flight.airlineLogo ? (
            <img src={flight.airlineLogo} alt={flight.airlineName || flight.airline} className="h-11 w-11 rounded-full border border-[#edf2f7] bg-white object-contain p-1.5" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4d9ce6] text-white">
              <Plane size={18} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[18px] font-black text-[#1d2430] dark:text-white">{flight.depart}</div>
            <div className="text-sm text-[#6a778d] dark:text-[#d4e2fb]">{flight.from}</div>
            {departureTerminal ? (
              <div className="mt-1 text-xs font-medium text-[#8a95a8] dark:text-[#9fb4d7]">Terminal {departureTerminal}</div>
            ) : null}
            <div className="text-sm text-[#8a95a8] dark:text-[#a9bddb]">{flight.airlineName || flight.airline}</div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-center gap-3 text-sm text-[#97a2b4] dark:text-[#9fb4d7]">
            <PlaneTakeoff size={15} />
            <span>{fmtDuration(flight.durationMin)} yo'lda, {isDirect ? "to'g'ridan-to'g'ri" : `${flight.stopsCount} ta transfer`}</span>
            <PlaneLanding size={15} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm font-bold text-[#1d67ff]">{flight.from}</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-[#dfe5ee]">
              <div className="absolute left-0 top-0 h-1.5 rounded-full bg-[linear-gradient(90deg,#dfe5ee_0%,#b7c4d8_45%,#dfe5ee_100%)]" style={{ width: "100%" }} />
              <PlaneTakeoff className="absolute -top-3 left-0 text-[#8d98a9]" size={15} />
              <PlaneLanding className="absolute -top-3 right-0 text-[#8d98a9]" size={15} />
            </div>
            <span className="text-sm font-bold text-[#1d67ff]">{flight.to}</span>
          </div>
          <div className="mt-3 text-sm text-[#627188] dark:text-[#d2e0f8]">{formatRoute(flight.from, flight.to)}</div>
        </div>

        <div className="text-right">
          <div className="text-[18px] font-black text-[#1d2430] dark:text-white">{flight.arrive}</div>
          <div className="text-sm text-[#6a778d] dark:text-[#d4e2fb]">{flight.to}</div>
          {arrivalTerminal ? (
            <div className="mt-1 text-xs font-medium text-[#8a95a8] dark:text-[#9fb4d7]">Terminal {arrivalTerminal}</div>
          ) : null}
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#f3f6fa] px-3 py-1 text-xs font-semibold text-[#5f6e84] dark:bg-[rgba(31,51,89,0.88)] dark:text-[#d4e2fb]">
            <Ticket size={13} />
            {flight.cabin ?? "Economy"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1f6] pt-4 dark:border-[#30476f]">
        <div className="flex flex-wrap gap-2 text-sm text-[#627188] dark:text-[#d4e2fb]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]"><Clock3 size={14} /> {fmtDuration(flight.durationMin)}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]"><Users size={14} /> {flight.refundable ? "Qaytarish mumkin" : "Qaytarilmaydi"}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]"><ArrowRight size={14} /> {flight.flightNo ?? "Reys mavjud"}</span>
          {firstSegment?.origin || lastSegment?.destination ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f8fb] px-3 py-1.5 dark:bg-[rgba(31,51,89,0.88)]">
              <Plane size={14} /> {(firstSegment?.origin || flight.from) + " → " + (lastSegment?.destination || flight.to)}
            </span>
          ) : null}
        </div>
        <button type="button" className={`h-12 rounded-2xl px-6 font-semibold transition ${luxuryBtn}`} onClick={() => onPick(flight)}>
          Tanlash
        </button>
      </div>
    </motion.div>
  )
}

function InlineLoading() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-[28px] border border-[#dbe3ef] bg-white px-6 py-6 shadow-[0_18px_45px_rgba(17,24,39,0.07)] dark:border-[#30476f] dark:bg-[linear-gradient(180deg,rgba(19,35,67,0.92)_0%,rgba(16,31,60,0.96)_100%)] dark:shadow-[0_18px_45px_rgba(4,10,28,0.34)]">
          <div className="space-y-4">
            <SkeletonLine className="h-6 w-[180px]" />
            <SkeletonLine className="h-12 w-full" />
            <div className="grid gap-3 xl:grid-cols-4">
              <SkeletonLine className="h-20 w-full" />
              <SkeletonLine className="h-20 w-full" />
              <SkeletonLine className="h-20 w-full" />
              <SkeletonLine className="h-20 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <motion.div className={`overflow-hidden rounded-full bg-[#e9eef5] dark:bg-[rgba(38,58,97,0.92)] ${className}`} initial={{ opacity: 0.5 }} animate={{ opacity: [0.45, 0.8, 0.45] }} transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}>
      <motion.div className="h-full w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }} />
    </motion.div>
  )
}

