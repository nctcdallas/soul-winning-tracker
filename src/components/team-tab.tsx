import { PeopleList } from './people-list'
import { SectionHeading } from './section-heading'
import type { Snapshot } from '#/journeys/types'

/** Every record across the ministry team, for leaders. */
function TeamTab({ snapshot }: { snapshot: Snapshot }) {
  return (
    <>
      <SectionHeading
        eyebrow="ADMIN VIEW"
        heading="Team records"
        description="Review encounters and prayer follow-up across the ministry team."
      />
      <PeopleList people={snapshot.team ?? []} prayers={snapshot.prayers} showRecorder />
    </>
  )
}

export { TeamTab }
