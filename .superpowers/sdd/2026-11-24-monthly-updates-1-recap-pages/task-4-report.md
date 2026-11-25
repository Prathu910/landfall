# Task 4 report: Round pages v2 (totals, tie-break dates, nominations)

Status: DONE_WITH_CONCERNS (concerns below are judgment calls, not known defects)

Commit: `660d516 feat(import): parse round totals, tie-break dates and state nominations (rounds.json v2)` (BASE 72fd148). Not pushed.

## What was implemented

- `src/lib/data/rounds-file.ts`: `RoundTotal`, `NominationsTable`, `StoredRow`, `StoredRound`, `SkippedRound`, `RoundsFile` (`schemaVersion: 2`), `NOMINATION_STATES`, `isRoundsFile`. Relative imports only; nothing in `src/lib` imports `scripts/`.
- Parser (`scripts/import/rounds.ts`):
  - `ParsedRound` = `{ date, totals, tieBreak, rows: ParsedRow[], nominations }`. `ParsedRow` = `{ occupationName, cutoff, tieBreak, code? }`. `code` is set only on rows read back from `rounds.json`.
  - New `parseCurrentRound(html)`: the current round plus its nominations table. `parseRoundPagesDetailed` uses it.
  - Per-row tie-break comes from an occupation-table column matching `/^tie break/i`.
- `scripts/import/round-tables.ts` (new):
  - `parseTotals`: reads the block's first "Visa subclass" table when it has a "Total EOIs Invited" column (case-insensitive). A row with no subclass, or a count that isn't digits (commas allowed), throws "Unexpected total invited". With no such column the result is `null`. The round-level tie-break is the 189 row's tie-break cell.
  - `parseTieBreak`: a valid `dd/mm/yyyy` becomes an ISO date. `N/A`, a blank, `mm/yyyy`, or a date-shaped misprint gives null. Any other text throws.
  - `parseNominations`: headers must be exactly `ACT NSW NT Qld SA Tas Vic WA`, with one 190 row and one 491 row. Values must be counts or `<N`. Program year and period must be present. Otherwise it throws "Official page schema changed (State and Territory nominations: …)". A page with no nominations block gives `null`.
- `scripts/import/html-tables.ts` (new): the generic helpers moved out of `rounds.ts` (`decodeEntities`, `cellText`, `extractTables`, `texts`, `expandSpans`, `indexesWhere`, `parseLongDate`), plus `parseDayFirstDate` and `parseCount`. `rounds.ts` re-exports `decodeEntities`. Entities gained `ndash`/`mdash`, so the 491 label reads "… (subclass 491) – Family Sponsored". No stored occupation name contained an entity, and the name/code/cutoff fields are unchanged (verified).
- `scripts/import/round-store.ts` (new):
  - `writeRoundPage(rawRoot, date, html)`: writes `data/raw/rounds/<date>.html` atomically. An identical page is a no-op, a different page is replaced, and a date that isn't `YYYY-MM-DD` throws.
  - `keepStoredRounds(stored, parsed)` (R1): stored rounds are kept verbatim, including rounds the pages no longer show. Only new dates are added, newest first. A skip is dropped once its date has a round. `null` stored returns the parsed pages.
- `generate-rounds.ts`:
  - `matchRounds` carries totals, tie-breaks and nominations into `StoredRound`. A stored row keeps its stored code; a stored row with a null code is matched again.
  - `readRoundsFile` is v2-only and round-trips every field, including `code`. Types are re-exported from `rounds-file.ts`.
  - `generate.ts` writes `schemaVersion: 2` first.
- CLI:
  - `--rounds-html <dir>` reads `invitation-rounds.html` and `previous-rounds.html` from `<dir>`. It requires `--generate-only` ("--rounds-html needs --generate-only") and a folder argument.
  - That path and the fetch path share `readRoundPages`: parse, then `keepStoredRounds` against the current `rounds.json`, then `writeRoundPage` for the current page.
  - A `rounds.json` without `schemaVersion` (v1) is treated as nothing stored, so it is fully re-parsed once and the CLI logs that. A malformed v2 file throws.
- Data:
  - `src/data/rounds.json` v2 was regenerated with the brief's command.
  - `data/raw/rounds/2026-10-15.html` was added (byte-identical to the fixture).
  - `git status` after regeneration showed only those two data changes.
- Docs: `docs/DATA.md` (file list; v2 format, totals, tie-breaks, nominations, R1 under "189 invitation rounds"; `--generate-only`/`--rounds-html`), `scripts/README.md` (modules), `CLAUDE.md` (data line).

## Tests

- New `src/lib/data/rounds-file.test.ts`: accepts v2; rejects a file with no `schemaVersion` or with `schemaVersion: 1`; rejects missing v2 fields, malformed totals and dates, and a missing state.
- `scripts/import/rounds.test.ts`:
  - The brief's Oct and Jun assertions, verbatim. Jun: totals 10000, tie-break 2026-04-24, rows null, 13 rounds.
  - Nov 2025 totals with the decoded 491 label.
  - The 13 Jun 2024 lower-case header.
  - Month-only tie-breaks give null.
  - The exact list of rounds that have totals; Dec 2023 null.
  - A bad total throws; a bad tie-break throws.
  - "stops when the nominations table loses a state column"; a bad nominations value stops the import.
  - `parseCurrentRound`.
  - Existing `parseRoundBlock` expectations updated to the v2 shape.
- New `scripts/import/round-store.test.ts`:
  - **R1**: the pages are rebuilt so Oct sits only on the previous-rounds page (no tie-break column, no nominations) and the current page has a 12 Nov 2026 round. The test asserts that the re-parsed Oct has lost its tie-breaks and nominations, but `keepStoredRounds` keeps the stored Oct deep-equal, with Actuary still `2026-09-03` and nominations still present.
  - New-round order, stored rounds missing from the pages, skip handling.
  - `writeRoundPage`: path, no-op proven by a read-only folder, replacement, bad date.
- `scripts/import/generate-rounds.test.ts`:
  - v2 matching; a stored code is kept and a null code re-matched.
  - `readRoundsFile` v2 round trip, through `matchRounds` too; the v1 file is rejected (`/schemaVersion 2/`).
  - **R2**: regenerating from `data/raw` with `readRoundsFile(src/data/rounds.json)` gives `JSON.stringify(data.rounds)` byte-identical to the file.
- `scripts/import/cli.test.ts`: `roundsHtml` in the parsed args; "rejects --rounds-html without --generate-only"; a missing folder is rejected.
- `generate.test.ts` and `generate-fixture.ts` updated to v2.
- R2 was also checked by hand: `npm run data:generate -- --as-at 2026-10 --checked-at 2026-11-17` without `--rounds-html` left the `rounds.json` sha unchanged (7f08ccc…). A second `--rounds-html` run (v2 stored, keep path) also left it unchanged.

### TDD evidence

- RED: `npx vitest run scripts/import src/lib/data/rounds-file.test.ts` showed 4 failing files and 14 failing tests. These were the cli args shape and `--rounds-html`, the parseRoundBlock v2 shape, every totals/tie-break/nominations test, and `parseCurrentRound` is not a function. generate-rounds and round-store failed on imports. They failed as expected, because nothing was implemented yet.
- Note: `rounds-file.ts` was written just before its test, so that test was green on its first run. This is not strict TDD for that file.
- After implementing, before regenerating: 3 failures. Two were expected (the frozen-snapshot and R2 tests read the still-v1 `rounds.json`). The third exposed the real misprints (see concerns).
- GREEN: same command, 15 files and 118 tests passing. `npm run check`: 140 files and 1481 tests passing. The format, lint and typecheck steps are clean apart from one pre-existing warning in the untracked `.superpowers/brainstorm/round-recap-2026-11-24/assets/lib.js`. `npm run build` passed.

## Concerns and decisions for the controller

1. **One commit, not two.** Your instruction was that each commit must pass `npm run check` on its own. Every test that reads `src/data/rounds.json` breaks between a v2-only code commit and the data commit: the Task 1 fixture, `frozen-snapshot.test`, `sample-data.test`, `freeze.ts` and the new R2 test. So code, data and docs went in one commit, using the brief's code subject, with the data named in the body. If you want the brief's two-commit split as R13 originally allowed (with a red intermediate commit), it can be split.
2. **Misprinted tie-breaks on the live page.** The 15 Oct 2026 page prints `13/10/206` (Environmental Manager) and `01/07/206` (Forester). A strict parse would block the real import. These are stored as `null` (never guessed), and date-shaped misprints in general give null rather than failing. Non-date text still throws. This is documented in DATA.md and asserted in a test. The cost is that a future misprint goes silently to null; the CLI does not print it.
3. **Month-only tie-breaks give null.** Most previous-round totals give "month and year" (`11/2025`, `12/2022`; 13 Jun 2024 prints `15/2024`), so only Jun 2026 has a round-level tie-break. Storing `YYYY-MM` would keep more information but breaks the "ISO date" type.
4. **Oct round-level `tieBreak` is null.** Its totals table has no tie-break column; the dates are per row.
5. **Stored codes (R1/R2).** A stored row keeps its code. A stored unmatched row is re-matched, so an occupation added to the dashboard later gets its round history instead of a false "not listed". That changes a stored row's `code` from null to a code, which is a small exception to "verbatim". Totals, tie-breaks, nominations, names and cutoffs are never touched.
6. **v1 migration.** A `rounds.json` without `schemaVersion` is re-parsed in full once (logged). After this commit the file is v2, so this path only matters for an old checkout.
7. **The monthly fetch path also keeps stored rounds and saves the current page.** This is the same code as `--rounds-html` and follows spec 6.10 and R1. Plan 3's `--keep-rounds`/`--rounds-only` will refine it; R3 still needs Plan 3 to relax the `--rounds-html` test.
8. **File split.** `rounds.ts` was already 302 lines, so the generic table and date helpers moved to `html-tables.ts` and the summary tables went into `round-tables.ts`, neither of which is in the plan's file list. The result is `rounds.ts` 277, `round-tables.ts` 157 and `html-tables.ts` 107 lines. The split is a pure move plus the new code, and existing imports of `decodeEntities` from `./rounds` still work.
9. **No nominations block gives `null`, not an error.** A present but changed block stops the import.

## Files

- New: `src/lib/data/rounds-file.ts`, `src/lib/data/rounds-file.test.ts`, `scripts/import/round-store.ts`, `scripts/import/round-store.test.ts`, `scripts/import/round-tables.ts`, `scripts/import/html-tables.ts`, `data/raw/rounds/2026-10-15.html`
- Modified: `scripts/import/rounds.ts`, `rounds.test.ts`, `generate-rounds.ts`, `generate-rounds.test.ts`, `generate.ts`, `generate.test.ts`, `generate-fixture.ts`, `cli.ts`, `cli.test.ts`, `src/data/rounds.json`, `docs/DATA.md`, `scripts/README.md`, `CLAUDE.md`

## Fix round 1 (commit `2327ba7 fix(import): store unpadded tie-break dates and report misprints`)

The review found one Important issue. A real date without leading zeros (`3/9/2026`) was stored as `null`, because `parseDayFirstDate` required two-digit day and month and the broad `MISPRINTED_DATE` regex caught the rest.

What changed:

- `html-tables.ts` `parseDayFirstDate` now accepts `d/m/yyyy` and `dd/mm/yyyy`. It pads both parts and still checks that the calendar date exists.
- `round-tables.ts` `parseTieBreak(text, date, where, misprints)`:
  - A real date is stored.
  - `N/A`, a blank, or a month and year alone gives null silently.
  - A misprint gives null and is pushed to `misprints` as `{ date, where, text }`. A misprint is either a short year (`/^\d{1,2}\/\d{1,2}\/\d{1,3}$/`) or a day/month/four-digit-year shape that fails the calendar check, such as `31/02/2026` or `1/13/2026`. I chose null plus a report for impossible dates.
  - Any other text throws.
  - `parseTotals` takes the same sink.
- `rounds.ts`: `parseRoundBlock` returns `{ round, misprints }`. `parseRoundPagesDetailed` returns `ParsedPages = RoundPages & { misprints }`. `parseCurrentRound` is unchanged and delegates to an internal `readCurrentRound`.
- `cli.ts` prints `Tie-break misprints stored as no date: N` followed by one line per misprint (date, occupation, text). It lists only misprints in rounds being added, not rounds already stored. On the first v2 run it printed the two Oct rows; on a later run it printed 0.
- `docs/DATA.md`: the tie-break rules now cover d/m/yyyy, misprints (short year or impossible date) and the CLI line.

Tests:

- New `scripts/import/round-tables.test.ts`:
  - `3/9/2026` and `03/09/2026` give `2026-09-03`; `29/02/2028` gives `2028-02-29`.
  - `N/A`, `N/A*`, blank, `11/2025` and `15/2024` give null with no misprint.
  - `13/10/206`, `31/02/2026`, `29/02/2026` and `1/13/2026` give null, each with its misprint reported.
  - `early September`, `2026-09-03` and `03/09/20266` throw.
- `rounds.test.ts`: the `parseRoundBlock` expectations now include `misprints: []`. The fixture pages report exactly the two Oct misprints (Environmental Manager `13/10/206`, Forester `01/07/206`) and nothing else.

Data:

- I regenerated from v1 with `--rounds-html`. The resulting `rounds.json` is byte-identical to the committed v2 file, so no data changes.

Commands and output:

- `npx vitest run scripts/import`: Test Files 15 passed (15), Tests 118 passed (118). The 15 files are the 14 earlier ones plus `round-tables.test.ts`; `rounds-file.test` is outside this folder.
- `npm run check`: exit 0. Test Files 141 passed (141), Tests 1485 passed (1485). Lint reported `✖ 1 problem (0 errors, 1 warning)`, the pre-existing warning in the untracked `.superpowers/brainstorm/.../lib.js`.
