import { useEffect, useRef, useState } from "react"
import { Banknote, Camera, Check, Eraser, FileImage, MapPin, PackageCheck, PenLine, Printer, ReceiptText, Route, WalletCards } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "./modal"
import { driverDaySummary } from "./portal-logic"
import { formatCurrency, formatTime } from "./shared"
import type { DeliveryEvidence, Order } from "./types"

export function DriverDaySummary({ orders }: { orders: Order[] }) {
  const summary = driverDaySummary(orders)
  const progress = summary.totalCount ? Math.round(summary.deliveredCount / summary.totalCount * 100) : 0
  return (
    <section className="driver-day-summary" aria-labelledby="driver-day-title">
      <div className="driver-day-heading">
        <div><span className="eyebrow">ملخص اليوم</span><h3 id="driver-day-title">أنجزت {summary.deliveredCount} من {summary.totalCount} تسليمات</h3></div>
        <span className="driver-day-progress"><strong>{progress}%</strong><small>مكتمل</small></span>
      </div>
      <div className="driver-day-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <div className="driver-day-metrics">
        <div><span><PackageCheck aria-hidden="true" /></span><small>التسليمات</small><strong>{summary.deliveredCount} / {summary.totalCount}</strong></div>
        <div><span><Banknote aria-hidden="true" /></span><small>المحصّل نقدًا</small><strong>{formatCurrency(summary.cash)}</strong></div>
        <div><span><WalletCards aria-hidden="true" /></span><small>إجمالي التحصيل</small><strong>{formatCurrency(summary.collected)}</strong></div>
        <div><span><Route aria-hidden="true" /></span><small>المسافة التقديرية</small><strong>{summary.distanceKm.toLocaleString("ar-SA")} كم</strong></div>
      </div>
    </section>
  )
}

export function DeliveryEvidenceCapture({ value, onChange }: { value: DeliveryEvidence | undefined; onChange: (evidence: DeliveryEvidence | undefined) => void }) {
  const [mode, setMode] = useState<DeliveryEvidence["type"]>(value?.type ?? "photo")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    if (mode !== "signature") return
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.lineWidth = 4
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = getComputedStyle(canvas).color
    if (value?.type === "signature") {
      const image = new Image()
      image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height)
      image.src = value.dataUrl
    }
  }, [mode]) // The canvas is reset only when switching evidence type.

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget
    const bounds = canvas.getBoundingClientRect()
    return { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height }
  }

  function finishSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    drawing.current = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    onChange({ type: "signature", dataUrl: event.currentTarget.toDataURL("image/png") })
  }

  function readPhoto(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("اختر ملف صورة صالحًا"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الصورة يجب ألا يتجاوز 5 ميغابايت"); return }
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" && onChange({ type: "photo", dataUrl: reader.result, fileName: file.name })
    reader.onerror = () => toast.error("تعذر قراءة الصورة، جرّب صورة أخرى")
    reader.readAsDataURL(file)
  }

  function clearSignature() {
    const canvas = canvasRef.current
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
    onChange(undefined)
  }

  return (
    <fieldset className="evidence-capture">
      <legend>إثبات التسليم <span>مطلوب</span></legend>
      <div className="evidence-tabs" role="group" aria-label="نوع إثبات التسليم">
        <button type="button" aria-pressed={mode === "photo"} className={mode === "photo" ? "active" : ""} onClick={() => { setMode("photo"); onChange(undefined) }}><Camera aria-hidden="true" /> صورة الاستلام</button>
        <button type="button" aria-pressed={mode === "signature"} className={mode === "signature" ? "active" : ""} onClick={() => { setMode("signature"); onChange(undefined) }}><PenLine aria-hidden="true" /> توقيع المستلم</button>
      </div>
      {mode === "photo" ? (
        <div className="photo-evidence">
          {value?.type === "photo" ? <div className="photo-evidence-preview"><img src={value.dataUrl} alt="معاينة إثبات التسليم" /><div><Check aria-hidden="true" /><span><strong>تمت إضافة الصورة</strong><small>{value.fileName}</small></span><button type="button" className="subtle-button" onClick={() => onChange(undefined)}>إزالة</button></div></div> :
            <label className="photo-upload"><input type="file" accept="image/*" capture="environment" onChange={(event) => readPhoto(event.target.files?.[0])} /><span><FileImage aria-hidden="true" /></span><strong>التقط صورة أو اخترها من الجهاز</strong><small>صورة الطلب عند باب الصيدلية أو محضر الاستلام · حتى 5MB</small><b>اختيار صورة</b></label>}
        </div>
      ) : (
        <div className="signature-evidence">
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            width={640}
            height={220}
            aria-label="مساحة توقيع المستلم، ارسم التوقيع بالمؤشر أو باللمس"
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); const ctx = event.currentTarget.getContext("2d"); ctx?.beginPath(); ctx?.moveTo(p.x, p.y); drawing.current = true }}
            onPointerMove={(event) => { if (!drawing.current) return; const p = point(event); const ctx = event.currentTarget.getContext("2d"); ctx?.lineTo(p.x, p.y); ctx?.stroke() }}
            onPointerUp={finishSignature}
            onPointerCancel={finishSignature}
          />
          <div><span>وقّع داخل المساحة بإصبعك أو بالمؤشر</span><button type="button" className="subtle-button" onClick={clearSignature}><Eraser aria-hidden="true" /> مسح التوقيع</button></div>
        </div>
      )}
      {value && <p className="evidence-ready" role="status"><Check aria-hidden="true" /> أصبح إثبات التسليم جاهزًا للحفظ مع الإيصال.</p>}
    </fieldset>
  )
}

export function CashReceiptModal({ order, driverName, close }: { order: Order; driverName: string; close: () => void }) {
  const proof = order.deliveryProof
  if (!proof) return null
  const remaining = Math.max(order.total - order.paidAmount, 0)
  return (
    <Modal title="إيصال التحصيل والتسليم" eyebrow={`RCT-${order.id.replace("ORD-", "")}`} close={close} className="cash-receipt-modal">
      <div className="cash-receipt-print">
        <div className="receipt-brand"><span><ReceiptText aria-hidden="true" /></span><div><strong>الشاعر للتوزيع الدوائي</strong><small>إيصال تسليم وتحصيل · نسخة تجريبية</small></div><b dir="ltr">RCT-{order.id.replace("ORD-", "")}</b></div>
        <div className="receipt-success"><Check aria-hidden="true" /><span><strong>تم تسليم الطلب بنجاح</strong><small>{formatTime(proof.deliveredAt)}</small></span></div>
        <dl className="receipt-details">
          <div><dt>رقم الطلب</dt><dd dir="ltr">{order.id}</dd></div>
          <div><dt>الصيدلية</dt><dd>{order.pharmacy}</dd></div>
          <div><dt>المستلم</dt><dd>{proof.recipient}</dd></div>
          <div><dt>المندوب</dt><dd>{driverName}</dd></div>
          <div><dt>طريقة التحصيل</dt><dd>{proof.paymentMethod}</dd></div>
          <div><dt>حالة رمز التحقق</dt><dd>{proof.otpVerified ? "موثّق برمز الصيدلية" : "غير موثّق"}</dd></div>
        </dl>
        <div className="receipt-amounts"><div><span>قيمة الطلب</span><strong>{formatCurrency(order.total)}</strong></div><div className="receipt-collected"><span>المبلغ المحصّل</span><strong>{formatCurrency(proof.collectedAmount)}</strong></div><div><span>الرصيد المتبقي</span><strong>{formatCurrency(remaining)}</strong></div></div>
        {proof.note && <p className="receipt-note">ملاحظة: {proof.note}</p>}
        {proof.evidence && <div className="receipt-evidence"><span>{proof.evidence.type === "photo" ? <Camera aria-hidden="true" /> : <PenLine aria-hidden="true" />}{proof.evidence.type === "photo" ? "صورة إثبات التسليم" : "توقيع المستلم"}</span><img src={proof.evidence.dataUrl} alt={proof.evidence.type === "photo" ? "صورة إثبات التسليم" : "توقيع مستلم الطلب"} /></div>}
        <div className="receipt-foot"><MapPin aria-hidden="true" /><span>{order.deliveryAddress || order.region}</span><small>هذا الإيصال ناتج عن عرض تجريبي ولا يُعد مستندًا ماليًا.</small></div>
      </div>
      <div className="form-actions receipt-actions"><button type="button" className="subtle-button" onClick={() => window.print()}><Printer aria-hidden="true" /> طباعة / PDF</button><button type="button" className="primary-button" onClick={close}>تم</button></div>
    </Modal>
  )
}
