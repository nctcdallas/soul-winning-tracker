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
      : {
          id: 'user-grace',
          email: fixture.viewer.email,
          name: fixture.viewer.displayName,
          provider: 'google',
        },
  )
  server.getSessionHint.mockResolvedValue({
    hasToken: session !== 'anon',
    devMember: false,
    language,
  })
  server.getPublicTotals.mockResolvedValue({ ok: true, body: { totals: fixture.totals } })
  server.getSnapshot.mockImplementation(() => succeed(structuredClone(records)))

  return renderApp(path)
}

async function cardOf(name: string) {
  const heading = await screen.findByRole('heading', { name, level: 3 })
  const toggle = within(heading).getByRole('button')

  // One row is open at a time, and only an open row has the controls.
  if (toggle.getAttribute('aria-expanded') === 'false') {
    fireEvent.click(toggle)
  }

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

  fill(await screen.findByLabelText('Person reached'), 'Dana')
  fill(screen.getByLabelText('Location'), 'Frisco')
  fill(screen.getByLabelText('Date of encounter'), '2026-10-01')
  fill(screen.getByLabelText('Response to the gospel'), 'interested')
  fireEvent.click(screen.getByLabelText(/Healing reported/))
  fill(screen.getByLabelText('Notes (optional)'), 'Back pain left')
  fill(screen.getByLabelText('Prayer request (optional)'), 'Peace for her family')
  fireEvent.click(screen.getByRole('button', { name: 'Save encounter' }))

  await expectNotice(SAVED)

  expect(server.createJourneyFn).toHaveBeenCalledWith({
    data: {
      journey: {
        soulName: 'Dana',
        location: 'Frisco',
        encounterDate: '2026-10-01',
        salvationStatus: 'interested',
        healing: true,
        holySpiritBaptism: false,
        notes: 'Back pain left',
      },
      requestText: 'Peace for her family',
    },
  })
  expect(await screen.findByRole('heading', { name: 'My journey', level: 1 })).toBeTruthy()
})

test('should send an empty prayer request when the prayer field is left blank', async () => {
  server.createJourneyFn.mockImplementation(() => succeed())
  start({ path: '/record' })

  fill(await screen.findByLabelText('Person reached'), 'Dana')
  fill(screen.getByLabelText('Location'), 'Frisco')
  fireEvent.click(screen.getByRole('button', { name: 'Save encounter' }))

  await expectNotice(SAVED)

  expect(server.createJourneyFn).toHaveBeenCalledWith({
    data: { journey: expect.objectContaining({ soulName: 'Dana' }), requestText: '' },
  })
})

test('should invite a member with no records to record a first person on the overview', async () => {
  const router = start({ path: '/' })

  records.mine = []
  records.prayers = []

  fireEvent.click(
    await within(
      (await screen.findByRole('heading', { name: 'Record your first person.' })).closest(
        'section',
      )!,
    ).findByRole('button', { name: 'Record a person' }),
  )

  await waitFor(() => expect(router.state.location.pathname).toBe('/record'))
  expect(screen.queryByRole('heading', { name: 'My people' })).toBeNull()
})

test('should open the row of a person on My journey from the overview', async () => {
  const router = start({ path: '/' })

  fireEvent.click(await screen.findByRole('link', { name: /Dee/ }))

  await waitFor(() => expect(router.state.location.pathname).toBe('/journey'))

  const heading = await screen.findByRole('heading', { name: 'Dee', level: 3 })

  expect(within(heading).getByRole('button').getAttribute('aria-expanded')).toBe('true')
})

test('should show the ministry totals before the records of the member on the overview', async () => {
  start({ path: '/' })

  const totals = await screen.findByRole('heading', { name: 'Ministry totals', level: 2 })
  const people = screen.getByRole('heading', { name: 'My people', level: 2 })

  expect(totals.compareDocumentPosition(people) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(
    within(screen.getByRole('group', { name: 'Live ministry totals' })).getByText(
      `${fixture.mine.length} of them are people you recorded.`,
    ),
  ).toBeTruthy()
})

test('should list the people before the totals on the journey page', async () => {
  start({ path: '/journey' })

  const people = await screen.findByRole('heading', { name: 'People I recorded', level: 2 })
  const totals = screen.getByRole('heading', { name: 'My outreach totals', level: 2 })

  expect(people.compareDocumentPosition(totals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('should open the journey page from the old prayer list address', async () => {
  const router = start({ path: '/prayers' })

  expect(await screen.findByRole('heading', { name: 'My journey', level: 1 })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/journey')
  expect(screen.queryByRole('link', { name: 'Prayer list' })).toBeNull()
})

test('should change the response to the gospel from the editor', async () => {
  server.editJourneyFn.mockImplementation(() => succeed())
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Edit record' }))
  fill(card.getByLabelText('Response to the gospel'), 'declined')
  fireEvent.click(card.getByRole('button', { name: 'Save changes' }))

  await expectNotice('Encounter updated.')

  expect(server.editJourneyFn).toHaveBeenCalledWith({
    data: { id: 7, journey: expect.objectContaining({ salvationStatus: 'declined' }) },
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
  fireEvent.click(card.getByRole('button', { name: 'Add a prayer request' }))

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
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))

  await expectNotice('Prayer request updated.')

  expect(server.setPrayerStatusFn).toHaveBeenCalledWith({ data: { id: 12, status: 'answered' } })
  expect(card.getByText('0 active')).toBeTruthy()
  expect(card.getByText('3 answered requests')).toBeTruthy()
})

test('should reopen an answered prayer request', async () => {
  server.setPrayerStatusFn.mockImplementation(() => succeed())
  start({ path: '/journey' })

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
  start({ path: '/journey' })

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
  start({ path: '/journey' })

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
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getAllByRole('button', { name: 'Remove' })[0])

  await expectNotice('Prayer request removed.')

  expect(confirm).toHaveBeenCalledWith('Remove this prayer request? This cannot be undone.')
  expect(server.deletePrayerFn).toHaveBeenCalledWith({ data: { id: 12 } })
  expect(screen.queryByText('Strength for his new walk <3')).toBeNull()
})

test('should keep a prayer request when removing it is not confirmed', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  start({ path: '/journey' })

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
        notes: 'Knee pain left & he walked.',
      },
    },
  })
  expect(card.queryByRole('button', { name: 'Save changes' })).toBeNull()
  expect(card.getByRole('button', { name: 'Edit record' })).toBeTruthy()
  expect(card.getByText(/Dallas, TX/)).toBeTruthy()
})

test('should show the server error in the notice', async () => {
  server.setPrayerStatusFn.mockResolvedValue({
    ok: false,
    status: 404,
    error: 'Record not found.',
  })
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))

  await expectNotice('Record not found.')
})

test('should show the server error in Korean when the language is Korean', async () => {
  server.setPrayerStatusFn.mockResolvedValue({
    ok: false,
    status: 404,
    error: 'Record not found.',
  })
  start({ path: '/journey', language: 'ko' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: '응답받음으로 표시' }))

  await expectNotice('기록을 찾을 수 없습니다.')
})

test('should say so when a successful action leaves the records unreloadable', async () => {
  server.setPrayerStatusFn.mockImplementation(() => {
    server.getSnapshot.mockResolvedValue({
      ok: false,
      status: 503,
      error: 'Records are temporarily unavailable. Please try again.',
    })

    return succeed()
  })
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))

  await expectNotice('Saved, but the latest records could not be loaded. Please try again.')
})

test('should ignore a second action while one is still running', async () => {
  let finish = () => {}

  server.setPrayerStatusFn.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = () => resolve({ ok: true, body: {} })
      }),
  )
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))
  await waitFor(() => expect(server.setPrayerStatusFn).toHaveBeenCalledTimes(1))
  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))
  finish()

  await expectNotice('Prayer request updated.')

  expect(server.setPrayerStatusFn).toHaveBeenCalledTimes(1)
  expect(server.setPrayerStatusFn).toHaveBeenCalledWith({ data: { id: 12, status: 'answered' } })
})

test('should clear the notice when the member changes tab', async () => {
  server.setPrayerStatusFn.mockImplementation(() => succeed())
  start({ path: '/journey' })

  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))
  await expectNotice('Prayer request updated.')
  fireEvent.click(screen.getByRole('link', { name: 'Record' }))

  await screen.findByRole('heading', { name: 'Share an encounter.', level: 1 })

  expect(document.querySelector('.notice')).toBeNull()
})

test('should drop the notice when a later read of the records succeeds', async () => {
  server.setPrayerStatusFn.mockImplementation(() => succeed())

  const router = start({ path: '/journey' })
  const card = await cardOf('Marcus <T>')

  fireEvent.click(card.getByRole('button', { name: 'Mark answered' }))
  await expectNotice('Prayer request updated.')
  await new Promise((resolve) => setTimeout(resolve, 5))
  await router.options.context.queryClient.refetchQueries({ queryKey: ['snapshot'] })

  await waitFor(() => expect(document.querySelector('.notice')).toBeNull())
})

test('should show a failed read of the records as the notice and keep the loaded records', async () => {
  const router = start({ path: '/journey' })

  await cardOf('Marcus <T>')
  server.getSnapshot.mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status: 503,
      error: 'Records are temporarily unavailable. Please try again.',
    }),
  )
  await router.options.context.queryClient.refetchQueries({ queryKey: ['snapshot'] })

  await expectNotice('Records are temporarily unavailable. Please try again.')

  expect(screen.getAllByRole('heading', { name: 'Marcus <T>', level: 3 })).toHaveLength(1)
})

test('should toggle the language, the heading, the document, and the cookie', async () => {
  start({ path: '/', session: 'anon' })

  await screen.findByRole('heading', {
    name: 'Record each person you reach. Keep praying for them.',
  })
  fireEvent.click(screen.getByRole('button', { name: '한국어로 보기' }))

  expect(await screen.findByRole('heading', { name: '만난 한 사람 한 사람을 기록하고, 계속 기도하세요.' })).toBeTruthy()
  expect(document.cookie).toContain('soul-winning-language=ko')
  expect(document.documentElement.lang).toBe('ko')
  expect(document.title).toBe('NCTC 영혼구원 여정')

  fireEvent.click(screen.getByRole('button', { name: '영어로 보기' }))

  expect(
    await screen.findByRole('heading', { name: 'Record each person you reach. Keep praying for them.' }),
  ).toBeTruthy()
  expect(document.cookie).toContain('soul-winning-language=en')
  expect(document.documentElement.lang).toBe('en')
  expect(document.title).toBe('Soul Winning Journey | NCTC')
})

test('should carry a Korean choice stored in localStorage over to the cookie', async () => {
  localStorage.setItem('soul-winning-language', 'ko')
  start({ path: '/', session: 'anon' })

  expect(await screen.findByRole('heading', { name: '만난 한 사람 한 사람을 기록하고, 계속 기도하세요.' })).toBeTruthy()
  expect(document.cookie).toContain('soul-winning-language=ko')
})

test('should send a signed-out visitor from a member page to the public page', async () => {
  const router = start({ path: '/journey', session: 'anon' })

  await screen.findByRole('heading', {
    name: 'Record each person you reach. Keep praying for them.',
  })

  expect(router.state.location.pathname).toBe('/')
  expect(server.getSnapshot).not.toHaveBeenCalled()
})

test('should send a member who is not a leader from the team page to the overview', async () => {
  const router = start({ path: '/team', session: 'member' })

  expect(await screen.findByRole('heading', { name: 'Every person matters.' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/')
  expect(screen.queryByRole('link', { name: 'Team records' })).toBeNull()
})

test('should open the team page for a leader', async () => {
  const router = start({ path: '/team', session: 'leader' })

  expect(await screen.findByRole('heading', { name: 'Team records', level: 1 })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/team')
  expect(await screen.findByRole('button', { name: 'Tori' })).toBeTruthy()
  expect(screen.getByText('5 records · 2 team members · 2 open prayer requests')).toBeTruthy()
})

test('should filter the team records by team member and clear the filter', async () => {
  start({ path: '/team', session: 'leader' })

  fireEvent.click(await screen.findByRole('button', { name: /^Sam Park/ }))

  expect(screen.getByText('1 record · 1 team member · 1 open prayer request')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Dee' })).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

  expect(screen.getByRole('button', { name: 'Dee' })).toBeTruthy()
})

test('should say so when no team record matches the search', async () => {
  start({ path: '/team', session: 'leader' })

  fill(await screen.findByLabelText('Search records'), 'nobody')

  expect(screen.getByRole('heading', { name: 'No records match.' })).toBeTruthy()
})

test('should open a team record in the panel and close it with Escape', async () => {
  start({ path: '/team', session: 'leader' })

  fireEvent.click(await screen.findByRole('button', { name: 'Tori' }))

  const panel = within(screen.getByRole('complementary', { name: 'Tori' }))

  expect(panel.getByText('sam@example.com')).toBeTruthy()
  expect(panel.getByText('Courage')).toBeTruthy()
  expect(panel.queryByRole('button', { name: 'Edit in My journey' })).toBeNull()
  expect(panel.getByText('Only Sam Park can edit this record.')).toBeTruthy()

  fireEvent.keyDown(window, { key: 'Escape' })

  expect(screen.queryByRole('complementary', { name: 'Tori' })).toBeNull()
})

test('should offer My journey from the panel of a record of the viewer', async () => {
  const router = start({ path: '/team', session: 'leader' })

  fireEvent.click(await screen.findByRole('button', { name: 'Dee' }))
  fireEvent.click(screen.getByRole('button', { name: 'Edit in My journey' }))

  await waitFor(() => expect(router.state.location.pathname).toBe('/journey'))
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

test('should open the records with no Identity account when the dev server signs a member in', async () => {
  start({ path: '/journey', session: 'anon' })
  server.getSessionHint.mockResolvedValue({ hasToken: false, devMember: true, language: 'en' })

  expect(await screen.findByRole('heading', { name: 'My journey', level: 1 })).toBeTruthy()
  expect(identity.getUser).not.toHaveBeenCalled()
})
