import { useEffect, useState } from 'react'
import { EmptyState } from './empty-state'
import { PersonCard } from './person-card'
import type { Journey, Prayer } from '#/journeys/types'

interface PeopleListProps {
  people: Journey[]
  prayers: Prayer[]
  showRecorder?: boolean
  /** The person whose row is open at the start. The default is the first person. */
  openPersonId?: number
}

function PeopleList({ people, prayers, showRecorder = false, openPersonId }: PeopleListProps) {
  const [editingJourney, setEditingJourney] = useState<number | null>(null)
  const [editingPrayer, setEditingPrayer] = useState<number | null>(null)
  const [openPerson, setOpenPerson] = useState<number | null>(
    openPersonId ?? people[0]?.id ?? null,
  )

  useEffect(() => {
    if (openPersonId === undefined) {
      return
    }

    setOpenPerson(openPersonId)
    // jsdom has no scrollIntoView, so the call is optional.
    document.getElementById(`person-${openPersonId}`)?.scrollIntoView?.({ block: 'start' })
  }, [openPersonId])

  function toggle(id: number) {
    const opening = openPerson !== id

    setOpenPerson(opening ? id : null)
    setEditingJourney(null)
    setEditingPrayer(null)

    if (opening) {
      // The row that closes above can move this row out of view, so the page follows it.
      requestAnimationFrame(() =>
        document.getElementById(`person-${id}`)?.scrollIntoView?.({ block: 'nearest' }),
      )
    }
  }

  if (!people.length) {
    return <EmptyState />
  }

  return (
    <div className="record-list">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          prayers={prayers}
          showRecorder={showRecorder}
          open={openPerson === person.id}
          onToggle={toggle}
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
