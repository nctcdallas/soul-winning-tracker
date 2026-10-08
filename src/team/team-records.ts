import { encounterISO, prayersOf, statusOf } from '#/journeys/helpers'
import type { Journey, Prayer, SalvationStatus } from '#/journeys/types'

type Period = 'all' | 'week' | 'month'
type SortKey = 'name' | 'member' | 'date'
type FilterGroup = 'member' | 'encounter' | 'open'

interface TeamSort {
  key: SortKey
  descending: boolean
}

interface TeamFilters {
  /** The key of one team member, or null for everyone. */
  member: string | null
  healing: boolean
  baptism: boolean
  openOnly: boolean
  status: SalvationStatus | 'any'
  period: Period
  query: string
}

interface TeamRecord {
  person: Journey
  memberKey: string
  memberName: string
  /** `YYYY-MM-DD` of the encounter, or of the record when the encounter has no date. */
  date: string
  active: Prayer[]
  answered: Prayer[]
}

const NO_FILTERS: TeamFilters = {
  member: null,
  healing: false,
  baptism: false,
  openOnly: false,
  status: 'any',
  period: 'all',
  query: '',
}
const DAY = 86_400_000

function memberKeyOf(email: string | null, name: string) {
  return (email || name).toLowerCase()
}

function teamRecordsOf(people: Journey[], prayers: Prayer[]): TeamRecord[] {
  return people.map((person) => {
    const { active, answered } = prayersOf(person, prayers)

    return {
      person,
      memberKey: memberKeyOf(person.recorderEmail, person.recorderName),
      memberName: person.recorderName || (person.recorderEmail ?? '').split('@')[0],
      date: encounterISO(person) || person.createdAt.slice(0, 10),
      active,
      answered,
    }
  })
}

function inPeriod(date: string, period: Period, today: string) {
  if (period === 'month') {
    return date.slice(0, 7) === today.slice(0, 7)
  }

  if (period === 'week') {
    return (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY <= 7
  }

  return true
}

/** Tells if a record passes the filters. `skip` leaves one group out, so a chip can count what it would show. */
function matchesFilters(
  record: TeamRecord,
  filters: TeamFilters,
  today: string,
  skip?: FilterGroup,
) {
  const { person } = record
  const query = filters.query.trim().toLowerCase()

  if (skip !== 'member' && filters.member && record.memberKey !== filters.member) {
    return false
  }

  if (
    skip !== 'encounter' &&
    ((filters.healing && !person.healing) || (filters.baptism && !person.holySpiritBaptism))
  ) {
    return false
  }

  if (skip !== 'open' && filters.openOnly && !record.active.length) {
    return false
  }

  if (filters.status !== 'any' && statusOf(person) !== filters.status) {
    return false
  }

  if (!inPeriod(record.date, filters.period, today)) {
    return false
  }

  return (
    !query ||
    person.soulName.toLowerCase().includes(query) ||
    person.location.toLowerCase().includes(query)
  )
}

function sortValueOf(record: TeamRecord, key: SortKey) {
  if (key === 'name') {
    return record.person.soulName.toLowerCase()
  }

  return key === 'member' ? record.memberName.toLowerCase() : record.date
}

function sortRecords(records: TeamRecord[], sort: TeamSort) {
  const direction = sort.descending ? -1 : 1

  return [...records].sort((first, second) => {
    const firstValue = sortValueOf(first, sort.key)
    const secondValue = sortValueOf(second, sort.key)

    if (firstValue !== secondValue) {
      return (firstValue < secondValue ? -1 : 1) * direction
    }

    return second.date.localeCompare(first.date) || second.person.id - first.person.id
  })
}

function isFiltered(filters: TeamFilters) {
  return (
    filters.member !== null ||
    filters.healing ||
    filters.baptism ||
    filters.openOnly ||
    filters.status !== 'any' ||
    filters.period !== 'all' ||
    filters.query.trim() !== ''
  )
}

function csvCell(value: string) {
  // A spreadsheet runs a cell that starts with one of these as a formula, and the text comes from members.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

  return `"${safe.replace(/"/g, '""')}"`
}

function csvOf(rows: string[][]) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

export {
  NO_FILTERS,
  csvOf,
  isFiltered,
  matchesFilters,
  memberKeyOf,
  sortRecords,
  teamRecordsOf,
}
export type { Period, SortKey, TeamFilters, TeamRecord, TeamSort }
