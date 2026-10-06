import { classNames } from './class-names'
import type { ReactNode } from 'react'

interface BadgeProps {
  tone?: 'quiet' | 'accent'
  children: ReactNode
}

function Badge({ tone = 'quiet', children }: BadgeProps) {
  return (
    <span className={classNames('ui-badge', tone === 'accent' && 'ui-badge-accent')}>
      {children}
    </span>
  )
}

export { Badge }
