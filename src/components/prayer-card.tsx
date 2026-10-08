import { useLanguage } from '#/i18n/language'
import { answeredCountLabel, activeCountLabel, prayerPromptLabel } from '#/i18n/translate'
import { encounterDateOf, prayersOf, statusLabelOf, statusOf } from '#/journeys/helpers'
import { AddPrayerForm } from './add-prayer-form'
import { PrayerRow } from './prayer-row'
import type { Journey, Prayer } from '#/journeys/types'

interface PrayerCardProps {
  person: Journey
  prayers: Prayer[]
  editingPrayerId: number | null
  onEditPrayer: (id: number | null) => void
}

function PrayerCard({ person, prayers, editingPrayerId, onEditPrayer }: PrayerCardProps) {
  const { language, t } = useLanguage()
  const { active, answered } = prayersOf(person, prayers)

  return (
    <article className="prayer-card">
      <div className="prayer-heading">
        <div>
          <h3 translate="no">{person.soulName}</h3>
          <p>
            {person.location} · {encounterDateOf(person, language)}
          </p>
          <p>{statusLabelOf(person, language)}</p>
        </div>
        <span>{activeCountLabel(active.length, language)}</span>
      </div>
      {active.length ? (
        active.map((prayer) => (
          <PrayerRow
            key={prayer.id}
            prayer={prayer}
            editing={editingPrayerId === prayer.id}
            onEdit={onEditPrayer}
          />
        ))
      ) : (
        <p className="prayer-default">
          {prayerPromptLabel(person.soulName, statusOf(person) === 'saved', language)}
        </p>
      )}
      {answered.length > 0 && (
        <details>
          <summary>{answeredCountLabel(answered.length, language)}</summary>
          {answered.map((prayer) => (
            <PrayerRow
              key={prayer.id}
              prayer={prayer}
              editing={editingPrayerId === prayer.id}
              onEdit={onEditPrayer}
            />
          ))}
        </details>
      )}
      <AddPrayerForm
        journeyId={person.id}
        inputId={`prayer-focus-${person.id}`}
        placeholder={t('Prayer request')}
      />
    </article>
  )
}

export { PrayerCard }
