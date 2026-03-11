import type { Order, OrderActionResponse } from "@/types/order";
import client from "../client";


export const getOrders = () =>
  client.get<Order[]>("/orders");

export const createOrder = (data: Partial<Order>) =>
  client.post<Order>("/orders", data);

export const cancelOrderService = (id: number) =>
  client.post<OrderActionResponse>("/orders/cancel-service", { id });

export const issueOrder = (id: number) =>
  client.post<OrderActionResponse>("/orders/issue", { id });

export const voidOrderService = (id: number) =>
  client.post<OrderActionResponse>("/orders/void-service", { id });
