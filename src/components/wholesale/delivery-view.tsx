
import { useMemo, useState } from "react"
import { ArrowUpRight, Check, ChevronDown, Clock3, Map as MapIcon, MapPin, Phone, ReceiptText, ShieldCheck, Truck } from "lucide-react"
import { toast } from "sonner"
import { RouteMapModal } from "./route-map-modal"
import { DeliveryOtpPanel } from "./delivery-otp-panel"
import { CashReceiptModal, DeliveryEvidenceCapture, DriverDaySummary } from "./driver-extras"
import { issueOtp } from "./otp-store"
import { DeliveryProgress, formatCurrency, formatTime, SectionHeading, StatusPill } from "./shared"
import type { DeliveryAgent, DeliveryEvidence, DeliveryStatus, Order } from "./types"

const failureReasons = ["الصيدلية مغلقة", "لا يوجد شخص للاستلام", "رفض الاستلام", "مشكلة في العنوان", "مشكلة في الدفع", "سبب آخر"]

export function DeliveryView({
  orders,
  driverName,
  agents,
  onDriverChange,
  driverId,
  lockedDriver = false,
  onStatusChange,
  onComplete,
  onFail,
  onOpenPharmacy,
}: {
  orders: Order[]
  driverName: string
  agents: DeliveryAgent[]
  onDriverChange: (name: string) => void
  driverId?: string | undefined
  lockedDriver?: boolean
  onStatusChange: (orderId: string, status: DeliveryStatus) => void
  onComplete: (orderId: string, recipient: string, amount: number, method: string, note: string, otpVerified?: boolean, evidence?: DeliveryEvidence) => void
  onFail: (orderId: string, reason: string, note: string) => void
  onOpenPharmacy?: (() => void) | undefined
}) {
  const [proofOrderId, setProofOrderId] = useState<string | null>(null)
  const [otpOrderId, setOtpOrderId] = useState<string | null>(null)
  const [verifiedOrderIds, setVerifiedOrderIds] = useState<string[]>([])
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("نقدًا")
  const [proofNote, setProofNote] = useState("")
  const [evidence, setEvidence] = useState<DeliveryEvidence | undefined>(undefined)
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null)
  const [failureOrderId, setFailureOrderId] = useState<string | null>(null)
  const [failureReason, setFailureReason] = useState(failureReasons[0])
  const [failureNote, setFailureNote] = useState("")
  const [view, setView] = useState<"active" | "failed" | "completed">("active")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [mapFocusId, setMapFocusId] = useState<string | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const assignedOrders = useMemo(() => orders.filter((order) => order.assignedTo === (driverId ?? driverName) && order.orderStatus !== "rejected" && order.orderStatus !== "cancelled"), [orders, driverId, driverName])
  const activeOrders = assignedOrders.filter((order) => order.deliveryStatus !== "delivered" && order.deliveryStatus !== "failed")
  const failedOrders = assignedOrders.filter((order) => order.deliveryStatus === "failed")
  const completedOrders = assignedOrders.filter((order) => order.deliveryStatus === "delivered")
  const deliveries = view === "active" ? activeOrders : view === "failed" ? failedOrders : completedOrders
  const onWay = activeOrders.filter((order) => order.deliveryStatus === "on_way" || order.deliveryStatus === "arrived").length
  const collectionDue = [...activeOrders, ...failedOrders].reduce((sum, order) => sum + Math.max(order.total - order.paidAmount, 0), 0)
  const receiptOrder = orders.find((order) => order.id === receiptOrderId && order.deliveryProof)

  function beginProof(order: Order) {
    setProofOrderId(order.id)
    setRecipient("")
    setAmount(String(Math.max(order.total - order.paidAmount, 0)))
    setProofNote("")
    setEvidence(undefined)
  }

  function requestOtp(order: Order) {
    issueOtp({ orderId: order.id, pharmacy: order.pharmacy, driverName, total: order.total, itemsCount: order.items.length })
    setOtpOrderId(order.id)
  }

  function handleVerified(order: Order) {
    setVerifiedOrderIds((current) => [...current, order.id])
    setOtpOrderId(null)
    beginProof(order)
    setRecipient(order.recipientName ?? "")
  }

  function submitProof(event: React.FormEvent<HTMLFormElement>, order: Order) {
    event.preventDefault()
    const collected = Number(amount)
    if (!recipient.trim() || !Number.isFinite(collected) || collected < 0 || collected > order.total - order.paidAmount) { toast.error("تحقق من اسم المستلم والمبلغ المحصّل"); return }
    if (method === "لم يتم التحصيل" && collected !== 0) { toast.error("اختر مبلغًا صفريًا عند عدم التحصيل"); return }
    if (!evidence) { toast.error("أضف صورة أو توقيع المستلم قبل تأكيد التسليم"); return }
    onComplete(order.id, recipient.trim(), collected, method, proofNote.trim(), verifiedOrderIds.includes(order.id), evidence)
    setReceiptOrderId(order.id)
    setProofOrderId(null)
  }

  function submitFailure(event: React.FormEvent<HTMLFormElement>, order: Order) {
    event.preventDefault()
    onFail(order.id, failureReason ?? "", failureNote.trim())
    setFailureOrderId(null)
    setFailureNote("")
  }

  return (
    <div className="view-stack">
      <div className="driver-hero"><div><span className="eyebrow light-eyebrow">مسارات اليوم · الرياض</span><h2>مرحبًا، {driverName}</h2><p>حدّث مسار التوصيل وسجّل إثبات الاستلام والتحصيل بدقة.</p></div><div className="driver-hero-profile">{lockedDriver ? <div className="driver-profile-switcher"><span>المندوب المسجل</span><strong>{driverName}</strong></div> : <label className="driver-profile-switcher">اختيار الحساب<select value={driverName} onChange={(event) => onDriverChange(event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.name}>{agent.name}</option>)}</select></label>}<div className="driver-avatar" aria-hidden="true">{driverName.charAt(0)}</div></div></div>
      <DriverDaySummary orders={assignedOrders} />
      <div className="driver-stat-grid"><div><span className="driver-stat-icon"><Truck aria-hidden="true" /></span><small>التوصيلات النشطة</small><strong>{activeOrders.length}</strong></div><div><span className="driver-stat-icon amber-icon"><Clock3 aria-hidden="true" /></span><small>في الطريق أو عند الوصول</small><strong>{onWay}</strong></div><div><span className="driver-stat-icon green-icon"><Check aria-hidden="true" /></span><small>مطلوب تحصيله</small><strong>{formatCurrency(collectionDue)}</strong></div></div>
      <SectionHeading eyebrow="قائمة المسار" title={view === "active" ? "توصيلاتي اليوم" : view === "failed" ? "طلبات تعذر تسليمها" : "التوصيلات المكتملة"} description="الطلبات المعروضة مسندة إلى حساب المندوب المحدد." action={<div className="table-actions"><span className="count-badge"><MapPin aria-hidden="true" /> {deliveries.length} طلبات</span>{activeOrders.length > 0 && <button type="button" className="subtle-button" onClick={() => { setMapFocusId(null); setMapOpen(true) }}><MapIcon aria-hidden="true" /> خريطة المسار</button>}</div>} />
      <div className="filter-row delivery-view-tabs" role="tablist" aria-label="تصفية قائمة المندوب">{[{ id: "active", label: "المسار الحالي", count: activeOrders.length }, { id: "failed", label: "تعذر التسليم", count: failedOrders.length }, { id: "completed", label: "مكتملة", count: completedOrders.length }].map((item) => <button key={item.id} role="tab" aria-selected={view === item.id} className={view === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setView(item.id as "active" | "failed" | "completed")}>{item.label} <span className="dispatch-filter-count">{item.count}</span></button>)}</div>
      <div className="delivery-list">{deliveries.map((order, index) => {
        const due = Math.max(order.total - order.paidAmount, 0)
        const nextAction = order.deliveryStatus === null || order.deliveryStatus === "assigned" ? "بدء التوصيل" : order.deliveryStatus === "on_way" ? "تأكيد الوصول" : "تسجيل التسليم"
        return <article className="delivery-card" key={order.id}>
          <div className="delivery-card-top"><div className="delivery-order-id"><span className="route-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{order.id}</strong><small>{order.items.length} أصناف · {formatCurrency(order.total)}</small></div></div><StatusPill tone={order.deliveryStatus === "delivered" ? "green" : order.deliveryStatus === "failed" ? "red" : order.deliveryStatus === "arrived" ? "teal" : order.deliveryStatus === "on_way" ? "violet" : "amber"}>{order.deliveryStatus === "delivered" ? "تم التسليم" : order.deliveryStatus === "failed" ? "تعذر التسليم" : order.deliveryStatus === "on_way" ? "في الطريق" : order.deliveryStatus === "arrived" ? "وصل المندوب" : "بانتظار الاستلام"}</StatusPill></div>
          <DeliveryProgress status={order.deliveryStatus} />
          <div className="delivery-customer"><div className="customer-avatar">{order.pharmacy.slice(6, 7)}</div><div className="delivery-customer-copy"><strong>{order.pharmacy}</strong><span><MapPin aria-hidden="true" />{order.deliveryAddress || order.region}</span><span><Phone aria-hidden="true" />{order.pharmacyPhone}</span>{order.requestedDeliveryWindow && <span><Clock3 aria-hidden="true" />{order.requestedDeliveryWindow}</span>}</div><a className="call-link" href={`tel:${order.pharmacyPhone.replace(/\s/g, "")}`} aria-label={`الاتصال بـ ${order.pharmacy}`} onClick={() => toast.info(`جارٍ الاتصال بـ ${order.pharmacy}`, { description: order.pharmacyPhone })}><Phone aria-hidden="true" /></a></div>
          <button className="order-detail-toggle driver-invoice-toggle" aria-expanded={expandedOrderId === order.id} aria-controls={`delivery-items-${order.id}`} onClick={() => setExpandedOrderId((current) => current === order.id ? null : order.id)}><span>تفاصيل الفاتورة · {order.items.length} أصناف</span><ChevronDown aria-hidden="true" /></button>
          <div id={`delivery-items-${order.id}`} className="pharmacy-order-details" hidden={expandedOrderId !== order.id}><div className="pharmacy-order-items">{order.items.map((item) => <div className="pharmacy-order-item" key={item.productId}><span>{item.name} × {item.quantity}</span><strong>{formatCurrency(item.unitPrice * item.quantity)}</strong></div>)}</div><div className="invoice-line-total"><span>الإجمالي</span><strong>{formatCurrency(order.total)}</strong></div></div>
          <div className="delivery-financials"><div><span>المطلوب تحصيله</span><strong>{formatCurrency(due)}</strong></div><div><span>طريقة الدفع</span><strong>{order.paymentMethod}</strong></div></div>
          {order.deliveryProof && <div className="driver-proof-summary"><Check aria-hidden="true" /><span>استلمها {order.deliveryProof.recipient} · {formatTime(order.deliveryProof.deliveredAt)}</span>{order.deliveryProof.otpVerified && <span className="otp-verified-chip"><ShieldCheck aria-hidden="true" /> موثّق برمز التحقق</span>}{order.deliveryProof.evidence && <span className="evidence-chip">{order.deliveryProof.evidence.type === "photo" ? "صورة مرفقة" : "توقيع مرفق"}</span>}<strong>تم تحصيل {formatCurrency(order.deliveryProof.collectedAmount)}</strong><button type="button" className="subtle-button receipt-open-button" onClick={() => setReceiptOrderId(order.id)}><ReceiptText aria-hidden="true" /> عرض الإيصال</button></div>}
          {otpOrderId === order.id && <DeliveryOtpPanel order={order} driverName={driverName} onVerified={() => handleVerified(order)} onCancel={() => setOtpOrderId(null)} onOpenPharmacy={onOpenPharmacy} />}
          {order.deliveryStatus === "failed" ? <div className="failure-note"><strong>تعذر التسليم</strong><span>{order.rejectionReason ?? "تم تسجيل سبب التعذر"}</span><button className="subtle-button" onClick={() => onStatusChange(order.id, "assigned")}>إعادة المحاولة</button></div> : null}
          {proofOrderId === order.id ? <form className="proof-form" onSubmit={(event) => submitProof(event, order)}><div className="proof-form-heading"><strong>إثبات التسليم والتحصيل</strong><small>إكمال البيانات يسجل التوصيل فقط؛ ويُحدّث الرصيد وفق المبلغ الفعلي.</small>{verifiedOrderIds.includes(order.id) && <span className="otp-verified-chip"><ShieldCheck aria-hidden="true" /> تم التحقق من هوية المستلم برمز الصيدلية</span>}</div><div className="proof-fields"><label className="field-label">اسم المستلم<input required value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="الاسم كما استلم الطلب" /></label><label className="field-label">المبلغ المحصل<input required type="number" min="0" max={due} step="1" value={amount} disabled={method === "لم يتم التحصيل"} onChange={(event) => setAmount(event.target.value)} /><small>المتبقي قبل التوصيل: {formatCurrency(due)}</small></label><label className="field-label">طريقة التحصيل<select value={method} onChange={(event) => { setMethod(event.target.value); if (event.target.value === "لم يتم التحصيل") setAmount("0") }}><option>نقدًا</option><option>تحويل بنكي</option><option>لم يتم التحصيل</option></select></label><label className="field-label">ملاحظة<input value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="اختياري" /></label></div><DeliveryEvidenceCapture value={evidence} onChange={setEvidence} /><div className="form-actions"><button type="button" className="subtle-button" onClick={() => setProofOrderId(null)}>إلغاء</button><button type="submit" className="primary-button"><Check aria-hidden="true" /> تأكيد التسليم وإصدار الإيصال</button></div></form> : null}
          {failureOrderId === order.id ? <form className="proof-form failure-form" onSubmit={(event) => submitFailure(event, order)}><div className="proof-form-heading"><strong>تسجيل تعذر التسليم</strong><small>سيبقى الطلب مفتوحًا بانتظار قرار مسؤول التوصيل.</small></div><div className="proof-fields"><label className="field-label">سبب التعذر<select value={failureReason} onChange={(event) => setFailureReason(event.target.value)}>{failureReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label><label className="field-label">ملاحظة<input value={failureNote} onChange={(event) => setFailureNote(event.target.value)} placeholder="تفاصيل إضافية، إن وجدت" /></label></div><div className="form-actions"><button type="button" className="subtle-button" onClick={() => setFailureOrderId(null)}>إلغاء</button><button type="submit" className="danger-button">حفظ التعذر</button></div></form> : null}
          {!proofOrderId && !failureOrderId && otpOrderId !== order.id && order.deliveryStatus !== "delivered" && order.deliveryStatus !== "failed" && <div className="delivery-actions">{order.deliveryStatus === "arrived" ? <button className="primary-button otp-confirm-button" onClick={() => requestOtp(order)}><ShieldCheck aria-hidden="true" /> تأكيد التسليم برمز التحقق</button> : <button className="primary-button" onClick={() => onStatusChange(order.id, order.deliveryStatus === "on_way" ? "arrived" : "on_way")}>{nextAction}<ArrowUpRight aria-hidden="true" /></button>}<button className="subtle-button" onClick={() => { setFailureOrderId(order.id); setFailureReason(failureReasons[0]) }}>تعذر التسليم</button><button className="route-button" type="button" onClick={() => setMapFocusId(order.id)}><MapIcon aria-hidden="true" /> الخريطة</button></div>}
        </article>
      })}{deliveries.length === 0 && <div className="no-deliveries"><span className="empty-icon"><Truck aria-hidden="true" /></span><strong>{view === "active" ? "لا توجد توصيلات نشطة" : view === "failed" ? "لا توجد حالات تعذر تسليم" : "لا توجد توصيلات مكتملة"}</strong><p>{view === "active" ? `ستظهر هنا الطلبات المسندة إلى ${driverName}.` : view === "failed" ? "تظهر الطلبات المتعثرة هنا حتى إعادة المحاولة." : "ستظهر هنا الطلبات بعد توثيق التسليم."}</p></div>}</div>
      {receiptOrder && <CashReceiptModal order={receiptOrder} driverName={driverName} close={() => setReceiptOrderId(null)} />}
      {(mapOpen || mapFocusId) && <RouteMapModal orders={activeOrders} driverName={driverName} focusId={mapFocusId} onClose={() => { setMapOpen(false); setMapFocusId(null) }} />}
    </div>
  )
}
