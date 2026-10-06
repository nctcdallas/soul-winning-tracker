import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useNotice } from '#/notice/notice'
import type { TabPath } from './nav-tabs'

/** Returns a function that switches tab and drops the notice left by the previous one. */
function useOpenTab() {
  const navigate = useNavigate()
  const { setNotice } = useNotice()

  return useCallback(
    (path: TabPath) => {
      setNotice('')
      void navigate({ to: path })
    },
    [navigate, setNotice],
  )
}

export { useOpenTab }
