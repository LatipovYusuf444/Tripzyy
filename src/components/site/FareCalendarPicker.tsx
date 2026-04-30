import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import { searchAir } from "@/shared/api/air/air.api"
import { ensureAccessToken } from "@/shared/auth/session"
import { useI18n } from "@/shared/i18n/i18n"

type FareCalendarPickerProps = {
  from: string
  to: string
  pax: number
  classCode?: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
  anchorElement?: HTMLElement | null
  anchorRect?: { top: number; left: number; width: number; height: number } | null
  forceMobile?: boolean
}

type PriceMap = Record<string, number | null>

const cache = new Map<string, PriceMap>()
const calendarLocale = {
  uz: {
    weekdayLabels: ["DU", "SE", "CH", "PA", "JU", "SH", "YA"],
    monthNames: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
    close: "Yopish",
    select: "Tanlash",
    routePlaceholder: "Yo'nalishni tanlang",
    routeHint: "Avval yo'nalishni tanlang, keyin sana bo'yicha real narxlar chiqadi.",
    loading: "Narxlar backenddan yuklanmoqda...",
    minPrice: "Eng past ko'rinayotgan narx",
    noPrice: "Bu oylar uchun narx topilmadi.",
    closeAria: "Kalendarni yopish",
  },
  ru: {
    weekdayLabels: ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"],
    monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    close: "Закрыть",
    select: "Выбрать",
    routePlaceholder: "Выберите направление",
    routeHint: "Сначала выберите направление, затем появятся реальные цены по датам.",
    loading: "Цены загружаются с backend...",
    minPrice: "Минимальная видимая цена",
    noPrice: "На эти месяцы цены не найдены.",
    closeAria: "Закрыть календарь",
  },
  en: {
    weekdayLabels: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    close: "Close",
    select: "Select",
    routePlaceholder: "Choose route",
    routeHint: "Choose a route first, then real date prices will appear.",
    loading: "Loading prices from backend...",
    minPrice: "Lowest visible price",
    noPrice: "No prices found for these months.",
    closeAria: "Close calendar",
  },
} as const

const toISODate = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const parseISODate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const getMonthDays = (monthDate: Date) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = []

  for (let i = 0; i < startOffset; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

const millionPrice = (price?: number | null) => {
  if (!price) return ""
  return `${(price / 1_000_000).toFixed(2).replace(".", ",")} mln`
}

const compactPrice = (price?: number | null) => {
  if (!price) return ""
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2).replace(".", ",")} mln`
  if (price >= 1_000) return `${Math.round(price / 1_000)} ming`
  return String(price)
}

const getViewportWidth = () => {
  if (typeof window === "undefined") return 0
  return Math.min(
    window.innerWidth,
    window.visualViewport?.width ?? window.innerWidth,
    document.documentElement.clientWidth || window.innerWidth
  )
}

const getIsTouchViewport = () => {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(pointer: coarse)")?.matches ||
    window.matchMedia?.("(hover: none)")?.matches ||
    navigator.maxTouchPoints > 0
  )
}

export default function FareCalendarPicker({
  from,
  to,
  pax,
  classCode = "Y",
  value,
  onChange,
  onClose,
  anchorElement = null,
  anchorRect = null,
  forceMobile = false,
}: FareCalendarPickerProps) {
  const { language } = useI18n()
  const copy = calendarLocale[language]
  const today = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => toISODate(today), [today])
  const currentMonthStart = useMemo(() => getMonthStart(today), [today])
  const [startMonth, setStartMonth] = useState(() => {
    const selectedDate = value ? parseISODate(value) : null
    const base = selectedDate && selectedDate >= currentMonthStart ? selectedDate : today
    return getMonthStart(base)
  })
  const [prices, setPrices] = useState<PriceMap>({})
  const [loading, setLoading] = useState(false)
  const [liveAnchorRect, setLiveAnchorRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(anchorRect)
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth)
  const [isTouchViewport, setIsTouchViewport] = useState(getIsTouchViewport)
  const isDesktopViewport = !forceMobile && viewportWidth >= 1024 && !isTouchViewport

  const visibleMonths = useMemo(
    () => [startMonth, new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1)],
    [startMonth]
  )
  const mobileVisibleMonths = useMemo(() => [startMonth], [startMonth])

  const allVisibleDates = useMemo(
    () =>
      visibleMonths.flatMap((monthDate) =>
        getMonthDays(monthDate).filter(Boolean).map((item) => toISODate(item as Date))
      ),
    [visibleMonths]
  )

  useEffect(() => {
    if (!from || !to) return

    const key = `${from}-${to}-${pax}-${classCode}-${visibleMonths.map((item) => `${item.getFullYear()}-${item.getMonth()}`).join("|")}`
    const cached = cache.get(key)
    if (cached) {
      setPrices(cached)
      return
    }

    let alive = true
    setLoading(true)

    ensureAccessToken()
      .then((token) => {
        if (!token) return []

        return Promise.allSettled(
          allVisibleDates.map((departure) =>
            searchAir({
              adults: Math.max(1, pax),
              children: 0,
              infants: 0,
              class: classCode,
              trips: [{ origin: from, destination: to, departure }],
            })
          )
        )
      })
      .then((results) => {
        if (!alive) return
        const next: PriceMap = {}

        results.forEach((result, index) => {
          const departure = allVisibleDates[index]
          if (result.status !== "fulfilled") {
            next[departure] = null
            return
          }

          const payload = result.value.data
          if (payload.status !== "success") {
            next[departure] = null
            return
          }

          next[departure] = payload.data?.minPrice ?? payload.data?.options?.[0]?.price ?? null
        })

        cache.set(key, next)
        setPrices(next)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [allVisibleDates, classCode, from, pax, to, visibleMonths])

  useEffect(() => {
    if (typeof document === "undefined") return undefined

    const originalOverflow = document.body.style.overflow
    if (!isDesktopViewport) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isDesktopViewport])

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const updateViewportMetrics = () => {
      setViewportWidth(getViewportWidth())
      setIsTouchViewport(getIsTouchViewport())
    }

    updateViewportMetrics()
    window.addEventListener("resize", updateViewportMetrics)
    window.visualViewport?.addEventListener("resize", updateViewportMetrics)
    window.visualViewport?.addEventListener("scroll", updateViewportMetrics)

    return () => {
      window.removeEventListener("resize", updateViewportMetrics)
      window.visualViewport?.removeEventListener("resize", updateViewportMetrics)
      window.visualViewport?.removeEventListener("scroll", updateViewportMetrics)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !isDesktopViewport) {
      setLiveAnchorRect(anchorRect)
      return undefined
    }

    const updateAnchorRect = () => {
      if (anchorElement) {
        const nextRect = anchorElement.getBoundingClientRect()
        setLiveAnchorRect({
          top: nextRect.top,
          left: nextRect.left,
          width: nextRect.width,
          height: nextRect.height,
        })
        return
      }

      setLiveAnchorRect(anchorRect)
    }

    updateAnchorRect()
    window.addEventListener("resize", updateAnchorRect)
    window.addEventListener("scroll", updateAnchorRect, true)

    return () => {
      window.removeEventListener("resize", updateAnchorRect)
      window.removeEventListener("scroll", updateAnchorRect, true)
    }
  }, [anchorElement, anchorRect, isDesktopViewport])

  const minVisiblePrice = useMemo(() => {
    const values = Object.values(prices).filter((item): item is number => typeof item === "number")
    return values.length ? Math.min(...values) : null
  }, [prices])

  const resolvedAnchorRect = liveAnchorRect ?? anchorRect
  const canGoToPreviousMonth = startMonth > currentMonthStart

  const panelContent = (
      <div className="pointer-events-auto fixed inset-x-3 bottom-2 z-[120] max-h-[min(440px,calc(100svh-16px))] overflow-hidden rounded-[18px] border border-[#d6d6d6] bg-[#EBEBEB] p-1.5 shadow-[0_22px_56px_rgba(17,24,39,0.18)]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#c8cdd6]" />

        <div className="flex max-h-[min(400px,calc(100svh-56px))] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[#d0d5de] pb-2">
            <div className="flex min-w-0 items-center gap-2 rounded-[10px] border border-[#d6d6d6] bg-white px-2.5 py-1 text-[11px] font-normal text-[#52627b]">
              <CalendarDays size={15} className="shrink-0 text-[#1E7BFF]" />
              <span className="truncate">{from && to ? `${from} → ${to}` : copy.routePlaceholder}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden h-9 rounded-full border border-[#dbe3ef] bg-white px-4 text-[13px] font-normal text-[#627188] transition hover:bg-[#f8fbff]"
            >
              {copy.close}
            </button>
          </div>

          {!from || !to ? (
            <div className="mt-2.5 rounded-[14px] border border-[#d6d6d6] bg-white px-3 py-5 text-center text-[12px] leading-5 text-[#627188]">
              {copy.routeHint}
            </div>
          ) : (
            <>
              <div className="mt-2 overflow-y-auto pr-0.5">
                <div className="grid grid-cols-1 gap-2">
                  {mobileVisibleMonths.map((monthDate, monthIndex) => {
                    const cells = getMonthDays(monthDate)

                    return (
                      <div
                        key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                        className="block"
                      >
                        <div className="rounded-[12px] border border-[#d6d6d6] bg-white p-1.5">
                          <div className="mb-1 flex items-center justify-between">
                            {monthIndex === 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!canGoToPreviousMonth) return
                                  setStartMonth(
                                    new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1)
                                  )
                                }}
                                disabled={!canGoToPreviousMonth}
                                className="grid h-6 w-6 place-items-center rounded-full border border-[#d6d6d6] bg-[#EBEBEB] text-[#6f7f97] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <ChevronLeft size={12} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setStartMonth(
                                    new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1)
                                  )
                                }
                                className="grid h-6 w-6 place-items-center rounded-full border border-[#d6d6d6] bg-[#EBEBEB] text-[#6f7f97] transition hover:bg-white lg:hidden"
                              >
                                <ChevronRight size={12} />
                              </button>
                            )}

                            <div className="text-center">
                              <div className="text-[11px] font-normal text-[#1295dd]">
                                {copy.monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
                              </div>
                            </div>

                            {monthIndex === 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setStartMonth(
                                    new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1)
                                  )
                                }
                                className="grid h-6 w-6 place-items-center rounded-full border border-[#d6d6d6] bg-[#EBEBEB] text-[#6f7f97] transition hover:bg-white"
                              >
                                <ChevronRight size={12} />
                              </button>
                            ) : (
                              <div className="h-6 w-6" />
                            )}
                          </div>

                          <div className="grid grid-cols-7 gap-x-0.5 gap-y-0.5 text-center text-[#7b8aa0]">
                            {copy.weekdayLabels.map((label, labelIndex) => (
                              <div
                                key={label}
                                className={[
                                  "py-0.5 text-[8px] font-normal uppercase tracking-[0.02em]",
                                  labelIndex >= 5 ? "text-[#95a4bb]" : "text-[#243042]",
                                ].join(" ")}
                              >
                                {label}
                              </div>
                            ))}

                            {cells.map((cell, index) => {
                              if (!cell) {
                                  return <div key={`empty-${index}`} className="h-[28px]" />
                              }

                              const iso = toISODate(cell)
                              const price = prices[iso]
                              const isSelected = value === iso
                              const isToday = iso === todayIso
                              const weekDay = (cell.getDay() + 6) % 7
                              const weekend = weekDay >= 5

                              return (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => onChange(iso)}
                                  className={[
                                    "flex min-h-[42px] w-full min-w-0 flex-col items-center justify-center rounded-[6px] border px-0.5 py-1 text-center transition",
                                    isSelected
                                      ? "border-[#1f6fff] bg-[linear-gradient(180deg,#2f7dff_0%,#1e6df0_100%)] text-white shadow-[0_6px_16px_rgba(34,104,230,0.22)]"
                                      : "border-[#d6d6d6] bg-white text-[#1d2430] hover:border-[#c8d4e8] hover:bg-[#f5f5f5]",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "text-[10px] font-normal leading-none",
                                      isToday && !isSelected ? "rounded-full bg-[#e9f2ff] px-1.5 py-1 text-[#1f6fff]" : "",
                                      !isSelected && weekend ? "text-[#95a4bb]" : "",
                                    ].join(" ")}
                                  >
                                    {cell.getDate()}
                                  </span>
                                  <span
                                    className={[
                                      "mt-0.5 line-clamp-1 max-w-full px-0.5 text-[7px] font-normal leading-3",
                                      isSelected
                                        ? "text-white/95"
                                        : typeof price === "number"
                                          ? "text-[#2cab4d]"
                                          : "text-[#bcc6d3]",
                                    ].join(" ")}
                                  >
                                    {typeof price === "number" ? compactPrice(price) : loading ? "..." : "—"}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#d0d5de] pt-2">
                <div className="text-[10px] leading-4 text-[#627188]">
                  {loading
                    ? copy.loading
                    : minVisiblePrice
                      ? `${copy.minPrice}: ${millionPrice(minVisiblePrice)} UZS`
                      : copy.noPrice}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 rounded-full border border-[#d6d6d6] bg-white px-3 text-[11px] font-normal text-[#627188] transition hover:bg-[#f5f5f5]"
                  >
                    {copy.close}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 rounded-full bg-[linear-gradient(135deg,#12a4ef_0%,#0593dc_100%)] px-4 text-[11px] font-normal text-white shadow-[0_8px_20px_rgba(15,154,231,0.24)] transition hover:brightness-105"
                  >
                    {copy.select}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  )

  const isDesktopPortal =
    isDesktopViewport &&
    resolvedAnchorRect

  if (isDesktopPortal && typeof document !== "undefined") {
    const panelWidth = Math.min(620, viewportWidth - 72)
    const left = Math.min(
      Math.max(24, resolvedAnchorRect.left + resolvedAnchorRect.width / 2 - panelWidth / 2),
      viewportWidth - panelWidth - 24
    )
    const top = resolvedAnchorRect.top + resolvedAnchorRect.height + 10

    return createPortal(
      <>
        <button
          type="button"
          aria-label={copy.closeAria}
          onClick={onClose}
          className="fixed inset-0 z-[159] bg-transparent"
        />
        <div
          className="pointer-events-auto fixed z-[160] overflow-hidden rounded-[20px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(247,250,255,0.98)_100%)] p-2.5 shadow-[0_20px_56px_rgba(17,24,39,0.16)] backdrop-blur-xl"
          style={{ top, left, width: panelWidth, maxHeight: "min(620px, calc(100vh - 32px))" }}
        >
          <div className="flex max-h-[min(590px,calc(100vh-72px))] flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#e7edf5] pb-2">
              <div className="flex min-w-0 items-center gap-2 rounded-[12px] border border-[#dde6f1] bg-white/90 px-2.5 py-1.5 text-[12px] font-normal text-[#52627b] shadow-[0_6px_14px_rgba(17,24,39,0.05)]">
                <CalendarDays size={15} className="shrink-0 text-[#1E7BFF]" />
                <span className="truncate">{from && to ? `${from} → ${to}` : copy.routePlaceholder}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 items-center rounded-full border border-[#dbe3ef] bg-white px-3.5 text-[12px] font-normal text-[#627188] transition hover:bg-[#f8fbff]"
              >
                {copy.close}
              </button>
            </div>
            {!from || !to ? (
              <div className="mt-4 rounded-[20px] border border-[#e2e8f1] bg-white px-5 py-8 text-center text-sm text-[#627188]">
                {copy.routeHint}
              </div>
            ) : (
              <div className="mt-2.5 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2.5">
                  {visibleMonths.map((monthDate, monthIndex) => {
                    const cells = getMonthDays(monthDate)

                    return (
                      <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
                        <div className="rounded-[15px] border border-[#e4ebf4] bg-white/95 p-2.5 shadow-[0_10px_22px_rgba(17,24,39,0.045)]">
                          <div className="mb-1.5 flex items-center justify-between">
                            {monthIndex === 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!canGoToPreviousMonth) return
                                  setStartMonth(
                                    new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1)
                                  )
                                }}
                                disabled={!canGoToPreviousMonth}
                                className="grid h-7 w-7 place-items-center rounded-full border border-[#e2e9f2] bg-[#f8fbff] text-[#6f7f97] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <ChevronLeft size={14} />
                              </button>
                            ) : (
                              <div className="h-7 w-7" />
                            )}

                            <div className="text-center">
                              <div className="text-[13px] font-normal text-[#1295dd]">
                                {copy.monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
                              </div>
                            </div>

                            {monthIndex === 1 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setStartMonth(
                                    new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1)
                                  )
                                }
                                className="grid h-7 w-7 place-items-center rounded-full border border-[#e2e9f2] bg-[#f8fbff] text-[#6f7f97] transition hover:bg-white"
                              >
                                <ChevronRight size={14} />
                              </button>
                            ) : (
                              <div className="h-7 w-7" />
                            )}
                          </div>

                          <div className="grid grid-cols-7 gap-x-0.5 gap-y-1 text-center text-[#7b8aa0]">
                            {copy.weekdayLabels.map((label, labelIndex) => (
                              <div
                                key={label}
                                className={[
                                  "py-0.5 text-[9px] font-normal uppercase tracking-[0.02em]",
                                  labelIndex >= 5 ? "text-[#95a4bb]" : "text-[#243042]",
                                ].join(" ")}
                              >
                                {label}
                              </div>
                            ))}

                            {cells.map((cell, index) => {
                              if (!cell) {
                                return <div key={`empty-${index}`} className="h-[38px]" />
                              }

                              const iso = toISODate(cell)
                              const price = prices[iso]
                              const isSelected = value === iso
                              const isToday = iso === todayIso
                              const weekend = cell.getDay() === 0 || cell.getDay() === 6

                              return (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => onChange(iso)}
                                  className={[
                                    "flex h-[38px] w-full min-w-0 flex-col items-center justify-center rounded-[8px] border px-0.5 text-center transition",
                                    isSelected
                                      ? "border-[#1f6fff] bg-[linear-gradient(180deg,#2f7dff_0%,#1e6df0_100%)] text-white shadow-[0_14px_34px_rgba(34,104,230,0.22)]"
                                      : "border-[#eef2f7] bg-[linear-gradient(180deg,#fcfdff_0%,#f6f9fd_100%)] text-[#1d2430] hover:border-[#dce6f3] hover:bg-white",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "text-[12px] font-normal leading-none",
                                      isToday && !isSelected ? "rounded-full bg-[#e9f2ff] px-1.5 py-1 text-[#1f6fff]" : "",
                                      !isSelected && weekend ? "text-[#95a4bb]" : "",
                                    ].join(" ")}
                                  >
                                    {cell.getDate()}
                                  </span>
                                  <span
                                    className={[
                                      "mt-0.5 line-clamp-1 px-0.5 text-[6.5px] font-normal leading-3",
                                      isSelected ? "text-white/95" : "text-[#7d8ca3]",
                                    ].join(" ")}
                                  >
                                    {loading ? "..." : compactPrice(price)}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-[#e7edf5] pt-2.5">
              <div className="text-[11px] text-[#627188]">
                {loading
                  ? copy.loading
                  : minVisiblePrice
                    ? `${copy.minPrice}: ${millionPrice(minVisiblePrice)}`
                    : copy.noPrice}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-full bg-[linear-gradient(180deg,#2f7dff_0%,#1e6df0_100%)] px-4 text-[11px] font-normal uppercase tracking-[0.08em] text-white shadow-[0_10px_20px_rgba(34,104,230,0.2)]"
              >
                {copy.select}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    )
  }

  return typeof document !== "undefined"
    ? createPortal(
        <>
          <button
            type="button"
            aria-label={copy.closeAria}
            onClick={onClose}
            className="fixed inset-0 z-[118] bg-[rgba(15,23,42,0.22)] backdrop-blur-[2px] lg:hidden"
          />

          {panelContent}
        </>,
        document.body
      )
    : null
}
