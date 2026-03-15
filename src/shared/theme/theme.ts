export type SiteTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "tripzy_theme_v1"

export const getStoredTheme = (): SiteTheme => {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === "dark" ? "dark" : "light"
}

export const applyTheme = (theme: SiteTheme) => {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.body.classList.toggle("dark", theme === "dark")
  document.documentElement.dataset.theme = theme
  document.body.dataset.theme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  window.dispatchEvent(new CustomEvent("tripzy-theme-change", { detail: theme }))
}

export const setTheme = (theme: SiteTheme): SiteTheme => {
  applyTheme(theme)
  return theme
}

export const toggleTheme = (): SiteTheme => {
  const nextTheme: SiteTheme = getStoredTheme() === "dark" ? "light" : "dark"
  return setTheme(nextTheme)
}
