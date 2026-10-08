import { deletePrayerFn, editPrayerFn, setPrayerStatusFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import { useRunMutation } from '#/queries/use-run-mutation'
import { Button } from '#/ui/button'
import { Field, Textarea } from '#/ui/field'
import { TextAction } from '#/ui/text-action'
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
      <form className="prayer-editor" onSubmit={save}>
        <Field label={t('Edit prayer request')}>
          <Textarea
            name="requestText"
            maxLength={1000}
            required
            rows={3}
            defaultValue={prayer.requestText}
          />
        </Field>
        <div className="action-row">
          <Button type="submit" size="sm">
            {t('Save request')}
          </Button>
          <TextAction onClick={() => onEdit(null)}>{t('Cancel')}</TextAction>
        </div>
      </form>
    )
  }

  return (
    <div className={answered ? 'prayer-item prayer-item-answered' : 'prayer-item'}>
      <p className="prayer-text">{prayer.requestText}</p>
      <div className="action-row">
        <TextAction
          tone={answered ? 'default' : 'accent'}
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
        </TextAction>
        <TextAction onClick={() => onEdit(prayer.id)}>{t('Edit')}</TextAction>
        <TextAction tone="danger" onClick={remove}>
          {t('Remove')}
        </TextAction>
      </div>
    </div>
  )
}

export { PrayerRow }
