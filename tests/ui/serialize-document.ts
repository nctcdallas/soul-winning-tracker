/** Returns the document as HTML, with the form state that React keeps in properties written as attributes. */
function serializeDocument() {
  for (const option of document.querySelectorAll('option')) {
    option.toggleAttribute('selected', option.selected)
  }

  for (const input of document.querySelectorAll('input')) {
    if (input.type === 'checkbox') {
      input.toggleAttribute('checked', input.checked)
    } else {
      input.setAttribute('value', input.value)
    }
  }

  for (const textarea of document.querySelectorAll('textarea')) {
    textarea.textContent = textarea.value
  }

  // Vitest resolves the `?url` import of the stylesheet to nothing, so the link has no address.
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    link.setAttribute('href', '/styles.css')
  }

  return `<!doctype html>${document.documentElement.outerHTML}`
}

export { serializeDocument }
