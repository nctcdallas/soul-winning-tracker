import { deletePrayerFn, editPrayerFn, setPrayerStatusFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import { useRunMutation } from '#/queries/use-run-mutation'
import type { Prayer } from '#/journeys/types'
import type { FormEvent } from 'react'

interface PrayerRowProps {
  prayer: Prayer
  editing: boolean
  onEdit: (id: number | null) => void
}

function PrayerRow({ prayer, editing, onEdit }: PrayerRowProps) {
  const { t } = useLanguage()
  const run = useRunMutation()
  const answered = prayer.status === 'answered'

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const requestText = String(new FormData(event.currentTarget).get('requestText') || '')
    const completed = await run(
      () => editPrayerFn({ data: { id: prayer.id, requestText } }),
      'Prayer request updated.',
    )

    if (completed) {
      onEdit(null)
    }
  }

  async function remove() {
    if (!window.confirm(t('Remove this prayer request? This cannot be undone.'))) {
      return
    }

    await run(() => deletePrayerFn({ data: { id: prayer.id } }), 'Prayer request removed.')
  }

  if (editing) {
    return (
      <form className="prayer-edit" onSubmit={save}>
        <label>
          {t('Edit prayer request')}
          <textarea
            name="requestText"
            maxLength={1000}
            required
            rows={3}
            defaultValue={prayer.requestText}
          />
        </label>
        <div className="record-actions">
          <button type="submit">{t('Save request')}</button>
          <button type="button" onClick={() => onEdit(null)}>
            {t('Cancel')}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className={answered ? 'prayer-request answered' : 'prayer-request'}>
      <p>{prayer.requestText}</p>
      <div className="record-actions">
        <button
          type="button"
          onClick={() =>
            run(
              () =>
                setPrayerStatusFn({
                  data: { id: prayer.id, status: answered ? 'active' : 'answered' },
                }),
              'Prayer request updated.',
            )
          }
        >
          {answered ? t('Reopen') : t('Mark answered')}
        </button>
        <button type="button" onClick={() => onEdit(prayer.id)}>
          {t('Edit')}
        </button>
        <button type="button" className="danger-link" onClick={remove}>
          {t('Remove')}
        </button>
      </div>
    </div>
  )
}

export { PrayerRow }
