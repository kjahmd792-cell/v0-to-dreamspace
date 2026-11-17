import { createFileRoute } from "@tanstack/react-router"
import { AuthForm } from "@/components/auth-form"

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "تسجيل دخول الصيدليات | الشاعر" },
      { name: "description", content: "سجّل الدخول إلى بوابة الشاعر لمتابعة طلبات صيدليتك." },
      { property: "og:title", content: "تسجيل دخول الصيدليات | الشاعر" },
      { property: "og:description", content: "سجّل الدخول إلى بوابة الشاعر لمتابعة طلبات صيدليتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthForm mode="sign-in" redirectTo="/pharmacy/portal" />,
})
