import { queryOptions } from '@tanstack/react-query'
import { getPublicTotals, getSnapshot } from '#/server/functions'
import type { Result } from '#/journeys/types'

const POLL_INTERVAL = 5000
const SNAPSHOT_KEY = ['snapshot']
const TOTALS_KEY = ['totals']

function unwrap<Body>(result: Result<Body>) {
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.body
}

function totalsQueryOptions() {
  return queryOptions({
    queryKey: TOTALS_KEY,
    queryFn: async () => unwrap(await getPublicTotals()).totals,
    retry: false,
  })
}

function snapshotQueryOptions() {
  return queryOptions({
    queryKey: SNAPSHOT_KEY,
    queryFn: async () => unwrap(await getSnapshot()),
    retry: false,
  })
}

export { POLL_INTERVAL, SNAPSHOT_KEY, snapshotQueryOptions, totalsQueryOptions, unwrap }
