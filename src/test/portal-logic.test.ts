import { describe, expect, it } from "vitest"
import { buildStatement, cartPricing, discountedPrice, driverDaySummary, offerForProduct, timelineIndex } from "@/components/wholesale/portal-logic"
import type { Invoice, Order } from "@/components/wholesale/types"

const invoice = (id: string, total: number, paidAmount: number, issuedAt: string): Invoice => ({ id, orderId: id.replace("INV", "ORD"), pharmacy: "ص", issuedAt, total, paidAmount, paymentMethod: "نقدًا" })
const order = (id: string, patch: Partial<Order>): Order => ({ id, pharmacy: "ص", pharmacyPhone: "", region: "", items: [], total: 100, orderStatus: "out_for_delivery", deliveryStatus: "on_way", paymentStatus: "unpaid", paymentMethod: "نقدًا", paidAmount: 0, assignedTo: "d", createdAt: "", invoiceId: null, ...patch })

describe("catalog offers", () => {
  it("picks the highest discount for a product", () => {
    expect(offerForProduct("X", [{ code: "A", name: "", percent: 10, minimum: 0, productIds: ["X"] }, { code: "B", name: "", percent: 20, minimum: 0, productIds: ["X"] }])?.code).toBe("B")
    expect(offerForProduct("none")).toBeNull()
  })
  it("applies a percentage discount to the price", () => {
    expect(discountedPrice(80, 15)).toBe(68)
  })
  it("activates a product offer only when the cart reaches its minimum", () => {
    const products = [{ id: "X", price: 100 }, { id: "Y", price: 20 }] as import("@/components/wholesale/types").Product[]
    const offers = [{ code: "A", name: "عرض", percent: 15, minimum: 500, productIds: ["X"] }]
    expect(cartPricing([{ productId: "X", quantity: 4 }], products, offers).total).toBe(400)
    const priced = cartPricing([{ productId: "X", quantity: 4 }, { productId: "Y", quantity: 5 }], products, offers)
    expect(priced.total).toBe(440)
    expect(priced.savings).toBe(60)
  })
})

describe("order timeline", () => {
  it("places delivered at the last step and cancelled off the timeline", () => {
    expect(timelineIndex("delivered")).toBe(5)
    expect(timelineIndex("cancelled")).toBe(-1)
  })
})

describe("account statement", () => {
  it("totals billed, paid and due with a running balance", () => {
    const s = buildStatement([invoice("INV-2", 300, 0, "2026-02-01"), invoice("INV-1", 500, 200, "2026-01-01")])
    expect(s.billed).toBe(800)
    expect(s.paid).toBe(200)
    expect(s.due).toBe(600)
    expect(s.rows.at(-1)?.balance).toBe(600)
  })
})

describe("driver day summary", () => {
  it("counts deliveries and only cash collections as cash", () => {
    const s = driverDaySummary([
      order("A", { deliveryStatus: "delivered", deliveryProof: { recipient: "م", collectedAmount: 100, paymentMethod: "نقدًا", note: "", deliveredAt: "" } }),
      order("B", { deliveryStatus: "delivered", deliveryProof: { recipient: "م", collectedAmount: 50, paymentMethod: "تحويل بنكي", note: "", deliveredAt: "" } }),
      order("C", { deliveryStatus: "assigned" }),
    ])
    expect(s.deliveredCount).toBe(2)
    expect(s.cash).toBe(100)
    expect(s.collected).toBe(150)
  })
})
