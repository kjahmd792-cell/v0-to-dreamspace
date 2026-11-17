import { createFileRoute } from "@tanstack/react-router"
import { WholesaleApp, type DemoRole } from "@/components/wholesale/wholesale-app"

const demoRoles: DemoRole[] = ["owner", "inventory", "orders", "dispatcher", "driver", "pharmacy"]

export const Route = createFileRoute("/company/")({
  validateSearch: (search: Record<string, unknown>): { role?: DemoRole | undefined; tour?: boolean | undefined } => ({
    role: demoRoles.includes(search["role"] as DemoRole) ? (search["role"] as DemoRole) : undefined,
    tour: search["tour"] === true || search["tour"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "تطبيق الشركة | الشاعر للتوزيع الدوائي" },
      { name: "description", content: "لوحة الشركة التجريبية: الطلبات والمخزون والصيدليات والتوصيل والفواتير." },
      { property: "og:title", content: "تطبيق الشركة | الشاعر للتوزيع الدوائي" },
      { property: "og:description", content: "لوحة الشركة التجريبية: الطلبات والمخزون والصيدليات والتوصيل والفواتير." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyAppPage,
})

function CompanyAppPage() {
  const { role, tour } = Route.useSearch()
  const initialDemoRole = role ?? "owner"
  return <WholesaleApp key={initialDemoRole} initialRole="company" initialDemoRole={initialDemoRole} startTour={tour === true} />
}
