export interface Order {
  id: number;
  userId: number;
  airId: number;
  status: "pending" | "paid" | "cancelled";
  totalPrice: number;
  createdAt: string; // ISO date
}
