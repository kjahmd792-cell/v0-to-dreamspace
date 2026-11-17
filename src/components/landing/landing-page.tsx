import { Link } from "@tanstack/react-router"
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileText,
  PackageCheck,
  PlayCircle,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react"

const stats = [
  { value: "+120", label: "صيدلية على المنصة" },
  { value: "340", label: "طلب يوميًا" },
  { value: "97%", label: "تسليم في الوقت" },
  { value: "4", label: "تطبيقات مترابطة" },
]

const apps = [
  { title: "تطبيق الشركة", description: "الطلبات والمخزون والفواتير والتقارير في لوحة واحدة.", icon: Building2, tone: "teal", link: { to: "/company", search: { role: "owner" } } as const },
  { title: "بوابة الصيدلية", description: "كتالوج، سلة، متابعة الطلبات، وكشف حساب لحظي.", icon: Store, tone: "rose", link: { to: "/pharmacy" } as const },
  { title: "تطبيق المندوب", description: "مسار اليوم، إثبات التسليم برمز تحقق، وتحصيل نقدي.", icon: Truck, tone: "violet", link: { to: "/driver" } as const },
  { title: "الإدارة والصلاحيات", description: "أدوار الفريق، الفروع، العروض، والتكاملات.", icon: Users, tone: "amber", link: { to: "/company/sign-in" } as const },
]

const steps = [
  { title: "الصيدلية تطلب", description: "من الكتالوج مباشرة مع حجز فوري للكمية.", icon: ClipboardCheck },
  { title: "الشركة تجهّز", description: "مراجعة، تجهيز، وصرف الأقرب انتهاءً أولًا.", icon: PackageCheck },
  { title: "المندوب يسلّم", description: "تسليم مؤكد برمز تحقق يصل للصيدلية.", icon: ShieldCheck },
  { title: "الفاتورة تُصدر", description: "فاتورة ضريبية وتحصيل ومتابعة مستحقات.", icon: ReceiptText },
]

const features = [
  { title: "تتبع الصلاحية والتشغيلات", description: "تنبيهات قبل 90 و60 و30 يومًا من انتهاء الصلاحية.", icon: CalendarClock },
  { title: "المرتجعات وإشعارات الدائن", description: "دورة إرجاع كاملة تنعكس على المخزون والفاتورة.", icon: RotateCcw },
  { title: "الفوترة الإلكترونية", description: "فواتير ضريبية برمز QR جاهزة للطباعة.", icon: FileText },
  { title: "الحدود الائتمانية", description: "أعمار الديون وتذكيرات السداد عبر SMS وواتساب.", icon: Wallet },
  { title: "إدارة المخزون والموردين", description: "اقتراحات إعادة الطلب وأوامر شراء واستلام.", icon: Boxes },
  { title: "تقارير لحظية", description: "مبيعات، تحصيل، أداء المندوبين، وتصدير فوري.", icon: BarChart3 },
]

export function LandingPage() {
  return (
    <div className="landing" dir="rtl">
      <header className="landing-nav">
        <Link className="landing-brand" to="/" aria-label="الشاعر للتوزيع الدوائي">
          <span className="brand-mark"><Activity aria-hidden="true" /></span>
          <span><strong>الشاعر</strong><small>للتوزيع الدوائي</small></span>
        </Link>
        <nav className="landing-nav-actions" aria-label="روابط سريعة">
          <Link className="landing-link" to="/company/sign-in">الحسابات التجريبية</Link>
          <Link className="landing-link" to="/sign-in">دخول الصيدليات</Link>
          <Link className="landing-cta small" to="/company" search={{ role: "owner", tour: true }}>ابدأ العرض <ArrowLeft aria-hidden="true" /></Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker"><BadgeCheck aria-hidden="true" /> منصة توريد دوائي متكاملة</span>
          <h1>منصة واحدة للطلبات والمخزون والتوصيل والتحصيل</h1>
          <p>تربط شركتك بالصيدليات والمندوبين في مسار واحد واضح: من الطلب حتى الفاتورة، مع تتبع الصلاحية وتأكيد التسليم برمز تحقق.</p>
          <div className="landing-hero-actions">
            <Link className="landing-cta" to="/company" search={{ role: "owner", tour: true }}><PlayCircle aria-hidden="true" /> ابدأ العرض التجريبي</Link>
            <Link className="landing-ghost" to="/sign-up">تسجيل صيدلية</Link>
          </div>
          <dl className="landing-stats">
            {stats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
          </dl>
        </div>
        <div className="landing-mock" aria-hidden="true">
          <div className="mock-window">
            <div className="mock-bar"><span /><span /><span /></div>
            <div className="mock-body">
              <div className="mock-side"><i className="on" /><i /><i /><i /><i /><i /></div>
              <div className="mock-main">
                <div className="mock-kpis">
                  <div><small>طلبات اليوم</small><b>48</b></div>
                  <div><small>المبيعات</small><b>٣٢٬٤٠٠ ر.س</b></div>
                  <div><small>قيد التوصيل</small><b>12</b></div>
                </div>
                <div className="mock-chart">{[40, 55, 48, 70, 62, 85, 78, 92, 74, 96].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
                <div className="mock-rows"><i /><i /><i /></div>
              </div>
            </div>
          </div>
          <div className="mock-float mock-float-otp"><ShieldCheck /><span><b>تم التسليم</b><small>رمز التحقق 4821 ✓</small></span></div>
          <div className="mock-float mock-float-alert"><CalendarClock /><span><b>تنبيه صلاحية</b><small>3 تشغيلات خلال 30 يومًا</small></span></div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-apps">
        <div className="landing-section-head"><span className="landing-eyebrow">أربعة تطبيقات · نظام واحد</span><h2 id="landing-apps">كل طرف يعمل من واجهته</h2></div>
        <div className="landing-apps">
          {apps.map((app) => {
            const Icon = app.icon
            return <Link key={app.title} className="landing-app-card" {...app.link}>
              <span className={`landing-app-icon tone-${app.tone}`}><Icon aria-hidden="true" /></span>
              <h3>{app.title}</h3><p>{app.description}</p>
              <span className="landing-app-go">جرّب الواجهة <ArrowLeft aria-hidden="true" /></span>
            </Link>
          })}
        </div>
      </section>

      <section className="landing-section landing-flow-section" aria-labelledby="landing-flow">
        <div className="landing-section-head"><span className="landing-eyebrow">كيف يعمل</span><h2 id="landing-flow">من الطلب إلى الفاتورة في 4 خطوات</h2></div>
        <ol className="landing-flow">
          {steps.map((step, index) => {
            const Icon = step.icon
            return <li key={step.title}><span className="landing-flow-num">{(index + 1).toLocaleString("ar-SA")}</span><Icon aria-hidden="true" /><h3>{step.title}</h3><p>{step.description}</p></li>
          })}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="landing-features">
        <div className="landing-section-head"><span className="landing-eyebrow">مصمم لقطاع الأدوية</span><h2 id="landing-features">ما يحتاجه الموزع فعلًا</h2></div>
        <div className="landing-features">
          {features.map((feature) => {
            const Icon = feature.icon
            return <article key={feature.title}><Icon aria-hidden="true" /><h3>{feature.title}</h3><p>{feature.description}</p></article>
          })}
        </div>
      </section>

      <section className="landing-final">
        <h2>شاهد النظام كاملًا خلال 5 دقائق</h2>
        <p>جولة إرشادية تمر بك على لوحة الشركة والصيدلية والمندوب.</p>
        <div className="landing-hero-actions">
          <Link className="landing-cta" to="/company" search={{ role: "owner", tour: true }}><PlayCircle aria-hidden="true" /> ابدأ الجولة</Link>
          <Link className="landing-ghost light" to="/company/sign-in">اختيار حساب تجريبي</Link>
        </div>
      </section>

      <footer className="landing-footer"><span>© الشاعر للتوزيع الدوائي</span><span>عرض تجريبي · البيانات توضيحية</span></footer>
    </div>
  )
}
