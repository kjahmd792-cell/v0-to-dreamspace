import { createFileRoute, redirect } from "@tanstack/react-router"
import { AuthForm } from "@/components/auth-form"
import { portalQueryOptions } from "@/lib/pharmacy-queries"

export const Route = createFileRoute("/_authenticated/complete-registration")({
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(portalQueryOptions())
    if (data.profile) throw redirect({ to: "/pharmacy/portal" })
  },
  head: () => ({
    meta: [
      { title: "أكمل ملف الصيدلية | الشاعر" },
      { name: "description", content: "أضف بيانات الصيدلية للبدء باستخدام حسابك على منصة الشاعر." },
      { property: "og:title", content: "أكمل ملف الصيدلية | الشاعر" },
      { property: "og:description", content: "أضف بيانات الصيدلية للبدء باستخدام حسابك على منصة الشاعر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthForm mode="complete-registration" />,
})
