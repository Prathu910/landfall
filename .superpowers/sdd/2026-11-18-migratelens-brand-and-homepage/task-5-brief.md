### Task 5: Sample constants, try-it and demo view-models

**Files:**

- Create: `src/lib/sample.ts`, `src/lib/home/try-it.ts`, `src/lib/home/try-it.test.ts`, `src/lib/home/demo-content.ts`, `src/lib/home/demo-content.test.ts`
- Modify: `src/app/sample/page.tsx` (use the shared constants; behaviour unchanged)

**Interfaces:**

- Consumes: `comparePool`, `formatInterval` (`src/lib/pool.ts`); `toPoolOccupation` (`src/lib/data/legacy.ts`); `summarise189Rounds` / `CHIP_LABEL` (`src/lib/report/round-status.ts`); `buildReportView` / `ReportView` (`src/lib/report/report-view.ts`); `skippedRounds` and `stateRuleData` (`src/components/data/*`); `loadOccupationCore` / `loadOccupationDetail` (`src/lib/data/load-server.ts`, Server Components only).
- Produces:
  - `SAMPLE_AS_OF = "2026-11-17"`, `SAMPLE_COMPARISON = "261313"` and `sampleReportProfile: Profile` (the `/sample/` profile, including onshore VIC, the visa expiry, assessment dates and the EOI date).
  - `TRY_IT_POINTS: number[]` (65 to 140 in steps of 5) and `TRY_IT_DEFAULT = 85`.
  - `buildTryIt(core: OccupationCore | null, total: number): TryItView`, where `TryItView = { kind: "data"; higher: string; same: string; poolTotal: string; latestRound: string; asAt: string } | { kind: "none"; message: string }`.
  - `buildDemoContent(view: ReportView, occupationName: string, points: number): DemoContent`, where `DemoContent = { occupation: string; points: string; profileLines: string[]; cards: { visa: string; ahead: string; atScore: string }[]; tiles: { state: string; group: string; label: string }[]; posterAlt: string }`.
  - `buildSampleView(): { view: ReportView; occupationName: string; points: number }`: server-only, in `src/lib/home/sample-view.ts`, which loads the sample occupation the same way `/sample/` does.

- [ ] **Step 1: Write the failing tests.**
  - `buildTryIt reports no data`: a `null` core, or one with no 189 pool, gives `{ kind: "none", message: "No published 189 data for this occupation" }`.
  - `buildTryIt keeps masked counts as intervals`: a fixture core whose higher buckets are all `"<20"` gives `higher === "under 20, so may be zero"`. Use the report's existing wording for masked intervals, and assert it equals what `formatInterval` / the panel-189 view uses.
  - `buildTryIt on real data`: load the real core for `261313`, use total 85, and assert `higher` and `same` equal `formatInterval` of `comparePool(toPoolOccupation(core), 85)`, and that `latestRound` is a `CHIP_LABEL` value. When the newest round's cutoff is `null`, it is "Not listed" (never "0").
  - `buildTryIt copy`: every string passes the `BANNED_COPY` check and contains no "%".
  - `demo content matches the sample report view`: the `buildSampleView()` view's scorecard `ahead` / `atScore` for each visa equal `DemoContent.cards`, and its 190 tiles map one-to-one onto `DemoContent.tiles`, in order and with the same group labels.
  - `sample page uses the shared profile`: `sampleReportProfile.occupation === sampleProfile.occupation`, and the `eoiDate` is `"2026-03-14"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/home`. **Expected:** FAIL.
- [ ] **Step 3: Implement the modules.** Implement `sample.ts`, `try-it.ts`, `sample-view.ts` and `demo-content.ts`. `sample/page.tsx` imports the constants, and its output stays identical (build and compare `out/sample/index.html` before and after).
- [ ] **Step 4: Run** the tests, `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 5: Commit** `feat(home): sample constants and try-it and demo view-models`.

