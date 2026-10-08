import { useNavigate } from '@tanstack/react-router'
import { createJourneyFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import { journeyInputFrom, todayISO } from '#/journeys/helpers'
import { useRunMutation } from '#/queries/use-run-mutation'
import { Button } from '#/ui/button'
import { CheckboxCard } from '#/ui/checkbox-card'
import { Field, Input, Select, Textarea } from '#/ui/field'
import { Panel } from '#/ui/panel'
import { SectionHeading } from './section-heading'
import { StatusOptions } from './status-options'
import type { Viewer } from '#/journeys/types'
import type { FormEvent } from 'react'

function RecordTab({ viewer }: { viewer: Viewer }) {
  const { t } = useLanguage()
  const run = useRunMutation()
  const navigate = useNavigate()

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const journey = journeyInputFrom(event.currentTarget)
    const requestText = String(new FormData(event.currentTarget).get('requestText') || '')
    const completed = await run(
      () => createJourneyFn({ data: { journey, requestText } }),
      'Person saved to your journey and prayer list.',
    )

    if (completed) {
      void navigate({ to: '/journey' })
    }
  }

  return (
    <>
      <SectionHeading
        eyebrow="RECORD AN ENCOUNTER"
        heading="Share an encounter."
        description="Make one entry for each outreach encounter you personally took part in. The person will be added to your private prayer list."
      />
      <Panel as="form" id="journey-form" className="record-form" onSubmit={save}>
        <p className="ui-callout">
          {t('Recording as')} <strong>{viewer.displayName}</strong> ({viewer.email})
        </p>
        <h2 className="step-title">{t('01 · The encounter')}</h2>
        <div className="form-grid">
          <Field label={t('Person reached')} className="form-grid-wide">
            <Input
              name="soulName"
              required
              maxLength={100}
              placeholder={t('First name or initials')}
            />
          </Field>
          <Field label={t('Location')}>
            <Input
              name="location"
              required
              maxLength={160}
              placeholder={t('City, neighborhood, or event')}
            />
          </Field>
          <Field label={t('Date of encounter')}>
            <Input
              name="encounterDate"
              type="date"
              required
              max={todayISO()}
              defaultValue={todayISO()}
            />
          </Field>
        </div>
        <h2 className="step-title">{t('02 · What happened?')}</h2>
        <Field label={t('Response to the gospel')}>
          <Select name="salvationStatus" defaultValue="declined">
            <StatusOptions selected="declined" />
          </Select>
        </Field>
        <div className="check-grid">
          <CheckboxCard name="healing" label={t('Healing reported')} />
          <CheckboxCard name="holySpiritBaptism" label={t('Holy Spirit baptism reported')} />
        </div>
        <Field label={t('Notes (optional)')}>
          <Textarea
            name="notes"
            maxLength={1000}
            rows={4}
            placeholder={t('Describe only what the person is comfortable having recorded.')}
          />
        </Field>
        <h2 className="step-title">{t('03 · Prayer')}</h2>
        <Field label={t('Prayer request (optional)')}>
          <Textarea
            name="requestText"
            maxLength={1000}
            rows={3}
            placeholder={t('What can you pray for this person?')}
          />
        </Field>
        <div className="record-form-foot">
          <p className="meta">
            {t(
              'Only you and NCTC admins can see this entry. Use a first name or initials when possible, and avoid sensitive details without the person’s permission.',
            )}
          </p>
          <Button type="submit" tone="accent" size="lg" stretch>
            {t('Save encounter')}
          </Button>
        </div>
      </Panel>
    </>
  )
}

export { RecordTab }
