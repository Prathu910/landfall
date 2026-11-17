# Task 9 report: data import CLI and first real import (as-at 2026-10)

Status: DONE_WITH_CONCERNS

## Commits

- `0047380` feat(import): add data import CLI
- `56f45b2` fix(import): select score partitions by number
- `75b1b07` fix(import): skip dashboard rows with no occupation
- `4e6f45c` fix(import): skip the dashboard connection when nothing is left to fetch
- `3c4bfab` data: import SkillSelect snapshot as at 2026-10 (all occupations)

## Implemented

- `scripts/import/cli.ts`: exported pure `parseArgs` (`--as-at` required YYYY-MM, `--backfill`, `--generate-only`, `--checked-at` YYYY-MM-DD defaulting to local today; unknown flags and `--generate-only --backfill` are rejected). `main()` is async with no top-level await, sets `process.exitCode`, and closes the session in `finally`. It runs only when `argv[1]` ends in `cli.ts`, so tests can import `parseArgs`. Raw root is `data/raw`, output root is `src/data`. The previous manifest is read only if it passes `isManifest`, so the legacy `pool.json` and `report-evidence.json` are untouched. The CLI prints the parsed and skipped rounds, the page reads used out of the budget, any revisions (with row counts before and after), the occupation count, unmatched round names, validation issues and the duration. It exits 1 on any issue and writes `src/data` only when validation is clean. `--generate-only` rebuilds the rounds from `src/data/rounds.json`.
- `scripts/import/import-plan.ts`: `planFetches(asAt, mode, isStored)`. Monthly mode fetches every view at asAt (pool-by-score first) plus the previous month of status-history, invited-by-score and state-invited. Backfill fetches every window month up to and including asAt that isn't stored yet, so it can resume. Also holds `PAGE_READ_BUDGET` (150/600), `shiftMonth` and `poolScores(file)`, the union of scores in pool-by-score.
- `scripts/import/import-fetch.ts`: `fetchViews(session, jobs, {log, onFile, readStoredPool})`. Partition values are states `ACT NSW NT QLD SA TAS VIC WA ANY` (`STATE_KEYS`, now exported from generate-rows) and the pool's scores, taken from the stored pool-by-score file on a resumed run. `onFile` stores each finished view-month straight away. A guard stops the run when two consecutive queries return the same table with at least 20 rows, which means a selection silently did not apply.
- `scripts/import/qlik-client.ts` (call economy): field, variable and object handles are cached per session. Setting a toggle to its known value is skipped. Clearing a field that this session already cleared, and has not selected since, is skipped. `applyBookmark` forgets both. This cut the calls per query from about 58 to about 6 and did not change the page-read count.
- Zero-row tables: `readTable` returns the header and `[]` with no page read when `qcy === 0` (test added). runView keeps the part, and the CLI writes the file.
- `package.json` scripts `data:import` and `data:generate`; `.gitignore` gets `src/data/.generate-*`.

## Live import: what happened (4 runs, one successful dataset)

1. **Run 1 (stopped by me, 6 page reads, nothing written).** The dashboard streamed at only about 12–19 KB/s, while general bandwidth here is about 500 KB/s; the server or its gateway does not negotiate permessage-deflate. Fetched data was held in memory until the end, so any failure late in a long run would have thrown everything away. I stopped the run and made backfill resumable: each finished view-month is stored atomically, already-stored months (asAt included) are skipped, and the per-call timeout went up to 300 s. The files left after a failure are always complete view-months. `src/data` is still written only after full validation.
2. **Run 2 (stopped by me, 52 counted page reads plus about 8–11 more on the unfiltered part).** pool-by-score, status-history, invited-by-score and cohorts at 2026-10 were stored. The first cohorts-by-score part (score 20, which has 1 pool row) was streaming page after page. I stopped it and probed the dashboard using layout sizes only (GetLayout, **0 page reads**). Selecting `Score` by qText `"20"` returns qReturn true but leaves the table at 9135 rows; selecting it by qNumber 20 gives 1 row. `Nominated State` by text works (190/491 pool 7587 rows, VIC 5977, ANY 4720, NT 4224). Fix `56f45b2`: score partitions are selected by number. Nothing from the unfiltered part was stored.
3. **Run 3 (fetch complete: 73 view-months, 376 page reads, 0 revisions, 1809 s).** Generation then threw on a status-history 2026-04 row whose occupation is "None Provided": one 491 SUBMITTED `<20` count. A scan of all raw data found this single row and no other uncoded occupation text. Fix `75b1b07`: that exact text is skipped, and any other uncoded text still throws (tested). A local dry run then gave 493 occupations and 0 validation issues.
4. **Run 4 (0 page reads, 2 s).** I re-ran the backfill to fetch the round pages, because no `rounds.json` existed yet for `--generate-only` to use. It planned 0 view-months, so it no longer connects to the dashboard (`4e6f45c`). It exited 0 and wrote `src/data`.

## Required numbers

- **Page reads:** run 1: 6. Run 2: 52 counted, plus about 8–11 not counted because the process was stopped before it printed its total. Run 3: 376. Run 4: 0. Probes: 0. **Total about 440, within 600.** The stored dataset cost 428 of those (52 + 376). Each run was also capped at 600 by `maxPageReads`.
- **Page reads by view at 2026-10:** pool-by-score 6, status-history 3, invited-by-score 2, cohorts 41, cohorts-by-score 71 (25 scores), state-pool 32, state-invited 9, invited-profile 4, invited-profile-state 35. Backfill months: status-history 3 each, invited-by-score 2 each, state-invited 9 each, invited-profile 4 each.
- **Duration:** the run that fetched most of the data took 1809 s (about 30 min). Run 2 took about 28 min and run 1 about 6 min. Total live time was about 65 min.
- **Reductions applied:** none. No budget or size limit was reached, so none of the pre-approved reductions 1–3 was needed. The generator's existing 36-month cohort window (Ruling R8) still applies when the data is generated.
- **Sizes (`du -sh data/raw/*`):** 2024-11..2025-10 are 96–124K each. 2025-11..2026-06 are 260–336K. 2026-07 is 132K, 2026-08 140K, 2026-09 140K and 2026-10 5.0M. All `data/raw` is 9.3M, so every month is under 10 MB. The largest core is 254499.json at 27,138 B (limit 50 KB). The largest detail is 233211.detail.json at 29,304 B (limit 250 KB). `src/data/occupations` holds 986 files (493 core + 493 detail) totalling 9.3M. manifest.json is 57 KB, occupation-index.json 32 KB and rounds.json 93 KB.
- **Occupations:** 493; 479 of them have `hasData`.
- **Skipped rounds:** 1. `2022-10-06`: no table with an Occupation column. This is the known Task 7 deferred item. In total, 20 rounds were parsed.
- **roundsUnmatched:** 6. `2335`, `2339`, `Life Scientist (nec)`, `Patho`, `Psychologist (nec)`, `Rheumatologist`.
- **Spot-checks (`statusHistory["189"]["2026-10"]`), all match:**
  - 261313 Software Engineer: INVITED `<20`, LODGED `119`, HOLD `343`, CLOSED `12354` (SUBMITTED `9464`).
  - 254499 Registered Nurses nec: INVITED `2730`.
- The legacy `src/data/pool.json` and `report-evidence.json` are unchanged.

## TDD evidence

- qlik-client: 3 new call-economy tests failed RED (`GetField`/`GetVariableByName`/`GetObject` called twice; "expected length 1 but got 2"). They passed GREEN after the cache was added. The empty-table and bookmark-reset tests passed from the start (they characterise existing behaviour).
- import-plan: RED `Cannot find module './import-plan'`, then GREEN 5/5. Resume test RED: `expected [ 'pool-by-score', …(8) ] to deeply equal [ 'cohorts' ]`, then GREEN.
- import-fetch: RED `Cannot find module`, then GREEN 3/3. The options or `onFile` or stored-pool change was RED (`log is not a function`, `expected [] to deeply equal [ 'status-history 2026-09' ]`, `pool-by-score must be fetched first`), then GREEN.
- cli parseArgs: RED `Cannot find module './cli'`, then GREEN 6/6.
- run-view score by number: RED (`- "number": 65 / + "text": "65"`), then GREEN.
- generate-rows "None Provided": RED (`occupation "None Provided" is not "<code> <name>"`), then GREEN 2/2.
- Final state: lint clean, typecheck clean, 22 files and 172 tests passing, `npm run build` passes.

## Concerns

1. **`npm run check` fails right now on files that aren't mine.** `docs/research/state-nomination-2026-27.md` and `docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md` appeared untracked while I was working, from someone else's parallel work, and they fail `prettier --check`. I did not touch or commit them. Lint, typecheck, tests, build and `prettier --check scripts package.json` all pass.
2. **Changes to earlier tasks' modules beyond the brief's file list** need review: the qlik-client call cache, run-view score-by-number, generate-rows skipping "None Provided", and the STATE_KEYS export.
3. **Resumable backfill and per-view-month raw writes** are my reading of "don't write partial data". A failure leaves only complete view-month raw files, which are uncommitted, and `src/data` is still written only after validation.
4. **Monthly budget risk.** The asAt views alone cost 203 page reads (cohorts 41 + cohorts-by-score 71 + state-pool 32 + invited-profile-state 35 + …). That is over the 150 monthly budget before the previous-month re-fetch, so a monthly import will exceed 150 unless reductions are applied. Reduction 1 at query time (filtering Month Submitted to the last 36 months) would cut cohorts and cohorts-by-score only in part. This needs a decision before the first monthly run.
5. **Dashboard throughput is about 12–19 KB/s,** so a full backfill takes about 1 hour, not several minutes.
6. **Six unmatched round names** (`2335`, `2339`, `Patho`, …) look like parsing artefacts on the round pages; `Rheumatologist` may simply not be on the dashboard. The Task 7 parser should look at them later. They don't block this task.
7. **`--generate-only` needs an existing `src/data/rounds.json`**, because raw round HTML is not stored. It exists now.

## Files

- Created: `scripts/import/cli.ts`, `cli.test.ts`, `import-plan.ts`, `import-plan.test.ts`, `import-fetch.ts`, `import-fetch.test.ts`, `generate-rows.test.ts`
- Modified: `scripts/import/qlik-client.ts` (+test), `run-view.ts` (+test), `generate-rows.ts`, `package.json`, `.gitignore`
- Data: `data/raw/2024-11` … `data/raw/2026-10` (77 files), `src/data/manifest.json`, `occupation-index.json`, `rounds.json`, `occupations/*.json` (986)
- Logs: `/private/tmp/claude-501/-Users-aveomac-aveo-projects-landfall/bf2c0e48-6228-44dd-99b2-f35c431c2c58/scratchpad/import2.log`, `import3.log`, `import4.log`

## Fix report (review round 1)

Finding (Important): `PAGE_READ_BUDGET.monthly` was still 150, but ruling R11 sets it to 250.

- **Test first:** `scripts/import/import-plan.test.ts` now has `PAGE_READ_BUDGET` › "allows 250 page reads a month and 600 for a backfill (ruling R11)", which asserts `{ monthly: 250, backfill: 600 }`.
  - RED: `npx vitest run scripts/import/import-plan.test.ts` gave 1 failed, 6 passed (`- "monthly": 250, + "monthly": 150`).
- **Fix:** `scripts/import/import-plan.ts` now sets `monthly: 250`. The comment cites R11.
  - GREEN: `npx vitest run scripts/import/import-plan.test.ts` gave 7 passed.
- **`npm run check`:** passes. Prettier reports all files formatted, lint and typecheck are clean, and Vitest runs 22 files with 173 tests passing.
- **Commit:** `fix(import): raise monthly page-read budget to 250`.
- R10, R11 and R12 and the handle caching are noted as accepted.
