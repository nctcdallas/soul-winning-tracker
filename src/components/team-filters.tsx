import { useLanguage } from '#/i18n/language'
import { statusLabel, statusOf } from '#/journeys/helpers'
import { SALVATION_STATUSES } from '#/journeys/types'
import { matchesFilters } from '#/team/team-records'
import { Input, Select } from '#/ui/field'
import { FilterChip } from '#/ui/filter-chip'
import type { SalvationStatus } from '#/journeys/types'
import type { Period, TeamFilters, TeamRecord } from '#/team/team-records'

interface TeamFiltersProps {
  records: TeamRecord[]
  filters: TeamFilters
  /** The key of the viewer, who is the first team member in the row. */
  viewerKey: string
  today: string
  onChange: (filters: TeamFilters) => void
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

function membersOf(records: TeamRecord[], viewerKey: string) {
  const names = new Map<string, string>([[viewerKey, '']])

  for (const record of records) {
    names.set(record.memberKey, record.memberName)
  }

  return [...names.entries()]
}

function TeamFiltersBar({ records, filters, viewerKey, today, onChange }: TeamFiltersProps) {
  const { language, t } = useLanguage()
  const countOf = (
    skip: 'member' | 'encounter' | 'open',
    test: (record: TeamRecord) => boolean,
  ) =>
    records.filter((record) => test(record) && matchesFilters(record, filters, today, skip))
      .length
  const statuses = SALVATION_STATUSES.filter((status) =>
    records.some((record) => statusOf(record.person) === status),
  )

  return (
    <>
      <div className="team-filter-row">
        <span className="ui-label">{t('Recorded by')}</span>
        <FilterChip
          selected={filters.member === null}
          count={countOf('member', () => true)}
          onClick={() => onChange({ ...filters, member: null })}
        >
          {t('Everyone')}
        </FilterChip>
        {membersOf(records, viewerKey).map(([memberKey, name]) => (
          <FilterChip
            key={memberKey}
            selected={filters.member === memberKey}
            count={countOf('member', (record) => record.memberKey === memberKey)}
            onClick={() =>
              onChange({ ...filters, member: filters.member === memberKey ? null : memberKey })
            }
          >
            {memberKey === viewerKey ? t('Me') : name}
          </FilterChip>
        ))}
      </div>
      <div className="team-filter-row">
        <span className="ui-label">{t('Encounter')}</span>
        <FilterChip
          selected={filters.healing}
          count={countOf('encounter', (record) => record.person.healing)}
          onClick={() => onChange({ ...filters, healing: !filters.healing })}
        >
          {t('Healing')}
        </FilterChip>
        <FilterChip
          selected={filters.baptism}
          count={countOf('encounter', (record) => record.person.holySpiritBaptism)}
          onClick={() => onChange({ ...filters, baptism: !filters.baptism })}
        >
          {t('Holy Spirit baptism')}
        </FilterChip>
        <FilterChip
          selected={filters.openOnly}
          count={countOf('open', (record) => record.active.length > 0)}
          onClick={() => onChange({ ...filters, openOnly: !filters.openOnly })}
        >
          {t('Open prayer requests')}
        </FilterChip>
      </div>
      <div className="team-filter-fields">
        <Select
          value={filters.status}
          aria-label={t('Response to the gospel')}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as SalvationStatus | 'any' })
          }
        >
          <option value="any">{t('Any response')}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status, language)}
            </option>
          ))}
        </Select>
        <Select
          value={filters.period}
          aria-label={t('Date range')}
          onChange={(event) => onChange({ ...filters, period: event.target.value as Period })}
        >
          {PERIODS.map((period) => (
            <option key={period.value} value={period.value}>
              {t(period.label)}
            </option>
          ))}
        </Select>
        <Input
          type="search"
          className="team-search"
          value={filters.query}
          placeholder={t('Search by name or place')}
          aria-label={t('Search records')}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>
    </>
  )
}

export { TeamFiltersBar }
