import { useMemo, useState } from "react"
import { AlertTriangle, BellRing, CircleDollarSign, Clock3, Percent, Settings2 } from "lucide-react"
import { Modal } from "./modal"
import { DEMO_NOW, type CreditProfile } from "./ops-data"
import { agingFor, creditUsage, type AgingBuckets } from "./ops-logic"
import { formatCurrency, MetricCard, SectionCard, SectionHeading, StatusPill } from "./shared"
import type { Order, Pharmacy } from "./types"

const channels = ["رسالة نصية", "واتساب", "بريد إلكتروني"]
const bucketMeta: Array<{ key: keyof Omit<AgingBuckets, "total">; label: string; className: string }> = [
  { key: "current", label: "0–30 يومًا", className: "aging-current" },
  { key: "d31_60", label: "31–60 يومًا", className: "aging-31" },
  { key: "d61_90", label: "61–90 يومًا", className: "aging-61" },
  { key: "d90plus", label: "أكثر من 90", className: "aging-90" },
]
const formatDate = (value: string) => new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeZone: "Asia/Riyadh" }).format(new Date(value))

function AgingBar({ aging }: { aging: AgingBuckets }) {
  return <div className="aging-bar" role="img" aria-label="توزيع أعمار الديون">{bucketMeta.map((bucket) => aging[bucket.key] > 0 && <span key={bucket.key} className={bucket.className} style={{ flexGrow: aging[bucket.key] }} title={`${bucket.label}: ${formatCurrency(aging[bucket.key])}`} />)}{aging.total === 0 && <span className="aging-empty" />}</div>
}

export function CreditView({ pharmacies, profiles, orders, onUpdate, onRemind }: { pharmacies: Pharmacy[]; profiles: CreditProfile[]; orders: Order[]; onUpdate: (pharmacyId: string, changes: Partial<CreditProfile>) => void; onRemind: (pharmacyId: string, channel: string, message: string) => void }) {
  const [reminding, setReminding] = useState<Pharmacy | null>(null)
  const [channel, setChannel] = useState(channels[1]!)
  const [message, setMessage] = useState("")
  const [editing, setEditing] = useState<Pharmacy | null>(null)
  const rows = useMemo(() => pharmacies.map((pharmacy) => {
    const profile = profiles.find((item) => item.pharmacyId === pharmacy.id) ?? { pharmacyId: pharmacy.id, limit: 1500, termsDays: 30, frozen: false }
    const aging = agingFor(orders.filter((order) => order.pharmacy === pharmacy.name), DEMO_NOW)
    return { pharmacy, profile, aging, usage: creditUsage(aging.total, profile.limit) }
  }), [pharmacies, profiles, orders])
  const company = agingFor(orders, DEMO_NOW)
  const invoiced = orders.filter((order) => order.invoiceId && order.orderStatus !== "rejected" && order.orderStatus !== "cancelled")
  const collectionRate = Math.round((invoiced.reduce((sum, order) => sum + order.paidAmount, 0) / Math.max(1, invoiced.reduce((sum, order) => sum + order.total, 0))) * 100)
  const overLimit = rows.filter((row) => row.usage >= 100)

  function openReminder(row: (typeof rows)[number]) {
    setReminding(row.pharmacy)
    setChannel(channels[1]!)
    setMessage(`السادة ${row.pharmacy.name}، نود تذكيركم بوجود رصيد مستحق بقيمة ${formatCurrency(row.aging.total)}، منها ${formatCurrency(row.aging.d31_60 + row.aging.d61_90 + row.aging.d90plus)} تجاوزت ${row.profile.termsDays} يومًا. نأمل السداد عبر التحويل البنكي أو للمندوب عند الزيارة القادمة. شركة الشاعر للتوزيع الدوائي.`)
  }

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="المالية" title="الحدود الائتمانية والتحصيل" description="حد ائتماني لكل صيدلية، أعمار الديون، وتذكيرات سداد بضغطة واحدة." />
      <div className="metric-grid">
        <MetricCard label="إجمالي المستحقات" value={formatCurrency(company.total)} hint="فواتير صادرة غير مسددة" icon={CircleDollarSign} />
        <MetricCard label="متأخر أكثر من 60 يومًا" value={formatCurrency(company.d61_90 + company.d90plus)} hint="أولوية التحصيل" icon={Clock3} tone="amber" />
        <MetricCard label="تجاوزت الحد الائتماني" value={String(overLimit.length)} hint={overLimit.length ? overLimit.map((row) => row.pharmacy.name.replace(" التجريبية", "")).join("، ") : "لا توجد"} icon={AlertTriangle} tone="violet" />
        <MetricCard label="نسبة التحصيل" value={`${collectionRate}٪`} hint="من قيمة الفواتير الصادرة" icon={Percent} tone="blue" />
      </div>
      <SectionCard title="أعمار الديون على مستوى الشركة" description="المبالغ موزعة حسب عمر الفاتورة منذ الإصدار.">
        <AgingBar aging={company} />
        <div className="aging-legend">{bucketMeta.map((bucket) => <div key={bucket.key}><span className={`aging-dot ${bucket.className}`} /><span>{bucket.label}</span><strong>{formatCurrency(company[bucket.key])}</strong></div>)}</div>
      </SectionCard>
      <SectionCard title="الصيدليات" description="الاستخدام = المستحق ÷ الحد الائتماني. عند تجاوز الحد تُعلّق الطلبات الآجلة الجديدة.">
        <div className="table-wrap"><table className="data-table"><thead><tr><th>الصيدلية</th><th>الحد الائتماني</th><th>المستحق</th><th>الاستخدام</th><th>0–30</th><th>31–60</th><th>61–90</th><th>+90</th><th>آخر تذكير</th><th>إجراء</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.pharmacy.id}>
            <td><strong>{row.pharmacy.name}</strong><small>شروط السداد {row.profile.termsDays} يومًا {row.profile.frozen && "· الائتمان موقوف"}</small></td>
            <td>{formatCurrency(row.profile.limit)}</td>
            <td><strong>{formatCurrency(row.aging.total)}</strong></td>
            <td><div className="usage-cell"><div className="funnel-track"><span className={`funnel-fill ${row.usage >= 100 ? "usage-over" : row.usage >= 75 ? "usage-warn" : "usage-ok"}`} style={{ width: `${Math.min(100, row.usage)}%` }} /></div><StatusPill tone={row.usage >= 100 ? "red" : row.usage >= 75 ? "amber" : "green"}>{row.usage}٪</StatusPill></div></td>
            <td>{formatCurrency(row.aging.current)}</td>
            <td>{formatCurrency(row.aging.d31_60)}</td>
            <td>{formatCurrency(row.aging.d61_90)}</td>
            <td>{formatCurrency(row.aging.d90plus)}</td>
            <td>{row.profile.lastReminder ? <><span>{formatDate(row.profile.lastReminder)}</span><small>{row.profile.reminderChannel}</small></> : <span className="ops-muted">لم يُرسل</span>}</td>
            <td><div className="table-actions"><button className="mini-action" disabled={!row.aging.total} onClick={() => openReminder(row)}><BellRing aria-hidden="true" /> إرسال تذكير</button><button className="subtle-button" onClick={() => setEditing(row.pharmacy)}><Settings2 aria-hidden="true" /> الحد</button></div></td>
          </tr>)}
        </tbody></table></div>
      </SectionCard>

      {reminding && <Modal title="إرسال تذكير بالسداد" eyebrow={reminding.name} close={() => setReminding(null)}>
        <form className="fa-form" onSubmit={(event) => { event.preventDefault(); onRemind(reminding.id, channel, message); setReminding(null) }}>
          <fieldset className="fa-fieldset"><legend>قناة الإرسال</legend><div className="ops-radio-row">{channels.map((item) => <label className="fa-check" key={item}><input type="radio" name="channel" checked={channel === item} onChange={() => setChannel(item)} />{item}</label>)}</div></fieldset>
          <label className="field-label">نص الرسالة<textarea className="ops-textarea" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
          <p className="ops-muted">يُرسل إلى {reminding.contact} · محاكاة بدون إرسال فعلي.</p>
          <button className="primary-button"><BellRing aria-hidden="true" /> إرسال التذكير</button>
        </form>
      </Modal>}

      {editing && (() => { const profile = rows.find((row) => row.pharmacy.id === editing.id)!.profile; return <Modal title="تعديل الحد الائتماني" eyebrow={editing.name} close={() => setEditing(null)}>
        <form className="fa-form" onSubmit={(event) => { event.preventDefault(); const f = new FormData(event.currentTarget); onUpdate(editing.id, { limit: Math.max(0, Number(f.get("limit")) || 0), termsDays: Number(f.get("terms")) || 30, frozen: f.get("frozen") === "on" }); setEditing(null) }}>
          <div className="fa-grid"><label className="field-label">الحد الائتماني (ر.س)<input name="limit" type="number" min="0" step="100" defaultValue={profile.limit} required /></label><label className="field-label">مدة السداد<select name="terms" defaultValue={String(profile.termsDays)}><option value="15">15 يومًا</option><option value="30">30 يومًا</option><option value="45">45 يومًا</option><option value="60">60 يومًا</option></select></label></div>
          <label className="fa-check"><input type="checkbox" name="frozen" defaultChecked={profile.frozen} /> إيقاف البيع الآجل لهذه الصيدلية</label>
          <button className="primary-button">حفظ</button>
        </form>
      </Modal> })()}
    </div>
  )
}
