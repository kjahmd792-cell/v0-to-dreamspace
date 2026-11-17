
import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react"
import {
  formatCurrency,
  formatTime,
  MetricCard,
  OrderStatusPill,
  PaymentStatusPill,
  SectionCard,
  SectionHeading,
  StatusPill,
} from "./shared"
import type { Invoice, Order, OrderStatus, Pharmacy, Product } from "./types"
import { ProductEditorModal } from "./product-editor-modal"
import { Modal } from "./modal"
import { TaxInvoiceModal } from "./tax-invoice-modal"

const stepLabels: Partial<Record<OrderStatus, string>> = {
  pending: "مراجعة الطلب",
  accepted: "بدء التجهيز",
  preparing: "تأكيد التجهيز",
}

export function CompanyDashboard({
  orders,
  products,
  pharmacies,
  onNavigate,
}: {
  orders: Order[]
  products: Product[]
  pharmacies: Pharmacy[]
  onNavigate: (tab: "orders" | "inventory" | "pharmacies" | "deliveries") => void
}) {
  const delivered = orders.filter((order) => order.orderStatus === "delivered")
  const sales = delivered.reduce((sum, order) => sum + order.total, 0)
  const pending = orders.filter((order) => order.orderStatus === "pending").length
  const inPreparation = orders.filter((order) => ["accepted", "preparing", "ready"].includes(order.orderStatus)).length
  const inDelivery = orders.filter((order) => order.deliveryStatus === "assigned" || order.deliveryStatus === "on_way" || order.deliveryStatus === "arrived").length
  const totalOrders = Math.max(orders.length, 1)
  const receivables = orders.reduce((sum, order) => sum + Math.max(order.total - order.paidAmount, 0), 0)
  const lowStock = products.filter((product) => product.stock - product.reserved < 20)
  const today = new Intl.DateTimeFormat("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(new Date())

  return (
    <div className="view-stack">
      <div className="welcome-banner">
        <div className="welcome-decoration" aria-hidden="true"><Boxes /></div>
        <div className="welcome-copy">
          <span className="eyebrow light-eyebrow">{today}</span>
          <h2>صباح الخير، فريق العمليات</h2>
          <p>إليك ملخصًا مباشرًا للطلبات والمخزون وحركة التوصيل في شركتك.</p>
        </div>
        <div className="welcome-meta">نظرة توضيحية</div>
      </div>

      <div className="metric-grid">
        <MetricCard label="مبيعات اليوم" value={formatCurrency(sales)} hint="من الطلبات المسلّمة" icon={CircleDollarSign} tone="teal" />
        <MetricCard label="طلبات جديدة" value={String(pending).padStart(2, "0")} hint="تحتاج إلى مراجعة" icon={ClipboardList} tone="amber" />
        <MetricCard label="قيد التجهيز" value={String(inPreparation).padStart(2, "0")} hint="بانتظار الإكمال" icon={Package} tone="blue" />
        <MetricCard label="في التوصيل" value={String(inDelivery).padStart(2, "0")} hint="مندوبون على الطريق" icon={Truck} tone="violet" />
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="حركة الطلبات"
          description="توزيع الطلبات حسب مرحلة المعالجة"
          action={<button className="text-action" onClick={() => onNavigate("orders")}>كل الطلبات <ChevronLeft aria-hidden="true" /></button>}
        >
          <div className="order-funnel">
            {[
              { label: "مراجعة", count: pending, tone: "amber", percent: Math.round((pending / totalOrders) * 100) },
              { label: "تجهيز", count: inPreparation, tone: "blue", percent: Math.round((inPreparation / totalOrders) * 100) },
              { label: "توصيل", count: inDelivery, tone: "violet", percent: Math.round((inDelivery / totalOrders) * 100) },
              { label: "مكتمل", count: delivered.length, tone: "teal", percent: Math.round((delivered.length / totalOrders) * 100) },
            ].map((item) => (
              <div className="funnel-row" key={item.label}>
                <div className="funnel-label"><span>{item.label}</span><strong>{item.count}</strong></div>
                <div className="funnel-track"><span className={`funnel-fill fill-${item.tone}`} style={{ width: `${Math.max(item.percent, 0)}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="تنبيهات المخزون"
          description={`${lowStock.length} منتجات تحتاج إلى متابعة`}
          action={<button className="icon-action" aria-label="فتح المخزون" onClick={() => onNavigate("inventory")}><ArrowUpLeft aria-hidden="true" /></button>}
        >
          <div className="stock-alert-list">
            {lowStock.length === 0 ? (
              <p className="muted-note">لا توجد تنبيهات مخزون.</p>
            ) : lowStock.slice(0, 3).map((product) => {
              const available = product.stock - product.reserved
              return (
                <div className="stock-alert" key={product.id}>
                  <span className="stock-alert-icon"><Package aria-hidden="true" /></span>
                  <div className="stock-alert-copy"><strong>{product.name}</strong><small>{product.id} · المتاح {available} وحدة</small></div>
                  <span className={available < 10 ? "alert-count critical" : "alert-count"}>{available}</span>
                </div>
              )
            })}
            <button className="wide-secondary-button" onClick={() => onNavigate("inventory")}>فتح إدارة المخزون <ArrowDownLeft aria-hidden="true" /></button>
          </div>
        </SectionCard>

        <SectionCard
          title="أحدث الطلبات"
          description="آخر ما وصل إلى لوحة الشركة"
          action={<button className="text-action" onClick={() => onNavigate("orders")}>عرض الكل <ChevronLeft aria-hidden="true" /></button>}
          className="dashboard-wide"
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>رقم الطلب</th><th>الصيدلية</th><th>وقت الإنشاء</th><th>الإجمالي</th><th>الحالة</th><th><span className="sr-only">إجراءات</span></th></tr></thead>
              <tbody>
                {orders.slice(0, 4).map((order) => (
                  <tr key={order.id}>
                    <td><span className="table-id">{order.id}</span></td>
                    <td><strong>{order.pharmacy}</strong><small>{order.region}</small></td>
                    <td>{formatTime(order.createdAt)}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td><OrderStatusPill status={order.orderStatus} /></td>
                    <td><button className="row-icon-button" aria-label={`عرض ${order.id}`} onClick={() => onNavigate("orders")}><Eye aria-hidden="true" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="dashboard-side-card">
          <div className="side-card-heading"><span className="side-card-icon"><Users aria-hidden="true" /></span><span>الصيدليات النشطة</span></div>
          <strong className="side-card-number">{pharmacies.filter((pharmacy) => pharmacy.status === "approved").length}</strong>
          <span className="side-card-sub">من أصل {pharmacies.length} صيدليات تجريبية</span>
          <button className="text-action" onClick={() => onNavigate("pharmacies")}>إدارة الحسابات <ChevronLeft aria-hidden="true" /></button>
          <div className="side-card-foot"><ShieldCheck aria-hidden="true" /><span>حالة الاعتماد مُدارة من الشركة</span></div>
        </div>
      </div>

      <div className="dashboard-footnote"><Clock3 aria-hidden="true" /><span>الفترة المعروضة: اليوم · بيانات تجريبية للتوضيح</span></div>
    </div>
  )
}

export function OrdersView({
  orders,
  onAdvance,
  onReject,
}: {
  orders: Order[]
  onAdvance: (orderId: string) => void
  onReject: (orderId: string) => void
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const filters = [
    { id: "all", label: "الكل" },
    { id: "pending", label: "جديدة" },
    { id: "preparing", label: "قيد التجهيز" },
    { id: "ready", label: "جاهزة للإسناد" },
    { id: "out_for_delivery", label: "في التوصيل" },
    { id: "failed", label: "تعذر التسليم" },
    { id: "delivered", label: "مكتملة" },
    { id: "rejected", label: "مرفوضة" },
    { id: "cancelled", label: "ملغاة" },
  ]
  const normalizedQuery = query.trim().toLocaleLowerCase("ar")
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.pharmacy} ${order.region}`.toLocaleLowerCase("ar").includes(normalizedQuery)
    const matchesStatus = filter === "all" || order.orderStatus === filter || (filter === "preparing" && order.orderStatus === "accepted") || (filter === "failed" && order.deliveryStatus === "failed")
    return matchesQuery && matchesStatus
  }), [orders, normalizedQuery, filter])

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="العمليات" title="إدارة الطلبات" description="راجع الطلبات الواردة، حدّث مراحلها، وتابع التسليم والفواتير." action={<span className="count-badge"><ClipboardList aria-hidden="true" /> {orders.length} طلبات</span>} />
      <div className="summary-strip">
        <div><span>بانتظار المراجعة</span><strong>{orders.filter((order) => order.orderStatus === "pending").length}</strong></div>
        <div><span>قيد التجهيز</span><strong>{orders.filter((order) => ["accepted", "preparing", "ready"].includes(order.orderStatus)).length}</strong></div>
        <div><span>خرجت للتوصيل</span><strong>{orders.filter((order) => order.orderStatus === "out_for_delivery").length}</strong></div>
        <div><span>مكتملة</span><strong>{orders.filter((order) => order.orderStatus === "delivered").length}</strong></div>
      </div>
      <SectionCard title="قائمة الطلبات" description="اختر إجراءً للانتقال إلى المرحلة التالية."
        action={<label className="search-control"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الطلب أو الصيدلية" aria-label="ابحث عن طلب" /></label>}
      >
        <div className="filter-row" role="tablist" aria-label="تصفية الطلبات">
          {filters.map((item) => <button key={item.id} role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <div className="table-wrap">
          <table className="data-table orders-table">
            <thead><tr><th>الطلب</th><th>الصيدلية</th><th>المنتجات</th><th>الإجمالي</th><th>حالة الطلب</th><th>التوصيل</th><th>إجراء</th></tr></thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td><span className="table-id">{order.id}</span><small>{formatTime(order.createdAt)}</small></td>
                  <td><strong>{order.pharmacy}</strong><small>{order.region}</small></td>
                  <td>{order.items.length} أصناف<small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} وحدة</small></td>
                  <td>{formatCurrency(order.total)}</td>
                  <td><OrderStatusPill status={order.orderStatus} /></td>
                  <td>{order.deliveryStatus ? <StatusPill tone={order.deliveryStatus === "delivered" ? "green" : order.deliveryStatus === "failed" ? "red" : "violet"}>{order.deliveryStatus === "on_way" ? "في الطريق" : order.deliveryStatus === "arrived" ? "وصل" : order.deliveryStatus === "assigned" ? "تم الإسناد" : order.deliveryStatus === "delivered" ? "تم التسليم" : "تعذر التسليم"}</StatusPill> : <span className="muted-inline">—</span>}</td>
                  <td><div className="table-actions"><button className="row-icon-button" aria-label={`تفاصيل ${order.id}`} onClick={() => setSelectedOrder(order)}><Eye aria-hidden="true" /></button>{stepLabels[order.orderStatus] && <button className="mini-action" onClick={() => onAdvance(order.id)}>{stepLabels[order.orderStatus]} <ArrowUpRight aria-hidden="true" /></button>}{order.orderStatus === "pending" && <button className="reject-action" onClick={() => onReject(order.id)}>رفض</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <div className="table-empty">لا توجد طلبات مطابقة للبحث.</div>}
        </div>
      </SectionCard>
      {selectedOrder && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedOrder(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><span className="eyebrow">تفاصيل الطلب</span><h2 id="order-detail-title">{selectedOrder.id}</h2></div><button className="icon-action" onClick={() => setSelectedOrder(null)} aria-label="إغلاق التفاصيل">×</button></div>
        <div className="detail-summary"><div><small>الصيدلية</small><strong>{selectedOrder.pharmacy}</strong></div><div><small>العنوان</small><strong>{selectedOrder.region}</strong></div><div><small>حالة الطلب</small><OrderStatusPill status={selectedOrder.orderStatus} /></div><div><small>حالة الدفع</small><PaymentStatusPill status={selectedOrder.paymentStatus} /></div></div>
        <div className="detail-items">{selectedOrder.items.map((item) => <div key={item.productId}><span>{item.name} <small>× {item.quantity}</small></span><strong>{formatCurrency(item.unitPrice * item.quantity)}</strong></div>)}</div>
        {selectedOrder.note && <p className="detail-note">ملاحظة الصيدلية: {selectedOrder.note}</p>}
        <div className="detail-total"><span>الإجمالي</span><strong>{formatCurrency(selectedOrder.total)}</strong></div>
      </section></div>}
    </div>
  )
}

export function InventoryView({ products, onRestock, onSaveProduct }: { products: Product[]; onRestock: (productId: string, quantity: number) => void; onSaveProduct: (product: Product) => void }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [productEditorOpen, setProductEditorOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [restockOpen, setRestockOpen] = useState(false)
  const [restockProductId, setRestockProductId] = useState("")
  const [restockQuantity, setRestockQuantity] = useState("20")
  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + 6)
  const expiryCutoff = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, "0")}`
  const normalizedQuery = query.trim().toLocaleLowerCase("ar")
  const visible = products.filter((product) => {
    const available = product.stock - product.reserved
    const matchesQuery = `${product.name} ${product.id} ${product.code} ${product.category}`.toLocaleLowerCase("ar").includes(normalizedQuery)
    const matchesFilter = filter === "all" || (filter === "low" && available < 20) || (filter === "expiring" && product.expiry <= expiryCutoff)
    return matchesQuery && matchesFilter
  })
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0)
  const reservedUnits = products.reduce((sum, product) => sum + product.reserved, 0)

  function openNewProduct() {
    setEditingProduct(undefined)
    setProductEditorOpen(true)
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product)
    setProductEditorOpen(true)
  }

  function saveProduct(product: Product) {
    onSaveProduct(product)
    setProductEditorOpen(false)
  }

  function openRestock(productId = products[0]?.id ?? "") {
    if (!productId) return
    setRestockProductId(productId)
    setRestockQuantity("20")
    setRestockOpen(true)
  }

  function submitRestock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const quantity = Number(restockQuantity)
    if (!restockProductId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) return
    onRestock(restockProductId, quantity)
    setRestockOpen(false)
  }

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="المستودع" title="المنتجات والمخزون" description="أدر بيانات الكتالوج والأسعار والكميات المتاحة والمحجوزة." action={<div className="inventory-actions"><button className="subtle-button" onClick={openNewProduct}><Plus aria-hidden="true" /> إضافة منتج</button><button className="primary-button" onClick={() => openRestock()} disabled={products.length === 0}><Plus aria-hidden="true" /> إضافة كمية</button></div>} />
      <div className="metric-grid three-metrics">
        <MetricCard label="إجمالي الوحدات" value={totalUnits.toLocaleString("ar-SA")} hint="في مستودع الشركة" icon={Boxes} tone="teal" />
        <MetricCard label="وحدات محجوزة" value={reservedUnits.toLocaleString("ar-SA")} hint="لطلبات غير مكتملة" icon={ClipboardList} tone="blue" />
        <MetricCard label="مخزون منخفض" value={String(products.filter((product) => product.stock - product.reserved < 20).length)} hint="أقل من حد التنبيه" icon={ArrowDownLeft} tone="amber" />
      </div>
      <SectionCard title="الأدوية والمنتجات" description="الأصناف المعروضة بيانات توضيحية فقط." action={<label className="search-control"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن منتج أو باركود" aria-label="ابحث عن منتج أو باركود" /></label>}>
        <div className="filter-row" role="tablist" aria-label="تصفية المخزون">
          {[{ id: "all", label: "كل الأصناف" }, { id: "low", label: "منخفضة المخزون" }, { id: "expiring", label: "قريبة الانتهاء" }].map((item) => <button key={item.id} role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <div className="table-wrap"><table className="data-table inventory-table"><thead><tr><th>الصنف</th><th>التصنيف</th><th>الباركود</th><th>المخزون</th><th>المحجوز</th><th>المتاح</th><th>سعر الجملة</th><th>الانتهاء</th><th><span className="sr-only">إجراء</span></th></tr></thead><tbody>
          {visible.map((product) => {
            const available = product.stock - product.reserved
            return <tr key={product.id}><td><div className="product-cell"><span className="product-mini-icon"><Package aria-hidden="true" /></span><span><strong>{product.name}</strong><small>{product.id} · {product.pack}</small></span></div></td><td>{product.category}</td><td className="code-cell">{product.code}</td><td>{product.stock}</td><td>{product.reserved}</td><td><span className={available < 10 ? "available low" : "available"}>{available}</span></td><td>{formatCurrency(product.price)}</td><td>{product.expiry}</td><td><div className="table-actions"><button className="mini-action" onClick={() => openEditProduct(product)}>تعديل</button><button className="mini-action" onClick={() => openRestock(product.id)}>كمية</button></div></td></tr>
          })}
        </tbody></table>{visible.length === 0 && <div className="table-empty">لا توجد أصناف مطابقة.</div>}</div>
      </SectionCard>
      {productEditorOpen && <ProductEditorModal product={editingProduct} onClose={() => setProductEditorOpen(false)} onSave={saveProduct} />}
      {restockOpen && <div className="modal-backdrop" role="presentation" onClick={() => setRestockOpen(false)}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="restock-title" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">حركة مخزون مسجلة</span><h2 id="restock-title">إضافة كمية للمخزون</h2></div><button className="icon-action" type="button" onClick={() => setRestockOpen(false)} aria-label="إغلاق">×</button></div><form onSubmit={submitRestock}><div className="proof-fields"><label className="field-label">المنتج<select required value={restockProductId} onChange={(event) => setRestockProductId(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · المتاح {product.stock - product.reserved}</option>)}</select></label><label className="field-label">الكمية المضافة<input required type="number" min="1" max="100000" step="1" value={restockQuantity} onChange={(event) => setRestockQuantity(event.target.value)} /></label></div><div className="form-actions"><button type="button" className="subtle-button" onClick={() => setRestockOpen(false)}>إلغاء</button><button type="submit" className="primary-button"><Plus aria-hidden="true" /> تسجيل الإضافة</button></div></form></section></div>}
    </div>
  )
}

export function PharmaciesView({ pharmacies, onToggleStatus, onAdd }: { pharmacies: Pharmacy[]; onToggleStatus: (pharmacyId: string) => void; onAdd: (pharmacy: Pharmacy) => void }) {
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Pharmacy["status"] | "all">("all")
  const normalizedQuery = query.trim().toLocaleLowerCase("ar")
  const visible = pharmacies.filter((pharmacy) => {
    const matchesQuery = `${pharmacy.name} ${pharmacy.region} ${pharmacy.id} ${pharmacy.contact} ${pharmacy.license}`.toLocaleLowerCase("ar").includes(normalizedQuery)
    return matchesQuery && (statusFilter === "all" || pharmacy.status === statusFilter)
  })
  const approved = pharmacies.filter((pharmacy) => pharmacy.status === "approved").length
  const pending = pharmacies.filter((pharmacy) => pharmacy.status === "pending").length

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="إدارة العملاء" title="الصيدليات" description="تابع الصيدليات المتعاملة مع الشركة وحالة الاعتماد والرصيد المستحق." action={<button className="primary-button" type="button" onClick={() => setAdding(true)}><Plus aria-hidden="true" /> إضافة صيدلية</button>} />
      <div className="summary-strip"><div><span>حسابات معتمدة</span><strong>{approved}</strong></div><div><span>بانتظار الاعتماد</span><strong>{pending}</strong></div><div><span>إجمالي المديونيات</span><strong>{formatCurrency(pharmacies.reduce((sum, pharmacy) => sum + pharmacy.balance, 0))}</strong></div><div><span>إجمالي الحسابات</span><strong>{pharmacies.length}</strong></div></div>
      <SectionCard title="دليل الصيدليات" description="قائمة توضيحية للصيدليات وحالة التعامل معها." action={<label className="search-control"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو الهاتف أو الترخيص" aria-label="ابحث عن صيدلية" /></label>}>
        <div className="filter-row" role="tablist" aria-label="تصفية الصيدليات">
          {[{ id: "all", label: "الكل" }, { id: "approved", label: "معتمدة" }, { id: "pending", label: "بانتظار الاعتماد" }, { id: "suspended", label: "موقوفة" }].map((item) => <button key={item.id} role="tab" aria-selected={statusFilter === item.id} className={statusFilter === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setStatusFilter(item.id as Pharmacy["status"] | "all")}>{item.label}</button>)}
        </div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>الصيدلية</th><th>المنطقة</th><th>بيانات الترخيص</th><th>آخر طلب</th><th>الرصيد المستحق</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>
          {visible.map((pharmacy) => <tr key={pharmacy.id}><td><div className="pharmacy-cell"><span className="pharmacy-avatar"><Store aria-hidden="true" /></span><span><strong>{pharmacy.name}</strong><small>{pharmacy.contact}</small></span></div></td><td>{pharmacy.region}</td><td>{pharmacy.license}</td><td>{pharmacy.lastOrder}</td><td>{formatCurrency(pharmacy.balance)}</td><td><StatusPill tone={pharmacy.status === "approved" ? "green" : pharmacy.status === "pending" ? "amber" : "red"}>{pharmacy.status === "approved" ? "معتمدة" : pharmacy.status === "pending" ? "بانتظار الاعتماد" : "موقوفة"}</StatusPill></td><td><button className={pharmacy.status === "approved" ? "subtle-button" : "mini-action"} onClick={() => onToggleStatus(pharmacy.id)}>{pharmacy.status === "approved" ? "إيقاف مؤقت" : pharmacy.status === "pending" ? "اعتماد الحساب" : "إعادة التفعيل"}</button></td></tr>)}
        </tbody></table>{visible.length === 0 && <div className="table-empty">لا توجد صيدليات مطابقة.</div>}</div>
      </SectionCard>
      {adding && <Modal title="إضافة صيدلية" eyebrow="حساب عميل جديد" close={() => setAdding(false)}><form className="fa-form" onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const text = (key: string) => String(form.get(key) ?? "").trim()
        const nextId = Math.max(1000, ...pharmacies.map((pharmacy) => Number(pharmacy.id.replace("PH-", "")) || 0)) + 1
        onAdd({ id: `PH-${nextId}`, name: text("name"), contact: text("contact"), region: `${text("district")}، ${text("city")}`, license: `ترخيص · ${text("license")}`, status: form.get("approve") === "on" ? "approved" : "pending", balance: 0, lastOrder: "لا يوجد" })
        setAdding(false)
      }}>
        <div className="fa-grid">
          <label className="field-label">اسم الصيدلية<input name="name" required placeholder="صيدلية ..." /></label>
          <label className="field-label">رقم التواصل<input name="contact" dir="ltr" required placeholder="05x xxx xxxx" pattern="[0-9 +]{9,15}" /></label>
          <label className="field-label">المدينة<select name="city"><option>الرياض</option><option>جدة</option><option>الدمام</option><option>مكة المكرمة</option><option>المدينة المنورة</option></select></label>
          <label className="field-label">الحي<input name="district" required placeholder="حي النرجس" /></label>
          <label className="field-label">رقم الترخيص<input name="license" dir="ltr" required /></label>
          <label className="field-label">المسؤول<input name="owner" placeholder="اسم الصيدلي المسؤول" /></label>
        </div>
        <label className="fa-check"><input type="checkbox" name="approve" /> اعتماد الحساب مباشرةً بعد التحقق من الترخيص</label>
        <button className="primary-button"><Plus aria-hidden="true" /> إضافة الصيدلية</button>
      </form></Modal>}
    </div>
  )
}

export function InvoicesView({ invoices, orders }: { invoices: Invoice[]; orders: Order[] }) {
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const balance = invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paidAmount, 0)
  const normalizedQuery = query.trim().toLocaleLowerCase("ar")
  const visibleInvoices = invoices.filter((invoice) => {
    const remaining = Math.max(invoice.total - invoice.paidAmount, 0)
    const matchesQuery = `${invoice.id} ${invoice.orderId} ${invoice.pharmacy}`.toLocaleLowerCase("ar").includes(normalizedQuery)
    const status = remaining === 0 ? "paid" : invoice.paidAmount > 0 ? "partial" : "unpaid"
    return matchesQuery && (statusFilter === "all" || status === statusFilter)
  })
  return (
    <div className="view-stack">
      <SectionHeading eyebrow="الحسابات" title="الفواتير والتحصيل" description="الفاتورة منفصلة عن حالة التسليم؛ لا يُسجل الدفع إلا عند توثيق مبلغ محصل." action={<span className="count-badge"><FileText aria-hidden="true" /> {invoices.length} فواتير</span>} />
      <div className="summary-strip"><div><span>إجمالي الفواتير</span><strong>{formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.total, 0))}</strong></div><div><span>المبالغ المسجلة</span><strong>{formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0))}</strong></div><div><span>الرصيد المستحق</span><strong>{formatCurrency(balance)}</strong></div><div><span>بانتظار التحصيل</span><strong>{invoices.filter((invoice) => invoice.paidAmount < invoice.total).length}</strong></div></div>
      <SectionCard title="سجل الفواتير" description="ابحث برقم الفاتورة أو الطلب أو اسم الصيدلية." action={<label className="search-control"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الفواتير" aria-label="ابحث عن فاتورة" /></label>}>
        <div className="filter-row" role="tablist" aria-label="تصفية الفواتير">
          {[{ id: "all", label: "الكل" }, { id: "unpaid", label: "غير مدفوعة" }, { id: "partial", label: "مدفوعة جزئيًا" }, { id: "paid", label: "مدفوعة" }].map((item) => <button key={item.id} role="tab" aria-selected={statusFilter === item.id} className={statusFilter === item.id ? "filter-chip active" : "filter-chip"} onClick={() => setStatusFilter(item.id)}>{item.label}</button>)}
        </div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>رقم الفاتورة</th><th>رقم الطلب</th><th>الصيدلية</th><th>تاريخ الإصدار</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>الفاتورة</th></tr></thead><tbody>
          {visibleInvoices.map((invoice) => {
            const remaining = Math.max(invoice.total - invoice.paidAmount, 0)
            return <tr key={invoice.id}><td><span className="table-id">{invoice.id}</span></td><td>{invoice.orderId}</td><td><strong>{invoice.pharmacy}</strong></td><td>{formatTime(invoice.issuedAt)}</td><td>{formatCurrency(invoice.total)}</td><td>{formatCurrency(invoice.paidAmount)}</td><td>{formatCurrency(remaining)}</td><td><PaymentStatusPill status={remaining === 0 ? "paid" : invoice.paidAmount > 0 ? "partially_paid" : "unpaid"} /></td><td><button className="mini-action" type="button" onClick={() => setPreview(invoice)}><FileText aria-hidden="true" /> فاتورة ضريبية</button></td></tr>
          })}
        </tbody></table>{visibleInvoices.length === 0 && <div className="table-empty">لا توجد فواتير مطابقة للبحث والفلاتر.</div>}</div>
      </SectionCard>
      <div className="accounting-note"><ShieldCheck aria-hidden="true" /><div><strong>فصل التسليم عن التحصيل</strong><p>إثبات وصول الطلب لا يغيّر حالة الفاتورة تلقائيًا. تُحدّث الأرصدة فقط عند تسجيل مبلغ التحصيل في خطوة التسليم.</p></div><ArrowUpRight aria-hidden="true" /></div>
      {preview && <TaxInvoiceModal invoice={preview} order={orders.find((order) => order.id === preview.orderId)} onClose={() => setPreview(null)} />}
    </div>
  )
}
