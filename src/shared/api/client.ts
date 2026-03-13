import axios from "axios"
import { useAppLoading } from "@/shared/store/appLoading"

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://b2b.skyup.uz/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  useAppLoading.getState().start()
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers["X-API-KEY"] = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    useAppLoading.getState().stop()
    return response
  },
  (error) => {
    useAppLoading.getState().stop()
    return Promise.reject(error)
  }
)

export default client


// POST - https://b2b.skyup.uz/api/air/search/air/search 
// Search flights

// Request body:

//  {
//   "adults": 1,
//   "children": 10,
//   "infants": 0,
//   "class": "Y",
//   "trips": [
//     {
//       "origin": "LONDON",
//       "destination": "FRANSIYA",
//       "departure": "2025-08-30"
//     }
//   ]
// } 

// shularni tashasam boldimi
