import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import { CalendarDays, MapPinned, MoveRight, Search, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble"
import heroImage from "@/assets/images/avubuluttour.png"

const titleLines = [
  "Aviatsiya sohasida birgalikdagi",
  "hamkorlikka taklif",
]

export default function Home() {
  const navigate = useNavigate()
  const sectionRef = useRef<HTMLElement | null>(null)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [pax, setPax] = useState(1)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.22,
  })
  const heroY = useTransform(smoothProgress, [0, 1], [0, 120])
  const heroScale = useTransform(smoothProgress, [0, 1], [1.06, 1.18])
  const heroBlur = useTransform(smoothProgress, [0, 1], ["blur(0px)", "blur(10px)"])
  const heroOpacity = useTransform(smoothProgress, [0, 1], [1, 0.72])
  const heroClipPath = useTransform(
    smoothProgress,
    [0, 1],
    ["inset(0% 0% 0% 0% round 0px)", "inset(6% 4% 10% 4% round 28px)"]
  )
  const contentY = useTransform(smoothProgress, [0, 1], [0, -40])
  const contentScale = useTransform(smoothProgress, [0, 1], [1, 0.97])
  const contentOpacity = useTransform(smoothProgress, [0, 0.7, 1], [1, 0.95, 0.82])
  const titleY = useTransform(smoothProgress, [0, 1], [0, -18])
  const titleBlur = useTransform(smoothProgress, [0, 1], ["blur(0px)", "blur(4px)"])
  const paragraphY = useTransform(smoothProgress, [0, 1], [0, -28])
  const cardY = useTransform(smoothProgress, [0, 1], [0, -24])
  const cardScale = useTransform(smoothProgress, [0, 1], [1, 0.965])
  const cardRotate = useTransform(smoothProgress, [0, 1], [0, -1.2])
  const cardBlur = useTransform(smoothProgress, [0, 1], ["blur(0px)", "blur(3px)"])
  const glowOpacity = useTransform(smoothProgress, [0, 1], [0.24, 0.5])
  const planeLayerY = useTransform(smoothProgress, [0, 1], [0, 90])
  const planeLayerScale = useTransform(smoothProgress, [0, 1], [1.02, 1.12])
  const shineX = useTransform(smoothProgress, [0, 1], ["-120%", "160%"])

  const onSearch = () => {
    const q = new URLSearchParams({
      from: from.trim(),
      to: to.trim(),
      date: date.trim(),
      pax: String(Math.max(1, pax)),
    }).toString()

    navigate(`/flights?${q}`)
  }

  return (
    <section
      ref={sectionRef}
      className="h-[100svh] overflow-hidden bg-[#dfe5ea] pt-[74px] text-[#1d2430] md:pt-[84px]"
    >
      <div className="flex h-full w-full border-y border-[#d8dde4] bg-[#eef3f7] shadow-[0_22px_60px_rgba(16,24,40,0.08)]">
        <div className="relative h-full w-full overflow-hidden">
          <motion.div className="absolute inset-0" style={{ clipPath: heroClipPath }}>
            <motion.img
              src={heroImage}
              alt="Aviatsiya hamkorlik hero rasmi"
              className="absolute inset-0 h-full w-full scale-[1.24] object-cover object-[68%_center] sm:scale-[1.14] sm:object-[62%_center] lg:scale-[1.06] lg:object-center"
              style={{
                y: heroY,
                scale: heroScale,
                filter: heroBlur,
                opacity: heroOpacity,
              }}
            />
            <motion.div
              className="absolute inset-0 mix-blend-screen opacity-20"
              style={{
                y: planeLayerY,
                scale: planeLayerScale,
                background:
                  "linear-gradient(108deg,rgba(255,255,255,0)_18%,rgba(255,255,255,0.32)_38%,rgba(120,170,255,0.22)_54%,rgba(255,255,255,0)_72%)",
              }}
            />
          </motion.div>
          <BubbleBackground
            interactive
            colors={{
              first: "255,255,255",
              second: "189,216,255",
              third: "136,194,255",
              fourth: "246,250,255",
              fifth: "164,208,255",
              sixth: "214,234,255",
            }}
            className="pointer-events-none absolute inset-0 opacity-70"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_24%,rgba(255,255,255,0.06)_56%,rgba(246,248,251,0.14)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.16)_22%,rgba(255,255,255,0)_46%)]" />
          <motion.div
            className="pointer-events-none absolute inset-x-[8%] bottom-[14%] h-[160px] rounded-full bg-[radial-gradient(circle,rgba(71,105,181,0.24)_0%,rgba(71,105,181,0.10)_44%,transparent_74%)] blur-3xl"
            style={{ opacity: glowOpacity, y: heroY }}
          />

          <motion.div
            className="relative z-10 flex h-full items-start px-4 py-5 sm:px-6 md:px-12 xl:px-16"
            style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
          >
            <div className="w-full">
              <div className="max-w-[1120px] rounded-[24px] bg-[linear-gradient(90deg,rgba(255,255,255,0.50)_0%,rgba(255,255,255,0.20)_70%,rgba(255,255,255,0)_100%)] px-4 py-4 pt-[72px] sm:px-5 sm:pt-[96px] md:px-6 md:pt-[108px] xl:ml-[180px] xl:pt-[92px]">
                <motion.h1
                  className="max-w-[900px] text-[28px] font-extrabold leading-[0.98] tracking-[-0.04em] text-[#202838] sm:text-[38px] md:text-[46px] xl:text-[52px]"
                  style={{ y: titleY, filter: titleBlur }}
                >
                  {titleLines.map((line, lineIndex) => (
                    <span key={line} className="block">
                      {line.split("").map((char, charIndex) => (
                        <motion.span
                          key={`${lineIndex}-${charIndex}-${char}`}
                          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.45,
                            delay: lineIndex * 0.16 + charIndex * 0.018,
                            ease: "easeOut",
                          }}
                          className="inline-block"
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                    </span>
                  ))}
                </motion.h1>

                <motion.p
                  className="mt-4 max-w-[520px] text-[14px] leading-7 text-[#44536a] sm:text-[15px] md:mt-5 md:text-[17px]"
                  style={{ y: paragraphY }}
                >
                  Fuqaro aviatsiyasi sohasida uzoq muddatli hamkorlik,
                  professional xizmat va ishonchli operatsion yechimlarni
                  taklif qilamiz.
                </motion.p>

                <motion.button
                  type="button"
                  onClick={() => navigate("/about")}
                  className="mt-5 inline-flex h-[52px] min-w-[180px] items-center justify-center rounded-[12px] border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] px-7 text-base font-semibold text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:brightness-110 sm:min-w-[190px] md:mt-6 md:h-[56px] md:min-w-[206px] md:text-lg"
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  Batafsil
                </motion.button>

                <motion.div
                  className="relative mt-5 max-w-[1040px] overflow-hidden rounded-[24px] border border-white/60 bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_18px_45px_rgba(22,31,48,0.10)] backdrop-blur-md md:mt-7 md:p-4"
                  style={{
                    y: cardY,
                    scale: cardScale,
                    rotateX: cardRotate,
                    filter: cardBlur,
                    transformPerspective: 1200,
                  }}
                >
                  <motion.div
                    className="pointer-events-none absolute inset-y-0 w-[28%] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.58)_50%,rgba(255,255,255,0)_100%)] opacity-60 blur-xl"
                    style={{ x: shineX }}
                  />
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_210px]">
                    <motion.label
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="flex h-[52px] flex-col justify-center rounded-[12px] border border-[#dbe3ef] bg-white/80 px-5 shadow-[0_8px_20px_rgba(18,28,45,0.06)] md:h-[56px]"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#66748a]">
                        <MapPinned size={14} />
                        Qayerdan
                      </div>
                      <input
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="mt-0.5 w-full bg-transparent text-base font-semibold text-[#1b2433] outline-none placeholder:text-[#9aa5b5]"
                        placeholder="Toshkent"
                      />
                    </motion.label>

                    <div className="hidden items-center justify-center xl:flex">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dbe3ef] bg-white/85 text-[#1c2433] shadow-[0_10px_24px_rgba(20,28,40,0.08)]">
                        <MoveRight size={18} />
                      </div>
                    </div>

                    <motion.label
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="flex h-[52px] flex-col justify-center rounded-[12px] border border-[#dbe3ef] bg-white/80 px-5 shadow-[0_8px_20px_rgba(18,28,45,0.06)] md:h-[56px]"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#66748a]">
                        <MapPinned size={14} />
                        Qayerga
                      </div>
                      <input
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="mt-0.5 w-full bg-transparent text-base font-semibold text-[#1b2433] outline-none placeholder:text-[#9aa5b5]"
                        placeholder="Istanbul"
                      />
                    </motion.label>

                    <motion.label
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="flex h-[52px] flex-col justify-center rounded-[12px] border border-[#dbe3ef] bg-white/80 px-5 shadow-[0_8px_20px_rgba(18,28,45,0.06)] md:h-[56px]"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#66748a]">
                        <CalendarDays size={14} />
                        Sana
                      </div>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-0.5 w-full bg-transparent text-base font-semibold text-[#1b2433] outline-none"
                      />
                    </motion.label>

                    <motion.div
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="flex h-[52px] flex-col justify-center rounded-[12px] border border-[#dbe3ef] bg-white/80 px-4 shadow-[0_8px_20px_rgba(18,28,45,0.06)] md:h-[56px]"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#66748a]">
                        <Users size={16} />
                        Yo'lovchi
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <motion.button
                          type="button"
                          onClick={() => setPax((value) => Math.max(1, value - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-[24px] font-semibold leading-none text-[#1b2433] transition hover:bg-[#f3f6fb]"
                          whileTap={{ scale: 0.92 }}
                        >
                          -
                        </motion.button>
                        <AnimatedCount value={pax} />
                        <motion.button
                          type="button"
                          onClick={() => setPax((value) => Math.min(9, value + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-[24px] font-semibold leading-none text-[#1b2433] transition hover:bg-[#f3f6fb]"
                          whileTap={{ scale: 0.92 }}
                        >
                          +
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.button
                      type="button"
                      onClick={onSearch}
                      className="inline-flex h-[52px] items-center justify-center gap-2 self-center rounded-[12px] border border-[#1a2231]/10 bg-[linear-gradient(135deg,#1c2433_0%,#111827_52%,#2a3142_100%)] px-7 text-base font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:brightness-110 md:h-[56px]"
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <Search size={16} />
                      Qidirish
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function AnimatedCount({ value }: { value: number }) {
  const spring = useSpring(value, {
    stiffness: 220,
    damping: 22,
    mass: 0.5,
  })
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(Math.round(latest))
  })

  return (
    <motion.div
      layout
      className="min-w-[76px] text-center text-base font-semibold text-[#1b2433]"
      transition={{
        layout: { duration: 0.22 },
      }}
    >
      <motion.span
        key={display}
        initial={{ opacity: 0.55, y: 8, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="inline-block min-w-[24px]"
      >
        {display}
      </motion.span>{" "}
      ta
    </motion.div>
  )
}
