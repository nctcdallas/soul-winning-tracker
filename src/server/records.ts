import { PRAYER_STATUSES, SALVATION_STATUSES } from '#/journeys/types'
import type { getDatabase } from '@netlify/database'
import type {
  Failure,
  FailureStatus,
  Journey,
  Prayer,
  PrayerStatus,
  Result,
  SalvationStatus,
  Snapshot,
  Totals,
} from '#/journeys/types'
import type { Member } from './member'

type Sql = ReturnType<typeof getDatabase>['sql']

interface JourneyFields {
  soulName: string
  location: string
  encounterDate: string | null
  salvationStatus: SalvationStatus
  healing: boolean
  holySpiritBaptism: boolean
  healingDetails: string | null
}

const TIMESTAMP = `'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'`

const JOURNEY_COLUMNS = `id::int AS id, owner_user_id AS "ownerUserId", owner_email AS "recorderEmail",
  recorder_name AS "recorderName", soul_name AS "soulName", location,
  to_char(encounter_date, 'YYYY-MM-DD') AS "encounterDate", salvation, salvation_status AS "salvationStatus",
  healing, healing_details AS "healingDetails", holy_spirit_baptism AS "holySpiritBaptism",
  to_char(created_at AT TIME ZONE 'UTC', ${TIMESTAMP}) AS "createdAt"`

const PRAYER_COLUMNS = `p.id::int AS id, p.journey_id::int AS "journeyId", p.request_text AS "requestText", p.status,
  to_char(p.created_at AT TIME ZONE 'UTC', ${TIMESTAMP}) AS "createdAt"`

const RECORD_NOT_FOUND = 'Record not found.'
const PRAYER_NOT_FOUND = 'Prayer request not found.'
const INVALID_PRAYER = 'Invalid prayer request.'

const fail = (status: FailureStatus, error: string): Failure => ({ ok: false, status, error })
const done = <Body>(body: Body): Result<Body> => ({ ok: true, body })

function parseId(value: unknown) {
  const text = String(value)
  const id = Number(text)

  return /^\d+$/.test(text) && Number.isSafeInteger(id) && id > 0 ? id : null
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)

  // Date rolls 2026-02-30 forward to March, so the round trip rejects days that do not exist.
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

const isSalvationStatus = (value: unknown): value is SalvationStatus =>
  SALVATION_STATUSES.includes(value as SalvationStatus)

const isPrayerStatus = (value: unknown): value is PrayerStatus =>
  PRAYER_STATUSES.includes(value as PrayerStatus)

const trimmed = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

function parseJourney(raw: unknown, encounterDate: 'required' | 'optional'): JourneyFields | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const input = raw as Record<string, unknown>
  const soulName = trimmed(input.soulName)
  const location = trimmed(input.location)
  const details = trimmed(input.healingDetails)
  const date = encounterDate === 'optional' && !input.encounterDate ? null : input.encounterDate

  if (
    !soulName ||
    soulName.length > 100 ||
    !location ||
    location.length > 160 ||
    details.length > 1000
  ) {
    return null
  }

  if (!(date === null && encounterDate === 'optional') && !isCalendarDate(date)) {
    return null
  }

  if (
    !isSalvationStatus(input.salvationStatus) ||
    typeof input.healing !== 'boolean' ||
    typeof input.holySpiritBaptism !== 'boolean'
  ) {
    return null
  }

  return {
    soulName,
    location,
    encounterDate: date,
    salvationStatus: input.salvationStatus,
    healing: input.healing,
    holySpiritBaptism: input.holySpiritBaptism,
    healingDetails: input.healing ? details || null : null,
  }
}

function parsePrayerText(value: unknown) {
  const text = trimmed(value)

  return text && text.length <= 1000 ? text : null
}

// A record with no owner id came from the earlier site, and its recorder may reach it by email until a sign-in claims it.
async function canAccessJourney(sql: Sql, journeyId: number, member: Member) {
  const rows = await sql`
    SELECT id FROM journeys WHERE id = ${journeyId}
      AND (${member.isAdmin} OR owner_user_id = ${member.id}
        OR (owner_user_id IS NULL AND lower(owner_email) = ${member.ownerEmail}))
    LIMIT 1`

  return rows.length > 0
}

async function canAccessPrayer(sql: Sql, prayerId: number, member: Member) {
  const rows = await sql`
    SELECT p.id FROM prayer_requests p JOIN journeys j ON j.id = p.journey_id
    WHERE p.id = ${prayerId}
      AND (${member.isAdmin} OR j.owner_user_id = ${member.id}
        OR (j.owner_user_id IS NULL AND lower(j.owner_email) = ${member.ownerEmail}))
    LIMIT 1`

  return rows.length > 0
}

async function publicTotals(sql: Sql): Promise<Totals> {
  const rows = await sql<Totals>`
    SELECT count(*)::int AS reached,
      count(*) FILTER (WHERE salvation)::int AS salvations,
      count(*) FILTER (WHERE healing)::int AS healings,
      count(*) FILTER (WHERE holy_spirit_baptism)::int AS baptisms
    FROM journeys`

  return rows[0] ?? { reached: 0, salvations: 0, healings: 0, baptisms: 0 }
}

async function snapshot(sql: Sql, member: Member): Promise<Result<Snapshot>> {
  const totals = await publicTotals(sql)

  await sql`UPDATE journeys SET owner_user_id = ${member.id}
    WHERE owner_user_id IS NULL AND lower(owner_email) = ${member.ownerEmail}`

  const mine = await sql<Journey>`
    SELECT ${sql.raw(JOURNEY_COLUMNS)} FROM journeys WHERE owner_user_id = ${member.id} ORDER BY id DESC`
  const team = member.isAdmin
    ? await sql<Journey>`SELECT ${sql.raw(JOURNEY_COLUMNS)} FROM journeys ORDER BY id DESC`
    : undefined
  const prayers = member.isAdmin
    ? await sql<Prayer>`SELECT ${sql.raw(PRAYER_COLUMNS)} FROM prayer_requests p ORDER BY p.id DESC`
    : await sql<Prayer>`
        SELECT ${sql.raw(PRAYER_COLUMNS)} FROM prayer_requests p JOIN journeys j ON j.id = p.journey_id
        WHERE j.owner_user_id = ${member.id} ORDER BY p.id DESC`

  return done({
    totals,
    mine,
    ...(team ? { team } : {}),
    prayers,
    viewer: { displayName: member.displayName, email: member.email, isLeader: member.isAdmin },
  })
}

async function createJourney(
  sql: Sql,
  member: Member,
  raw: unknown,
): Promise<Result<{ journey: { id: number } }>> {
  if (!raw || typeof raw !== 'object') {
    return fail(400, 'Please check the entry.')
  }

  const fields = parseJourney(raw, 'required')

  if (!fields) {
    return fail(400, 'Please complete the name, location, and outcome choices.')
  }

  const rows = await sql<{ id: number }>`
    INSERT INTO journeys (owner_user_id, owner_email, recorder_name, soul_name, location, encounter_date,
      salvation, salvation_status, healing, healing_details, holy_spirit_baptism)
    VALUES (${member.id}, ${member.ownerEmail}, ${member.displayName}, ${fields.soulName}, ${fields.location},
      CAST(${fields.encounterDate} AS DATE), ${fields.salvationStatus === 'saved'}, ${fields.salvationStatus},
      ${fields.healing}, ${fields.healingDetails}, ${fields.holySpiritBaptism})
    RETURNING id::int AS id`

  return done({ journey: { id: rows[0].id } })
}

async function editJourney(
  sql: Sql,
  member: Member,
  rawId: unknown,
  raw: unknown,
): Promise<Result<{ saved: true }>> {
  const id = parseId(rawId)

  if (!id) {
    return fail(400, 'Invalid record.')
  }

  if (!(await canAccessJourney(sql, id, member))) {
    return fail(404, RECORD_NOT_FOUND)
  }

  const fields = parseJourney(raw, 'optional')

  if (!fields) {
    return fail(400, 'Please check the record details and try again.')
  }

  await sql`UPDATE journeys SET soul_name = ${fields.soulName}, location = ${fields.location},
    encounter_date = CAST(${fields.encounterDate} AS DATE), salvation_status = ${fields.salvationStatus},
    salvation = ${fields.salvationStatus === 'saved'}, healing = ${fields.healing},
    healing_details = ${fields.healingDetails}, holy_spirit_baptism = ${fields.holySpiritBaptism}
    WHERE id = ${id}`

  return done({ saved: true })
}

async function setSalvationStatus(
  sql: Sql,
  member: Member,
  rawId: unknown,
  status: unknown,
): Promise<Result<{ saved: true }>> {
  const id = parseId(rawId)

  if (!id) {
    return fail(400, 'Invalid record.')
  }

  if (!(await canAccessJourney(sql, id, member))) {
    return fail(404, RECORD_NOT_FOUND)
  }

  if (!isSalvationStatus(status)) {
    return fail(400, 'Invalid salvation status.')
  }

  await sql`UPDATE journeys SET salvation_status = ${status}, salvation = ${status === 'saved'} WHERE id = ${id}`

  return done({ saved: true })
}

async function deleteJourney(
  sql: Sql,
  member: Member,
  rawId: unknown,
): Promise<Result<{ deleted: true }>> {
  const id = parseId(rawId)

  if (!id || !(await canAccessJourney(sql, id, member))) {
    return fail(404, RECORD_NOT_FOUND)
  }

  await sql`DELETE FROM journeys WHERE id = ${id}`

  return done({ deleted: true })
}

async function addPrayer(
  sql: Sql,
  member: Member,
  rawJourneyId: unknown,
  rawText: unknown,
): Promise<Result<{ prayer: { id: number } }>> {
  const journeyId = parseId(rawJourneyId)
  const requestText = parsePrayerText(rawText)

  if (!journeyId || !requestText) {
    return fail(400, 'Please enter a prayer request under 1,000 characters.')
  }

  if (!(await canAccessJourney(sql, journeyId, member))) {
    return fail(404, RECORD_NOT_FOUND)
  }

  const rows = await sql<{ id: number }>`
    INSERT INTO prayer_requests (journey_id, request_text) VALUES (${journeyId}, ${requestText})
    RETURNING id::int AS id`

  return done({ prayer: { id: rows[0].id } })
}

async function editPrayer(
  sql: Sql,
  member: Member,
  rawId: unknown,
  rawText: unknown,
): Promise<Result<{ saved: true }>> {
  const id = parseId(rawId)
  const requestText = parsePrayerText(rawText)

  if (!id || !requestText) {
    return fail(400, INVALID_PRAYER)
  }

  if (!(await canAccessPrayer(sql, id, member))) {
    return fail(404, PRAYER_NOT_FOUND)
  }

  await sql`UPDATE prayer_requests SET request_text = ${requestText} WHERE id = ${id}`

  return done({ saved: true })
}

async function setPrayerStatus(
  sql: Sql,
  member: Member,
  rawId: unknown,
  status: unknown,
): Promise<Result<{ saved: true }>> {
  const id = parseId(rawId)

  if (!id || !isPrayerStatus(status)) {
    return fail(400, INVALID_PRAYER)
  }

  if (!(await canAccessPrayer(sql, id, member))) {
    return fail(404, PRAYER_NOT_FOUND)
  }

  await sql`UPDATE prayer_requests SET status = ${status} WHERE id = ${id}`

  return done({ saved: true })
}

async function deletePrayer(
  sql: Sql,
  member: Member,
  rawId: unknown,
): Promise<Result<{ deleted: true }>> {
  const id = parseId(rawId)

  if (!id) {
    return fail(400, INVALID_PRAYER)
  }

  if (!(await canAccessPrayer(sql, id, member))) {
    return fail(404, PRAYER_NOT_FOUND)
  }

  await sql`DELETE FROM prayer_requests WHERE id = ${id}`

  return done({ deleted: true })
}

export {
  addPrayer,
  createJourney,
  deleteJourney,
  deletePrayer,
  editJourney,
  editPrayer,
  fail,
  publicTotals,
  setPrayerStatus,
  setSalvationStatus,
  snapshot,
}
export type { Sql }
