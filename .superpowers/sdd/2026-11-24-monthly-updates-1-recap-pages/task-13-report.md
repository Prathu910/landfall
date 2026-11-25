# Task 13 report: index page, sitemap, footer, Lighthouse and docs

Status: DONE. Base f58d58f. Commits:

- 09fc949 feat(updates): /updates/ index, sitemap, footer link and Lighthouse pages
- b1cc161 docs: monthly updates, recap pages and the frozen sample

## What I implemented

- `src/lib/updates/index-view.ts`: `buildUpdatesIndex(recaps)` sorts the facts newest first itself and throws on an empty list. It returns `answer` ("The latest update covers SkillSelect data as at 31 October 2026.", or "The latest update covers the 189 invitation round on {date}." when the newest recap is round-only), `latest` (`month`, `path`, `stamp` = the passport stamp, `headline` = the recap H1, `figures` = the first three passport figures, so a round-only month shows only its two round figures and nothing from the dashboard) and `months` (`month`, `path`, `headline`, `roundDate` ISO or null, `roundText` "189 round 15 Oct 2026" / "No 189 round"). It reuses `buildHero` and `buildPassport`, so the index can never disagree with the recap. It also has `updatesIndexDescription` (answer plus a coverage sentence, at most 155 characters), `updatesIndexJsonLd` (CollectionPage with an ItemList of every recap, then a BreadcrumbList Home › Updates) and the constants `UPDATES_INDEX_PATH`, `UPDATES_INDEX_H1` ("SkillSelect monthly updates"), `UPDATES_INDEX_TITLE` and `UPDATES_INDEX_INTRO`.
  - Beyond the brief's interface I added `latest.month`, `months[].month` and `months[].roundText`, so the component only renders view-model strings. `roundDate` stays ISO for `<time dateTime>`.
- `src/lib/updates/sitemap.ts` (the brief allowed this file or `occupation-page/meta.ts`): `updatesSitemapEntries(recaps)` returns `/updates/`, dated by the newest `updatedAt`, then every recap dated by its own `updatedAt`. Round-only recaps are included, and an empty list returns `[]`. `src/app/sitemap.ts` adds these entries after the existing ones.
- `src/app/updates/page.tsx` and `page.module.css`: the sage hero (breadcrumb Home › Updates, eyebrow, H1, the bold dated answer plus an intro sentence), then the latest card (RoundStamp at 230 px for the 12 px ring floor; kicker "Latest update · October 2026"; the headline as an h2 link; three figures; a "Read the October 2026 update" button). After that comes a paper band "All SkillSelect updates" with an `ol` of months (month, h3 link headline, round date), then the shared `RecapCta` and the JSON-LD. Metadata: `title.absolute` (R20), description, canonical `/updates/`, openGraph with `/og.png`. Robots come from the layout, so indexing follows `SITE_INDEXABLE`. Styling uses tokens only and reuses `recap-hero.module.css` (band, shell, crumb, eyebrow, title, answer, primary) and `recap-parts.module.css` (kicker, heading). It is a Server Component with no client code.
- `src/components/site-footer.tsx`: "Monthly updates" goes in Explore, after "States".
- `scripts/lighthouse/pages.ts`: adds `{ path: "/updates/", gated: ALL }` and the newest recap from `listRecapMonths().slice(0, 1)` (equivalent to `[0]`, but empty-safe).
- Docs:
  - `docs/DATA.md`: replaced the "pinned" sentence with the brief's wording. Added `src/data/updates/` and `src/data/sample/2026-10/` to the layout. Added bullets on who writes `src/data/`, rounds v2 (R1, `data/raw/rounds/`), recap facts and the frozen sample. Also fixed the Task 5 deferred minor: the index-file row now mentions `lastAsAt`/`lastCheckedAt` (the `lastAsAt` bullet already existed).
  - `scripts/README.md`: same replacement. The facts section notes that round-only files are pages and are in the sitemap. New "Frozen sample" section on `sample:freeze`.
  - `CLAUDE.md`: a "Monthly updates" architecture bullet, and the Sample page bullet now describes the frozen 2026-10 sample.
  - `docs/ENGINEERING.md`: the Lighthouse paragraph says the updates rows are computed. The budget line gains the measured sizes: `/updates/` 30 KB CSS / 182 KB JS; `/updates/2026-10/` 32 KB CSS / 183 KB JS; recap HTML 84 KB gzipped.
  - `docs/HANDOFF.md`: a new top section for Plan 1, with results and the founder review list from Task 11.

## Tests and verification

TDD:

- RED: `npx vitest run src/lib/updates/index-view.test.ts src/lib/updates/sitemap.test.ts` failed with both test files erroring on import: "Failed to resolve import ./sitemap" and the same for `./index-view`. This was expected because neither module existed yet.
- GREEN: the same command passed 2 files, 12 tests. After adding the copy test: 13/13.
- Tests cover:
  - the 2026-10 answer, latest card (stamp text, headline, figures 159 / 65–100 / about 167,000) and the month entry;
  - a round-only newest month (answer from the 19 Nov round, at most 3 figures and none about the pool);
  - newest-first ordering from unsorted input, a no-round month (`roundDate: null`, "No 189 round") and the empty-list error;
  - JSON-LD types, URLs and positions;
  - BANNED_COPY over the view, JSON-LD, title, intro and description, plus the description's ≤155 length;
  - sitemap: 2026-10 is `lastModified: "2026-11-24"` for both the index and the recap, the round-only recap is included, the index is dated by the newest `updatedAt`, and an empty list gives `[]`.

Full suite:

- `npm run check`: exit 0. 163 files and 1,673 tests passed. Lint has 0 errors and 1 warning, the known `.superpowers` brainstorm asset that was deferred earlier.
- An earlier `npm run check` run hit 1–3 vitest 5 s timeouts (`visa-cards.test.ts` and others) while the load average was 17. That file passes alone, and the full suite passed on the re-run.

Build and sitemap:

- `npm run build`: exit 0; `/updates` and `/updates/2026-10` are prerendered.
- `grep -c "/updates/2026-10/" out/sitemap.xml` = 1, and `/updates/` is in the sitemap with lastmod 2026-11-24.

Browser check: built `out/` served on 127.0.0.1:3017 (stopped afterwards), viewed in headless Chrome via puppeteer-core at 1280 and 390 px, light and dark. No horizontal overflow, and the theme attribute is correct in each. Screenshots are in `task-13-screens/updates-{1280,390}-{light,dark}.png`.

### Lighthouse

`npm run lighthouse -- --only updates` and `-- --only /`, median of 3 runs, served from `out/`.

| Page              | Form    | Scheme | Perf | A11y | BP  | SEO | LCP    | TBT  | CLS   | CPU  |
| ----------------- | ------- | ------ | ---- | ---- | --- | --- | ------ | ---- | ----- | ---- |
| /updates/         | mobile  | light  | 100  | 100  | 100 | 100 | 901 ms | 4 ms | 0.000 | 4238 |
| /updates/         | desktop | light  | 100  | 100  | 100 | 100 | 244 ms | 0 ms | 0.000 | 4234 |
| /updates/2026-10/ | mobile  | light  | 100  | 100  | 100 | 100 | 1.1 s  | 7 ms | 0.000 | 4244 |
| /updates/2026-10/ | desktop | light  | 100  | 100  | 100 | 100 | 291 ms | 0 ms | 0.016 | 4235 |
| /updates/         | mobile  | dark   | –    | 100  | –   | –   | –      | –    | –     | 4231 |
| /updates/         | desktop | dark   | –    | 100  | –   | –   | –      | –    | –     | 4251 |
| /updates/2026-10/ | mobile  | dark   | –    | 100  | –   | –   | –      | –    | –     | 4147 |
| /updates/2026-10/ | desktop | dark   | –    | 100  | –   | –   | –      | –    | –     | 4211 |
| /                 | mobile  | light  | 100  | 100  | 100 | 100 | 1.1 s  | 4 ms | 0.000 | 4252 |
| /                 | desktop | light  | 100  | 100  | 100 | 100 | 286 ms | 0 ms | 0.029 | 4230 |
| /                 | mobile  | dark   | –    | 100  | –   | –   | –      | –    | –     | 4163 |
| /                 | desktop | dark   | –    | 100  | –   | –   | –      | –    | –     | 4254 |

The first run happened during Spotlight indexing (`mds_stores` and `mediaanalysisd` busy, CPU ~860). It read mobile Performance 95 for `/updates/` and 84 for `/updates/2026-10/` (TBT 260 and 624 ms). A mobile re-run, and then the full run in the table, at normal CPU (~4,240) gave 100. Best Practices on the recap is now 100 (it was 96 in Task 12) because the breadcrumb's `/updates/` link resolves.

I did not run the full `npm run lighthouse` matrix (all 18 pages). Only the updates rows and `/` were run, as the brief allowed. Every other page shares only the footer change, which adds one link.

## Files changed

- Created: `src/app/updates/page.tsx`, `src/app/updates/page.module.css`, `src/lib/updates/index-view.ts`, `src/lib/updates/index-view.test.ts`, `src/lib/updates/sitemap.ts`, `src/lib/updates/sitemap.test.ts`
- Modified: `src/app/sitemap.ts`, `src/components/site-footer.tsx`, `scripts/lighthouse/pages.ts`, `CLAUDE.md`, `docs/DATA.md`, `docs/ENGINEERING.md`, `docs/HANDOFF.md`, `scripts/README.md`

## Self-review notes and concerns

- The page imports `recap-hero.module.css` and `recap-parts.module.css` from `src/components/updates/` instead of duplicating hero styles. This couples the index to those modules' class names. The alternative was a copy of about 60 lines of CSS.
- The latest card's headline and its "Read the … update" button both link to the same recap. This is deliberate (title link plus a clear action) and Lighthouse does not flag it.
- Copy that only exists on the index is new: "SkillSelect updates", "Latest update · {Month}", "All SkillSelect updates", "Every month, newest first", "No 189 round", the intro sentence and the title "SkillSelect monthly updates: 189 rounds, 190 and 491 by state | MigrateLens". It passes BANNED_COPY and may go on the founder review list.
- Sitemap `/updates/` lastmod is the newest `updatedAt` across files. That is not necessarily the newest month's, because an older month can't gain sections after its successor, but this is exact either way.
- Nothing pushed.
