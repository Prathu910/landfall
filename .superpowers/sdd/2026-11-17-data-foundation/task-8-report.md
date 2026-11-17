# Task 8 report: Generator with validation and atomic writes

Status: DONE_WITH_CONCERNS (minor; see Concerns)
Commit: 91e9518 feat(import): generate validated per-occupation data atomically (base 07d8c00)

## Implemented

- `scripts/import/generate.ts`: `generate(input)` returns `GeneratedData`. It also re-exports `writeGenerated` and `WriteOptions`.
  - **Extension:** `GeneratedData` gains two fields beyond the brief:
    - `rounds: RoundsFile`, needed by R2 so `writeGenerated` can write `rounds.json`;
    - `newestRawMonth: MonthKey | null`, needed so `validateGenerated` can check "asAt not older than the newest data/raw folder" without doing I/O.
  - **Which raw files it reads:**
    - Latest-only views come from the asAt folder only.
    - Multi-month views (`view.months !== "latest"`: status-history, invited-by-score, state-invited, invited-profile) come from every `data/raw/<YYYY-MM>/` folder up to asAt, using `readRawView` (newest revision).
    - A view missing for asAt throws. Missing older months are skipped.
  - **Snapshot id:** `skillselect-<YYYY-MM-lastday>`.
  - **Manifest:**
    - `sources` = dashboard URL plus the two round-page URLs. These are now exported from `rounds.ts` as `CURRENT_ROUNDS_URL` and `PREVIOUS_ROUNDS_URL`; `fetchRoundPages` uses them.
    - `totals[visa]` = `pool[visa].total`.
    - `hasData` = any total with `parseCountText(...).max > 0`, so `<20` counts as data.
    - `group: null`.
  - **Index:** `{code, name, hasData}`, sorted by code.
- `scripts/import/generate-rows.ts`: `parseViewRows(view, file)` turns raw parts into typed rows.
  - **Column mapping:** follows the canonical hypercube order, built from `view.shown` plus the part's `attribute` variant. As At Month, Visa Type, EOI Status and the count are always present.
  - **Header checks:** the column count must match. Known titles are asserted: "As At Month", "Visa Type", "Occupation", "EOI Status", "Points" or "Score", and "Count EOIs".
  - **Every value is parsed strictly, and anything unexpected throws a descriptive error.** Each error message names the view, the asAt and the partition. The checks are:
    - As At Month must be `mm/yyyy` and equal the folder's month;
    - Month Submitted may be `mm/yyyy` or `dd/mm/yyyy`;
    - the visa must be one of the three in `VISA_NAMES`, so family-sponsored 491 fails;
    - the occupation must be `<6-digit code> <name>`;
    - the status must be in `view.statuses`;
    - points must be digits;
    - the count must pass `isCountText` (so `-` fails);
    - each row's width must match the header;
    - a shown Nominated State column is rejected.
  - **Partitions** must match `partitionBy` (plus `attribute` for variant views). The state must be one of the 8 named states or ANY, so N/A and AUSTRADE fail. The score must be digits, and the attribute must be one of the 4 known attributes.
- `scripts/import/generate-assemble.ts`: `assembleOccupations` builds one core and one detail per code.
  - Rows are applied oldest as-at first, so the newest name wins.
  - A duplicate key throws.
  - A 189 row in a state view throws.
  - Profile values keep the displayed text as their keys.
  - `pool[visa]`:
    - `total` is the status-history SUBMITTED total at asAt, read with points hidden (R4). A missing row becomes `"0"` because that table is fully paged; this matches `countIn` semantics.
    - `byScore` comes from pool-by-score.
    - A visa with neither a total nor score rows gets no pool entry, so it reads as unavailable.
  - **R8:** cohorts and cohortsByScore keep only submitted months from `cohortWindowStart(asAt)` (= asAt − 35 months; 2023-11 for 2026-10) onwards. Older months are dropped and never summed, so the generator writes no `"older"` key. A code comment explains why.
- `scripts/import/generate-rounds.ts`: `matchRounds` matches round rows to codes using `normalizeOccupationName`.
  - Unmatched round names go to `manifest.roundsUnmatched`, de-duplicated and sorted.
  - Every occupation gets every round in `rounds189`, newest first, with `null` where it is not listed.
  - `rounds.json` rows are `{name, code|null, cutoff}` (R2).
  - A round name matching more than one dashboard code throws.
  - A repeated row in one round keeps the lowest cut-off, consistent with R7.
- `scripts/import/generate-write.ts`: `writeGenerated(outRoot, data, {serialize?})` (R3).
  - **Staging:** creates `mkdtemp(outRoot/.generate-*)` and writes `occupations/<code>.json`, `<code>.detail.json`, `manifest.json`, `occupation-index.json` and `rounds.json` there.
  - **Swap:** each live entry is renamed to a backup inside staging, and the staged entry is renamed into place. If any step fails, the swap rolls back. The staging folder is always removed.
  - Other files in `outRoot` (for example `states.ts`) are untouched. Stale occupation files disappear because the whole folder is replaced.
  - The default serialiser is compact `JSON.stringify`.
- `scripts/import/validate-generated.ts`: `validateGenerated(data, previousManifest)`. It checks:
  - the manifest, core and detail guards;
  - that every record's snapshot and asAt match the manifest;
  - for duplicate codes in the index, cores and details, and that index, cores and details agree;
  - that the latest SUBMITTED total (status history, absent = 0) overlaps the sum of the `pool.byScore` intervals. It also checks that `pool.total` equals that SUBMITTED text;
  - that, for every month and visa, INVITED overlaps the sum of `invitedByScore` intervals;
  - that the occupation count has not fallen more than 10% from the previous manifest;
  - that asAt is not older than `previous.asAt` or `newestRawMonth`;
  - that core files are ≤ 50×1024 bytes and detail files ≤ 250×1024 bytes, measured on the serialised JSON.

  Interval arithmetic only runs on cores that pass the guard, so a malformed count produces an issue rather than a crash. Each issue names the code and visa, for example `261313 visa 189 2026-10: SUBMITTED 500 is outside the score-row sum 150–169`.
- **Carry-over from Task 6:** `scripts/import/atomic-write.ts` adds `writeFileAtomic(path, text, writeFile?)`. It writes a hidden temp file in the same directory, renames it into place, and removes the temp file on failure. `writeRawView` now uses it and accepts `options.writeFile` for injection in tests.
- `.prettierignore` now also ignores `src/data/occupations/` and `data/raw/`. Both hold compact importer output that would otherwise fail `format:check` once Task 9 commits data.
- `scripts/import/generate-fixture.ts`: test support. It builds a temp raw store with `writeRawView` and `encodeRaw`: 2 occupations, months 2026-09 and 2026-10, every view at asAt, the multi-month views at 2026-09, and three rounds rows including one unmatched name.

## Tests and results

- `scripts/import/generate.test.ts` (14 tests). Covers:
  - Generation:
    - two cores with the expected `pool`, `statusHistory`, `invitedByScore` and `rounds189` (one `null`);
    - state pools with ANY kept separate, and multi-month stateInvited;
    - the full detail record: cohorts with the 36-month window boundary (2023-11 kept, 2023-10 dropped), cohortsByScore in both month formats, and invitedProfile across months;
    - the manifest, index and rounds file;
    - an occupation seen only in older history (`hasData: false`, `pool {}`; this also proves the newest raw revision is used);
    - raw months after asAt are ignored while `newestRawMonth` still reports them.
  - Loud failures:
    - a view missing for asAt;
    - a changed column title;
    - a wrong column count;
    - an unknown visa, a `-` count or a mismatched As At Month;
    - an AUSTRADE partition.
  - writeGenerated:
    - it replaces generated files and the occupations folder and keeps `states.ts`;
    - **Review Focus 4:** a serialiser that throws on its 3rd call leaves every byte of the target unchanged, with no staging leftovers;
    - it creates the folders on first write.
- `scripts/import/validate-generated.test.ts` (9 tests):
  - the generated fixture is valid;
  - a SUBMITTED total outside the score sums (raw status-history revised to 500) gives exactly one issue, naming 261313 and visa 189;
  - an INVITED mismatch;
  - guard failures for a core and a detail;
  - duplicate codes, and a missing detail;
  - a snapshot mismatch;
  - an occupation-count drop >10%, plus the case with no drop;
  - asAt older than the previous snapshot or the newest raw month;
  - oversized core and detail files.
- `scripts/import/raw-store.test.ts`: two new tests. A failing first write, and a failing revision write, each partially write and then throw; neither leaves a partial or temp file, and the existing view stays intact.
- `npm run check`: Prettier OK, ESLint OK, tsc OK, Vitest 18 files / 146 tests passed.
- `npm run build`: passed (static export).

## TDD evidence

**RED.** The tests and fixture were written before any implementation. Command: `npx vitest run scripts/import/raw-store.test.ts scripts/import/generate.test.ts scripts/import/validate-generated.test.ts`

```
 FAIL  scripts/import/generate.test.ts [ scripts/import/generate.test.ts ]
Error: Cannot find module './generate' imported from .../scripts/import/generate.test.ts
 FAIL  scripts/import/validate-generated.test.ts [ scripts/import/validate-generated.test.ts ]
Error: Cannot find module './generate' imported from .../scripts/import/validate-generated.test.ts
 FAIL  scripts/import/raw-store.test.ts > raw store > leaves no partial file when a first write fails partway
AssertionError: expected [Function] to throw an error
 FAIL  scripts/import/raw-store.test.ts > raw store > keeps the stored view intact when a revision write fails partway
AssertionError: expected [Function] to throw an error
 Test Files  3 failed (3)
      Tests  2 failed | 4 passed (6)
```

**GREEN.**

- `npx vitest run scripts/import/raw-store.test.ts`: 6 passed.
- `npx vitest run scripts/import/generate.test.ts`: 14 passed.
- `npx vitest run scripts/import/validate-generated.test.ts`: 9 passed.
- `npm run check`: 146 passed.

## Files changed

- New:
  - `scripts/import/atomic-write.ts`
  - `scripts/import/generate.ts`
  - `scripts/import/generate-rows.ts`
  - `scripts/import/generate-assemble.ts`
  - `scripts/import/generate-rounds.ts`
  - `scripts/import/generate-write.ts`
  - `scripts/import/generate-fixture.ts`
  - `scripts/import/validate-generated.ts`
  - `scripts/import/generate.test.ts`
  - `scripts/import/validate-generated.test.ts`
- Modified:
  - `scripts/import/raw-store.ts`: atomic writes, plus an optional `writeFile` option.
  - `scripts/import/raw-store.test.ts`
  - `scripts/import/rounds.ts`: exported the round URLs.
  - `.prettierignore`

## Self-review

- **File sizes:** all modules are ≤ 237 lines; `generate.ts` is 151.
- **Casts:** there is no `any`. The remaining casts are:
  - `{} as T` in `child`: every nested level is a plain map, and the guards re-check the output;
  - `{} as RowsByView`: filled for every VIEWS id straight away;
  - status, state and attribute text cast after membership checks.
- **Honesty rules:**
  - masked counts stay as CountText, and sums are intervals with overlap checks only;
  - nothing is summed across visas, states or as-at months;
  - ANY is kept as its own state key;
  - a missing round row stays `null`;
  - older cohorts are dropped, never invented.

## Concerns (minor)

1. **Shape decisions Task 9 should know about:**
   - **Occupation set:** the index includes every code that appears in any raw month up to asAt. A code seen only in older history therefore gets `hasData: false`, and its core keeps that history.
   - **Raw views must be complete:** generation throws if any view is missing at asAt, so `--generate-only` needs every view present for that month.
   - **Size gap:** the size limits use compact JSON. `writeGenerated` with the default serialiser writes exactly that, but a custom serialiser could exceed what was validated.
2. **Untested rollback:** the rollback inside `swapIn` (a rename failing after staging is complete) has no test, because there is no injection point for `renameSync`. The tested path, a failure while staging, is the realistic one.
3. **Crash leftovers:** a hard crash, such as SIGKILL, during staging can leave a `src/data/.generate-*` or `.<name>.tmp` folder or file behind. It does not affect the live files. Task 9 may want to gitignore `src/data/.generate-*`.
4. **Unobserved titles:** the column titles for Month Submitted, the profile attributes and Nominated State were never observed live, so they are not asserted. Misordered columns would still fail on value parsing. `Points`/`Score` are both accepted for the points column.
5. **Uncovered INVITED months:** the INVITED check treats a month missing from invited-by-score as `{0,0}`. If a future run drops invited-by-score months that still have INVITED in status-history (beyond reduction 2's "no INVITED rows" rule), validation will flag them. This is intentional, but it must be kept in mind.

## Fix report (review round 1, Ruling R9)

The review raised one Important issue: the >10% occupation-drop check could never fire, and a renumbered code would clash in round matching.

### Changes

- `scripts/import/generate-assemble.ts`: a new `presentCodes(rowsByView, asAt)` defines the occupation set.
  - A code is in the set if it appears in any row of a latest-only view, or in an asAt row of status-history.
  - `assembleOccupations` drops rows for every other code before it builds anything.
  - As a result, index, cores, details and `manifest.occupations` hold only codes present at asAt.
  - `matchRounds` also sees only those codes, so a renumbered code that kept its name no longer makes it throw.
  - History-only codes stay in `data/raw` but are not surfaced.
- `scripts/import/generate.test.ts`:
  - The test "keeps an occupation seen only in older history" was replaced by "omits occupations seen only in older months (R9)". Its 2026-09 history contains:
    - 233211 Civil Engineer;
    - a renumbered "261399 Software Engineer".
  - It asserts that only 254499 and 261313 appear in the index, cores, details and manifest, and that Software Engineer still gets its 95 cut-off.
- `scripts/import/validate-generated.test.ts`: a new test, "reports a drop when the asAt tables lose codes that older months still hold (R9)".
  - The previous manifest has 22 occupations, because 20 extra codes were present at 2026-10.
  - In the current raw data those 20 codes appear only in 2026-09.
  - The test asserts that validation returns exactly `Occupation count fell from 22 to 2 (more than 10%)`.

### RED

Command: `npx vitest run scripts/import/generate.test.ts scripts/import/validate-generated.test.ts`

```
 FAIL  scripts/import/generate.test.ts > generate > omits occupations seen only in older months (R9)
Error: Round 2026-10-15: "Software Engineer" matches several occupations (261313, 261399)
 FAIL  scripts/import/validate-generated.test.ts > validateGenerated > reports a drop when the asAt tables lose codes that older months still hold (R9)
AssertionError: expected [] to deeply equal [ Array(1) ]
      Tests  2 failed | 22 passed (24)
```

### GREEN

- The same command: 2 files, 24 tests passed.
- `npm run check`: Prettier OK, ESLint OK, tsc OK, Vitest 18 files / 147 tests passed.

### Effect on earlier concerns

Concern 1's first point (history-only codes get `hasData: false`) no longer applies; such codes are now excluded. Commit: see `git log` (fix(import): limit occupations to those present at the as-at month).
