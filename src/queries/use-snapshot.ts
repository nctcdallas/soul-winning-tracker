import { useQuery } from '@tanstack/react-query'
import { useSession } from '#/session/session'
import { POLL_INTERVAL, snapshotQueryOptions } from './options'

/** Loads and polls the member's records, and stays idle until a Google member is signed in. */
function useSnapshot() {
  const { session } = useSession()

  return useQuery({
    ...snapshotQueryOptions(),
    enabled: session.kind === 'member',
    // A failed first load stops polling so the error screen does not flicker back to "Opening".
    refetchInterval: (query) =>
      query.state.status === 'error' && query.state.data === undefined ? false : POLL_INTERVAL,
  })
}

export { useSnapshot }
