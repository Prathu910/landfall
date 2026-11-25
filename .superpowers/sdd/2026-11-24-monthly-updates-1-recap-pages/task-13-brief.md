### Task 13: Index page, sitemap, footer, Lighthouse and docs

**Files:**

- Create: `src/app/updates/page.tsx`, `src/app/updates/page.module.css`, `src/lib/updates/index-view.ts`, `src/lib/updates/index-view.test.ts`
- Modify: `src/app/sitemap.ts`, `src/lib/occupation-page/meta.ts` (or a new `src/lib/updates/sitemap.ts`) and its test, `src/components/site-footer.tsx` ("Monthly updates" in Explore, after "States"), `scripts/lighthouse/pages.ts`, `docs/DATA.md` and `scripts/README.md` (replace the "pinned to `--as-at 2026-10`" sentences with "new months arrive through the monthly pull request (`docs/superpowers/specs/2026-11-24-monthly-updates-design.md`)"; describe `src/data/updates/`, `src/data/sample/`, `data/raw/rounds/`, rounds v2 and `lastAsAt`), `docs/HANDOFF.md`, `CLAUDE.md` (architecture bullets for `/updates/` and the frozen sample)

**Interfaces:**

- Produces: `buildUpdatesIndex(recaps: RecapFacts[]): { latest: { path; stamp; headline; figures: { value; label }[] }; months: { path; headline; roundDate: string | null }[]; answer: string }` ("The latest update covers SkillSelect data as at {date}", or the latest round's date when the newest recap is round-only); `updatesIndexJsonLd(view): object[]` (`CollectionPage` with an `ItemList`, `BreadcrumbList`); `updatesSitemapEntries(recaps): { url; lastModified }[]` (`/updates/` dated by the newest `updatedAt`, each recap by its own).
- `scripts/lighthouse/pages.ts`: add `{ path: "/updates/", gated: ALL }` and the newest recap's path computed from `listRecapMonths()[0]`.

- [ ] **Step 1: Write the failing tests**: index answer and ordering for `[2026-10]` and for a round-only newest month; sitemap entries for 2026-10 (`lastModified: "2026-11-24"`) and inclusion of a round-only recap.
- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Verify** `npm run check`, `npm run build`, `grep -c "/updates/2026-10/" out/sitemap.xml` = 1, then `npm run lighthouse`. Expected: exit 0, every gated score 100 including `/updates/` and `/updates/2026-10/`; a browser check of `/updates/` at 1280 and 390 px in both themes.
- [ ] **Step 6: Commit** `feat(updates): /updates/ index, sitemap, footer link and Lighthouse pages` and `docs: monthly updates, recap pages and the frozen sample`.
