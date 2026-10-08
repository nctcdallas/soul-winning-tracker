import { useEffect, useRef } from 'react'
import { TextAction } from './text-action'
import type { ReactNode } from 'react'

interface SidePanelLabels {
  close: string
  previous: string
  next: string
}

interface SidePanelProps {
  title: string
  meta: string
  position: string
  labels: SidePanelLabels
  /** Changes when the panel shows a different item, so the focus moves to the panel again. */
  focusKey: number
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  children: ReactNode
}

function SidePanel({
  title,
  meta,
  position,
  labels,
  focusKey,
  onClose,
  onPrevious,
  onNext,
  children,
}: SidePanelProps) {
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    panel.current?.focus({ preventScroll: true })
  }, [focusKey])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <aside ref={panel} className="ui-side-panel" aria-label={title} tabIndex={-1}>
      <div className="ui-side-panel-head">
        <div>
          <h2 className="ui-side-panel-title">{title}</h2>
          <p className="ui-side-panel-meta">{meta}</p>
        </div>
        <TextAction onClick={onClose}>{labels.close}</TextAction>
      </div>
      <div className="ui-side-panel-nav">
        <TextAction className="ui-side-panel-previous" onClick={onPrevious} disabled={!onPrevious}>
          {labels.previous}
        </TextAction>
        <TextAction className="ui-side-panel-next" onClick={onNext} disabled={!onNext}>
          {labels.next}
        </TextAction>
        <span className="ui-side-panel-position">{position}</span>
      </div>
      <div className="ui-side-panel-body">{children}</div>
    </aside>
  )
}

export { SidePanel }
