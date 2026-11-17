import { createFileRoute, redirect } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { PharmacyPortal } from "@/components/wholesale/pharmacy-portal"
import { portalQueryOptions } from "@/lib/pharmacy-queries"

export const Route = createFileRoute("/_authenticated/pharmacy/portal")({
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(portalQueryOptions())
    if (!data.profile) throw redirect({ to: "/complete-registration" })
  },
  head: () => ({
    meta: [
      { title: "بوابة الصيدلية | الشاعر" },
      { name: "description", content: "كتالوج الشركة وسلة الطلبات وطلبات صيدليتك المحفوظة." },
      { property: "og:title", content: "بوابة الصيدلية | الشاعر" },
      { property: "og:description", content: "كتالوج الشركة وسلة الطلبات وطلبات صيدليتك المحفوظة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PharmacyPortalPage,
})

function PharmacyPortalPage() {
  const { data } = useSuspenseQuery(portalQueryOptions())
  if (!data.profile) return null
  return <PharmacyPortal email={data.email} profile={data.profile} initialProducts={data.products} initialOrders={data.orders} />
}
