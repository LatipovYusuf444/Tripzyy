import axios from "axios"
import { clearAccessToken, getAccessToken } from "@/shared/auth/token"
import { ensureAccessToken } from "@/shared/auth/session"
import { useAppLoading } from "@/shared/store/appLoading"

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  },
})

client.interceptors.request.use(async (config) => {
  useAppLoading.getState().start()
  const isLoginRequest = String(config.url || "").includes("/auth/login")
  const token = isLoginRequest ? getAccessToken() : await ensureAccessToken()

  if (token) {
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
    if (error?.response?.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new Event("tripzy-auth"))
    }
    return Promise.reject(error)
  }
)

export default client
