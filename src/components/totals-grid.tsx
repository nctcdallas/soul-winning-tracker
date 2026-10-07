import { useLanguage } from '#/i18n/language'
import { localeOf } from '#/i18n/translate'
import { Stat } from '#/ui/stat'
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

function countOf(totals: Totals | undefined, key: keyof Totals) {
  const count = totals ? Number(totals[key]) : Number.NaN

  return Number.isFinite(count) ? count : undefined
}

function TotalsGrid({ totals, personal = false }: TotalsGridProps) {
  const { language, t } = useLanguage()
  const format = (count: number) => count.toLocaleString(localeOf(language))

  return (
    <div
      className="totals"
      role="group"
      aria-label={t(personal ? 'My outreach totals' : 'Live ministry totals')}
    >
      <Stat
        variant="hero"
        label={t(personal ? HERO_STAT.personalLabel : HERO_STAT.publicLabel)}
        value={countOf(totals, HERO_STAT.key)}
        note={t(personal ? HERO_STAT.personalNote : HERO_STAT.publicNote)}
        format={format}
      />
      {SMALL_STATS.map((stat) => (
        <Stat
          key={stat.key}
          label={t(personal ? stat.personalLabel : stat.publicLabel)}
          value={countOf(totals, stat.key)}
          format={format}
        />
      ))}
    </div>
  )
}

export { TotalsGrid }
