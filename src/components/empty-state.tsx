import { useLanguage } from '#/i18n/language'

function EmptyState() {
  const { t } = useLanguage()

  return (
    <div className="ui-empty">
      <h3 className="ui-empty-title">{t('No people recorded yet')}</h3>
      <p className="ui-empty-body">
        {t('Record someone you reached to begin your journey and prayer list.')}
      </p>
    </div>
  )
}

export { EmptyState }
