import { classNames } from './class-names'
import type { ReactNode } from 'react'

interface ColumnHeaderProps {
  /** The direction when the table is sorted by this column. */
  sort?: 'asc' | 'desc' | null
  onSort?: () => void
  className?: string
  children: ReactNode
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

function ColumnHeader({ sort = null, onSort, className, children }: ColumnHeaderProps) {
  return (
    <div
      role="columnheader"
      className={classNames('ui-column-header', className)}
      aria-sort={onSort ? (sort ? ARIA_SORT[sort] : 'none') : undefined}
    >
      {onSort ? (
        <button type="button" data-sort={sort ?? undefined} onClick={onSort}>
          {children}
        </button>
      ) : (
        children
      )}
    </div>
  )
}

export { ColumnHeader }
