import type {
  Air,
  AirSearchPayload,
  AirSearchResponse,
  AirBookPayload,
  AirBookResponse,
  BrandedFaresPayload,
  BrandedFaresResponse,
  AirOptionRulesResponse,
  AirOptionFareFamiliesResponse,
  AirOptionDetailsResponse,
  AirPnrDetailsResponse,
} from "@/types/air"
import client from "../client"

export const getAirs = () => client.get<Air[]>("/air")

export const getAirById = (id: number) => client.get<Air>(`/air/${id}`)

export const searchAir = (data: AirSearchPayload) =>
  client.post<AirSearchResponse>("/air/search", data)

export const getBrandedFares = (data: BrandedFaresPayload) =>
  client.post<BrandedFaresResponse>("/air/branded-fares", data)

export const getAirOptionRules = (optionID: string) =>
  client.get<AirOptionRulesResponse>(`/air/options/${optionID}/rules`)

export const getAirOptionFareFamilies = (optionID: string) =>
  client.get<AirOptionFareFamiliesResponse>(`/air/options/${optionID}/fare-families`)

export const getAirOptionDetails = (optionID: string) =>
  client.get<AirOptionDetailsResponse>(`/air/options/${optionID}`)

export const getAirPnrDetails = (locator: string) =>
  client.get<AirPnrDetailsResponse>("/air/get-pnr", { params: { locator } })

export const bookAir = (data: AirBookPayload) =>
  client.post<AirBookResponse>("/air/book", data)
