import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type NoticeTone = 'success' | 'error'

interface Notice {
  text: string
  tone: NoticeTone
  /** When the notice was set, in epoch milliseconds, so a later read of the records can replace it. */
  at: number
}

interface NoticeContextValue {
  notice: Notice | null
  showNotice: (text: string, tone: NoticeTone) => void
  clearNotice: () => void
}

const NoticeContext = createContext<NoticeContextValue | null>(null)
const SUCCESS_DURATION = 6000

function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const showNotice = useCallback(
    (text: string, tone: NoticeTone) => setNotice({ text, tone, at: Date.now() }),
    [],
  )
  const clearNotice = useCallback(() => setNotice(null), [])

  // An error stays until the member acts, because the member must read it.
  useEffect(() => {
    if (notice?.tone !== 'success') {
      return
    }

    const timer = setTimeout(() => setNotice(null), SUCCESS_DURATION)

    return () => clearTimeout(timer)
  }, [notice])
  const value = useMemo(
    () => ({ notice, showNotice, clearNotice }),
    [notice, showNotice, clearNotice],
  )

  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>
}

function useNotice() {
  const value = useContext(NoticeContext)

  if (!value) {
    throw new Error('useNotice must be used inside NoticeProvider')
  }

  return value
}

export { NoticeProvider, SUCCESS_DURATION, useNotice }
export type { NoticeTone }
