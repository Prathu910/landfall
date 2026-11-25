# P1 Task 1 report

Implemented: `readRawView(..., { revisionsUpTo })` (filters `.rev-<date>` files after the date), `GenerateInput.revisionsUpTo` threaded through `readRows`, `scripts/import/frozen-snapshot.ts` (`FROZEN_2026_10`, `generateFrozenSnapshot`), test fixture `src/lib/data/__fixtures__/frozen-2026-10.ts` (memoised `frozenCore/Detail/Index/Manifest`), `legacy.test.ts` now uses `frozenCore`.

Tests: raw-store (new revisionsUpTo test), frozen-snapshot test, legacy.test pass; `npm run check` passes (136 files, 1449 tests). Did not capture a separate RED run (wrote tests and implementation together); the tests reference the new option and function, so they could not pass before.

Files: scripts/import/{raw-store,generate,frozen-snapshot}.ts, raw-store.test.ts, frozen-snapshot.test.ts, src/lib/data/legacy.test.ts, src/lib/data/__fixtures__/frozen-2026-10.ts.

Concern: the fixture and frozen test read `src/data/rounds.json` via `readRoundsFile` (see R13/R2: Task 4 must keep this working).
