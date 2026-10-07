import { addPrayerFn } from '#/server/functions'
import { useLanguage } from '#/i18n/language'
import { useRunMutation } from '#/queries/use-run-mutation'
import { Button } from '#/ui/button'
import { Input } from '#/ui/field'
import { TextAction } from '#/ui/text-action'
import { useState } from 'react'
import type { FormEvent } from 'react'

interface AddPrayerFormProps {
  journeyId: number
  inputId: string
  placeholder: string
}

function AddPrayerForm({ journeyId, inputId, placeholder }: AddPrayerFormProps) {
  const { t } = useLanguage()
  const run = useRunMutation()
  const [adding, setAdding] = useState(false)

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

  if (!adding) {
    return (
      <div className="inline-add">
        <TextAction onClick={() => setAdding(true)}>{t('Add a prayer request')}</TextAction>
      </div>
    )
  }

  return (
    <form className="inline-add" onSubmit={add}>
      <label className="sr-only" htmlFor={inputId}>
        {t('Add a prayer request')}
      </label>
      <div className="inline-add-row">
        <Input
          id={inputId}
          name="requestText"
          maxLength={1000}
          required
          autoFocus
          placeholder={placeholder}
        />
        <Button type="submit" size="sm">
          {t('Add request')}
        </Button>
      </div>
      <TextAction onClick={() => setAdding(false)}>{t('Done')}</TextAction>
    </form>
  )
}

export { AddPrayerForm }
