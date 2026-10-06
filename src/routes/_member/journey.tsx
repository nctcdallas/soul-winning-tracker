import { createFileRoute } from '@tanstack/react-router'
import { JourneyTab } from '../../components/journey-tab'
import { SnapshotGate } from '../../components/snapshot-gate'

export const Route = createFileRoute('/_member/journey')({ component: JourneyPage })

function JourneyPage() {
  return <SnapshotGate>{(snapshot) => <JourneyTab snapshot={snapshot} />}</SnapshotGate>
}
