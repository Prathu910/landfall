# Task 5 report

Implemented `src/lib/outlook/wait.ts` (`lodgedPace`, `estimatedWait`, `LodgedPace`) and `wait.test.ts` (13 tests).
Test-first; final `npx vitest run src/lib/outlook/wait.test.ts` passes (13/13); `npm run check` passes (91 files, 948 tests).

Data vs brief (R2):
- Meera (TAS): snapshot gives "6 of the last 6 months", not 3. Test asserts 6.
- Nurse "75": Priya with superior English is 80 (very-strong); the test drops overseasYears to 2 to reach 75 and assert Strong.
- Kavya matched the brief exactly: ahead 871..966, pace 262, 2 rounds/year, 3..4 rounds, text verbatim. "older" cohort bucket is included in "months before the reader's month".
- Sana: the real core exists for 362311, so the no-data test passes `core: null`.

Decisions: rounds needed rounded outward (floor min, ceil max); rounds per year = rounds dated in (asOf - 1 year, asOf]; lodgedPace takes an optional trailing `asOf`. If lodged but pace is masked/zero, text is "No recent invitations at your score to measure a pace."; invalid or after-snapshot EOI date, or null detail, falls back to the planner text. Combined stamps with not-open fall to the no-data text.

## Fix report
Changes in `wait.ts`: `lodgedPace` returns `{kind:"pace"|"no-pace"|"unknown"}`; `asOf` is required; NO_PACE_TEXT only for masked/zero pace or no rounds in the last year, otherwise (month not fetched, no pool, bad or late date) the planner text. Rounds needed clamped to at least 1 in the text. Competitive month prefers the latest round with cut-off equal to the points, else the latest at or below. Imports from ./evaluate-profile merged.
Tests added: masked pace, zero pace, month not fetched, min 1 round, equal-cutoff round (Sep 2026 over a later lower Oct round).
Command: `npx vitest run src/lib/outlook/wait.test.ts` -> 18 passed; `npm run check` -> 91 files, 953 tests passed.
