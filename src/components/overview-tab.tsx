import { useLanguage } from '#/i18n/language'
import { youtubeUrl } from '#/i18n/translate'
import { encounterDateOf, statusLabelOf } from '#/journeys/helpers'
import { SectionHeading } from './section-heading'
import { TotalsGrid } from './totals-grid'
import type { Snapshot } from '#/journeys/types'

const RECENT_LIMIT = 3

/** The member's landing tab: counts of their own records, ministry totals, and the latest people. */
function OverviewTab({ snapshot }: { snapshot: Snapshot }) {
  const { language, t } = useLanguage()
  const { mine, prayers, totals } = snapshot
  const ownPrayers = prayers.filter((prayer) => mine.some((person) => person.id === prayer.journeyId))
  const activeCount = ownPrayers.filter((prayer) => prayer.status === 'active').length
  const answeredCount = ownPrayers.filter((prayer) => prayer.status === 'answered').length

  return (
    <>
      <SectionHeading
        eyebrow="YOUR JOURNEY"
        heading="Every person matters."
        description="NCTC is raising end-time soul winners worldwide. Keep your outreach encounters and prayer follow-up together."
        action
      />
      <div className="member-summary">
        <section>
          <span>{t('My encounters recorded')}</span>
          <strong>{mine.length}</strong>
        </section>
        <section>
          <span>{t('Active prayer requests')}</span>
          <strong>{activeCount}</strong>
        </section>
        <section>
          <span>{t('Answered prayers')}</span>
          <strong>{answeredCount}</strong>
        </section>
      </div>
      <h2 className="section-label">{t('Ministry totals')}</h2>
      <TotalsGrid totals={totals} />
      <p className="totals-note">
        {t(
          'Community totals are self-reported and may include repeat encounters. Names and requests are private to each recorder and NCTC admins.',
        )}
      </p>
      <section className="activity">
        <p className="eyebrow">{t('RECENTLY RECORDED')}</p>
        <h2>{t('My people')}</h2>
        {mine.length ? (
          mine.slice(0, RECENT_LIMIT).map((person) => (
            <div className="journey-row" key={person.id}>
              <span className="person-initial">{person.soulName.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{person.soulName}</strong> · {statusLabelOf(person, language)}
                <small>
                  {person.location} · {encounterDateOf(person, language)}
                </small>
              </div>
            </div>
          ))
        ) : (
          <p>{t('Your first recorded person will appear here and on your prayer list.')}</p>
        )}
      </section>
      <section className="training-panel">
        <h2>{t('Keep growing as a soul winner')}</h2>
        <p>{t('Learn and be encouraged through NCTC’s worldwide YouTube community.')}</p>
        <a href={youtubeUrl(language)} target="_blank" rel="noopener noreferrer">
          {t('Watch NCTC on YouTube ↗')}
        </a>
      </section>
    </>
  )
}

export { OverviewTab }
