// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { Stat } from '#/ui/stat'

let frames: FrameRequestCallback[] = []

function allowMotion(reduced: boolean) {
  frames = []
  vi.stubGlobal('matchMedia', () => ({ matches: reduced }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', () => {})
}

function paintAt(time: number) {
  const due = frames

  frames = []
  act(() => due.forEach((callback) => callback(time)))
}

function figure() {
  return document.querySelector('.ui-stat-figure')!.textContent
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('should show the count on the first render and run from the old count to a new one', () => {
  allowMotion(false)

  const { rerender } = render(<Stat label="Reached" value={100} />)

  expect(figure()).toBe('100')

  rerender(<Stat label="Reached" value={200} />)

  expect(figure()).toBe('100')

  paintAt(1000)
  paintAt(1450)

  expect(figure()).toBe('194')

  paintAt(1900)

  expect(figure()).toBe('200')
  expect(frames).toHaveLength(0)
})

test('must show a new count at once when the member asks for reduced motion', () => {
  allowMotion(true)

  const { rerender } = render(<Stat label="Reached" value={100} />)

  rerender(<Stat label="Reached" value={200} />)

  expect(figure()).toBe('200')
  expect(frames).toHaveLength(0)
})

test('should show a dash until the count is known, then the count with no run from zero', () => {
  allowMotion(false)

  const { rerender } = render(<Stat label="Reached" value={undefined} />)

  expect(figure()).toBe('—')

  rerender(<Stat label="Reached" value={128} />)

  expect(figure()).toBe('128')
  expect(frames).toHaveLength(0)
})

test('should show the fire only for a fire total with a count above zero', () => {
  allowMotion(false)

  const { rerender } = render(<Stat variant="fire" label="Reached" value={0} />)

  expect(document.querySelector('.ui-coals')).toBeNull()
  expect(document.querySelector('.ui-stat-hero')).not.toBeNull()

  rerender(<Stat variant="fire" label="Reached" value={3} />)

  expect(document.querySelector('.ui-stat-fire > canvas.ui-coals')).not.toBeNull()

  rerender(<Stat variant="hero" label="Reached" value={3} />)

  expect(document.querySelector('.ui-coals')).toBeNull()
})

test('should flare the figure when the count of a fire total goes up, and not when it goes down', () => {
  allowMotion(false)

  const animate = vi.fn()

  HTMLElement.prototype.animate = animate

  const { rerender } = render(<Stat variant="fire" label="Reached" value={3} />)

  expect(animate).not.toHaveBeenCalled()

  rerender(<Stat variant="fire" label="Reached" value={4} />)

  expect(animate).toHaveBeenCalledTimes(1)

  rerender(<Stat variant="fire" label="Reached" value={2} />)

  expect(animate).toHaveBeenCalledTimes(1)

  Reflect.deleteProperty(HTMLElement.prototype, 'animate')
})
