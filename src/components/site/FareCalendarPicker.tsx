import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import { searchAir } from "@/shared/api/air/air.api"
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
}: FareCalendarPickerProps) {
  const { language } = useI18n()
  const copy = calendarLocale[language]
  const [startMonth, setStartMonth] = useState(() => {
    const base = value ? new Date(value) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [prices, setPrices] = useState<PriceMap>({})
  const [loading, setLoading] = useState(false)
  const [liveAnchorRect, setLiveAnchorRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(anchorRect)

  const visibleMonths = useMemo(
    () => [startMonth, new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1)],
    [startMonth]
  )

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

    Promise.allSettled(
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
    if (window.innerWidth < 1024) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
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
  }, [anchorElement, anchorRect])

  const minVisiblePrice = useMemo(() => {
    const values = Object.values(prices).filter((item): item is number => typeof item === "number")
    return values.length ? Math.min(...values) : null
  }, [prices])

  const resolvedAnchorRect = liveAnchorRect ?? anchorRect

  const panelContent = (
      <div className="pointer-events-auto fixed inset-x-5 bottom-3 z-[120] max-h-[min(500px,calc(100svh-24px))] overflow-hidden rounded-[20px] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.995)_0%,rgba(247,250,255,0.985)_100%)] p-2 shadow-[0_22px_56px_rgba(17,24,39,0.16)] lg:inset-x-auto lg:bottom-auto lg:max-h-none lg:rounded-[24px] lg:p-3 lg:backdrop-blur-xl">
        <div className="mx-auto mb-2.5 h-1.5 w-12 rounded-full bg-[#d8e1ee] lg:hidden" />

        <div className="flex max-h-[min(452px,calc(100svh-72px))] flex-col overflow-hidden lg:max-h-none">
          <div className="flex items-center justify-between gap-3 border-b border-[#e7edf5] pb-2.5 lg:pb-3">
            <div className="rounded-[13px] border border-[#dde6f1] bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-[#52627b] shadow-[0_8px_18px_rgba(17,24,39,0.05)] lg:rounded-[14px] lg:py-2 lg:text-[13px]">
              {from && to ? `${from} → ${to}` : copy.routePlaceholder}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden h-9 rounded-full border border-[#dbe3ef] bg-white px-4 text-[13px] font-semibold text-[#627188] transition hover:bg-[#f8fbff] lg:inline-flex lg:items-center"
            >
              {copy.close}
            </button>
          </div>

          {!from || !to ? (
            <div className="mt-3 rounded-[18px] border border-[#e2e8f1] bg-white px-4 py-6 text-center text-[13px] leading-6 text-[#627188] lg:mt-4 lg:rounded-[20px] lg:px-5 lg:py-8 lg:text-sm">
              {copy.routeHint}
            </div>
          ) : (
            <>
              <div className="mt-2.5 overflow-y-auto pr-0.5 lg:mt-4 lg:overflow-visible lg:pr-0">
                <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
                  {visibleMonths.map((monthDate, monthIndex) => {
                    const cells = getMonthDays(monthDate)

                    return (
                      <div
                        key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                        className={monthIndex === 1 ? "hidden lg:block" : "block"}
                      >
                        <div className="rounded-[15px] border border-[#e4ebf4] bg-white/95 p-2 shadow-[0_12px_28px_rgba(17,24,39,0.05)] lg:rounded-[18px] lg:p-3">
                          <div className="mb-1 flex items-center justify-between lg:mb-2">
                            {monthIndex === 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setStartMonth(
                                    new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1)
                                  )
                                }
                                className="grid h-6 w-6 place-items-center rounded-full border border-[#e2e9f2] bg-[#f8fbff] text-[#6f7f97] transition hover:bg-white lg:h-8 lg:w-8"
                              >
                                <ChevronLeft size={13} />
                              </button>
                            ) : (
                              <div className="h-6 w-6 lg:h-8 lg:w-8" />
                            )}

                            <div className="text-center">
                              <div className="text-[11px] font-black text-[#1295dd] md:text-[15px]">
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
                                className="grid h-6 w-6 place-items-center rounded-full border border-[#e2e9f2] bg-[#f8fbff] text-[#6f7f97] transition hover:bg-white lg:h-8 lg:w-8"
                              >
                                <ChevronRight size={13} />
                              </button>
                            ) : (
                              <div className="h-6 w-6 lg:h-8 lg:w-8" />
                            )}
                          </div>

                          <div className="grid grid-cols-7 gap-x-1 gap-y-0.5 text-center text-[#7b8aa0] lg:gap-y-1.5">
                            {copy.weekdayLabels.map((label, labelIndex) => (
                              <div
                                key={label}
                                className={[
                                  "py-0.5 text-[9px] font-semibold uppercase tracking-[0.02em] lg:py-1 lg:text-[10px]",
                                  labelIndex >= 5 ? "text-[#95a4bb]" : "text-[#243042]",
                                ].join(" ")}
                              >
                                {label}
                              </div>
                            ))}

                            {cells.map((cell, index) => {
                              if (!cell) {
                                  return <div key={`empty-${index}`} className="h-[32px] md:h-[46px]" />
                              }

                              const iso = toISODate(cell)
                              const price = prices[iso]
                              const isSelected = value === iso
                              const isToday = iso === toISODate(new Date())
                              const weekDay = (cell.getDay() + 6) % 7
                              const weekend = weekDay >= 5

                              return (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => onChange(iso)}
                                  className={[
                                    "flex h-[32px] w-full min-w-0 flex-col items-center justify-center rounded-[8px] border px-0.5 text-center transition md:h-[46px] md:px-1",
                                    isSelected
                                      ? "border-[#1f6fff] bg-[linear-gradient(180deg,#2f7dff_0%,#1e6df0_100%)] text-white shadow-[0_14px_34px_rgba(34,104,230,0.22)]"
                                      : "border-[#eef2f7] bg-[linear-gradient(180deg,#fcfdff_0%,#f6f9fd_100%)] text-[#1d2430] hover:border-[#dce6f3] hover:bg-white",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "text-[10px] font-black leading-none md:text-[14px]",
                                      isToday && !isSelected ? "text-[#1f6fff]" : "",
                                      !isSelected && weekend ? "text-[#95a4bb]" : "",
                                    ].join(" ")}
                                  >
                                    {cell.getDate()}
                                  </span>
                                  <span
                                    className={[
                                      "mt-0.5 line-clamp-2 px-0.5 text-[5px] font-semibold leading-2 md:px-1 md:text-[8px] md:leading-3",
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

              <div className="mt-2.5 flex flex-col gap-2 border-t border-[#e7edf5] pt-2.5 md:mt-4 md:flex-row md:items-center md:justify-between md:gap-3 md:pt-3">
                <div className="text-[11px] leading-4 text-[#627188] md:text-[13px]">
                  {loading
                    ? copy.loading
                    : minVisiblePrice
                      ? `${copy.minPrice}: ${millionPrice(minVisiblePrice)} UZS`
                      : copy.noPrice}
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 rounded-full border border-[#dbe3ef] bg-white px-4 text-[11px] font-semibold text-[#627188] transition hover:bg-[#f8fbff] sm:min-w-[110px] lg:hidden"
                  >
                    {copy.close}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 rounded-full bg-[linear-gradient(135deg,#12a4ef_0%,#0593dc_100%)] px-4 text-[11px] font-bold text-white shadow-[0_14px_32px_rgba(15,154,231,0.24)] transition hover:brightness-105 sm:min-w-[190px] md:h-10 md:px-6 md:text-[13px]"
                  >
                    {copy.select} {minVisiblePrice ? `- ${millionPrice(minVisiblePrice)} UZS` : ""}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  )

  const isDesktopPortal =
    typeof window !== "undefined" &&
    window.innerWidth >= 1024 &&
    resolvedAnchorRect

  if (isDesktopPortal && typeof document !== "undefined") {
    const viewportWidth = window.innerWidth
    const panelWidth = Math.min(720, viewportWidth - 72)
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
          className="pointer-events-auto fixed z-[160] overflow-hidden rounded-[24px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(247,250,255,0.98)_100%)] p-3 shadow-[0_24px_70px_rgba(17,24,39,0.18)] backdrop-blur-xl"
          style={{ top, left, width: panelWidth, maxHeight: "min(760px, calc(100vh - 32px))" }}
        >
          <div className="flex max-h-[min(720px,calc(100vh-72px))] flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#e7edf5] pb-3">
              <div className="rounded-[14px] border border-[#dde6f1] bg-white/90 px-3 py-2 text-[13px] font-semibold text-[#52627b] shadow-[0_8px_18px_rgba(17,24,39,0.05)]">
                {from && to ? `${from} в†’ ${to}` : copy.routePlaceholder}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-full border border-[#dbe3ef] bg-white px-4 text-[13px] font-semibold text-[#627188] transition hover:bg-[#f8fbff]"
              >
                {copy.close}
              </button>
            </div>
            {!from || !to ? (
              <div className="mt-4 rounded-[20px] border border-[#e2e8f1] bg-white px-5 py-8 text-center text-sm text-[#627188]">
                {copy.routeHint}
              </div>
            ) : (
              <div className="mt-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  {visibleMonths.map((monthDate, monthIndex) => {
                    const cells = getMonthDays(monthDate)

                    return (
                      <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
                        <div className="rounded-[18px] border border-[#e4ebf4] bg-white/95 p-3 shadow-[0_12px_28px_rgba(17,24,39,0.05)]">
                          <div className="mb-2 flex items-center justify-between">
                            {monthIndex === 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setStartMonth(
                                    new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1)
                                  )
                                }
                                className="grid h-8 w-8 place-items-center rounded-full border border-[#e2e9f2] bg-[#f8fbff] text-[#6f7f97] transition hover:bg-white"
                              >
                                <ChevronLeft size={16} />
                              </button>
                            ) : (
                              <div className="h-8 w-8" />
                            )}

                            <div className="text-center">
                              <div className="text-[13px] font-black text-[#1295dd] md:text-[15px]">
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
                                className="grid h-8 w-8 place-items-center rounded-full border border-[#e2e9f2] bg-[#f8fbff] text-[#6f7f97] transition hover:bg-white"
                              >
                                <ChevronRight size={16} />
                              </button>
                            ) : (
                              <div className="h-8 w-8" />
                            )}
                          </div>

                          <div className="grid grid-cols-7 gap-x-1 gap-y-1.5 text-center text-[#7b8aa0]">
                            {copy.weekdayLabels.map((label, labelIndex) => (
                              <div
                                key={label}
                                className={[
                                  "py-1 text-[10px] font-semibold uppercase tracking-[0.02em]",
                                  labelIndex >= 5 ? "text-[#95a4bb]" : "text-[#243042]",
                                ].join(" ")}
                              >
                                {label}
                              </div>
                            ))}

                            {cells.map((cell, index) => {
                              if (!cell) {
                                return <div key={`empty-${index}`} className="h-[42px] md:h-[46px]" />
                              }

                              const iso = toISODate(cell)
                              const price = prices[iso]
                              const isSelected = value === iso
                              const isToday = iso === toISODate(new Date())
                              const weekend = cell.getDay() === 0 || cell.getDay() === 6

                              return (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => onChange(iso)}
                                  className={[
                                    "flex h-[42px] w-full min-w-0 flex-col items-center justify-center rounded-[10px] border px-1 text-center transition md:h-[46px]",
                                    isSelected
                                      ? "border-[#1f6fff] bg-[linear-gradient(180deg,#2f7dff_0%,#1e6df0_100%)] text-white shadow-[0_14px_34px_rgba(34,104,230,0.22)]"
                                      : "border-[#eef2f7] bg-[linear-gradient(180deg,#fcfdff_0%,#f6f9fd_100%)] text-[#1d2430] hover:border-[#dce6f3] hover:bg-white",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "text-[13px] font-black leading-none md:text-[14px]",
                                      isToday && !isSelected ? "text-[#1f6fff]" : "",
                                      !isSelected && weekend ? "text-[#95a4bb]" : "",
                                    ].join(" ")}
                                  >
                                    {cell.getDate()}
                                  </span>
                                  <span
                                    className={[
                                      "mt-0.5 line-clamp-2 px-1 text-[7px] font-semibold leading-3 md:text-[8px]",
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

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e7edf5] pt-3">
              <div className="text-xs text-[#627188]">
                {loading
                  ? copy.loading
                  : minVisiblePrice
                    ? `${copy.minPrice}: ${millionPrice(minVisiblePrice)}`
                    : copy.noPrice}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-full bg-[linear-gradient(180deg,#2f7dff_0%,#1e6df0_100%)] px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_12px_24px_rgba(34,104,230,0.22)]"
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
