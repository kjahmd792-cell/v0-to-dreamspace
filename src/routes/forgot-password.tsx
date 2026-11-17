import { createFileRoute } from "@tanstack/react-router"
import { ForgotPasswordForm } from "@/components/password-reset"

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة المرور | الشاعر" },
      { name: "description", content: "اطلب رابطًا لتأكيد بريدك واختيار كلمة مرور جديدة لحساب الصيدلية." },
      { property: "og:title", content: "تعيين كلمة المرور | الشاعر" },
      { property: "og:description", content: "اطلب رابطًا لتأكيد بريدك واختيار كلمة مرور جديدة لحساب الصيدلية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordForm,
})
