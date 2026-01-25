export default function Services() {
  const services = [
    { t: "Aviabilet bron qilish", d: "Eng qulay reyslar va tez tasdiqlash." },
    { t: "Vip xizmatlar", d: "Meet & Greet,lounge,fast track." },
    { t: "Sug'urta", d: "Sayohat xavsizligi uchun insurance." },
    { t: "Transfer", d: "Airport-hotel premium transfer" },
  ]
  return (
    <section className="relative bg-[#0A1220] pt-20 text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-16">
        <h1 className="text-4xl md:text-5xl font-bold">Xizmatlar</h1>
        <p className="mt-4 text-white/70 max-w-[850px]">
          Sayohatingizni boshidan oxirigacha premium darajada qilishga yordam beramiz.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s) => (
            <div key={s.t} className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="text-2xl font-semibold">{s.t}</div>
              <div className="mt-2 text-white/70">{s.d}</div>
              <button className="mt-5 h-11 px-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                Batafsil
              </button>
              {/* TODO: keyin service detail page qilsa bo'ladi */}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

