import axios from "axios"

import { getAccessToken, setAccessToken, setAuthUser } from "@/shared/auth/token"

let pendingTokenRequest: Promise<string | null> | null = null

const buildDisplayName = (email: string) => {
  const base = email.split("@")[0]?.trim() || "Tripzy User"
  const parts = base
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.length
    ? parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
    : "Tripzy User"
}

export const ensureAccessToken = async () => {
  const existingToken = getAccessToken()
  if (existingToken) return existingToken

  const email = import.meta.env.VITE_AUTH_EMAIL?.trim()
  const password = import.meta.env.VITE_AUTH_PASSWORD?.trim()

  if (!email || !password) return null

  if (!pendingTokenRequest) {
    pendingTokenRequest = axios
      .post(
        `${import.meta.env.VITE_API_URL || "/api"}/auth/login`,
        { email, password },
        {
          timeout: 15000,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      )
      .then((res) => {
        const token = res.data?.data?.token
        if (!token) return null

        setAccessToken(token)
        setAuthUser({ fullName: buildDisplayName(email), email })
        window.dispatchEvent(new Event("tripzy-auth"))
        return token
      })
      .catch(() => null)
      .finally(() => {
        pendingTokenRequest = null
      })
  }

  return pendingTokenRequest
}
