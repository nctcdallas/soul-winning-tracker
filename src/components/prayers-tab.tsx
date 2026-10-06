import { useState } from 'react'
import { EmptyState } from './empty-state'
import { PrayerCard } from './prayer-card'
import { SectionHeading } from './section-heading'
import type { Snapshot } from '#/journeys/types'

/** Every person the member recorded, as a prayer list. */
function PrayersTab({ snapshot }: { snapshot: Snapshot }) {
  const [editingPrayer, setEditingPrayer] = useState<number | null>(null)

  return (
    <>
      <SectionHeading
        eyebrow="INTERCESSORY PRAYER"
        heading="My prayer list"
        description="Everyone you record appears here automatically. Focus on active requests, add updates, and remember answered prayers."
      />
      {snapshot.mine.length ? (
        <div className="prayer-list">
          {snapshot.mine.map((person) => (
            <PrayerCard
              key={person.id}
              person={person}
              prayers={snapshot.prayers}
              editingPrayerId={editingPrayer}
              onEditPrayer={setEditingPrayer}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </>
  )
}

export { PrayersTab }
