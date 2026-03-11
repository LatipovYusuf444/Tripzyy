// src/shared/store/bookingCart.ts

export type PayerInfo = {
  email: string
  phone: string
  countryCode?: string
}

export type Passenger = {
  id: string
  firstName: string
  lastName: string
  birthDate: string // YYYY-MM-DD
  citizenship: string

  // ✅ qo‘shildi
  passportNo: string
  passportExpiry: string // YYYY-MM-DD
  passportIssued?: string // YYYY-MM-DD
  gender?: "M" | "F"
  countryCode?: string
}

export type BookingCart = {
  flightId?: string
  route?: string // "TAS → IST"
  date?: string
  pax?: number
  lastOrderId?: number
  history?: Array<{
    orderId: number
    route?: string
    date?: string
    createdAt: string
  }>

  // ✅ qo‘shildi
  payer?: PayerInfo

  passengers: Passenger[]
}

const KEY = "tripzy_booking_cart_v2"

function emit() {
  window.dispatchEvent(new Event("booking_cart_changed"))
}

export const bookingCart = {
  get(): BookingCart {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return { passengers: [] }

      const parsed = JSON.parse(raw) as Partial<BookingCart>

      return {
        flightId: parsed.flightId,
        route: parsed.route,
        date: parsed.date,
        pax: parsed.pax,
        lastOrderId: parsed.lastOrderId,
        history: Array.isArray(parsed.history) ? parsed.history : [],
        payer: parsed.payer,
        passengers: Array.isArray(parsed.passengers) ? parsed.passengers : [],
      }
    } catch {
      return { passengers: [] }
    }
  },

  set(next: BookingCart) {
    localStorage.setItem(KEY, JSON.stringify(next))
    emit()
  },

  patch(partial: Partial<BookingCart>) {
    const curr = bookingCart.get()
    bookingCart.set({ ...curr, ...partial })
  },

  clear() {
    localStorage.removeItem(KEY)
    emit()
  },

  upsertPassenger(p: Passenger) {
    const cart = bookingCart.get()
    const idx = cart.passengers.findIndex((x) => x.id === p.id)

    const passengers =
      idx >= 0
        ? cart.passengers.map((x) => (x.id === p.id ? p : x))
        : [p, ...cart.passengers]

    bookingCart.set({ ...cart, passengers })
  },

  removePassenger(id: string) {
    const cart = bookingCart.get()
    bookingCart.set({ ...cart, passengers: cart.passengers.filter((x) => x.id !== id) })
  },
}

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}
