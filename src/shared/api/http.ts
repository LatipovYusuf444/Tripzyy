import axios from "axios"

export const http = axios.create({
  // ✅ VITE_ bo‘lishi shart
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

/**
 * ✅ JWT token ishlatsang yoqasan:
 * backend: Authorization: Bearer <token> kutadi.
 * tokenni localStorage ga saqlaysan.
 */
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
