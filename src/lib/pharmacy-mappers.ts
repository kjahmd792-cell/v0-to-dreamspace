import type { DeliveryProof, DeliveryStatus, Order, OrderStatus, PaymentStatus, Product } from "@/components/wholesale/types"
import type { Tables } from "@/integrations/supabase/types"

type StoredOrderItem = { productId: string; name: string; quantity: number; unitPriceCents: number }

export type ProductRow = Pick<
  Tables<"pharmacy_products">,
  "id" | "name" | "scientific_name" | "manufacturer" | "category" | "pack" | "price_cents" | "stock" | "reserved" | "expiry" | "code" | "tag"
>
export type OrderRow = Omit<Tables<"pharmacy_orders">, "user_id"> & { user_id?: string }

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name,
    manufacturer: row.manufacturer,
    category: row.category,
    pack: row.pack,
    price: row.price_cents / 100,
    stock: row.stock,
    reserved: row.reserved,
    expiry: row.expiry,
    code: row.code,
    tag: row.tag ?? undefined,
  }
}

export function mapOrder(row: OrderRow): Order {
  const items = (Array.isArray(row.items) ? row.items : []) as unknown as StoredOrderItem[]
  return {
    id: row.id,
    pharmacy: row.pharmacy,
    pharmacyPhone: row.pharmacy_phone,
    region: row.region,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
    })),
    total: row.total_cents / 100,
    orderStatus: row.order_status as OrderStatus,
    deliveryStatus: (row.delivery_status as DeliveryStatus | null) ?? null,
    paymentStatus: row.payment_status as PaymentStatus,
    paymentMethod: row.payment_method,
    paidAmount: row.paid_cents / 100,
    assignedTo: row.assigned_to,
    createdAt: new Date(row.created_at).toISOString(),
    invoiceId: row.invoice_id,
    note: row.note ?? undefined,
    recipientName: row.recipient_name,
    deliveryAddress: row.delivery_address,
    requestedDeliveryWindow: row.requested_delivery_window,
    rejectionReason: row.rejection_reason ?? undefined,
    deliveryProof: (row.delivery_proof as unknown as DeliveryProof | null) ?? undefined,
  }
}

const errorMessages: Record<string, string> = {
  NOT_AUTHENTICATED: "انتهت الجلسة. سجّل الدخول مجددًا.",
  INVALID_PROFILE: "تحقق من بيانات الصيدلية ورقم التواصل والترخيص.",
  INVALID_INPUT: "تحقق من تفاصيل التسليم والكميات المختارة.",
  PROFILE_MISSING: "أكمل ملف الصيدلية قبل إرسال الطلب.",
  STOCK_CHANGED: "تغيرت الكمية المتاحة. حدّث السلة وحاول مرة أخرى.",
  ORDER_NOT_CANCELLABLE: "يمكن إلغاء الطلبات التي ما زالت قيد المراجعة فقط.",
}

/** Maps a database error code raised by the pharmacy functions to the user-facing Arabic message. */
export function pharmacyErrorMessage(rawMessage: string | undefined, fallback: string) {
  if (!rawMessage) return fallback
  const code = Object.keys(errorMessages).find((key) => rawMessage.includes(key))
  return (code && errorMessages[code]) || fallback
}
