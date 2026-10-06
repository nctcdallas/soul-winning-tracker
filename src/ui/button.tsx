import { classNames } from './class-names'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type ButtonTone = 'primary' | 'accent' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonLook {
  tone?: ButtonTone
  size?: ButtonSize
  /** Draws a trailing arrow in CSS, so the arrow is not part of the label text. */
  arrow?: boolean
  /** Fills the width of its container on a phone. */
  stretch?: boolean
}

type ButtonProps = ButtonLook &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  )

function Button({
  tone = 'primary',
  size = 'md',
  arrow = false,
  stretch = false,
  className,
  ...rest
}: ButtonProps) {
  const classes = classNames(
    'ui-button',
    tone !== 'primary' && `ui-button-${tone}`,
    size !== 'md' && `ui-button-${size}`,
    arrow && 'ui-button-arrow',
    stretch && 'ui-button-stretch',
    className,
  )

  if (rest.href !== undefined) {
    return <a {...rest} className={classes} />
  }

  return <button type="button" {...rest} className={classes} />
}

export { Button }
