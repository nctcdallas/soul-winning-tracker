---
name: Soul Winning Journey
description: The NCTC Dallas design system, applied to a phone-first record and prayer tool.
colors:
  ink-900: "#1A1613"
  ink-700: "#302A25"
  stone-600: "#463F3A"
  stone-500: "#5C544D"
  stone-400: "#7A7168"
  stone-300: "#A39A90"
  bone-100: "#F7F4EE"
  bone-200: "#F0ECE4"
  bone-300: "#E2DCD1"
  bone-400: "#CFC7B9"
  crimson-300: "#E8907F"
  crimson-500: "#9E2A2B"
  crimson-600: "#7E1F21"
typography:
  display:
    fontFamily: "Archivo, Pretendard Variable, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.034em"
  page-title:
    fontFamily: "Archivo, Pretendard Variable, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  section-title:
    fontFamily: "Archivo, Pretendard Variable, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Archivo, Pretendard Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "-0.006em"
  meta:
    fontFamily: "Archivo, Pretendard Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "Archivo, Pretendard Variable, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.14em"
rounded:
  sm: "2px"
  md: "3px"
  pill: "999px"
spacing:
  gutter-phone: "20px"
  gutter: "40px"
  section-phone: "48px"
  section: "64px"
  measure: "1240px"
components:
  button-accent:
    backgroundColor: "{colors.crimson-500}"
    textColor: "{colors.bone-100}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-accent-hover:
    backgroundColor: "{colors.crimson-600}"
  button-primary:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.bone-100}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.stone-600}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  panel:
    backgroundColor: "{colors.bone-100}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.md}"
    padding: "32px"
  panel-alt:
    backgroundColor: "{colors.bone-200}"
  stat-hero:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.bone-100}"
    rounded: "{rounded.md}"
    padding: "32px 32px 28px"
  notice-success:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.bone-100}"
    rounded: "{rounded.sm}"
    padding: "14px 18px"
  notice-error:
    backgroundColor: "transparent"
    textColor: "{colors.crimson-600}"
    rounded: "{rounded.sm}"
    padding: "14px 18px"
---

## Overview

This app uses the NCTC Dallas design system. The system came as a handoff from Claude Design in October 2026, and its `readme.md` is the source for the brand rules. The token values are in `src/styles/tokens.css`. The primitives are in `src/ui/` with their styles in `src/styles/ui.css`. The layout of each screen is in `src/styles/screens.css`.

The target is serious, restrained, text-first, and uncluttered. Bold comes from scale and contrast, not from color. The app is a tool, so it is bone from top to bottom, and the only ink surface is the hero total.

The October 2026 redesign changed no words. Parts of the design system that need new words are not built yet: the two-click remove control, the "Answered" label on a prayer row, the label on a notice, inline field errors, and the highlight wipe behind a headline.

## Colors

Four warm families. Ink `#1A1613` is text and the hero total. Stone is secondary text. Bone `#F7F4EE` is the page. Crimson `#9E2A2B` is the only accent.

Crimson marks these and nothing else: the one primary action of a screen, the active tab rule, the focus ring, a checked checkbox card, the accent badge, the initial in an avatar, "Mark answered", a remove action, and an error. A screen has one crimson button. A second button on the same screen is ink or outline.

Placeholder text uses stone-500, because stone-400 on bone is below 4.5:1. The underline of a field and the border of a checkbox card use stone-400, not the bone-400 of the design system, because a control boundary needs 3:1 on bone.

## Typography

One family, Archivo (variable, weights 100 to 900), served from `public/fonts/`. Pretendard Variable follows it in the stack and supplies Hangul. No font comes from another origin.

A page title is 38px at weight 600 on a phone and 42px at weight 700 from 750px. A section title is 21px. Body is 17px, and it is never below 15px. A label is 11px capitals at 0.14em. Each input, select, and textarea is 16px or more, so iOS does not zoom.

Korean: `word-break: keep-all`, labels at 12px with 0.04em, headings with more line height and `text-wrap: pretty`.

## Layout

Write the phone layout first, then add `min-width` queries at 600, 750, 900, 960, and 1200px. The gutter is 20px on a phone and 40px from 750px. The measure is 1240px. Sections are 48px apart on a phone and 64px from 750px.

- Header: sticky. On a phone, row 1 has the monogram, the product name, Sign out, and the language control, and row 2 has the tabs. The tab row scrolls only when an admin has five tabs. From 1200px the header is one row.
- Totals: one ink hero tile, then three small totals. Below 600px the small totals are a ledger (label left, 32px figure right, hairlines). From 600px they are tiles.
- Record form: no box below 750px, so the fields use the full width. A panel of 760px from 750px.
- Record cards: one column on a phone, two columns from 960px.
- A control or a row action is 44px tall on touch widths. The compact sizes of the design system apply only from 750px with a mouse.

## Elevation & Depth

No shadows. Depth is tone and a 1px hairline. The one exception is the 1px rule below the sticky header, which is 92% opaque bone with a 16px blur. No gradients.

## Shapes

2px on controls, 3px on panels, a pill only on a badge. Lines are 1px. Glyphs (`→`, `▼`, `✓`, `+`) are typographic and come from CSS, not from an icon set. No emoji and no flags.

## Components

- `Button`: tones `accent`, `primary`, `outline`, `quiet`; sizes `sm`, `md`, `lg`. Hover steps one color value in 340ms. Press moves 1px down.
- `TextAction`: a row verb such as Edit or Remove. Tones `default`, `accent`, `danger`.
- `Field`, `Input`, `Select`, `Textarea`: underline only, with a capitals label above.
- `CheckboxCard`: a native checkbox, hidden, with the card styled through `:has(input:checked)`. It works in an uncontrolled form.
- `Stat`: shows the real count on the first render. When a polled count changes, it moves from the old count to the new one in 900ms. No count from zero.
- `Notice`: `success` is ink with bone text, `error` is crimson text in a crimson hairline. It sits in the page, at the top. The next poll of the records replaces it.
- `Panel`: the one card. Do not put a panel in a panel.
- `LanguageToggle`: `EN` and `한국어` together, the active one on ink.
- Answered prayers sit in a native `details` element below a count. They are not crossed out.

## Do's and Don'ts

- Do keep each visible string as it is until the copy pass. `tests/ui/app.contract.test.tsx` fails when a word or a form attribute changes.
- Do run `pnpm screens` after a visual change and look at the phone set first.
- Do not add a second crimson button, a shadow, a gradient, an icon, or a photo of a recorded person.
- Do not put a decorative glyph in the DOM as text. Use CSS.
- Do not make an input smaller than 16px.
- Do not treat the eyebrow labels or the `01 ·` step numbers as a pattern for new screens. They are existing copy that the redesign kept.
