export default function WhyUs() {
  const items = [
    { t: "24/7 Support", d: "Telegram orqali tezkor yordam." },
    { t: "Premium UI/UX", d: "Luxury dizayn, tez ishlash." },
    { t: "Shaffof narx", d: "Yashirin to‘lovlarsiz." },
  ]

  return (
    <section className="relative bg-[#f3f3f3] text-[#1b1f2a]">
      <div className="relative mx-auto max-w-[1200px] px-5 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">
          Nega aynan biz?
        </h2>
        <div className="w-20 h-[2px] bg-[#8A3A5A] mx-auto my-3 rounded-full" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((x) => (
            <div key={x.t} className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
              <div className="text-lg font-semibold">{x.t}</div>
              <div className="mt-2 text-[#4a5361]">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-px w-full bg-black/10" />
    </section>
  )
}
