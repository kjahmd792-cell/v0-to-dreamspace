import { describe, expect, it } from "vitest"
import { mapOrder, mapProduct, pharmacyErrorMessage } from "@/lib/pharmacy-mappers"

describe("pharmacy mappers", () => {
  it("converts stored cents to the displayed price", () => {
    const product = mapProduct({
      id: "MED-1042", name: "بنادول", scientific_name: "Paracetamol", manufacturer: "GSK", category: "c", pack: "p",
      price_cents: 1250, stock: 10, reserved: 2, expiry: "2027-08", code: "62800001042", tag: null,
    })
    expect(product.price).toBe(12.5)
    expect(product.tag).toBeUndefined()
  })

  it("converts order item prices and totals from cents", () => {
    const order = mapOrder({
      id: "ORD-1", pharmacy: "ص", pharmacy_phone: "0500000000", region: "الرياض",
      items: [{ productId: "MED-1042", name: "بنادول", quantity: 3, unitPriceCents: 1200 }],
      total_cents: 3600, order_status: "pending", delivery_status: null, payment_status: "unpaid",
      payment_method: "آجل", paid_cents: 0, assigned_to: null, created_at: "2026-11-16T01:00:00Z", invoice_id: null,
      note: null, recipient_name: "مها", delivery_address: "حي الندى، الرياض", requested_delivery_window: "أي وقت",
      rejection_reason: null, delivery_proof: null,
    })
    expect(order.total).toBe(36)
    expect(order.items[0]?.unitPrice).toBe(12)
  })

  it("shows the stock-changed message when the database reports oversold stock", () => {
    expect(pharmacyErrorMessage("STOCK_CHANGED", "fallback")).toBe("تغيرت الكمية المتاحة. حدّث السلة وحاول مرة أخرى.")
    expect(pharmacyErrorMessage("something else", "fallback")).toBe("fallback")
  })
})
