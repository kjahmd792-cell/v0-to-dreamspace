
import { useMemo, useState } from "react"
import { Check, Clock3, Inbox, MapPin, Phone, Search, Send, Truck, UserRound, X } from "lucide-react"
import { DeliveryProgress, formatCurrency, formatTime, OrderStatusPill, SectionHeading, StatusPill } from "./shared"
import type { DeliveryAgent, Order } from "./types"

type DispatchFilter = "incoming" | "active" | "failed" | "delivered"

const filterLabels: Array<{ id: DispatchFilter; label: string }> = [
  { id: "incoming", label: "فواتير واردة بانتظار الإسناد" },
  { id: "active", label: "قيد التوصيل" },
  { id: "failed", label: "تعذر التسليم" },
  { id: "delivered", label: "تم التسليم" },
]

const agentStatusLabel: Record<DeliveryAgent["status"], string> = { available: "متاح", busy: "مشغول", offline: "غير متصل" }
const isIncoming = (order: Order) => order.deliveryStatus === null && !["rejected", "cancelled", "delivered"].includes(order.orderStatus)
const isActive = (order: Order) => ["assigned", "on_way", "arrived"].includes(order.deliveryStatus ?? "")

export function CompanyDispatchView({
  orders,
  agents,
  onAssign,
}: {
  orders: Order[]
  agents: DeliveryAgent[]
  onAssign: (orderId: string, agentId: string) => void
}) {
  const [filter, setFilter] = useState<DispatchFilter>("incoming")
  const [query, setQuery] = useState("")
  const [pickerOrderId, setPickerOrderId] = useState<string | null>(null)
  const [pickedAgentId, setPickedAgentId] = useState<string>("")

  const counts: Record<DispatchFilter, number> = {
    incoming: orders.filter(isIncoming).length,
    active: orders.filter(isActive).length,
    failed: orders.filter((order) => order.deliveryStatus === "failed").length,
    delivered: orders.filter((order) => order.deliveryStatus === "delivered").length,
  }

  const agentLoad = useMemo(() => Object.fromEntries(agents.map((agent) => [agent.id, orders.filter((order) => order.assignedTo === agent.id && isActive(order)).length])), [agents, orders])

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.pharmacy} ${order.region} ${order.assignedTo ?? ""}`.includes(query.trim())
    const matchesFilter = filter === "incoming" ? isIncoming(order) : filter === "active" ? isActive(order) : filter === "failed" ? order.deliveryStatus === "failed" : order.deliveryStatus === "delivered"
    return matchesQuery && matchesFilter
  }), [orders, query, filter])

  const availableAgents = agents.filter((agent) => agent.status !== "offline")
  const pickerOrder = orders.find((order) => order.id === pickerOrderId)

  function openPicker(order: Order) {
    setPickerOrderId(order.id)
    setPickedAgentId(order.assignedTo ?? "")
  }

  function confirmAssign() {
    if (!pickerOrderId || !pickedAgentId) return
    onAssign(pickerOrderId, pickedAgentId)
    setPickerOrderId(null)
    setPickedAgentId("")
  }

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="إدارة التوصيل"
        title="الإسناد والتوصيل"
        description="تصل فواتير الصيدليات هنا أولًا، ثم يختار المدير المندوب المناسب لإرسالها إليه."
        action={<span className="count-badge"><UserRound aria-hidden="true" /> {availableAgents.length} مندوبين متاحين</span>}
      />

      <div className="summary-strip">
        <div><span>بانتظار الإسناد</span><strong>{counts.incoming}</strong></div>
        <div><span>قيد التوصيل</span><strong>{counts.active}</strong></div>
        <div><span>تعذر التسليم</span><strong>{counts.failed}</strong></div>
        <div><span>تم التسليم</span><strong>{counts.delivered}</strong></div>
      </div>

      <section className="agent-roster" aria-label="فريق المندوبين">
        {agents.map((agent) => (
          <div key={agent.id} className={`agent-roster-card is-${agent.status}`}>
            <span className="agent-avatar">{agent.name.slice(0, 1)}</span>
            <div><strong>{agent.name}</strong><small>{agent.region} · {agent.phone}</small></div>
            <div className="agent-roster-meta"><span className={`agent-dot is-${agent.status}`} />{agentStatusLabel[agent.status]}<em>{agentLoad[agent.id] ?? 0} طلبات نشطة</em></div>
          </div>
        ))}
      </section>

      <section className="section-card" aria-label="قائمة عمليات التوصيل">
        <div className="section-card-head dispatch-heading">
          <div><h3>متابعة الطلبات</h3><p>اختر المندوب لكل فاتورة؛ لن تظهر عند المندوب قبل إسنادها.</p></div>
          <label className="search-control"><Search aria-hidden="true" /><span className="sr-only">بحث في التوصيل</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الطلب أو الصيدلية" /></label>
        </div>
        <div className="filter-row" role="tablist" aria-label="تصفية التوصيلات">
          {filterLabels.map((item) => <button key={item.id} role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item.id)}>{item.label}<span className="dispatch-filter-count">{counts[item.id]}</span></button>)}
        </div>

        <div className="dispatch-list">
          {visibleOrders.map((order) => {
            const canAssign = filter === "incoming" || filter === "failed" || order.deliveryStatus === "assigned"
            const agent = agents.find((item) => item.id === order.assignedTo)
            return (
              <article className={filter === "incoming" ? "dispatch-card is-incoming" : "dispatch-card"} key={order.id}>
                <div className="dispatch-card-head">
                  <div className="dispatch-order-title"><span className="table-id">{order.id}</span><small>{formatTime(order.createdAt)}</small>{filter === "incoming" && <span className="incoming-tag"><Inbox aria-hidden="true" /> فاتورة جديدة من الصيدلية</span>}</div>
                  <div className="dispatch-badges"><OrderStatusPill status={order.orderStatus} />{order.deliveryStatus === "failed" ? <StatusPill tone="red">تعذر التسليم</StatusPill> : order.deliveryStatus && <StatusPill tone={order.deliveryStatus === "delivered" ? "green" : "violet"}>{order.deliveryStatus === "delivered" ? "تم التسليم" : order.deliveryStatus === "assigned" ? "تم الإسناد" : order.deliveryStatus === "on_way" ? "في الطريق" : "وصل المندوب"}</StatusPill>}</div>
                </div>

                <div className="dispatch-details">
                  <div><span>الصيدلية</span><strong>{order.pharmacy}</strong><small><MapPin aria-hidden="true" /> {order.deliveryAddress || order.region}</small></div>
                  <div><span>الفاتورة</span><strong>{formatCurrency(order.total)}</strong><small>{order.items.length} أصناف · {order.items.reduce((sum, item) => sum + item.quantity, 0)} وحدة</small></div>
                  <div><span>التواصل</span><span className="dispatch-phone"><Phone aria-hidden="true" /> {order.pharmacyPhone}</span><small>المطلوب تحصيله: {formatCurrency(Math.max(order.total - order.paidAmount, 0))}</small></div>
                </div>

                {order.deliveryStatus && order.deliveryStatus !== "failed" && <DeliveryProgress status={order.deliveryStatus} />}
                {order.deliveryStatus === "failed" && <div className="dispatch-exception"><strong>تعذر التسليم</strong><span>{order.rejectionReason ?? "لم يُسجل سبب إضافي."}</span></div>}
                {order.deliveryStatus === "delivered" && order.deliveryProof && <div className="dispatch-proof"><Check aria-hidden="true" /><span>استلمها {order.deliveryProof.recipient} · {formatTime(order.deliveryProof.deliveredAt)}</span><strong>حُصّل {formatCurrency(order.deliveryProof.collectedAmount)}</strong></div>}

                <div className="dispatch-card-foot">
                  <div className="dispatch-agent-summary">
                    <span className="dispatch-agent-icon"><Truck aria-hidden="true" /></span>
                    <div><small>{order.assignedTo ? "المندوب المسند" : "لم يُسند بعد"}</small><strong>{agent?.name ?? "بانتظار اختيار المدير"}</strong></div>
                    {agent && <span className="dispatch-agent-region">{agent.region}</span>}
                  </div>
                  {canAssign && <button className="primary-button" onClick={() => openPicker(order)}><Send aria-hidden="true" />{order.deliveryStatus === "failed" ? "إعادة الإسناد" : order.deliveryStatus === "assigned" ? "تغيير المندوب" : "اختيار مندوب وإرسال"}</button>}
                  {!canAssign && order.deliveryStatus !== "delivered" && <div className="dispatch-agent-state"><Clock3 aria-hidden="true" /> جارٍ التوصيل</div>}
                </div>
              </article>
            )
          })}
          {visibleOrders.length === 0 && <div className="dispatch-empty"><span className="empty-icon"><Truck aria-hidden="true" /></span><strong>لا توجد طلبات في هذا القسم</strong><p>ستظهر فواتير الصيدليات الجديدة هنا فور إرسالها.</p></div>}
        </div>
      </section>

      {pickerOrder && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPickerOrderId(null)}>
          <div className="detail-modal agent-picker" role="dialog" aria-modal="true" aria-labelledby="agent-picker-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div><span className="eyebrow">إسناد الفاتورة {pickerOrder.id}</span><h2 id="agent-picker-title">اختر المندوب المسؤول</h2><p className="agent-picker-sub">{pickerOrder.pharmacy} · {formatCurrency(pickerOrder.total)}</p></div>
              <button className="icon-action" aria-label="إغلاق" onClick={() => setPickerOrderId(null)}><X aria-hidden="true" /></button>
            </div>
            <div className="agent-picker-list" role="radiogroup" aria-label="المندوبون">
              {agents.map((agent) => {
                const disabled = agent.status === "offline"
                const selected = pickedAgentId === agent.id
                return (
                  <button key={agent.id} type="button" role="radio" aria-checked={selected} disabled={disabled} className={selected ? "agent-option selected" : "agent-option"} onClick={() => setPickedAgentId(agent.id)}>
                    <span className="agent-avatar">{agent.name.slice(0, 1)}</span>
                    <span className="agent-option-copy"><strong>{agent.name}</strong><small>{agent.region} · {agentLoad[agent.id] ?? 0} طلبات نشطة</small></span>
                    <span className={`agent-status-tag is-${agent.status}`}>{agentStatusLabel[agent.status]}</span>
                    <span className="agent-radio" aria-hidden="true">{selected && <Check />}</span>
                  </button>
                )
              })}
            </div>
            <div className="agent-picker-actions">
              <button className="secondary-action" onClick={() => setPickerOrderId(null)}>إلغاء</button>
              <button className="primary-button" disabled={!pickedAgentId} onClick={confirmAssign}><Send aria-hidden="true" /> إرسال للمندوب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
