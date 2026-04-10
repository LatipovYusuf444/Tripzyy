const ACCESS_TOKEN_KEY = "access_token"
const ACCESS_TOKEN_EXPIRES_AT_KEY = "access_token_expires_at"
const AUTH_USER_KEY = "auth_user"
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000

export type StoredAuthUser = {
  fullName: string
  email: string
}

const getStoredExpiry = () => {
  const rawValue = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
  if (!rawValue) return null

  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}

export const setAccessToken = (
  token: string,
  expiresAt: number = Date.now() + FIFTEEN_DAYS_MS
) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt))
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}

export const setAuthUser = (user: StoredAuthUser) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const getAuthUser = (): StoredAuthUser | null => {
  const rawValue = localStorage.getItem(AUTH_USER_KEY)
  if (!rawValue) return null

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<StoredAuthUser>
    if (
      typeof parsedValue.fullName === "string" &&
      typeof parsedValue.email === "string"
    ) {
      return {
        fullName: parsedValue.fullName,
        email: parsedValue.email,
      }
    }
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
  }

  return null
}

export const getAccessToken = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) return null

  const expiresAt = getStoredExpiry()
  if (expiresAt && Date.now() > expiresAt) {
    clearAccessToken()
    return null
  }

  return token
}
