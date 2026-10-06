import { classNames } from './class-names'
import type { ReactNode } from 'react'

interface EyebrowProps {
  as?: 'p' | 'h1'
  rule?: boolean
  children: ReactNode
}

function Eyebrow({ as: Tag = 'p', rule = true, children }: EyebrowProps) {
  return <Tag className={classNames('ui-eyebrow', rule && 'ui-eyebrow-rule')}>{children}</Tag>
}

export { Eyebrow }
