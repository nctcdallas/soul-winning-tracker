import type { ButtonHTMLAttributes } from 'react'

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  count?: number
}

function FilterChip({ selected = false, count, children, ...rest }: FilterChipProps) {
  return (
    <button type="button" {...rest} className="ui-filter-chip" aria-pressed={selected}>
      {children}
      {count !== undefined && <span className="ui-filter-chip-count">{count}</span>}
    </button>
  )
}

export { FilterChip }
