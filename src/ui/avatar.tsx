import { classNames } from './class-names'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md'
}

function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span className={classNames('ui-avatar', size === 'sm' && 'ui-avatar-sm')}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export { Avatar }
