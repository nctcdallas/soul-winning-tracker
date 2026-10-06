import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useNotice } from '#/notice/notice'
import type { TabPath } from './nav-tabs'

/** Returns a function that switches tab and drops the notice left by the previous one. */
function useOpenTab() {
  const navigate = useNavigate()
  const { clearNotice } = useNotice()

  return useCallback(
    (path: TabPath) => {
      clearNotice()
      void navigate({ to: path })
    },
    [navigate, clearNotice],
  )
}

export { useOpenTab }
