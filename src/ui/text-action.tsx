import { classNames } from './class-names'
import type { ButtonHTMLAttributes } from 'react'

type TextActionTone = 'default' | 'accent' | 'danger'

interface TextActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: TextActionTone
}

function TextAction({ tone = 'default', className, ...rest }: TextActionProps) {
  return (
    <button
      type="button"
      {...rest}
      className={classNames(
        'ui-text-action',
        tone !== 'default' && `ui-text-action-${tone}`,
        className,
      )}
    />
  )
}

export { TextAction }
