import axios from "axios"
import { clearAccessToken, getAccessToken } from "@/shared/auth/token"
import { useAppLoading } from "@/shared/store/appLoading"

const apiKey = import.meta.env.VITE_API_KEY
const formatApiKey = (value: string) =>
  value.trim().toLowerCase().startsWith("bearer ") ? value.trim() : `Bearer ${value.trim()}`

const client = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  },
})

client.interceptors.request.use((config) => {
  useAppLoading.getState().start()
  const token = getAccessToken()
  if (token) {
    config.headers["X-API-KEY"] = `Bearer ${token}`
  } else if (apiKey) {
    config.headers["X-API-KEY"] = formatApiKey(apiKey)
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
    if (error?.response?.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new Event("tripzy-auth"))
    }
    return Promise.reject(error)
  }
)

export default client
