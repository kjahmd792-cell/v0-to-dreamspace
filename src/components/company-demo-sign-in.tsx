import { Link, type LinkOptions } from "@tanstack/react-router"
import { ArrowLeft, ArrowUpLeft, Boxes, ClipboardList, LayoutDashboard, Store, Truck, UserRound } from "lucide-react"

const demoAccounts: Array<{ role: string; name: string; subtitle: string; email: string; icon: typeof Store; link: LinkOptions; tone: string }> = [
  { role: "owner", name: "مالك الشركة", subtitle: "لوحة كاملة لإدارة العمليات", email: "owner@demo.local", icon: LayoutDashboard, link: { to: "/company", search: { role: "owner" } }, tone: "teal" },
  { role: "inventory", name: "مسؤول المخزون", subtitle: "المنتجات والكميات والتنبيهات", email: "stock@demo.local", icon: Boxes, link: { to: "/company", search: { role: "inventory" } }, tone: "blue" },
  { role: "orders", name: "مسؤول الطلبات", subtitle: "الطلبات والصيدليات والفواتير", email: "orders@demo.local", icon: ClipboardList, link: { to: "/company", search: { role: "orders" } }, tone: "amber" },
  { role: "dispatcher", name: "مسؤول التوصيل", subtitle: "توزيع المسارات ومتابعة السائقين", email: "dispatch@demo.local", icon: Truck, link: { to: "/company", search: { role: "dispatcher" } }, tone: "violet" },
  { role: "driver", name: "مندوب التوصيل", subtitle: "مسار اليوم وإثبات التسليم", email: "driver@demo.local", icon: Truck, link: { to: "/driver" }, tone: "green" },
  { role: "pharmacy", name: "حساب الصيدلية", subtitle: "الكتالوج والسلة ومتابعة الطلبات", email: "pharmacy@demo.local", icon: Store, link: { to: "/pharmacy" }, tone: "rose" },
]

export function CompanyDemoSignIn() {
  return (
    <main className="demo-login-page" dir="rtl">
      <div className="demo-login-shell">
        <header className="demo-login-header">
          <Link className="brand demo-login-brand" to="/" aria-label="الشاعر للتوزيع الدوائي، الصفحة الرئيسية">
            <span className="brand-mark"><Store aria-hidden="true" /></span><span className="brand-copy"><strong>الشاعر</strong><small>للتوزيع الدوائي</small></span>
          </Link>
          <Link className="demo-return-link demo-return-light" to="/company">العودة إلى لوحة العرض <ArrowUpLeft aria-hidden="true" /></Link>
        </header>

        <section className="demo-login-intro" aria-labelledby="demo-login-title">
          <span className="demo-login-kicker"><UserRound aria-hidden="true" /> دخول العرض التجريبي</span>
          <h1 id="demo-login-title">اختر الحساب الذي تريد عرضه</h1>
          <p>شركة واحدة، وأدوار مختلفة لتجربة الواجهات. لا تحتاج إلى إنشاء حساب أو إدخال كلمة مرور.</p>
          <span className="demo-only-badge">بيانات توضيحية · لا يتم حفظ أي تغيير</span>
        </section>

        <section className="demo-account-grid" aria-label="الحسابات التجريبية">
          {demoAccounts.map((account) => {
            const Icon = account.icon
            return <article className="demo-account-card" key={account.role}>
              <div className={`demo-account-icon tone-${account.tone}`}><Icon aria-hidden="true" /></div>
              <div className="demo-account-copy"><h2>{account.name}</h2><p>{account.subtitle}</p></div>
              <span className="demo-account-email" dir="ltr">{account.email}</span>
              <Link className="demo-account-action" {...account.link}>دخول سريع <ArrowLeft aria-hidden="true" /></Link>
            </article>
          })}
        </section>

        <footer className="demo-login-footer"><span>عرض تجريبي لشركة واحدة</span><span>الحسابات والبيانات تجريبية فقط</span></footer>
      </div>
    </main>
  )
}
