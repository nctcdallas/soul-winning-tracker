import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface NoticeContextValue {
  notice: string
  /** When the notice was set, in epoch milliseconds, so a later poll result can replace it. */
  noticeAt: number
  setNotice: (notice: string) => void
}

const NoticeContext = createContext<NoticeContextValue | null>(null)

/** Holds the one message the page shows above its content. */
function NoticeProvider({ children }: { children: ReactNode }) {
  const [{ notice, noticeAt }, setState] = useState({ notice: '', noticeAt: 0 })
  const setNotice = useCallback((next: string) => setState({ notice: next, noticeAt: Date.now() }), [])
  const value = useMemo(() => ({ notice, noticeAt, setNotice }), [notice, noticeAt, setNotice])

  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>
}

/** Reads and sets the page notice. */
function useNotice() {
  const value = useContext(NoticeContext)

  if (!value) {
    throw new Error('useNotice must be used inside NoticeProvider')
  }

  return value
}

export { NoticeProvider, useNotice }
