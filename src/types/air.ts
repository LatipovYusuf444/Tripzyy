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
