import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { SiteShell } from '../components/site-shell'
import { LanguageProvider } from '../i18n/language'
import { DOCUMENT_TITLES } from '../i18n/translate'
import { NoticeProvider } from '../notice/notice'
import { SessionProvider } from '../session/session'
import { getSessionHint } from '../server/functions'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: () => getSessionHint(),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  staleTime: Infinity,
  head: ({ loaderData }) => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      },
      {
        name: 'theme-color',
        content: '#F7F4EE',
      },
      {
        title: DOCUMENT_TITLES[loaderData?.language ?? 'en'],
      },
      {
        name: 'description',
        content:
          "See NCTC's live soul-winning impact, record your outreach journey, and keep a private prayer list.",
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://nctcsoulwinning.org/',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/logo-monogram-ink.svg',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  const hint = Route.useLoaderData()

  return (
    <NoticeProvider>
      <LanguageProvider initialLanguage={hint.language}>
        <SessionProvider hint={hint}>
          <SiteShell>
            <Outlet />
          </SiteShell>
        </SessionProvider>
      </LanguageProvider>
    </NoticeProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const hint = Route.useLoaderData()

  return (
    <html lang={hint.language}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
