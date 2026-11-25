# Task 9 report: data facts

Commit: `1e46d9a feat(updates): data facts (national, states, movers, notable 189)` (BASE 2eede89).

## What was implemented

- `src/lib/data/months.ts`: `shiftMonth(month, delta)` (+ test). This also fixes Task 5's deferred minor: `nextMonth` no longer sits between the `calendarMonths` JSDoc and its function.
- `src/lib/updates/facts-national.ts`: `coresAsAt(cores, month)`, the shared R6 filter that keeps only cores whose `asAt` is the month; `nationalFigures` (SUBMITTED and INVITED per visa; each figure sums one visa in one month; `previous` is null when no core has the previous month fetched; a fetched month with no status reads "0"); `scoreTotals(cores, month, visa, "pool" | "invited")` (pool from `pool[visa].byScore`, invited from `invitedByScore[visa][month]`, lowest score first); `VISAS`.
- `src/lib/updates/facts-states.ts`: `stateFigures`. For 190 and 491 it covers the eight states and `ANY`: the total of INVITED cells in the month, its floor, `maskedCells` (the count of "<20" cells, for Task 11's "+ N hidden small counts"), `previousFloor` (null when no core has the previous month), and the top 3 occupations by floor (floor > 0, ties broken by code). States are never added together.
- `src/lib/updates/movers.ts`: `exactPool189` (null when masked or not fetched) and `poolMovers(cores, month, limit = 6)`, with exact counts at both ends, sorted by size of change and then code, excluding unchanged pools.
- `src/lib/updates/facts-data.ts`:
  - `notable189(cores, rounds, month, limit = 10)` uses the newest round dated in or before the month (R5) and the round before it for `previousCutoff`. Rows are listed codes with exact pools, largest first. `pool` is a CountText and `invited` is the month's 189 INVITED text.
  - `largePoolsNotListed(cores, rounds, federal, month, limit = 6)` covers codes on the federal 189 list with an exact pool above 0 that the newest round didn't list. `roundsNotListed` counts consecutive recent parsed rounds. `lastListed` is null if no stored round listed the code.
  - `buildDataSection(input)` composes all of the above, plus `pickSpotlight`, `nominations` (the newest stored round's non-null table, not cut to the month, per R5), `sources.previous` (the previous manifest when its `asAt` is the previous month, else the previous month's facts `data.sources`, else null) and `occupationsAdded`/`Removed`.
  - R6 in `buildDataSection`: every aggregate and pick uses only cores with `asAt === month` and a manifest entry without `lastAsAt`. `manifest.occupations` serves as the index, so the brief's interface needed no index parameter. A founder `spotlight` naming a dropped code therefore throws (in `pickSpotlight`).
  - It throws when `manifest.asAt !== month`, or when `previousFacts.month` is not the previous month.
- `src/lib/updates/spotlight.ts`: `listedRow` is now exported and reused, with no behaviour change.
- `src/lib/updates/__fixtures__/data-2026-10.ts` (test-only): frozen cores and manifest, the stored `rounds.json` cut to rounds dated on or before 2026-10-31 (R1/R5), and the federal list.

## Interface additions beyond the brief

- `buildDataSection` takes an optional `spotlight?: string | null` (the founder override that spec 6.8 and Task 10's `--spotlight` need). Without it, Task 10 has no way to pass the override.
- Exported helpers: `coresAsAt`, `VISAS`, `exactPool189`, `listedRow`.
- I did not add a format helper for "+ N hidden small counts". `maskedCells` is stored, and the brief doesn't call for a format string, so the helper is left for Task 11.

## Deviation from the brief's values (needs a controller ruling)

The brief's figures leave out the 14 `hasData: false` occupations. The mockup's `extract.py` loads cores only for `hasData` entries. Those cores exist (all 493 files) and do hold published "<20" cells. For example, Neurosurgeon 253513 has 189 and 190 INVITED "<20" in 2026-10 and a 190 NSW cell "<20"; Endocrinologist and Shipwright are similar. Leaving them out makes a range whose max may sit below the true value, which conflicts with "<20 is 0–19, never collapsed". So I sum all current cores, and four expectations change, each by 19 times the number of extra masked cells:

| Figure | Brief | Implemented |
|---|---|---|
| 189 submitted previous max | 182,254 | 182,311 |
| 189 invited current max | 16,643 | 16,700 |
| 190 invited current max | 9,867 | 9,905 |
| 190 NSW total max / maskedCells | 6,927 / 323 | 6,946 / 324 |

All mins, floors and the other values match the brief exactly: 166,555–167,904; 181,076; 14,876; 0–285; 7,017; VIC 1018; NSW 790; ANY 243; TAS 491 floor 0 / 138; VIC previous floor 0; mover 254499 7500 → 4280; notable 241111 / 90 / "13693"; and the six not-listed names, with Software Engineer at 9464 / 4 / 2024-11-07 / 95. The "about 167,000" passport figure is unaffected.

The tests carry a comment explaining the gap, plus a test showing that Neurosurgeon adds 19 to the 189 invited max. If the controller prefers the brief's numbers, the change is one filter in `buildDataSection` (and in the test fixture): keep entries with `hasData`.

## Tests

- New tests: facts-national (6), facts-states (8), movers (5), facts-data (16), and months `shiftMonth` (1). Required cases covered:
  - INVITED is never summed across months.
  - A mover masked in either month is skipped.
  - Previous values are null when the previous month wasn't fetched (national and state).
  - `added`/`removed` are null without a previous manifest.
  - R5: later rounds are ignored by notable.
  - R6: dropped cores and manifest `lastAsAt` entries are left out of national figures, states, movers and the spotlight, and a dropped override throws.
  - A previous source comes from the previous manifest or from the facts file, and last month's spotlight is skipped.
  - The founder override works.
  - A month mismatch throws.
- TDD RED: `npx vitest run src/lib/updates/{facts-national,facts-states,movers,facts-data}.test.ts src/lib/data/months.test.ts` failed with 4 files: "Cannot find module './facts-national'" (and the same for the other three), as expected before implementation.
- First GREEN run: 70 passed and 2 failed, the two maxima above (expected 6927, got 6946, and the national pair). I investigated, found the `hasData: false` cause and updated those tests as described.
- GREEN: `npx vitest run src/lib/updates src/lib/data/months.test.ts` gave 73/73. `npm run check` passed: 152 files, 1568 tests. Lint shows only the known warning in `.superpowers/brainstorm/.../lib.js`, deferred from Task 4.

## Files

- Created: `src/lib/updates/{facts-data,facts-national,facts-states,movers}.ts` and their tests, plus `src/lib/updates/__fixtures__/data-2026-10.ts`.
- Modified: `src/lib/data/months.ts`, `src/lib/data/months.test.ts`, `src/lib/updates/spotlight.ts` (exported `listedRow`).
- Line counts: facts-data 223, national 99, states 106, movers 49. All are under 300.

## Self-review notes and concerns

1. The `hasData: false` deviation above. This is the main concern.
2. The test fixture reads the live `src/data/rounds.json`, cut at 2026-10-31. It relies on R1 (stored rounds never change). The live federal list is read the same way as in the spotlight test.
3. `largePoolsNotListed` counts `roundsNotListed` over parsed rounds only, so skipped rounds are absent. When no stored round listed the code, the count is the number of parsed rounds and `lastListed` is null. Task 11 needs wording for that case.
4. `nationalFigures.current` falls back to `{0, 0}` if no core has the month fetched, which can't happen for the as-at month. `stateFigures` has the same fallback for a state with no fetched month.
