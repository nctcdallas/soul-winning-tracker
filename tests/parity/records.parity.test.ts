import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getDatabase } from '@netlify/database'
import { NetlifyDB } from '@netlify/database-dev'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { parseAdminEmails, resolveMember } from '#/server/member'
import {
  addPrayer,
  createJourney,
  deleteJourney,
  deletePrayer,
  editJourney,
  editPrayer,
  publicTotals,
  setPrayerStatus,
  setSalvationStatus,
  snapshot,
} from '#/server/records'
import { ADMIN_EMAILS, actors, normalize, seedSql, steps } from './scenario'
import type { Result } from '#/journeys/types'
import type { Member } from '#/server/member'
import type { Sql } from '#/server/records'
import type { Actor } from './scenario'

type MemberOperation = (sql: Sql, member: Member, ...args: unknown[]) => Promise<Result<unknown>>

// golden.json holds what netlify/functions/journey-v2.mjs returned for these steps at commit ea2bda8.
const golden: unknown[] = JSON.parse(readFileSync(new URL('./golden.json', import.meta.url), 'utf8'))

const memberOperations: Record<string, MemberOperation> = {
  snapshot,
  createJourney,
  editJourney,
  setStatus: setSalvationStatus,
  deleteJourney,
  addPrayer,
  editPrayer,
  setPrayerStatus,
  deletePrayer,
}

const database = new NetlifyDB({ logger: () => {} })
let connection: ReturnType<typeof getDatabase>

const identityUserOf = (actor: Actor | null) =>
  actor ? { id: actor.sub, email: actor.email, name: actor.name, provider: actor.provider } : null

async function runStep(as: string, op: string, args: unknown[]): Promise<Result<unknown>> {
  if (op === 'totals') {
    return { ok: true, body: { totals: await publicTotals(connection.sql) } }
  }

  const member = resolveMember(identityUserOf(actors[as]), parseAdminEmails(ADMIN_EMAILS))

  return member.ok ? memberOperations[op](connection.sql, member.body, ...args) : member
}

beforeAll(async () => {
  const connectionString = await database.start()

  await database.applyMigrations(fileURLToPath(new URL('../../netlify/database/migrations', import.meta.url)))
  await database.exec(seedSql)
  connection = getDatabase({ connectionString })
})

afterAll(async () => {
  await connection.pool.end()
  await database.stop()
})

test.each(steps.map((step, index) => ({ index, ...step })))(
  'step $index: $as $op should match the legacy function',
  async ({ index, as, op, args = [] }) => {
    const result = await runStep(as, op, args)

    expect(
      normalize({
        as,
        op,
        ...(result.ok ? { body: result.body } : { status: result.status, body: { error: result.error } }),
      }),
    ).toEqual(golden[index])
  },
)
