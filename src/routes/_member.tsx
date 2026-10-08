import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { useSession } from '../session/session'

export const Route = createFileRoute('/_member')({ component: MemberLayout })

function MemberLayout() {
  const { session } = useSession()

  return session.kind === 'anon' ? <Navigate to="/" replace /> : <Outlet />
}
