export const FEATURED_ROUTE_CARDS_KEY = "featured_route_cards_v1"

export type FeaturedRouteCard = {
  id: string
  flightId: string
  from: string
  to: string
  fromLabel: string
  toLabel: string
  date: string
  pax: number
  airline: string
  airlineName: string
  depart: string
  arrive: string
  durationMin: number
  price: number
  currency?: string
  baggage?: string
  carryOn?: string
  stopsCount: number
  searchedAt?: string
}
