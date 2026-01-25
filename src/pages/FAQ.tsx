const faqs = [
  { q: "Biletni qanday bron qilaman?", a: "Reyslarni qidiring, mosini tanlang va yo‘lovchi ma’lumotlarini kiriting." },
  { q: "To‘lov xavfsizmi?", a: "Ha. Keyin Click/Payme/Stripe ulash mumkin bo‘ladi." },
  { q: "Qaytarish mumkinmi?", a: "Tarif shartlariga bog‘liq. Bu backenddan reys/tarif bilan keladi." },
  { q: "Support bormi?", a: "Ha, 24/7 Telegram orqali." },
]

export default function FAQ() {
  return (
    <section className="relative bg-[#0A1220]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />

      <div className="relative mx-auto max-w-[900px] px-5 py-16">
        <h1 className="text-4xl md:text-5xl font-bold">FAQ</h1>
        <p className="mt-4 text-white/70">Eng ko‘p beriladigan savollar.</p>

        <div className="mt-8 space-y-4">
          {faqs.map((x) => (
            <details key={x.q} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <summary className="cursor-pointer font-semibold">{x.q}</summary>
              <p className="mt-3 text-white/70">{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
