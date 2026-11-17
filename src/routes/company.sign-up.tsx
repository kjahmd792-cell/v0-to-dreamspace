import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/company/sign-up")({
  beforeLoad: () => {
    throw redirect({ to: "/company/sign-in" })
  },
})
