import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getUser, handleAuthCallback, logout } from '@netlify/identity'
import { useNotice } from '#/notice/notice'
import { SNAPSHOT_KEY } from '#/queries/options'
import type { User } from '@netlify/identity'
import type { ReactNode } from 'react'

type SessionState =
  | { kind: 'loading' }
  | { kind: 'anon' }
  | { kind: 'wrong-provider' }
  | { kind: 'member'; user: User }

interface SessionContextValue {
  session: SessionState
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

function initialSession(hasToken: boolean): SessionState {
  return hasToken ? { kind: 'loading' } : { kind: 'anon' }
}

function sessionOf(user: User | null): SessionState {
  if (!user) {
    return { kind: 'anon' }
  }

  return user.provider === 'google' ? { kind: 'member', user } : { kind: 'wrong-provider' }
}

/** Resolves who is signed in once the browser can run the Identity SDK. */
function SessionProvider({ initial, children }: { initial: SessionState; children: ReactNode }) {
  const queryClient = useQueryClient()
  const { setNotice } = useNotice()
  const [session, setSession] = useState(initial)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      try {
        await handleAuthCallback()
      } catch (error) {
        setNotice(error instanceof Error && error.message ? error.message : 'Could not complete sign-in.')
      }

      const user = await getUser().catch(() => null)

      if (!cancelled) {
        setSession(sessionOf(user))
      }
    }

    void resolve()

    return () => {
      cancelled = true
    }
  }, [setNotice])

  const signOut = useCallback(async () => {
    await logout()
    queryClient.removeQueries({ queryKey: SNAPSHOT_KEY })
    setSession({ kind: 'anon' })
  }, [queryClient])
  const value = useMemo(() => ({ session, signOut }), [session, signOut])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

/** Reads the session state and the sign-out action. */
function useSession() {
  const value = useContext(SessionContext)

  if (!value) {
    throw new Error('useSession must be used inside SessionProvider')
  }

  return value
}

export { SessionProvider, initialSession, useSession }
export type { SessionState }
