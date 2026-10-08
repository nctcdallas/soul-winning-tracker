import { useLayoutEffect, useRef, useState } from 'react'
import { classNames } from './class-names'
import { Coals, useCountRise } from './coals'

const TWEEN_MS = 900
const FLARE_MS = 2200

interface TweenFrame {
  target: number
  shown: number
}

interface StatProps {
  label: string
  /** The count, or `undefined` while it is not known. */
  value: number | undefined
  note?: string
  /** `fire` is the hero tile with live coals. It burns only for a count above zero. */
  variant?: 'default' | 'hero' | 'fire'
  format?: (value: number) => string
}

function motionAllowed() {
  return (
    typeof window.requestAnimationFrame === 'function' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Returns the count to show: the target on the first render, then a 900ms ease-out-quart run from the shown count to each new target.
 */
function useTweenedCount(target: number | undefined) {
  const shown = useRef(target)
  const [frame, setFrame] = useState<TweenFrame | null>(null)

  useLayoutEffect(() => {
    const from = shown.current

    if (target === undefined || from === undefined || from === target || !motionAllowed()) {
      shown.current = target
      setFrame(null)

      return
    }

    let request = 0
    let startedAt: number | undefined

    const show = (count: number) => {
      shown.current = count
      setFrame({ target, shown: count })
    }

    const step = (now: number) => {
      startedAt ??= now

      const progress = Math.min(1, (now - startedAt) / TWEEN_MS)

      show(Math.round(from + (target - from) * (1 - (1 - progress) ** 4)))

      if (progress < 1) {
        request = requestAnimationFrame(step)
      }
    }

    show(from)
    request = requestAnimationFrame(step)

    return () => cancelAnimationFrame(request)
  }, [target])

  return frame && frame.target === target ? frame.shown : target
}

function Stat({ label, value, note, variant = 'default', format = String }: StatProps) {
  const count = useTweenedCount(value)
  const figure = useRef<HTMLSpanElement>(null)
  const burning = variant === 'fire' && value !== undefined && value > 0

  useCountRise(burning ? value : undefined, () => {
    if (motionAllowed() && typeof figure.current?.animate === 'function') {
      figure.current.animate([{ color: 'var(--ember-100)', offset: 0.08 }], {
        duration: FLARE_MS,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      })
    }
  })

  return (
    <div
      className={classNames(
        'ui-stat',
        variant !== 'default' && 'ui-stat-hero',
        burning && 'ui-stat-fire',
        count === undefined && 'ui-stat-pending',
        count === 0 && 'ui-stat-zero',
      )}
    >
      {burning && <Coals count={value} />}
      <span className="ui-stat-label">{label}</span>
      <span ref={figure} className="ui-stat-figure">{count === undefined ? '—' : format(count)}</span>
      {note && <span className="ui-stat-note">{note}</span>}
    </div>
  )
}

export { Stat }
