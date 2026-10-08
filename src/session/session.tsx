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
  | { kind: 'member' }

interface SessionContextValue {
  session: SessionState
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

interface SessionHint {
  hasToken: boolean
  /** True when the local dev server signs a member in from `DEV_MEMBER_EMAIL`. */
  devMember: boolean
}

function initialSession({ hasToken, devMember }: SessionHint): SessionState {
  if (devMember) {
    return { kind: 'member' }
  }

  return hasToken ? { kind: 'loading' } : { kind: 'anon' }
}

function sessionOf(user: User | null): SessionState {
  if (!user) {
    return { kind: 'anon' }
  }

  return user.provider === 'google' ? { kind: 'member' } : { kind: 'wrong-provider' }
}

interface SessionProviderProps {
  hint: SessionHint
  children: ReactNode
}

function SessionProvider({ hint, children }: SessionProviderProps) {
  const queryClient = useQueryClient()
  const { showNotice } = useNotice()
  const [session, setSession] = useState(() => initialSession(hint))

  useEffect(() => {
    if (hint.devMember) {
      return
    }

    let cancelled = false

    async function resolve() {
      try {
        await handleAuthCallback()
      } catch (error) {
        showNotice(
          error instanceof Error && error.message ? error.message : 'Could not complete sign-in.',
          'error',
        )
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
  }, [hint.devMember, showNotice])

  const signOut = useCallback(async () => {
    await logout()
    queryClient.removeQueries({ queryKey: SNAPSHOT_KEY })
    setSession({ kind: 'anon' })
  }, [queryClient])
  const value = useMemo(() => ({ session, signOut }), [session, signOut])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

function useSession() {
  const value = useContext(SessionContext)

  if (!value) {
    throw new Error('useSession must be used inside SessionProvider')
  }

  return value
}

export { SessionProvider, useSession }
export type { SessionState }
