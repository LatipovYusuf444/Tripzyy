export function formatMoney(amount: number, currency?: string) {
  const value = Number.isFinite(amount) ? amount : 0
  const curr = (currency || "").toUpperCase()

  if (curr === "USD") {
    return `$${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value)}`
  }

  if (curr === "UZS") {
    return `${new Intl.NumberFormat("uz-UZ", {
      maximumFractionDigits: 0,
    }).format(value)} so'm`
  }

  if (curr) {
    return `${new Intl.NumberFormat("uz-UZ", {
      maximumFractionDigits: 0,
    }).format(value)} ${curr}`
  }

  return new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(value)
}
