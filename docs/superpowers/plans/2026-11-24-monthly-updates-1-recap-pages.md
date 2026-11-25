# Monthly updates 1: foundation and recap pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unpin the site from the 2026-10 snapshot safely (frozen `/sample/`, sorted live-data tests, kept pages for dropped occupations), then ship `/updates/2026-10/` and `/updates/` from a frozen facts file, indexable and at Lighthouse 100.

**Architecture:** A pure facts layer in `src/lib/updates/` reduces the current `src/data/` (cores, manifest, `rounds.json`) into `src/data/updates/<YYYY-MM>.json`, with a `rounds[date]` section and a `data` section written independently by `npm run updates:generate`. Pure view-models turn a facts file into the recap page, FAQ, metadata and JSON-LD; Server Components render them statically. The round parser gains totals, tie-break dates and the state nominations table (`rounds.json` v2).

**Tech Stack:** Next.js 16 static export (read `node_modules/next/dist/docs/01-app/` for `generateStaticParams`, `generateMetadata` and `sitemap` before writing routes), TypeScript strict, Vitest 4, tsx for scripts, CSS Modules with `light-dark()` tokens.

**Spec:** `docs/superpowers/specs/2026-11-24-monthly-updates-design.md` (sections 3, 6.2–6.6, 6.13, 6.14, 6.17, 8 step 0–1). Visual target: `/Users/aveomac/aveo-projects/landfall/.superpowers/brainstorm/round-recap-2026-11-24/page/updates-2026-10.html` and `screens/recap-*.png`. That folder is untracked, so a worktree won't have it: read it from the main checkout's absolute path. Where the spec and the mockup disagree, the spec wins (see "Spec decisions" below).

**Branch:** `roadmap/monthly-updates` (the design and these plans are already there). Ledger: `.superpowers/sdd/2026-11-24-monthly-updates/progress.md` (create it; record rulings, outcomes and deferred issues).

## Global Constraints

- Node 22.12+. `npm run check` and `npm run build` pass after every task; `npm run lighthouse` passes at the end (`/updates/` and the latest recap score 100 on every category, mobile and desktop).
- Static export only; recap pages are statically generated Server Components reading files at build. No route handlers, server actions or dynamic rendering.
- Only scripts write `data/raw/` and `src/data/`, including `src/data/updates/` and `src/data/sample/`. Nothing there is hand-edited.
- Files in `src/lib/data/`, `src/lib/updates/` and `scripts/` use relative imports, not `@/` (they run under tsx and vitest).
- Number rules (spec 6.13), binding on every string: "<20" is the interval 0–19 and is never collapsed; INVITED is never summed across months or visas; visas and states are never added together; `ANY` is "State not recorded", never a state; a state figure is shown as "at least {floor}" with "+ N hidden small counts", and an all-masked state reads "under 20 for each occupation", never 0; the nominations table is copied as published (including "<5"), labelled "A different measure"; "about N" (midpoint rounded to the nearest 1,000) only when the range width is at most 2% of its midpoint, always with the range beside it; movers use exact counts only; a `null` cut-off is "Not listed"; a skipped round is absent; no next-round date; no causal claims.
- Copy: every string passes `BANNED_COPY` (`src/lib/report/copy.ts`); say "EOIs", never "people" or "applicants"; occupation names link to `occupationPath` pages; internal links end in `/`.
- Styling: CSS Modules, tokens only (`src/app/colour-literals.test.ts`), every new colour token is `light-dark()` with its light value in `palette.ts`, dark in `palette-dark.ts` and the `@supports not` fallback regenerated with `lightFallback`; 12 px floor; both themes; stamps never animate; the recap page is not a print target.
- JSON-LD only through `src/lib/seo/json-ld.ts`. Indexing follows `SITE_INDEXABLE`.
- Dates are `YYYY-MM-DD`; "Sydney date" means the Australia/Sydney calendar date; month names are fixed strings, never ICU.

## Spec decisions made in this plan

1. **Mockup vs spec.** The dateline reads "Updated {updatedAt}", not the mockup's "Published". Card 2's picks follow `cardPicks` (6.7), not the mockup's pool-based picks. The mockup's hero and FAQ call Victoria "the most" for 190; the spec's rule (a floor strictly above every other state's interval maximum) fails on 2026-10 (NSW 790–6,927), so the FAQ omits that question and the hero says "the highest published minimum of any state" instead.
2. **Sample codes.** The spec's "five occupations" are four unique codes: `254499` (two tabs), `261313`, `221214`, `254412`.
3. **Sample comparison.** `/sample/`'s comparison picker would fetch live cores and label them with the sample's date. On `/sample/` it offers only the frozen sample occupations, preloaded, and never fetches.
4. **Frozen regeneration ignores later revisions.** The next import can write `<view>.rev-<date>.json` for 2026-10, which `readRawView` would prefer. Frozen 2026-10 reads use revisions dated on or before `2026-11-17` only.
5. **`rounds.json` version.** The file has no version today; v2 adds `schemaVersion: 2`. Its types move to `src/lib/data/rounds-file.ts` so `src/lib/updates/` never imports from `scripts/`.
6. **Previous manifest.** After an import the old manifest is gone, so `occupationsAdded`/`occupationsRemoved` come from `--previous-manifest <file>`; without it they are `null` (so for 2026-10).
7. **Dropped occupations need a check date.** The mark is `lastAsAt` plus `lastCheckedAt` (the previous manifest's `checkedAt`), so the page and the sitemap can date it.
8. `.prettierignore` gains `src/data/updates/` and `src/data/sample/` (only `src/data/*.json` is ignored today).

## Review Focus

- **A month with a data section and no round** (the next months often): H1 and title take the no-round variant, the 189 part says "No 189 round in {Month YYYY}; the last was on {date}", and links that round's recap only if a facts file for its month exists. Test in Task 11.
- **A round-only facts file** (`data: null`): only [R] parts render, the "will be added here when they are published" sentence appears once, no `Dataset` JSON-LD, the page is in the sitemap. Test in Tasks 11 and 13.
- **Two rounds in one month:** both render newest first; the H1, title and passport use the newest. Test in Task 11.
- **Unmatched round names** (`code: null`): counted as listed and shown unlinked, never in `cardPicks`, movers or `notable189`. Test in Task 7.
- **A previous month that was not fetched:** national previous values, previous floors and the spotlight series are `null`/skipped, never zero; movers are empty. Test in Tasks 8 and 9.

---

### Task 1: Frozen 2026-10 snapshot for tests

**Files:**

- Modify: `scripts/import/raw-store.ts` (`readRawView` options), `scripts/import/generate.ts` (`GenerateInput.revisionsUpTo`), `src/lib/data/legacy.test.ts` (use the helper)
- Create: `scripts/import/frozen-snapshot.ts`, `src/lib/data/__fixtures__/frozen-2026-10.ts`
- Test: `scripts/import/raw-store.test.ts`, `scripts/import/frozen-snapshot.test.ts`

**Interfaces:**

- Produces: `readRawView(root, asAt, viewId, options?: { revisionsUpTo?: string }): RawViewFile | undefined` (ignores `.rev-<date>` files dated after `revisionsUpTo`); `GenerateInput.revisionsUpTo?: string`.
- Produces: `FROZEN_2026_10 = { asAt: "2026-10", checkedAt: "2026-11-17", roundsUpTo: "2026-10-31", revisionsUpTo: "2026-11-17" } as const`; `generateFrozenSnapshot(rawRoot: string, rounds: RoundPages): GeneratedData` (filters rounds and skipped to `roundsUpTo`).
- Produces (test-only, memoised per worker): `frozenCore(code): OccupationCore | null`, `frozenDetail(code): OccupationDetail | null`, `frozenIndex(): OccupationIndexEntry[]`, `frozenManifest(): Manifest`.

- [ ] **Step 1: Write the failing tests**

```ts
// raw-store.test.ts
it("ignores a revision fetched after revisionsUpTo", () => {
  // tmp root: status-history.json, status-history.rev-2026-12-14.json
  expect(
    readRawView(root, "2026-10", "status-history", {
      revisionsUpTo: "2026-11-17",
    })?.fetchedAt,
  ).toBe(baseFile.fetchedAt);
  expect(readRawView(root, "2026-10", "status-history")?.fetchedAt).toBe(
    revision.fetchedAt,
  );
});
// frozen-snapshot.test.ts
it("regenerates the 2026-10 snapshot", () => {
  const data = generateFrozenSnapshot(
    "data/raw",
    readRoundsFile(readJson("src/data/rounds.json")),
  );
  expect(data.manifest.snapshotId).toBe("skillselect-2026-10-31");
  expect(data.index).toHaveLength(493);
  expect(data.index.filter((e) => e.hasData)).toHaveLength(479);
  expect(data.rounds.rounds[0].date).toBe("2026-10-15");
});
```

- [ ] **Step 2: Run** `npx vitest run scripts/import/raw-store.test.ts scripts/import/frozen-snapshot.test.ts`. Expected: FAIL (`generateFrozenSnapshot` not defined, option ignored).
- [ ] **Step 3: Implement** the option (filter `revisionNames` by date before `.at(-1)`), thread `revisionsUpTo` through `readRows`, add `frozen-snapshot.ts`, the fixture helper (one cached `generateFrozenSnapshot` call), and switch `legacy.test.ts`'s `generate202610` to the helper.
- [ ] **Step 4: Run** the two files and `npx vitest run src/lib/data/legacy.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `test: regenerate the frozen 2026-10 snapshot in memory`.

### Task 2: Freeze `/sample/` on 2026-10

**Files:**

- Create: `scripts/sample/freeze.ts`, `src/data/sample/2026-10/` (generated: `<code>.json`, `<code>.detail.json`, `meta.json`), `src/lib/sample-data.test.ts`
- Modify: `package.json` (`"sample:freeze": "tsx scripts/sample/freeze.ts"`), `.prettierignore`, `src/lib/sample.ts` (`SAMPLE_CODES`), `src/lib/data/load-server.ts`, `src/app/sample/page.tsx`, `src/components/report/sample-tabs.tsx`, `src/components/report.tsx`, `src/components/report/compare-section.tsx`

**Interfaces:**

- Consumes: `generateFrozenSnapshot` (Task 1).
- Produces: `SAMPLE_CODES: readonly string[]` = unique codes of `EXAMPLES` plus `SAMPLE_COMPARISON` (`["254499", "261313", "221214", "254412"]`); `SampleMeta = { snapshotId; asAt; checkedAt; sources: Manifest["sources"] }`; `loadSampleCore(code)`, `loadSampleDetail(code)`, `loadSampleMeta(): SampleMeta` in `load-server.ts` (read `src/data/sample/2026-10/`, guard with `isOccupationCore`/`isOccupationDetail`).
- Produces: `Report` prop `fixedComparisons?: OccupationEvidence[]`; when present the comparison picker lists only those codes and `useComparison` never fetches.

- [ ] **Step 1: Write the failing tests**

```ts
it("sample records equal the frozen 2026-10 regeneration", () => {
  for (const code of SAMPLE_CODES) {
    expect(loadSampleCore(code)).toEqual(frozenCore(code));
    expect(loadSampleDetail(code)).toEqual(frozenDetail(code));
  }
});
it("dates the sample to 31 Oct 2026, checked 17 Nov 2026", () => {
  expect(loadSampleMeta()).toMatchObject({
    snapshotId: "skillselect-2026-10-31",
    asAt: "2026-10",
    checkedAt: "2026-11-17",
  });
});
it("lists four unique codes", () =>
  expect(SAMPLE_CODES).toEqual(["254499", "261313", "221214", "254412"]));
```

- [ ] **Step 2: Run** `npx vitest run src/lib/sample-data.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the script (writes with the importer's serializer, refuses to run if a record fails its guard), run `npm run sample:freeze`, add the loaders, switch `/sample/` to `loadSample*` only (`reportSource` from `loadSampleMeta()`), pass `fixedComparisons` for the four codes, and add the dated line under the description: "Example reports use SkillSelect data as at 31 Oct 2026."
- [ ] **Step 4: Run** the test, `npm run check`, `npm run build`; then `grep -c "as at 31 Oct 2026" out/sample/index.html` ≥ 1.
- [ ] **Step 5: Commit** `feat(sample): freeze the sample reports on the 2026-10 snapshot`.

### Task 3: Sort the live-data tests

**Files:**

- Modify (move to frozen data: they assert specific figures or labels): `src/lib/outlook/__fixtures__/scenario-input.ts`, `src/lib/outlook/__fixtures__/review-profiles.ts` (these two cover evidence, examples, headline, points-page, read-template, view, visa-cards, improve, review-repros), and the direct readers `src/lib/home/{example,try-it}.test.ts`, `src/lib/occupation-page/{charts,faq,states,summary,meta}.test.ts`, `src/lib/outlook/{charts,evaluate-profile,label-189,label-state,losses,queue-view,route,wait}.test.ts`, `src/lib/report/state-outlook-view.test.ts`, `src/lib/state-outlook/{outlook.real-data,questions,view}.test.ts`, `src/lib/guide/picker-view.test.ts`, `src/lib/data/coverage.test.ts` (its "493 occupations, 479 with data" case), `src/lib/report-evidence.test.ts` (its `LEGACY_CODES` case).
- Modify (keep live: invariants that should stop a bad month): `src/lib/outlook/__fixtures__/sweep.ts` and `sweep-{60,70,80,90}.test.ts`, `src/lib/occupation-page/copy-sweep.test.ts`, `src/lib/occupation-page/slug.test.ts`, `report-evidence.test.ts` ("every generated occupation"). Replace their hard counts (`toBe(493)`, `toBe(479)`) with the live index's own length and `toBeGreaterThan(400)`.

**Interfaces:**

- Consumes: `frozenCore`, `frozenDetail`, `frozenIndex` (Task 1). Swap `loadOccupationCore` → `frozenCore`, `loadOccupationDetail` → `frozenDetail`, `occupationIndex`/`occupation-index.json` → `frozenIndex()` in the first group. No assertion value changes.

- [ ] **Step 1: Write the guard test** `src/lib/data/live-data-tests.test.ts`: it reads every `*.test.ts` under `src/lib/` and fails if a file outside an explicit `LIVE_INVARIANT_TESTS` list imports `load-server` or `occupation-index` (directly or through `scenario-input`/`review-profiles`).
- [ ] **Step 2: Run** it. Expected: FAIL listing the first group.
- [ ] **Step 3: Implement** the swaps file by file. Confirm that `scenarios.ts`'s `asOf = "2026-11-17"` and `check-flow.tsx`'s initial state are placeholders replaced by `localToday()` at run time (spec 6.14) and leave them; note it in the ledger.
- [ ] **Step 4: Run** `npm test`. Expected: PASS, and no test was deleted or loosened in the first group (`git diff --stat` shows only import and loader changes there).
- [ ] **Step 5: Commit** `test: pin figure tests to the frozen 2026-10 snapshot; keep invariants on live data`.

### Task 4: Round pages v2 (totals, tie-break dates, nominations)

**Files:**

- Create: `src/lib/data/rounds-file.ts`, `scripts/import/round-store.ts`, `data/raw/rounds/2026-10-15.html` (written by the command below)
- Modify: `scripts/import/rounds.ts`, `scripts/import/generate-rounds.ts` (types and `readRoundsFile` move/re-export), `scripts/import/cli.ts` (`--rounds-html <dir>`), `src/data/rounds.json` (regenerated), `docs/DATA.md` ("189 invitation rounds")
- Test: `scripts/import/rounds.test.ts`, `scripts/import/generate-rounds.test.ts`, `scripts/import/cli.test.ts`, `src/lib/data/rounds-file.test.ts`

**Interfaces:**

- Produces in `rounds-file.ts`: `RoundTotal = { subclass: string; label: string; invited: number }`; `NominationsTable = { programYear: string; from: string; to: string; byVisa: Record<"190" | "491", Record<StateCode, string>> }` (values are the published text); `StoredRow = { name: string; code: string | null; cutoff: number; tieBreak: string | null }`; `StoredRound = { date; totals: RoundTotal[] | null; tieBreak: string | null; rows: StoredRow[]; nominations: NominationsTable | null }`; `RoundsFile = { schemaVersion: 2; rounds: StoredRound[]; skipped: SkippedRound[] }`; `isRoundsFile(v: unknown): v is RoundsFile`.
- `ParsedRound` gains `totals`, `tieBreak` (round-level, from the totals table) and per-row `tieBreak`; only the current-round page yields `nominations`.
- Produces: `writeRoundPage(rawRoot: string, date: string, html: string): string` (path `data/raw/rounds/<date>.html`, atomic, no-op if identical).
- CLI: `--rounds-html <dir>` reads `invitation-rounds.html` and `previous-rounds.html` from `<dir>` instead of fetching; requires `--generate-only`; stores the current page with `writeRoundPage`.

- [ ] **Step 1: Write the failing tests** (against `scripts/import/__fixtures__/`)

```ts
const pages = parseRoundPagesDetailed(currentHtml, previousHtml);
const oct = pages.rounds.find((r) => r.date === "2026-10-15")!;
expect(oct.totals).toEqual([{ subclass: "189", label: "Skilled Independent visa (subclass 189)", invited: 20000 }]);
expect(oct.rows.find((r) => r.occupationName === "Actuary")).toEqual({ occupationName: "Actuary", cutoff: 85, tieBreak: "2026-09-03" });
expect(oct.nominations).toEqual({ programYear: "2026-27", from: "2026-07-01", to: "2026-09-30", byVisa: {
  "190": { ACT: "<5", NSW: "11", NT: "188", QLD: "7", SA: "0", TAS: "271", VIC: "0", WA: "17" },
  "491": { ACT: "<5", NSW: "0", NT: "208", QLD: "<5", SA: "0", TAS: "96", VIC: "0", WA: "120" } } });
const jun = pages.rounds.find((r) => r.date === "2026-06-04")!;
expect(jun.totals?.[0].invited).toBe(10000);
expect(jun.tieBreak).toBe("2026-04-24");
expect(jun.rows.every((r) => r.tieBreak === null)).toBe(true);
expect(pages.rounds).toHaveLength(13); // unchanged
it("stops when the nominations table loses a state column", ...) // "Official page schema changed"
it("rejects a rounds file without schemaVersion 2", ...)
it("rejects --rounds-html without --generate-only", ...)
```

- [ ] **Step 2: Run** `npx vitest run scripts/import src/lib/data/rounds-file.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Totals: the block's first "Visa subclass" table with a "Total EOIs Invited" column; a row whose count isn't digits (commas allowed) throws; no such table gives `null`. Tie-break: a "Tie break date" column (per row) or column in the totals table (round-level), `dd/mm/yyyy` → ISO. Nominations: the "State and Territory nominations" block; state headers must be exactly `ACT NSW NT Qld SA Tas Vic WA` in order (map `Qld`→`QLD` etc.), else throw "Official page schema changed".
- [ ] **Step 4: Regenerate** `npm run data:generate -- --as-at 2026-10 --checked-at 2026-11-17 --rounds-html scripts/import/__fixtures__`. Expected `git status --short`: only `src/data/rounds.json` modified and `data/raw/rounds/2026-10-15.html` added. Run `npm run check`.
- [ ] **Step 5: Commit** `feat(import): parse round totals, tie-break dates and state nominations (rounds.json v2)` (code) and `data: rounds.json v2 from the 17 Nov 2026 round pages` (data).

### Task 5: Occupations that drop out keep their pages

**Files:**

- Modify: `src/lib/data/types.ts` (`OccupationIndexEntry.lastAsAt?`, `lastCheckedAt?`), `src/lib/data/guards.ts`, `scripts/import/generate.ts`, `scripts/import/cli.ts` (pass previous data), `scripts/import/validate-generated.ts`, `src/lib/data/occupation-url.ts`, `src/lib/occupation-page/meta.ts` (sitemap date), `src/app/occupations/[slug]/page.tsx`, `src/components/occupation/` (note component), `src/components/data/report-occupation.ts` (dropped reason), `docs/DATA.md` (R9)
- Create: `src/lib/occupation-page/dropped.ts`
- Test: `scripts/import/generate.test.ts`, `scripts/import/validate-generated.test.ts`, `src/lib/occupation-page/dropped.test.ts`, `src/lib/data/occupation-url.test.ts`, `src/lib/occupation-page/meta.test.ts`

**Interfaces:**

- Produces: `GenerateInput.previous?: { manifest: Manifest; core(code): OccupationCore | null; detail(code): OccupationDetail | null } | null`. A code in the previous index but absent now is carried forward unchanged, with index and manifest entries `{ ...previousEntry, lastAsAt: previousEntry.lastAsAt ?? previous.manifest.asAt, lastCheckedAt: previousEntry.lastCheckedAt ?? previous.manifest.checkedAt }`; a returning code is regenerated and loses both marks.
- Produces: `formatLongMonth(month: MonthKey): string` in `src/lib/report/copy.ts` ("2026-11" → "November 2026", fixed names beside `formatMonth`); `droppedSince(entry: OccupationIndexEntry): MonthKey | null` (the month after `lastAsAt`); `droppedNote(entry): string | null` = "Not in the SkillSelect data since {Month YYYY}".
- `publishedOccupationCode` returns `null` for an entry with `lastAsAt`, so the check and report take the points-only path; the report's unavailable reason for it is `{ kind: "dropped", note }`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(entryFor("254499")).toMatchObject({ hasData: true, lastAsAt: "2026-10", lastCheckedAt: "2026-11-17" }); // previous 2026-10, current 2026-11 lacks it
expect(coreFor("254499").snapshotId).toBe("skillselect-2026-10-31");
it("keeps an earlier lastAsAt when a dropped code stays out", ...)
it("clears the marks when a code returns", ...)
it("allows an older snapshot id only with lastAsAt", ...)       // validate-generated
it("counts current codes only for the 10% drop check", ...)
expect(droppedNote({ code: "1", name: "A", hasData: true, lastAsAt: "2026-10" })).toBe("Not in the SkillSelect data since November 2026");
expect(publishedOccupationCode("1", [{ code: "1", name: "A", hasData: true, lastAsAt: "2026-10" }])).toBeNull();
it("dates a dropped occupation's sitemap entry by lastCheckedAt", ...)
```

- [ ] **Step 2: Run** the five test files. Expected: FAIL.
- [ ] **Step 3: Implement.** The occupation page shows the note above the direct answer; "Last updated" and the evidence footer use `lastCheckedAt` and the core's own `snapshotId`; the verdict strip and check card say "Figures from {Mon YYYY}". The report's note: "Not in the SkillSelect data since {Month YYYY}, so this report uses your points only." `isIndexable` is unchanged.
- [ ] **Step 4: Run** `npm run check` and `npm run build` (no occupation is dropped today, so `out/` is unchanged apart from code).
- [ ] **Step 5: Commit** `feat(data): keep pages for occupations that drop out of the data`.

### Task 6: Facts types, guard, formatting and merging

**Files:**

- Create: `src/lib/updates/types.ts`, `src/lib/updates/guards.ts`, `src/lib/updates/format.ts`, `src/lib/updates/dates.ts`, `src/lib/updates/merge.ts`
- Test: `src/lib/updates/{guards,format,dates,merge}.test.ts`

**Interfaces:**

- Produces (types.ts): `OccRef = { code: string | null; name: string }`; `CutoffMove = { code: string; name: string; previous: number; current: number }`; `PoolMove` (same shape, exact pool counts); `RoundSection = { generatedAt; sources: { currentRounds; previousRounds; checkedAt }; totals: RoundTotal[]; occupations: { code: string | null; name; cutoff; previousCutoff: number | null; tieBreak: string | null }[]; distribution: { score: number; occupations: number }[]; previousRound: { date; listed: number } | null; comparison: { fell; rose; same; newlyListed: OccRef[]; notListedAgain: OccRef[]; falls: CutoffMove[]; rises: CutoffMove[] } | null; cardPicks: CutoffMove[] }`; `StateFigure = { total: Interval; floor: number; maskedCells: number; previousFloor: number | null; top: { code; name; total: Interval }[] }`; `MonthPair = { current: Interval; previous: Interval | null }`; `ScoreTotal = { score: number; count: Interval }`; `NotableRow = { code; name; cutoff: number; previousCutoff: number | null; tieBreak: string | null; pool: CountText; invited: CountText | null }`; `NotListedRow = { code; name; pool: number; roundsNotListed: number; lastListed: { date; cutoff: number } | null }`; `SpotlightSeries = "SUBMITTED-189" | "SUBMITTED-190" | "SUBMITTED-491" | "INVITED-189" | "INVITED-190" | "INVITED-491"`; `Spotlight` (Task 8 states its rules) `= { code; name; pickedBy: "auto" | "founder"; qualifiedBy: { series: SpotlightSeries; change: Interval; guaranteed: number } | null; card: { latest189: { kind: "listed"; date; cutoff } | { kind: "not-listed"; date } | { kind: "not-on-list" }; rounds: { date; cutoff: number | null }[]; tieBreak: string | null; invited189: { current: CountText | null; previous: CountText | null }; pool189: { current: CountText | null; previous: CountText | null }; top190: { state: StateCode; floor: number }[] } }` (`qualifiedBy: null`= "little changed this month");`DataSection = { generatedAt; sources: { snapshotId; checkedAt; previous: { month; snapshotId; checkedAt } | null; federalListCheckedAt }; national: Record<Visa, { submitted: MonthPair; invited: MonthPair }>; pool189ByScore: ScoreTotal[]; invitedByScore: Record<Visa, ScoreTotal[]>; states: Record<StateVisa, Record<StateKey, StateFigure>>; nominations: NominationsTable | null; movers: { fell: PoolMove[]; rose: PoolMove[] }; notable189: { round: string; rows: NotableRow[] } | null; largePoolsNotListed: NotListedRow[]; spotlight: Spotlight; occupationsAdded: OccRef[] | null; occupationsRemoved: OccRef[] | null }`; `RecapFacts = { schemaVersion: 1; month: MonthKey; firstGeneratedAt; updatedAt; rounds: Record<string, RoundSection>; data: DataSection | null }`.
- Produces (format.ts): `formatNumber(n)`, `rangeText(i)`, `minimumText(i)`, `stateFigureText(f)`, `aboutText(i): string | null`, `countText(t: CountText)`, `mrzLine(month)`; re-exports `formatLongMonth` (Task 5).
- Produces (dates.ts): `sydneyDate(now: Date): string`; `monthOfDate(date): MonthKey` (Sydney calendar month of a round date, which is already a Sydney date).
- Produces (merge.ts): `withRoundSection(existing: RecapFacts | null, month, date, section, today): RecapFacts`; `withDataSection(existing, month, section, today): RecapFacts`. Each sets `firstGeneratedAt` only when `existing` is null, sets `updatedAt = today`, replaces only its own section and never touches another.

- [ ] **Step 1: Write the failing tests**

```ts
expect(aboutText({ min: 166555, max: 167904 })).toBe("about 167,000");
expect(aboutText({ min: 790, max: 6927 })).toBeNull();
expect(rangeText({ min: 181076, max: 182254 })).toBe("181,076–182,254");
expect(minimumText({ min: 0, max: 285 })).toBe("under 286");
expect(minimumText({ min: 14876, max: 16643 })).toBe("at least 14,876");
expect(stateFigureText({ floor: 0, maskedCells: 138, ... })).toBe("under 20 for each occupation"); // TAS 491
expect(stateFigureText({ floor: 1018, ... })).toBe("at least 1,018");
expect(countText("<20")).toBe("under 20");
expect(formatLongMonth("2026-10")).toBe("October 2026");
expect(mrzLine("2026-10")).toMatch(/^P<AUSSKILLSELECT<<UPDATE<OCTOBER<2026<+$/);
expect(sydneyDate(new Date("2026-11-24T20:30:00Z"))).toBe("2026-11-25");
it("adds a round section without touching data or firstGeneratedAt", ...)
it("keeps two rounds keyed by date", ...)
it("rejects a facts file whose round key isn't in its month", ...) // guard
```

- [ ] **Step 2–4:** Run `npx vitest run src/lib/updates`, expect FAIL; implement; expect PASS.
- [ ] **Step 5: Commit** `feat(updates): recap facts types, formatting and section merging`.

### Task 7: Round facts

**Files:**

- Create: `src/lib/updates/facts-round.ts`
- Test: `src/lib/updates/facts-round.test.ts` (2026-10 values from the frozen `rounds.json` v2 via `readJson`, plus small explicit fixtures)

**Interfaces:**

- Consumes: `StoredRound`, `RoundsFile` (Task 4); types (Task 6).
- Produces: `buildRoundSection(input: { round: StoredRound; previous: StoredRound | null; names: ReadonlyMap<string, string>; sources: RoundSection["sources"]; today: string }): RoundSection`; `previousRound(file: RoundsFile, date: string): StoredRound | null` (the next older parsed round).
- Rules: one entry per listed occupation (rows with the same code collapse to their lowest cut-off; unmatched names count by name); `falls`/`rises` up to 6, largest change first, ties by name; `cardPicks` = two largest falls and one largest rise when both exist, otherwise the three largest moves of either kind, ties by name, matched codes only.

- [ ] **Step 1: Write the failing tests**

```ts
const s = buildRoundSection({ round: oct, previous: jun, ... });
expect(s.occupations).toHaveLength(159);
expect(s.distribution).toEqual([[65,44],[70,36],[75,9],[80,36],[85,19],[90,10],[95,3],[100,2]].map(([score, occupations]) => ({ score, occupations })));
expect(s.comparison).toMatchObject({ fell: 78, rose: 9, same: 50 });
expect(s.comparison!.newlyListed).toHaveLength(22);
expect(s.comparison!.notListedAgain.map((o) => o.name)).toEqual(["Fitter and Turner", "Organisational Psychologist", "Thoracic Medicine Specialist"]);
expect(s.cardPicks.map((m) => m.code)).toEqual(["134214", "342111", "272311"]); // Welfare Centre Manager 85→65, Airconditioning and Refrigeration Mechanic 80→65, Clinical Psychologist 75→90
expect(s.totals[0].invited).toBe(20000);
expect(s.previousRound).toEqual({ date: "2026-06-04", listed: 140 });
it("counts an unmatched name as listed but never picks it", ...)
it("gives no comparison when there is no previous parsed round", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(updates): round facts`.

### Task 8: Spotlight

**Files:**

- Create: `src/lib/updates/spotlight.ts`
- Test: `src/lib/updates/spotlight.test.ts`

**Interfaces:**

- Consumes: `Spotlight` (Task 6).
- Produces: `guaranteedChange(current: Interval, previous: Interval): number` (0 if `[cur.min − prev.max, cur.max − prev.min]` contains 0, else the smaller absolute end); `pickSpotlight(input: { cores; month; previousCode: string | null; override: string | null; rounds: RoundsFile; federal: FederalList }): Spotlight`. `buildDataSection` (Task 9) calls it with `previousCode` from the previous month's facts file.
- Rules (spec 6.8): popular = top 20 by the sum of SUBMITTED floors over 189, 190, 491 at the month (ties by code; never shown); six series; a series with an unfetched previous month is skipped; score = largest guaranteed change; ties by guaranteed relative change (`guaranteed / max(previous.max, 1)`), then code; skip `previousCode`; no change above 0 → the most popular occupation; `override` sets `pickedBy: "founder"` and must be an indexed code, else throw. `top190`: up to four states by 190 floor, floor > 0. `rounds`: last six parsed rounds.

- [ ] **Step 1: Write the failing tests**

```ts
expect(guaranteedChange({ min: 4280, max: 4280 }, { min: 7500, max: 7500 })).toBe(3220);
expect(guaranteedChange({ min: 2730, max: 2730 }, { min: 0, max: 19 })).toBe(2711);
expect(guaranteedChange({ min: 0, max: 19 }, { min: 0, max: 19 })).toBe(0);
const s = pickSpotlight({ cores, month: "2026-10", previousCode: null, override: null, ... });
expect(s).toMatchObject({ code: "254499", pickedBy: "auto", qualifiedBy: { series: "SUBMITTED-189", guaranteed: 3220 } });
expect(s.card.pool189).toEqual({ current: "4280", previous: "7500" });
expect(s.card.invited189).toEqual({ current: "2730", previous: "<20" });
expect(s.card.top190).toEqual([{ state: "VIC", floor: 337 }, { state: "NSW", floor: 327 }, { state: "QLD", floor: 260 }, { state: "WA", floor: 253 }]);
expect(s.card.tieBreak).toBe("2025-11-19");
expect(pickSpotlight({ ..., previousCode: "254499" }).code).toBe("241111");
it("falls back to the most popular occupation, little changed, when nothing moved", ...)
it("uses a founder override", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(updates): spotlight pick`.

### Task 9: Data facts

**Files:**

- Create: `src/lib/updates/facts-data.ts` (compose), `src/lib/updates/facts-national.ts`, `src/lib/updates/facts-states.ts`, `src/lib/updates/movers.ts`
- Test: one `*.test.ts` each; 2026-10 values use `frozenCore`/`frozenIndex` and the stored `rounds.json`

**Interfaces:**

- Consumes: `pickSpotlight` (Task 8); `OccupationCore`, `Manifest`, `RoundsFile`, `FederalList` (`src/lib/state-outlook/rules-types.ts`), `sumIntervals`/`parseCountText`, `shiftMonth` (copy the 3-line helper into `src/lib/data/months.ts` if it isn't exported there).
- Produces: `nationalFigures(cores, month): DataSection["national"]` (`{ submitted: { current: Interval; previous: Interval | null }; invited: same }` per visa; `previous` is null when no core has the previous month fetched); `scoreTotals(cores, month, visa, kind: "pool" | "invited"): { score: number; count: Interval }[]`; `stateFigures(cores, month): Record<StateVisa, Record<StateKey, StateFigure>>` (top 3 by floor); `poolMovers(cores, month, limit = 6): { fell: PoolMove[]; rose: PoolMove[] }`; `notable189(cores, rounds, month, limit = 10)`; `largePoolsNotListed(cores, rounds, federal, month, limit = 6)`; `buildDataSection(input: { month; cores; manifest; previousManifest: Manifest | null; previousFacts: RecapFacts | null; rounds: RoundsFile; federal: FederalList; today }): DataSection`.
- `notable189` uses the newest round dated on or before the month's last day (ten listed occupations with the largest exact 189 pools). `nominations` is the newest stored round's table that isn't null. `sources.previous` takes its `checkedAt` from the previous manifest, else the previous month's facts file, else is `null`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(national["189"].submitted).toEqual({ current: { min: 166555, max: 167904 }, previous: { min: 181076, max: 182254 } });
expect(national["189"].invited).toEqual({ current: { min: 14876, max: 16643 }, previous: { min: 0, max: 285 } });
expect(national["190"].invited.current).toEqual({ min: 7017, max: 9867 });
expect(states["190"].VIC.floor).toBe(1018);
expect(states["190"].NSW.total).toEqual({ min: 790, max: 6927 });
expect(states["190"].NSW.maskedCells).toBe(323);
expect(states["190"].ANY.floor).toBe(243);
expect(states["491"].TAS).toMatchObject({ floor: 0, maskedCells: 138 });
expect(states["190"].VIC.previousFloor).toBe(0);
expect(movers.fell[0]).toEqual({ code: "254499", name: "Registered Nurses nec", previous: 7500, current: 4280 });
expect(notable.rows[0]).toMatchObject({ code: "241111", cutoff: 90, pool: "13693" });
expect(notListed.map((o) => o.name)).toEqual(["Chef", "Software Engineer", "Civil Engineer", "ICT Business Analyst", "Mechanical Engineer", "Accountant (General)"]);
expect(notListed[1]).toMatchObject({ pool: 9464, roundsNotListed: 4, lastListed: { date: "2024-11-07", cutoff: 95 } });
it("never sums INVITED across months: national figures read one month per visa", ...)
it("skips a mover masked in either month", ...)
it("returns null previous values when the previous month was not fetched", ...)
it("gives null added/removed without a previous manifest", ...)
```

- [ ] **Step 2–4:** fail, implement, pass. Each module stays under 300 lines.
- [ ] **Step 5: Commit** `feat(updates): data facts (national, states, movers, notable 189)`.

### Task 10: `npm run updates:generate` and the 2026-10 facts file

**Files:**

- Create: `scripts/updates/generate.ts`, `scripts/updates/generate.test.ts`, `src/lib/updates/load-server.ts`, `src/data/updates/2026-10.json` (generated)
- Modify: `package.json` (`"updates:generate": "tsx scripts/updates/generate.ts"`), `.prettierignore` (if not done in Task 2)

**Interfaces:**

- Consumes: Tasks 6–9.
- CLI: `--month YYYY-MM --section round --round YYYY-MM-DD` or `--section data [--spotlight <code>] [--previous-manifest <file>]`, optional `--today YYYY-MM-DD` (default `sydneyDate(new Date())`). Exits 1 with a message if the round isn't in `rounds.json`, the round's Sydney month isn't `--month`, `--section data` is asked for a month other than `manifest.asAt`, or the merged file fails `isRecapFacts`.
- Produces: `parseGenerateArgs(argv): GenerateArgs`; `listRecapMonths(): MonthKey[]` (newest first, from `src/data/updates/*.json`); `loadRecap(month): RecapFacts` (throws on an invalid file).

- [ ] **Step 1: Write the failing tests** for `parseGenerateArgs` (each rejection above) and `listRecapMonths` ordering on a tmp folder.
- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Generate** `npm run updates:generate -- --month 2026-10 --section round --round 2026-10-15 --today 2026-11-24` then `-- --month 2026-10 --section data --today 2026-11-24`. Check: `firstGeneratedAt` and `updatedAt` are `2026-11-24`; file size 20–60 KB; `npm run check`.
- [ ] **Step 6: Commit** `feat(updates): updates:generate` and `data: 2026-10 recap facts`.

### Task 11: Recap view-model, FAQ and metadata

**Files:**

- Create: `src/lib/updates/recap-view.ts`, `src/lib/updates/round-view.ts`, `src/lib/updates/state-view.ts`, `src/lib/updates/faq.ts`, `src/lib/updates/meta.ts`, `src/lib/updates/copy-sweep.test.ts`
- Modify: `src/lib/seo/json-ld.ts` (add `datasetLd`, `collectionPageLd`, `articleLd` gains `datePublished` and `image`), `src/lib/occupation-page/meta.ts` (use `datasetLd`)
- Test: one `*.test.ts` per new module; fixtures: the real `2026-10.json` plus three small facts fixtures in `src/lib/updates/__fixtures__/` (round-only, data-only, two rounds)

**Interfaces:**

- Produces: `buildRecapView(facts: RecapFacts, ctx: { recapMonths: MonthKey[] }): RecapView` with `kind: "round-only" | "data-only" | "full"`, `hero` (`eyebrow`, `h1`, `answer`, `dateline`, `pendingDataNote: string | null`), `passport`, `rounds: RoundView[]` (newest first), `noRound: { text; href: string | null } | null`, `pool`, `notable`, `notListed`, `states: Record<StateVisa, StateSectionView> | null`, `movers`, `compare`, `method`, `faq: FaqEntry[]`. Every count is already a string from `format.ts`.
- Produces: `shadeBand(floor: number): 1 | 2 | 3 | 4` in `state-view.ts` (700+ → 4, 200+ → 3, 20+ → 2, else 1; the mockup's bands, used by the page map and Plan 2's cards).
- Produces: `recapFaq(facts): FaqEntry[]` (3–5 entries, spec 6.4 item 10); `recapTitle(facts)`, `recapDescription(view)` (direct answer cut to ≤ 155 characters at a word boundary, the occupation pages' `pageDescription` approach), `recapJsonLd(facts, view, ogImage): object[]` (`Article` with `datePublished = firstGeneratedAt`, `dateModified = updatedAt`, `image`; `Dataset` only when `data` exists, `temporalCoverage` = the month, creator Department of Home Affairs, licence CC BY 3.0 AU; `FAQPage`; `BreadcrumbList` Home › Updates › {Month YYYY}); `datasetLd(page: { name; description; url; temporalCoverage; dateModified }): object`.
- Copy (spec 6.4): H1 "SkillSelect {Month YYYY}: {total} EOIs invited in the 189 round" or "SkillSelect {Month YYYY}: 190 and 491 invitations by state"; title "SkillSelect {Month YYYY} update: 189 round, 190 and 491 by state | MigrateLens" or "… update: 190 and 491 invitations by state | MigrateLens"; pending note "SkillSelect's {Month} figures for pools and state invitations will be added here when they are published"; passport stamp "SUBCLASS 189 ROUND · {total} INVITED · {D MON YYYY}", or with no round the data stamp "SKILLSELECT · {MON YYYY} · AS AT {D MON YYYY}"; a "most" claim only when one floor is strictly above every other state's interval maximum, otherwise "the highest published minimum of any state"; `method` names only the sources of the sections shown (a round-only page cites the Home Affairs round page alone).

- [ ] **Step 1: Write the failing tests**

```ts
const view = buildRecapView(oct, { recapMonths: ["2026-10"] });
expect(view.kind).toBe("full");
expect(view.hero.h1).toBe("SkillSelect October 2026: 20,000 EOIs invited in the 189 round");
expect(view.hero.answer).toMatch(/^As at 31 October 2026:/);
expect(recapTitle(oct)).toBe("SkillSelect October 2026 update: 189 round, 190 and 491 by state | MigrateLens");
expect(recapDescription(view).length).toBeLessThanOrEqual(155);
expect(recapFaq(oct).map((f) => f.question)).not.toContain("Which state gave the most 190 invitations in October 2026?");
expect(view.states!["491"].tiles.find((t) => t.state === "TAS")!.figure).toBe("under 20 for each occupation");
expect(view.passport.figures).toContainEqual(expect.objectContaining({ value: "about 167,000" }));
// fixtures
expect(buildRecapView(roundOnly, ctx)).toMatchObject({ kind: "round-only", pool: null, states: null, hero: { pendingDataNote: expect.stringContaining("will be added here when they are published") } });
expect(recapJsonLd(roundOnly, ...).map((o) => o["@type"])).toEqual(["Article", "FAQPage", "BreadcrumbList"]);
expect(buildRecapView(dataOnly, { recapMonths: ["2026-12"] }).noRound).toEqual({ text: "No 189 round in December 2026; the last was on 15 Oct 2026", href: null });
expect(buildRecapView(twoRounds, ctx).rounds.map((r) => r.date)).toEqual(["2027-03-25", "2027-03-04"]);
expect(buildRecapView(roundOnly, ctx).method.sources.map((s) => s.label)).toEqual(["Home Affairs SkillSelect invitation rounds"]);
// copy-sweep.test.ts: every string in the view, FAQ and metadata of every facts file in src/data/updates/ and the fixtures passes BANNED_COPY, has no "NaN", "undefined" or a "0–" range
```

- [ ] **Step 2–4:** fail, implement, pass; the occupation-page JSON-LD tests still pass after the `datasetLd` move.
- [ ] **Step 5: Commit** `feat(updates): recap view-model, FAQ and JSON-LD`.

### Task 12: The recap page

**Files:**

- Create: `src/app/updates/[month]/page.tsx`, `src/app/updates/[month]/page.module.css`, `src/components/updates/` (`recap-hero.tsx`, `passport-panel.tsx`, `round-stamp.tsx` and `rect-stamp.tsx` (pure SVG, no CSS-module import, `className` prop; Plan 2's cards reuse them), `round-section.tsx`, `pool-chart.tsx`, `notable-table.tsx`, `state-section.tsx`, `state-recap-map.tsx` (static, from `atlas-map-geometry.json`, like `src/components/states/state-map.tsx`), `movers-section.tsx`, `compare-section.tsx`, `recap-cta.tsx`, `recap-method.tsx`, `recap-faq.tsx`), each with its CSS module
- Modify: `src/app/globals.css` (four `--updates-map-1..4` fill tokens, values from the mockup's `assets/brand.css` `--map-*`; regenerate the fallback block), `src/lib/brand/palette.ts`, `src/lib/brand/palette-dark.ts`

**Interfaces:**

- Consumes: `buildRecapView`, `recapTitle`, `recapDescription`, `recapJsonLd` (Task 11); `listRecapMonths`, `loadRecap` (Task 10).
- Route: `generateStaticParams` returns `{ month }` for each facts file; `dynamicParams = false`; metadata has the title, description, canonical `/updates/<month>/`, `openGraph.images` = `/social/<month>/og.png` when that file exists in `public/`, else `/og.png` (Plan 2 renders it).

- [ ] **Step 1:** Build each component from its view slice, following the mockup's order and layout; MRZ `aria-hidden`; the map is a text-labelled figure with its numbers also in the tiles; tables are real `<table>`s and stack on phones; the CTA links `/check/` and `/sample/`.
- [ ] **Step 2: Run** `npm run check` and `npm run build`. Expected: `out/updates/2026-10/index.html` exists, has one `<h1>`, the canonical, three JSON-LD types plus `Dataset`.
- [ ] **Step 3: Browser check** the built page (`python3 -m http.server 3017 --bind 127.0.0.1 --directory out`, visual check only; performance numbers come from `npm run lighthouse`) at 1280 and 390 px, light and dark, against `screens/recap-*.png`: no horizontal scroll, no text under 12 px, stamps static.
- [ ] **Step 4: Commit** `feat(updates): /updates/YYYY-MM/ recap page`.

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
