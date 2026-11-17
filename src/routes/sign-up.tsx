import { createFileRoute } from "@tanstack/react-router"
import { AuthForm } from "@/components/auth-form"

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب صيدلية | الشاعر" },
      { name: "description", content: "أنشئ حساب صيدليتك على منصة الشاعر واطلب من كتالوج الشركة." },
      { property: "og:title", content: "إنشاء حساب صيدلية | الشاعر" },
      { property: "og:description", content: "أنشئ حساب صيدليتك على منصة الشاعر واطلب من كتالوج الشركة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthForm mode="sign-up" />,
})
