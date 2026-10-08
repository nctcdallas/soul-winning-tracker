import { Fragment } from 'react'
import { useLanguage } from '#/i18n/language'
import {
  answeredShortLabel,
  localeOf,
  openCountLabel,
  openRequestCountLabel,
  recordCountLabel,
} from '#/i18n/translate'
import { latestOf, statusLabelOf } from '#/journeys/helpers'
import { Avatar } from '#/ui/avatar'
import { Badge } from '#/ui/badge'
import { ColumnHeader } from '#/ui/column-header'
import type { Language } from '#/i18n/translate'
import type { SortKey, TeamRecord, TeamSort } from '#/team/team-records'

interface TeamTableProps {
  records: TeamRecord[]
  /** With a key, the rows are in groups by team member, and this member is first. */
  groupFirst: string | null
  sort: TeamSort
  selectedId: number | null
  onSort: (key: SortKey) => void
  onSelect: (id: number) => void
}

interface TeamRowProps {
  record: TeamRecord
  selected: boolean
  onSelect: (id: number) => void
}

function shortDateOf(date: string, language: Language) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(localeOf(language), {
    month: 'short',
    day: 'numeric',
  })
}

function prayerNoteOf(record: TeamRecord, language: Language) {
  return [
    record.active.length > 1 ? openCountLabel(record.active.length, language) : '',
    record.answered.length ? answeredShortLabel(record.answered.length, language) : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function groupsOf(records: TeamRecord[], first: string) {
  const groups = new Map<string, TeamRecord[]>()

  for (const record of records) {
    groups.set(record.memberKey, [...(groups.get(record.memberKey) ?? []), record])
  }

  return [...groups.entries()].sort(
    ([firstKey], [secondKey]) => Number(secondKey === first) - Number(firstKey === first),
  )
}

function TeamRow({ record, selected, onSelect }: TeamRowProps) {
  const { language, t } = useLanguage()
  const { person, active, answered } = record
  const latest = latestOf(active)
  const note = prayerNoteOf(record, language)

  return (
    <div role="row" className="team-row" data-selected={selected || undefined}>
      <div role="cell" className="team-person">
        <Avatar name={person.soulName} size="sm" />
        <div>
          <button
            type="button"
            className="team-row-open"
            data-record={person.id}
            aria-expanded={selected}
            onClick={() => onSelect(person.id)}
          >
            {person.soulName}
          </button>
          <span className="team-narrow">
            {person.location} · {record.memberName}
          </span>
        </div>
      </div>
      <span role="cell" className="team-wide team-muted">
        {record.memberName}
      </span>
      <span role="cell" className="team-wide team-muted">
        {person.location}
      </span>
      <span role="cell" className="team-date">
        {shortDateOf(record.date, language)}
      </span>
      <span role="cell" className="team-wide">
        {statusLabelOf(person, language)}
      </span>
      <div role="cell" className="team-tags">
        {person.healing && <Badge>{t('Healing')}</Badge>}
        {person.holySpiritBaptism && <Badge>{t('Holy Spirit baptism')}</Badge>}
        {!person.healing && !person.holySpiritBaptism && <span className="team-dash">—</span>}
      </div>
      <div role="cell" className="team-prayer">
        {latest && <span>{latest.requestText}</span>}
        {!latest && (
          <span className={answered.length ? 'team-muted' : 'team-muted team-dash'}>
            {answered.length ? t('All answered') : '—'}
          </span>
        )}
        {note && <span className="team-muted">{note}</span>}
      </div>
    </div>
  )
}

function TeamTable({ records, groupFirst, sort, selectedId, onSort, onSelect }: TeamTableProps) {
  const { language, t } = useLanguage()
  const groups: [string, TeamRecord[]][] =
    groupFirst === null ? [['', records]] : groupsOf(records, groupFirst)
  const directionOf = (key: SortKey) =>
    sort.key === key ? (sort.descending ? 'desc' : 'asc') : null

  return (
    <div role="table" aria-label={t('Team records')} className="team-table">
      <div role="row" className="team-head">
        <ColumnHeader sort={directionOf('name')} onSort={() => onSort('name')}>
          {t('Person')}
        </ColumnHeader>
        <ColumnHeader
          className="team-wide"
          sort={directionOf('member')}
          onSort={() => onSort('member')}
        >
          {t('Recorded by')}
        </ColumnHeader>
        <ColumnHeader className="team-wide">{t('Where')}</ColumnHeader>
        <ColumnHeader sort={directionOf('date')} onSort={() => onSort('date')}>
          {t('Date')}
        </ColumnHeader>
        <ColumnHeader className="team-wide">{t('Response')}</ColumnHeader>
        <ColumnHeader className="team-mid">{t('Encounters')}</ColumnHeader>
        <ColumnHeader className="team-mid">{t('Prayer')}</ColumnHeader>
      </div>
      {groups.map(([memberKey, members]) => (
        <Fragment key={memberKey}>
          {groupFirst !== null && (
            <div className="team-group">
              <span className="team-group-name">
                {members[0].memberName}
                {memberKey === groupFirst && ` ${t('(you)')}`}
              </span>
              <span className="team-muted">
                {recordCountLabel(members.length, language)} ·{' '}
                {openRequestCountLabel(
                  members.reduce((count, record) => count + record.active.length, 0),
                  language,
                )}
              </span>
            </div>
          )}
          {members.map((record) => (
            <TeamRow
              key={record.person.id}
              record={record}
              selected={selectedId === record.person.id}
              onSelect={onSelect}
            />
          ))}
        </Fragment>
      ))}
    </div>
  )
}

export { TeamTable }
