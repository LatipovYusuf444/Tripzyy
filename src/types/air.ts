export interface Air {
  id: number;
  name: string;
  code: string;
  price: number;
  from: string;
  to: string;
  departureTime: string; // ISO date
  arrivalTime: string;   // ISO date
}

export type AirSearchPayload = {
  adults: number
  children: number
  infants: number
  class: "Y" | "C" | "F" | string
  trips: Array<{
    origin: string
    destination: string
    departure: string
  }>
}

export type AirSearchResponse = {
  status: "success" | "error"
  message: string
  data?: {
    currency: string
    options: Array<{
      id: string
      currency: string
      price: number
      carrier?: string
      trips: Array<{
        id: string
        origin: string
        destination: string
        duration?: number
        segments: Array<{
          arrival: string
          arrivalTerminal?: string
          baggage?: string
          carryOn?: string
          bookingClass?: string
          serviceClass?: string
          carrier?: string
          departure: string
          departureTerminal?: string
          destination: string
          layover?: number
          duration?: number
          equipment?: string
          fareBasis?: string
          flightNumber?: string
          notValidBefore?: string
          notValidAfter?: string
          origin: string
          operatingCarrier?: string
          seatsAvailable?: number
          status?: string
          legNumber?: number
        }>
      }>
      packages?: {
        currency?: string
        baseFare?: number
        combinations?: Array<{
          price: number
          familyIDs: string[]
        }>
        families?: Array<{
          id: string
          name: string
          services?: Array<{
            type: string
            description: string
            paymentType: string
          }>
          baggageInfos?: string[]
        }>
      }
    }>
  }
}

export type BrandedFaresPayload = {
  optionID: string
}

export type BrandedFaresResponse = {
  status: "success" | "error"
  message: string
  data?: {
    currency: string
    baseFare: number
    combinations: Array<{
      price: number
      familyIDs: string[]
    }>
    families: Array<{
      id: string
      name: string
      services?: Array<{
        type: string
        description: string
        paymentType: string
      }>
      baggageInfos?: string[]
    }>
  }
}

export type AirBookPayload = {
  optionID: string
  email: string
  countryCode: string
  phoneNumber: string
  passengers: Array<{
    type: "ADT" | "CHD" | "INF" | string
    firstName: string
    lastName: string
    gender: "M" | "F" | string
    dob: string
    countryCode: string
    documentType: number
    documentNumber: string
    documentIssued: string
    documentExpires: string
  }>
}

export type AirBookResponse = {
  status: "success" | "error"
  message: string
  data?: {
    orderID: number
  }
}
