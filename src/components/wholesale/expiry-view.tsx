import { useMemo, useState } from "react"
import { AlertTriangle, CalendarClock, PackageX, Search, ShieldAlert, Tag, Trash2, Undo2 } from "lucide-react"
import { Modal } from "./modal"
import { DEMO_NOW, type Batch, type BatchStatus } from "./ops-data"
import { daysUntil, expiryBucket, type ExpiryBucket } from "./ops-logic"
import { formatCurrency, MetricCard, SectionCard, SectionHeading, StatusPill } from "./shared"
import type { Product } from "./types"

export type BatchAction = "discounted" | "returned" | "disposed"
type Filter = "watch" | ExpiryBucket | "all"

const bucketTone: Record<ExpiryBucket, string> = { expired: "red", "30": "red", "60": "amber", "90": "blue", ok: "green" }
const statusLabel: Record<BatchStatus, string> = { active: "في المخزون", discounted: "معروض بخصم", returned: "أُرجع للمورد", disposed: "أُتلف" }
const statusTone: Record<BatchStatus, string> = { active: "teal", discounted: "violet", returned: "neutral", disposed: "neutral" }
const actionCopy: Record<BatchAction, { title: string; button: string; hint: string }> = {
  discounted: { title: "تصريف التشغيلة بخصم", button: "تأكيد عرض الخصم", hint: "تظهر التشغيلة في كتالوج الصيدليات بشارة خصم حتى نفادها." },
  returned: { title: "إرجاع التشغيلة للمورد", button: "تأكيد الإرجاع", hint: "تُخصم الكمية من المخزون ويُنشأ طلب إشعار دائن لدى المورد." },
  disposed: { title: "إتلاف التشغيلة", button: "تأكيد الإتلاف", hint: "تُخصم الكمية من المخزون ويُسجل محضر إتلاف في سجل النشاط." },
}

export function ExpiryView({ batches, products, onAction }: { batches: Batch[]; products: Product[]; onAction: (batchId: string, action: BatchAction, note: string) => void }) {
  const [filter, setFilter] = useState<Filter>("watch")
  const [query, setQuery] = useState("")
  const [thresholds, setThresholds] = useState([90, 60, 30])
  const [pending, setPending] = useState<{ batch: Batch; action: BatchAction } | null>(null)
  const [note, setNote] = useState("")
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])

  const rows = useMemo(() => batches.map((batch) => {
    const days = daysUntil(batch.expiry, DEMO_NOW)
    return { batch, product: productById.get(batch.productId), days, bucket: expiryBucket(days) }
  }).sort((a, b) => a.days - b.days), [batches, productById])

  const active = rows.filter((row) => row.batch.status === "active" && row.batch.quantity > 0)
  const count = (bucket: ExpiryBucket) => active.filter((row) => row.bucket === bucket)
  const value = (list: typeof rows) => list.reduce((sum, row) => sum + row.batch.quantity * (row.product?.price ?? 0), 0)
  const normalized = query.trim().toLocaleLowerCase("ar")
  const visible = rows.filter((row) => {
    const matches = `${row.product?.name ?? ""} ${row.product?.scientificName ?? ""} ${row.batch.batchNo}`.toLocaleLowerCase("ar").includes(normalized)
    if (!matches) return false
    if (filter === "all") return true
    if (filter === "watch") return row.bucket !== "ok"
    return row.bucket === filter
  })

  function confirm() {
    if (!pending) return
    onAction(pending.batch.id, pending.action, note.trim())
    setPending(null)
    setNote("")
  }

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="سلامة الدواء" title="الصلاحية والتشغيلات" description="تتبع كل تشغيلة برقمها وتاريخ انتهائها، وتصرّف مبكرًا قبل أن تتحول إلى خسارة." action={<span className="count-badge"><CalendarClock aria-hidden="true" /> {batches.length} تشغيلة</span>} />
      <div className="metric-grid">
        <MetricCard label="منتهية الصلاحية" value={String(count("expired").length)} hint={`قيمة ${formatCurrency(value(count("expired")))} · يجب سحبها`} icon={PackageX} tone="amber" />
        <MetricCard label="خلال 30 يومًا" value={String(count("30").length)} hint={`قيمة ${formatCurrency(value(count("30")))}`} icon={AlertTriangle} tone="amber" />
        <MetricCard label="خلال 31–60 يومًا" value={String(count("60").length)} hint={`قيمة ${formatCurrency(value(count("60")))}`} icon={ShieldAlert} tone="blue" />
        <MetricCard label="خلال 61–90 يومًا" value={String(count("90").length)} hint={`قيمة ${formatCurrency(value(count("90")))}`} icon={CalendarClock} tone="teal" />
      </div>
      <SectionCard title="سياسة التنبيه" description="يصل تنبيه لمسؤول المخزون ومالك الشركة عند بلوغ كل تشغيلة هذه المدد قبل الانتهاء.">
        <div className="ops-threshold-row">{[90, 60, 30].map((days) => <button key={days} type="button" className={thresholds.includes(days) ? "ops-threshold active" : "ops-threshold"} aria-pressed={thresholds.includes(days)} onClick={() => setThresholds((current) => current.includes(days) ? current.filter((value) => value !== days) : [...current, days])}><strong>{days}</strong><span>يومًا قبل الانتهاء</span></button>)}<p className="ops-muted">التنبيهات المفعّلة: {thresholds.length ? [...thresholds].sort((a, b) => b - a).join(" · ") + " يومًا" : "لا توجد"}</p></div>
      </SectionCard>
      <SectionCard title="سجل التشغيلات" description="ابدأ بالأقرب انتهاءً. الإجراءات تُحدّث المخزون فورًا داخل العرض." action={<label className="search-control"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالصنف أو رقم التشغيلة" aria-label="ابحث في التشغيلات" /></label>}>
        <div className="filter-row" role="tablist" aria-label="تصفية التشغيلات">
          {([["watch", "تحت المراقبة"], ["expired", "منتهية"], ["30", "≤ 30 يومًا"], ["60", "31–60"], ["90", "61–90"], ["all", "كل التشغيلات"]] as Array<[Filter, string]>).map(([id, label]) => <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>الصنف</th><th>رقم التشغيلة</th><th>الموقع</th><th>الكمية</th><th>تاريخ الانتهاء</th><th>المتبقي</th><th>القيمة</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>
          {visible.map(({ batch, product, days, bucket }) => <tr key={batch.id}>
            <td><strong>{product?.name ?? batch.productId}</strong><small>{product?.manufacturer} · {product?.pack}</small></td>
            <td className="code-cell" dir="ltr">{batch.batchNo}</td>
            <td>{batch.location}</td>
            <td>{batch.quantity.toLocaleString("ar-SA")}</td>
            <td dir="ltr">{batch.expiry}</td>
            <td><StatusPill tone={bucketTone[bucket]}>{days < 0 ? `انتهت منذ ${Math.abs(days)} يوم` : `${days} يومًا`}</StatusPill></td>
            <td>{formatCurrency(batch.quantity * (product?.price ?? 0))}</td>
            <td><StatusPill tone={statusTone[batch.status]}>{statusLabel[batch.status]}</StatusPill></td>
            <td>{batch.status === "active" && batch.quantity > 0 && bucket !== "ok" ? <div className="table-actions">{bucket !== "expired" && <button className="mini-action" onClick={() => setPending({ batch, action: "discounted" })}><Tag aria-hidden="true" /> خصم</button>}<button className="mini-action" onClick={() => setPending({ batch, action: "returned" })}><Undo2 aria-hidden="true" /> للمورد</button><button className="mini-action ops-danger" onClick={() => setPending({ batch, action: "disposed" })}><Trash2 aria-hidden="true" /> إتلاف</button></div> : <span className="ops-muted">—</span>}</td>
          </tr>)}
        </tbody></table>{visible.length === 0 && <div className="table-empty">لا توجد تشغيلات مطابقة.</div>}</div>
      </SectionCard>
      {pending && <Modal title={actionCopy[pending.action].title} eyebrow={pending.batch.batchNo} close={() => setPending(null)}>
        <div className="ops-impact"><div><span>الصنف</span><strong>{productById.get(pending.batch.productId)?.name}</strong></div><div><span>الكمية</span><strong>{pending.batch.quantity.toLocaleString("ar-SA")} عبوة</strong></div><div><span>تاريخ الانتهاء</span><strong dir="ltr">{pending.batch.expiry}</strong></div></div>
        <p className="ops-muted">{actionCopy[pending.action].hint}</p>
        <form className="fa-form" onSubmit={(event) => { event.preventDefault(); confirm() }}><label className="field-label">ملاحظة {pending.action === "disposed" ? "(رقم محضر الإتلاف)" : "(اختياري)"}<input value={note} onChange={(event) => setNote(event.target.value)} required={pending.action === "disposed"} /></label><div className="form-actions"><button type="button" className="subtle-button" onClick={() => setPending(null)}>إلغاء</button><button className={pending.action === "disposed" ? "danger-button" : "primary-button"}>{actionCopy[pending.action].button}</button></div></form>
      </Modal>}
    </div>
  )
}
