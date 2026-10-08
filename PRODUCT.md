# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Members of New Creation Training Center (NCTC) and people who follow its teaching online, in English and Korean. A member records an outreach encounter, most often on a phone, and returns to pray for the people recorded. Design the phone layout first.

Two other audiences use the same site. A signed-out visitor sees the live totals and the invitation to join. An NCTC admin reviews the records of all members. An admin can read each record, but only the member who recorded one can change or remove it.

## Product Purpose

Soul Winning Journey (nctcsoulwinning.org) lets a member record each person reached with the gospel, the response, any healing or Holy Spirit baptism, optional notes, and prayer requests for that person. It adds the records of all members into four public totals. Success is that a member records an encounter in under a minute and keeps praying for the person after.

## Positioning

A private prayer list and a public count in one tool. Names and requests stay with the recorder and the NCTC admins. Only the four totals are public.

## Operating Context

- Sign-in is Google only, through Netlify Identity. Anyone with a Google account can join without approval.
- The public totals refresh every five seconds while the public page is open. The records of a member have no timer. They are read again after each change, on each change of tab, and when the window gets the focus.
- The interface has English and Korean. Text that a member enters is stored as written and is not translated.
- The live database holds real member records.

## Capabilities and Constraints

- Screens: public page, Overview, My journey, Record, and Team records (admins only).
- Response to the gospel has three values for new records (`declined`, `interested`, `saved`) and one earlier value (`praying`). Only `saved` adds to the salvation total.
- Totals are self-reported and can include repeat encounters. The interface says so next to them.
- The site must not load fonts or images from another origin.
- Undecided: the wording of the member screens. The public page had its copy pass in October 2026. The member screens have not, so they keep each English and Korean string.

## Brand Commitments

The NCTC Dallas design system (handed off from Claude Design, October 2026) is the visual authority. See DESIGN.md.

- Name: Soul Winning Journey. Korean: NCTC 영혼구원 여정.
- Logo: the official NCTC monogram, never redrawn, stretched, or boxed.
- No emoji and no flag icons. Each language is labeled in its own script.
- Records of people use an initial, never a photo.

## Evidence on Hand

- The four live totals come from the database. Do not invent, round, or pad a number.
- No photography exists for this product.

## Product Principles

1. The record form is the product. A member on a phone must reach it and finish it fast.
2. Privacy is stated where a member types a name, not only on a policy page.
3. A total is a count of real records, shown with its limits.
4. An answered prayer is testimony. Keep it and label it. Do not cross it out.

## Accessibility & Inclusion

Korean and English have equal standing. Korean text must wrap at word boundaries and use a typeface with full Hangul coverage (Pretendard, bundled).
