'use client'

import * as React from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from "motion/react"

import { cn } from "@/lib/utils"

type BubbleColors = {
  first: string
  second: string
  third: string
  fourth: string
  fifth: string
  sixth: string
}

export type BubbleBackgroundProps = React.ComponentProps<"div"> & {
  interactive?: boolean
  transition?: SpringOptions
  colors?: BubbleColors
}

const BubbleBackground = React.forwardRef<HTMLDivElement, BubbleBackgroundProps>(
  (
    {
      className,
      children,
      interactive = false,
      transition = { stiffness: 100, damping: 20 },
      colors = {
        first: "18,113,255",
        second: "221,74,255",
        third: "0,220,255",
        fourth: "200,50,50",
        fifth: "180,180,50",
        sixth: "140,100,255",
      },
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springX = useSpring(mouseX, transition)
    const springY = useSpring(mouseY, transition)

    const rectRef = React.useRef<DOMRect | null>(null)
    const rafIdRef = React.useRef<number | null>(null)

    React.useLayoutEffect(() => {
      const updateRect = () => {
        if (containerRef.current) {
          rectRef.current = containerRef.current.getBoundingClientRect()
        }
      }

      updateRect()

      const el = containerRef.current
      const ro = new ResizeObserver(updateRect)
      if (el) ro.observe(el)

      window.addEventListener("resize", updateRect)
      window.addEventListener("scroll", updateRect, { passive: true })

      return () => {
        ro.disconnect()
        window.removeEventListener("resize", updateRect)
        window.removeEventListener("scroll", updateRect)
      }
    }, [])

    React.useEffect(() => {
      if (!interactive) return

      const el = containerRef.current
      if (!el) return

      const handleMouseMove = (e: MouseEvent) => {
        const rect = rectRef.current
        if (!rect) return

        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = requestAnimationFrame(() => {
          mouseX.set(e.clientX - centerX)
          mouseY.set(e.clientY - centerY)
        })
      }

      el.addEventListener("mousemove", handleMouseMove as EventListener, {
        passive: true,
      })

      return () => {
        el.removeEventListener("mousemove", handleMouseMove as EventListener)
        if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
      }
    }, [interactive, mouseX, mouseY])

    return (
      <div
        ref={containerRef}
        data-slot="bubble-background"
        className={cn("relative size-full overflow-hidden", className)}
        {...props}
      >
        <style>
          {`
            :root {
              --first-color: ${colors.first};
              --second-color: ${colors.second};
              --third-color: ${colors.third};
              --fourth-color: ${colors.fourth};
              --fifth-color: ${colors.fifth};
              --sixth-color: ${colors.sixth};
            }
          `}
        </style>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-0 top-0 h-0 w-0"
        >
          <defs>
            <filter id="goo">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="16"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        <div
          className="absolute inset-0"
          style={{ filter: "url(#goo) blur(34px)" }}
        >
          <motion.div
            className="absolute left-[10%] top-[10%] size-[80%] rounded-full mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle at center, rgba(var(--first-color),0.84) 0%, rgba(var(--first-color),0.32) 34%, rgba(var(--first-color),0) 64%)",
              transform: "translateZ(0)",
              willChange: "transform",
            }}
            animate={{ y: [-50, 50, -50] }}
            transition={{ duration: 30, ease: "easeInOut", repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-0 flex origin-[calc(50%-400px)] items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
            }}
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            <div
              className="size-[80%] rounded-full mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(var(--second-color),0.74) 0%, rgba(var(--second-color),0.22) 36%, rgba(var(--second-color),0) 64%)",
              }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 flex origin-[calc(50%+400px)] items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            <div
              className="absolute left-[calc(50%-500px)] top-[calc(50%+200px)] size-[80%] rounded-full mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(var(--third-color),0.68) 0%, rgba(var(--third-color),0.20) 36%, rgba(var(--third-color),0) 64%)",
              }}
            />
          </motion.div>

          <motion.div
            className="absolute left-[10%] top-[10%] size-[80%] rounded-full opacity-75 mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle at center, rgba(var(--fourth-color),0.60) 0%, rgba(var(--fourth-color),0.18) 36%, rgba(var(--fourth-color),0) 64%)",
              transform: "translateZ(0)",
              willChange: "transform",
            }}
            animate={{ x: [-50, 50, -50] }}
            transition={{ duration: 40, ease: "easeInOut", repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-0 flex origin-[calc(50%_-_800px)_calc(50%_+_200px)] items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            <div
              className="absolute left-[calc(50%-80%)] top-[calc(50%-80%)] size-[160%] rounded-full mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(var(--fifth-color),0.62) 0%, rgba(var(--fifth-color),0.18) 38%, rgba(var(--fifth-color),0) 66%)",
              }}
            />
          </motion.div>

          {interactive ? (
            <motion.div
              className="absolute size-full rounded-full opacity-62 mix-blend-screen"
              style={{
                x: springX,
                y: springY,
                transform: "translateZ(0)",
                willChange: "transform",
                background:
                  "radial-gradient(circle at center, rgba(var(--sixth-color),0.64) 0%, rgba(var(--sixth-color),0.18) 38%, rgba(var(--sixth-color),0) 66%)",
              }}
            />
          ) : null}
        </div>

        {children}
      </div>
    )
  }
)

BubbleBackground.displayName = "BubbleBackground"

export { BubbleBackground }
