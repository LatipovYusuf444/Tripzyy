import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, ChevronDown, Plane, Search, Ticket } from "lucide-react"
import aviaTourBg from "@/assets/images/images.webp"
import aviaPlane from "@/assets/avia-tour-removebg-preview.webp"

type Tab = "bron" | "reysim" | "royxat"

export default function Home() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("bron")
  const [from, setFrom] = useState("TAS")
  const [to, setTo] = useState("SAW")
  const [date, setDate] = useState("2026-03-20")
  const [pax, setPax] = useState(1)

  const onSearch = () => {
    if (!from.trim() || !to.trim() || !date.trim()) return
    const q = new URLSearchParams({
      from: from.trim().toUpperCase(),
      to: to.trim().toUpperCase(),
      date,
      pax: String(Math.max(1, pax)),
    }).toString()
    navigate(`/flights?${q}`)
  }

  return (
    <section className="min-h-screen bg-[#e9eef6] px-3 pb-10 pt-24 md:px-6">
      <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[24px] border border-[#cfd9ea] bg-white shadow-[0_24px_70px_rgba(21,39,74,0.18)]">
        <div className="relative grid min-h-[760px] grid-cols-1 xl:grid-cols-[58%_42%]">
          <div className="relative z-20 bg-[#edf2fa] px-6 pb-10 pt-8 md:px-10">
            <div className="flex flex-wrap items-center gap-5 text-[11px] font-semibold uppercase tracking-wide text-[#20335f]">
              <span className="inline-flex items-center gap-2 text-[#0b2f74]">
                <Plane size={15} />
                Tripzy Air
              </span>
              <span>Biz haqimizda</span>
              <span>Yangiliklar</span>
              <span>Karyera</span>
              <span>Aloqa</span>
            </div>

            <div className="mt-14 text-[#0a47af]">
              <div className="text-lg text-[#29395d]">Biz bilan dunyoni kashf eting</div>
              <h1 className="mt-1 text-[52px] font-black uppercase leading-[0.88] md:text-[92px]">
                Sayohatni
                <br />
                Yuksaltiring
              </h1>
            </div>

            <div className="mt-10 w-full max-w-[470px] rounded-2xl border border-[#d8e1f1] bg-white p-4 shadow-[0_16px_46px_rgba(18,49,105,0.10)]">
              <div className="flex gap-1 rounded-xl bg-[#f3f7fe] p-1 text-xs font-semibold text-[#21407d]">
                <TabBtn active={tab === "bron"} onClick={() => setTab("bron")} label="Bron" />
                <TabBtn active={tab === "reysim"} onClick={() => setTab("reysim")} label="Reysim" />
                <TabBtn active={tab === "royxat"} onClick={() => setTab("royxat")} label="Ro'yxat" />
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md border border-[#cad8ef] bg-[#f6f9ff] px-2 py-1 text-[#1f3668]">
                  <Ticket size={12} />
                  Borib-qaytish
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-[#cad8ef] bg-[#f6f9ff] px-2 py-1 text-[#1f3668]">
                  {Math.max(1, pax)} yo'lovchi
                  <ChevronDown size={12} />
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <Field label="Qayerdan" value={from} onChange={setFrom} />
                <Field label="Qayerga" value={to} onChange={setTo} />
                <Field label="Sana" value={date} onChange={setDate} type="date" icon={CalendarDays} />
              </div>

              <button
                type="button"
                onClick={onSearch}
                className="mt-4 h-11 w-full rounded-lg bg-[#0d57cb] text-sm font-semibold text-white transition hover:bg-[#0b4eb8]"
              >
                <span className="inline-flex items-center gap-2">
                  <Search size={15} />
                  Reyslarni ko'rsatish
                </span>
              </button>
            </div>
          </div>

          <div className="relative z-10 min-h-[430px]">
            <img
              src={aviaTourBg}
              alt="Avia fon"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#13243f]/25 to-[#091223]/40" />
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-[56%] z-30 hidden w-[220px] -translate-x-1/2 xl:block">
            <svg viewBox="0 0 220 760" className="h-full w-full">
              <path
                d="M95,0 C180,100 35,170 120,280 C200,390 40,490 120,600 C170,665 130,720 90,760 L0,760 L0,0 Z"
                fill="#edf2fa"
                stroke="#cfd9ea"
                strokeWidth="2"
              />
              <path
                d="M112,0 C197,100 52,170 137,280 C217,390 57,490 137,600 C187,665 147,720 107,760"
                fill="none"
                stroke="#d9e3f2"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="pointer-events-none absolute bottom-[175px] left-[54%] z-40 hidden -translate-x-1/2 xl:block">
            <img
              src={aviaPlane}
              alt="Samolyot"
              className="h-[220px] w-auto drop-shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-8 rounded-lg px-3 transition",
        active ? "bg-white text-[#0f4cb6] shadow-sm" : "text-[#55688f] hover:bg-white/70",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  icon?: any
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] text-[#5c6f94]">{label}</div>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#60769f]">
            <Icon size={14} />
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            "h-11 w-full rounded-lg border border-[#d5deef] bg-[#f8fbff] text-sm text-[#1a2f5a] outline-none focus:border-[#3b63b2]",
            Icon ? "pl-9 pr-3" : "px-3",
          ].join(" ")}
        />
      </div>
    </label>
  )
}
