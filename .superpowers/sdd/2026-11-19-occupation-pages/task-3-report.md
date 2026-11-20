# Task 3 report
Implemented charts.ts (poolBars, roundCards, roundsNote, cohortRows, cohortNote) and states.ts (stateRows) with tests.
Tests: charts.test.ts and states.test.ts; npm run check passes (77 files, 812 tests). Initial run had one failure (QLD "only": duplicate cohorts across 190 and 491 counted twice), fixed by checking distinct parts.
Notes: states with no list-kind stream (VIC etc.) read "Rules being checked" for onList and openTo; a state with lists but no match reads onList "Not on its 2026–27 list", openTo "Not applicable". openTo unions 190 and 491 list cohorts. Months absent from detail cohorts count as zero per brief. Co-author trailer uses Sonnet 5.5 per the session attribution reminder (contract says Opus 5.5).

## Fix round 1
- states.ts: membership now tracks `unchecked` (a non-list stream). When nothing matched and any stream of 190 or 491 is non-list, onList "Not on its imported list", openTo "See the official page"; all-list states keep "Not on its 2026–27 list" / "Not applicable".
- Real NSW is mixed (has a non-list stream), so the existing missing-code test now uses QLD (all list-kind); new test builds a mixed NSW rule by hand.
- charts.ts: comment citing docs/DATA.md R8 at the absent-month handling.
- Commands: `npx vitest run src/lib/occupation-page/states.test.ts src/lib/occupation-page/charts.test.ts` -> 18 passed; `npm run check` -> 77 files, 813 tests passed.
