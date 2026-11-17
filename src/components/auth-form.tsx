
import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { ArrowLeft, CheckCircle2, LockKeyhole, MailCheck, PackageCheck, Pill, ShieldCheck, Store } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { completePharmacyRegistration, type PharmacyRegistrationInput } from "@/lib/pharmacy.functions"

type AuthMode = "sign-in" | "sign-up" | "complete-registration"

type Props = { mode: AuthMode; redirectTo?: "/pharmacy/portal"; accountType?: "pharmacy" | "company" }

const initialProfile: PharmacyRegistrationInput = {
  pharmacyName: "",
  contactName: "",
  phone: "",
  region: "",
  licenseNumber: "",
}

export function AuthForm({ mode, redirectTo = "/pharmacy/portal", accountType = "pharmacy" }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const saveRegistration = useServerFn(completePharmacyRegistration)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [profile, setProfile] = useState(initialProfile)
  const [error, setError] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const isSignIn = mode === "sign-in"
  const isSignUp = mode === "sign-up"
  const isCompleting = mode === "complete-registration"
  const isCompanyAccount = accountType === "company"
  const title = isSignIn ? "مرحبًا بعودتك" : isCompleting ? "أكمل ملف الصيدلية" : "أنشئ حساب الصيدلية"
  const description = isSignIn
    ? isCompanyAccount ? "سجّل الدخول لإدارة عمليات شركتك." : "سجّل الدخول لمتابعة طلبات صيدليتك."
    : isCompleting
      ? "أضف بيانات الصيدلية للبدء باستخدام حسابك."
      : "التسجيل متاح للصيدليات فقط في هذه المرحلة."

  useEffect(() => {
    let active = true
    if (isSignIn || isSignUp) {
      // Already signed in: go straight to the portal, as the original pages did.
      supabase.auth.getSession().then(({ data }) => {
        if (active && data.session) navigate({ to: redirectTo, replace: true })
      })
    } else {
      // Prefill the profile captured at sign-up (kept on the account until the email is confirmed).
      supabase.auth.getUser().then(({ data }) => {
        const meta = data.user?.user_metadata ?? {}
        if (!active) return
        setProfile((current) => ({
          pharmacyName: current.pharmacyName || (typeof meta["pharmacyName"] === "string" ? meta["pharmacyName"] : ""),
          contactName: current.contactName || (typeof meta["contactName"] === "string" ? meta["contactName"] : ""),
          phone: current.phone || (typeof meta["phone"] === "string" ? meta["phone"] : ""),
          region: current.region || (typeof meta["region"] === "string" ? meta["region"] : ""),
          licenseNumber: current.licenseNumber || (typeof meta["licenseNumber"] === "string" ? meta["licenseNumber"] : ""),
        }))
      })
    }
    return () => { active = false }
  }, [isSignIn, isSignUp, navigate, redirectTo])

  function updateProfile<K extends keyof PharmacyRegistrationInput>(key: K, value: PharmacyRegistrationInput[K]) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsBusy(true)

    try {
      if (isSignIn) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (signInError) {
          setError(signInError.message.toLowerCase().includes("not confirmed")
            ? "أكّد بريدك الإلكتروني أولًا من الرابط المرسل إليك، ثم سجّل الدخول."
            : "تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور وحاول مرة أخرى.")
          return
        }
      } else if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/complete-registration`,
            data: { name: name.trim(), ...profile },
          },
        })
        if (signUpError) {
          setError("تعذر إنشاء الحساب. تحقق من البيانات أو جرّب تسجيل الدخول.")
          return
        }
        if (!data.session) {
          setAwaitingConfirmation(true)
          return
        }
      }

      if (isSignUp || isCompleting) {
        const savedProfile = await saveRegistration({ data: profile })
        if (!savedProfile.ok) {
          if (isSignUp) {
            navigate({ to: "/complete-registration", replace: true })
            return
          }
          setError(savedProfile.error)
          return
        }
      }

      // Drop any cached "no profile yet" result so the portal loads fresh data.
      queryClient.removeQueries({ queryKey: ["pharmacy-portal"] })
      navigate({ to: isSignIn ? redirectTo : "/pharmacy/portal", replace: true })
    } catch {
      setError("تعذر إتمام العملية الآن. حاول مرة أخرى بعد قليل.")
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-form-panel" aria-labelledby="auth-title">
        <div className="auth-form-card">
          <Link className="auth-brand" to={isCompanyAccount ? "/company/sign-in" : "/sign-in"} aria-label={isCompanyAccount ? "الشاعر، بوابة الشركات" : "الشاعر، بوابة الصيدليات"}>
            <span className="auth-brand-mark"><Pill aria-hidden="true" /></span>
            <span><strong>الشاعر</strong><small>{isCompanyAccount ? "بوابة الشركات" : "بوابة الصيدليات"}</small></span>
          </Link>

          <div className="auth-heading">
            <span className="auth-kicker">{isCompanyAccount ? "حسابات الشركات" : "حسابات الصيدليات"}</span>
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>

          {awaitingConfirmation ? (
            <div className="auth-confirmation" role="status">
              <MailCheck aria-hidden="true" />
              <p><strong>تحقق من بريدك الإلكتروني</strong>أرسلنا رابط تأكيد إلى <span dir="ltr">{email.trim()}</span>. افتح الرابط لتفعيل حساب الصيدلية وإكمال ملفها.</p>
            </div>
          ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <label className="auth-field">
                الاسم الكامل
                <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            )}

            {(isSignIn || isSignUp) && (
              <>
                <label className="auth-field">
                  البريد الإلكتروني
                  <input required type="email" maxLength={254} autoComplete="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <label className="auth-field">
                  كلمة المرور
                  <input required type="password" minLength={8} maxLength={128} autoComplete={isSignIn ? "current-password" : "new-password"} dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} />
                </label>
              </>
            )}

            {(isSignUp || isCompleting) && (
              <div className="auth-profile-grid">
                <label className="auth-field auth-field-wide">
                  اسم الصيدلية
                  <input required minLength={2} maxLength={100} autoComplete="organization" value={profile.pharmacyName} onChange={(event) => updateProfile("pharmacyName", event.target.value)} />
                </label>
                <label className="auth-field">
                  مسؤول التواصل
                  <input required minLength={2} maxLength={80} autoComplete="name" value={profile.contactName} onChange={(event) => updateProfile("contactName", event.target.value)} />
                </label>
                <label className="auth-field">
                  رقم التواصل
                  <input required type="tel" inputMode="tel" minLength={7} maxLength={24} autoComplete="tel" dir="ltr" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} />
                </label>
                <label className="auth-field">
                  المنطقة
                  <input required minLength={2} maxLength={60} autoComplete="address-level1" value={profile.region} onChange={(event) => updateProfile("region", event.target.value)} />
                </label>
                <label className="auth-field">
                  رقم الترخيص
                  <input required minLength={4} maxLength={48} value={profile.licenseNumber} onChange={(event) => updateProfile("licenseNumber", event.target.value)} />
                </label>
              </div>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={isBusy}>
              {isBusy ? "جارٍ الحفظ..." : isSignIn ? "تسجيل الدخول" : isCompleting ? "حفظ ملف الصيدلية" : "إنشاء حساب الصيدلية"}
              <ArrowLeft aria-hidden="true" />
            </button>
            {isSignIn && <p className="auth-forgot"><Link to="/forgot-password">نسيت كلمة المرور؟ أو لديك حساب من المنصة السابقة؟</Link></p>}
          </form>
          )}

          {!isCompleting && (
            <>
              <p className="auth-switch">
                {isSignIn
                  ? isCompanyAccount ? "لا تملك حساب شركة؟" : "ليس لديك حساب صيدلية؟"
                  : "لديك حساب بالفعل؟"} {" "}
                <Link to={isSignIn ? isCompanyAccount ? "/company/sign-up" : "/sign-up" : isCompanyAccount ? "/company/sign-in" : "/sign-in"}>
                  {isSignIn ? "أنشئ حسابًا" : "سجّل الدخول"}
                </Link>
              </p>
              {isCompanyAccount
                ? <p className="auth-switch">حساب صيدلية؟ <Link to="/sign-in">دخول الصيدليات</Link></p>
                : <p className="auth-switch">تعمل في شركة توزيع؟ <Link to="/company/sign-in">دخول الشركات</Link></p>}
            </>
          )}
          <p className="auth-privacy"><LockKeyhole aria-hidden="true" /> {isCompanyAccount ? "تُعرض بيانات الشركة وفق عضويتك ودورك داخلها." : "بيانات الطلبات مرتبطة بحسابك ولا تظهر لحسابات الصيدليات الأخرى."}</p>
        </div>
      </section>

      <aside className="auth-brand-panel" aria-label={isCompanyAccount ? "عن بوابة الشركات" : "عن بوابة الصيدليات"}>
        <div className="auth-brand-panel-top"><span className="auth-brand-mark auth-brand-mark-light"><Store aria-hidden="true" /></span><span>منصة الشاعر</span></div>
        <div className="auth-brand-copy">
          <span className="auth-panel-eyebrow"><ShieldCheck aria-hidden="true" /> {isCompanyAccount ? "مساحة شركات خاصة" : "مساحة صيدليات خاصة"}</span>
          <h2>{isCompanyAccount ? <>إدارة شركتك،<br />في مساحة واحدة.</> : <>طلباتك ومتابعتها،<br />في مساحة واحدة.</>}</h2>
          <p>{isCompanyAccount ? "تابع الكتالوج والمخزون والطلبات والتوصيل ضمن مساحة الشركة." : "أنشئ حساب صيدليتك، احتفظ بطلباتك في مكان واحد، وتابع تفاصيلها بسهولة."}</p>
          <div className="auth-feature-list">
            <div><span><CheckCircle2 aria-hidden="true" /></span><p><strong>{isCompanyAccount ? "عزل بيانات الشركات" : "حساب مستقل"}</strong><small>{isCompanyAccount ? "كل قراءة وتعديل مرتبط بعضوية الشركة الحالية." : "بيانات كل صيدلية معزولة عن الحسابات الأخرى."}</small></p></div>
            <div><span><PackageCheck aria-hidden="true" /></span><p><strong>{isCompanyAccount ? "صلاحيات حسب الدور" : "طلبات محفوظة"}</strong><small>{isCompanyAccount ? "صلاحيات الفريق محفوظة على الخادم." : "طلباتك تبقى مرتبطة بحسابك بعد تسجيل الخروج."}</small></p></div>
          </div>
        </div>
        <p className="auth-panel-footnote">{isCompanyAccount ? "تُدار عضويات الشركة بدعوات أحادية الاستخدام." : "استعرض كتالوج الشركة بعد اعتماد حساب الصيدلية."}</p>
      </aside>
    </main>
  )
}
