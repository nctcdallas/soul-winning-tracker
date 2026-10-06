import type { Result } from '#/journeys/types'

interface IdentityUser {
  id: string
  email?: string
  name?: string
  provider?: string
}

/** A signed-in Google account with an email address. */
interface Member {
  id: string
  email: string
  ownerEmail: string
  displayName: string
  isAdmin: boolean
}

type FetchIdentity = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>

const IDENTITY_TIMEOUT = 5000

const normalizeEmail = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

function parseAdminEmails(value: string | undefined) {
  return new Set((value ?? '').split(',').map(normalizeEmail).filter(Boolean))
}

function resolveMember(user: IdentityUser | null, adminEmails: Set<string>): Result<Member> {
  if (!user) {
    return { ok: false, status: 401, error: 'Please sign in with Google to continue.' }
  }

  // Netlify Identity still accepts password sign-up at its own endpoint, whatever the UI offers.
  if (user.provider !== 'google') {
    return { ok: false, status: 403, error: 'Please use Continue with Google.' }
  }

  if (!user.email) {
    return { ok: false, status: 403, error: 'A verified email address is required.' }
  }

  const ownerEmail = normalizeEmail(user.email)

  return {
    ok: true,
    body: {
      id: user.id,
      email: user.email,
      ownerEmail,
      displayName: user.name || user.email,
      isAdmin: adminEmails.has(ownerEmail),
    },
  }
}

function parseIdentityUser(raw: unknown): IdentityUser | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const {
    id,
    email,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  } = raw as Record<string, unknown>

  if (typeof id !== 'string' || !id) {
    return null
  }

  const provider = (appMetadata as Record<string, unknown> | null | undefined)?.provider
  const names = (userMetadata ?? {}) as Record<string, unknown>
  const name = names.full_name ?? names.name

  return {
    id,
    email: typeof email === 'string' ? email : undefined,
    name: typeof name === 'string' ? name : undefined,
    provider: typeof provider === 'string' ? provider : undefined,
  }
}

/**
 * Returns the account that a local dev server signs in with no Google redirect, from `DEV_MEMBER_EMAIL`.
 * Netlify Identity sends the browser to the live site after Google sign-in, so a local sign-in cannot complete.
 */
function devIdentityUser(email: string | undefined, isDevServer: boolean): IdentityUser | null {
  const address = normalizeEmail(email)

  if (!isDevServer || !address) {
    return null
  }

  return { id: `dev:${address}`, email: address, name: address, provider: 'google' }
}

/**
 * Asks Netlify Identity who owns the token, so the service checks the signature and the expiry.
 * Returns null for a missing or rejected token, and throws when the service cannot answer.
 */
async function fetchIdentityUser(
  token: string | undefined,
  identityUrl: string,
  fetchIdentity: FetchIdentity = fetch,
): Promise<IdentityUser | null> {
  if (!token) {
    return null
  }

  const response = await fetchIdentity(`${identityUrl}/user`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(IDENTITY_TIMEOUT),
  })

  if (response.status === 401 || response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Netlify Identity answered ${response.status}`)
  }

  return parseIdentityUser(await response.json())
}

export { devIdentityUser, fetchIdentityUser, parseAdminEmails, resolveMember }
export type { IdentityUser, Member }
