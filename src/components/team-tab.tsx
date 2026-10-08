import { useCallback, useState } from 'react'
import { useLanguage } from '#/i18n/language'
import {
  openPrayerCountLabel,
  recordCountLabel,
  teamMemberCountLabel,
} from '#/i18n/translate'
import { statusLabelOf, todayISO } from '#/journeys/helpers'
import {
  NO_FILTERS,
  csvOf,
  isFiltered,
  matchesFilters,
  memberKeyOf,
  sortRecords,
  teamRecordsOf,
} from '#/team/team-records'
import { Button } from '#/ui/button'
import { Checkbox } from '#/ui/checkbox'
import { TextAction } from '#/ui/text-action'
import { SectionHeading } from './section-heading'
import { TeamFiltersBar } from './team-filters'
import { TeamPanel } from './team-panel'
import { TeamTable } from './team-table'
import type { Snapshot } from '#/journeys/types'
import type { SortKey, TeamRecord, TeamSort } from '#/team/team-records'

const CSV_COLUMNS = [
  'Person',
  'Where',
  'Date',
  'Recorded by',
  'Email',
  'Response',
  'Encounters',
  'Notes',
  'Open prayer requests',
  'Answered requests',
]

function TeamTab({ snapshot }: { snapshot: Snapshot }) {
  const { language, t } = useLanguage()
  const [filters, setFilters] = useState(NO_FILTERS)
  const [sort, setSort] = useState<TeamSort>({ key: 'date', descending: true })
  const [grouped, setGrouped] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const today = todayISO()
  const viewerKey = memberKeyOf(snapshot.viewer.email, snapshot.viewer.displayName)
  const all = teamRecordsOf(snapshot.team ?? [], snapshot.prayers)
  const shown = sortRecords(
    all.filter((record) => matchesFilters(record, filters, today)),
    sort,
  )
  const selectedIndex = shown.findIndex((record) => record.person.id === selectedId)
  const selected = selectedIndex === -1 ? undefined : shown[selectedIndex]

  const close = useCallback(() => {
    setSelectedId((id) => {
      document.querySelector<HTMLElement>(`[data-record="${id}"]`)?.focus()

      return null
    })
  }, [])

  function changeSort(key: SortKey) {
    setSort({ key, descending: sort.key === key ? !sort.descending : true })
  }

  function csvRowOf({ person, memberName, date, active, answered }: TeamRecord) {
    return [
      person.soulName,
      person.location,
      date,
      memberName,
      person.recorderEmail ?? '',
      statusLabelOf(person, language),
      [person.healing && t('Healing'), person.holySpiritBaptism && t('Holy Spirit baptism')]
        .filter(Boolean)
        .join('; '),
      person.notes ?? '',
      active.map((prayer) => prayer.requestText).join('; '),
      answered.map((prayer) => prayer.requestText).join('; '),
    ]
  }

  function download() {
    // The mark tells a spreadsheet that the file is UTF-8, so Korean text opens correctly.
    const file = new Blob([`﻿${csvOf([CSV_COLUMNS.map(t), ...shown.map(csvRowOf)])}`], {
      type: 'text/csv',
    })
    const link = document.createElement('a')

    link.href = URL.createObjectURL(file)
    link.download = 'team-records.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  return (
    <>
      <p className="team-strip">
        <span className="team-strip-label">{t('ADMIN VIEW')}</span>
        {t(
          'You can see every team member’s records. Only the person who recorded one can edit it.',
        )}
      </p>
      <SectionHeading
        heading="Team records"
        description="Every encounter and prayer request recorded by the team, including your own."
      />
      <div className="team-filters">
        <TeamFiltersBar
          records={all}
          filters={filters}
          viewerKey={viewerKey}
          today={today}
          onChange={setFilters}
        />
        <div className="team-results">
          <span className="meta">
            {recordCountLabel(shown.length, language)} ·{' '}
            {teamMemberCountLabel(new Set(shown.map((record) => record.memberKey)).size, language)}{' '}
            ·{' '}
            {openPrayerCountLabel(
              shown.reduce((count, record) => count + record.active.length, 0),
              language,
            )}
          </span>
          <div className="team-results-actions">
            <Checkbox
              label={t('Group by team member')}
              checked={grouped}
              onChange={(event) => setGrouped(event.target.checked)}
            />
            {isFiltered(filters) && (
              <TextAction onClick={() => setFilters(NO_FILTERS)}>{t('Clear filters')}</TextAction>
            )}
            <TextAction onClick={download}>{t('Download CSV')}</TextAction>
          </div>
        </div>
      </div>
      <div className="team-body" data-panel={selected ? '' : undefined}>
        <div className="team-list">
          <TeamTable
            records={shown}
            groupFirst={grouped ? viewerKey : null}
            sort={sort}
            selectedId={selectedId}
            onSort={changeSort}
            onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
          />
          {!shown.length && (
            <div className="ui-empty team-empty">
              <h2 className="ui-empty-title">{t('No records match.')}</h2>
              <p className="ui-empty-body">
                {t('Clear a filter or widen the date range to see more of the team’s records.')}
              </p>
              <Button tone="outline" size="sm" onClick={() => setFilters(NO_FILTERS)}>
                {t('Clear filters')}
              </Button>
            </div>
          )}
        </div>
        {selected && (
          <TeamPanel
            record={selected}
            mine={snapshot.mine.some((person) => person.id === selected.person.id)}
            index={selectedIndex}
            total={shown.length}
            onClose={close}
            onPrevious={
              selectedIndex > 0
                ? () => setSelectedId(shown[selectedIndex - 1].person.id)
                : undefined
            }
            onNext={
              selectedIndex < shown.length - 1
                ? () => setSelectedId(shown[selectedIndex + 1].person.id)
                : undefined
            }
          />
        )}
      </div>
    </>
  )
}

export { TeamTab }
