# Soul Winning Journey — nctcsoulwinning.org

This is the Netlify-ready version of the journey tracker. It is a TanStack Start app (React, TanStack Router, TanStack Query) that includes the site, the Google sign-in flow, the protected record server functions, and the Netlify Database schema. The old ChatGPT Site is not changed by uploading this project.

The record rules are in `src/server/records.ts`. `pnpm test` runs them against an in-memory database and compares each outcome with the recorded outcomes of the earlier API function (`tests/parity/golden.json`).

The interface follows the NCTC Dallas design system: warm bone paper, ink type, and crimson for the one main action of a screen. The header uses the official NCTC monogram (`public/logo-monogram-ink.svg`). The logo is bundled locally with the site; no external image link is required.

## Update the existing NCTC project

Upload this ZIP to the **existing** `nctcsoulwinning` project under **Deploys**. Do not create a second Netlify project and do not upload only the `dist` folder: the project source includes the server functions and the database migrations. The app calls its own server functions on the same origin and uses Netlify Identity, so changing from the `netlify.app` address to `https://nctcsoulwinning.org/` does not require new URLs or a second database.

The browser error `DNS_PROBE_FINISHED_NXDOMAIN` means the new name is not resolving in DNS; a new ZIP alone cannot fix it. In **Domain management**, confirm `nctcsoulwinning.org` is assigned to this project, check its DNS status, and let Netlify finish HTTPS certificate provisioning. If it was purchased through Netlify for this project, Netlify normally configures DNS and HTTPS; a newly registered domain can still take time to become reachable. Google sign-in requires the custom domain to work over HTTPS. Keep using the existing `*.netlify.app` address for testing until the custom domain opens securely. Do not invite participants or switch the project from Private to Public until record privacy and admin access have been tested on the deployed version.

## What it does

- A visitor sees NCTC's mission, links to its website and YouTube channel, and live self-reported aggregate counts before signing in. The public totals server function returns counts only, never names or prayer requests.
- A visitor sees **Continue with Google** to record. Record APIs reject Identity accounts that were not created through Google.
- Each member sees only their own named people and prayer requests, plus all four ministry totals.
- The **My journey** tab also shows four personal totals computed only from that member's records: outreach encounters, salvation decisions, healings, and Holy Spirit baptisms. These personal numbers are not published to other members.
- The admin sees all records, prayer requests, and outcome totals. Only the member who recorded an entry can change or remove it.
- Anyone with a Google account can join without approval. Members can record and correct encounter details, response to the gospel, healing, Holy Spirit baptism, notes, and prayer requests. They can remove their own entries; removing an encounter also removes its prayer requests. Only "Chose to receive Jesus" contributes to the salvation total.
- The totals refresh every five seconds while the page is open.
- The header offers English and Korean throughout the public page and member interface, with a two-part control that names each language in its own script (`EN`, `한국어`). A visitor's choice is remembered in that browser. English links to NCTC's English YouTube channel (`@nctcdallas`); Korean links to its Korean channel (`@nctc2022`). Korean text can be entered in all record and prayer fields; submitted names and details are saved as written, without automatic translation. Both languages contribute to the same totals and database.
- Latin text uses the bundled Archivo variable font (`public/fonts/Archivo-latin.woff2`, `public/fonts/Archivo-latin-ext.woff2`) and Korean text uses the bundled Pretendard Variable font (`public/fonts/PretendardVariable.woff2`). Each is distributed with its SIL Open Font License (`public/fonts/Archivo-LICENSE.txt`, `public/fonts/Pretendard-LICENSE.txt`). No external font request is needed.
- Earlier records with the old `praying` status remain labeled as earlier follow-up records; this update does not reinterpret them as a rejection. New records use `declined`, `interested`, or `saved`.
- New entries have an editable **Date of encounter**, defaulting to today in the member's browser. The actual encounter date appears beside the location in private records; the separate date of entry remains visible below it. Older records are not automatically assigned an encounter date, because their entry date may differ. Members can add the actual date by editing those records. The included second database migration adds this nullable date field without changing existing records.

## Setup checklist

1. In the existing `nctcsoulwinning` project's **Deploys** screen, upload this complete project ZIP. Netlify should detect `netlify.toml`, install dependencies, run `vite build`, and deploy the site with its server. Do not upload only `dist/`: the database migrations would be missing.
2. Open the new project in Netlify. Under **Identity**, enable Identity, leave registration **Open**, then go to **Registration → External providers** and enable **Google**. Do not enable any other external provider.
3. Confirm **Data & Storage → Database** has a database and that the `journeys` and `prayer_requests` tables were created. The included `@netlify/database` package and migration are intended to provision this automatically during deployment; verify the result in the dashboard.
4. Under the project's environment variables, set `ADMIN_EMAILS` to the Google email address(es) that should see all records. Separate multiple addresses with commas. If unset, nobody receives admin access.
5. This project starts with an empty database; no old journeys are imported. The previously used `APP_READY` environment variable is no longer needed. Identity still protects every personal-record and prayer-request server function.
6. Test sign-in with your Google account, member privacy with a second Google account, and admin access before sharing `https://nctcsoulwinning.org/`.

## Existing data

The project ZIP intentionally contains **no names or prayer requests**. The new site starts fresh; it does not move any records from the old site.

## Local development

Requires Node.js 22 or newer and pnpm.

1. Run `pnpm install`.
2. Run `netlify link` and select the `nctcsoulwinning` project. The link supplies `ADMIN_EMAILS` and the site URL that the server uses to check a sign-in.
3. Run `netlify dev` and open `http://localhost:8888`. The Netlify CLI starts Vite on port 3000, starts a local database, and forwards `/.netlify/identity` to the live Identity service, which Google sign-in needs.
4. Run `netlify database migrations apply` one time to create the tables in the local database.

`pnpm dev` starts Vite alone on port 3000. The public page and the database work there, but sign-in does not, because nothing forwards `/.netlify/identity`.

### Signed-in screens on a local server

Google sign-in cannot complete on a local server, because Netlify Identity sends the browser to the live site after the Google step. To work on the signed-in screens, put an address in `.env`:

```
DEV_MEMBER_EMAIL=you@example.com
```

Then start `netlify dev` again. The local server treats each request as that Google member, with no sign-in step. The member is an admin when the address is in `ADMIN_EMAILS`. Remove the line to see the signed-out page.

This works only on the dev server. A build replaces the check with `false`, so a deploy ignores `DEV_MEMBER_EMAIL`. Do not use it while the local server points at the live database: the server would then read and write real records as that member.

| Command | What it does |
|---|---|
| `pnpm test` | Runs the record-rule, sign-in, and UI tests with Vitest. |
| `pnpm typecheck` | Runs `tsc --noEmit`. |
| `pnpm build` | Builds the client into `dist/client` and the server function into `.netlify/v1/functions`. |

The tests do not verify live Google OAuth, database provisioning, or the Netlify deployment.

## Important setup notes

- The purchased domain and Google sign-in are separate services. The existing `*.netlify.app` address remains useful for testing while the custom domain becomes available.
- This package's login screen offers Google only. Netlify Identity may still allow other signup mechanisms at its own service endpoint, so each record server function checks that the account was created with Google before returning or changing any data. This provider field is an account property, not independent proof that every later session used Google. Verify the final Google-only policy on the live project before inviting the team.
- Open registration means Google accounts are identified, not vetted. Entries and outcome totals are self-reported; the site currently has no moderation queue, duplicate detection, or audit trail. NCTC should monitor entries before using totals as verified impact reporting.
- The Netlify project's private-site gate is separate from app sign-in. To let the public see aggregate totals, make the site itself public only after confirming that named records and prayer requests remain protected for non-owners.
- Never put private names, prayer requests, database connection strings, or sign-in secrets in the ZIP or a public Git repository.
