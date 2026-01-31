import type { Order } from "@/types/order";
import client from "../client";


export const getOrders = () =>
  client.get<Order[]>("/orders");

export const createOrder = (data: Partial<Order>) =>
  client.post<Order>("/orders", data);
