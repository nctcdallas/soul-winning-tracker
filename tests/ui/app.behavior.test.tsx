// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import fixture from './fixture.json' with { type: 'json' }
import { identity, server } from './mocks'
import { renderApp } from './render-app'
import { snapshotFor } from './states'
import type { Language } from './states'

vi.mock('#/server/functions', async () => (await import('./mocks')).server)
vi.mock('@netlify/identity', async () => (await import('./mocks')).identity)
vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))

interface StartOptions {
  path: string
  session?: 'anon' | 'member' | 'leader'
  language?: Language
}

const SAVED = 'Person saved to your journey and prayer list.'
let records: ReturnType<typeof snapshotFor>

function succeed(body: unknown = {}) {
  return Promise.resolve({ ok: true, body })
}

function start({ path, session = 'member', language = 'en' }: StartOptions) {
  records = structuredClone(snapshotFor(session === 'anon' ? 'member' : session, 'ok'))
  identity.handleAuthCallback.mockResolvedValue(null)
  identity.logout.mockResolvedValue(undefined)
  identity.getUser.mockResolvedValue(
    session === 'anon'
      ? null
      : { id: 'user-grace', email: fixture.viewer.email, name: fixture.viewer.displayName, provider: 'google' },
  )
  server.getSessionHint.mockResolvedValue({ hasToken: session !== 'anon', language })
  server.getPublicTotals.mockResolvedValue({ ok: true, body: { totals: fixture.totals } })
  server.getSnapshot.mockImplementation(() => succeed(structuredClone(records)))

  return renderApp(path)
}

async function cardOf(name: string) {
  const heading = await screen.findByRole('heading', { name, level: 3 })

  return within(heading.closest('article')!)
}

async function expectNotice(text: string) {
  await waitFor(() => expect(document.querySelector('.notice')?.textContent).toBe(text))
}

function fill(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } })
}

beforeEach(() => {
  vi.resetAllMocks()
  document.cookie = 'soul-winning-language=; path=/; max-age=0'
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('should create a journey from the record form and open the journey tab with a notice', async () => {
  server.createJourneyFn.mockImplementation(() => succeed())
  start({ path: '/record' })

  const healingDetails = await screen.findByLabelText(/Healing details/)

  expect(healingDetails.closest('label')!.classList.contains('hidden')).toBe(true)

  fill(screen.getByLabelText('Person reached'), 'Dana')
  fill(screen.getByLabelText('Location'), 'Frisco')
  fill(screen.getByLabelText('Date of encounter'), '2026-10-01')
  fill(screen.getByLabelText('Response to the gospel'), 'interested')
  fireEvent.click(screen.getByLabelText(/Healing reported/))

  expect(healingDetails.closest('label')!.classList.contains('hidden')).toBe(false)

  fill(healingDetails, 'Back pain left')
  fireEvent.click(screen.getByRole('button', { name: 'Save encounter' }))

  await expectNotice(SAVED)

  expect(server.createJourneyFn).toHaveBeenCalledWith({
    data: {
      soulName: 'Dana',
      location: 'Frisco',
      encounterDate: '2026-10-01',
      salvationStatus: 'interested',
      healing: true,
      holySpiritBaptism: false,
      healingDetails: 'Back pain left',
    },
  })
  expect(await screen.findByRole('heading', { name: 'My journey', level: 1 })).toBeTruthy()
})

test('should change a salvation status from the card select', async () => {
  server.setSalvationStatusFn.mockImplementation(() => succeed())
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fill(card.getByLabelText('Response to the gospel for Marcus <T>'), 'declined')

  await expectNotice('Salvation status updated.')

  expect(server.setSalvationStatusFn).toHaveBeenCalledWith({
    data: { id: 7, salvationStatus: 'declined' },
  })
})

test('should keep a record when removing it is not confirmed', async () => {
  server.deleteJourneyFn.mockImplementation(() => succeed())
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Remove record' }))

  expect(server.deleteJourneyFn).not.toHaveBeenCalled()
  expect(document.querySelector('.notice')).toBeNull()
  expect(await cardOf('Marcus <T>')).toBeTruthy()
})

test('should remove a confirmed record and show a notice', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

  server.deleteJourneyFn.mockImplementation(({ data }) => {
    records.mine = records.mine.filter((person) => person.id !== data.id)

    return succeed()
  })
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Remove record' }))

  await expectNotice('Encounter and its prayer requests removed.')

  expect(confirm).toHaveBeenCalledWith(
    'Remove this encounter and all its prayer requests? This cannot be undone.',
  )
  expect(server.deleteJourneyFn).toHaveBeenCalledWith({ data: { id: 7 } })
  expect(screen.queryByRole('heading', { name: 'Marcus <T>', level: 3 })).toBeNull()
})

test('should add a prayer request and empty the input', async () => {
  server.addPrayerFn.mockImplementation(({ data }) => {
    records.prayers.push({
      id: 99,
      journeyId: data.journeyId,
      requestText: data.requestText,
      status: 'active',
      createdAt: '2026-10-05T10:00:00.000Z',
    })

    return succeed()
  })
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')
  const input = card.getByPlaceholderText<HTMLInputElement>('Prayer request for Marcus <T>')

  fill(input, 'Healing for his family')
  fireEvent.click(card.getByRole('button', { name: 'Add request' }))

  await expectNotice('Prayer request added.')

  expect(server.addPrayerFn).toHaveBeenCalledWith({
    data: { journeyId: 7, requestText: 'Healing for his family' },
  })
  expect(input.value).toBe('')
  expect(await screen.findByText('Healing for his family')).toBeTruthy()
  expect(card.getByText('2 active')).toBeTruthy()
})

test('should mark a prayer request answered', async () => {
  server.setPrayerStatusFn.mockImplementation(({ data }) => {
    records.prayers = records.prayers.map((prayer) =>
      prayer.id === data.id ? { ...prayer, status: data.status } : prayer,
    )

    return succeed()
  })
  start({ path: '/prayers' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))

  await expectNotice('Prayer request updated.')

  expect(server.setPrayerStatusFn).toHaveBeenCalledWith({ data: { id: 12, status: 'answered' } })
  expect(card.getByText('0 active')).toBeTruthy()
  expect(card.getByText('3 answered requests')).toBeTruthy()
})

test('should reopen an answered prayer request', async () => {
  server.setPrayerStatusFn.mockImplementation(() => succeed())
  start({ path: '/prayers' })

  const card = await cardOf('J.R.')

  fireEvent.click(card.getByRole('button', { name: 'Reopen' }))

  await expectNotice('Prayer request updated.')

  expect(server.setPrayerStatusFn).toHaveBeenCalledWith({ data: { id: 9, status: 'active' } })
})

test('should edit a prayer request and close its editor on save', async () => {
  server.editPrayerFn.mockImplementation(({ data }) => {
    records.prayers = records.prayers.map((prayer) =>
      prayer.id === data.id ? { ...prayer, requestText: data.requestText } : prayer,
    )

    return succeed()
  })
  start({ path: '/prayers' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getAllByRole('button', { name: 'Edit' })[0])
  fill(card.getByLabelText('Edit prayer request'), 'Strength and joy')
  fireEvent.click(card.getByRole('button', { name: 'Save request' }))

  await expectNotice('Prayer request updated.')

  expect(server.editPrayerFn).toHaveBeenCalledWith({
    data: { id: 12, requestText: 'Strength and joy' },
  })
  expect(card.queryByLabelText('Edit prayer request')).toBeNull()
  expect(card.getByText('Strength and joy')).toBeTruthy()
})

test('should close the prayer editor on cancel without saving', async () => {
  start({ path: '/prayers' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getAllByRole('button', { name: 'Edit' })[0])
  fireEvent.click(card.getByRole('button', { name: 'Cancel' }))

  expect(server.editPrayerFn).not.toHaveBeenCalled()
  expect(card.queryByLabelText('Edit prayer request')).toBeNull()
})

test('should remove a confirmed prayer request', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

  server.deletePrayerFn.mockImplementation(({ data }) => {
    records.prayers = records.prayers.filter((prayer) => prayer.id !== data.id)

    return succeed()
  })
  start({ path: '/prayers' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getAllByRole('button', { name: 'Remove' })[0])

  await expectNotice('Prayer request removed.')

  expect(confirm).toHaveBeenCalledWith('Remove this prayer request? This cannot be undone.')
  expect(server.deletePrayerFn).toHaveBeenCalledWith({ data: { id: 12 } })
  expect(screen.queryByText('Strength for his new walk <3')).toBeNull()
})

test('should keep a prayer request when removing it is not confirmed', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  start({ path: '/prayers' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getAllByRole('button', { name: 'Remove' })[0])

  expect(server.deletePrayerFn).not.toHaveBeenCalled()
  expect(card.getByText('Strength for his new walk <3')).toBeTruthy()
})

test('should edit a record and close its editor on save', async () => {
  server.editJourneyFn.mockImplementation(({ data }) => {
    records.mine = records.mine.map((person) =>
      person.id === data.id ? { ...person, ...data.journey } : person,
    )

    return succeed()
  })
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Edit record' }))
  fill(card.getByLabelText('Location'), 'Dallas, TX')
  fireEvent.click(card.getByRole('button', { name: 'Save changes' }))

  await expectNotice('Encounter updated.')

  expect(server.editJourneyFn).toHaveBeenCalledWith({
    data: {
      id: 7,
      journey: {
        soulName: 'Marcus <T>',
        location: 'Dallas, TX',
        encounterDate: '2026-10-02',
        salvationStatus: 'saved',
        healing: true,
        holySpiritBaptism: true,
        healingDetails: 'Knee pain left & he walked.',
      },
    },
  })
  expect(card.queryByRole('button', { name: 'Save changes' })).toBeNull()
  expect(card.getByRole('button', { name: 'Edit record' })).toBeTruthy()
  expect(card.getByText(/Dallas, TX/)).toBeTruthy()
})

test('should show the server error in the notice', async () => {
  server.setSalvationStatusFn.mockResolvedValue({ ok: false, status: 404, error: 'Record not found.' })
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fill(card.getByLabelText('Response to the gospel for Marcus <T>'), 'declined')

  await expectNotice('Record not found.')
})

test('should show the server error in Korean when the language is Korean', async () => {
  server.setSalvationStatusFn.mockResolvedValue({ ok: false, status: 404, error: 'Record not found.' })
  start({ path: '/journey', language: 'ko' })

  const card = await cardOf('Marcus <T>')

  fill(card.getByLabelText('Marcus <T>님의 복음에 대한 반응'), 'declined')

  await expectNotice('기록을 찾을 수 없습니다.')
})

test('should say so when a successful action leaves the records unreloadable', async () => {
  server.setSalvationStatusFn.mockImplementation(() => {
    server.getSnapshot.mockResolvedValue({ ok: false, status: 503, error: 'Records are temporarily unavailable. Please try again.' })

    return succeed()
  })
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fill(card.getByLabelText('Response to the gospel for Marcus <T>'), 'declined')

  await expectNotice('Saved, but the latest records could not be loaded. Please try again.')
})

test('should ignore a second action while one is still running', async () => {
  let finish = () => {}

  server.setSalvationStatusFn.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = () => resolve({ ok: true, body: {} })
      }),
  )
  start({ path: '/journey' })

  const first = await cardOf('Marcus <T>')
  const second = await cardOf('Dee')

  fill(first.getByLabelText('Response to the gospel for Marcus <T>'), 'declined')
  await waitFor(() => expect(server.setSalvationStatusFn).toHaveBeenCalledTimes(1))
  fill(second.getByLabelText('Response to the gospel for Dee'), 'saved')
  finish()

  await expectNotice('Salvation status updated.')

  expect(server.setSalvationStatusFn).toHaveBeenCalledTimes(1)
  expect(server.setSalvationStatusFn).toHaveBeenCalledWith({
    data: { id: 7, salvationStatus: 'declined' },
  })
})

test('should clear the notice when the member changes tab', async () => {
  server.setSalvationStatusFn.mockImplementation(() => succeed())
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fill(card.getByLabelText('Response to the gospel for Marcus <T>'), 'declined')
  await expectNotice('Salvation status updated.')
  fireEvent.click(screen.getByRole('button', { name: 'Prayer list' }))

  await screen.findByRole('heading', { name: 'My prayer list', level: 1 })

  expect(document.querySelector('.notice')).toBeNull()
})

test('should drop the notice when the next poll of the records succeeds', async () => {
  server.setSalvationStatusFn.mockImplementation(() => succeed())

  const router = start({ path: '/journey' })
  const card = await cardOf('Marcus <T>')

  fill(card.getByLabelText('Response to the gospel for Marcus <T>'), 'declined')
  await expectNotice('Salvation status updated.')
  await new Promise((resolve) => setTimeout(resolve, 5))
  await router.options.context.queryClient.refetchQueries({ queryKey: ['snapshot'] })

  await waitFor(() => expect(document.querySelector('.notice')).toBeNull())
})

test('should show a failed poll as the notice and keep the loaded records', async () => {
  const router = start({ path: '/journey' })

  await cardOf('Marcus <T>')
  server.getSnapshot.mockImplementation(() =>
    Promise.resolve({ ok: false, status: 503, error: 'Records are temporarily unavailable. Please try again.' }),
  )
  await router.options.context.queryClient.refetchQueries({ queryKey: ['snapshot'] })

  await expectNotice('Records are temporarily unavailable. Please try again.')

  expect(screen.getAllByRole('heading', { name: 'Marcus <T>', level: 3 })).toHaveLength(1)
})

test('should toggle the language, the heading, the document, and the cookie', async () => {
  start({ path: '/', session: 'anon' })

  await screen.findByRole('heading', { name: 'LIVE SOUL-WINNING IMPACT · SINCE OCTOBER 2026' })
  fireEvent.click(screen.getByRole('button', { name: '한국어로 보기' }))

  expect(await screen.findByRole('heading', { name: 'NCTC 전도 현황' })).toBeTruthy()
  expect(document.cookie).toContain('soul-winning-language=ko')
  expect(document.documentElement.lang).toBe('ko')
  expect(document.title).toBe('NCTC 영혼구원 여정')

  fireEvent.click(screen.getByRole('button', { name: '영어로 보기' }))

  expect(
    await screen.findByRole('heading', { name: 'LIVE SOUL-WINNING IMPACT · SINCE OCTOBER 2026' }),
  ).toBeTruthy()
  expect(document.cookie).toContain('soul-winning-language=en')
  expect(document.documentElement.lang).toBe('en')
  expect(document.title).toBe('Soul Winning Journey | NCTC')
})

test('should carry a Korean choice stored in localStorage over to the cookie', async () => {
  localStorage.setItem('soul-winning-language', 'ko')
  start({ path: '/', session: 'anon' })

  expect(await screen.findByRole('heading', { name: 'NCTC 전도 현황' })).toBeTruthy()
  expect(document.cookie).toContain('soul-winning-language=ko')
})

test('should send a signed-out visitor from a member page to the public page', async () => {
  const router = start({ path: '/journey', session: 'anon' })

  await screen.findByRole('heading', { name: 'LIVE SOUL-WINNING IMPACT · SINCE OCTOBER 2026' })

  expect(router.state.location.pathname).toBe('/')
  expect(server.getSnapshot).not.toHaveBeenCalled()
})

test('should send a member who is not a leader from the team page to the overview', async () => {
  const router = start({ path: '/team', session: 'member' })

  expect(await screen.findByRole('heading', { name: 'Every person matters.' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/')
  expect(screen.queryByRole('button', { name: 'Team records' })).toBeNull()
})

test('should open the team page for a leader', async () => {
  const router = start({ path: '/team', session: 'leader' })

  expect(await screen.findByRole('heading', { name: 'Team records', level: 1 })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/team')
  expect((await screen.findAllByText(/Recorded by Grace Lee/)).length).toBeGreaterThan(0)
})

test('should start Google sign-in from the public page', async () => {
  start({ path: '/', session: 'anon' })

  fireEvent.click(await screen.findByRole('button', { name: 'Continue with Google' }))

  expect(identity.oauthLogin).toHaveBeenCalledWith('google')
})

test('should sign out and show the public page', async () => {
  start({ path: '/' })

  fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

  expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeTruthy()
  expect(identity.logout).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('navigation')).toBeNull()
  expect(await screen.findByText('128')).toBeTruthy()
})
