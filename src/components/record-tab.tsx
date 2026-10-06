import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { createJourneyFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import { journeyInputFrom, todayISO } from '#/journeys/helpers'
import { useRunMutation } from '#/queries/use-run-mutation'
import { SectionHeading } from './section-heading'
import { StatusOptions } from './status-options'
import type { Viewer } from '#/journeys/types'
import type { FormEvent } from 'react'

function RecordTab({ viewer }: { viewer: Viewer }) {
  const { t } = useLanguage()
  const run = useRunMutation()
  const navigate = useNavigate()
  const [healing, setHealing] = useState(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const journey = journeyInputFrom(event.currentTarget)
    const completed = await run(
      () => createJourneyFn({ data: journey }),
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
      <form id="journey-form" className="record-card" onSubmit={save}>
        <p className="recording-as">
          {t('Recording as')} <strong>{viewer.displayName}</strong> ({viewer.email})
        </p>
        <h2>{t('01 · The encounter')}</h2>
        <div className="field-grid">
          <label className="encounter-name">
            {t('Person reached')}
            <input
              name="soulName"
              required
              maxLength={100}
              placeholder={t('First name or initials')}
            />
          </label>
          <label>
            {t('Location')}
            <input
              name="location"
              required
              maxLength={160}
              placeholder={t('City, neighborhood, or event')}
            />
          </label>
          <label>
            {t('Date of encounter')}
            <input
              name="encounterDate"
              type="date"
              required
              max={todayISO()}
              defaultValue={todayISO()}
            />
          </label>
        </div>
        <h2>{t('02 · What happened?')}</h2>
        <label className="status-field">
          {t('Response to the gospel')}
          <select name="salvationStatus" defaultValue="declined">
            <StatusOptions selected="declined" />
          </select>
        </label>
        <div className="choice-grid">
          <label>
            <input
              name="healing"
              type="checkbox"
              onChange={(event) => setHealing(event.target.checked)}
            />{' '}
            {t('Healing reported')}
          </label>
          <label>
            <input name="holySpiritBaptism" type="checkbox" /> {t('Holy Spirit baptism reported')}
          </label>
        </div>
        <label id="healing-field" className={healing ? 'healing-field' : 'healing-field hidden'}>
          {t('Healing details (optional)')}
          <textarea
            name="healingDetails"
            maxLength={1000}
            rows={4}
            placeholder={t('Describe only what the person is comfortable having recorded.')}
          />
        </label>
        <div className="form-footer">
          <p>
            {t(
              'Only you and NCTC admins can see this entry. Use a first name or initials when possible, and avoid sensitive details without the person’s permission.',
            )}
          </p>
          <button type="submit" className="primary-button">
            {t('Save encounter')}
          </button>
        </div>
      </form>
    </>
  )
}

export { RecordTab }
