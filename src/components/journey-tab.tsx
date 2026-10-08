import { useLanguage } from '#/i18n/language'
import { peopleCountLabel } from '#/i18n/translate'
import { personalTotals } from '#/journeys/helpers'
import { PeopleList } from './people-list'
import { SectionHeading } from './section-heading'
import { TotalsGrid } from './totals-grid'
import type { Snapshot } from '#/journeys/types'

interface JourneyTabProps {
  snapshot: Snapshot
  /** The person whose row is open when the page loads. */
  openPersonId?: number
}

function JourneyTab({ snapshot, openPersonId }: JourneyTabProps) {
  const { language, t } = useLanguage()
  const hasPeople = snapshot.mine.length > 0

  return (
    <>
      <SectionHeading
        eyebrow="PERSONAL RECORDS"
        heading="My journey"
        description="Only you and NCTC admins can see these names and requests. You can correct or remove your entries here."
        action
      />
      <section className={hasPeople ? 'section people-panel' : 'section'}>
        {hasPeople && (
          <div className="section-head">
            <h2 className="section-title">{t('People I recorded')}</h2>
            <span className="meta">{peopleCountLabel(snapshot.mine.length, language)}</span>
          </div>
        )}
        <PeopleList
          people={snapshot.mine}
          prayers={snapshot.prayers}
          openPersonId={openPersonId}
        />
      </section>
      {hasPeople && (
        <section className="section">
          <h2 className="section-title">{t('My outreach totals')}</h2>
          <TotalsGrid totals={personalTotals(snapshot.mine)} personal />
          <p className="fine-print">
            {t('These totals use only your records and may include repeat encounters.')}
          </p>
        </section>
      )}
    </>
  )
}

export { JourneyTab }
