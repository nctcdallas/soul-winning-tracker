import { createFileRoute } from '@tanstack/react-router'
import { PrayersTab } from '../../components/prayers-tab'
import { SnapshotGate } from '../../components/snapshot-gate'

export const Route = createFileRoute('/_member/prayers')({ component: PrayersPage })

function PrayersPage() {
  return <SnapshotGate>{(snapshot) => <PrayersTab snapshot={snapshot} />}</SnapshotGate>
}
