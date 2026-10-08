import { useLanguage } from '#/i18n/language'
import { Button } from '#/ui/button'
import { Eyebrow } from '#/ui/eyebrow'
import { useOpenTab } from './use-open-tab'

interface SectionHeadingProps {
  eyebrow: string
  heading: string
  description: string
  action?: boolean
}

function SectionHeading({ eyebrow, heading, description, action = false }: SectionHeadingProps) {
  const { t } = useLanguage()
  const openTab = useOpenTab()

  return (
    <header className="page-head">
      <div>
        <Eyebrow>{t(eyebrow)}</Eyebrow>
        <h1 className="page-title">{t(heading)}</h1>
        <p className="lede">{t(description)}</p>
      </div>
      {action && (
        <Button tone="accent" arrow stretch onClick={() => openTab('/record')}>
          {t('Record a person')}
        </Button>
      )}
    </header>
  )
}

export { SectionHeading }
