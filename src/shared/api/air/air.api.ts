import type {
  Air,
  AirSearchPayload,
  AirSearchResponse,
  AirBookPayload,
  AirBookResponse,
  BrandedFaresPayload,
  BrandedFaresResponse,
} from "@/types/air"
import client from "../client"

export const getAirs = () => client.get<Air[]>("/air")

export const getAirById = (id: number) => client.get<Air>(`/air/${id}`)

export const searchAir = (data: AirSearchPayload) =>
  client.post<AirSearchResponse>("/air/search", data)

export const getBrandedFares = (data: BrandedFaresPayload) =>
  client.post<BrandedFaresResponse>("/air/branded-fares", data)

export const bookAir = (data: AirBookPayload) =>
  client.post<AirBookResponse>("/air/book", data)
