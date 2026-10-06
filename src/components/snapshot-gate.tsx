import { useSession } from '#/session/session'
import { useSnapshot } from '#/queries/use-snapshot'
import { OpeningScreen, UnavailableScreen, WrongProviderScreen } from './welcome-screens'
import type { Snapshot } from '#/journeys/types'
import type { ReactNode } from 'react'

/** Renders its children once the member's records are loaded, and the matching screen until then. */
function SnapshotGate({ children }: { children: (snapshot: Snapshot) => ReactNode }) {
  const { session } = useSession()
  const snapshot = useSnapshot()

  if (session.kind === 'wrong-provider') {
    return <WrongProviderScreen />
  }

  if (session.kind !== 'member') {
    return null
  }

  if (snapshot.data) {
    return children(snapshot.data)
  }

  if (snapshot.isError) {
    return (
      <UnavailableScreen message={snapshot.error.message} onRetry={() => void snapshot.refetch()} />
    )
  }

  return <OpeningScreen />
}

export { SnapshotGate }
