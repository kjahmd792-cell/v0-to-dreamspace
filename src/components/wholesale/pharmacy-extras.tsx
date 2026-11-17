import { useEffect, useRef, useState } from "react"
import { Check, Heart, KeyRound, LifeBuoy, ListChecks, MessageSquare, Plus, RotateCcw, Send, ShoppingBag, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "./modal"
import { useDeliveryOtps } from "./otp-store"
import { returnReasons, type ReturnReason, type ReturnRequest } from "./ops-data"
import { buildStatement, timelineIndex, timelineSteps } from "./portal-logic"
import type { NewReturn } from "./returns-view"
import { EmptyState, formatCurrency, formatTime, OrderStatusPill, SectionCard, SectionHeading, StatusPill } from "./shared"
import type { CartLine, Invoice, Order, Product } from "./types"

export type ReorderList = { id: string; name: string; lines: CartLine[] }

export function PharmacyFavorites({ products, favorites, lists, cart, onToggleFavorite, onAdd, onSaveList, onUseList, onDeleteList }: {
  products: Product[]; favorites: string[]; lists: ReorderList[]; cart: CartLine[]
  onToggleFavorite: (id: string) => void; onAdd: (id: string) => void
  onSaveList: (name: string) => void; onUseList: (list: ReorderList) => void; onDeleteList: (id: string) => void
}) {
  const [name, setName] = useState("")
  const favoriteProducts = products.filter((product) => favorites.includes(product.id))
  return <div className="view-stack">
    <SectionHeading eyebrow="طلب أسرع" title="المفضلة وقوائم الطلب المتكرر" description="احفظ الأصناف التي تطلبها دائمًا، وأنشئ قوائم جاهزة تضيفها للسلة بضغطة واحدة." />
    <SectionCard title="الأصناف المفضلة" description="أضف أصنافًا من الكتالوج بالضغط على رمز القلب.">
      {favoriteProducts.length === 0 ? <EmptyState icon={Heart} title="لا توجد أصناف مفضلة بعد" description="افتح الكتالوج واضغط على القلب بجانب أي صنف." /> :
        <ul className="portal-list">{favoriteProducts.map((product) => <li key={product.id}><span><strong>{product.name}</strong><small>{product.pack} · {formatCurrency(product.price)}</small></span><span className="portal-list-actions"><button type="button" className="subtle-button" onClick={() => onAdd(product.id)}><Plus aria-hidden="true" /> للسلة</button><button type="button" className="icon-action" aria-label={`إزالة ${product.name} من المفضلة`} onClick={() => onToggleFavorite(product.id)}><X aria-hidden="true" /></button></span></li>)}</ul>}
    </SectionCard>
    <SectionCard title="قوائم الطلب المتكرر" description="احفظ محتوى السلة الحالي كقائمة لتعيد طلبه لاحقًا.">
      <form className="portal-inline-form" onSubmit={(event) => { event.preventDefault(); if (!cart.length) { toast.error("السلة فارغة، أضف أصنافًا أولًا"); return } onSaveList(name.trim() || `قائمة ${lists.length + 1}`); setName("") }}>
        <label className="field-label">اسم القائمة<input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثال: طلب الأسبوع" /></label>
        <button className="primary-button"><ListChecks aria-hidden="true" /> حفظ السلة كقائمة</button>
      </form>
      {lists.length === 0 ? <p className="ops-muted">لا توجد قوائم محفوظة.</p> : <ul className="portal-list">{lists.map((list) => <li key={list.id}><span><strong>{list.name}</strong><small>{list.lines.map((line) => `${products.find((p) => p.id === line.productId)?.name ?? line.productId} × ${line.quantity}`).join("، ")}</small></span><span className="portal-list-actions"><button type="button" className="primary-button" onClick={() => onUseList(list)}><ShoppingBag aria-hidden="true" /> أضف للسلة</button><button type="button" className="icon-action" aria-label={`حذف ${list.name}`} onClick={() => onDeleteList(list.id)}><Trash2 aria-hidden="true" /></button></span></li>)}</ul>}
    </SectionCard>
  </div>
}

function OrderTimeline({ order }: { order: Order }) {
  const current = timelineIndex(order.orderStatus)
  if (current < 0) return <div className="timeline-stopped"><StatusPill tone="red">{order.orderStatus === "cancelled" ? "أُلغي الطلب" : "رُفض الطلب"}</StatusPill>{order.rejectionReason && <span>{order.rejectionReason}</span>}</div>
  return <ol className="order-timeline">{timelineSteps.map((step, index) => <li key={step.status} className={index < current ? "done" : index === current ? "current" : ""}><span className="timeline-dot">{index <= current ? <Check aria-hidden="true" /> : index + 1}</span><span className="timeline-label">{step.label}</span></li>)}</ol>
}

export function PharmacyTracking({ orders, returns, onRequestReturn }: { orders: Order[]; returns: ReturnRequest[]; onRequestReturn: (request: NewReturn) => void }) {
  const otps = useDeliveryOtps()
  const [returnOrder, setReturnOrder] = useState<Order | null>(null)
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [reason, setReason] = useState<ReturnReason>(returnReasons[0])
  const [note, setNote] = useState("")
  const now = Date.now()
  function open(order: Order) { setReturnOrder(order); setProductId(order.items[0]?.productId ?? ""); setQuantity("1"); setReason(returnReasons[0]); setNote("") }
  const item = returnOrder?.items.find((line) => line.productId === productId)
  return <div className="view-stack">
    <SectionHeading eyebrow="متابعة لحظية" title="تتبع الطلبات" description="مراحل كل طلب، ورمز التحقق الذي تعطيه للمندوب عند الاستلام." />
    {orders.length === 0 && <EmptyState title="لا توجد طلبات" description="ستظهر طلباتك هنا بعد إرسالها." />}
    {orders.map((order) => {
      const otp = otps.find((entry) => entry.orderId === order.id && entry.status === "pending" && entry.expiresAt > now)
      const orderReturns = returns.filter((entry) => entry.orderId === order.id)
      return <article className="tracking-card" key={order.id}>
        <header className="tracking-head"><div><strong>{order.id}</strong><small>{formatTime(order.createdAt)} · {order.items.length} أصناف · {formatCurrency(order.total)}</small></div><OrderStatusPill status={order.orderStatus} /></header>
        <OrderTimeline order={order} />
        {otp && <div className="tracking-otp" role="status"><KeyRound aria-hidden="true" /><span>رمز التحقق للتسليم — أعطه للمندوب {otp.driverName} فقط عند استلام الطلب</span><strong dir="ltr">{otp.code}</strong></div>}
        {order.deliveryProof && <p className="ops-muted">استلمه {order.deliveryProof.recipient} · {formatTime(order.deliveryProof.deliveredAt)}{order.deliveryProof.otpVerified ? " · موثّق برمز التحقق" : ""}</p>}
        {orderReturns.length > 0 && <ul className="tracking-returns">{orderReturns.map((entry) => <li key={entry.id}><RotateCcw aria-hidden="true" />{entry.id} · {entry.productName} × {entry.quantity}<StatusPill tone={entry.status === "approved" ? "green" : entry.status === "rejected" ? "red" : "amber"}>{entry.status === "approved" ? "مقبول" : entry.status === "rejected" ? "مرفوض" : "قيد المراجعة"}</StatusPill></li>)}</ul>}
        {order.orderStatus === "delivered" && <div className="tracking-actions"><button type="button" className="subtle-button" onClick={() => open(order)}><RotateCcw aria-hidden="true" /> طلب إرجاع</button></div>}
      </article>
    })}
    {returnOrder && <Modal title={`طلب إرجاع من ${returnOrder.id}`} close={() => setReturnOrder(null)}>
      <form className="fa-form" onSubmit={(event) => {
        event.preventDefault()
        const qty = Number(quantity)
        if (!item || !Number.isInteger(qty) || qty < 1 || qty > item.quantity) { toast.error(`الكمية يجب أن تكون بين 1 و${item?.quantity ?? 1}`); return }
        onRequestReturn({ orderId: returnOrder.id, invoiceId: returnOrder.invoiceId, pharmacy: returnOrder.pharmacy, productId: item.productId, productName: item.name, quantity: qty, unitPrice: item.unitPrice, reason, note: note.trim() })
        setReturnOrder(null)
      }}>
        <div className="fa-grid">
          <label className="field-label">الصنف<select value={productId} onChange={(event) => setProductId(event.target.value)}>{returnOrder.items.map((line) => <option key={line.productId} value={line.productId}>{line.name} (المستلم {line.quantity})</option>)}</select></label>
          <label className="field-label">الكمية<input type="number" min="1" max={item?.quantity ?? 1} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          <label className="field-label">السبب<select value={reason} onChange={(event) => setReason(event.target.value as ReturnReason)}>{returnReasons.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="field-label">ملاحظة<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="اختياري" /></label>
        </div>
        {item && <p className="ops-muted">قيمة المرتجع التقديرية: {formatCurrency(item.unitPrice * (Number(quantity) || 0))}</p>}
        <button className="primary-button">إرسال طلب الإرجاع</button>
      </form>
    </Modal>}
  </div>
}

type Ticket = { id: string; subject: string; category: string; status: "open" | "answered" | "closed"; messages: Array<{ from: "pharmacy" | "support"; text: string; at: string }> }
const seedTickets: Ticket[] = [{ id: "TCK-1021", subject: "تأخر توصيل طلب الأسبوع الماضي", category: "التوصيل", status: "answered", messages: [
  { from: "pharmacy", text: "تأخر الطلب ORD-236 ساعتين عن الموعد.", at: new Date(Date.now() - 864e5).toISOString() },
  { from: "support", text: "نعتذر عن التأخير، تمت إعادة جدولة مسار المندوب وسيصل الطلب القادم في الموعد.", at: new Date(Date.now() - 8e7).toISOString() },
] }]

export function PharmacySupport() {
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets)
  const [selectedId, setSelectedId] = useState<string | null>(seedTickets[0]!.id)
  const [creating, setCreating] = useState(false)
  const [reply, setReply] = useState("")
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null
  function scheduleReply(id: string) {
    timers.current.push(window.setTimeout(() => setTickets((all) => all.map((ticket) => ticket.id === id ? { ...ticket, status: "answered", messages: [...ticket.messages, { from: "support", text: "شكرًا لتواصلك، استلم فريق الدعم طلبك وسيتابع معك خلال ساعات العمل.", at: new Date().toISOString() }] } : ticket)), 2500))
  }
  function send(event: React.FormEvent) {
    event.preventDefault()
    if (!selected || !reply.trim()) return
    setTickets((all) => all.map((ticket) => ticket.id === selected.id ? { ...ticket, status: "open", messages: [...ticket.messages, { from: "pharmacy", text: reply.trim(), at: new Date().toISOString() }] } : ticket))
    setReply("")
    scheduleReply(selected.id)
  }
  const statusPill = (status: Ticket["status"]) => <StatusPill tone={status === "answered" ? "green" : status === "closed" ? "neutral" : "amber"}>{status === "answered" ? "تم الرد" : status === "closed" ? "مغلقة" : "بانتظار الرد"}</StatusPill>
  return <div className="view-stack">
    <SectionHeading eyebrow="نحن هنا للمساعدة" title="الدعم والتذاكر" description="افتح تذكرة لأي مشكلة في طلب أو فاتورة أو توصيل، وتابع رد الفريق هنا." action={<button className="primary-button" onClick={() => setCreating(true)}><Plus aria-hidden="true" /> تذكرة جديدة</button>} />
    <div className="support-layout">
      <ul className="support-list">{tickets.map((ticket) => <li key={ticket.id}><button type="button" className={ticket.id === selectedId ? "support-item active" : "support-item"} onClick={() => setSelectedId(ticket.id)}><span><strong>{ticket.subject}</strong><small>{ticket.id} · {ticket.category}</small></span>{statusPill(ticket.status)}</button></li>)}</ul>
      {selected ? <section className="support-thread">
        <header className="tracking-head"><div><strong>{selected.subject}</strong><small>{selected.id} · {selected.category}</small></div>{selected.status !== "closed" ? <button className="subtle-button" onClick={() => setTickets((all) => all.map((ticket) => ticket.id === selected.id ? { ...ticket, status: "closed" } : ticket))}>إغلاق التذكرة</button> : statusPill("closed")}</header>
        <div className="support-messages">{selected.messages.map((message, index) => <div key={index} className={`assistant-message from-${message.from === "pharmacy" ? "user" : "bot"}`}><span className="assistant-avatar">{message.from === "pharmacy" ? <MessageSquare aria-hidden="true" /> : <LifeBuoy aria-hidden="true" />}</span><div className="assistant-bubble"><p>{message.text}</p><small>{formatTime(message.at)}</small></div></div>)}</div>
        {selected.status !== "closed" && <form className="assistant-input" onSubmit={send}><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="اكتب ردك..." aria-label="رد على التذكرة" /><button className="primary-button" disabled={!reply.trim()} aria-label="إرسال"><Send aria-hidden="true" /></button></form>}
      </section> : <EmptyState icon={LifeBuoy} title="اختر تذكرة" description="أو افتح تذكرة جديدة." />}
    </div>
    {creating && <Modal title="تذكرة دعم جديدة" close={() => setCreating(false)}>
      <form className="fa-form" onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const id = `TCK-${1022 + tickets.length}`
        setTickets((all) => [{ id, subject: String(data.get("subject")).trim(), category: String(data.get("category")), status: "open", messages: [{ from: "pharmacy", text: String(data.get("message")).trim(), at: new Date().toISOString() }] }, ...all])
        setSelectedId(id); setCreating(false); scheduleReply(id); toast.success(`تم فتح التذكرة ${id}`)
      }}>
        <label className="field-label">الموضوع<input name="subject" required /></label>
        <label className="field-label">التصنيف<select name="category"><option>الطلبات</option><option>الفواتير والمدفوعات</option><option>التوصيل</option><option>المرتجعات</option><option>أخرى</option></select></label>
        <label className="field-label">التفاصيل<textarea name="message" rows={4} required /></label>
        <button className="primary-button">فتح التذكرة</button>
      </form>
    </Modal>}
  </div>
}

export function PharmacyStatement({ invoices, creditLimit }: { invoices: Invoice[]; creditLimit?: number | undefined }) {
  const statement = buildStatement(invoices)
  return <div className="view-stack">
    <SectionHeading eyebrow="المالية" title="كشف الحساب" description="الرصيد المستحق والمدفوعات وكل الفواتير بترتيب زمني." action={<button className="subtle-button" onClick={() => window.print()}>طباعة الكشف</button>} />
    <div className="summary-strip"><div><span>إجمالي الفواتير</span><strong>{formatCurrency(statement.billed)}</strong></div><div><span>المدفوعات</span><strong>{formatCurrency(statement.paid)}</strong></div><div><span>المستحق</span><strong>{formatCurrency(statement.due)}</strong></div>{creditLimit !== undefined && <div><span>المتاح من الحد الائتماني</span><strong>{formatCurrency(Math.max(0, creditLimit - statement.due))}</strong></div>}</div>
    <SectionCard title="الحركات">
      {statement.rows.length === 0 ? <EmptyState title="لا توجد حركات" description="ستظهر الفواتير والمدفوعات هنا." /> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>التاريخ</th><th>المرجع</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>{statement.rows.map((row, index) => <tr key={index}><td>{formatTime(row.date)}</td><td dir="ltr">{row.ref}</td><td>{row.label}</td><td>{row.debit ? formatCurrency(row.debit) : "—"}</td><td>{row.credit ? formatCurrency(row.credit) : "—"}</td><td><strong>{formatCurrency(row.balance)}</strong></td></tr>)}</tbody></table></div>}
    </SectionCard>
  </div>
}
