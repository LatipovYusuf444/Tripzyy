import axios from "axios"

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://b2b.skyup.uz/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers["X-API-KEY"] = `Bearer ${token}`
  }
  return config
})

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
