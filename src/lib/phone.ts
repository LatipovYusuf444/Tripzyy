export function formatUzPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "")
  const local = (digits.startsWith("998") ? digits.slice(3) : digits).slice(0, 9)

  const a = local.slice(0, 2)
  const b = local.slice(2, 5)
  const c = local.slice(5, 7)
  const d = local.slice(7, 9)

  let out = "+998"
  if (a) out += ` ${a}`
  if (b) out += ` ${b}`
  if (c) out += ` ${c}`
  if (d) out += ` ${d}`
  return out
}
