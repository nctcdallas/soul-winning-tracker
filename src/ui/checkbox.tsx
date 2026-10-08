import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

function Checkbox({ label, ...rest }: CheckboxProps) {
  return (
    <label className="ui-checkbox">
      <input {...rest} type="checkbox" />
      <span className="ui-checkbox-box" aria-hidden="true" />
      {label}
    </label>
  )
}

export { Checkbox }
