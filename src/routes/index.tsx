import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { OverviewTab } from '../components/overview-tab'
import { PublicPage } from '../components/public-page'
import { SnapshotGate } from '../components/snapshot-gate'
import { POLL_INTERVAL, totalsQueryOptions } from '../queries/options'
import { useSession } from '../session/session'

export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(totalsQueryOptions()).catch(() => undefined),
  component: Home,
})

function Home() {
  const { session } = useSession()
  const totals = useQuery({
    ...totalsQueryOptions(),
    enabled: session.kind === 'anon',
    refetchInterval: POLL_INTERVAL,
  })

  if (session.kind === 'anon') {
    return <PublicPage totals={totals.data} totalsUnavailable={totals.isError} />
  }

  return <SnapshotGate>{(snapshot) => <OverviewTab snapshot={snapshot} />}</SnapshotGate>
}
