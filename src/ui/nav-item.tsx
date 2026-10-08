import { Link } from '@tanstack/react-router'
import type { TabPath } from '#/components/nav-tabs'
import type { ReactNode } from 'react'

interface NavItemProps {
  to: TabPath
  onClick: () => void
  children: ReactNode
}

function NavItem({ to, onClick, children }: NavItemProps) {
  return (
    <Link
      to={to}
      className="ui-nav-item"
      activeOptions={{ exact: true, includeSearch: false }}
      activeProps={{ className: '' }}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export { NavItem }
