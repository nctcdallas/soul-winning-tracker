import { Link } from '@tanstack/react-router'
import { useLanguage } from '#/i18n/language'
import {
  acrossPeopleLabel,
  activeCountLabel,
  lastOfLabel,
  localeOf,
  ownShareLabel,
  peopleCountLabel,
  sinceLabel,
  youtubeUrl,
} from '#/i18n/translate'
import { encounterISO, latestOf, prayersOf } from '#/journeys/helpers'
import { Avatar } from '#/ui/avatar'
import { Badge } from '#/ui/badge'
import { Button } from '#/ui/button'
import { Panel } from '#/ui/panel'
import { Stat } from '#/ui/stat'
import { SectionHeading } from './section-heading'
import { TotalsGrid } from './totals-grid'
import { useOpenTab } from './use-open-tab'
import type { Language } from '#/i18n/translate'
import type { Journey, Prayer, Snapshot } from '#/journeys/types'

const RECENT_LIMIT = 5

interface PersonRowProps {
  person: Journey
  prayers: Prayer[]
}

function shortDateOf(date: string, language: Language) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(localeOf(language), {
    month: 'short',
    day: 'numeric',
  })
}

/** The date of the first encounter, from the dates that the records have. */
function firstDateOf(people: Journey[]) {
  return people
    .map((person) => encounterISO(person) || person.createdAt.slice(0, 10))
    .reduce((first, date) => (date < first ? date : first))
}

function PersonRow({ person, prayers }: PersonRowProps) {
  const { language, t } = useLanguage()
  const { active, answered } = prayersOf(person, prayers)
  const latest = latestOf(active)
  const date = encounterISO(person)

  return (
    <Link to="/journey" search={{ person: person.id }} className="overview-person">
      <Avatar name={person.soulName} />
      <span className="overview-person-id">
        <strong>{person.soulName}</strong>
        <span className="meta">
          {person.location}
          {date && ` · ${shortDateOf(date, language)}`}
        </span>
      </span>
      <span className="overview-person-request">
        {latest && (
          <span className="ui-label">
            {active.length > 1
              ? `${t('Latest request')} · ${activeCountLabel(active.length, language)}`
              : t('Prayer request')}
          </span>
        )}
        <span className={latest ? 'overview-person-text' : 'overview-person-text team-muted'}>
          {latest?.requestText ?? t(answered.length ? 'All answered' : 'No requests yet')}
        </span>
      </span>
      <span className="badge-row">
        {person.healing && <Badge>{t('Healing')}</Badge>}
        {person.holySpiritBaptism && <Badge>{t('Holy Spirit baptism')}</Badge>}
      </span>
    </Link>
  )
}

function OverviewTab({ snapshot }: { snapshot: Snapshot }) {
  const { language, t } = useLanguage()
  const openTab = useOpenTab()
  const { mine, prayers, totals } = snapshot
  const ownPrayers = prayers.filter((prayer) =>
    mine.some((person) => person.id === prayer.journeyId),
  )
  const active = ownPrayers.filter((prayer) => prayer.status === 'active')
  const answered = ownPrayers.filter((prayer) => prayer.status === 'answered')
  const peopleOf = (list: Prayer[]) => new Set(list.map((prayer) => prayer.journeyId)).size

  return (
    <>
      <SectionHeading
        eyebrow="YOUR JOURNEY"
        heading="Every person matters."
        description="NCTC is raising end-time soul winners worldwide. Keep your outreach encounters and prayer follow-up together."
        action={mine.length > 0 && 'below'}
      />
      {mine.length === 0 && (
        <Panel as="section" tone="boneAlt" className="overview-start section">
          <div>
            <h2 className="head-title">{t('Record your first person.')}</h2>
            <p className="body-copy">
              {t(
                'Their name, where you met, how they responded to the gospel, and what you are praying for them. Everything you record here shows up on your prayer list.',
              )}
            </p>
          </div>
          <Button tone="accent" size="lg" arrow stretch onClick={() => openTab('/record')}>
            {t('Record a person')}
          </Button>
        </Panel>
      )}
      <section className="section">
        <h2 className="section-title">{t('Ministry totals')}</h2>
        <TotalsGrid
          totals={totals}
          note={mine.length > 0 ? ownShareLabel(mine.length, language) : undefined}
        />
        <p className="fine-print">
          {t(
            'Totals are self-reported and may include repeat encounters. Names and requests stay private to you and NCTC admins.',
          )}
        </p>
      </section>
      {mine.length > 0 && (
        <>
          <div className="stat-row section">
            <Stat
              label={t('My encounters recorded')}
              value={mine.length}
              note={sinceLabel(shortDateOf(firstDateOf(mine), language), language)}
            />
            <Stat
              label={t('Open prayer requests')}
              value={active.length}
              note={active.length ? acrossPeopleLabel(peopleOf(active), language) : undefined}
            />
            <Stat
              label={t('Answered prayers')}
              value={answered.length}
              note={answered.length ? acrossPeopleLabel(peopleOf(answered), language) : undefined}
            />
          </div>
          <section className="section">
            <div className="section-head overview-people-head">
              <h2 className="section-title">{t('My people')}</h2>
              <span className="meta">
                {mine.length > RECENT_LIMIT
                  ? lastOfLabel(RECENT_LIMIT, mine.length, language)
                  : peopleCountLabel(mine.length, language)}
              </span>
              <Link to="/journey" className="ui-text-action overview-see-all">
                {t('See all')}
              </Link>
            </div>
            {mine.slice(0, RECENT_LIMIT).map((person) => (
              <PersonRow key={person.id} person={person} prayers={prayers} />
            ))}
          </section>
        </>
      )}
      {mine.length === 0 && (
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
      )}
    </>
  )
}

export { OverviewTab }
