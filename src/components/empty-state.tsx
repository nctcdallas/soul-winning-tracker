import { useLanguage } from '#/i18n/language'
import { Button } from '#/ui/button'
import { useOpenTab } from './use-open-tab'

function EmptyState() {
  const { t } = useLanguage()
  const openTab = useOpenTab()

  return (
    <div className="ui-empty">
      <h3 className="ui-empty-title">{t('No people recorded yet')}</h3>
      <p className="ui-empty-body">
        {t('Record someone you reached to begin your journey and prayer list.')}
      </p>
      <Button tone="accent" size="sm" onClick={() => openTab('/record')}>
        {t('Record a person')}
      </Button>
    </div>
  )
}

export { EmptyState }
