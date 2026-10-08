import { fileURLToPath } from 'node:url'
import { getDatabase } from '@netlify/database'
import { NetlifyDB } from '@netlify/database-dev'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createJourney, publicTotals } from '#/server/records'
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
    healingDetails: '',
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
