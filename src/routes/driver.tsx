import { createFileRoute } from "@tanstack/react-router"
import { WholesaleApp } from "@/components/wholesale/wholesale-app"

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "تطبيق المندوب | الشاعر للتوزيع الدوائي" },
      { name: "description", content: "مسار التوصيل اليومي وإثبات التسليم والتحصيل لمندوبي الشاعر." },
      { property: "og:title", content: "تطبيق المندوب | الشاعر للتوزيع الدوائي" },
      { property: "og:description", content: "مسار التوصيل اليومي وإثبات التسليم والتحصيل لمندوبي الشاعر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <WholesaleApp initialRole="driver" />,
})
