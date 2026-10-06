import { useLanguage } from '#/i18n/language'
import { useOpenTab } from './use-open-tab'

interface SectionHeadingProps {
  eyebrow: string
  heading: string
  description: string
  action?: boolean
}

/** Heads a tab with its title, and optionally a shortcut to the record form. */
function SectionHeading({ eyebrow, heading, description, action = false }: SectionHeadingProps) {
  const { t } = useLanguage()
  const openTab = useOpenTab()

  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{t(eyebrow)}</p>
        <h1>{t(heading)}</h1>
        <p className="intro">{t(description)}</p>
      </div>
      {action && (
        <button type="button" className="primary-button" onClick={() => openTab('/record')}>
          {t('Record a person')}
        </button>
      )}
    </div>
  )
}

export { SectionHeading }
