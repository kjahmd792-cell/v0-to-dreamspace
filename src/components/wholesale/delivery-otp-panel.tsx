
import { useEffect, useRef, useState } from "react"
import { BellRing, KeyRound, RotateCw, ShieldCheck, Store, X } from "lucide-react"
import { cancelOtp, issueOtp, OTP_LENGTH, OTP_RESEND_MS, useDeliveryOtps, verifyOtp } from "./otp-store"
import type { Order } from "./types"

const errorCopy = {
  invalid: "الرمز غير صحيح، تأكد منه مع الصيدلية وحاول مرة أخرى.",
  expired: "انتهت صلاحية الرمز. أرسل رمزًا جديدًا.",
  missing: "لا يوجد رمز نشط لهذا الطلب. أرسل رمزًا جديدًا.",
} as const

function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

export function DeliveryOtpPanel({ order, driverName, onVerified, onCancel, onOpenPharmacy }: {
  order: Order
  driverName: string
  onVerified: () => void
  onCancel: () => void
  onOpenPharmacy?: (() => void) | undefined
}) {
  const otps = useDeliveryOtps()
  const otp = otps.find((item) => item.orderId === order.id && item.status === "pending")
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""))
  const [error, setError] = useState<keyof typeof errorCopy | null>(null)
  const [shake, setShake] = useState(0)
  const [success, setSuccess] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [otp?.sentAt])

  const remaining = otp ? otp.expiresAt - now : 0
  const canResend = !otp || now - otp.sentAt >= OTP_RESEND_MS
  const resendIn = otp ? OTP_RESEND_MS - (now - otp.sentAt) : 0
  const code = digits.join("")

  function send() {
    issueOtp({ orderId: order.id, pharmacy: order.pharmacy, driverName, total: order.total, itemsCount: order.items.length })
    setDigits(Array(OTP_LENGTH).fill(""))
    setError(null)
    setNow(Date.now())
  }

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "")
    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH).split("")
      setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? ""))
      inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
      setError(null)
      return
    }
    setDigits((current) => current.map((digit, i) => i === index ? clean : digit))
    setError(null)
    if (clean && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (code.length !== OTP_LENGTH) return
    const result = verifyOtp(order.id, code)
    if (result === "ok") {
      setSuccess(true)
      window.setTimeout(onVerified, 900)
      return
    }
    setError(result)
    setShake((value) => value + 1)
    if (result === "invalid") {
      setDigits(Array(OTP_LENGTH).fill(""))
      inputs.current[0]?.focus()
    }
  }

  function cancel() {
    cancelOtp(order.id)
    onCancel()
  }

  if (success) {
    return <div className="otp-panel otp-panel-success" role="status" aria-live="polite">
      <span className="otp-success-icon"><ShieldCheck aria-hidden="true" /></span>
      <strong>تم التحقق من الرمز بنجاح</strong>
      <small>جارٍ فتح نموذج إثبات التسليم والتحصيل...</small>
    </div>
  }

  return (
    <form className="otp-panel" onSubmit={submit} aria-labelledby={`otp-title-${order.id}`}>
      <div className="otp-panel-head">
        <span className="otp-panel-icon"><KeyRound aria-hidden="true" /></span>
        <div>
          <strong id={`otp-title-${order.id}`}>رمز تأكيد التسليم</strong>
          <small>أُرسل رمز من {OTP_LENGTH} أرقام كإشعار إلى حساب <b>{order.pharmacy}</b>. اطلب الرمز من المستلم وأدخله هنا.</small>
        </div>
        <button type="button" className="otp-close" onClick={cancel} aria-label="إلغاء التحقق"><X aria-hidden="true" /></button>
      </div>

      <div className="otp-sent-chip" aria-live="polite">
        <BellRing aria-hidden="true" />
        <span>{otp ? "تم إرسال الإشعار للصيدلية" : "لا يوجد رمز نشط"}</span>
        {otp && <b className={remaining < 60000 ? "otp-timer otp-timer-warn" : "otp-timer"}>{remaining > 0 ? `صالح لمدة ${formatCountdown(remaining)}` : "منتهي"}</b>}
      </div>

      <div key={shake} className={error ? "otp-inputs otp-shake" : "otp-inputs"} dir="ltr" role="group" aria-label="أدخل رمز التحقق">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => { inputs.current[index] = element }}
            className={digit ? "otp-digit filled" : "otp-digit"}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={OTP_LENGTH}
            value={digit}
            aria-label={`الرقم ${index + 1}`}
            aria-invalid={error ? true : undefined}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
          />
        ))}
      </div>

      {error && <p className="otp-error" role="alert">{errorCopy[error]}</p>}

      <div className="otp-actions">
        <button type="submit" className="primary-button" disabled={code.length !== OTP_LENGTH || !otp}><ShieldCheck aria-hidden="true" /> تحقق وأكمل التسليم</button>
        <button type="button" className="subtle-button" onClick={send} disabled={!canResend}><RotateCw aria-hidden="true" />{canResend ? "إعادة إرسال الرمز" : `إعادة الإرسال بعد ${Math.ceil(resendIn / 1000)} ث`}</button>
      </div>

      {onOpenPharmacy && <button type="button" className="otp-demo-link" onClick={onOpenPharmacy}><Store aria-hidden="true" /> عرض تجريبي: افتح حساب الصيدلية لرؤية الإشعار والرمز</button>}
    </form>
  )
}
