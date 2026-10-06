import { useLanguage } from '#/i18n/language'
import { countLabel } from '#/journeys/helpers'
import type { Totals } from '#/journeys/types'

const HERO_STAT = {
  key: 'reached',
  publicLabel: 'Outreach encounters recorded',
  personalLabel: 'My outreach encounters',
  publicNote: 'Shared by participants worldwide.',
  personalNote: 'From the encounters you recorded.',
} as const

const SMALL_STATS = [
  { key: 'salvations', publicLabel: 'Salvations reported', personalLabel: 'Salvations I recorded' },
  { key: 'healings', publicLabel: 'Healings reported', personalLabel: 'Healings I recorded' },
  {
    key: 'baptisms',
    publicLabel: 'Holy Spirit baptisms reported',
    personalLabel: 'Holy Spirit baptisms I recorded',
  },
] as const

interface TotalsGridProps {
  totals: Totals | undefined
  personal?: boolean
}

function TotalsGrid({ totals, personal = false }: TotalsGridProps) {
  const { language, t } = useLanguage()

  return (
    <div
      className="stat-grid"
      aria-label={t(personal ? 'My outreach totals' : 'Live ministry totals')}
    >
      <section className="hero-stat">
        <span>{t(personal ? HERO_STAT.personalLabel : HERO_STAT.publicLabel)}</span>
        <strong>{countLabel(totals, HERO_STAT.key, language)}</strong>
        <small>{t(personal ? HERO_STAT.personalNote : HERO_STAT.publicNote)}</small>
      </section>
      {SMALL_STATS.map((stat) => (
        <section className="small-stat" key={stat.key}>
          <span>{t(personal ? stat.personalLabel : stat.publicLabel)}</span>
          <strong>{countLabel(totals, stat.key, language)}</strong>
        </section>
      ))}
    </div>
  )
}

export { TotalsGrid }
