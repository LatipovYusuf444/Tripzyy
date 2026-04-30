import axios from "axios"
import { clearAccessToken } from "@/shared/auth/token"
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
  const token = isLoginRequest ? null : await ensureAccessToken()

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
    const originalConfig = error?.config
    if (
      error?.response?.status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      !String(originalConfig.url || "").includes("/auth/login")
    ) {
      originalConfig._retry = true
      clearAccessToken()
      return ensureAccessToken(true).then((token) => {
        if (!token) {
          window.dispatchEvent(new Event("tripzy-auth"))
          return Promise.reject(error)
        }

        originalConfig.headers = originalConfig.headers ?? {}
        originalConfig.headers["X-API-KEY"] = `Bearer ${token}`
        return client(originalConfig)
      })
    }

    if (error?.response?.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new Event("tripzy-auth"))
    }
    return Promise.reject(error)
  }
)

export default client
