import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { getRouter } from '#/router'

function renderApp(path: string) {
  const router = getRouter()

  // jsdom does not implement scrolling, which scroll restoration calls.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

  router.update({ ...router.options, history: createMemoryHistory({ initialEntries: [path] }) })
  render(<RouterProvider router={router} />, { container: document })

  return router
}

function siteShell() {
  return document.querySelector('.site-shell')
}

export { renderApp, siteShell }
