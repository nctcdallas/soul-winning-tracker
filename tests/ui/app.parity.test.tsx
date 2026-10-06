// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { translate } from '#/i18n/translate'
import fixture from './fixture.json' with { type: 'json' }
import goldenFile from './golden-ui.json' with { type: 'json' }
import { identity, server } from './mocks'
import { renderApp, siteShell } from './render-app'
import { RECORDS_ERROR, TAB_PATHS, snapshotFor, states } from './states'
import { summarize } from './summarize'
import type { State } from './states'
import type { Summary } from './summarize'

vi.mock('#/server/functions', async () => (await import('./mocks')).server)
vi.mock('@netlify/identity', async () => (await import('./mocks')).identity)
vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))

const golden: Record<string, Summary> = goldenFile

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

test.each(states)('should render $name like the legacy client', async (state) => {
  mockEnvironment(state)
  renderApp(TAB_PATHS[state.tab ?? 'overview'])

  if (state.open) {
    const label = translate(state.open === 'journey-editor' ? 'Edit record' : 'Edit', state.language)
    const buttons = await within(document.body).findAllByRole('button', { name: label })

    fireEvent.click(buttons[0])
  }

  await waitFor(() => expect(summarize(siteShell()!, todayLocal())).toEqual(golden[state.name]))
})
