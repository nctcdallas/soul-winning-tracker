const ATTRIBUTES = [
  'id',
  'for',
  'name',
  'type',
  'placeholder',
  'aria-label',
  'aria-hidden',
  'alt',
  'title',
  'href',
  'src',
  'target',
  'rel',
  'role',
  'translate',
  'maxlength',
  'rows',
  'required',
]

interface Summary {
  /** The visible text, one entry per run of text between element boundaries. */
  lines: string[]
  /** Each element in document order, as `tag.class.class`. */
  elements: string[]
  /** The attributes and form values that a user or the stylesheet can observe. */
  attributes: string[]
}

function summarize(root: Element, today: string): Summary {
  const summary: Summary = { lines: [], elements: [], attributes: [] }
  let buffer = ''

  const flush = () => {
    const text = buffer.replace(/\s+/g, ' ').trim()

    if (text) {
      summary.lines.push(text)
    }

    buffer = ''
  }

  const visit = (node: Node) => {
    if (node.nodeType === 3) {
      buffer += node.nodeValue ?? ''

      return
    }

    if (node.nodeType !== 1) {
      return
    }

    const element = node as Element
    const tag = element.tagName.toLowerCase()

    flush()
    summary.elements.push([tag, ...[...element.classList].sort()].join('.'))

    for (const name of ATTRIBUTES) {
      const value = element.getAttribute(name)

      if (value !== null) {
        summary.attributes.push(`${tag}[${name}=${value}]`)
      }
    }

    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const field = element as HTMLInputElement
      const value = field.type === 'checkbox' ? String(field.checked) : field.value

      summary.attributes.push(`${tag}{value=${value === today ? '<today>' : value}}`)
    }

    // React writes a textarea value as a property, and the legacy markup wrote it as child text.
    if (tag !== 'textarea') {
      for (const child of element.childNodes) {
        visit(child)
      }
    }

    flush()
  }

  visit(root)

  return summary
}

export { summarize }
export type { Summary }
