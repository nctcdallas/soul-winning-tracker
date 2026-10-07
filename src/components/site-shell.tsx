import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useLanguage } from '#/i18n/language'
import { youtubeUrl } from '#/i18n/translate'
import { useNotice } from '#/notice/notice'
import { useSnapshot } from '#/queries/use-snapshot'
import { useSession } from '#/session/session'
import { LanguageToggle } from '#/ui/language-toggle'
import { Logo } from '#/ui/logo'
import { NavItem } from '#/ui/nav-item'
import { Notice } from '#/ui/notice'
import { TextAction } from '#/ui/text-action'
import { NAV_TABS } from './nav-tabs'
import type { NoticeTone } from '#/notice/notice'
import type { ReactNode } from 'react'

interface Message {
  text: string
  tone: NoticeTone
}

function SiteShell({ children }: { children: ReactNode }) {
  const { language, t } = useLanguage()
  const { notice, clearNotice } = useNotice()
  const { session, signOut } = useSession()
  const snapshot = useSnapshot()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const nav = useRef<HTMLElement>(null)
  const viewer = snapshot.data?.viewer
  const refreshError: Message | null =
    snapshot.data && snapshot.isError ? { text: snapshot.error.message, tone: 'error' } : null
  const message: Message | null =
    notice && notice.at >= Math.max(snapshot.dataUpdatedAt, snapshot.errorUpdatedAt)
      ? notice
      : refreshError
  const noticeVisible = snapshot.data || session.kind === 'anon' || session.kind === 'loading'

  useEffect(() => {
    // jsdom has no scrollIntoView, so the call is optional.
    nav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [pathname, viewer])

  return (
    <div className="site-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <Logo alt={t('NCTC logo')} />
          <span className="app-header-product">{t('Soul Winning Journey')}</span>
        </div>
        {viewer && (
          <nav ref={nav} aria-label={t('Main navigation')} className="app-header-nav">
            {NAV_TABS.filter((tab) => !tab.leaderOnly || viewer.isLeader).map((tab) => (
              <NavItem key={tab.path} to={tab.path} onClick={clearNotice}>
                {t(tab.label)}
              </NavItem>
            ))}
          </nav>
        )}
        <div className="app-header-account">
          {viewer && (
            <>
              <span className="app-header-user">{viewer.displayName}</span>
              <TextAction onClick={() => void signOut()}>{t('Sign out')}</TextAction>
            </>
          )}
          <LanguageToggle />
        </div>
      </header>
      <main className="page">
        {message && noticeVisible && <Notice tone={message.tone}>{t(message.text)}</Notice>}
        {children}
      </main>
      <footer className="app-footer">
        <span>
          {t(
            'New Creation Training Center · Training new creations, raising end-time soul winners.',
          )}
        </span>
        <span className="app-footer-links">
          <a href="https://www.nctcdallas.org/" target="_blank" rel="noopener noreferrer">
            {t('About NCTC')}
          </a>
          <a href={youtubeUrl(language)} target="_blank" rel="noopener noreferrer">
            {t('NCTC on YouTube')}
          </a>
        </span>
      </footer>
    </div>
  )
}

export { SiteShell }
