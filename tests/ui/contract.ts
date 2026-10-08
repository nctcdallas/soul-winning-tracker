import type { Summary } from './summarize'

const FIELD_ATTRIBUTES = new Set([
  'placeholder',
  'aria-label',
  'alt',
  'title',
  'name',
  'type',
  'maxlength',
  'required',
  'translate',
  'target',
  'rel',
  'href',
])

interface Contract {
  /** Each visible word, sorted, so the layout can move text without a failure. */
  words: string[]
  /** The attributes and values that carry copy or form behavior, sorted, with no tag name. */
  fields: string[]
}

function fieldOf(entry: string) {
  const value = /^[a-z0-9]+(\{value=[\s\S]*\})$/.exec(entry)

  if (value) {
    return value[1]
  }

  const attribute = /^[a-z0-9]+\[([a-z-]+)=([\s\S]*)\]$/.exec(entry)

  if (!attribute || !FIELD_ATTRIBUTES.has(attribute[1])) {
    return null
  }

  const [, name, content] = attribute
  const isPlainButton = name === 'type' && content === 'button'
  const isInternalLink = name === 'href' && content.startsWith('/')

  return isPlainButton || isInternalLink ? null : `[${name}=${content}]`
}

function contractOf(summary: Summary): Contract {
  return {
    words: summary.lines.flatMap((line) => line.split(' ')).sort(),
    fields: summary.attributes
      .map(fieldOf)
      .filter((field) => field !== null)
      .sort(),
  }
}

export { contractOf }
export type { Contract }
