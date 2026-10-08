import { useLanguage } from '#/i18n/language'
import { youtubeUrl } from '#/i18n/translate'
import { encounterDateOf, statusLabelOf } from '#/journeys/helpers'
import { Avatar } from '#/ui/avatar'
import { Button } from '#/ui/button'
import { Eyebrow } from '#/ui/eyebrow'
import { Panel } from '#/ui/panel'
import { Stat } from '#/ui/stat'
import { SectionHeading } from './section-heading'
import { TotalsGrid } from './totals-grid'
import type { Snapshot } from '#/journeys/types'

const RECENT_LIMIT = 3

function OverviewTab({ snapshot }: { snapshot: Snapshot }) {
  const { language, t } = useLanguage()
  const { mine, prayers, totals } = snapshot
  const ownPrayers = prayers.filter((prayer) =>
    mine.some((person) => person.id === prayer.journeyId),
  )
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
      <div className="stat-row section">
        <Stat label={t('My encounters recorded')} value={mine.length} />
        <Stat label={t('Active prayer requests')} value={activeCount} />
        <Stat label={t('Answered prayers')} value={answeredCount} />
      </div>
      <section className="section">
        <h2 className="section-title">{t('Ministry totals')}</h2>
        <TotalsGrid totals={totals} />
        <p className="fine-print">
          {t(
            'Community totals are self-reported and may include repeat encounters. Names and requests are private to each recorder and NCTC admins.',
          )}
        </p>
      </section>
      <section className="section">
        <Eyebrow>{t('RECENTLY RECORDED')}</Eyebrow>
        <h2 className="section-title">{t('My people')}</h2>
        {mine.length ? (
          mine.slice(0, RECENT_LIMIT).map((person) => (
            <div className="recent-row" key={person.id}>
              <Avatar name={person.soulName} size="sm" />
              <div>
                <strong>{person.soulName}</strong> · {statusLabelOf(person, language)}
                <p className="meta">
                  {person.location} · {encounterDateOf(person, language)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="body-copy recent-empty">
            {t('Your first recorded person will appear here and on your prayer list.')}
          </p>
        )}
      </section>
      <Panel as="section" tone="boneAlt" className="text-panel section">
        <h2 className="section-title">{t('Keep growing as a soul winner')}</h2>
        <p className="body-copy">
          {t('Learn and be encouraged through NCTC’s worldwide YouTube community.')}
        </p>
        <Button
          tone="outline"
          size="sm"
          href={youtubeUrl(language)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Watch NCTC on YouTube ↗')}
        </Button>
      </Panel>
    </>
  )
}

export { OverviewTab }
