// Renders the pre-React client from git history in jsdom and records a summary of every UI state.
// Run with `node tests/ui/capture-legacy-ui.ts`. It rewrites golden-ui.json.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'
import fixture from './fixture.json' with { type: 'json' }
import { RECORDS_ERROR, snapshotFor, states } from './states.ts'
import { summarize } from './summarize.ts'
import type { State } from './states.ts'
import type { Summary } from './summarize.ts'

process.env.TZ = 'UTC'

const LEGACY_COMMIT = 'bd8b4f9'
const BROWSER_GLOBALS = ['window', 'document', 'localStorage', 'HTMLInputElement', 'HTMLTextAreaElement', 'NodeFilter', 'FormData']

const legacySource = (path: string) => execFileSync('git', ['show', `${LEGACY_COMMIT}:${path}`], { encoding: 'utf8' })
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

const directory = mkdtempSync(join(tmpdir(), 'legacy-ui-'))

writeFileSync(join(directory, 'package.json'), '{"type":"module"}')
writeFileSync(join(directory, 'i18n.js'), legacySource('src/i18n.js'))
writeFileSync(
  join(directory, 'identity.js'),
  [
    'export const getUser = async () => globalThis.legacyUser;',
    'export const handleAuthCallback = async () => {};',
    'export const oauthLogin = () => {};',
    'export const logout = async () => {};',
  ].join('\n'),
)
writeFileSync(
  join(directory, 'main.js'),
  legacySource('src/main.js').replace('"@netlify/identity"', '"./identity.js"').replace('import "./styles.css";', ''),
)

function userFor(session: State['session']) {
  if (session === 'anon') {
    return null
  }

  return {
    id: 'user-grace',
    email: fixture.viewer.email,
    name: fixture.viewer.displayName,
    provider: session === 'email' ? 'email' : 'google',
  }
}

function respondTo(state: State, url: string) {
  if (url === '/api/totals') {
    return Response.json({ totals: fixture.totals })
  }

  if (state.records === 'pending') {
    return new Promise<Response>(() => {})
  }

  if (state.records === 'error') {
    return Response.json({ error: RECORDS_ERROR }, { status: 503 })
  }

  return Response.json(snapshotFor(state.session, state.records))
}

async function capture(state: State, index: number): Promise<Summary> {
  const { window } = new JSDOM('<!doctype html><html lang="en"><body><div id="app"></div></body></html>', {
    url: 'https://nctcsoulwinning.org/',
  })

  if (state.language === 'ko') {
    window.localStorage.setItem('soul-winning-language', 'ko')
  }

  for (const name of BROWSER_GLOBALS) {
    Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true })
  }

  Object.assign(globalThis, { legacyUser: userFor(state.session), fetch: async (url: string) => respondTo(state, url) })

  await import(`${pathToFileURL(join(directory, 'main.js')).href}?state=${index}`)
  await settle()

  const clicks = [
    state.tab ? `button[data-tab="${state.tab}"]` : null,
    state.open === 'journey-editor' ? 'button[data-edit-journey]' : null,
    state.open === 'prayer-editor' ? 'button[data-edit-prayer]' : null,
  ]

  for (const selector of clicks) {
    if (selector) {
      window.document.querySelector<HTMLButtonElement>(selector)!.click()
      await settle()
    }
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const summary = summarize(window.document.querySelector('.site-shell')!, today)

  window.close()

  return summary
}

const golden: Record<string, Summary> = {}

for (const [index, state] of states.entries()) {
  golden[state.name] = await capture(state, index)
}

writeFileSync(new URL('./golden-ui.json', import.meta.url), `${JSON.stringify(golden, null, 1)}\n`)
console.log(`Captured ${states.length} UI states from commit ${LEGACY_COMMIT}.`)
process.exit(0)
