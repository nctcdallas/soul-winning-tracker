import { useLanguage } from '#/i18n/language'
import { useSession } from '#/session/session'

function WrongProviderScreen() {
  const { t } = useLanguage()
  const { signOut } = useSession()

  return (
    <section className="welcome">
      <h1>{t('Google sign-in required')}</h1>
      <p>{t('Please sign out and choose Continue with Google.')}</p>
      <button type="button" className="primary-button" onClick={() => void signOut()}>
        {t('Sign out')}
      </button>
    </section>
  )
}

function OpeningScreen() {
  const { t } = useLanguage()

  return (
    <section className="welcome">
      <h1>{t('Opening your journey…')}</h1>
      <p>{t('Checking your records.')}</p>
    </section>
  )
}

interface UnavailableScreenProps {
  message: string
  onRetry: () => void
}

function UnavailableScreen({ message, onRetry }: UnavailableScreenProps) {
  const { t } = useLanguage()
  const { signOut } = useSession()

  return (
    <section className="welcome">
      <h1>{t('We couldn’t open your journey.')}</h1>
      <p>{t(message)}</p>
      <div className="error-actions">
        <button type="button" className="primary-button" onClick={onRetry}>
          {t('Try again')}
        </button>
        <button type="button" className="text-button" onClick={() => void signOut()}>
          {t('Sign out')}
        </button>
      </div>
    </section>
  )
}

export { OpeningScreen, UnavailableScreen, WrongProviderScreen }
