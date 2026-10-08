import { localeOf, translate } from '#/i18n/translate'
import type { Language } from '#/i18n/translate'
import { SALVATION_STATUSES } from './types'
import type { Journey, JourneyInput, Prayer, SalvationStatus, Totals } from './types'

interface StatusOption {
  value: SalvationStatus
  label: string
}

const STATUS_LABELS: Record<SalvationStatus, string> = {
  declined: 'Not interested at this time',
  interested: 'Interested, but did not choose to receive Jesus',
  saved: 'Chose to receive Jesus',
  praying: 'Praying / follow-up',
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'declined', label: 'Not interested at this time — Pray for this person' },
  {
    value: 'interested',
    label: 'Interested, but did not choose to receive Jesus — Pray for this person',
  },
  { value: 'saved', label: 'Chose to receive Jesus — Pray and follow up with this person' },
]

const EARLIER_RECORD_OPTION: StatusOption = {
  value: 'praying',
  label: 'Praying / follow-up (earlier record)',
}

function statusOptionsFor(selected: SalvationStatus) {
  return selected === 'praying' ? [...STATUS_OPTIONS, EARLIER_RECORD_OPTION] : STATUS_OPTIONS
}

function statusOf(person: Journey): SalvationStatus {
  if (person.salvationStatus === 'saved' || person.salvation) {
    return 'saved'
  }

  return person.salvationStatus === 'declined' || person.salvationStatus === 'interested'
    ? person.salvationStatus
    : 'praying'
}

function salvationStatusOf(value: string): SalvationStatus {
  return SALVATION_STATUSES.find((status) => status === value) ?? 'declined'
}

function journeyInputFrom(form: HTMLFormElement): JourneyInput {
  const data = new FormData(form)

  return {
    soulName: String(data.get('soulName') || ''),
    location: String(data.get('location') || ''),
    encounterDate: String(data.get('encounterDate') || ''),
    salvationStatus: salvationStatusOf(String(data.get('salvationStatus') || '')),
    healing: data.has('healing'),
    holySpiritBaptism: data.has('holySpiritBaptism'),
    healingDetails: String(data.get('healingDetails') || ''),
  }
}

function statusLabelOf(person: Journey, language: Language) {
  return translate(STATUS_LABELS[statusOf(person)], language)
}

function dateOf(value: string, language: Language) {
  const date = new Date(value)

  return Number.isNaN(date.valueOf())
    ? ''
    : date.toLocaleDateString(localeOf(language), {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
}

function todayISO() {
  const now = new Date()

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function encounterISO(person: Journey) {
  return person.encounterDate ? person.encounterDate.slice(0, 10) : ''
}

function encounterDateOf(person: Journey, language: Language) {
  const value = encounterISO(person)

  return value
    ? dateOf(`${value}T12:00:00`, language)
    : translate('Date of encounter not set', language)
}

function personalTotals(people: Journey[]): Totals {
  return {
    reached: people.length,
    salvations: people.filter((person) => statusOf(person) === 'saved').length,
    healings: people.filter((person) => person.healing).length,
    baptisms: people.filter((person) => person.holySpiritBaptism).length,
  }
}

function prayersOf(person: Journey, prayers: Prayer[]) {
  const own = prayers.filter((prayer) => prayer.journeyId === person.id)

  return {
    all: own,
    active: own.filter((prayer) => prayer.status === 'active'),
    answered: own.filter((prayer) => prayer.status === 'answered'),
  }
}

function countLabel(totals: Totals | undefined, key: keyof Totals, language: Language) {
  const value = totals ? Number(totals[key]) : Number.NaN

  return Number.isFinite(value) ? value.toLocaleString(localeOf(language)) : '—'
}

export {
  countLabel,
  dateOf,
  encounterDateOf,
  encounterISO,
  journeyInputFrom,
  personalTotals,
  prayersOf,
  salvationStatusOf,
  statusLabelOf,
  statusOf,
  statusOptionsFor,
  todayISO,
}
