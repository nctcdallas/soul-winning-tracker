import { useLanguage } from '#/i18n/language'
import { statusOptionsFor } from '#/journeys/helpers'
import type { SalvationStatus } from '#/journeys/types'

function StatusOptions({ selected }: { selected: SalvationStatus }) {
  const { t } = useLanguage()

  return statusOptionsFor(selected).map((option) => (
    <option key={option.value} value={option.value}>
      {t(option.label)}
    </option>
  ))
}

export { StatusOptions }
