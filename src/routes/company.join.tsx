import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/company/join")({
  beforeLoad: () => {
    throw redirect({ to: "/company/sign-in" })
  },
})
