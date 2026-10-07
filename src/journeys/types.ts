const SALVATION_STATUSES = ['declined', 'praying', 'interested', 'saved'] as const
const PRAYER_STATUSES = ['active', 'answered'] as const

type SalvationStatus = (typeof SALVATION_STATUSES)[number]
type PrayerStatus = (typeof PRAYER_STATUSES)[number]

interface Totals {
  reached: number
  salvations: number
  healings: number
  baptisms: number
}

interface Journey {
  id: number
  ownerUserId: string | null
  recorderEmail: string | null
  recorderName: string
  soulName: string
  location: string
  /** `YYYY-MM-DD`, or null on records made before the field existed. */
  encounterDate: string | null
  salvation: boolean
  salvationStatus: SalvationStatus
  healing: boolean
  /** Free text about the encounter. Before October 2026 it held healing details only. */
  notes: string | null
  holySpiritBaptism: boolean
  createdAt: string
}

interface Prayer {
  id: number
  journeyId: number
  requestText: string
  status: PrayerStatus
  createdAt: string
}

interface Viewer {
  displayName: string
  email: string
  isLeader: boolean
}

interface Snapshot {
  totals: Totals
  mine: Journey[]
  /** Present only for admins. */
  team?: Journey[]
  prayers: Prayer[]
  viewer: Viewer
}

interface JourneyInput {
  soulName: string
  location: string
  encounterDate: string
  salvationStatus: SalvationStatus
  healing: boolean
  holySpiritBaptism: boolean
  notes: string
}

type FailureStatus = 400 | 401 | 403 | 404 | 503

interface Failure {
  ok: false
  status: FailureStatus
  error: string
}

type Result<Body> = { ok: true; body: Body } | Failure

export { PRAYER_STATUSES, SALVATION_STATUSES }
export type {
  Failure,
  FailureStatus,
  Journey,
  JourneyInput,
  Prayer,
  PrayerStatus,
  Result,
  SalvationStatus,
  Snapshot,
  Totals,
  Viewer,
}
