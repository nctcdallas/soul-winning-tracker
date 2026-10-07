import { deleteJourneyFn, editJourneyFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import {
  activeCountLabel,
  answeredCountLabel,
  prayerPlaceholderLabel,
  prayerPromptLabel,
} from '#/i18n/translate'
import {
  dateOf,
  encounterDateOf,
  encounterISO,
  journeyInputFrom,
  latestOf,
  prayersOf,
  statusLabelOf,
  statusOf,
  todayISO,
} from '#/journeys/helpers'
import { useRunMutation } from '#/queries/use-run-mutation'
import { Avatar } from '#/ui/avatar'
import { Badge } from '#/ui/badge'
import { Button } from '#/ui/button'
import { CheckboxCard } from '#/ui/checkbox-card'
import { Input, Select, Textarea } from '#/ui/field'
import { TextAction } from '#/ui/text-action'
import { AddPrayerForm } from './add-prayer-form'
import { PrayerRow } from './prayer-row'
import { StatusOptions } from './status-options'
import type { Journey, Prayer } from '#/journeys/types'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

interface PersonCardProps {
  person: Journey
  prayers: Prayer[]
  showRecorder: boolean
  open: boolean
  editing: boolean
  editingPrayerId: number | null
  onToggle: (id: number) => void
  onEditJourney: (id: number | null) => void
  onEditPrayer: (id: number | null) => void
}

interface RecordPartProps {
  person: Journey
  onEditJourney: (id: number | null) => void
}

function RecordDetails({ person, onEditJourney }: RecordPartProps) {
  const { language, t } = useLanguage()
  const run = useRunMutation()

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
    <>
      <dl className="record-details">
        <dt className="record-term ui-label">{t('Response to the gospel')}</dt>
        <dd className="record-value">{statusLabelOf(person, language)}</dd>
        {person.notes && (
          <>
            <dt className="record-term ui-label">{t('Notes')}</dt>
            <dd className="record-value">{person.notes}</dd>
          </>
        )}
        <dt className="record-term ui-label">{t('Recorded on')}</dt>
        <dd className="record-value">{dateOf(person.createdAt, language)}</dd>
      </dl>
      <div className="action-row">
        <TextAction onClick={() => onEditJourney(person.id)}>{t('Edit record')}</TextAction>
        <TextAction tone="danger" onClick={remove}>
          {t('Remove record')}
        </TextAction>
      </div>
    </>
  )
}

function RecordEditor({ person, onEditJourney }: RecordPartProps) {
  const { t } = useLanguage()
  const run = useRunMutation()
  const status = statusOf(person)
  const fieldId = `record-${person.id}`

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

  return (
    <form className="record-editor" onSubmit={save}>
      <div className="record-details">
        <label className="record-term ui-label" htmlFor={`${fieldId}-name`}>
          {t('Person reached')}
        </label>
        <div className="record-value">
          <Input
            id={`${fieldId}-name`}
            name="soulName"
            required
            maxLength={100}
            defaultValue={person.soulName}
          />
        </div>
        <label className="record-term ui-label" htmlFor={`${fieldId}-location`}>
          {t('Location')}
        </label>
        <div className="record-value">
          <Input
            id={`${fieldId}-location`}
            name="location"
            required
            maxLength={160}
            defaultValue={person.location}
          />
        </div>
        <label className="record-term ui-label" htmlFor={`${fieldId}-date`}>
          {t('Date of encounter')}
        </label>
        <div className="record-value">
          <Input
            id={`${fieldId}-date`}
            name="encounterDate"
            type="date"
            max={todayISO()}
            defaultValue={encounterISO(person)}
          />
        </div>
        <label className="record-term ui-label" htmlFor={`${fieldId}-status`}>
          {t('Response to the gospel')}
        </label>
        <div className="record-value">
          <Select id={`${fieldId}-status`} name="salvationStatus" defaultValue={status}>
            <StatusOptions selected={status} />
          </Select>
        </div>
        <span className="record-term ui-label">{t('Healing')}</span>
        <div className="record-value">
          <CheckboxCard
            name="healing"
            defaultChecked={person.healing}
            label={t('Healing reported')}
          />
        </div>
        <span className="record-term ui-label">{t('Holy Spirit baptism')}</span>
        <div className="record-value">
          <CheckboxCard
            name="holySpiritBaptism"
            defaultChecked={person.holySpiritBaptism}
            label={t('Holy Spirit baptism reported')}
          />
        </div>
        <label className="record-term ui-label" htmlFor={`${fieldId}-notes`}>
          {t('Notes (optional)')}
        </label>
        <div className="record-value">
          <Textarea
            id={`${fieldId}-notes`}
            name="notes"
            maxLength={1000}
            rows={2}
            defaultValue={person.notes ?? ''}
          />
        </div>
      </div>
      <div className="action-row">
        <Button type="submit" size="sm">
          {t('Save changes')}
        </Button>
        <TextAction onClick={() => onEditJourney(null)}>{t('Cancel')}</TextAction>
      </div>
    </form>
  )
}

function PersonCard({
  person,
  prayers,
  showRecorder,
  open,
  editing,
  editingPrayerId,
  onToggle,
  onEditJourney,
  onEditPrayer,
}: PersonCardProps) {
  const { language, t } = useLanguage()
  const { all, active, answered } = prayersOf(person, prayers)
  const bodyId = `record-${person.id}`
  const latest = latestOf(active)
  const answeredBefore = useRef(answered.length)
  const [answeredWipe, setAnsweredWipe] = useState(0)

  // An answered prayer is testimony, so a new one gets the highlight wipe on the count.
  useEffect(() => {
    if (answered.length > answeredBefore.current) {
      setAnsweredWipe((count) => count + 1)
    }

    answeredBefore.current = answered.length
  }, [answered.length])

  return (
    <article id={`person-${person.id}`} className="record" data-open={open || undefined}>
      <div className="record-summary">
        <Avatar name={person.soulName} />
        <div className="record-id">
          <h3 className="record-name">
            <button
              type="button"
              className="record-toggle"
              aria-expanded={open}
              aria-controls={open ? bodyId : undefined}
              onClick={() => onToggle(person.id)}
            >
              {person.soulName}
            </button>
          </h3>
          <p className="meta">
            {person.location} · {encounterDateOf(person, language)}
            {showRecorder &&
              ` · ${t('Recorded by')} ${person.recorderName} (${person.recorderEmail || ''})`}
          </p>
        </div>
        <div className="record-preview">
          {!open && latest && (
            <>
              <span className="ui-label">
                {active.length > 1
                  ? `${t('Latest request')} · ${activeCountLabel(active.length, language)}`
                  : t('Prayer request')}
              </span>
              <p className="prayer-text">{latest.requestText}</p>
            </>
          )}
        </div>
        <div className="badge-row">
          {person.healing && <Badge>{t('Healing')}</Badge>}
          {person.holySpiritBaptism && <Badge>{t('Holy Spirit baptism')}</Badge>}
        </div>
        <span className="record-toggle-label" aria-hidden="true">
          {open ? t('Close') : t('Open')}
        </span>
      </div>
      {open && (
        <div className="record-reveal" id={bodyId}>
          <div>
            <div className="record-body">
              <div className="prayers">
                <div className="prayers-head">
                  <h4 className="ui-label">{t('Intercessory prayer')}</h4>
                  <span className="meta">{activeCountLabel(active.length, language)}</span>
                </div>
                {!all.length && (
                  <p className="prayer-prompt">
                    {prayerPromptLabel(person.soulName, statusOf(person) === 'saved', language)}
                  </p>
                )}
                {active.map((prayer) => (
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
                {answered.length > 0 && (
                  <details className="ui-disclosure">
                    <summary>
                      <span
                        key={answeredWipe}
                        className={answeredWipe ? 'answered-count answered-count-new' : 'answered-count'}
                      >
                        {answeredCountLabel(answered.length, language)}
                      </span>
                    </summary>
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
              </div>
              {editing ? (
                <RecordEditor person={person} onEditJourney={onEditJourney} />
              ) : (
                <RecordDetails person={person} onEditJourney={onEditJourney} />
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export { PersonCard }
