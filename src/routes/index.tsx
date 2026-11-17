import { createFileRoute } from "@tanstack/react-router"
import { LandingPage } from "@/components/landing/landing-page"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الشاعر | منصة متكاملة للتوزيع الدوائي" },
      { name: "description", content: "منصة واحدة للطلبات والمخزون والتوصيل والتحصيل تربط شركة التوزيع بالصيدليات والمندوبين." },
      { property: "og:title", content: "الشاعر | منصة متكاملة للتوزيع الدوائي" },
      { property: "og:description", content: "منصة واحدة للطلبات والمخزون والتوصيل والتحصيل تربط شركة التوزيع بالصيدليات والمندوبين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
})
