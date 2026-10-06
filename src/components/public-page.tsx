import { oauthLogin } from '@netlify/identity'
import { useLanguage } from '#/i18n/language'
import { youtubeUrl } from '#/i18n/translate'
import { TotalsGrid } from './totals-grid'
import type { Totals } from '#/journeys/types'

interface PublicPageProps {
  totals: Totals | undefined
  totalsUnavailable: boolean
}

/** The signed-out landing page: live totals, the sign-in button, and what NCTC is. */
function PublicPage({ totals, totalsUnavailable }: PublicPageProps) {
  const { language, t } = useLanguage()

  return (
    <section className="public-welcome">
      <div className="public-totals">
        {language === 'ko' ? (
          <>
            <h1 className="ko-impact-title">NCTC 전도 현황</h1>
            <p className="ko-impact-subtitle">실시간 집계 · 2026년 10월부터</p>
          </>
        ) : (
          <h1 className="eyebrow">LIVE SOUL-WINNING IMPACT · SINCE OCTOBER 2026</h1>
        )}
        <TotalsGrid totals={totals} />
        <p className="totals-note">
          {t(
            'These are self-reported entries and may include repeat encounters. Counts update automatically; personal details are never shown publicly.',
          )}
        </p>
        {totalsUnavailable && (
          <p className="totals-note" role="status">
            {t('Live totals are temporarily unavailable.')}
          </p>
        )}
      </div>
      <div className="public-signin">
        <div>
          <h2>{t('Start your soul-winning journey')}</h2>
          <p>
            {t(
              'Anyone with a Google account can participate—no approval needed. Record an encounter, track follow-up, and keep a private prayer list.',
            )}
          </p>
        </div>
        <button type="button" className="primary-button" onClick={() => oauthLogin('google')}>
          {t('Continue with Google')}
        </button>
      </div>
      <div className="public-intro">
        <p className="eyebrow">{t('NEW CREATION TRAINING CENTER · WORLDWIDE OUTREACH')}</p>
        <h2 className="mission-title">{t('Be trained. Reach people. Keep praying.')}</h2>
        <p className="intro">
          {t(
            'NCTC exists to train new creations and raise end-time soul winners. Learn with our worldwide community, then use Soul Winning Journey to record outreach, remember each person, and follow up in prayer.',
          )}
        </p>
        <div className="public-links">
          <a href={youtubeUrl(language)} target="_blank" rel="noopener noreferrer">
            {t('Learn with NCTC on YouTube ↗')}
          </a>
          <a href="https://www.nctcdallas.org/" target="_blank" rel="noopener noreferrer">
            {t('Learn about NCTC ↗')}
          </a>
        </div>
      </div>
      <section className="privacy-panel">
        <h2>{t('Your records stay private')}</h2>
        <p>
          {t(
            'Only you and NCTC admins can see the names, locations, healing details, and prayer requests you record. Other participants see aggregate totals only. Use a first name or initials when possible, share only details the person is comfortable having recorded, and correct or remove an entry from your journey at any time.',
          )}
        </p>
      </section>
    </section>
  )
}

export { PublicPage }
