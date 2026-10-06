import { addPrayerFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import { useRunMutation } from '#/queries/use-run-mutation'
import type { FormEvent } from 'react'

interface AddPrayerFormProps {
  journeyId: number
  inputId: string
  placeholder: string
}

function AddPrayerForm({ journeyId, inputId, placeholder }: AddPrayerFormProps) {
  const { t } = useLanguage()
  const run = useRunMutation()

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const requestText = String(new FormData(form).get('requestText') || '')
    const completed = await run(
      () => addPrayerFn({ data: { journeyId, requestText } }),
      'Prayer request added.',
    )

    if (completed) {
      form.reset()
    }
  }

  return (
    <form className="add-prayer" onSubmit={add}>
      <label htmlFor={inputId}>{t('Add a prayer request')}</label>
      <div>
        <input
          id={inputId}
          name="requestText"
          maxLength={1000}
          required
          placeholder={placeholder}
        />
        <button type="submit">{t('Add request')}</button>
      </div>
    </form>
  )
}

export { AddPrayerForm }
