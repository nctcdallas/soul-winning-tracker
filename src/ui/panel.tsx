import { createElement } from 'react'
import { classNames } from './class-names'
import type { FormHTMLAttributes, HTMLAttributes } from 'react'

type PanelProps = { tone?: 'bone' | 'boneAlt' } & (
  | ({ as?: 'div' | 'section' | 'article' } & HTMLAttributes<HTMLElement>)
  | ({ as: 'form' } & FormHTMLAttributes<HTMLFormElement>)
)

function Panel({ as = 'div', tone = 'bone', className, ...rest }: PanelProps) {
  return createElement(as, {
    ...rest,
    className: classNames('ui-panel', tone === 'boneAlt' && 'ui-panel-alt', className),
  })
}

export { Panel }
