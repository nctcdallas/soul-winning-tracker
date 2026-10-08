// Turns the HTML that `CAPTURE_SCREENS=<dir> vitest run tests/ui/app.contract.test.tsx` wrote into screenshots.
// Usage: node tests/ui/shoot-screens.mjs [htmlDir] [pngDir]. The dev server must run, because it compiles the stylesheet.
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { chromium } from 'playwright-core'

const [htmlDir = '.screens/html', pngDir = '.screens/png'] = process.argv.slice(2)
const devServer = process.env.SCREENS_DEV_SERVER ?? 'http://localhost:3211'
const SITE = 'http://screens.local'
const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
}
const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }

const stylesheet = await fetch(`${devServer}/src/styles.css?direct`).then((response) => {
  if (!response.ok) {
    throw new Error(`The dev server at ${devServer} did not return the stylesheet.`)
  }

  return response.text()
})

function answer(route) {
  const { pathname } = new URL(route.request().url())
  const extension = extname(pathname)

  if (extension === '.html') {
    return route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: readFileSync(join(htmlDir, decodeURIComponent(pathname))),
    })
  }

  if (extension === '.css') {
    return route.fulfill({ contentType: 'text/css', body: stylesheet })
  }

  if (MIME[extension]) {
    return route.fulfill({
      contentType: MIME[extension],
      body: readFileSync(join('public', decodeURIComponent(pathname))),
    })
  }

  return route.abort()
}

const browser = await chromium.launch(
  process.env.SCREENS_BROWSER
    ? { executablePath: process.env.SCREENS_BROWSER }
    : { channel: 'chrome' },
)
const files = readdirSync(htmlDir).filter((file) => file.endsWith('.html'))

for (const [name, options] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ ...options, reducedMotion: 'reduce' })
  const page = await context.newPage()

  await context.route('**/*', answer)
  mkdirSync(join(pngDir, name), { recursive: true })

  for (const file of files) {
    await page.goto(`${SITE}/${encodeURIComponent(file)}`)
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({
      path: join(pngDir, name, file.replace('.html', '.png')),
      fullPage: true,
    })
  }

  await context.close()
}

await browser.close()
console.log(`${files.length} states at ${Object.keys(VIEWPORTS).length} widths in ${pngDir}`)
