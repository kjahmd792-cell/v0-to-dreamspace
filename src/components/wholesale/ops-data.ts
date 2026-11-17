import { demoArchiveOrders, demoOrders, demoProducts } from "./demo-data"
import { DAY_MS } from "./ops-logic"
import type { Product } from "./types"

/** Fixed "today" of the demo data set, so ages and expiry windows stay stable. */
export const DEMO_NOW = new Date("2026-11-13T12:00:00.000Z")
const inDays = (days: number) => new Date(DEMO_NOW.getTime() + days * DAY_MS).toISOString().slice(0, 10)
const daysAgo = (days: number, hour = 9) => new Date(DEMO_NOW.getTime() - days * DAY_MS - (12 - hour) * 3_600_000).toISOString()

// ---------- Batches / expiry ----------
export type BatchStatus = "active" | "discounted" | "returned" | "disposed"
export type Batch = { id: string; productId: string; batchNo: string; expiry: string; quantity: number; location: string; status: BatchStatus }

const nearExpiry: Array<[productId: string, days: number, quantity: number]> = [
  ["MED-1061", -4, 6],
  ["MED-1079", 12, 4],
  ["MED-1078", 21, 5],
  ["MED-2290", 27, 3],
  ["MED-1084", 44, 18],
  ["MED-1065", 52, 14],
  ["MED-1056", 66, 20],
  ["MED-1091", 79, 12],
  ["MED-1187", 85, 22],
]
const shelves = ["A1", "A3", "B2", "B4", "C1", "C3", "D2", "مبرد 1"]
const endOfMonth = (yearMonth: string) => {
  const [y, m] = yearMonth.split("-").map(Number)
  return new Date(Date.UTC(y ?? 2027, m ?? 1, 0)).toISOString().slice(0, 10)
}

export function createDemoBatches(products: Product[] = demoProducts): Batch[] {
  return products.flatMap((product, index) => {
    const near = nearExpiry.find(([id]) => id === product.id)
    const nearQty = near ? Math.min(near[2], product.stock) : 0
    const location = product.tag === "يحفظ مبردًا" ? "مبرد 1" : `المستودع الرئيسي · رف ${shelves[index % shelves.length]}`
    const code = product.id.replace("MED-", "")
    const batches: Batch[] = []
    if (near) batches.push({ id: `BT-${code}-1`, productId: product.id, batchNo: `LT${code}-${String(23 + (index % 3))}A`, expiry: inDays(near[1]), quantity: nearQty, location, status: "active" })
    batches.push({ id: `BT-${code}-2`, productId: product.id, batchNo: `LT${code}-${String(25 + (index % 2))}C`, expiry: endOfMonth(product.expiry), quantity: product.stock - nearQty, location, status: "active" })
    return batches
  })
}

// ---------- Returns ----------
export type ReturnStatus = "pending" | "approved" | "rejected"
export const returnReasons = ["تالف أثناء النقل", "قريب الانتهاء", "خطأ في الصنف", "كمية زائدة", "استدعاء من المصنّع"] as const
export type ReturnReason = (typeof returnReasons)[number]
/** Only correct, sealed stock goes back to sellable inventory; the rest is quarantined. */
export const restockableReasons: ReturnReason[] = ["خطأ في الصنف", "كمية زائدة"]

export type ReturnRequest = {
  id: string
  orderId: string
  invoiceId: string | null
  pharmacy: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  reason: ReturnReason
  note: string
  requestedAt: string
  status: ReturnStatus
  decidedAt?: string | undefined
  decisionNote?: string | undefined
}

const returnSeed: Array<[orderIndex: number, itemIndex: number, quantity: number, reason: ReturnReason, status: ReturnStatus, ageDays: number, note: string]> = [
  [-1, 0, 2, "تالف أثناء النقل", "pending", 0, "عبوتان مكسورتان عند الاستلام"],
  [0, 1, 3, "كمية زائدة", "pending", 1, "طُلبت الكمية بالخطأ"],
  [2, 0, 1, "خطأ في الصنف", "approved", 4, "وصل تركيز مختلف"],
  [4, 0, 2, "قريب الانتهاء", "rejected", 6, "الصلاحية أكثر من 6 أشهر"],
  [6, 1, 4, "استدعاء من المصنّع", "approved", 9, "تشغيلة مشمولة بالاستدعاء"],
]

export const demoReturns: ReturnRequest[] = returnSeed.flatMap(([orderIndex, itemIndex, quantity, reason, status, ageDays, note], index) => {
  const order = orderIndex === -1 ? demoOrders.find((item) => item.id === "ORD-237") : demoArchiveOrders.filter((item) => item.orderStatus === "delivered")[orderIndex]
  const item = order?.items[itemIndex] ?? order?.items[0]
  if (!order || !item) return []
  return [{
    id: `RET-${105 - index}`,
    orderId: order.id,
    invoiceId: order.invoiceId,
    pharmacy: order.pharmacy,
    productId: item.productId,
    productName: item.name,
    quantity: Math.min(quantity, item.quantity),
    unitPrice: item.unitPrice,
    reason,
    note,
    requestedAt: daysAgo(ageDays, 10),
    status,
    ...(status !== "pending" ? { decidedAt: daysAgo(Math.max(0, ageDays - 1), 13), decisionNote: status === "approved" ? "تمت المطابقة مع سند التسليم" : "لا ينطبق عليه شرط الإرجاع" } : {}),
  }]
})

// ---------- Suppliers & purchase orders ----------
export type Supplier = { id: string; name: string; contact: string; phone: string; email: string; manufacturers: string[]; leadDays: number; rating: number; paymentTerms: string }
export const demoSuppliers: Supplier[] = [
  { id: "SUP-01", name: "المتحدة لتوريد الأدوية", contact: "فهد الشمري", phone: "011 400 1100", email: "orders@united-supply.demo", manufacturers: ["GSK", "هاليون", "ريكيت", "UCB"], leadDays: 2, rating: 4.8, paymentTerms: "آجل 60 يومًا" },
  { id: "SUP-02", name: "مستودع النخبة الطبي", contact: "ليلى القرني", phone: "011 400 2200", email: "po@nokhba-med.demo", manufacturers: ["فايزر", "نوفارتس", "باير", "MSD", "ألكون"], leadDays: 3, rating: 4.5, paymentTerms: "آجل 45 يومًا" },
  { id: "SUP-03", name: "الخليج للتوزيع الدوائي", contact: "سامي الغامدي", phone: "013 400 3300", email: "supply@gulf-pharma.demo", manufacturers: ["سانوفي", "أسترازينيكا", "نوفو نورديسك", "ميرك", "جانسن", "ليو فارما"], leadDays: 4, rating: 4.3, paymentTerms: "آجل 30 يومًا" },
  { id: "SUP-04", name: "الوطنية للصناعات الدوائية", contact: "منى الزهراني", phone: "012 400 4400", email: "sales@watania.demo", manufacturers: ["جمجوم فارما", "سبيماكو", "جلفار", "سيجما", "أبوت", "فيتابيوتكس", "إنجلهارد"], leadDays: 2, rating: 4.6, paymentTerms: "آجل 30 يومًا" },
]
export const supplierFor = (product: Product, suppliers: Supplier[] = demoSuppliers) => suppliers.find((supplier) => supplier.manufacturers.includes(product.manufacturer)) ?? suppliers[0]!
export const unitCost = (product: Product) => Math.round(product.price * 0.72 * 100) / 100

export type PurchaseOrderStatus = "sent" | "received" | "cancelled"
export type PurchaseOrderLine = { productId: string; name: string; quantity: number; unitCost: number; received?: number | undefined }
export type PurchaseOrder = { id: string; supplierId: string; lines: PurchaseOrderLine[]; status: PurchaseOrderStatus; createdAt: string; expectedAt: string; receivedAt?: string | undefined; note?: string | undefined }

const poLine = (productId: string, quantity: number, received?: number): PurchaseOrderLine => {
  const product = demoProducts.find((item) => item.id === productId)!
  return { productId, name: product.name, quantity, unitCost: unitCost(product), ...(received !== undefined ? { received } : {}) }
}
export const demoPurchaseOrders: PurchaseOrder[] = [
  { id: "PO-3008", supplierId: "SUP-03", lines: [poLine("MED-1078", 30), poLine("MED-1076", 20)], status: "sent", createdAt: daysAgo(1), expectedAt: inDays(2) },
  { id: "PO-3007", supplierId: "SUP-01", lines: [poLine("MED-1042", 120), poLine("MED-1053", 60), poLine("MED-1080", 40)], status: "received", createdAt: daysAgo(6), expectedAt: daysAgo(4), receivedAt: daysAgo(4, 11) },
  { id: "PO-3006", supplierId: "SUP-04", lines: [poLine("MED-1086", 100), poLine("MED-1187", 80)], status: "received", createdAt: daysAgo(12), expectedAt: daysAgo(10), receivedAt: daysAgo(10, 14) },
]

// ---------- Credit ----------
export type CreditProfile = { pharmacyId: string; limit: number; termsDays: number; frozen: boolean; lastReminder?: string | undefined; reminderChannel?: string | undefined }
export const demoCreditProfiles: CreditProfile[] = [
  { pharmacyId: "PH-1001", limit: 2500, termsDays: 30, frozen: false, lastReminder: daysAgo(8), reminderChannel: "واتساب" },
  { pharmacyId: "PH-1002", limit: 2000, termsDays: 30, frozen: false },
  { pharmacyId: "PH-1003", limit: 1500, termsDays: 15, frozen: false },
  { pharmacyId: "PH-1004", limit: 1800, termsDays: 30, frozen: true, lastReminder: daysAgo(3), reminderChannel: "رسالة نصية" },
]

// ---------- Integrations ----------
export type IntegrationStatus = "connected" | "available"
export type Integration = { id: string; name: string; provider: string; category: string; description: string; status: IntegrationStatus; lastSync?: string | undefined }
export const demoIntegrations: Integration[] = [
  { id: "einvoice", name: "الفوترة الإلكترونية", provider: "بوابة الفوترة الوطنية", category: "الامتثال", description: "إرسال الفواتير الضريبية لحظيًا وإصدار رمز QR المعتمد لكل فاتورة.", status: "connected", lastSync: daysAgo(0, 11) },
  { id: "track", name: "تتبع الأدوية", provider: "نظام رصد المستحضرات", category: "الامتثال", description: "الإبلاغ عن حركة كل عبوة عند الاستلام والبيع والإرجاع حسب الرقم التسلسلي.", status: "connected", lastSync: daysAgo(0, 10) },
  { id: "sms", name: "الرسائل النصية", provider: "مزود رسائل محلي", category: "التواصل", description: "إرسال رموز التحقق وتذكيرات السداد وإشعارات التوصيل للصيدليات.", status: "available" },
  { id: "whatsapp", name: "واتساب للأعمال", provider: "WhatsApp Business API", category: "التواصل", description: "تأكيد الطلبات ومشاركة الفواتير وكشوف الحساب عبر واتساب.", status: "available" },
  { id: "accounting", name: "النظام المحاسبي", provider: "برنامج المحاسبة", category: "المالية", description: "ترحيل الفواتير والتحصيلات والمرتجعات إلى دفتر الأستاذ تلقائيًا.", status: "available" },
  { id: "payments", name: "بوابة الدفع", provider: "مدى · Apple Pay", category: "المالية", description: "روابط دفع إلكترونية للصيدليات وتسوية آلية مع الفواتير.", status: "available" },
  { id: "maps", name: "الخرائط وتتبع المندوبين", provider: "خدمة خرائط", category: "التشغيل", description: "تحسين مسارات التوصيل ومشاركة موقع المندوب مع الصيدلية.", status: "connected", lastSync: daysAgo(0, 9) },
  { id: "erp", name: "تخطيط الموارد", provider: "نظام ERP", category: "التشغيل", description: "مزامنة الأصناف والأسعار وأوامر الشراء مع نظام الشركة الحالي.", status: "available" },
]

// ---------- Activity log ----------
export type ActivityEntry = { id: string; at: string; actor: string; role: string; section: string; action: string }
export const demoActorNames = { owner: "ماجد العتيبي", inventory: "ريم الحربي", orders: "خالد الدوسري", dispatcher: "سارة المطيري", pharmacy: "مها العتيبي" } as const
const seedActivity: Array<[hoursAgo: number, actor: keyof typeof demoActorNames | "driver", section: string, action: string]> = [
  [0.5, "orders", "الطلبات", "استلام طلب جديد ORD-241 من صيدلية الندى التجريبية"],
  [1.5, "orders", "الطلبات", "قبول الطلب ORD-240 وتحويله للتجهيز"],
  [2.2, "inventory", "المخزون", "تعديل سعر جملة فولتارين 50 ملغ"],
  [3, "dispatcher", "التوصيل", "إسناد الطلب ORD-238 إلى عمر السبيعي"],
  [4.5, "driver", "التوصيل", "تسجيل تسليم ORD-237 وتحصيل 100 ر.س"],
  [6, "owner", "الفريق والصلاحيات", "تعديل صلاحيات مسؤول المخزون على التقارير"],
  [8, "inventory", "الصلاحية والتشغيلات", "نقل تشغيلة كلاسيد LT1061-23A إلى الحجر"],
  [20, "orders", "المرتجعات", "قبول المرتجع RET-103 وإصدار إشعار دائن"],
  [26, "owner", "الحدود الائتمانية", "إيقاف ائتمان صيدلية الروضة التجريبية"],
  [30, "inventory", "الموردون", "استلام أمر الشراء PO-3007 من المتحدة لتوريد الأدوية"],
  [48, "owner", "التكاملات", "ربط الخرائط وتتبع المندوبين"],
  [72, "owner", "إعدادات الشركة", "تحديث شروط الدفع إلى آجل 30 يومًا"],
]
export const demoActivity: ActivityEntry[] = seedActivity.map(([hours, actor, section, action], index) => ({
  id: `ACT-${index + 1}`,
  at: new Date(DEMO_NOW.getTime() - hours * 3_600_000).toISOString(),
  actor: actor === "driver" ? "سارة الحربي" : demoActorNames[actor],
  role: { owner: "مالك الشركة", inventory: "مسؤول المخزون", orders: "مسؤول الطلبات", dispatcher: "مسؤول التوصيل", pharmacy: "حساب الصيدلية", driver: "مندوب التوصيل" }[actor],
  section,
  action,
}))
