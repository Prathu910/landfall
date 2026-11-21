# Task 8 report

Implemented `src/lib/outlook/charts.ts` (`cutoffColumns`, `queueView`) and `charts.test.ts` (11 tests). Exported `submittedBefore` from `wait.ts` (one-word change) to reuse the lodged "earlier months" logic.

Tests: `npx vitest run src/lib/outlook/charts.test.ts` 11 passed; `npm run check` passed (96 files, 1010 tests).
TDD note: implementation was written before the test file, so there is no RED run; tests were checked against real data afterwards.

Differences from brief/mock (R2, data wins):
- Kavya (lodged, 70 pts): unit is 10 (12/80/13/91 squares = 196), not the mock's 40; the brief rule "smallest unit giving <=200 squares" picks 10. Earlier label is "about 760–840" (mock ~760–860); later is exact "909" (mock ~910).
- Mock target labels are inconsistent ("With English, 80"); target uses the best move's title without ", +N": "With Superior English, 80". Combined best move reads "With both together, N".
- Lodged groups appear whenever a detail file and valid EOI month <= asAt exist (even if `lodgedPace` is no-pace, as for Kavya); `lodgedPace` is not called, only its `submittedBefore` helper.
- Emphasis: pool = larger of ahead/tied (ahead on tie), "you" when first in line; lodged = your month.
- cutoffColumns returns null when core is null or no round in the record lists the occupation (e.g. Sana).

Concern: charts.ts is 304 lines (limit 300); not split per instructions.

## Fix report
Changes:
1. Queue half moved to `src/lib/outlook/queue-view.ts` (`queueView`, `QueueView`, `QueueGroup`; 240 lines). `charts.ts` keeps `cutoffColumns` (71 lines). Queue tests moved to `queue-view.test.ts`.
2. Comments added at the cohort missing-key-is-zero reads (docs/DATA.md: cohort files are one full download).
3. `about()` returns "under 20" for a masked interval, with no "about". Edge test uses a lodged detail with masked month and later groups.
4. First-in-line pool aria now keeps ", in a pool that isn't being invited" when stampedClosed; tested.
Correction: my earlier remark that `lodgedPace` returns no-pace for Kavya was mistaken. My scratch script used an undefined points value (wrong field from calculatePoints). Task 5's tests (pace 262) stand.
Tests: `npx vitest run src/lib/outlook/charts.test.ts src/lib/outlook/queue-view.test.ts` 13 passed; `npm run check` passed (97 files, 1012 tests).
