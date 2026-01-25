export default function WhyUs() {
  const items = [
    { t: "24/7 Support", d: "Telegram orqali tezkor yordam." },
    { t: "Premium UI/UX", d: "Luxury dizayn, tez ishlash." },
    { t: "Shaffof narx", d: "Yashirin to‘lovlarsiz." },
  ]

  return (
    <section className="relative bg-[#0A1220]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />
      <div className="relative mx-auto max-w-[1200px] px-5 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Nega aynan biz?</h2>
        <div className="w-24 h-1 bg-[#FF7A00] mx-auto my-4 rounded-full" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((x) => (
            <div key={x.t} className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="text-xl font-semibold">{x.t}</div>
              <div className="mt-2 text-white/70">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-px w-full bg-white/10" />
    </section>
  )
}
