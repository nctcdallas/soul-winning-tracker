import { useRouterState } from '@tanstack/react-router'
import { useLanguage } from '#/i18n/language'
import { youtubeUrl } from '#/i18n/translate'
import { useNotice } from '#/notice/notice'
import { useSnapshot } from '#/queries/use-snapshot'
import { useSession } from '#/session/session'
import { NAV_TABS } from './nav-tabs'
import { useOpenTab } from './use-open-tab'
import type { ReactNode } from 'react'

function SiteShell({ children }: { children: ReactNode }) {
  const { language, t, toggleLanguage } = useLanguage()
  const { notice, noticeAt } = useNotice()
  const { session, signOut } = useSession()
  const snapshot = useSnapshot()
  const openTab = useOpenTab()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const viewer = snapshot.data?.viewer
  const pollError = snapshot.data && snapshot.isError ? snapshot.error.message : ''
  const message =
    notice !== '' && noticeAt >= Math.max(snapshot.dataUpdatedAt, snapshot.errorUpdatedAt)
      ? notice
      : pollError
  const noticeVisible =
    message !== '' && (snapshot.data || session.kind === 'anon' || session.kind === 'loading')
  const toggleLabel = language === 'ko' ? '영어로 보기' : '한국어로 보기'

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/nctc-logo.png" alt={t('NCTC logo')} />
          <span>{t('Soul Winning Journey')}</span>
        </div>
        {viewer && (
          <>
            <nav aria-label={t('Main navigation')} className="nav">
              {NAV_TABS.filter((tab) => !tab.leaderOnly || viewer.isLeader).map((tab) => (
                <button
                  type="button"
                  key={tab.path}
                  className={pathname === tab.path ? 'active' : undefined}
                  onClick={() => openTab(tab.path)}
                >
                  {t(tab.label)}
                </button>
              ))}
            </nav>
            <div className="account">
              <span>{viewer.displayName}</span>
              <button type="button" onClick={() => void signOut()}>
                {t('Sign out')}
              </button>
            </div>
          </>
        )}
        <button
          type="button"
          className="language-toggle"
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={toggleLanguage}
        >
          <span aria-hidden="true">{language === 'ko' ? '🇺🇸' : '🇰🇷'}</span>{' '}
          {language === 'ko' ? 'EN' : '한국어'}
        </button>
      </header>
      <main className="page-content">
        {noticeVisible && (
          <p className="notice" role="status">
            {t(message)}
          </p>
        )}
        {children}
      </main>
      <footer>
        <span>
          {t(
            'New Creation Training Center · Training new creations, raising end-time soul winners.',
          )}
        </span>
        <span className="footer-links">
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
