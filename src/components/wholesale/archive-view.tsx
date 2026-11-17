
import { useMemo, useState } from "react"
import { Archive, Ban, CalendarDays, Download, Eye, FileCheck2, FileText, FolderOpen, Printer, Search, ShieldCheck, ShoppingCart, Store, Truck, X } from "lucide-react"
import { formatCurrency, PaymentStatusPill, SectionHeading, StatusPill } from "./shared"
import type { DeliveryAgent, Order, Pharmacy } from "./types"

type DocType = "invoice" | "delivery" | "order" | "void"
type ArchiveDoc = { key: string; number: string; type: DocType; order: Order; date: string; amount: number }
type Period = "all" | "7" | "30" | "90"
type SortKey = "newest" | "oldest" | "amount_desc" | "amount_asc"

const docTypeMeta: Record<DocType, { label: string; plural: string; tone: string; icon: typeof FileText }> = {
  invoice: { label: "فاتورة بضائع", plural: "فواتير البضائع", tone: "teal", icon: FileText },
  delivery: { label: "سند تسليم", plural: "سندات التسليم", tone: "green", icon: FileCheck2 },
  order: { label: "طلب شراء", plural: "طلبات الشراء", tone: "blue", icon: ShoppingCart },
  void: { label: "ملغي / مرفوض", plural: "الملغاة والمرفوضة", tone: "red", icon: Ban },
}

const periods: Array<{ id: Period; label: string }> = [
  { id: "all", label: "كل الفترات" },
  { id: "7", label: "آخر 7 أيام" },
  { id: "30", label: "آخر 30 يومًا" },
  { id: "90", label: "آخر 90 يومًا" },
]

const formatDate = (value: string) => new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Riyadh" }).format(new Date(value))
const formatDateTime = (value: string) => new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(value))

function buildDocuments(orders: Order[]): ArchiveDoc[] {
  return orders.flatMap((order) => {
    const docs: ArchiveDoc[] = []
    if (order.orderStatus === "rejected" || order.orderStatus === "cancelled") {
      docs.push({ key: `${order.id}-void`, number: order.id, type: "void", order, date: order.createdAt, amount: order.total })
      return docs
    }
    if (order.invoiceId) docs.push({ key: `${order.id}-inv`, number: order.invoiceId, type: "invoice", order, date: order.createdAt, amount: order.total })
    else docs.push({ key: `${order.id}-ord`, number: order.id, type: "order", order, date: order.createdAt, amount: order.total })
    if (order.deliveryProof) docs.push({ key: `${order.id}-dlv`, number: `DLV-${order.id.replace("ORD-", "")}`, type: "delivery", order, date: order.deliveryProof.deliveredAt, amount: order.deliveryProof.collectedAmount })
    return docs
  })
}

export function ArchiveView({ orders, pharmacies, agents }: { orders: Order[]; pharmacies: Pharmacy[]; agents: DeliveryAgent[] }) {
  const [pharmacyFilter, setPharmacyFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<DocType | "all">("all")
  const [query, setQuery] = useState("")
  const [period, setPeriod] = useState<Period>("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("all")
  const [sort, setSort] = useState<SortKey>("newest")
  const [openDoc, setOpenDoc] = useState<ArchiveDoc | null>(null)

  const allDocs = useMemo(() => buildDocuments(orders), [orders])
  const agentName = (id: string | null) => agents.find((agent) => agent.id === id)?.name ?? "—"

  const scopedDocs = pharmacyFilter === "all" ? allDocs : allDocs.filter((doc) => doc.order.pharmacy === pharmacyFilter)

  const visibleDocs = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar")
    const cutoff = period === "all" ? 0 : Date.now() - Number(period) * 24 * 60 * 60 * 1000
    const filtered = scopedDocs.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false
      if (cutoff && new Date(doc.date).getTime() < cutoff) return false
      if (paymentFilter !== "all" && doc.order.paymentStatus !== paymentFilter) return false
      if (agentFilter !== "all" && doc.order.assignedTo !== agentFilter) return false
      if (!normalized) return true
      const haystack = [doc.number, doc.order.id, doc.order.invoiceId, doc.order.pharmacy, doc.order.recipientName, doc.order.pharmacyPhone, agentName(doc.order.assignedTo), ...doc.order.items.map((item) => item.name)].join(" ").toLocaleLowerCase("ar")
      return haystack.includes(normalized)
    })
    return filtered.sort((a, b) => sort === "newest" ? b.date.localeCompare(a.date) : sort === "oldest" ? a.date.localeCompare(b.date) : sort === "amount_desc" ? b.amount - a.amount : a.amount - b.amount)
    // agentName is derived from agents, which is already a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedDocs, typeFilter, period, paymentFilter, agentFilter, query, sort, agents])

  const typeCounts = (Object.keys(docTypeMeta) as DocType[]).reduce((acc, type) => ({ ...acc, [type]: scopedDocs.filter((doc) => doc.type === type).length }), {} as Record<DocType, number>)
  const scopedInvoices = scopedDocs.filter((doc) => doc.type === "invoice")
  const invoicedTotal = scopedInvoices.reduce((sum, doc) => sum + doc.amount, 0)
  const collectedTotal = scopedInvoices.reduce((sum, doc) => sum + doc.order.paidAmount, 0)
  const otpVerifiedCount = scopedDocs.filter((doc) => doc.type === "delivery" && doc.order.deliveryProof?.otpVerified).length

  const pharmacyFolders = pharmacies.map((pharmacy) => {
    const docs = allDocs.filter((doc) => doc.order.pharmacy === pharmacy.name)
    const invoices = docs.filter((doc) => doc.type === "invoice")
    const due = invoices.reduce((sum, doc) => sum + Math.max(doc.order.total - doc.order.paidAmount, 0), 0)
    return { pharmacy, count: docs.length, invoices: invoices.length, due }
  })
  const selectedFolder = pharmacyFolders.find((folder) => folder.pharmacy.name === pharmacyFilter)

  function resetFilters() {
    setQuery("")
    setPeriod("all")
    setPaymentFilter("all")
    setAgentFilter("all")
    setTypeFilter("all")
    setSort("newest")
  }

  function exportCsv() {
    const header = ["رقم المستند", "النوع", "رقم الطلب", "الصيدلية", "التاريخ", "المبلغ", "المدفوع", "حالة الدفع", "المندوب", "تحقق OTP"]
    const rows = visibleDocs.map((doc) => [doc.number, docTypeMeta[doc.type].label, doc.order.id, doc.order.pharmacy, formatDate(doc.date), doc.amount, doc.order.paidAmount, doc.order.paymentStatus, agentName(doc.order.assignedTo), doc.order.deliveryProof?.otpVerified ? "نعم" : "لا"])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `archive-${pharmacyFilter === "all" ? "all" : selectedFolder?.pharmacy.id ?? "pharmacy"}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="view-stack archive-view">
      <SectionHeading
        eyebrow="الأرشيف المركزي"
        title="أرشيف المستندات"
        description="كل فواتير البضائع وسندات التسليم وطلبات الشراء محفوظة ومفهرسة لكل صيدلية، مع بحث فوري وتصدير وطباعة."
        action={<button className="primary-button" onClick={exportCsv}><Download aria-hidden="true" /> تصدير النتائج</button>}
      />

      <div className="archive-stats">
        <div className="archive-stat"><span className="archive-stat-icon"><Archive aria-hidden="true" /></span><div><small>إجمالي المستندات</small><strong>{scopedDocs.length.toLocaleString("ar-SA")}</strong></div></div>
        <div className="archive-stat"><span className="archive-stat-icon is-teal"><FileText aria-hidden="true" /></span><div><small>قيمة فواتير البضائع</small><strong>{formatCurrency(invoicedTotal)}</strong></div></div>
        <div className="archive-stat"><span className="archive-stat-icon is-green"><ShieldCheck aria-hidden="true" /></span><div><small>تسليمات موثقة برمز OTP</small><strong>{otpVerifiedCount.toLocaleString("ar-SA")} / {typeCounts.delivery.toLocaleString("ar-SA")}</strong></div></div>
        <div className="archive-stat"><span className="archive-stat-icon is-amber"><CalendarDays aria-hidden="true" /></span><div><small>المستحق غير المحصّل</small><strong>{formatCurrency(Math.max(invoicedTotal - collectedTotal, 0))}</strong></div></div>
      </div>

      <div className="archive-layout">
        <aside className="archive-folders" aria-label="ملفات الصيدليات">
          <span className="archive-folders-title">ملفات الأرشيف</span>
          <button className={pharmacyFilter === "all" ? "archive-folder active" : "archive-folder"} onClick={() => setPharmacyFilter("all")} aria-pressed={pharmacyFilter === "all"}>
            <span className="archive-folder-icon"><FolderOpen aria-hidden="true" /></span>
            <span className="archive-folder-copy"><strong>كل الصيدليات</strong><small>الأرشيف الكامل للشركة</small></span>
            <span className="archive-folder-count">{allDocs.length}</span>
          </button>
          {pharmacyFolders.map(({ pharmacy, count, due }) => (
            <button key={pharmacy.id} className={pharmacyFilter === pharmacy.name ? "archive-folder active" : "archive-folder"} onClick={() => setPharmacyFilter(pharmacy.name)} aria-pressed={pharmacyFilter === pharmacy.name}>
              <span className="archive-folder-icon"><Store aria-hidden="true" /></span>
              <span className="archive-folder-copy"><strong>{pharmacy.name.replace(" التجريبية", "")}</strong><small>{due > 0 ? `مستحق ${formatCurrency(due)}` : "لا يوجد مستحقات"}</small></span>
              <span className="archive-folder-count">{count}</span>
            </button>
          ))}
        </aside>

        <section className="section-card archive-main" aria-label="مستندات الأرشيف">
          {selectedFolder && (
            <div className="archive-profile">
              <span className="archive-profile-avatar"><Store aria-hidden="true" /></span>
              <div className="archive-profile-copy"><strong>{selectedFolder.pharmacy.name}</strong><small>{selectedFolder.pharmacy.license} · {selectedFolder.pharmacy.region} · {selectedFolder.pharmacy.contact}</small></div>
              <div className="archive-profile-stats">
                <div><span>فواتير</span><strong>{selectedFolder.invoices}</strong></div>
                <div><span>سندات تسليم</span><strong>{typeCounts.delivery}</strong></div>
                <div><span>المستحق</span><strong>{formatCurrency(selectedFolder.due)}</strong></div>
              </div>
            </div>
          )}

          <div className="archive-type-tabs" role="tablist" aria-label="نوع المستند">
            <button role="tab" aria-selected={typeFilter === "all"} className={typeFilter === "all" ? "archive-type active" : "archive-type"} onClick={() => setTypeFilter("all")}><Archive aria-hidden="true" />الكل<span>{scopedDocs.length}</span></button>
            {(Object.keys(docTypeMeta) as DocType[]).map((type) => {
              const Icon = docTypeMeta[type].icon
              return <button key={type} role="tab" aria-selected={typeFilter === type} className={typeFilter === type ? "archive-type active" : "archive-type"} onClick={() => setTypeFilter(type)}><Icon aria-hidden="true" />{docTypeMeta[type].plural}<span>{typeCounts[type]}</span></button>
            })}
          </div>

          <div className="archive-toolbar">
            <label className="search-control archive-search"><Search aria-hidden="true" /><span className="sr-only">بحث في الأرشيف</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الفاتورة، الطلب، اسم الصيدلية، المستلم، المندوب أو الصنف" /></label>
            <label className="archive-select"><span className="sr-only">الفترة</span><select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>{periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label className="archive-select"><span className="sr-only">حالة الدفع</span><select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}><option value="all">كل حالات الدفع</option><option value="paid">مدفوع</option><option value="partially_paid">مدفوع جزئيًا</option><option value="unpaid">غير مدفوع</option></select></label>
            <label className="archive-select"><span className="sr-only">المندوب</span><select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}><option value="all">كل المندوبين</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label className="archive-select"><span className="sr-only">الترتيب</span><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option><option value="amount_desc">الأعلى قيمة</option><option value="amount_asc">الأقل قيمة</option></select></label>
          </div>

          <div className="archive-result-line"><span>{visibleDocs.length.toLocaleString("ar-SA")} مستند مطابق</span><button className="text-link-button" onClick={resetFilters}>مسح الفلاتر</button></div>

          <div className="table-wrap archive-table-wrap">
            <table className="data-table archive-table">
              <thead><tr><th>رقم المستند</th><th>النوع</th><th>الصيدلية</th><th>التاريخ</th><th>المبلغ</th><th>الدفع</th><th>المندوب</th><th>التحقق</th><th><span className="sr-only">إجراءات</span></th></tr></thead>
              <tbody>
                {visibleDocs.map((doc) => (
                  <tr key={doc.key}>
                    <td><span className="table-id">{doc.number}</span><small>طلب {doc.order.id}</small></td>
                    <td><StatusPill tone={docTypeMeta[doc.type].tone}>{docTypeMeta[doc.type].label}</StatusPill></td>
                    <td><strong>{doc.order.pharmacy.replace(" التجريبية", "")}</strong><small>{doc.order.recipientName ?? doc.order.pharmacyPhone}</small></td>
                    <td>{formatDate(doc.date)}</td>
                    <td><strong>{formatCurrency(doc.amount)}</strong><small>{doc.order.items.length} أصناف</small></td>
                    <td>{doc.type === "void" ? <StatusPill tone="neutral">—</StatusPill> : <PaymentStatusPill status={doc.order.paymentStatus} />}</td>
                    <td>{agentName(doc.order.assignedTo)}</td>
                    <td>{doc.type === "delivery" ? (doc.order.deliveryProof?.otpVerified ? <span className="otp-verified-tag"><ShieldCheck aria-hidden="true" /> OTP</span> : <span className="otp-manual-tag">يدوي</span>) : "—"}</td>
                    <td><button className="archive-open" onClick={() => setOpenDoc(doc)} aria-label={`عرض المستند ${doc.number}`}><Eye aria-hidden="true" /> عرض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleDocs.length === 0 && <div className="table-empty">لا توجد مستندات مطابقة. جرّب تعديل البحث أو الفلاتر.</div>}
          </div>
        </section>
      </div>

      {openDoc && <ArchiveDocumentModal doc={openDoc} driver={agentName(openDoc.order.assignedTo)} onClose={() => setOpenDoc(null)} />}
    </div>
  )
}

function ArchiveDocumentModal({ doc, driver, onClose }: { doc: ArchiveDoc; driver: string; onClose: () => void }) {
  const { order } = doc
  const meta = docTypeMeta[doc.type]
  const remaining = Math.max(order.total - order.paidAmount, 0)
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="detail-modal archive-doc-modal" role="dialog" aria-modal="true" aria-labelledby="archive-doc-title" onClick={(event) => event.stopPropagation()}>
        <div className="archive-doc-actions">
          <button className="secondary-action" onClick={() => window.print()}><Printer aria-hidden="true" /> طباعة</button>
          <button className="icon-action" aria-label="إغلاق" onClick={onClose}><X aria-hidden="true" /></button>
        </div>
        <article className="archive-print-area">
          <header className="archive-doc-head">
            <div><strong className="archive-doc-company">شركة الشاعر للتوزيع الدوائي</strong><small>الرياض · سجل تجاري تجريبي 1010000000</small></div>
            <div className="archive-doc-number"><span>{meta.label}</span><h2 id="archive-doc-title">{doc.number}</h2><small>{formatDateTime(doc.date)}</small></div>
          </header>

          <div className="archive-doc-parties">
            <div><span>العميل</span><strong>{order.pharmacy}</strong><small>{order.deliveryAddress ?? order.region}</small><small>{order.pharmacyPhone}</small></div>
            <div><span>مرجع الطلب</span><strong>{order.id}</strong><small>طريقة الدفع: {order.paymentMethod}</small>{order.invoiceId && <small>الفاتورة: {order.invoiceId}</small>}</div>
          </div>

          {doc.type === "delivery" && order.deliveryProof && (
            <div className="archive-doc-delivery">
              <div><span>المستلم</span><strong>{order.deliveryProof.recipient}</strong></div>
              <div><span>المندوب</span><strong>{driver}</strong></div>
              <div><span>المبلغ المحصّل</span><strong>{formatCurrency(order.deliveryProof.collectedAmount)}</strong></div>
              <div><span>التوثيق</span>{order.deliveryProof.otpVerified ? <strong className="is-verified"><ShieldCheck aria-hidden="true" /> مؤكد برمز OTP</strong> : <strong>توقيع يدوي</strong>}</div>
              {order.deliveryProof.note && <p>ملاحظة: {order.deliveryProof.note}</p>}
            </div>
          )}

          {doc.type === "void" && <div className="archive-doc-void"><Ban aria-hidden="true" /><span>{order.orderStatus === "rejected" ? "طلب مرفوض" : "طلب ملغي"} · {order.rejectionReason ?? "بدون سبب مسجل"}</span></div>}

          <table className="archive-doc-items">
            <thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
            <tbody>{order.items.map((item, index) => <tr key={`${item.productId}-${index}`}><td>{index + 1}</td><td>{item.name}</td><td>{item.quantity}</td><td>{formatCurrency(item.unitPrice)}</td><td>{formatCurrency(item.quantity * item.unitPrice)}</td></tr>)}</tbody>
          </table>

          <div className="archive-doc-totals">
            <div><span>الإجمالي</span><strong>{formatCurrency(order.total)}</strong></div>
            <div><span>المدفوع</span><strong>{formatCurrency(order.paidAmount)}</strong></div>
            <div className="is-due"><span>المتبقي</span><strong>{formatCurrency(remaining)}</strong></div>
          </div>

          <footer className="archive-doc-foot"><Truck aria-hidden="true" /><span>مستند مؤرشف إلكترونيًا · نسخة عرض تجريبية</span></footer>
        </article>
      </div>
    </div>
  )
}
