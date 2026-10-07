// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { NoticeProvider, SUCCESS_DURATION, useNotice } from '#/notice/notice'
import type { NoticeTone } from '#/notice/notice'

function Harness({ tone }: { tone: NoticeTone }) {
  const { notice, showNotice } = useNotice()

  return (
    <>
      <button type="button" onClick={() => showNotice('Saved.', tone)}>
        Show
      </button>
      <p>{notice ? notice.text : 'No notice'}</p>
    </>
  )
}

function show(tone: NoticeTone) {
  render(
    <NoticeProvider>
      <Harness tone={tone} />
    </NoticeProvider>,
  )
  act(() => screen.getByRole('button', { name: 'Show' }).click())
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('should close a success notice after its duration', () => {
  show('success')

  act(() => void vi.advanceTimersByTime(SUCCESS_DURATION - 1))
  expect(screen.getByText('Saved.')).toBeTruthy()

  act(() => void vi.advanceTimersByTime(1))
  expect(screen.getByText('No notice')).toBeTruthy()
})

test('should keep an error notice until the member acts', () => {
  show('error')

  act(() => void vi.advanceTimersByTime(SUCCESS_DURATION * 10))

  expect(screen.getByText('Saved.')).toBeTruthy()
})
