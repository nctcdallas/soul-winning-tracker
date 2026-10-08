// @vitest-environment jsdom
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { answeredCountLabel, translate } from '#/i18n/translate'
import fixture from './fixture.json' with { type: 'json' }
import goldenFile from './golden-ui.json' with { type: 'json' }
import { contractOf } from './contract'
import { identity, server } from './mocks'
import { renderApp, siteShell } from './render-app'
import { serializeDocument } from './serialize-document'
import { RECORDS_ERROR, TAB_PATHS, snapshotFor, states } from './states'
import { summarize } from './summarize'
import type { Language, State } from './states'
import type { Contract } from './contract'
import type { Summary } from './summarize'

vi.mock('#/server/functions', async () => (await import('./mocks')).server)
vi.mock('@netlify/identity', async () => (await import('./mocks')).identity)
vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))

const golden: Record<string, Summary> = goldenFile
const EYEBROW = 'LIVE SOUL-WINNING IMPACT · SINCE OCTOBER 2026'

// Each legacy line that a deliberate change replaced, with the lines that replace it. An empty list drops the line from every state.
const COPY_REVISIONS: Record<string, string[]> = {
  'Prayer list': [],
  '중보기도 목록': [],
  [EYEBROW]: ['Record each person you reach. Keep praying for them.', EYEBROW],
  'NCTC 전도 현황': ['만난 한 사람 한 사람을 기록하고, 계속 기도하세요.'],
  '다른 참여자에게는 전체 숫자만 공개됩니다. 가능하면 이름 일부나 이니셜을 사용하고, 당사자가 원치 않는 민감한 내용은 기록하지 마세요. 내 기록은 언제든 수정하거나 삭제할 수 있습니다.':
    [
      '다른 참여자에게는 전체 숫자만 공개됩니다. 가능하면 이름이나 이니셜만 사용하고, 당사자가 원치 않는 민감한 내용은 기록하지 마세요. 내 기록은 언제든 수정하거나 삭제할 수 있습니다.',
    ],
  '여정을 여는 중…': ['나의 기록을 불러오는 중…'],
  'Anyone with a Google account can participate—no approval needed. Record an encounter, track follow-up, and keep a private prayer list.':
    [
      'Anyone with a Google account can join. No approval is needed. Record an encounter, track follow-up, and keep a private prayer list.',
    ],
  'Only you and NCTC admins can see the names, locations, healing details, and prayer requests you record. Other participants see aggregate totals only. Use a first name or initials when possible, share only details the person is comfortable having recorded, and correct or remove an entry from your journey at any time.':
    [
      'Only you and NCTC admins can see the names, locations, notes, and prayer requests you record. Other participants see totals only. Use a first name or initials when possible, record only what the person is comfortable with, and correct or remove an entry at any time.',
    ],
}
interface ViewPatch {
  /** Legacy lines that the view no longer shows. Each entry drops one occurrence. */
  dropLines?: string[]
  /** Lines that the view shows and the legacy client did not. */
  addLines?: string[]
  /** Form attributes and values that the view gains, in the form that `contractOf` reports. */
  addFields?: string[]
  /** Legacy attributes that the view no longer has, in the same form. Each entry drops one occurrence. */
  dropFields?: string[]
}

// What each view gains or loses on purpose, by view name and language.
const VIEW_PATCHES: Record<string, Record<Language, ViewPatch>> = {
  // With no people, the page shows its heading and the empty state, and the heading holds the one button.
  'my-journey-empty': {
    en: {
      dropLines: [
        'My outreach totals',
        'My outreach encounters',
        '0',
        'From the encounters you recorded.',
        'Salvations I recorded',
        '0',
        'Healings I recorded',
        '0',
        'Holy Spirit baptisms I recorded',
        '0',
        'These totals use only your records and may include repeat encounters.',
        'People I recorded',
        'Record a person',
      ],
      dropFields: ['[aria-label=My outreach totals]'],
    },
    ko: {
      dropLines: [
        '나의 전도 기록 합계',
        '내가 기록한 전도 만남',
        '0',
        '내가 기록한 만남을 기준으로 집계합니다.',
        '내가 기록한 구원 결신',
        '0',
        '내가 기록한 치유',
        '0',
        '내가 기록한 성령세례',
        '0',
        '이 수치는 내 기록만 집계하며, 같은 사람을 여러 번 만난 기록이 포함될 수 있습니다.',
        '내가 만난 사람들',
        '만남 기록하기',
      ],
      dropFields: ['[aria-label=나의 전도 기록 합계]'],
    },
  },
  // The form takes notes for any encounter, not healing details only, and a first prayer request as its third step.
  record: {
    en: {
      dropLines: ['Healing details (optional)'],
      addLines: ['Notes (optional)', '03 · Prayer', 'Prayer request (optional)'],
      dropFields: ['[name=healingDetails]'],
      addFields: [
        '[name=notes]',
        '[maxlength=1000]',
        '[name=requestText]',
        '[placeholder=What can you pray for this person?]',
        '{value=}',
      ],
    },
    ko: {
      dropLines: ['치유 내용(선택)'],
      addLines: ['메모(선택)', '03 · 기도', '기도 제목(선택)'],
      dropFields: [
        '[name=healingDetails]',
        '[placeholder=어떤 변화가 있었는지, 본인이 기록을 허락한 내용만 적어 주세요.]',
      ],
      addFields: [
        '[name=notes]',
        '[placeholder=당사자가 기록해도 괜찮다고 한 내용만 적어 주세요.]',
        '[maxlength=1000]',
        '[name=requestText]',
        '[placeholder=이 분을 위해 무엇을 기도할까요?]',
        '{value=}',
      ],
    },
  },
}
// Set to a folder to keep the HTML of each state, which `shoot-screens.mjs` turns into screenshots.
const SCREENS_DIR = process.env.CAPTURE_SCREENS

/** Keeps the HTML of the document for `shoot-screens.mjs`, when a folder is set. */
function saveScreen(name: string) {
  if (!SCREENS_DIR) {
    return
  }

  mkdirSync(SCREENS_DIR, { recursive: true })
  writeFileSync(
    join(SCREENS_DIR, `${name.replace(' (', '.').replace(')', '')}.html`),
    serializeDocument(),
  )
}

/** Drops the first occurrence of an entry, and fails when the legacy state does not have it. */
function removeOne(list: string[], entry: string) {
  const index = list.indexOf(entry)

  if (index === -1) {
    throw new Error(`The legacy state has no "${entry}" to drop.`)
  }

  list.splice(index, 1)
}

/** The contract of the legacy client, with the changes that the redesign and the copy pass make on purpose. */
function expectedContract(state: State): Contract {
  const patch = VIEW_PATCHES[state.view]?.[state.language] ?? {}
  const lines = golden[state.name].lines.flatMap((line) => COPY_REVISIONS[line] ?? [line])

  for (const line of patch.dropLines ?? []) {
    removeOne(lines, line)
  }

  const legacy = contractOf({ ...golden[state.name], lines: lines.concat(patch.addLines ?? []) })
  const fields = [...legacy.fields]

  for (const field of patch.dropFields ?? []) {
    removeOne(fields, field)
  }
  const legacyFlag = state.language === 'ko' ? '🇺🇸' : '🇰🇷'
  // The toggle shows the two languages at the same time, each in its own script, with no flag.
  const ownLabel = state.language === 'ko' ? '한국어' : 'EN'
  const words = legacy.words.filter((word) => word !== legacyFlag).concat(ownLabel)

  // A record card keeps its answered requests under a count.
  if (state.records === 'ok' && (state.tab === 'my-journey' || state.tab === 'team')) {
    const snapshot = snapshotFor(state.session, state.records)
    const people = state.tab === 'team' ? (snapshot.team ?? []) : snapshot.mine

    for (const person of people) {
      const answered = snapshot.prayers.filter(
        (prayer) => prayer.journeyId === person.id && prayer.status === 'answered',
      ).length

      if (answered > 0) {
        words.push(...answeredCountLabel(answered, state.language).split(' '))
      }
    }
  }

  return { words: words.sort(), fields: fields.concat(patch.addFields ?? []).sort() }
}

function todayLocal() {
  const now = new Date()

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function answerRecords(state: State) {
  if (state.records === 'pending') {
    return new Promise<never>(() => {})
  }

  if (state.records === 'error') {
    return Promise.resolve({ ok: false, status: 503, error: RECORDS_ERROR })
  }

  return Promise.resolve({ ok: true, body: snapshotFor(state.session, state.records) })
}

function mockEnvironment(state: State) {
  const user =
    state.session === 'anon'
      ? null
      : {
          id: 'user-grace',
          email: fixture.viewer.email,
          name: fixture.viewer.displayName,
          provider: state.session === 'email' ? 'email' : 'google',
        }

  identity.getUser.mockResolvedValue(user)
  identity.handleAuthCallback.mockResolvedValue(null)
  server.getSessionHint.mockResolvedValue({
    hasToken: state.session !== 'anon',
    devMember: false,
    language: state.language,
  })
  server.getPublicTotals.mockResolvedValue({ ok: true, body: { totals: fixture.totals } })
  server.getSnapshot.mockImplementation(() => answerRecords(state))
}

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  cleanup()
})

test.each(states)('should keep the copy and the form contract of $name', async (state) => {
  mockEnvironment(state)
  renderApp(TAB_PATHS[state.tab ?? 'overview'])

  if (state.open) {
    const label = translate(
      state.open === 'journey-editor' ? 'Edit record' : 'Edit',
      state.language,
    )
    const buttons = await within(document.body).findAllByRole('button', { name: label })

    fireEvent.click(buttons[0])
  }

  // Overview, the list of people, and the team records follow their designs, with their own words and fields, so the legacy contract does not apply to them.
  if (state.tab === 'overview' && (state.records === 'ok' || state.records === 'empty')) {
    await within(document.body).findByRole('heading', { name: translate('Ministry totals', state.language) })
  } else if (state.records === 'ok' && (state.tab === 'my-journey' || state.tab === 'team')) {
    await waitFor(() => expect(document.querySelector('.record, .team-row')).not.toBeNull())

    if (state.tab === 'team') {
      saveScreen(state.name)
      fireEvent.click(document.querySelector('.team-row-open')!)
      saveScreen(`${state.name}-panel`)

      return
    }
  } else {
    await waitFor(() =>
      expect(contractOf(summarize(siteShell()!, todayLocal()))).toEqual(expectedContract(state)),
    )
  }

  saveScreen(state.name)
})
