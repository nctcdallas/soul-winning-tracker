import { fileURLToPath } from 'node:url'
import { getDatabase } from '@netlify/database'
import { NetlifyDB } from '@netlify/database-dev'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createJourney, editJourney, publicTotals, snapshot } from '#/server/records'
import type { Member } from '#/server/member'

const database = new NetlifyDB({ logger: () => {} })
let connection: ReturnType<typeof getDatabase>

const member: Member = {
  id: 'user-grace',
  email: 'grace@example.com',
  ownerEmail: 'grace@example.com',
  displayName: 'Grace Lee',
  isAdmin: false,
}

const journeyInput = {
  soulName: 'Grace',
  location: 'Plano, TX',
  encounterDate: '2026-10-01',
  salvationStatus: 'saved',
  healing: false,
  holySpiritBaptism: false,
  notes: '',
}

beforeAll(async () => {
  const connectionString = await database.start()

  await database.applyMigrations(
    fileURLToPath(new URL('../netlify/database/migrations', import.meta.url)),
  )
  connection = getDatabase({ connectionString })
})

afterAll(async () => {
  await connection.pool.end()
  await database.stop()
})

test('createJourney should reject a null date of encounter and save nothing', async () => {
  const result = await createJourney(connection.sql, member, {
    soulName: 'Grace',
    location: 'Plano, TX',
    encounterDate: null,
    salvationStatus: 'saved',
    healing: false,
    holySpiritBaptism: false,
    notes: '',
  })

  expect(result).toEqual({
    ok: false,
    status: 400,
    error: 'Please complete the name, location, and outcome choices.',
  })
  expect(await publicTotals(connection.sql)).toEqual({
    reached: 0,
    salvations: 0,
    healings: 0,
    baptisms: 0,
  })
})

test('createJourney should save one journey and one active prayer request from the first request', async () => {
  const result = await createJourney(
    connection.sql,
    member,
    { ...journeyInput, soulName: 'Dana' },
    '  Healing for her family  ',
  )

  expect(result.ok).toBe(true)

  const journeys = await connection.sql`SELECT id::int AS id FROM journeys WHERE soul_name = 'Dana'`
  const prayers = await connection.sql`
    SELECT journey_id::int AS "journeyId", request_text AS "requestText", status
    FROM prayer_requests WHERE journey_id = ${journeys[0].id}`

  expect(journeys).toHaveLength(1)
  expect(prayers).toEqual([
    { journeyId: journeys[0].id, requestText: 'Healing for her family', status: 'active' },
  ])

  const loaded = await snapshot(connection.sql, member)

  expect(loaded.ok && loaded.body.mine[0].soulName).toBe('Dana')
  expect(loaded.ok && loaded.body.prayers[0]).toMatchObject({
    journeyId: journeys[0].id,
    requestText: 'Healing for her family',
    status: 'active',
  })
})

test('createJourney should save a journey with no prayer request when the text is blank', async () => {
  const result = await createJourney(
    connection.sql,
    member,
    { ...journeyInput, soulName: 'Eli' },
    '   ',
  )

  const journeys = await connection.sql`SELECT id::int AS id FROM journeys WHERE soul_name = 'Eli'`
  const prayers = await connection.sql`
    SELECT id FROM prayer_requests WHERE journey_id = ${journeys[0].id}`

  expect(result).toEqual({ ok: true, body: { journey: { id: journeys[0].id } } })
  expect(prayers).toHaveLength(0)
})

test('createJourney should reject a prayer request of 1,001 characters and save nothing', async () => {
  const result = await createJourney(
    connection.sql,
    member,
    { ...journeyInput, soulName: 'Finn' },
    'a'.repeat(1001),
  )

  const journeys = await connection.sql`SELECT id FROM journeys WHERE soul_name = 'Finn'`

  expect(result).toEqual({
    ok: false,
    status: 400,
    error: 'Please enter a prayer request under 1,000 characters.',
  })
  expect(journeys).toHaveLength(0)
})

test('createJourney should keep the notes of an encounter with no healing', async () => {
  await createJourney(connection.sql, member, {
    ...journeyInput,
    soulName: 'Noted',
    notes: '  Asked for a Bible.  ',
  })

  const result = await snapshot(connection.sql, member)
  const saved = result.ok ? result.body.mine.find((person) => person.soulName === 'Noted') : null

  expect(saved).toMatchObject({ healing: false, notes: 'Asked for a Bible.' })
})

test('editJourney should let an admin read the record of a different member but not change it', async () => {
  const admin: Member = {
    id: 'user-admin',
    email: 'admin@example.com',
    ownerEmail: 'admin@example.com',
    displayName: 'Admin',
    isAdmin: true,
  }

  await createJourney(connection.sql, member, { ...journeyInput, soulName: 'Kept' })

  const before = await snapshot(connection.sql, admin)
  const kept = before.ok ? before.body.team?.find((person) => person.soulName === 'Kept') : null
  const result = await editJourney(connection.sql, admin, kept?.id, {
    ...journeyInput,
    soulName: 'Changed',
  })
  const after = await snapshot(connection.sql, member)

  expect(kept).toBeTruthy()
  expect(result).toEqual({ ok: false, status: 404, error: 'Record not found.' })
  expect(after.ok && after.body.mine.some((person) => person.soulName === 'Kept')).toBe(true)
})
