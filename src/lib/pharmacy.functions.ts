import { createServerFn } from "@tanstack/react-start"
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware"
import type { Json } from "@/integrations/supabase/types"
import type { CartLine, CheckoutDetails, Order, Pharmacy, Product } from "@/components/wholesale/types"
import { mapOrder, mapProduct, pharmacyErrorMessage, type OrderRow } from "./pharmacy-mappers"

export type PharmacyRegistrationInput = {
  pharmacyName: string
  contactName: string
  phone: string
  region: string
  licenseNumber: string
}

export type PharmacyMutationResult<T> = { ok: true; data: T } | { ok: false; error: string }

type Availability = { id: string; stock: number; reserved: number }
type OrderMutationData = { order: Order; availability: Availability[] }

export type PortalProfile = Pharmacy & { phone: string }
export type PortalData =
  | { profile: null }
  | { profile: PortalProfile; email: string; products: Product[]; orders: Order[] }

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "")

export const getPharmacyPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortalData> => {
    const { supabase, userId, claims } = context
    const { data: profile, error } = await supabase
      .from("pharmacy_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw new Error("تعذر تحميل ملف الصيدلية.")
    if (!profile) return { profile: null }

    const [productsResult, ordersResult] = await Promise.all([
      supabase.from("pharmacy_products").select("*").eq("user_id", userId).order("name", { ascending: true }),
      supabase.from("pharmacy_orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ])
    if (productsResult.error || ordersResult.error) throw new Error("تعذر تحميل بيانات الصيدلية.")
    const orders = (ordersResult.data ?? []).map(mapOrder)

    return {
      email: typeof claims.email === "string" ? claims.email : "",
      profile: {
        id: `PH-${userId.replace(/-/g, "").slice(-8).toUpperCase()}`,
        name: profile.pharmacy_name,
        contact: profile.contact_name,
        phone: profile.phone,
        region: profile.region,
        license: profile.license_number,
        status: "approved",
        balance: 0,
        lastOrder: orders[0]?.createdAt ?? "—",
      },
      products: (productsResult.data ?? []).map(mapProduct),
      orders,
    }
  })

export const completePharmacyRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PharmacyRegistrationInput) => ({
    pharmacyName: text(input?.pharmacyName, 100),
    contactName: text(input?.contactName, 80),
    phone: text(input?.phone, 24),
    region: text(input?.region, 60),
    licenseNumber: text(input?.licenseNumber, 48),
  }))
  .handler(async ({ data, context }): Promise<PharmacyMutationResult<null>> => {
    const { error } = await context.supabase.rpc("complete_pharmacy_registration", {
      p_pharmacy_name: data.pharmacyName,
      p_contact_name: data.contactName,
      p_phone: data.phone,
      p_region: data.region,
      p_license_number: data.licenseNumber,
    })
    if (error) {
      console.error("pharmacy registration failed", { code: error.code })
      return { ok: false, error: pharmacyErrorMessage(error.message, "تعذر حفظ الملف الآن. حاول مرة أخرى.") }
    }
    return { ok: true, data: null }
  })

export const createPharmacyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { cart: CartLine[]; details: CheckoutDetails }) => ({
    cart: Array.isArray(input?.cart)
      ? input.cart.slice(0, 31).map((line) => ({ productId: text(line?.productId, 64), quantity: line?.quantity }))
      : [],
    details: {
      recipientName: text(input?.details?.recipientName, 120),
      phone: text(input?.details?.phone, 40),
      address: text(input?.details?.address, 300),
      deliveryWindow: text(input?.details?.deliveryWindow, 40),
      paymentMethod: text(input?.details?.paymentMethod, 40),
      note: text(input?.details?.note, 400),
    },
  }))
  .handler(async ({ data, context }): Promise<PharmacyMutationResult<OrderMutationData>> => {
    const { data: result, error } = await context.supabase.rpc("create_pharmacy_order", {
      p_cart: data.cart as unknown as Json,
      p_details: data.details as unknown as Json,
    })
    if (error || !result) {
      console.error("pharmacy order failed", { code: error?.code })
      return { ok: false, error: pharmacyErrorMessage(error?.message, "تعذر حفظ الطلب الآن. حاول مرة أخرى.") }
    }
    const payload = result as unknown as { order: OrderRow; availability: Availability[] }
    return { ok: true, data: { order: mapOrder(payload.order), availability: payload.availability } }
  })

export const cancelPharmacyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) => ({ orderId: text(input?.orderId, 64).trim() }))
  .handler(async ({ data, context }): Promise<PharmacyMutationResult<OrderMutationData>> => {
    if (!data.orderId) return { ok: false, error: "الطلب غير متاح." }
    const { data: result, error } = await context.supabase.rpc("cancel_pharmacy_order", { p_order_id: data.orderId })
    if (error || !result) {
      console.error("pharmacy order cancellation failed", { code: error?.code })
      return { ok: false, error: pharmacyErrorMessage(error?.message, "تعذر إلغاء الطلب الآن. حاول مرة أخرى.") }
    }
    const payload = result as unknown as { order: OrderRow; availability: Availability[] }
    return { ok: true, data: { order: mapOrder(payload.order), availability: payload.availability } }
  })
