import { useQuery } from '@tanstack/react-query'
import { useSession } from '#/session/session'
import { snapshotQueryOptions } from './options'

// TanStack Query resets a query that has an error and no data to `pending` on each refetch, so a failed first load waits for Try again.
const firstLoadFailed = (state: { status: string; data: unknown }) =>
  state.status === 'error' && state.data === undefined

/** Loads the member's records and reads them again when the window gets the focus. It stays idle until a Google member is signed in. */
function useSnapshot() {
  const { session } = useSession()

  return useQuery({
    ...snapshotQueryOptions(),
    enabled: session.kind === 'member',
    refetchOnWindowFocus: (query) => !firstLoadFailed(query.state),
  })
}

export { useSnapshot }
