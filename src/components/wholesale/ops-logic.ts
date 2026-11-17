import type { Invoice, Order, Product } from "./types"

export const DAY_MS = 86_400_000

/** Whole days from `now` until `date` (negative when already past). */
export function daysUntil(date: string, now: Date): number {
  return Math.ceil((new Date(date).getTime() - now.getTime()) / DAY_MS)
}

/** Whole days elapsed since `date`. */
export function ageInDays(date: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / DAY_MS))
}

export type ExpiryBucket = "expired" | "30" | "60" | "90" | "ok"

/** Expiry alert windows: expired, within 30, 60 or 90 days, otherwise ok. */
export function expiryBucket(days: number): ExpiryBucket {
  if (days < 0) return "expired"
  if (days <= 30) return "30"
  if (days <= 60) return "60"
  if (days <= 90) return "90"
  return "ok"
}

export type AgingBuckets = { current: number; d31_60: number; d61_90: number; d90plus: number; total: number }

/** Receivables aging (0–30 / 31–60 / 61–90 / 90+ days) of invoiced, unpaid order balances. */
export function agingFor(orders: Order[], now: Date): AgingBuckets {
  const result: AgingBuckets = { current: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 }
  for (const order of orders) {
    if (!order.invoiceId || order.orderStatus === "rejected" || order.orderStatus === "cancelled") continue
    const remaining = Math.max(order.total - order.paidAmount, 0)
    if (!remaining) continue
    const age = ageInDays(order.createdAt, now)
    if (age <= 30) result.current += remaining
    else if (age <= 60) result.d31_60 += remaining
    else if (age <= 90) result.d61_90 += remaining
    else result.d90plus += remaining
    result.total += remaining
  }
  return result
}

/** Share of the credit limit in use, as a whole percentage. */
export function creditUsage(outstanding: number, limit: number): number {
  if (limit <= 0) return outstanding > 0 ? 100 : 0
  return Math.round((outstanding / limit) * 100)
}

export const returnAmount = (quantity: number, unitPrice: number) => Math.round(quantity * unitPrice * 100) / 100

/** Applies a credit note to an invoice: the total drops by the returned value and never goes below zero. */
export function applyCreditNote(invoice: Invoice, amount: number): Invoice {
  const total = Math.max(0, invoice.total - amount)
  return { ...invoice, total, paidAmount: Math.min(invoice.paidAmount, total) }
}

/** Quantity to reorder to bring available stock back up to the target level, rounded up to packs of 10. */
export function suggestReorderQty(product: Product, target = 120): number {
  const available = product.stock - product.reserved
  const need = target - available
  return need <= 0 ? 0 : Math.ceil(need / 10) * 10
}

export type StockoutForecast = { product: Product; dailyDemand: number; daysOfCover: number }

/** Days of stock cover per product, from demand over the last `windowDays`. Sorted by soonest stock-out. */
export function forecastStockouts(products: Product[], orders: Order[], now: Date, windowDays = 60): StockoutForecast[] {
  const demand = new Map<string, number>()
  for (const order of orders) {
    if (order.orderStatus === "rejected" || order.orderStatus === "cancelled") continue
    if (ageInDays(order.createdAt, now) > windowDays) continue
    for (const item of order.items) demand.set(item.productId, (demand.get(item.productId) ?? 0) + item.quantity)
  }
  return products
    .flatMap((product) => {
      const total = demand.get(product.id) ?? 0
      if (!total) return []
      const dailyDemand = total / windowDays
      return [{ product, dailyDemand, daysOfCover: Math.max(0, product.stock - product.reserved) / dailyDemand }]
    })
    .sort((a, b) => a.daysOfCover - b.daysOfCover)
}

export type PharmacyTrend = { pharmacy: string; recent: number; previous: number; change: number }

/** Order count per pharmacy in the last 30 days against the 30 days before. */
export function pharmacyTrends(orders: Order[], now: Date): PharmacyTrend[] {
  const map = new Map<string, { recent: number; previous: number }>()
  for (const order of orders) {
    if (order.orderStatus === "rejected" || order.orderStatus === "cancelled") continue
    const age = ageInDays(order.createdAt, now)
    const entry = map.get(order.pharmacy) ?? { recent: 0, previous: 0 }
    if (age <= 30) entry.recent += 1
    else if (age <= 60) entry.previous += 1
    map.set(order.pharmacy, entry)
  }
  return [...map.entries()].map(([pharmacy, { recent, previous }]) => ({
    pharmacy,
    recent,
    previous,
    change: previous ? Math.round(((recent - previous) / previous) * 100) : recent ? 100 : 0,
  })).sort((a, b) => a.change - b.change)
}
