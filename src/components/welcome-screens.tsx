import { useLanguage } from '#/i18n/language'
import { useSession } from '#/session/session'
import { Button } from '#/ui/button'
import { Skeleton } from '#/ui/skeleton'
import { TextAction } from '#/ui/text-action'

function WrongProviderScreen() {
  const { t } = useLanguage()
  const { signOut } = useSession()

  return (
    <section className="gate">
      <h1 className="page-title">{t('Google sign-in required')}</h1>
      <p className="lede">{t('Please sign out and choose Continue with Google.')}</p>
      <Button onClick={() => void signOut()}>{t('Sign out')}</Button>
    </section>
  )
}

function OpeningScreen() {
  const { t } = useLanguage()

  return (
    <section className="gate">
      <h1 className="page-title">{t('Opening your journey…')}</h1>
      <p className="lede">{t('Checking your records.')}</p>
      <Skeleton lines={3} />
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
    <section className="gate">
      <h1 className="page-title">{t('We couldn’t open your journey.')}</h1>
      <p className="lede">{t(message)}</p>
      <div className="action-row">
        <Button onClick={onRetry}>{t('Try again')}</Button>
        <TextAction onClick={() => void signOut()}>{t('Sign out')}</TextAction>
      </div>
    </section>
  )
}

export { OpeningScreen, UnavailableScreen, WrongProviderScreen }
