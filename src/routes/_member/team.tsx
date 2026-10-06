import { Navigate, createFileRoute } from '@tanstack/react-router'
import { SnapshotGate } from '../../components/snapshot-gate'
import { TeamTab } from '../../components/team-tab'

export const Route = createFileRoute('/_member/team')({ component: TeamPage })

function TeamPage() {
  return (
    <SnapshotGate>
      {(snapshot) =>
        snapshot.viewer.isLeader ? <TeamTab snapshot={snapshot} /> : <Navigate to="/" replace />
      }
    </SnapshotGate>
  )
}
