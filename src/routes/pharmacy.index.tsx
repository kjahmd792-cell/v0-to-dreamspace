import { createFileRoute } from "@tanstack/react-router"
import { WholesaleApp } from "@/components/wholesale/wholesale-app"

export const Route = createFileRoute("/pharmacy/")({
  head: () => ({
    meta: [
      { title: "تجربة حساب الصيدلية | الشاعر" },
      { name: "description", content: "جرّب كتالوج الشركة وسلة الطلبات ومتابعة التوصيل من واجهة الصيدلية." },
      { property: "og:title", content: "تجربة حساب الصيدلية | الشاعر" },
      { property: "og:description", content: "جرّب كتالوج الشركة وسلة الطلبات ومتابعة التوصيل من واجهة الصيدلية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <WholesaleApp initialRole="pharmacy" />,
})
