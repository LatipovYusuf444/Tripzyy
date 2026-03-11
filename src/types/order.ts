export interface Order {
  id: number;
  userId: number;
  airId: number;
  status: "pending" | "paid" | "cancelled";
  totalPrice: number;
  createdAt: string; // ISO date
}

export type OrderActionResponse = {
  status: "success" | "error";
  message: string;
}

export type OrderDetailsResponse = {
  status: "success" | "error"
  message: string
  data?: Array<{
    id: number
    clientId?: number
    client?: string
    currency?: string
    price?: number
    status?: string
    createdAt?: string
    updatedAt?: string
    issuedAt?: string
    services?: Array<{
      serviceId?: number
      type?: string
      currency?: string
      price?: number
      status?: string
      reservation?: {
        id?: string
        segments?: Array<{
          origin?: string
          destination?: string
          carrier?: string
          flightNumber?: string
          departure?: string
          arrival?: string
        }>
      }
    }>
  }>
}
