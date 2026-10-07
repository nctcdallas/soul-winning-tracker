import { createFileRoute, redirect } from '@tanstack/react-router'

// The Prayer list page was folded into My journey, and a bookmarked address must still open.
export const Route = createFileRoute('/_member/prayers')({
  beforeLoad: () => {
    throw redirect({ to: '/journey', replace: true })
  },
})
