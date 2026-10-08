import { useState } from 'react'
import { EmptyState } from './empty-state'
import { PersonCard } from './person-card'
import type { Journey, Prayer } from '#/journeys/types'

interface PeopleListProps {
  people: Journey[]
  prayers: Prayer[]
  showRecorder?: boolean
}

function PeopleList({ people, prayers, showRecorder = false }: PeopleListProps) {
  const [editingJourney, setEditingJourney] = useState<number | null>(null)
  const [editingPrayer, setEditingPrayer] = useState<number | null>(null)

  if (!people.length) {
    return <EmptyState />
  }

  return (
    <div className="card-list">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          prayers={prayers}
          showRecorder={showRecorder}
          editing={editingJourney === person.id}
          editingPrayerId={editingPrayer}
          onEditJourney={setEditingJourney}
          onEditPrayer={setEditingPrayer}
        />
      ))}
    </div>
  )
}

export { PeopleList }
