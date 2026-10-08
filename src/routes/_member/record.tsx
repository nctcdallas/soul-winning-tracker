import { createFileRoute } from '@tanstack/react-router'
import { RecordTab } from '../../components/record-tab'
import { SnapshotGate } from '../../components/snapshot-gate'

export const Route = createFileRoute('/_member/record')({ component: RecordPage })

function RecordPage() {
  return <SnapshotGate>{(snapshot) => <RecordTab viewer={snapshot.viewer} />}</SnapshotGate>
}
