import { createFileRoute } from "@tanstack/react-router"
import { ResetPasswordForm } from "@/components/password-reset"

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "كلمة مرور جديدة | الشاعر" },
      { name: "description", content: "اختر كلمة مرور جديدة لحساب صيدليتك على منصة الشاعر." },
      { property: "og:title", content: "كلمة مرور جديدة | الشاعر" },
      { property: "og:description", content: "اختر كلمة مرور جديدة لحساب صيدليتك على منصة الشاعر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordForm,
})
