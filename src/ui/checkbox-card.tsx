import type { InputHTMLAttributes } from 'react'

interface CheckboxCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

function CheckboxCard({ label, ...rest }: CheckboxCardProps) {
  return (
    <label className="ui-checkbox-card">
      <input {...rest} type="checkbox" />
      <span className="ui-checkbox-card-box" aria-hidden="true" />
      <span className="ui-checkbox-card-label">{label}</span>
    </label>
  )
}

export { CheckboxCard }
