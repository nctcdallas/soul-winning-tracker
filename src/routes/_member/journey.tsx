import { createFileRoute } from '@tanstack/react-router'
import { JourneyTab } from '../../components/journey-tab'
import { SnapshotGate } from '../../components/snapshot-gate'

interface JourneySearch {
  /** The id of the person whose row is open, from a link on Overview. */
  person?: number
}

export const Route = createFileRoute('/_member/journey')({
  validateSearch: (search): JourneySearch => {
    const person = Number(search.person)

    return Number.isInteger(person) && person > 0 ? { person } : {}
  },
  component: JourneyPage,
})

function JourneyPage() {
  const { person } = Route.useSearch()

  return (
    <SnapshotGate>
      {(snapshot) => <JourneyTab snapshot={snapshot} openPersonId={person} />}
    </SnapshotGate>
  )
}
