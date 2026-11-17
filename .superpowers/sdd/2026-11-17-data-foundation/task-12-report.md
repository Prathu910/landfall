# Task 12 report: UI on per-occupation data, old pipeline removed, data dictionary

Status: DONE_WITH_CONCERNS (minor; see Concerns)

## Commits

- `844fd87` refactor: feed the UI from per-occupation data
- `364f767` docs: add data dictionary and update import docs

## Implemented

### Lib
- `src/lib/data/report-source.ts` (new): `monthEnd(asAt)`, which moved out of legacy.ts, and `reportSource(asAt, manifest)` → `{ snapshotDate, checkedAt, dashboardUrl, roundsUrl, previousRoundsUrl }`. Pages build it server-side: the snapshot date comes from `core.asAt` (or `manifest.asAt` on /check/, since every core shares it), and the checked date and URLs come from the manifest.
- `src/lib/data/occupation-url.ts`: `publishedOccupationCode(code, index)` returns the code only if it is in the index with `hasData`, otherwise null. Unknown codes, "other" and hasData false are therefore never fetched.
- `src/lib/pool.ts`: the `snapshot` JSON import is gone. `Occupation` is replaced by a re-export of `PoolOccupation`.
- `src/lib/report-evidence.ts`: the JSON import, `evidence`, `getOccupationEvidence` and `ReportEvidence` are gone. Types, `netPoolChange` and `validateOccupationEvidence` are kept.
- `src/lib/report-evidence.test.ts` now runs on generated data via `loadOccupationCore` + `toOccupationEvidence`. `validateOccupationEvidence` returns [] for **all 493** generated occupations. The 12-month, 6-round and 3-pathway checks run for the 11 original codes, and the cut-off, aggregate, duplicate and inconsistency cases are kept. This also adds loader coverage, a Task 11 minor.

### Components
- `src/components/data/occupation-index.ts`: a module-level typed `occupationIndex` constant, giving a stable identity for the hook.
- `src/components/data/report-occupation.ts`: the `ReportOccupation` union exactly as the brief specifies, plus `toReportOccupation(load)`. Idle maps to unavailable.
- `pool-explorer.tsx`: takes `initial: PoolOccupation` and `snapshotDate` props, searches the index (all 493), and uses the hook for other codes. It has four states: ready, "Loading published data…", no 189 pool, and load failed. The status box is a new `pool-explorer.module.css` (13px, tokens). `PoolChart` was extracted to `pool-chart.tsx` unchanged (boy-scout; one component per file).
- `home-experience.tsx` and `app/page.tsx`: the page server-loads core 261111 → `toPoolOccupation`, and throws at build if it is missing.
- `check-flow.tsx`: takes a `source` prop (from `app/check/page.tsx`, which reads the manifest). The picker and review step use the index. `?occupation=` is validated against the index. The hook fetches as soon as an occupation is chosen. Report gets `occupation`, `comparisonIndex={occupationIndex}` and `source`.
- `report.tsx` (1066 → 704 lines): new props `occupation`, `comparisonIndex`, `initialComparison?` (evidence) and `source`. The pool, rounds and compare sections plus TrendChart are extracted to `src/components/report/{pool-section,rounds-section,compare-section,trend-chart,loading-data}.tsx`. The markup and copy are unchanged. Visa and score state stay in Report, because the scenario button drives them.
  - Loading state: the pool, rounds and both compare cards show "Loading published data…" (13px). They never show the not-in-snapshot text.
  - The comparison loads through `useOccupationCore`, unless it equals the server-provided `initialComparison` (sample page: 261313).
- `app/sample/page.tsx`: server-loads 261111 (pool + evidence) and 261313 (initialComparison).
- `app/methodology/page.tsx`: the FAQ now says "covers ${manifest.occupations.length} occupations" (493), and the source URL comes from the manifest.

### Removal and moves
- Deleted `scripts/import-report-evidence.py`.
- Moved `src/data/pool.json` and `src/data/report-evidence.json` to `src/lib/data/__fixtures__/legacy-2026-10/`, as the plan's path specifies, and updated legacy.test.ts. The folder is in `.prettierignore` and the stale comment there was fixed.
- `rg "pool.json|report-evidence.json" src` now matches only the two fixture paths in `src/lib/data/legacy.test.ts`.

### Docs
- `docs/DATA.md` (new) covers:
  - storage, client loading and the raw format;
  - the guardrail rules;
  - the view table (shown, filters, statuses, visas, months, page reads);
  - the Score-numeric finding; R12 "None Provided"; reductions (none at query time) and R8 (36 months, older dropped, never summed); R9;
  - sizes; missing vs zero vs not-published;
  - status meanings and the observed table, re-verified against the generated data;
  - generated record fields;
  - rounds: 20 parsed, the skipped 6 Oct 2022 round, R6/R7, and the 6 unmatched names;
  - known limits; the SUBMITTED coverage-window analysis;
  - snapshots, revisions, R10 and versioning; validation;
  - running imports (R11 budgets 250/600);
  - the Task 10 reproducibility result: zero differences.
- Updated `scripts/README.md` (rewritten), `CLAUDE.md` (commands, data layer, loading rules, checked-in data, CSS modules), `docs/REPORT-COVERAGE.md` (the "Data sources" section replaces the old evidence section; the related-occupation row now covers all 493), `docs/HANDOFF.md` (new "Latest" block; step 1 done) and `README.md` (data paragraph).

### SUBMITTED coverage-window finding (summary; details in DATA.md)
- statusHistory 189 SUBMITTED equals the legacy trend for Nov 2025–Oct 2026, for all 11 occupations.
- For Software Engineer, the sum of all statuses rises about 885 a month, from 1,917 (11/2024) to 22,280 (10/2026).
- In the 10/2026 cohorts table, every SUBMITTED Software Engineer EOI was submitted in 10/2024 or later. Cohorts from 11/2022 to 10/2024 appear only as CLOSED: 11,566 of the 12,354 CLOSED.
- Implication: the dashboard's coverage appears to start around 10–11/2024. Pre-coverage EOIs enter the data only when they close. Most of the 1,129 → 9,464 rise is the window filling, so early monthly totals understate the pool and the 12-month trend overstates growth. The current pool is plausibly complete, because the two-year validity window 11/2024–10/2026 lies inside the coverage.
- Unknown: the cause, whether pre-coverage EOIs are counted in early INVITED and LODGED figures, and confirmation after the 11/2026 import.

## TDD evidence
- report-source: RED with `npx vitest run src/lib/data/report-source.test.ts` → `Error: Cannot find module './report-source'`. GREEN: 2/2, and legacy 23/23 still green after monthEnd moved.
- publishedOccupationCode and toReportOccupation: RED with `npx vitest run src/lib/data/occupation-url.test.ts src/components/data/report-occupation.test.ts` → `TypeError: publishedOccupationCode is not a function` (2 failed) and `Cannot find module './report-occupation'`. GREEN: 8/8.
- The report-evidence tests moved to generated data are characterisation tests. They passed before and after the JSON import was dropped, so they had no RED phase.
- Final: `npm run check` passes (Prettier, ESLint, tsc; Vitest 26 files, 207 tests). `npm run build` passes, with all 7 routes static. The client bundles contain no `readFileSync` and no core records; only the index (32 KB) is in a client chunk.

## Browser smoke test (headless Chrome via CDP, Node built-in WebSocket, no new deps)
- I served `out/` on 3017 and a baseline build of the pre-change commit on 3018, and stopped both afterwards. The viewport was set with `Emulation.setDeviceMetricsOverride`, so 390px is exact (`innerWidth === 390`); the `--window-size` caveat does not apply. All of the following PASS:
- **Home:**
  - explorer at 90 shows ICT Business Analyst `865–903` on both baseline and new builds, and in the static HTML;
  - the snapshot label reads "31 Oct 2026 snapshot";
  - the explorer lists 493 options;
  - searching "Registered Nurses" → "Registered Nurses nec" loads its chart;
  - with 1.5 s latency, choosing Software Engineer shows "Loading published data…" at 13px, then its chart (`872–891`);
  - Aquaculture Farmer (no 189 pool) and Horse Breeder (hasData false, not fetched) show the no-pool message;
  - "Make it personal" carries the code.
- **/sample/:**
  - `main` innerText is **identical** to the baseline (9,495 chars);
  - the score cards are 90/95/105;
  - the pool chart and metric, 6 round rows and both compare cards are present in the static HTML with no fetch;
  - switching the comparison to Chef fetches and renders `81–119`.
- **/check/?occupation=233211:**
  - preselects "Civil Engineer · 233211";
  - `?occupation=999999` is ignored;
  - the picker has 494 options (493 + Other).
  - Completed all four steps **by interaction**: typed DOB, Superior English, Bachelor qualification and Single partner via the selects, Continue ×3, then "Open my overview".
  - The review names Civil Engineer. The report heading reads "Civil Engineer · 233211". The pool chart shows `2,967–3,024` and there are 6 round rows.
  - The comparison (Software Engineer) loads by fetch. The 190 view renders.
  - In print media the pool, rounds and compare sections are visible.
- **Report states:**
  - with 6 s latency, the pool, rounds and both compare cards all show "Loading published data…" at 13px, then load;
  - Mixed Crop Farmer (no 189 pool) shows the new no-189 message, a rounds table (all "Not listed") and a comparison card;
  - Horse Breeder (hasData false) shows the old not-in-snapshot and unavailable texts;
  - Artistic Director (189 only): the 491 view keeps its controls and says no 491 EOIs are published, and switching back to 189 restores the chart.
- **390px, reduced motion:** no horizontal overflow on /, /sample/, /check/?occupation=233211, /methodology/ and /states/, nor with the explorer's empty state.
- **No console errors** in any run.
- One regression was found and fixed before committing: I had typed the "EOIs WITH HIGHER POINTS" label as "EOIS". The sample text diff caught it.
- Not verified: a real touch device and a screen reader, keyboard-only navigation of the 493-option pickers, and print pagination as a PDF. Screenshots are in the scratchpad: `home-loading.png`, `home-390-empty.png`, `check-report-desktop.png`, `sample-390.png`.

## Files
- New: `src/lib/data/report-source.ts` (+test), `src/components/data/occupation-index.ts`, `src/components/data/report-occupation.ts` (+test), `src/components/pool-chart.tsx`, `src/components/pool-explorer.module.css`, `src/components/report/{pool-section,rounds-section,compare-section,trend-chart,loading-data}.tsx`, `src/components/report/compare-section.module.css`, `docs/DATA.md`
- Modified: `src/lib/{pool,report-evidence}.ts`, `src/lib/report-evidence.test.ts`, `src/lib/data/{legacy,occupation-url}.ts` (+ legacy/occupation-url tests), `src/components/{pool-explorer,home-experience,check-flow,report}.tsx`, `src/app/{page,check/page,sample/page,methodology/page}.tsx`, `.prettierignore`, `CLAUDE.md`, `README.md`, `scripts/README.md`, `docs/{HANDOFF,REPORT-COVERAGE}.md`
- Moved: the legacy JSON → `src/lib/data/__fixtures__/legacy-2026-10/`. Deleted: `scripts/import-report-evidence.py`

## Self-review / concerns
1. **New empty-state copy for states that could not occur before.** For "other", hasData false and failed loads, I kept the exact old text ("This occupation is not in the imported snapshot…"). When the core loads but has no 189 pool (279 occupations, many with 190/491 data), "not in the imported snapshot" would be false. The pool section therefore says "This occupation has no published 189 submitted EOIs in the imported snapshot. Your points are available; no pool comparison has been invented."
   - If a 189 pool exists but the selected 190/491 pathway does not, the section keeps its controls and says "No {visa} submitted EOIs are published…". The old code would have collapsed the whole section and stranded the visa toggle.
   - The explorer has its own short messages for no-pool and load-failed.
   - The 11 original occupations never reach these branches. Please confirm the wording, or ask me to revert to the old text everywhere.
2. **Sample HTML grew from 97.6 KB to 142 KB.** The 32 KB index is serialised as the `comparisonIndex` prop in the RSC payload. A thin client wrapper that imports the index would avoid the duplication; I did not add one, to stay with the brief's prop design.
3. In the check flow, the default comparison (261313) is fetched client-side rather than server-preloaded (the brief preloads only on /sample/), so it shows "Loading published data…" briefly.
4. The methodology page and other copy still hard-code "31 October 2026" in prose. Only the count and URL are data-driven.
5. hasData false occupations (14) are in the pickers and show the old "not in the imported snapshot" text, per the controller's ruling. Strictly, they are in the snapshot with CLOSED-only history.
6. `report.tsx` is still over the 250-line guideline (704 lines). Only the sections this task touched were extracted.

## Fix report (review round 1, ruling R13)

Finding: the report claimed "This occupation is not in the imported snapshot" for occupations that are in the snapshot. That covered (a) hasData-false occupations and (b) indexed occupations whose file fetch failed.

Changes (commit `fix: distinguish unpublished and unloaded occupation data in the report`):
- `src/components/data/report-occupation.ts` gains two pure functions:
  - `unavailableReason(code, index)` returns `notIndexed` (also for "other" and ""), `noData` (indexed, hasData false) or `loadFailed` (indexed, hasData true).
  - `poolUnavailableMessage(code, index)` gives each reason its text:
    - notIndexed: the original text, exactly;
    - noData: "No submitted EOIs are published for this occupation in this snapshot. Your points are available; no pool comparison has been invented.";
    - loadFailed: "Published data for this occupation could not be loaded. Your points are still calculated; try again later."
- `PoolSection` takes an `unavailableMessage` prop, which Report computes from `profile.occupation` and `comparisonIndex`. The `OccupationLoad` and `ReportOccupation` unions are unchanged.
- `RoundsSection` takes `loadFailed`. When true it says "Invitation results for this occupation could not be loaded. Try again later." Otherwise it keeps the old text, which makes no dataset claim.
- `CompareCard` takes `loadFailed`. Only when the card is `unavailable` and the load failed does it say "Published data could not be loaded. Try again later.". A card that loaded but has no 189 pathway keeps "No imported pool available."

TDD:
- RED: `npx vitest run src/components/data/report-occupation.test.ts` gave 3 failed and 4 passed (`TypeError: unavailableReason is not a function`).
- GREEN: 7/7. The tests cover "other", "", an unknown code, hasData false and a failed load.

Verification:
- `npm run check` passes: 26 files, 210 tests.
- `npm run build` passes.
- Headless CDP against `out/`:
  - Horse Breeder (121316) shows the noData text in the pool section, the old rounds text and "No imported pool available.".
  - "other" shows the original text exactly.
  - With `233211.json` blocked via `Network.setBlockedURLs`, the pool, rounds and own card all show the could-not-be-loaded texts, and the comparison still loads.
  - With the network offline after the nominated file loaded, the comparison card shows "Published data could not be loaded. Try again later.".
- The sample page is unaffected: it is always `ready`.
