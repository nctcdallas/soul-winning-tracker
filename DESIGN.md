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
  ember-100: "#FFF1D6"
  ember-200: "#FFD79A"
  ember-300: "#FFB347"
  ember-400: "#F0782A"
  ember-500: "#D9481C"
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

The target is serious, restrained, text-first, and uncluttered. Bold comes from scale and contrast, not from color. The app is a tool, so it is bone from top to bottom. The ink surfaces are the hero total and the admin strip on Team records. The one exception is the fire of the ministry total, which Pastor John asked for in October 2026 as the color of urgency and revival.

The October 2026 redesign changed no words on the member screens. The public page had its copy pass: a headline, shorter body copy, and the privacy statement beside the invitation. Parts of the design system that need new words are not built yet: the two-click remove control, the "Answered" label on a prayer row, the label on a notice, and inline field errors. The highlight wipe is built for one place only, the count of answered prayers on My journey.

## Colors

Four warm families. Ink `#1A1613` is text and the hero total. Stone is secondary text. Bone `#F7F4EE` is the page. Crimson `#9E2A2B` is the only accent.

Crimson marks these and nothing else: the one primary action of a screen, the active tab rule, the focus ring, a checked checkbox card, the accent badge, the initial in an avatar, "Mark answered", a remove action, and an error. A screen has one crimson button. A second button on the same screen is ink or outline.

Ember (`#FFF1D6` to `#D9481C`) is the fire of the ministry total. It is on that one tile and nowhere else: not on a button, a badge, text, or a personal total. The label and the note of that tile use `--text-fire-secondary`, because stone-300 on the crimson heat is below 4.5:1.

Placeholder text uses stone-500, because stone-400 on bone is below 4.5:1. The border of a field and the border of a checkbox card use stone-400, not the bone-400 of the design system, because a control boundary needs 3:1 on bone.

## Typography

One family, Archivo (variable, weights 100 to 900), served from `public/fonts/`. Pretendard Variable follows it in the stack and supplies Hangul. No font comes from another origin.

A page title is 38px at weight 600 on a phone and 42px at weight 700 from 750px. A section title is 21px. Body is 17px, and it is never below 15px. A label is 11px capitals at 0.14em. Each input, select, and textarea is 16px or more, so iOS does not zoom.

Korean: `word-break: keep-all`, labels at 12px with 0.04em, headings with more line height and `text-wrap: pretty`.

## Layout

Write the phone layout first, then add `min-width` queries at 600, 750, 900, and 1200px. The gutter is 20px on a phone and 40px from 750px. The measure is 1240px. Sections are 48px apart on a phone and 64px from 750px.

- Header: sticky. On a phone, row 1 has the monogram, the product name, Sign out, and the language control, and row 2 has the tabs. The tab row holds three tabs, or four for an admin, and scrolls only if they stop fitting. From 1200px the header is one row.
- Public page: the order at every width is headline, totals, invitation with privacy, mission. The headline is the `h1`, and the eyebrow sits under it. The invitation is one section with the privacy panel inside it. Below 600px, on a viewport of 600px or taller, the one crimson button sticks to the bottom of the viewport until the visitor reaches its place after the invitation text, then it stays in the flow. From 600px the button is always in the flow at its natural width. From 900px the invitation text and the button are the left column and the privacy panel is the right column, top aligned with the heading. The mission is a plain full-width section at the end.
- Ministry total: on the public page and on Overview, the hero tile of the ministry totals has live coals. A WebGL canvas (`src/ui/coals.tsx`) draws a bed of fire of 58px at the bottom edge, with a crimson heat behind the count and a small number of sparks. The tile is taller and has more space below the note, so no text is on the bright part of the fire. A count of zero and a count that is not known show the flat ink tile, because there is no fire with no records. The personal totals on My journey keep the flat ink tile.
- Totals: one ink hero tile, then three small totals as a ledger (label left, figure right, hairlines). Below 900px the hero is full width with the ledger under it, and the figures are 32px. From 900px the hero is the left column and the ledger is the right column, stretched to the height of the hero with the rows evenly spread, and the figures are 40px. Only `.stat-row` on the Overview tab uses small tiles, from 600px.
- Record form: no box below 750px, so the fields use the full width. A panel of 760px from 750px. It has three steps: the encounter, what happened (with optional notes for any encounter), and an optional first prayer request. Saving opens My journey with the new person first.
- My journey: the heading with its one crimson button, then the people, then the totals. A member with no people sees the heading and the empty state only. The empty state has no button, because the heading holds it. The old Prayer list page is gone, and `/prayers` redirects here.
- Overview: from the "Overview" design in Claude Design (October 2026). It has two states.
- Overview with no records: the page head with no button, a bone-200 panel "Record your first person." that holds the one crimson button, the ministry totals, then the YouTube panel.
- Overview with records: the page head with the crimson button below the description, three tiles (my encounters, open prayer requests, answered prayers), "My people", then the ministry totals. Each tile has a note below its figure, and a tile with a count of zero has no note. The YouTube panel is not there, because the footer has the link.
- My people on Overview: the five newest people, with the count and "See all" at the right of the heading. Each row is one link: the initial, the name with place and date, the latest active request below its label, and the badges. A click opens My journey with the row of that person open and in view (`/journey?person=<id>`).
- Records: design 1b from Claude Design (project "People I Recorded", October 2026, revised). The heading and the list are in one bone-200 panel with a hairline border. On a phone the panel goes to the two edges of the screen. The heading has the count of people at its right. One row is open at a time, and the first row is open when the page loads. The name is the button (`aria-expanded`), and its hit area is the full summary. The summary ends with "Open" or "Close" and an arrow from CSS. On hover, only the name changes, to crimson.
- Closed row: the initial, the name (20px, weight 600), the place and date, the latest active request below a label, and the badges. The label is "Prayer request" for one active request and "Latest request · N active" for more. A person with no active request shows no preview. All badges in a row are quiet.
- Open row: the lighter bone-100 surface on the bone-200 panel, with the body aligned below the name from 750px. It has three parts, 36px apart. First, the prayers: each active request in a hairline box with its text verbs, then "Add a prayer request", which opens the field and a "Done" verb, then the answered requests. Second, the facts, below a hairline: each fact is a capitals label with its value below it, 28px apart (Response to the gospel, Notes when the record has notes, Recorded on). Third, Edit record and Remove record as text verbs.
- Motion on My journey: one authored moment and two quiet ones, all off with reduced motion.
  - Answered prayer: when the count of answered requests goes up, the crimson highlight wipe goes across the count from the left, stays while the member reads it, and goes out to the right (2.2s). This is the highlight of the design system, used for a testimony. No other action on the page gets a celebration.
  - Open row: the row opens to its height in 560ms with the expo ease-out, and the content comes down 10px as it fades in. The row closes with no motion.
  - Arrow: on hover, the arrow of the summary moves 2px in the direction that a click moves the row.
- Motion on the ministry total: the fire moves slowly at all times. When the polled count goes up, the fire becomes taller and hotter and the count goes to ember-100, then the two go back in 2.2s. The canvas stops while the tile is out of view or the tab is hidden. With reduced motion, the fire is one still frame and there is no flare. With no WebGL, a CSS gradient shows a still bed of heat.
- When a row opens, the page keeps it in view, because the row that closes above it can move it.
- Record editor: Edit record changes the facts into the form in the same stack, a label with its field below it, with Save changes and Cancel below. The prayers stay in view. The Notes field is always there and does not depend on a checkbox. The response to the gospel changes only here. A field in the editor is 420px wide at most.
- Not built from design 1b: the two-click remove, the "Answered" label with a date, and a table row for Holy Spirit baptism, because the app has no confirm copy, no answered date, and no details for that baptism.
- Team records: the design "Team Records" from Claude Design (October 2026). The screen is for review only, and the server refuses a change by an admin to the record of a different member. In order: the admin strip, the page head with no eyebrow, the filters, the line of results, the table, and the panel.
- Admin strip: a full-width ink band directly below the header, with "Admin view" in crimson-300 capitals and one line that states the rule. It is the second ink surface of the app, after the hero total, and only an admin sees it.
- Team filters: a row of chips for the team member (Everyone, Me, then each member), a row of chips for the encounter (Healing, Holy Spirit baptism, Open prayer requests), then two selects (response, date range) and the search field. Each chip shows the count that it gives with the other filters on. The line of results has the three counts at the left and Group by team member, Clear filters, and Download CSV at the right.
- Team table: a row for each record, with a hairline below it. The name is the button, and its hit area is the full row. The columns follow the width of the table and not the viewport, through a container query: all seven from 980px, four from 560px (person with place and member, date, encounters, prayer), and below 560px the person and the date with the badges and the prayer below. The selected row has a bone-200 ground, a crimson name, and a crimson arrow from CSS at its right edge that points to the panel. Each row keeps 36px at the right for the arrow. While the panel is open, the rows hide the line with the place and the member. A click on a sorted column changes its direction.
- Team panel: `SidePanel`. From 1200px it is a sticky column of 400px next to the table. Below 1200px it is fixed to the right edge with a hairline, no shadow, and no scrim. Escape closes it, and the focus goes back to the row. It shows the member, the response, the encounters as badges, the notes, and the prayers, with no controls. A record of the viewer has "Edit in My journey". A record of a different member has the line "Only [name] can edit this record."
- A control or a row action is 44px tall on touch widths. The compact sizes of the design system apply only from 750px with a mouse.

## Elevation & Depth

No shadows. Depth is tone and a 1px hairline. The one exception is the 1px rule below the sticky header, which is 92% opaque bone with a 16px blur. The sign-in dock of the public page is opaque bone with a 1px rule above it. No gradients, except the fire of the ministry total and its fallback.

## Shapes

2px on controls, 3px on panels, a pill only on a badge. Lines are 1px. Glyphs (`→`, `▼`, `✓`, `+`) are typographic and come from CSS, not from an icon set. No emoji and no flags.

## Components

- `Button`: tones `accent`, `primary`, `outline`; sizes `sm`, `md`, `lg`. Hover steps one color value in 340ms. Press moves 1px down.
- `TextAction`: a row verb such as Edit or Remove, and Sign out. Tones `default`, `accent`, `danger`.
- `Field`, `Input`, `Select`, `Textarea`: a box with a 1px stone-400 border and a 2px radius, on the bone-100 ground, with a capitals label above. Focus makes the border crimson. A field is never underline only.
- `CheckboxCard`: a native checkbox, hidden, with the card styled through `:has(input:checked)`. It works in an uncontrolled form.
- `Stat`: a count of zero uses the tertiary text color, so an empty total does not have the weight of a real one. It shows the real count on the first render. When a polled count changes, it moves from the old count to the new one in 900ms. No count from zero. The variant `fire` adds the coals to the hero tile for a count above zero.
- `Notice`: `success` is ink with bone text, `error` is crimson text in a crimson hairline. It sits in the page, at the top. A success notice closes after 6 seconds, and an error stays until the member acts. A later read of the records replaces it.
- `FilterChip`: a toggle with a 2px radius and an optional count. Selected is ink. A pill stays for a badge only.
- `ColumnHeader`: a capitals label for a table column. With `onSort` it is a button, and the arrow from CSS shows the direction.
- `Checkbox`: a small box with a label, for a setting of a view. `CheckboxCard` stays for a form.
- `SidePanel`: the detail surface next to a list. The system has no dialog.
- `Panel`: the one card. Do not put a panel in a panel.
- `LanguageToggle`: `EN` and `한국어` together, the active one on ink.
- Answered prayers sit in a native `details` element below a count. They are not crossed out.

## Do's and Don'ts

- Do keep each visible string as it is until the copy pass of its screen. The list of people is the exception: it follows design 1b, so the contract test does not compare its words. `tests/ui/app.contract.test.tsx` fails when a word or a form attribute changes, and it lists each reviewed line of the public page in `COPY_REVISIONS`.
- Do run `pnpm screens` after a visual change and look at the phone set first.
- Do not add a second crimson button, a shadow, a gradient, an icon, or a photo of a recorded person.
- Do not use the ember colors or the fire on a second surface. The ministry total is the only one.
- Do not put a decorative glyph in the DOM as text. Use CSS.
- Do not make an input smaller than 16px.
- The contract test compares the words of the public page, the gate screens, the Record form, and the empty My journey only. Overview, the list of people, and Team records follow their designs.
- Do not treat the eyebrow labels or the `01 ·` step numbers as a pattern for new screens. They are existing copy that the redesign kept.
