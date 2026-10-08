import { deleteJourneyFn, editJourneyFn, setSalvationStatusFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import {
  activeCountLabel,
  prayerPlaceholderLabel,
  prayerPromptLabel,
  statusAriaLabel,
} from '#/i18n/translate'
import {
  dateOf,
  encounterDateOf,
  encounterISO,
  journeyInputFrom,
  prayersOf,
  salvationStatusOf,
  statusOf,
  todayISO,
} from '#/journeys/helpers'
import { useRunMutation } from '#/queries/use-run-mutation'
import { AddPrayerForm } from './add-prayer-form'
import { PrayerRow } from './prayer-row'
import { StatusOptions } from './status-options'
import type { Journey, Prayer, SalvationStatus } from '#/journeys/types'
import type { FormEvent } from 'react'

interface PersonCardProps {
  person: Journey
  prayers: Prayer[]
  showRecorder: boolean
  editing: boolean
  editingPrayerId: number | null
  onEditJourney: (id: number | null) => void
  onEditPrayer: (id: number | null) => void
}

function PersonCard({
  person,
  prayers,
  showRecorder,
  editing,
  editingPrayerId,
  onEditJourney,
  onEditPrayer,
}: PersonCardProps) {
  const { language, t } = useLanguage()
  const run = useRunMutation()
  const status = statusOf(person)
  const { all, active, answered } = prayersOf(person, prayers)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const journey = journeyInputFrom(event.currentTarget)
    const completed = await run(
      () => editJourneyFn({ data: { id: person.id, journey } }),
      'Encounter updated.',
    )

    if (completed) {
      onEditJourney(null)
    }
  }

  function changeStatus(salvationStatus: SalvationStatus) {
    return run(
      () => setSalvationStatusFn({ data: { id: person.id, salvationStatus } }),
      'Salvation status updated.',
    )
  }

  async function remove() {
    if (
      !window.confirm(
        t('Remove this encounter and all its prayer requests? This cannot be undone.'),
      )
    ) {
      return
    }

    const completed = await run(
      () => deleteJourneyFn({ data: { id: person.id } }),
      'Encounter and its prayer requests removed.',
    )

    if (completed) {
      onEditJourney(null)
    }
  }

  return (
    <article className="person-card">
      <div className="person-head">
        <div className="person-initial">{person.soulName.charAt(0).toUpperCase()}</div>
        <div>
          <h3>{person.soulName}</h3>
          <p>
            {person.location} · {encounterDateOf(person, language)}
            {showRecorder &&
              ` · ${t('Recorded by')} ${person.recorderName} (${person.recorderEmail || ''})`}
          </p>
          <p className="recorded-date">
            {t('Recorded on')} {dateOf(person.createdAt, language)}
          </p>
        </div>
      </div>
      <div className="record-actions record-toolbar">
        <button type="button" onClick={() => onEditJourney(editing ? null : person.id)}>
          {editing ? t('Close editor') : t('Edit record')}
        </button>
        <button type="button" className="danger-link" onClick={remove}>
          {t('Remove record')}
        </button>
      </div>
      {editing && (
        <form className="journey-edit" onSubmit={save}>
          <div className="field-grid">
            <label className="encounter-name">
              {t('Person reached')}
              <input name="soulName" required maxLength={100} defaultValue={person.soulName} />
            </label>
            <label>
              {t('Location')}
              <input name="location" required maxLength={160} defaultValue={person.location} />
            </label>
            <label>
              {t('Date of encounter')}
              <input
                name="encounterDate"
                type="date"
                max={todayISO()}
                defaultValue={encounterISO(person)}
              />
            </label>
          </div>
          <label>
            {t('Response to the gospel')}
            <select name="salvationStatus" defaultValue={status}>
              <StatusOptions selected={status} />
            </select>
          </label>
          <div className="choice-grid">
            <label>
              <input name="healing" type="checkbox" defaultChecked={person.healing} />{' '}
              {t('Healing reported')}
            </label>
            <label>
              <input
                name="holySpiritBaptism"
                type="checkbox"
                defaultChecked={person.holySpiritBaptism}
              />{' '}
              {t('Holy Spirit baptism reported')}
            </label>
          </div>
          <label>
            {t('Healing details (optional)')}
            <textarea
              name="healingDetails"
              maxLength={1000}
              rows={3}
              defaultValue={person.healingDetails ?? ''}
            />
          </label>
          <button type="submit" className="primary-button">
            {t('Save changes')}
          </button>
        </form>
      )}
      <div className="person-details">
        <label>
          {t('Response to the gospel')}
          <select
            value={status}
            aria-label={statusAriaLabel(person.soulName, language)}
            onChange={(event) => changeStatus(salvationStatusOf(event.target.value))}
          >
            <StatusOptions selected={status} />
          </select>
        </label>
        <div className="pills">
          {person.healing && <span>{t('Healing')}</span>}
          {person.holySpiritBaptism && <span>{t('Holy Spirit baptism')}</span>}
        </div>
      </div>
      {person.healing && person.healingDetails && (
        <p className="healing">
          {/* The legacy translator skipped `.healing`, so the label stays English in Korean. */}
          <strong>Healing details:</strong> {person.healingDetails}
        </p>
      )}
      <div className="prayer-section">
        <div className="prayer-heading">
          <h4>{t('Intercessory prayer')}</h4>
          <span>{activeCountLabel(active.length, language)}</span>
        </div>
        {!all.length && (
          <p className="prayer-default">
            {prayerPromptLabel(person.soulName, status === 'saved', language)}
          </p>
        )}
        {[...active, ...answered].map((prayer) => (
          <PrayerRow
            key={prayer.id}
            prayer={prayer}
            editing={editingPrayerId === prayer.id}
            onEdit={onEditPrayer}
          />
        ))}
        <AddPrayerForm
          journeyId={person.id}
          inputId={`prayer-${person.id}`}
          placeholder={prayerPlaceholderLabel(person.soulName, language)}
        />
      </div>
    </article>
  )
}

export { PersonCard }
