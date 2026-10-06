import { useLanguage } from '#/i18n/language'
import { useOpenTab } from './use-open-tab'

/** Invites a member with no records to record their first encounter. */
function EmptyState() {
  const { t } = useLanguage()
  const openTab = useOpenTab()

  return (
    <div className="empty-state">
      <h3>{t('No people recorded yet')}</h3>
      <p>{t('Record someone you reached to begin your journey and prayer list.')}</p>
      <button type="button" className="text-button" onClick={() => openTab('/record')}>
        {t('Record a person')}
      </button>
    </div>
  )
}

export { EmptyState }
