# Occupation Pages (Roadmap Step 4, Tier 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A statically generated, answer-first page for each of the 479 occupations with published data, an A–Z occupations index, and the SEO plumbing (canonicals, sitemap, robots, JSON-LD), all hidden from search engines until the founder launches.

**Architecture:** Pure, tested view-models in `src/lib/occupation-page/` turn one occupation's core and detail records, the state rule data and the manifest into display strings and chart rows. `app/occupations/[slug]/page.tsx` (Server Component, `generateStaticParams` over the index) loads the records with `load-server.ts` and renders components from `src/components/occupation/`; only the pool tabs, the index search and the existing `TryIt` are client components. `app/sitemap.ts` and `app/robots.ts` are force-static metadata routes driven by `src/lib/site.ts`.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`, `trailingSlash: true`, webpack), React 19, TypeScript strict, Mantine 9, CSS Modules, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-occupation-pages-design.md` (read it, including "Settled after the builder check"). Mockup: `.superpowers/brainstorm/occupation-pages-2026-11-19/index.html` (round cards are option A).

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API (dynamic routes and `generateStaticParams`, `generateMetadata`, `sitemap`, `robots`, static exports). Route handlers and metadata routes need `export const dynamic = "force-static"` under the static export.
- Internal links end in `/`. The only allowed query parameter is `?occupation=<code>`.
- No forecasts, chances, "should" or visa recommendations; every rendered string passes `BANNED_COPY` (`src/lib/report/copy.ts`). "Is N points enough?" is answered from history only and ends "Past cut-offs are history, not a promise."
- A published `"<20"` is the interval `{min: 0, max: 19}` (`parseCountText`, `sumIntervals`, `formatCount`, `countInSentence`); never a single number. A `null` round cut-off is "Not listed", never zero. A month or state with no published data reads "Not published", never 0. Counts are EOIs, not people.
- `src/lib/occupation-page/*` is pure: no React, no `fs`, relative imports (it runs under tsx and vitest). Pages read files only through `src/lib/data/load-server.ts`.
- Reuse, do not re-implement: `summarise189Rounds` and `CHIP_LABEL` (`report/round-status.ts`), `buildEoisLikeYours` (`report/eois-like-yours.ts`), `poolPosition` (`data/pool-position.ts`), `formatMonth`, `formatCount`, `countInSentence` (`report/copy.ts`), `formatDate` (`migration.ts`), `STATE_NAMES`, `joinWords` (`state-outlook/context.ts`), `stateRuleData` (`components/data/state-rule-data.ts`), `TryIt` (`components/home/try-it.tsx`).
- Brand: tokens on `:root` in `src/app/globals.css` (no new hex literals in new CSS), Newsreader 600 for headings and big numbers, Inter for text, saffron never as text. No rendered text under 12px (`src/app/css-floor.test.ts`); running text 16px at phone width; AA contrast; everything visible in print; any animation respects reduced motion.
- `src/lib/site.ts`: `SITE_INDEXABLE = false` keeps every page `noindex` and `robots.txt` disallowing all. Do not flip it.
- `docs/ENGINEERING.md` readability limits apply (files under about 300 lines, functions small). `npm run check` and `npm run build` pass before every commit. Implementers never stage `.superpowers/`.

## Review Focus

1. An occupation with no 189 pool (279 of 493, e.g. the `no189PoolCore` fixture): no 189 bottom line, no "Is N points enough" question, the page leads with 190/491; tested in Tasks 2 and 4.
2. An occupation whose every count is "<20" (192): page builds, shows "under 20" everywhere, is `noindex` and absent from the sitemap; tested in Tasks 4 and 6.
3. A missing or failed detail file: the cohort section and the "EOIs like these" sentence are left out and the page still builds; tested in Tasks 2 and 3.
4. A state with no `stateInvited` entry for the snapshot month: "Not published", never "0"; tested in Task 3.
5. Long names at 320–390px ("Software and Applications Programmers nec"): heading wraps, round cards stay four per row, no horizontal scroll; checked in Task 7's browser pass.

---

### Task 1: Site settings, slugs and occupation paths

**Files:**

- Create: `src/lib/site.ts`, `src/lib/occupation-page/slug.ts`, `src/lib/occupation-page/slug.test.ts`
- Modify: `src/app/layout.tsx` (metadata `robots` and `metadataBase` from `site.ts`)

**Interfaces:**

- Produces: `SITE_NAME = "MigrateLens"`, `SITE_URL = "https://migratelens.com"` (placeholder until the founder confirms the domain), `SITE_INDEXABLE = false`; `occupationSlug(entry: { code: string; name: string }): string`; `codeFromSlug(slug: string): string | null` (the trailing 6-digit code, else null); `occupationPath(entry): string` (`/occupations/<slug>/`).

- [ ] **Step 1: Write the failing tests** in `slug.test.ts`:
  - `occupationSlug({ code: "261313", name: "Software Engineer" })` is `"software-engineer-261313"`; `{ code: "254499", name: "Registered Nurses nec" }` is `"registered-nurses-nec-254499"`; `{ code: "231213", name: "Ship's Master" }` is `"ship-s-master-231213"`; `{ code: "1", name: "  A, B / C  " }` has no leading, trailing or doubled hyphens.
  - `codeFromSlug("software-engineer-261313")` is `"261313"`; `codeFromSlug("software-engineer")` and `codeFromSlug("")` are `null`.
  - Every entry of `src/data/occupation-index.json` round-trips: `codeFromSlug(occupationSlug(e)) === e.code`, and all slugs are unique.
  - `occupationPath({ code: "261313", name: "Software Engineer" })` is `"/occupations/software-engineer-261313/"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/occupation-page/slug.test.ts`; expect failures (module missing).
- [ ] **Step 3: Implement** `site.ts` and `slug.ts` (lower-case, every run of non-alphanumerics becomes one hyphen, trim hyphens, append `-<code>`). In `layout.tsx` set `metadataBase: new URL(SITE_URL)` and `robots: SITE_INDEXABLE ? { index: true, follow: true } : { index: false, follow: false }`.
- [ ] **Step 4: Run** the test file, then `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(seo): site settings and occupation slugs`.

### Task 2: The page's summary ("What the data says") and chips

**Files:**

- Create: `src/lib/occupation-page/summary.ts`, `src/lib/occupation-page/summary.test.ts`

**Interfaces:**

- Consumes: `OccupationCore`, `OccupationDetail`, `FederalList | null`; `Round` is exported from `src/lib/report/round-status.ts`; `StateRuleData` from `src/lib/report/state-outlook-view.ts`.
- Produces:
  - `roundsSentence(name: string, rounds189: Round[]): string`
  - `poolSentence(name: string, core: OccupationCore): string`
  - `likeTheseSentence(name: string, core: OccupationCore, detail: OccupationDetail | null): string | null`
  - `occupationSummary(core: OccupationCore, detail: OccupationDetail | null): string[]` (two or three sentences, in page order)
  - `statusChips(core: OccupationCore, federal: FederalList | null): { label: string; tone: "red" | "amber" | "green" | "neutral" }[]`
  - `mostCommonScore(byScore: ScoreCounts): { score: number; count: number } | null` (ignores `"<20"` cells; ties go to the higher count, then the lower score)

- [ ] **Step 1: Write the failing tests**, with the real records (`loadOccupationCore` / `loadOccupationDetail` as in `src/lib/home/try-it.test.ts`) and the fixtures in `src/lib/report/__fixtures__/scorecard.ts`:
  - `roundsSentence("Software Engineer", core261313.rounds189)` is `"189 hasn't listed Software Engineer in its last four rounds; the last cut-off was 95 points, in Nov 2024."`
  - `roundsSentence("Registered Nurses nec", core254499.rounds189)` is `"189 listed Registered Nurses nec in each of its last four rounds, at 70–80 points."`
  - With only `null` cut-offs: `"189 hasn't listed X in any round we can read."`; with `occasionalCore.rounds189`: begins `"189 listed X in 2 of its last four rounds, at "`.
  - `poolSentence("Software Engineer", core261313)` is `"The 189 pool holds 9,464 EOIs; the most common score is 75 points (1,552 EOIs)."`
  - `poolSentence` for `no189PoolCore` starts `"No 189 EOIs are published for "` and names the 190 and 491 pool totals.
  - `likeTheseSentence` uses the submission month six months before `core.asAt` (`"2026-04"` for `"2026-10"`) and equals `buildEoisLikeYours({ occupationName, core, detail, submittedMonth: "2026-04", asOf: "2026-10-31" })`'s sentence; it is `null` when `detail` is `null` or the result is not `"ready"`.
  - `occupationSummary(no189PoolCore, null)` contains no sentence starting `"189 "` and no `"EOIs submitted"`.
  - `statusChips(core261313, federal)` is `[{ label: "189: No recent invitations", tone: "red" }, { label: "190 eligible", tone: "neutral" }, { label: "491 eligible", tone: "neutral" }]`; a code `false` on the federal list gives `"Not on the federal list for 190"`; a `null` federal list leaves the 190/491 chips out.
  - Every string from these functions, over all scorecard fixtures and both real records, passes `BANNED_COPY`.
- [ ] **Step 2: Run** `npx vitest run src/lib/occupation-page/summary.test.ts`; expect failures.
- [ ] **Step 3: Implement** with `summarise189Rounds` for the four-round window and `CHIP_LABEL`/the scorecard tones for the 189 chip; the cut-off range uses the listed cut-offs among the last four rounds (`lo === hi` prints one number).
- [ ] **Step 4: Run** the tests and `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(occupation-page): summary sentences and status chips`.

### Task 3: Chart and table rows (pool bars, round cards, cohorts, states)

**Files:**

- Create: `src/lib/occupation-page/charts.ts`, `charts.test.ts`, `src/lib/occupation-page/states.ts`, `states.test.ts`

**Interfaces:**

- Produces (charts):
  - `poolBars(pool: { total: CountText; byScore: ScoreCounts } | undefined): { score: number; label: string; masked: boolean; share: number }[]` sorted by score ascending; `label` is the formatted count or `"under 20"`; `share` is 0–1 against the largest bar (a masked bar counts as 19).
  - `roundCards(rounds189: Round[], n = 8): { date: string; label: string; cutoff: number | null }[]`, oldest first; `label` is `formatDate(date)`.
  - `roundsNote(rounds189: Round[], n = 8): string`
  - `cohortRows(detail: OccupationDetail | null, asAt: MonthKey, months = 12): CohortRow[] | null` where `CohortRow = { month: string; segments: { key: "INVITED" | "LODGED" | "SUBMITTED" | "HOLD" | "CLOSED"; label: string; count: Interval; masked: boolean }[]; total: Interval }`, months oldest first, labels `"Invited"`, `"Lodged a visa"`, `"Still waiting"`, `"On hold"`, `"Closed"`; a status missing from a fetched month is 0; `null` without 189 cohorts.
  - `cohortNote(name: string, rows: CohortRow[]): string`
- Produces (states):
  - `stateRows(code: string, core: OccupationCore, data: StateRuleData): StateRow[]` with `StateRow = { state: StateCode; name: string; onList: string; openTo: string; invited190: string; href: string | null }`, in the order NSW, VIC, QLD, WA, SA, ACT, TAS, NT.

- [ ] **Step 1: Write the failing tests:**
  - `roundCards(core261313.rounds189)` cut-offs, oldest first: `[null, 100, 100, 95, null, null, null, null]`, first label `"18 Dec 2023"`.
  - `roundsNote(core261313.rounds189)` is `"Not listed in the last 4 rounds. The last 8 rounds listed it 3 times, at 95 to 100 points."`; for 254499 `"Listed in every one of the last 8 rounds, at 65 to 85 points. The latest cut-off was 70."`; all `null` gives `"Not listed in any of the last 8 rounds."`; a newest round listed with others missing gives `"Listed in k of the last 8 rounds, at … The latest cut-off was c."`.
  - `poolBars(core261313.pool["189"])`: the 75-point bar has `share` 1 and label `"1,552"`; the 110 bar is `masked` with label `"under 20"`.
  - `cohortRows(detail254499, "2026-10")` has 12 rows, the last `month` `"Oct 2026"`, its `INVITED` count `{min: 40, max: 40}`, and a masked `LODGED`; `cohortRows(null, …)` is `null`.
  - `cohortNote` for 254499 starts `"Across the last 12 submission months, "` and contains `"are invited"`; for 261313 the invited count reads as a range, never `"0"` when any month is masked.
  - `stateRows("254499", core, stateRuleData)`: NSW `onList` `"190"`, `openTo` `"Living in NSW, elsewhere in Australia or offshore"`; QLD `onList` `"190 and 491"`, `openTo` `"Living in QLD or offshore"`; VIC `onList` `"Rules being checked"`; VIC `invited190` `"337–375"`; NSW `"327–346"`; every `href` is an `https://` URL taken from that state's 190 rule (`data.rules.rules`, first stream's `status.source`).
  - `stateRows("261313", …)`: QLD `openTo` `"Living in QLD only"`; NSW `invited190` `"0–38"`.
  - A core whose `stateInvited["190"].NSW` has no key for `asAt` gives NSW `invited190` `"Not published"`.
  - A code missing from an imported list gives `onList` `"Not on its 2026–27 list"`.
  - All strings pass `BANNED_COPY`.
- [ ] **Step 2: Run** the two test files; expect failures.
- [ ] **Step 3: Implement.** Sums use `parseCountText` and `sumIntervals`; formatting uses `formatCount`. `openTo` maps list cohorts `living-in-state` → `"Living in {code}"`, `living-in-other-state` → `"elsewhere in Australia"`, `offshore` → `"offshore"`, joined with `joinWords(…, "or")`; only `living-in-state` → `"Living in {code} only"`.
- [ ] **Step 4: Run** the tests and `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(occupation-page): pool bars, round cards, cohorts and state rows`.

### Task 4: Questions, related occupations, metadata, JSON-LD and the sitemap rule

**Files:**

- Create: `src/lib/occupation-page/faq.ts`, `faq.test.ts`, `src/lib/occupation-page/meta.ts`, `meta.test.ts`

**Interfaces:**

- Consumes: `StateRow` (Task 3), `occupationPath`, `SITE_URL` (Task 1), `mostCommonScore` (Task 2).
- Produces (in `faq.ts`):
  - `export type Faq = { question: string; answer: string }`
  - `occupationFaq(core: OccupationCore, rows: StateRow[]): Faq[]`
- Produces (in `meta.ts`):
  - `relatedOccupations(code: string, index: OccupationIndexEntry[], limit = 6): { code: string; name: string; path: string }[]` (same first four digits, `hasData`, not itself, by code)
  - `isIndexable(core: OccupationCore): boolean` (false when no pool, or every pool total and score count is `"<20"`)
  - `pageTitle(core: OccupationCore): string`, `pageDescription(summary: string[]): string`
  - `occupationJsonLd(core: OccupationCore, faq: Faq[], summary: string[], checkedAt: string): object[]`
  - `sitemapEntries(cores: OccupationCore[], index: OccupationIndexEntry[], checkedAt: string): { url: string; lastModified: string }[]`

- [ ] **Step 1: Write the failing tests:**
  - FAQ for 261313: three questions, in order `"When did 189 last invite Software Engineer?"`, `"Which states nominate Software Engineer?"`, `"Is 75 points enough for Software Engineer 189?"`. The first answer contains `"7 Nov 2024"` and `"95 points"`. The third contains `"no recent cut-off"` and the count of EOIs above 75 from `poolPosition(core, null, "189", 75, null).higher` formatted with `formatCount`, and ends `"Past cut-offs are history, not a promise."`
  - FAQ for 254499: the third question is `"Is 70 points enough for Registered Nurses nec 189?"` and its answer contains `"70 to 80 points"`; the second names `"Victoria"` as the state with the most 190 invitations.
  - FAQ for `no189PoolCore` has two questions and none mentions points enough.
  - `relatedOccupations("261313", index)` codes start `"2613"`, exclude `"261313"`, and contain `"261312"`.
  - `isIndexable` is `true` for 261313 and `false` for `allMaskedCore`.
  - `pageTitle(core261313)` is `"Software Engineer (261313): 189, 190 and 491 EOIs and cut-offs, Oct 2026"`; `pageDescription` is at most 160 characters, ends at a word boundary, and adds `"…"` only when it trimmed.
  - `occupationJsonLd` returns `Dataset`, `FAQPage` and `BreadcrumbList` objects; the Dataset's `license` is `"https://creativecommons.org/licenses/by/3.0/au/"`, its `creator` names the Department of Home Affairs, and every URL starts with `SITE_URL`.
  - `sitemapEntries` includes `SITE_URL + "/occupations/"` and 261313's page, excludes `allMaskedCore`'s page, and every URL ends in `/`.
  - All FAQ strings pass `BANNED_COPY`.
- [ ] **Step 2: Run** the two test files; expect failures.
- [ ] **Step 3: Implement.** JSON-LD is plain objects; serialisation happens in the page (Task 6).
- [ ] **Step 4: Run** the tests and `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(occupation-page): questions, related occupations, metadata and sitemap rules`.

### Task 5: Occupation page components

**Files:**

- Create in `src/components/occupation/`: `occupation-summary.tsx`, `pool-tabs.tsx` (client), `round-cards.tsx`, `cohort-bars.tsx`, `state-table.tsx`, `occupation-faq.tsx`, `related-occupations.tsx`, with CSS modules beside them
- Test: `src/components/occupation/round-cards.test.tsx` only if the repo already renders components in tests; otherwise the view-model tests stand and the visual check is Task 7

**Interfaces:**

- Consumes: the view-model outputs of Tasks 2–4. Components take those outputs as props and compute nothing.
- Produces: `OccupationSummary({ chips, sentences, sourceLine })`, `PoolTabs({ pools: Record<Visa, PoolBar[] | null>, totals: Record<Visa, string | null> })`, `RoundCards({ cards, note })`, `CohortBars({ rows, note })`, `StateTable({ rows, asAt })`, `OccupationFaq({ items })`, `RelatedOccupations({ items, unitGroup })`.

- [ ] **Step 1: Build each component to the mockup** (round cards as option A: listed card on `--status-watching-bg` with a slate border, cut-off in Newsreader; unlisted card dashed with "Not listed" in `--status-not-open-fg`; eight columns, four at phone width). `PoolTabs` renders all three visas in the HTML and shows one at a time (Mantine `Tabs` with `keepMounted`, or equivalent), all visible in print. Masked bars and segments are striped and labelled "under 20". `StateTable` links each state name to `href` (new tab, `rel="noreferrer"`).
- [ ] **Step 2: Run** `npm run check`; expect PASS, including the 12px floor test.
- [ ] **Step 3: Commit** `feat(occupation-page): page components`.

### Task 6: The routes: occupation page, index, navigation, sitemap and robots

**Files:**

- Create: `src/app/occupations/[slug]/page.tsx`, `src/app/occupations/page.tsx`, `src/components/occupation/occupation-search.tsx` (client), `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/robots.test.ts`
- Modify: `src/components/site-header.tsx` (add `["/occupations/", "Occupations"]` first in `links`)

**Interfaces:**

- Consumes: everything above; `loadManifest`, `loadOccupationCore`, `loadOccupationDetail`; `occupationIndex`; `stateRuleData`; `TryIt`.

- [ ] **Step 1: Write the failing test** `robots.test.ts`: the default export of `src/app/robots.ts` returns rules disallowing `/` for every user agent while `SITE_INDEXABLE` is false, and a `sitemap` of `SITE_URL + "/sitemap.xml"`.
- [ ] **Step 2: Implement the occupation route:** `generateStaticParams` returns `{ slug: occupationSlug(e) }` for every index entry with `hasData`; `dynamicParams = false`; `generateMetadata` gives `pageTitle`, `pageDescription`, `alternates.canonical` (`occupationPath`) and `robots` `noindex` when `!SITE_INDEXABLE || !isIndexable(core)`. The page renders, in the spec's order: breadcrumb, H1 and subtitle, `OccupationSummary`, `PoolTabs`, `RoundCards` (only with a 189 pool), `CohortBars` (only with rows), a sidebar with `TryIt defaultOccupation={code}` and a "Check my points, free" link to `/check/?occupation={code}`, `StateTable`, `OccupationFaq`, `RelatedOccupations`, and the sources line with "Last updated {formatDate(manifest.checkedAt)}" and "General information, not migration advice. MigrateLens is not a registered migration agent." JSON-LD goes in one `<script type="application/ld+json">` per object, serialised with `<` escaped as `<`.
- [ ] **Step 3: Implement the index:** H1 "Occupations", one sentence on what each page shows, `OccupationSearch` filtering by name or code, and an A–Z list grouped by first letter; occupations without data are listed without a link and marked "No published data". Metadata title "Occupations: 189, 190 and 491 data for every skilled occupation".
- [ ] **Step 4: Implement** `sitemap.ts` (`dynamic = "force-static"`, `sitemapEntries` over every `hasData` core) and `robots.ts` (`dynamic = "force-static"`, disallow all while `SITE_INDEXABLE` is false, allow all otherwise, sitemap URL either way); add the header link.
- [ ] **Step 5: Run** `npm run check` and `npm run build`; expect PASS, `out/occupations/` holding 479 page folders plus `index.html`, and `out/sitemap.xml` and `out/robots.txt` present. Count with `ls out/occupations | wc -l` (480).
- [ ] **Step 6: Commit** `feat(occupation-page): occupation pages, index, sitemap and robots`.

### Task 7: Browser check, links from the rest of the site, and docs

**Files:**

- Modify: `src/components/home/try-it.tsx` (a "See the {name} page" link to `occupationPath`), `CLAUDE.md` (architecture: the occupation pages, `site.ts`, the launch switch), `docs/HANDOFF.md`, `docs/STRATEGY.md` (decision log: round cards; alert box deferred until an email service is chosen; tier 1 shipped), `docs/DATA.md` (the pages read core and detail at build)

- [ ] **Step 1:** Add the try-it link (it shows only when the view has data). Run `npm run check`.
- [ ] **Step 2: Browser pass** against the built `out/` (`python3 -m http.server 3017 --bind 127.0.0.1 --directory out`) at 1440 and 390 (and 320 for the long name) for `/occupations/`, 261313, 254499, an all-"<20" occupation, an occupation without a 189 pool, and "Software and Applications Programmers nec" (261399): no console errors, no horizontal scroll, the tabs switch, the search filters, the `<head>` holds the title, description, canonical, `noindex` and three JSON-LD scripts, print media shows every section. Save screenshots under the plan's `.superpowers` workspace.
- [ ] **Step 3:** Update the docs listed above.
- [ ] **Step 4: Run** `npm run check` and `npm run build`; expect PASS.
- [ ] **Step 5: Commit** `docs(occupation-page): record the occupation pages and link them from the try-it`.
