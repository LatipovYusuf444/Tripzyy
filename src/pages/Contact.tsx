import { useState } from "react"
// TODO: backend ulaganda:
// import http from "@/shared/api/http"


export default function Contact() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // TODO: Backend:
      // await http.post("/api/leads", { name, phone, message })
      alert("Yuborildi (hozircha mock). Keyin backendga ulanadi.")
      setName("")
      setPhone("")
      setMessage("")
    }finally{
      setLoading(false)
    }
  }
  return (
    <section className="relative bg-[#0A1220] text-white pt-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold">Contact</h1>
          <p className="mt-4 text-white/70">Savollaringiz bormi? Biz bilan bog‘laning.</p>

          <div className="mt-6 space-y-3 text-white/80">
            <div>📞 +998 (99) 007-43-34</div>
            <div>✉️ support@tripzy.uz</div>
            <div>💬 Telegram: @tripzy_support</div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="font-semibold">Ish vaqti</div>
            <div className="mt-2 text-white/70 text-sm">Har kuni: 09:00 — 23:00</div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/5 p-7 space-y-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <input
            className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25"
            placeholder="Ism"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/25"
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <textarea
            className="min-h-[150px] w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
            placeholder="Xabar"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-[#FF7A00] font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Yuborilyapti..." : "Yuborish"}
          </button>

          <p className="text-xs text-white/55">
            {/* TODO: backend ulansa success toast/validation qo‘shiladi */}
            * Keyin validatsiya + toast notification qo‘shamiz.
          </p>
        </form>
      </div>
    </section>
  )
}


