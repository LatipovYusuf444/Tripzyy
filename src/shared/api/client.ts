import axios from "axios"
import { useAppLoading } from "@/shared/store/appLoading"

const apiKey = import.meta.env.VITE_API_KEY

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
  }
  if (apiKey) {
    config.headers["X-API-KEY"] = apiKey
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
