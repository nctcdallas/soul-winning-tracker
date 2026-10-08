import type { NoticeTone } from '#/notice/notice'
import type { ReactNode } from 'react'

interface NoticeProps {
  tone: NoticeTone
  children: ReactNode
}

function Notice({ tone, children }: NoticeProps) {
  return (
    <p className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}

export { Notice }
