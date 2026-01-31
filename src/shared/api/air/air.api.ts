import type { Air } from "@/types/air";
import client from "../client";


export const getAirs = () =>
  client.get<Air[]>("/air");

export const getAirById = (id: number) =>
  client.get<Air>(`/air/${id}`);
