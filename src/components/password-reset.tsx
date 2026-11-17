import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, KeyRound, MailCheck, Pill, ShieldCheck, Store } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

function ResetShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-form-panel" aria-labelledby="auth-title">
        <div className="auth-form-card">
          <Link className="auth-brand" to="/sign-in" aria-label="الشاعر، بوابة الصيدليات">
            <span className="auth-brand-mark"><Pill aria-hidden="true" /></span>
            <span><strong>الشاعر</strong><small>بوابة الصيدليات</small></span>
          </Link>
          <div className="auth-heading">
            <span className="auth-kicker">حسابات الصيدليات</span>
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>
          {children}
          <p className="auth-switch">تذكرت كلمة المرور؟ <Link to="/sign-in">سجّل الدخول</Link></p>
        </div>
      </section>
      <aside className="auth-brand-panel" aria-label="عن بوابة الصيدليات">
        <div className="auth-brand-panel-top"><span className="auth-brand-mark auth-brand-mark-light"><Store aria-hidden="true" /></span><span>منصة الشاعر</span></div>
        <div className="auth-brand-copy">
          <span className="auth-panel-eyebrow"><ShieldCheck aria-hidden="true" /> مساحة صيدليات خاصة</span>
          <h2>حسابك وطلباتك،<br />بأمان.</h2>
          <p>إذا كان لديك حساب على المنصة السابقة، أكّد بريدك واختر كلمة مرور جديدة لتصل إلى ملف صيدليتك وطلباتها.</p>
        </div>
        <p className="auth-panel-footnote">لا نطلب كلمة مرورك القديمة أبدًا.</p>
      </aside>
    </main>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [isBusy, setIsBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsBusy(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) {
        setError("تعذر إرسال الرابط الآن. حاول مرة أخرى بعد قليل.")
        return
      }
      setSent(true)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <ResetShell title="تعيين كلمة مرور" description="أدخل بريد حساب الصيدلية وسنرسل لك رابطًا لتأكيد البريد واختيار كلمة مرور جديدة.">
      {sent ? (
        <div className="auth-confirmation" role="status">
          <MailCheck aria-hidden="true" />
          <p><strong>تحقق من بريدك الإلكتروني</strong>إذا كان البريد <span dir="ltr">{email.trim()}</span> مسجلًا لدينا، فستصلك رسالة تحتوي على رابط تعيين كلمة المرور.</p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            البريد الإلكتروني
            <input required type="email" maxLength={254} autoComplete="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isBusy}>
            {isBusy ? "جارٍ الإرسال..." : "إرسال الرابط"}
            <ArrowLeft aria-hidden="true" />
          </button>
        </form>
      )}
    </ResetShell>
  )
}

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [ready, setReady] = useState<"checking" | "ready" | "invalid">("checking")

  useEffect(() => {
    let active = true
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === "PASSWORD_RECOVERY" || session) setReady("ready")
    })
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const isRecoveryLink = window.location.hash.includes("type=recovery") || window.location.search.includes("code=")
      if (data.session) setReady("ready")
      else if (!isRecoveryLink) setReady("invalid")
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.")
      return
    }
    setIsBusy(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError("تعذر حفظ كلمة المرور. اطلب رابطًا جديدًا وحاول مرة أخرى.")
        return
      }
      navigate({ to: "/pharmacy/portal", replace: true })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <ResetShell title="اختر كلمة مرور جديدة" description="تم تأكيد بريدك. اختر كلمة مرور جديدة لحساب الصيدلية.">
      {ready === "invalid" ? (
        <div className="auth-confirmation" role="alert">
          <KeyRound aria-hidden="true" />
          <p><strong>الرابط غير صالح أو منتهي</strong>اطلب رابطًا جديدًا من صفحة <Link to="/forgot-password">تعيين كلمة المرور</Link>.</p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            كلمة المرور الجديدة
            <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="auth-field">
            تأكيد كلمة المرور
            <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" dir="ltr" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isBusy || ready !== "ready"}>
            {isBusy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
            <ArrowLeft aria-hidden="true" />
          </button>
        </form>
      )}
    </ResetShell>
  )
}
