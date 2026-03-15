import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type SiteLanguage = "uz" | "ru" | "en"

const STORAGE_KEY = "tripzy_language_v1"

type I18nContextValue = {
  language: SiteLanguage
  setLanguage: (next: SiteLanguage) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function getStoredLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "uz"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "uz" || stored === "ru" || stored === "en") return stored
  return "uz"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>(() => getStoredLanguage())

  const setLanguage = (next: SiteLanguage) => {
    setLanguageState(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next)
      window.dispatchEvent(new CustomEvent("tripzy-language-change", { detail: next }))
    }
  }

  useEffect(() => {
    const sync = () => setLanguageState(getStoredLanguage())
    window.addEventListener("storage", sync)
    window.addEventListener("tripzy-language-change", sync as EventListener)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("tripzy-language-change", sync as EventListener)
    }
  }, [])

  const value = useMemo(() => ({ language, setLanguage }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) {
    throw new Error("useI18n must be used inside LanguageProvider")
  }
  return value
}
