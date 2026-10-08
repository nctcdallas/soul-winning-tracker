import { useLanguage } from '#/i18n/language'
import { personalTotals } from '#/journeys/helpers'
import { PeopleList } from './people-list'
import { SectionHeading } from './section-heading'
import { TotalsGrid } from './totals-grid'
import type { Snapshot } from '#/journeys/types'

function JourneyTab({ snapshot }: { snapshot: Snapshot }) {
  const { t } = useLanguage()

  return (
    <>
      <SectionHeading
        eyebrow="PERSONAL RECORDS"
        heading="My journey"
        description="Only you and NCTC admins can see these names and requests. You can correct or remove your entries here."
        action
      />
      <section className="section">
        <h2 className="section-title">{t('My outreach totals')}</h2>
        <TotalsGrid totals={personalTotals(snapshot.mine)} personal />
        <p className="fine-print">
          {t('These totals use only your records and may include repeat encounters.')}
        </p>
      </section>
      <section className="section">
        <h2 className="section-title">{t('People I recorded')}</h2>
        <PeopleList people={snapshot.mine} prayers={snapshot.prayers} />
      </section>
    </>
  )
}

export { JourneyTab }
