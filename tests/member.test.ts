import { expect, test } from 'vitest'
import { fetchIdentityUser } from '#/server/member'

const IDENTITY_URL = 'https://example.org/.netlify/identity'

const answering = (status: number, body: unknown) => async () => Response.json(body, { status })

test('fetchIdentityUser should send the token to the user endpoint of Netlify Identity', async () => {
  const requests: Array<{ url: string; authorization: string }> = []

  await fetchIdentityUser('token-123', IDENTITY_URL, async (url, init) => {
    requests.push({ url, authorization: init.headers.Authorization })

    return Response.json({ id: 'user-1' })
  })

  expect(requests).toEqual([{ url: 'https://example.org/.netlify/identity/user', authorization: 'Bearer token-123' }])
})

test('fetchIdentityUser should read the id, email, provider, and full name of the account', async () => {
  const user = await fetchIdentityUser(
    'token-123',
    IDENTITY_URL,
    answering(200, {
      id: 'user-1',
      email: 'Grace@Example.com',
      app_metadata: { provider: 'google' },
      user_metadata: { full_name: 'Grace Lee' },
    }),
  )

  expect(user).toEqual({ id: 'user-1', email: 'Grace@Example.com', name: 'Grace Lee', provider: 'google' })
})

test('fetchIdentityUser should treat a token that Netlify Identity rejects as signed out', async () => {
  expect(await fetchIdentityUser('expired', IDENTITY_URL, answering(401, { code: 401 }))).toBeNull()
  expect(await fetchIdentityUser('valid', IDENTITY_URL, answering(200, { id: 'user-1' }))).toEqual({ id: 'user-1' })
})

test('fetchIdentityUser should not call Netlify Identity when the cookie is missing', async () => {
  let calls = 0

  const user = await fetchIdentityUser(undefined, IDENTITY_URL, async () => {
    calls += 1

    return Response.json({ id: 'user-1' })
  })

  expect({ user, calls }).toEqual({ user: null, calls: 0 })
})

test('fetchIdentityUser should throw when Netlify Identity cannot answer', async () => {
  await expect(fetchIdentityUser('token-123', IDENTITY_URL, answering(502, {}))).rejects.toThrow(
    'Netlify Identity answered 502',
  )
})
