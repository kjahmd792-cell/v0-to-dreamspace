import { createFileRoute } from "@tanstack/react-router"
import { CompanyDemoSignIn } from "@/components/company-demo-sign-in"

export const Route = createFileRoute("/company/sign-in")({
  head: () => ({
    meta: [
      { title: "الحسابات التجريبية | الشاعر" },
      { name: "description", content: "اختر الدور الذي تريد تجربته: مالك الشركة، المخزون، الطلبات، التوصيل، المندوب أو الصيدلية." },
      { property: "og:title", content: "الحسابات التجريبية | الشاعر" },
      { property: "og:description", content: "اختر الدور الذي تريد تجربته في منصة الشاعر للتوزيع الدوائي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyDemoSignIn,
})
