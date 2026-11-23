# Resume here

## Occupation pages redesigned (22 November 2026)

The directory and all 479 generated detail pages now follow the approved passport-style identity. Preview `/occupations/` and `/occupations/registered-nurses-nec-254499/` on the local dev server. Search, visa pool tabs, round/cohort/state evidence, FAQ and related links are restyled; a scoped points preview keeps the existing occupation-only check URL contract. Federal-list chips now say membership rather than implying eligibility.

See `docs/OCCUPATION-REDESIGN-HANDOFF.md` for exact files, reviews, checks and screenshots. SEO comparison covers 480 HTML paths: unchanged route set, metadata, canonical/robots/JSON-LD and byte-identical sitemap, 130 unchanged noindex pages, 479 FAQ parity checks and zero broken internal links. Built-browser checks cover 35 route/width cases plus keyboard, touch, reduced motion, search, disclosures, prefill and print. Parent inspected representative screenshots and SEO/test/build artifacts and tightened directory placeholder contrast with the existing muted token. No merge or deployment. State/supporting-page redesigns remain next.

## Shared identity and shell implemented (22 November 2026)

The locally implemented recommendation is **Open lens**: a simple lens/bearing mark, Archivo wordmark, matching sage-backed favicon and ordinary/reversed SVG assets. Header, mobile navigation and footer now match the approved homepage/check palette. Preview `http://127.0.0.1:3000/`. This is ready for founder review, not a founder-approved logo decision or a deployment.

Detailed assets, checks and screenshots: `docs/BRAND-SHELL-HANDOFF.md`. Agent verification: `npm run check` (120 files / 1,287 tests), `npm run build` (491 pages), separate spec/quality reviews, 56 route/width combinations and mobile drawer keyboard/touch/print checks. Parent inspected the identity board, phone homepage and QA artifacts, and confirmed dev preview responds. No commit, merge or deployment.

Follow-ups: refresh the older social-share PNG separately; fix the existing 320px Feedback Turnstile overflow during that page's redesign. Those do not block reviewing the shared shell. Earlier notes below describing the shell as reserved are historical.

## Approved homepage implementation (22 November 2026)

The actual `/` route now implements Direction A+: passport/stencil hero, searchable occupation control, points and visa chips, interactive state map, historical evidence, report examples and compact FAQ. Preview `http://127.0.0.1:3000/`. The original prototypes are unchanged. Full file ownership, domain/provenance details, visual artifacts and independent review evidence are in `docs/HOMEPAGE-IMPLEMENTATION-HANDOFF.md`; implementation checklist is `docs/superpowers/plans/2026-11-22-approved-homepage.md`. Verified 288 state combinations and 18 national cases, keyboard/touch/zoom, loading/missing/error states and mobile layouts. Shared shell, logo and favicon remain a separate design task. No deployment.

## Points-check redesign (22 November 2026)

`/check/` now follows the approved Direction A+ homepage identity: sage desk, white paper, ink Archivo headings, scoped premium Mantine controls and a passport security-line live points preview. Preview: `http://127.0.0.1:3000/check/`; built static verification: `http://127.0.0.1:3017/check/`.

The four steps, calculations, dependent-answer resets, validation, opt-in local saving, required email, Turnstile and report handlers are preserved. Step bodies and reusable date/experience fields now live under `src/components/check/`. `CheckFlowTheme` inherits the root Mantine theme without affecting other routes or the generated report. Paired fields keep shared label/help/control tracks. The points breakdown is an accessible disclosure, and the introductory check header hides once the report is shown. No backend submissions were made in browser QA.

Verification: all four steps at eight widths (1440/1280/1024/820/600/390/360/320), no page/form overflow; sample flow reaches the report; manual profile reaches required-email validation with focus on the email field. Conditional state/study/Professional Year fields and points updates checked. Keyboard occupation search/selection, radio arrow navigation and the points disclosure work. The final built recheck confirms white controls, full-opacity placeholders and no obsolete local-token classes. Independent scoped review passed after fixing placeholder contrast to 6.41:1 and centralizing check tokens in `globals.css`/`CHECK_PALETTE`. Full `npm run check`: 119 files / 1,286 tests pass. Production build and combined homepage final verification are recorded in the homepage implementation handoff. Screenshots: `output/playwright/check-points-final-desktop.png`, `check-points-final-mobile.png`, `check-review-desktop.png`, `check-review-mobile.png`.

Shared header/footer, logo and favicon retain their existing design, awaiting the founder's separate design pass. Work remains on `roadmap/report-redesign`, uncommitted and undeployed.

## Revised homepage: Direction A plus interactive map (22 November 2026)

The founder prefers the original 21 November Direction A to the blue/white proposal and requested enhancing a separate copy. Open `http://127.0.0.1:3001/homepage-2026-11-22/direction-a-plus.html`. The original Direction A is unchanged. The new preview keeps the paper/sage/ink/stamp language, adds explicit Australian permanent-residency context, and replaces the old doors/try-it layout with an interactive state map and passport evidence panel. State shapes and equivalent buttons select all eight states/territories; 189/190/491 controls, occupation, points and zoom work locally. State evidence is generated by the existing `stateEvidence` / `evidenceLabel` code, with nomination points included and masked counts retained as ranges. This is historical evidence, not state-policy status or eligibility. The app homepage is unchanged pending design approval. Research and provenance are in `direction-a-plus-notes.md` beside the preview. AI scope remains summary only.

## Homepage design preview and AI scope (22 November 2026)

The founder chose AI summary only for the current release. Deferred AI explanations, comparisons, state explanations and report questions are recorded in `docs/AI-ROADMAP.md`.

The founder rejected the four 21 November homepage directions and requested a premium, attractive, graphics-led page that clearly explains Australian PR. A new interactive design preview is in `.superpowers/brainstorm/homepage-2026-11-22/`; open `http://127.0.0.1:3001/homepage-2026-11-22/` while the brainstorm server is running. It uses a real Australian coastline, a sample outlook, pathway controls and an occupation/points example generated with the existing calculation code. The illustration is not an eligibility map. The app homepage is unchanged pending founder review. Design plan and asset provenance are in the preview's `notes.md`.

## Passport background restored (22 November 2026)

The founder identified that the implemented report and PDF were missing the approved Option E passport security-line artwork and requested restoring it. The shared `PassportBackground` decoration uses the original mockup's SVG paths, cached as `public/report-passport.svg`, behind both the screen hero and print hero. It is hidden from assistive technology, ignores pointer events, and takes no layout space. The image loads eagerly for the offscreen print tree and remains printable with browser background graphics disabled. This applies to personal and sample reports through their shared components. The original omission is resolved. Follow-up: the print artwork now spans the full hero instead of starting 40% across it, removing the abrupt vertical edge through the horizontal security lines. No AI enablement or deployment is included.

Verified: `npm run check` (1,276 tests) and `npm run build` pass. Built-export browser checks cover all four sample tabs at 1280, 820, 390 and 360px with reduced motion, no horizontal overflow or page errors, and loaded, non-interactive artwork hidden from assistive technology. Eight PDFs exported with background graphics off retain the original page counts (Strong 4; the other three 5) from both desktop and mobile viewports; all four opening pages were rendered and visually inspected. Scoped code review confirms all 35 SVG paths match the approved artwork.

## Report redesign: shipped on the branch, not merged, not deployed (22 November 2026)

Branch `roadmap/report-redesign` (spec `docs/superpowers/specs/2026-11-21-report-redesign-design.md`; ledger `.superpowers/sdd/2026-11-21-report-redesign/progress.md`). Every plan task (1 to 19) is done, and the whole-branch review's fix wave (ruling R32) is in; its report is `.superpowers/sdd/2026-11-21-report-redesign/final-fix-report.md`. Nothing is merged to `main` or deployed. What changed: the 34-page report is replaced by a short report built around stamps (a label from code for 189, 190 and 491), a route line, queue and cut-off charts, an improve section, an evidence section (closed on screen, the old state panels and tables inside) and a 4 to 5 page print layout; `/sample/` has four example tabs; a `write-read` Function and "Our read" client exist but stay dark. See `docs/REPORT-COVERAGE.md`.

**Both AI switches stay off.** `NEXT_PUBLIC_READ_ENABLED` is unset and `READ_ENABLED` is not `true`, so every report shows the template read. `PRIVACY_VERSION` stays `2026-11-20` on purpose (ruling R31): the deployed Functions check it exactly. The AI sentences (the email gate's "Your summary is written by AI from your results (not your answers)." and the privacy text's Anthropic sentence) show only in a build with `NEXT_PUBLIC_READ_ENABLED=true`.

**Enablement checklist.** Merging the branch changes nothing visible about the AI. Before step 1, three things must be done (final review, ruling R32):

- Set a monthly spend limit on the Anthropic workspace that holds `ANTHROPIC_API_KEY`, so a leaked token or a flood of reads has a hard cost ceiling.
- Build a Postgres-backed use counter per submission id (ids only, never facts or text) and have `write-read` check it. Today's per-token count lives in memory per Function instance, so a cold start or a second instance resets it. Do not set `READ_ENABLED=true` until this exists.
- Confirm on the hosted project that Supabase sets the first `X-Forwarded-For` entry to the real client address (the rate limit keys on it, and requests without it share one bucket), and that a hosted deploy resolves the `npm:@anthropic-ai/sdk` import.

Then, to turn it on:

1. Set the Function secrets: `ANTHROPIC_API_KEY`, `READ_MODEL`, `READ_MAX_OUTPUT_TOKENS`, `READ_TOKEN_SECRET`. Leave `READ_ENABLED` unset for now.
2. In code, bump `PRIVACY_VERSION` in `src/lib/submissions/contract.ts` and the "Collection notice version" date in `src/app/methodology/page.tsx`. Build the frontend with `NEXT_PUBLIC_READ_ENABLED=true`.
3. Deploy the three Functions and the frontend **back to back**, Functions first. Between the two deploys the old live frontend still sends the old `PRIVACY_VERSION`, which the new Functions reject, so submissions fail until the frontend lands. To avoid any window, have the Functions accept both the old and new version for a day, then remove the old one.
4. Then set `READ_ENABLED=true`. Kill switch: `READ_ENABLED=false`.

The read token lives in memory only (never localStorage or the URL); the report allows at most 3 `write-read` calls per token.

**Rulings the founder should know.** R22 (stamps in Archivo) was superseded on 23 Nov 2026: every stamp now uses the Big Shoulders Stencil face. R25: the route line shows only at 1024 px and wider; tablets and phones get a vertical route list. R27: the print `@page` margins (14/14/18 mm) apply to every route. R26: the old "Useful definitions" glossary now lives on the methodology page.

**Where the real rules engine's states differ from the approved mockups** (spec section 9 accepts this; the stamp labels are unaffected unless noted). Mockup copy was hand-written; the engine names the state its evidence and rules support:

- Priya and Kavya, 190: Victoria (rules being checked), not NSW. 491: Northern Territory. SA has 20 confirmed invitations but fails the half test, so it is only competitive.
- Arjun, 491: South Australia (tied with Tasmania, wins on code); 190: Tasmania.
- Rahul: Northern Territory for both 190 and 491 (only NT shows for 491).
- Aarav, 491: Victoria (rules being checked); his 190 is NSW as in the mockup.
- Meera: 190 Tasmania (rules being checked), 491 Western Australia.
- Dev: no state is named for a not-invited visa (ruling R7).

Other differences: Kavya reads "Roughly 870 to 970 EOIs ahead" (data), not the mockup's 870 to 990 (R2); the pool-by-points chart is a table of bars so its labels reach 12 px; the mockup's guilloche hero background was restored on 22 November at the founder's request (see above).

Verification of the built export is in `.superpowers/sdd/2026-11-21-report-redesign/task-19-report.md`.

## Search indexing launched (20 November 2026)

The founder launched indexing: `SITE_INDEXABLE = true` in `src/lib/site.ts`, so `robots.txt` allows all crawlers, pages are indexable (occupation pages whose every count is "<20" stay `noindex`), and `sitemap.xml` lists the 5 site pages and 349 occupation pages. Robots rules are a pure function (`src/lib/robots-rules.ts`) tested in both states.

**Deadline: install the daily 180-day retention cleanup in Supabase by 1 May 2027.** The privacy section now says "We delete submitted calculations and feedback 180 days after they are submitted"; the first records (20 Nov 2026) turn 180 days old around 19 May 2027. The steps are in `docs/OPERATIONS-BACKEND.md`.

Privacy text: the "daily cleanup once collection is enabled" clause was removed (no cleanup is scheduled yet) and one sentence now discloses Cloudflare Web Analytics (cookieless page counts). `PRIVACY_VERSION` was left at `2026-11-20` on purpose: the deployed Edge Functions check it exactly, so bumping it needs a coordinated backend deploy.

Founder's open items: the www.migratelens.com redirect (was returning 522), one live personal check and one feedback submission with test rows deleted afterwards, Google Search Console (Domain property via Cloudflare DNS) with the sitemap submitted, Bing Webmaster Tools import, and confirming Cloudflare Web Analytics records `migratelens.com` (its beacon upload failed in a headless test). Live checks on 20 Nov: the backend answers `migratelens.com` with CORS 204, rejects other origins (403) and rejects malformed submissions (400) without saving; the forms and the Turnstile widget render.

## Deployment fix: complete the npm lockfile (20 November 2026)

Merged and pushed the release to `main` as `16469a8`; Cloudflare's first deployment failed during dependency installation, before `npm run build`. Reproduced its exact missing `@emnapi/runtime@1.11.3` and `@emnapi/core@2.0.0-beta.2` entries in a fresh directory with Node 22.23.4 and npm 10.9.9. Regenerated the existing lockfile using that toolchain: the two entries are added, npm peer metadata is normalized, and existing package versions remain unchanged. Include a fresh `npm ci` check when validating lockfile changes; an existing local dependency tree did not expose this deployment failure.

## Release integration: production domain confirmed (20 November 2026)

The founder confirmed the three Cloudflare Pages Production public variables are configured, `https://migratelens.com` is live, and requested merging `roadmap/occupation-pages` into `main`. Added the exact production origin to Supabase `ALLOWED_ORIGINS`; both submission endpoints return 204 for production preflights and 403 for an unapproved origin. A read-only aggregate check confirms one saved calculation and no feedback yet; successful hosted feedback remains unverified. The production Turnstile widget must permit `migratelens.com`.

Integration includes the occupation pages, required calculation email and limited summary capture, feedback, Supabase backend, and paired-field alignment. Earlier “not merged/deployed” notes below describe their individual checkpoints. Indexing stays disabled (`SITE_INDEXABLE=false`); enabling search visibility is a separate launch action. Retention Cron scheduling remains explicitly deferred by the founder; the SQL is ready but has not been installed.

## Latest UI fix: paired field alignment (20 November 2026)

Fixed the shared `.columns` layout in `src/components/check-flow.module.css`: paired fields share label, helper, input and error tracks; single-column breakpoints return to normal stacked flow. This covers name/birth date, state/visa expiry, work experience, and assessment dates. Reproduced the original 30px offset; corrected paired controls measure 0px difference. Verified the built export at 1440, 1024, 900, 760, 640, 481, 480 and 390px, including wrapped labels/help and an error, with no horizontal overflow. Scoped code review clean; `npm run check` (860 tests) and `npm run build` pass. Local preview restarted on port 3000. No backend or collection behavior changed.

## Latest: Supabase backend configured, local preview restarted (20 November 2026)

The founder completed Supabase CLI login/link/migrations, supplied Turnstile keys, and confirmed `hello@migratelens.com` is set up. Configured the public project URL/site key/contact in ignored `.env.local`; saved `TURNSTILE_SECRET_KEY` and exact testing `ALLOWED_ORIGINS` in Supabase private secret storage (no private value in source or frontend). The project is `tyhwoehzjjrjwojzwjbg`. Deployed both `submit-calculation` and `submit-feedback` with the pinned CLI; both report ACTIVE and scoped `verify_jwt=false`.

Verified hosted migration dry-run reports up to date, both local-origin preflights return 204 with the expected CORS header, unapproved origins return 403, and valid-shaped requests with intentionally invalid Turnstile tokens return 403 without saving. A successful real human-verified submission and REST gateway role smoke test still remain to be checked. Restarted the local frontend at `http://127.0.0.1:3000`; `/feedback/` returns 200. The testing allowed origins are local port 3000 (127.0.0.1 and localhost) and the exact `https://landfall-584.pages.dev` host. Add the final production origin and use the appropriate widget/project when releasing the frontend.

The founder explicitly deferred step 6 (retention scheduling); no Cron schedule was installed. Complete that before public collection launch. The hosted Pages frontend is still on its prior release: no merge/push or Cloudflare frontend deployment was performed in this configuration step.

## Earlier: calculation capture and feedback implemented locally (20 November 2026)

Implementation remains on `roadmap/occupation-pages`; no merge, push or production deployment was performed. The founder's current Cloudflare hosting test is `https://landfall-584.pages.dev/`; automated requests returned 403, so live page behavior was not independently verified. The provided Supabase public URL is configured in ignored `.env.local`; no credentials were stored or collected.

Implemented: a required email plus allowlisted calculation summary before personal reports; sample-origin exclusion and disabled sample saving; idempotent retries; `/feedback/` with optional email/context; server-validated Turnstile; Supabase Postgres tables/RLS/atomic RPCs and two Edge Functions; explicit CORS and request limits; separate daily retention schedule; privacy and operating documentation. Full profiles/dates remain local, email is excluded from device saving and report printing, and no account/marketing/email-delivery service is implied.

Verified: `npm run check` (85 files, 860 tests; format/lint/TypeScript), `npm run build` (all 479 occupation pages plus feedback, still static), `npm run backend:check`, `npm run backend:test` (11), and `npm run backend:test:sql` (real isolated Postgres role permissions, atomic/concurrent idempotency, backlog statuses and retention boundaries). Separate spec and code-quality reviews are clean after fixes. One intermediate typecheck collided with a simultaneous build regenerating `.next/types`; final sequential checks pass.

Built-export browser checks: desktop 1440px and mobile 390px, reduced motion, required-email rejection, confirmed-save report opening, current-step verification preservation, feedback optional context, linked validation errors, sample capture exclusion, print-hidden feedback prompt, no horizontal overflow, unconfigured unavailable state. Browser success/failure/retry states used controlled Turnstile/API responses; these do not prove live persistence. A stale heading assertion was corrected in the QA script; the report itself opened correctly. Browser captures are in ignored `output/playwright/` (viewport captures avoid full-page screenshot stitching artifacts).

Remaining external work: Supabase CLI is not logged in; no schema/functions/secrets/Cron have been deployed to the founder's project. Need public Turnstile site key and a real privacy/contact mailbox; private keys belong in Supabase secrets. Staging REST-gateway role denial, actual Turnstile verification, real persisted submissions/deletion and scheduled Cron execution still need a configured project. Then configure Cloudflare public build variables and rebuild, integrate the release branch, verify the custom domain, enable indexing and submit Search Console. Exact steps are in `docs/OPERATIONS.md` and `docs/OPERATIONS-BACKEND.md`. The implementation plan is `docs/superpowers/plans/2026-11-20-calculation-capture-and-feedback.md`.

## Planned before launch: calculation emails and feedback (20 November 2026)

The founder purchased `migratelens.com` through Hostinger and is configuring Cloudflare. They requested storing calculation records and collecting feedback on the current `roadmap/occupation-pages` branch before going live, and explicitly chose **email required before viewing the personal report**.

The design is `docs/superpowers/specs/2026-11-20-calculation-capture-and-feedback-design.md`. The founder approved switching the backend plan to **Supabase Postgres and Edge Functions**, retaining **Cloudflare Pages** for the static frontend and **Turnstile** for both submission forms. Store an email plus a limited calculation summary; add `/feedback/`, private review in Supabase, and accurate privacy wording. Use separate staging/production Supabase projects, locked-down table access, and Supabase Cron for daily retention. Login, email verification, delivery, alerts and payments remain later work. This is planning only: no database, form, email gate, or collection behavior has been implemented. Indexing remains disabled. Continue the code work on this branch as requested.

Deployment investigation (20 November): the founder's `main` deployment log shows Next.js static generation succeeding, followed by failure in `npx opennextjs-cloudflare build`. This static-export project should use the Pages static HTML export setup with `npm run build` and output `out`. The logged route list has no occupation pages. Verify the Cloudflare project type, build command and intended release revision before redeploying; the failure has not been resolved or verified in Cloudflare by this documentation update.

## For the founder: what happened while you were away (19 November 2026)

**Done and pushed** to branch `roadmap/occupation-pages` (not merged into `main`; that is your call):

- **479 occupation pages** at `/occupations/<name>-<code>/`, one for every occupation with published data, each opening with "What the data says", then the pool by points (189, 190 and 491 tabs), the last 8 rounds as round cards (your pick), what happened to EOIs submitted each month, a state-by-state table, three questions answered from history, and related occupations.
- **An A–Z occupations page with search**, "Occupations" in the main menu, and a "See the {occupation} page" link from the homepage try-it.
- **Google plumbing**: sitemap (354 pages: 5 site pages and 349 occupations), robots file, canonical addresses and structured data. **Everything stays hidden from Google** until launch.
- **Checks**: 845 tests pass, the build makes all 479 pages, and real pages were checked in a browser at desktop and phone widths (no errors, no sideways scrolling, printing shows every section).
- **The final review caught a real honesty problem**, now fixed: the "Which states nominate?" answer said a state had "the most invitations" even when the published ranges overlapped (19 pages). It now names a state only when its range is clearly above every other, which is 1 page today.

**To launch** (when you have the domain): change two lines in `src/lib/site.ts` (`SITE_URL` to your domain, `SITE_INDEXABLE = true`), build, and host it. Hosting is still to choose (my suggestion: Cloudflare Pages).

**Decisions I made for you** (each is in the ledger with its cost if wrong):

- R1: the occupation summary's source line wording ("SkillSelect (Department of Home Affairs), snapshot … · counts are EOIs (one person can hold several) · updated monthly"). Cost if wrong: one string.
- R2 → replaced by R8: "the state with the most 190 invitations" is named only when its range is strictly above every other state's. Cost if wrong: that sentence appears less often.
- R3: no component render tests (the repo has none); view-model tests and the browser check cover them. Cost if wrong: a render bug caught later.
- R4: share links use the placeholder domain until you set yours, so preview link images may not show yet. Cost if wrong: one line.
- R5: commits name the model that wrote them. Cost: cosmetic.
- R6: a month with no EOIs in the monthly table counts as zero (the data is one full download). Cost if wrong: an empty bar.
- R7: a test uses its own fully masked example instead of the plan's wrong fixture. Cost: none to behaviour.
- R9: pages are hidden from Google only when every count is "under 20", which leaves 349 visible pages, not the ~287 I estimated. Cost if wrong: some thin pages indexed at launch; one rule to tighten.
- R10: a small hardening (a state with an unpublished count) is a follow-up; it never happens in today's data.
- The alert sign-up box is left out until you choose an email service.

**Small follow-ups** (none block launch) are listed in the ledger: keyboard Home/End on the tabs, "(opens in a new tab)" on state links, two similar greys in the monthly bars, the source line appearing twice on a page, and a few test gaps.

## Latest: occupation pages shipped, hidden from search (19 November 2026)

Roadmap step 4 tier 1 is done on branch `roadmap/occupation-pages` (spec `docs/superpowers/specs/2026-11-19-occupation-pages-design.md`, ledger `.superpowers/sdd/2026-11-19-occupation-pages/progress.md`). `/occupations/` and a page for each of the 479 occupations with published data (14 of the 493 have none), each with its own title, description, canonical, three JSON-LD scripts, round cards, pool tabs (189 / 190 / 491, all printed), questions, related occupations, a sitemap and robots. Everything is `noindex` and `robots.txt` disallows all until launch. Where things live: `CLAUDE.md`, "Occupation pages".

To launch: `SITE_URL` in `src/lib/site.ts` is a placeholder (`https://migratelens.com`) until the founder buys the domain; set it to the bought domain and `SITE_INDEXABLE = true`, then build and check `out/sitemap.xml` and `out/robots.txt`. Occupations where every count is "<20" stay `noindex` and out of the sitemap.

Deferred: per-occupation share images (the site-wide `og.png` is used), tier 2 deep pages for the top 30 occupations, the alert sign-up box (waiting for the founder to pick an email service), and `llms.txt`.

Verified: `npm run check`, `npm run build` and headless Chrome against `out/` at 1440 and 390px (index, 261313, 254499, an all-"<20" occupation, one with no 189 pool, 261399) and at 320px for the long name only (261399, Software and Applications Programmers nec): no console errors, no horizontal scroll, tabs switch, index search filters, head tags present, print shows every panel and FAQ answer. Screenshots: `.superpowers/sdd/2026-11-19-occupation-pages/screenshots/`.

## Earlier: MigrateLens brand and homepage shipped (18 November 2026)

The brand and homepage plan is done on branch `brand/migratelens` (spec `docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md`, ledger `.superpowers/sdd/2026-11-18-migratelens-brand-and-homepage/progress.md`). The site is renamed MigrateLens everywhere in rendered HTML; the old storage key is migrated and cleared (ruling B3). New brand tokens, Newsreader + Inter, the C1 logo, favicon and OG image; a 12px text floor under test; a rebuilt homepage (two doors, try-it, three questions, FAQ) with a Stageshow hero demo. "Worth watching" is slate. Where things live: `CLAUDE.md`, "Brand" and "Homepage".

State verification (19 Nov 2026): VIC, ACT, TAS and NT rules still need reading on the official pages through the founder's Chrome (Claude in Chrome must be connected; the sites return 403 to automated requests). NSW's "working in NSW" option needs a "working there now?" question, and WA's 6-month contract rule needs the WA list's Industry Sector column (construction is exempt), before either can be verified.

Known follow-ups: not checked in Safari, Firefox or on touch (the demo poster scales with `tan(atan2())`); the poster CSS repeats the 576/720/436/358/660 layout literals with no test pinning them to `demo-layout.ts`; the fixed demo frame could overflow with more profile categories; `toPoolOccupation` in `src/lib/data/legacy.ts` is now used only by tests; `EOI_CAVEAT` duplicates a scorecard string; `OutcomeBar` shows a double label; a doubled full stop in one doc comment; `verifyPng` checks size only; merge the duplicate mobile media blocks in `globals.css`.

## Latest: state outlook shipped (18 November 2026)

Roadmap step 3 is done on branch `roadmap/reality-check`. The report order is now: header, reality check, 189 / 190 / 491 panels, **state outlook** (`#state-outlook`) with the optional **"Sharpen my state outlook"** questions under it, then points audit, scenarios, timeline, occupation context, get organised and definitions.

- **State outlook.** A 190 / 491 switch (both print, one after the other), a 4 × 2 grid of tiles (2 × 4 at 390px) and a separate "Any state" tile, then a `<details>` panel per state. Groups: Strongest evidence, Worth watching, Needs your answers, Not yet verified, Not open to you now. `#state-outlook-190` / `#state-outlook-491` select a visa; a tile opens, scrolls to and focuses its panel. Pure logic in `src/lib/state-outlook/` (`stateOutlook`, `buildTiles`, `buildStatePanel`, `questionsNeeded`); `src/lib/report/state-outlook-view.ts` assembles both visas inside `buildReportView` (evidence read at the 190 / 491 points with nomination). Without occupation data (loading, no data, points only) the outlook and the questions are left out and the scorecard explains why.
- **Scorecard.** The 190 and 491 card sentences are now the outlook summaries; ruling S1 (national-invitations sentence) is retired. The 190 / 491 panels link to "See your state outlook".
- **Removed** from the report: the "State pathways" overview cards. `/states/` keeps them (`src/components/state-explorer.tsx` and `src/data/states.ts` still feed that page), so the page keeps working as a general directory; pointing it at the outlook is a later choice.
- **Sharpen answers** go through `check-flow.tsx`'s update path (`updateMany`), so the existing opt-in saving applies; nothing goes into the URL. Answered questions stay listed (answered checks carry their `field`, and `questionsNeeded` lists open and answered fields from the profile alone), so a saved answer can be changed or cleared after a reload or Edit. Changing the state or onshore answer clears the answers about where you live (`resetStateRelativeAnswers` in `src/lib/state-answers.ts`, ruling P25), so months in one state are never read as months in another; changing the occupation clears the work answers (P30). On `/sample/` the form is read-only.
- **Data.** Rules in `src/data/state-rules/2026-27/`, lists and the federal list as JSON, all imported on the client through `src/components/data/state-rule-data.ts` (the lists and federal list total about 11 KB gzipped). First-load JS grew by about 29 KB gzipped on `/check/` and 53 KB on `/sample/`. `npm run build` prints a staleness warning (never a failure) for rules checked more than 45 days ago. Routine and sources: `docs/DATA.md`, "State rules".
- **Verified:** `npm run check`, `npm run build`, and headless Chrome over CDP against `out/`. On `/sample/`: both grids, VIC / ACT / TAS / NT "Not yet verified" with evidence, NSW 491 "Not open to you now", 16 tiles open and focus their panels, footer in every panel, scorecard summaries, read-only questions, 390px with no overflow, reduced motion, print media and a printed PDF with both visas and all 16 panels. Nurse check (QLD): answering "8 years in the last 10" moves WA 491 from "Needs your answers" to "Strongest evidence" live, with saving on (stored, then cleared by "Clear this answer") and off (nothing stored); the URL stays `/check/`. No console errors. Screenshots: `.superpowers/sdd/2026-11-18-state-outlook/screenshots/task11-*`.

- **Final review fixes (18 Nov 2026).** A sweep of about 213,000 real outcomes found input gaps, now closed. Every stream starts with the points check: an ineligible check (age 45 or over, an expired English test or skills assessment, named from `PointsResult.ineligibleReasons`) or under 65 points for the visa makes every state "Not open to you now"; an incomplete check never passes, and a missing English test or skills assessment date is asked in place in "Sharpen my state outlook" (rulings P27, P32; the report passes the whole `PointsResult`). The WA and SA graduate study rules, and SA's months after the course, are `secondary` because the questions cannot test them (P28). Panel lines show why a rule failed or can't be confirmed; a not-open panel lists each stream's first failing finding (P29). Changing the occupation clears the work answers (P30). Experience rules name the work each state counts and never fail on an answer below a wider definition (P31). QLD's Notice of Assessment gate and Queensland employer rule show as restrictions, and the QLD importer stops if the onshore Building and Construction column disappears. Verified with `npm run check`, `npm run build`, the reviewer's sweep (no pass while ineligible or under 65; every not-open stream has a verified, fresh fail) and headless Chrome against `out/` (screenshots `final-fix-*`). Report: `.superpowers/sdd/2026-11-18-state-outlook/final-fix-report.md`.

Known follow-ups: browser-verify ACT, VIC, TAS and NT (founder to decide how); import WA's sector column so the WA General stream can be checked (ruling P12); `report.tsx` (500 lines) and `check-flow.tsx` are still over the size limit; minor items in `.superpowers/sdd/2026-11-18-state-outlook/progress.md`.

## Earlier: reality check complete (18 November 2026)

Roadmap step 2 is done on branch `roadmap/reality-check`. The report now opens with the reality check, then a detail panel for each visa:

1. Header.
2. **What the data says** (`#reality-check`, renamed from "Reality check" on 19 Nov 2026): the bottom line from the last four 189 rounds and a state line ("The published evidence for 190 is strongest in NSW…"), three visa cards (190/491 chips name the best state group) (chip, one sentence, your points, "Ahead of you" on 189 or "Higher score (national pool)" on 190/491, "At your score", a details link), the queue caveat with a link to `/methodology/#pool`, and the pool-overlap note, then the last six 189 cut-offs against the reader's points, "EOIs like yours", and "What could change it" (points you could add, dated changes ahead). The same bottom line is repeated before "What this report can and cannot tell you". View-model: `src/lib/report/data-says.ts`; components: `src/components/report/data-says.tsx`.
3. **189 panel** (`#visa-189`): where you stand (with the 12-month trend and its coverage caveat), among your score, recent rounds (all rounds on tap), what happened to EOIs like yours (nearby months on tap), what could change your position.
4. **190 and 491 panels** (`#visa-190`, `#visa-491`): where you stand in the national pool and 12 months of recorded invitations, linking to the state pathways.
5. Points audit (the eligibility notice now opens it), scenarios, timeline, state pathways, occupation context, get organised, definitions.

- The old score cards, pool section and invitation-history section are gone. View-models live in `src/lib/report/` (`report-view.ts` builds them all from one profile and occupation); components in `src/components/report/`. The nav numbers follow the sections actually shown: without occupation data the panels are left out and the scorecard explains why.
- Final-review honesty fixes (S11–S16): the queue caveat under the scorecard and every queue bar; "Invited, not yet lodged" and the current-status note in EOIs like yours; masked same-score counts say they may be zero; an EOI month after the snapshot says it is not published yet (in both the same-score block and EOIs like yours); points-only checks say "You chose a points check only…"; 190/491 invitations are labelled "all states". A failed load's 189 chip says "Not loaded".
- Ruling S1: until step 3, the 190/491 card sentences summarise national invitations, not a state outlook (decision log in `docs/STRATEGY.md`).
- Print: closed `<details>` content (all rounds) and the trend's monthly table now print; panel blocks may break across pages, headings stay with their content.
- Verified: `npm run check`, `npm run build`, and headless Chrome against `out/` at 1440px and 390px — `/sample/` (ICT Business Analyst at 90: "none" headline, 865–903 ahead, 1,093 at your score, all three panels), the nurse check (`?occupation=254499`, EOI date 14 Feb 2025: Feb 2025 cohort, 175 invited, 60 lodged), points only, print media and a printed PDF, reduced motion, loading and failed-detail states, details links moving focus to the panels, no console errors. Screenshots for the founder are in `.superpowers/sdd/2026-11-18-reality-check/screenshots/`.

Next: roadmap step 3, the 190/491 state outlook (same spec, sections 3 onward). It replaces the "State pathways" section and the S1 card sentences. Known small follow-ups: the legacy trend chart's axis labels are small at 390px and still use locale month names, so a September tick could read "Sept"; on a failed load the 189 card's neutral chip still says "No data"; `report.tsx` (537 lines) is still over the length guideline.

## Earlier: data foundation complete (17 November 2026)

Roadmap step 1 is done on branch `roadmap/foundation`. The site is fed by one validated, versioned dataset covering every occupation: snapshot `skillselect-2026-10-31`, 493 occupations (479 with published EOIs), produced by the TypeScript importer in `scripts/import/`. The Python importer and the 11-occupation `pool.json` / `report-evidence.json` are gone; the two files are kept as test fixtures, and the new pipeline reproduces them with zero differences. `docs/DATA.md` is the data dictionary; read it before using the data.

- The UI looks and behaves as before for the original 11 occupations. The one copy change is the 12-month trend caption: the net-change sentence was replaced by a coverage caveat (ruling R17).
- Final-review fixes: multi-month data now records every fetched month (`{}` = zero) and accessors use calendar windows from `asAt` (R14, records at `schemaVersion: 2`); the 2020-21 unit-group 189 rounds are skipped with reasons instead of being misread, and `rounds.json` is `{ rounds, skipped }` (R15); the legacy test regenerates 2026-10 from `data/raw` (R16); a short Qlik table read now stops the import. All 493 occupations are now searchable in the homepage explorer, the check's occupation picker and the report's comparison picker.
- Pages server-load the occupations they render statically (Registered Nurses nec on the homepage; Registered Nurses nec and Registered Nurse (Aged Care) on `/sample/`, since 19 Nov 2026). Other occupations are fetched one file at a time from `/data/occupations/<code>.json`, showing "Loading published data…" meanwhile.
- Occupations with no published 189 pool, or no published EOIs, keep the points check and say that no pool comparison is available.
- Verified: `npm run check`, `npm run build`, and a headless-Chrome run against `out/` (explorer search and loading state, the four-step check from `?occupation=233211`, the sample report, print media, 390px width, reduced motion, no console errors).

Next: roadmap step 2, the reality-check section (`docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md`). Open data questions are listed under "Known limits" in `docs/DATA.md`, notably the SUBMITTED coverage window: re-check it after the 11/2026 import.

## Earlier checkpoint

17 November 2026. The user requested pushing the current work to GitHub and continuing later. This checkpoint contains the premium redesign and expanded evidence-backed report. No new preview deployment was requested at this stopping point; the existing private Sites preview still has the previous release.

## Implemented

- Mantine 9 controls and mobile drawer; Motion feature tabs, step/score transitions and section entrances, with reduced-motion support.
- Redesigned landing page, guided check, report workspace and state directory.
- Report credential scenarios, explicit scenario-to-pool action, three visa pools, twelve monthly 189 occupation totals, six actual invitation rounds, personal dates, state summaries, occupation comparisons, general checklist and glossary.
- Reproducible official-data importer and source/coverage documentation (since replaced by the all-occupation importer; see `docs/DATA.md`).
- Review fixes for bounded chart input, printing collapsed content, expired-credential scenarios and SVG title hydration.

## Verified

47 domain/data tests pass, TypeScript passes and the static production build passes. Production dependency audit reports no vulnerabilities. Original SPEC and four HTML references remain byte-for-byte unchanged.

Production browser checks exercised homepage searchable occupation, keyboard score slider and feature tabs; empty validation; calendar selection; full four-step sample check; 90-point report; credential scenario and applying it to the pool; 190/491 score defaults; oversized pasted input; checklist and glossary; edit, opt-in saving, restoration and clear. No JavaScript page errors in the completed flow. Mobile navigation and sample-report width passed a 390px smoke check; collapsed glossary content is visible in production print media. A decorative halo causing homepage horizontal overflow was corrected.

## Continue next time

As of 17 November 2026, follow the approved roadmap in `docs/STRATEGY.md`, in order:

1. Data foundation: done.
2. A reality-check section in the report: done (see "Latest" above).
3. A 190/491 state outlook, covering rules, evidence and points, ranked into groups: done (see "Latest" above).
4. SEO foundation and occupation pages for every occupation.
5. Polish: readability, copy, sample report, `npm ci` lockfile.
6. Content engine.
7. Monetisation, with lawyer review first.

The earlier QA items still apply as part of step 5: mobile/tablet visual QA, print pagination and step-to-step scrolling under the sticky header. Preserve `.openai/hosting.json` when publishing.

`docs/REPORT-COVERAGE.md` records every original report section and the evidence or product dependency behind each remaining gap. `docs/DESIGN.md` records the design approach and library choices. Exact queue positions, forecast waits, percentage chances and current ceiling utilisation remain unsupported and are not fabricated. History-based outcome counts and historical waits are now planned; see `docs/STRATEGY.md`.
