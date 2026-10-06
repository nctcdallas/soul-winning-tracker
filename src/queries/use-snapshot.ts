import { useQuery } from '@tanstack/react-query'
import { useSession } from '#/session/session'
import { POLL_INTERVAL, snapshotQueryOptions } from './options'

// TanStack Query resets a query that has an error and no data to `pending` on each refetch.
const firstLoadFailed = (state: { status: string; data: unknown }) =>
  state.status === 'error' && state.data === undefined

/** Loads and polls the member's records, and stays idle until a Google member is signed in. */
function useSnapshot() {
  const { session } = useSession()

  return useQuery({
    ...snapshotQueryOptions(),
    enabled: session.kind === 'member',
    refetchInterval: (query) => (firstLoadFailed(query.state) ? false : POLL_INTERVAL),
  })
}

export { useSnapshot }
