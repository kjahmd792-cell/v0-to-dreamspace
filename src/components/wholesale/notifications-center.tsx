import { useEffect, useState } from "react"
import { Bell, CalendarClock, CircleDollarSign, ClipboardList, PackageMinus, RotateCcw, Truck, X, type LucideIcon } from "lucide-react"
import { DEMO_NOW, type Batch, type ReturnRequest } from "./ops-data"
import { ageInDays, daysUntil } from "./ops-logic"
import { formatCurrency } from "./shared"
import type { Order, Product } from "./types"

export type NotificationKind = "stock" | "order" | "late" | "failed" | "invoice" | "expiry" | "return"
export type NotificationTab = "inventory" | "orders" | "deliveries" | "credit" | "expiry" | "returns"
export type AppNotification = { id: string; kind: NotificationKind; title: string; detail: string; tab: NotificationTab; at: string }

const kindMeta: Record<NotificationKind, { icon: LucideIcon; tone: string; label: string }> = {
  stock: { icon: PackageMinus, tone: "amber", label: "مخزون منخفض" },
  order: { icon: ClipboardList, tone: "blue", label: "طلب جديد" },
  late: { icon: Truck, tone: "violet", label: "تسليم متأخر" },
  failed: { icon: Truck, tone: "red", label: "تعذر التسليم" },
  invoice: { icon: CircleDollarSign, tone: "red", label: "فاتورة مستحقة" },
  expiry: { icon: CalendarClock, tone: "amber", label: "صلاحية" },
  return: { icon: RotateCcw, tone: "teal", label: "مرتجع" },
}

export function buildNotifications({ products, orders, allOrders, batches, returns }: { products: Product[]; orders: Order[]; allOrders: Order[]; batches: Batch[]; returns: ReturnRequest[] }): AppNotification[] {
  const list: AppNotification[] = []
  const nowIso = DEMO_NOW.toISOString()
  for (const order of orders) {
    if (order.orderStatus === "pending") list.push({ id: `order-${order.id}`, kind: "order", title: `طلب جديد ${order.id}`, detail: `${order.pharmacy} · ${formatCurrency(order.total)}`, tab: "orders", at: order.createdAt })
    if (order.deliveryStatus === "failed") list.push({ id: `failed-${order.id}`, kind: "failed", title: `تعذر تسليم ${order.id}`, detail: order.rejectionReason ?? order.pharmacy, tab: "deliveries", at: order.createdAt })
    if (order.orderStatus === "out_for_delivery" && (DEMO_NOW.getTime() - new Date(order.createdAt).getTime()) / 3_600_000 >= 3) list.push({ id: `late-${order.id}`, kind: "late", title: `تأخر تسليم ${order.id}`, detail: `خرج منذ أكثر من 3 ساعات · ${order.pharmacy}`, tab: "deliveries", at: order.createdAt })
  }
  for (const product of products) {
    const available = product.stock - product.reserved
    if (available < 15) list.push({ id: `stock-${product.id}`, kind: "stock", title: `مخزون منخفض: ${product.name}`, detail: `المتاح ${available} عبوة فقط`, tab: "inventory", at: nowIso })
  }
  const productName = new Map(products.map((product) => [product.id, product.name]))
  for (const batch of batches) {
    if (batch.status !== "active" || !batch.quantity) continue
    const days = daysUntil(batch.expiry, DEMO_NOW)
    if (days <= 30) list.push({ id: `expiry-${batch.id}`, kind: "expiry", title: days < 0 ? `تشغيلة منتهية: ${productName.get(batch.productId)}` : `تنتهي خلال ${days} يومًا: ${productName.get(batch.productId)}`, detail: `${batch.batchNo} · ${batch.quantity} عبوة`, tab: "expiry", at: nowIso })
  }
  for (const item of returns) if (item.status === "pending") list.push({ id: `return-${item.id}`, kind: "return", title: `طلب إرجاع ${item.id}`, detail: `${item.pharmacy} · ${item.productName} × ${item.quantity}`, tab: "returns", at: item.requestedAt })
  const overdue = allOrders.filter((order) => order.invoiceId && order.total > order.paidAmount && ageInDays(order.createdAt, DEMO_NOW) > 30 && order.orderStatus === "delivered").sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 4)
  for (const order of overdue) list.push({ id: `invoice-${order.invoiceId}`, kind: "invoice", title: `فاتورة مستحقة ${order.invoiceId}`, detail: `${order.pharmacy} · متبقٍ ${formatCurrency(order.total - order.paidAmount)} منذ ${ageInDays(order.createdAt, DEMO_NOW)} يومًا`, tab: "credit", at: order.createdAt })
  return list.sort((a, b) => b.at.localeCompare(a.at))
}

const relative = (iso: string) => {
  const minutes = Math.max(0, Math.round((DEMO_NOW.getTime() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return minutes <= 1 ? "الآن" : `منذ ${minutes} دقيقة`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${Math.round(hours / 24)} يومًا`
}

export function NotificationCenter({ items, readIds, onOpen, onMarkAll }: { items: AppNotification[]; readIds: string[]; onOpen: (item: AppNotification) => void; onMarkAll: () => void }) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const unread = items.filter((item) => !readIds.includes(item.id))
  const visible = filter === "unread" ? unread : items
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  return <>
    <button type="button" className="notif-bell" aria-label={`مركز التنبيهات، ${unread.length} غير مقروءة`} aria-expanded={open} onClick={() => setOpen(true)}><Bell aria-hidden="true" />{unread.length > 0 && <span className="notif-count">{unread.length > 99 ? "99+" : unread.length}</span>}</button>
    {open && <div className="notif-backdrop" onClick={() => setOpen(false)}>
      <aside className="notif-panel" role="dialog" aria-modal="true" aria-label="مركز التنبيهات" onClick={(event) => event.stopPropagation()}>
        <header className="notif-head"><div><span className="eyebrow">مركز التنبيهات</span><h2>{unread.length} تنبيهات غير مقروءة</h2></div><button type="button" className="icon-action" aria-label="إغلاق" onClick={() => setOpen(false)}><X aria-hidden="true" /></button></header>
        <div className="notif-toolbar"><div className="filter-row" role="tablist" aria-label="تصفية التنبيهات">{([["all", `الكل (${items.length})`], ["unread", `غير المقروءة (${unread.length})`]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(id)}>{label}</button>)}</div><button type="button" className="subtle-button" disabled={!unread.length} onClick={onMarkAll}>تحديد الكل كمقروء</button></div>
        <ul className="notif-list">{visible.map((item) => { const meta = kindMeta[item.kind]; const Icon = meta.icon; const isRead = readIds.includes(item.id); return <li key={item.id}><button type="button" className={isRead ? "notif-item read" : "notif-item"} onClick={() => { onOpen(item); setOpen(false) }}><span className={`notif-icon metric-${meta.tone === "red" ? "amber" : meta.tone}`}><Icon aria-hidden="true" /></span><span className="notif-copy"><small>{meta.label} · {relative(item.at)}</small><strong>{item.title}</strong><span>{item.detail}</span></span>{!isRead && <span className="notif-unread" aria-label="غير مقروء" />}</button></li> })}</ul>
        {visible.length === 0 && <div className="table-empty">لا توجد تنبيهات {filter === "unread" ? "غير مقروءة" : ""}.</div>}
      </aside>
    </div>}
  </>
}
