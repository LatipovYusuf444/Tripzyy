import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import { useAppLoading } from "@/shared/store/appLoading"
import { useI18n } from "@/shared/i18n/i18n"

export default function GlobalLoadingOverlay() {
  const { language } = useI18n()
  const pendingCount = useAppLoading((state) => state.pendingCount)
  const isLoading = pendingCount > 0
  const [visible, setVisible] = useState(false)
  const label =
    language === "uz"
      ? "Yuklanmoqda"
      : language === "ru"
        ? "Загрузка"
        : "Loading"

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (isLoading) {
      setVisible(true)
    } else {
      timeoutId = setTimeout(() => setVisible(false), 180)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-auto fixed inset-0 z-[180] grid place-items-center bg-[rgba(247,249,252,0.82)] backdrop-blur-md"
        >
          <div className="relative flex flex-col items-center gap-5">
            <div className="relative overflow-hidden text-center">
              <span className="select-none text-[54px] font-black uppercase tracking-[0.18em] text-black/14 sm:text-[82px] md:text-[108px]">
                {label}
              </span>

              <motion.span
                className="absolute inset-0 select-none text-[54px] font-black uppercase tracking-[0.18em] text-black sm:text-[82px] md:text-[108px]"
                animate={{
                  clipPath: [
                    "inset(0 100% 0 0)",
                    "inset(0 0% 0 0)",
                    "inset(0 0 0 0)",
                  ],
                }}
                transition={{
                  duration: 1.2,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              >
                {label}
              </motion.span>
            </div>

            <motion.div
              className="h-[3px] w-[180px] overflow-hidden rounded-full bg-black/10"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full rounded-full bg-black"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1.1,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
