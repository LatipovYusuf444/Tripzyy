import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import FlightDetailsModal, { type Flight } from "@/components/site/FlightDetailsModal"

const PICK_KEY = "tripzyy_flight_pick"

export default function FlightDetailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pax = Math.max(1, Number(params.get("pax") ?? 1))
  const date = params.get("date") ?? ""

  const [flight, setFlight] = useState<Flight | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(PICK_KEY)
    if (!raw) {
      navigate("/flights", { replace: true })
      return
    }
    try {
      setFlight(JSON.parse(raw) as Flight)
    } catch {
      navigate("/flights", { replace: true })
    }
  }, [navigate])

  if (!flight) return null

  return (
    <FlightDetailsModal
      open={true}
      onClose={() => navigate(-1)}
      flight={flight}
      pax={pax}
      date={date}
      pageMode
    />
  )
}
