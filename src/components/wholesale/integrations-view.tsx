import { useEffect, useRef, useState } from "react"
import { Calculator, CreditCard, FileCheck2, Loader2, Map, MessageCircle, MessageSquareText, Plug, ScanBarcode, Server, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "./modal"
import type { Integration } from "./ops-data"
import { SectionHeading, StatusPill, formatTime } from "./shared"

const icons: Record<string, LucideIcon> = { einvoice: FileCheck2, track: ScanBarcode, sms: MessageSquareText, whatsapp: MessageCircle, accounting: Calculator, payments: CreditCard, maps: Map, erp: Server }

export function IntegrationsView({ integrations, onConnect, onDisconnect }: { integrations: Integration[]; onConnect: (id: string) => void; onDisconnect: (id: string) => void }) {
  const [connecting, setConnecting] = useState<Integration | null>(null)
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const categories = [...new Set(integrations.map((item) => item.category))]
  const connected = integrations.filter((item) => item.status === "connected").length

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!connecting) return
    setBusy(true)
    const id = connecting.id
    timer.current = setTimeout(() => { onConnect(id); setBusy(false); setConnecting(null) }, 1200)
  }

  function test(item: Integration) {
    setTesting(item.id)
    timer.current = setTimeout(() => { setTesting(null); toast.success(`الاتصال بـ ${item.name} يعمل بشكل سليم`) }, 900)
  }

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="المنصة" title="التكاملات" description="اربط النظام بالخدمات الحكومية وقنوات التواصل والمحاسبة. الربط هنا توضيحي ولا يتصل بخدمات حقيقية." action={<span className="count-badge"><Plug aria-hidden="true" /> {connected} من {integrations.length} متصلة</span>} />
      {categories.map((category) => <section className="ops-integration-group" key={category}>
        <h3 className="ops-subtitle">{category}</h3>
        <div className="feature-card-grid">{integrations.filter((item) => item.category === category).map((item) => { const Icon = icons[item.id] ?? Plug; return <article className="feature-card ops-integration" key={item.id}>
          <div className="feature-card-head"><span className="feature-card-icon"><Icon aria-hidden="true" /></span><StatusPill tone={item.status === "connected" ? "green" : "neutral"}>{item.status === "connected" ? "متصل" : "متاح"}</StatusPill></div>
          <h3>{item.name}</h3>
          <small className="ops-muted">{item.provider}</small>
          <p>{item.description}</p>
          <div className="feature-card-foot"><span>{item.status === "connected" && item.lastSync ? `آخر مزامنة ${formatTime(item.lastSync)}` : "غير مربوط"}</span></div>
          {item.status === "connected" ? <div className="fa-actions ops-tight"><button className="subtle-button" disabled={testing === item.id} onClick={() => test(item)}>{testing === item.id ? <Loader2 className="ops-spin" aria-hidden="true" /> : null} اختبار الاتصال</button><button className="subtle-button" onClick={() => onDisconnect(item.id)}>فصل</button></div> : <button className="primary-button" onClick={() => setConnecting(item)}>ربط الآن</button>}
        </article> })}</div>
      </section>)}
      {connecting && <Modal title={`ربط ${connecting.name}`} eyebrow={connecting.provider} close={() => { if (!busy) setConnecting(null) }}>
        <form className="fa-form" onSubmit={submit}>
          <div className="fa-grid"><label className="field-label">البيئة<select name="env" defaultValue="sandbox"><option value="sandbox">تجريبية</option><option value="production">إنتاج</option></select></label><label className="field-label">معرّف الحساب<input name="account" dir="ltr" placeholder="ACC-000123" required /></label></div>
          <label className="field-label">مفتاح الربط<input name="key" type="password" dir="ltr" placeholder="••••••••••••" required autoComplete="off" /></label>
          <p className="ops-muted">عرض توضيحي: لا يُحفظ المفتاح ولا يُرسل لأي جهة.</p>
          <button className="primary-button" disabled={busy}>{busy ? <><Loader2 className="ops-spin" aria-hidden="true" /> جارٍ التحقق من الربط...</> : "ربط الخدمة"}</button>
        </form>
      </Modal>}
    </div>
  )
}
