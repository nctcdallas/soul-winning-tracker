import { useLanguage } from '#/i18n/language'
import { statusOptionsFor } from '#/journeys/helpers'
import type { SalvationStatus } from '#/journeys/types'

/** The options of a salvation-status select; a record from before the "praying" choice was removed keeps its own. */
function StatusOptions({ selected }: { selected: SalvationStatus }) {
  const { t } = useLanguage()

  return statusOptionsFor(selected).map((option) => (
    <option key={option.value} value={option.value}>
      {t(option.label)}
    </option>
  ))
}

export { StatusOptions }
