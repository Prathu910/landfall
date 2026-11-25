# Task 7 report

Implemented `src/lib/updates/facts-round.ts` (`buildRoundSection`, `previousRound`) with tests in `facts-round.test.ts`.
Frozen 2026-10 data: `src/lib/updates/__fixtures__/rounds-2026-10.json` (the Oct and Jun rounds copied from rounds.json v2), read via JSON.parse, so tests don't touch live `src/data`.

- Rows with the same code collapse to the lowest cut-off; unmatched names are keyed by name and count in totals and fell/rose/same, but never appear in falls/rises/cardPicks (CutoffMove needs a code).
- Occupations sorted by name; distribution ascending by score.
- cardPicks: if both falls and rises are non-empty, up to 2 falls + 1 rise, else the 3 largest moves; taken from the full lists, not the 6 shown.
- R4: throws "Round totals missing for <date>" when the round has no totals or no 189 row.
- `names` (code -> display name) overrides the row name when present.
- Tests: 7 pass (2026-10 figures, next older round, duplicate collapse, unmatched name, no previous, one-kind picks, throw). `npm run check`: 147 files / 1519 tests pass.
