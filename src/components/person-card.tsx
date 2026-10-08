import { deleteJourneyFn, editJourneyFn, setSalvationStatusFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import {
  activeCountLabel,
  answeredCountLabel,
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
import { Avatar } from '#/ui/avatar'
import { Badge } from '#/ui/badge'
import { Button } from '#/ui/button'
import { CheckboxCard } from '#/ui/checkbox-card'
import { Field, Input, Select, Textarea } from '#/ui/field'
import { Panel } from '#/ui/panel'
import { TextAction } from '#/ui/text-action'
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
    <Panel as="article" className="record">
      <div className="record-head">
        <Avatar name={person.soulName} />
        <div>
          <h3 className="record-name">{person.soulName}</h3>
          <p className="meta">
            {person.location} · {encounterDateOf(person, language)}
            {showRecorder &&
              ` · ${t('Recorded by')} ${person.recorderName} (${person.recorderEmail || ''})`}
          </p>
          <p className="meta">
            {t('Recorded on')} {dateOf(person.createdAt, language)}
          </p>
        </div>
      </div>
      <div className="action-row">
        <TextAction onClick={() => onEditJourney(editing ? null : person.id)}>
          {editing ? t('Close editor') : t('Edit record')}
        </TextAction>
        <TextAction tone="danger" onClick={remove}>
          {t('Remove record')}
        </TextAction>
      </div>
      {editing && (
        <form className="record-editor" onSubmit={save}>
          <div className="form-grid">
            <Field label={t('Person reached')} className="form-grid-wide">
              <Input name="soulName" required maxLength={100} defaultValue={person.soulName} />
            </Field>
            <Field label={t('Location')}>
              <Input name="location" required maxLength={160} defaultValue={person.location} />
            </Field>
            <Field label={t('Date of encounter')}>
              <Input
                name="encounterDate"
                type="date"
                max={todayISO()}
                defaultValue={encounterISO(person)}
              />
            </Field>
          </div>
          <Field label={t('Response to the gospel')}>
            <Select name="salvationStatus" defaultValue={status}>
              <StatusOptions selected={status} />
            </Select>
          </Field>
          <div className="check-grid">
            <CheckboxCard
              name="healing"
              defaultChecked={person.healing}
              label={t('Healing reported')}
            />
            <CheckboxCard
              name="holySpiritBaptism"
              defaultChecked={person.holySpiritBaptism}
              label={t('Holy Spirit baptism reported')}
            />
          </div>
          <Field label={t('Healing details (optional)')}>
            <Textarea
              name="healingDetails"
              maxLength={1000}
              rows={3}
              defaultValue={person.healingDetails ?? ''}
            />
          </Field>
          <Button type="submit">{t('Save changes')}</Button>
        </form>
      )}
      <div className="record-status">
        <Field label={t('Response to the gospel')}>
          <Select
            value={status}
            aria-label={statusAriaLabel(person.soulName, language)}
            onChange={(event) => changeStatus(salvationStatusOf(event.target.value))}
          >
            <StatusOptions selected={status} />
          </Select>
        </Field>
        <div className="badge-row">
          {person.healing && <Badge>{t('Healing')}</Badge>}
          {person.holySpiritBaptism && <Badge tone="accent">{t('Holy Spirit baptism')}</Badge>}
        </div>
      </div>
      {person.healing && person.healingDetails && (
        <p className="record-healing">
          {/* The earlier client did not translate this paragraph, so the label stays English in Korean. */}
          <strong>Healing details:</strong> {person.healingDetails}
        </p>
      )}
      <div className="prayers">
        <div className="prayers-head">
          <h4 className="ui-label">{t('Intercessory prayer')}</h4>
          <span className="meta">{activeCountLabel(active.length, language)}</span>
        </div>
        {!all.length && (
          <p className="prayer-prompt">
            {prayerPromptLabel(person.soulName, status === 'saved', language)}
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
          inputId={`prayer-${person.id}`}
          placeholder={prayerPlaceholderLabel(person.soulName, language)}
        />
      </div>
    </Panel>
  )
}

export { PersonCard }
