import { classNames } from './class-names'
import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

interface FieldProps {
  label: string
  className?: string
  children: ReactNode
}

function Field({ label, className, children }: FieldProps) {
  return (
    <label className={classNames('ui-field', className)}>
      <span className="ui-field-label">{label}</span>
      {children}
    </label>
  )
}

function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={classNames('ui-input', className)} />
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="ui-select">
      <select {...props} />
    </span>
  )
}

function Textarea({ rows = 3, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  // The element sizes to its content where `field-sizing` works, so the rows set its least height.
  const style = { '--textarea-rows': rows } as CSSProperties

  return <textarea {...rest} rows={rows} className="ui-textarea" style={style} />
}

export { Field, Input, Select, Textarea }
