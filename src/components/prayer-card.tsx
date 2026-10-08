import { useLanguage } from '#/i18n/language'
import { answeredCountLabel, activeCountLabel, prayerPromptLabel } from '#/i18n/translate'
import { encounterDateOf, prayersOf, statusLabelOf, statusOf } from '#/journeys/helpers'
import { Panel } from '#/ui/panel'
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
    <Panel as="article" className="record">
      <div className="record-head">
        <div>
          <h3 className="record-name" translate="no">
            {person.soulName}
          </h3>
          <p className="meta">
            {person.location} · {encounterDateOf(person, language)}
          </p>
          <p className="meta">{statusLabelOf(person, language)}</p>
        </div>
        <span className="meta record-count">{activeCountLabel(active.length, language)}</span>
      </div>
      <div className="prayers">
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
          <p className="prayer-prompt">
            {prayerPromptLabel(person.soulName, statusOf(person) === 'saved', language)}
          </p>
        )}
        {answered.length > 0 && (
          <details className="ui-disclosure">
            <summary>{answeredCountLabel(answered.length, language)}</summary>
            <div className="ui-disclosure-body">
              {answered.map((prayer) => (
                <PrayerRow
                  key={prayer.id}
                  prayer={prayer}
                  editing={editingPrayerId === prayer.id}
                  onEdit={onEditPrayer}
                />
              ))}
            </div>
          </details>
        )}
        <AddPrayerForm
          journeyId={person.id}
          inputId={`prayer-focus-${person.id}`}
          placeholder={t('Prayer request')}
        />
      </div>
    </Panel>
  )
}

export { PrayerCard }
