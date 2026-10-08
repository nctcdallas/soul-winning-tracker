import { oauthLogin } from '@netlify/identity'
import { useLanguage } from '#/i18n/language'
import { youtubeUrl } from '#/i18n/translate'
import { Button } from '#/ui/button'
import { Eyebrow } from '#/ui/eyebrow'
import { Panel } from '#/ui/panel'
import { TotalsGrid } from './totals-grid'
import type { Totals } from '#/journeys/types'

interface PublicPageProps {
  totals: Totals | undefined
  totalsUnavailable: boolean
}

function PublicPage({ totals, totalsUnavailable }: PublicPageProps) {
  const { language, t } = useLanguage()

  return (
    <div className="public">
      <section>
        <div className="public-head">
          <h1 className="page-title">{t('Record each person you reach. Keep praying for them.')}</h1>
          <Eyebrow rule={false}>{t('LIVE SOUL-WINNING IMPACT · SINCE OCTOBER 2026')}</Eyebrow>
        </div>
        <TotalsGrid totals={totals} />
        <p className="fine-print">
          {t(
            'These are self-reported entries and may include repeat encounters. Counts update automatically; personal details are never shown publicly.',
          )}
        </p>
        {totalsUnavailable && (
          <p className="fine-print fine-print-alert" role="status">
            {t('Live totals are temporarily unavailable.')}
          </p>
        )}
      </section>
      <section className="signin">
        <div className="signin-copy">
          <h2 className="head-title">{t('Start your soul-winning journey')}</h2>
          <p className="body-copy">
            {t(
              'Anyone with a Google account can join. No approval is needed. Record an encounter, track follow-up, and keep a private prayer list.',
            )}
          </p>
        </div>
        <div className="signin-dock">
          <Button tone="accent" size="lg" stretch onClick={() => oauthLogin('google')}>
            {t('Continue with Google')}
          </Button>
        </div>
        <Panel as="section" tone="boneAlt" className="text-panel">
          <h2 className="section-title">{t('Your records stay private')}</h2>
          <p className="body-copy">
            {t(
              'Only you and NCTC admins can see the names, locations, notes, and prayer requests you record. Other participants see totals only. Use a first name or initials when possible, record only what the person is comfortable with, and correct or remove an entry at any time.',
            )}
          </p>
        </Panel>
      </section>
      <section className="mission">
        <Eyebrow>{t('NEW CREATION TRAINING CENTER · WORLDWIDE OUTREACH')}</Eyebrow>
        <h2 className="head-title">{t('Be trained. Reach people. Keep praying.')}</h2>
        <p className="lede">
          {t(
            'NCTC exists to train new creations and raise end-time soul winners. Learn with our worldwide community, then use Soul Winning Journey to record outreach, remember each person, and follow up in prayer.',
          )}
        </p>
        <div className="link-row">
          <Button
            tone="outline"
            href={youtubeUrl(language)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Learn with NCTC on YouTube ↗')}
          </Button>
          <Button
            tone="outline"
            href="https://www.nctcdallas.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Learn about NCTC ↗')}
          </Button>
        </div>
      </section>
    </div>
  )
}

export { PublicPage }
