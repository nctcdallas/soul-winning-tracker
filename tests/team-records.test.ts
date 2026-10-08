import { expect, test } from 'vitest'
import {
  NO_FILTERS,
  csvOf,
  matchesFilters,
  sortRecords,
  teamRecordsOf,
} from '#/team/team-records'
import fixture from './ui/fixture.json' with { type: 'json' }
import type { Journey, Prayer } from '#/journeys/types'

const people = [...fixture.mine, ...fixture.others] as Journey[]
const prayers = [...fixture.prayers, ...fixture.otherPrayers] as Prayer[]
const records = teamRecordsOf(people, prayers)
const TODAY = '2026-10-06'

function namesOf(filters: Partial<typeof NO_FILTERS>) {
  return records
    .filter((record) => matchesFilters(record, { ...NO_FILTERS, ...filters }, TODAY))
    .map((record) => record.person.soulName)
}

test('should use the date of the record when the encounter has no date', () => {
  expect(records.find((record) => record.person.soulName === '한나')?.date).toBe('2026-10-02')
})

test('should keep only the records of one team member', () => {
  expect(namesOf({ member: 'sam@example.com' })).toEqual(['Tori'])
})

test('should need each selected encounter', () => {
  expect(namesOf({ healing: true })).toEqual(['Marcus <T>', 'J.R.'])
  expect(namesOf({ healing: true, baptism: true })).toEqual(['Marcus <T>'])
})

test('should keep only the records with an open request', () => {
  expect(namesOf({ openOnly: true })).toEqual(['Marcus <T>', 'Tori'])
})

test('should match the response, the last seven days, and the search text', () => {
  expect(namesOf({ status: 'interested' })).toEqual(['Dee', 'Tori'])
  expect(namesOf({ period: 'week' })).toEqual(['Marcus <T>', '한나', 'Tori'])
  expect(namesOf({ period: 'month' })).toEqual(['Marcus <T>', '한나', 'Tori'])
  expect(namesOf({ query: ' fris ' })).toEqual(['Dee'])
})

test('should leave one filter group out for the count of a chip', () => {
  const filters = { ...NO_FILTERS, member: 'sam@example.com' }

  expect(records.filter((record) => matchesFilters(record, filters, TODAY, 'member'))).toHaveLength(
    5,
  )
})

test('should sort by a column and then by the newest date', () => {
  const byName = sortRecords(records, { key: 'name', descending: false })
  const byDate = sortRecords(records, { key: 'date', descending: true })

  expect(byName.map((record) => record.person.soulName)).toEqual([
    'Dee',
    'J.R.',
    'Marcus <T>',
    'Tori',
    '한나',
  ])
  expect(byDate.map((record) => record.person.soulName)).toEqual([
    'Marcus <T>',
    '한나',
    'Tori',
    'J.R.',
    'Dee',
  ])
})

test('should quote each CSV cell and stop a cell from running as a formula', () => {
  expect(csvOf([['He said "hi"', '=SUM(A1)', 'plain']])).toBe(
    '"He said ""hi""","\'=SUM(A1)","plain"',
  )
})
