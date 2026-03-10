// src/pages/Passengers.tsx
import { useEffect, useMemo, useState } from "react"
import { Pencil, Trash2, Plus, Ticket, CalendarDays, Users2 } from "lucide-react"
import { bookingCart, type Passenger, uid } from "@/shared/store/bookingCart"

type Draft = Omit<Passenger, "id"> & { id?: string }

export default function PassengersPage() {
  const [cart, setCart] = useState(() => bookingCart.get())

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    firstName: "",
    lastName: "",
    birthDate: "",
    citizenship: "O‘zbekiston",
    passportNo: "",
    passportExpiry: "",
  })

  const refresh = () => setCart(bookingCart.get())

  useEffect(() => {
    refresh()

    // ✅ cart boshqa joyda update bo‘lsa ham shu page yangilansin
    const on = () => refresh()
    window.addEventListener("booking_cart_changed", on)
    return () => window.removeEventListener("booking_cart_changed", on)
  }, [])

  const title = useMemo(() => {
    const r = cart.route ? ` · ${cart.route}` : ""
    const d = cart.date ? ` · ${cart.date}` : ""
    return `Yo‘lovchilar (Karzinka)${r}${d}`
  }, [cart.route, cart.date])

  const onAdd = () => {
    setDraft({
      firstName: "",
      lastName: "",
      birthDate: "",
      citizenship: "O‘zbekiston",
      passportNo: "",
      passportExpiry: "",
    })
    setOpen(true)
  }

  const onEdit = (p: Passenger) => {
    setDraft({ ...p })
    setOpen(true)
  }

  const onDelete = (id: string) => {
    bookingCart.removePassenger(id)
    refresh()
  }

  const canSave =
    draft.firstName?.trim() &&
    draft.lastName?.trim() &&
    draft.birthDate?.trim() &&
    draft.citizenship?.trim() &&
    draft.passportNo?.trim() &&
    draft.passportExpiry?.trim()

  const onSave = () => {
    if (!canSave) return

    const p: Passenger = {
      id: draft.id ?? uid(),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      birthDate: draft.birthDate,
      citizenship: draft.citizenship.trim(),
      passportNo: draft.passportNo.trim().toUpperCase(),
      passportExpiry: draft.passportExpiry,
    }

    bookingCart.upsertPassenger(p)
    refresh()
    setOpen(false)
  }

  const pax = Math.max(1, (cart.pax ?? cart.passengers.length) || 1)
  return (
    <section className="relative min-h-screen text-white pt-24">

      <div className="relative mx-auto max-w-[1150px] px-5 py-10">
        {/* header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{title}</h1>
            <p className="mt-2 text-white/70 text-sm">
              Reys tanlaganingdan keyin yo‘lovchilar shu yerga tushadi. (karzinka)
            </p>

            {/* meta pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill icon={Ticket} label="Reys" value={cart.route ?? "—"} />
              <Pill icon={CalendarDays} label="Sana" value={cart.date ?? "—"} />
              <Pill icon={Users2} label="Bilet soni" value={`${pax} ta`} />
            </div>
          </div>

          <button
            onClick={onAdd}
            className="
              h-11 px-4 rounded-2xl
              bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
              text-white font-semibold
              inline-flex items-center gap-2
              transition
              shadow-[0_18px_50px_rgba(138,58,90,0.35)]
              hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
            "
          >
            Yo‘lovchi qo‘shish <Plus size={16} />
          </button>
        </div>

        {/* table */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="text-left text-white/60 text-sm">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Ism</th>
                  <th className="py-3 px-3">Familiya</th>
                  <th className="py-3 px-3">Tug‘ilgan sana</th>
                  <th className="py-3 px-3">Fuqarolik</th>
                  <th className="py-3 px-3">Pasport</th>
                  <th className="py-3 px-3">Amal qilish</th>
                  <th className="py-3 px-3">Amal</th>
                </tr>
              </thead>

              <tbody>
                {cart.passengers.length === 0 ? (
                  <tr>
                    <td className="py-6 px-3 text-white/65" colSpan={8}>
                      Hozircha yo‘lovchi yo‘q. “Yo‘lovchi qo‘shish” ni bosing.
                    </td>
                  </tr>
                ) : (
                  cart.passengers.map((p, idx) => (
                    <tr
                      key={p.id}
                      className="border-t border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                    >
                      <td className="py-4 px-3 text-white/70">{idx + 1}</td>
                      <td className="py-4 px-3 text-white font-semibold">{p.firstName}</td>
                      <td className="py-4 px-3 text-white font-semibold">{p.lastName}</td>
                      <td className="py-4 px-3 text-white/75">{p.birthDate}</td>
                      <td className="py-4 px-3 text-white/75">{p.citizenship}</td>
                      <td className="py-4 px-3 text-white/85 font-mono">{p.passportNo}</td>
                      <td className="py-4 px-3 text-white/75">{p.passportExpiry}</td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(p)}
                            className="
                              h-9 w-9 rounded-xl
                              border border-white/15 bg-white/10
                              hover:bg-white/15 transition
                              grid place-items-center
                            "
                            title="Tahrirlash"
                          >
                            <Pencil size={16} className="text-[#1C96C8]" />
                          </button>

                          <button
                            onClick={() => onDelete(p.id)}
                            className="
                              h-9 w-9 rounded-xl
                              border border-white/15 bg-white/10
                              hover:bg-white/15 transition
                              grid place-items-center
                            "
                            title="O‘chirish"
                          >
                            <Trash2 size={16} className="text-[#8A3A5A]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-white/55">
            * Pax: {pax} ta. Checkoutdan keyin yo‘lovchilar shu yerga tushadi.
          </div>
        </div>

        {/* modal */}
        {open && (
          <div className="fixed inset-0 z-[80] bg-black/55 grid place-items-center p-4">
            <div
              className="
                w-full max-w-[720px]
                rounded-[28px]
                border border-white/18
                bg-white/10
                backdrop-blur-2xl
                shadow-[0_45px_140px_rgba(0,0,0,0.65)]
                p-5
              "
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-extrabold text-white">
                  {draft.id ? "Yo‘lovchini tahrirlash" : "Yo‘lovchi qo‘shish"}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-10 w-10 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Ism"
                  value={draft.firstName}
                  onChange={(v) => setDraft((p) => ({ ...p, firstName: v }))}
                  placeholder="Ism"
                />
                <Field
                  label="Familiya"
                  value={draft.lastName}
                  onChange={(v) => setDraft((p) => ({ ...p, lastName: v }))}
                  placeholder="Familiya"
                />
                <Field
                  label="Tug‘ilgan sana"
                  type="date"
                  value={draft.birthDate}
                  onChange={(v) => setDraft((p) => ({ ...p, birthDate: v }))}
                />
                <Field
                  label="Fuqarolik"
                  value={draft.citizenship}
                  onChange={(v) => setDraft((p) => ({ ...p, citizenship: v }))}
                  placeholder="O‘zbekiston"
                />
                <Field
                  label="Pasport seriya / raqam"
                  value={draft.passportNo}
                  onChange={(v) => setDraft((p) => ({ ...p, passportNo: v.toUpperCase() }))}
                  placeholder="AA1234567"
                />
                <Field
                  label="Pasport amal qilish muddati"
                  type="date"
                  value={draft.passportExpiry}
                  onChange={(v) => setDraft((p) => ({ ...p, passportExpiry: v }))}
                />
              </div>

              <button
                onClick={onSave}
                disabled={!canSave}
                className="
                  mt-4 h-12 w-full rounded-2xl
                  bg-gradient-to-r from-[#7A2E4E] via-[#8A3A5A] to-[#A0526B]
                  text-white font-semibold transition
                  shadow-[0_18px_50px_rgba(138,58,90,0.35)]
                  hover:shadow-[0_24px_80px_rgba(138,58,90,0.45)] hover:brightness-110
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Saqlash
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Pill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2">
      <Icon size={14} className="text-white/70" />
      <div className="text-xs text-white/60">{label}:</div>
      <div className="text-sm font-semibold text-white/90">{value}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <div className="text-white/60 text-xs mb-2">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          h-12 w-full rounded-2xl
          bg-white/5 border border-white/10
          px-4 outline-none
          focus:border-white/25 focus:bg-white/10
          transition text-white
        "
      />
    </label>
  )
}
