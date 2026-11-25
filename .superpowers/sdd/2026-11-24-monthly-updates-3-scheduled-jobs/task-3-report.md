# Plan 3 Task 3 report: `--keep-rounds`, `--rounds-only` and new-round detection

BASE 516c31f. Branch `roadmap/monthly-updates`.

## What I implemented

- **`newestRoundDate(currentHtml)`** (`scripts/import/rounds.ts`): the current round's date, read from the "Current round" block without parsing its tables. `readCurrentRound` now shares `currentRoundBlock` with it, so the date is read the same way in both.
- **`newRoundDates(stored, parsed)`** (`rounds.ts`): parsed dates newer than the newest stored round, oldest first. An older round missing from the stored file isn't counted as new. `stored` is typed structurally as `{ rounds: readonly { date: string }[] }`, so it takes a `RoundsFile` (as the brief says) or the `RoundPages` the CLI reads back from one.
- **`fetchRoundPage(url)`** (`rounds.ts`): the single-page request that `fetchRoundPages` already made, pulled out so that `detect-round.ts` sends the same request.
- **`scripts/automation/detect-round.ts`**: `detectRound(storedRounds, currentHtml)` returns `"new" | "none"` and throws on a rounds file that isn't v2. `readCurrentRoundsPage(dir)` reads `$ROUNDS_HTML_DIR/invitation-rounds.html` when the variable is set, otherwise it fetches the current page only. The CLI prints `new` or `none`, and exits 1 on an error.
- **`Manifest.roundsCheckedAt?: string`** (`types.ts`), checked by `isManifest` when present (`guards.ts`). The cast in `scripts/updates/generate.ts` is gone: it now reads `manifest.roundsCheckedAt ?? manifest.checkedAt` (R22).
- **`GenerateInput.roundsCheckedAt?`** (`scripts/import/generate.ts`): the manifest records it only when it differs from `checkedAt`. That keeps `--generate-only` byte-identical and the manifest minimal, and readers use `?? checkedAt`.
- **CLI** (`scripts/import/cli.ts`):
  - `--keep-rounds`: monthly imports only. It is rejected with `--backfill`, `--generate-only` or `--rounds-html`. It reads no round pages and regenerates with the stored `rounds.json`, as `--generate-only` does. It still fetches the dashboard within the same 250-read budget (guardrails unchanged).
  - `--rounds-only`: takes no `--as-at` and is rejected with `--as-at`, `--backfill`, `--generate-only` or `--keep-rounds`. It opens no Qlik session and reads both round pages, fetched or from `--rounds-html <dir>`. It keeps the stored rounds (R1), saves the current page, and regenerates for the stored `manifest.asAt` and `checkedAt` with `revisionsUpTo: checkedAt`, so the month is rebuilt as its dashboard was checked. It sets `roundsCheckedAt` to `--checked-at`. It throws if there is no valid manifest. Report mode is `"rounds-only"`, `report.asAt` is the manifest month, and `report.newRounds` comes from `newRoundDates` (oldest first; it was previously "not stored", newest first).
  - New exported pure `generateTarget(args, storedManifest)` returns `{ asAt, checkedAt, roundsCheckedAt?, revisionsUpTo? }`:
    - Runs that read round pages record `roundsCheckedAt = --checked-at`.
    - `--keep-rounds` and `--generate-only` keep the previous `roundsCheckedAt ?? checkedAt`.
    - `--rounds-only` behaves as described above.
  - The R3 change: `--rounds-html` now needs `--generate-only` or `--rounds-only`, and the Plan 1 test is reworded to match.
  - R7: every mode still passes the current `src/data` as `previous`. `readPreviousData` now runs before the fetch so that `generateTarget` can read the manifest. That changes nothing on disk, because the fetch touches only `data/raw`.
  - New log lines: "Writing <month>: dashboard checked …, rounds checked …", "New rounds: …", "Rounds kept from rounds.json: N".

### Decision on the open item (Plan 1 Task 4): never overwrite a stored round's page, with no revision files

New in `round-store.ts`: `storeCurrentRoundPage(rawRoot, storedDates, date, html)` returns `{ path, status: "saved" | "unchanged" | "kept" }`. If the round is already in `rounds.json` and its page file exists, a different fetched page is not written. Status is "kept", and the CLI prints `Kept <path>: … differs`. A stored round whose page is missing gets it saved. A round not yet in `rounds.json` may have its page replaced, for example when a re-run follows a failed validation that wrote the page but not `rounds.json`. `writeRoundPage` itself is unchanged.

Why not revision files (`<date>.rev-<fetched>.html`):

1. R1 freezes the stored round, so the one page that matters is the one `rounds.json` was parsed from. A revision would hold data the pipeline will never use.
2. The live page carries site chrome that can change between reads. Revision files would pile up on cosmetic changes, unlike the dashboard raw files, where any difference is a real data revision.
3. The rule is keyed on "the round is in `rounds.json`", not on "the file exists". That keeps the page and the round in step even after a failed run. A rule of "never overwrite an existing file" would get this case wrong.

If Home Affairs later corrects a stored round, the CLI line makes the difference visible, and handling it stays a reviewed manual step.

### Interpretation note

"The monthly import ignores rounds dated after its as-at month": `--keep-rounds` adds no rounds at all, whether fetched or parsed, and keeps `rounds.json` as stored. It does not remove rounds that the round job already stored, including ones dated after the as-at month, because removing them would undo the round job's work. So cores' `rounds189` include every stored round, just as after a rounds-only run. Facts-file filtering by month is R5 (Plan 1, already done).

## Tests and results

- New and changed tests:
  - `rounds.test.ts` (newestRoundDate ×2, newRoundDates ×3)
  - `detect-round.test.ts` (4)
  - `cli.test.ts`: parseArgs for keep-rounds and rounds-only (4 new, 2 updated); `generateTarget` (4), including "--rounds-only leaves checkedAt and sets roundsCheckedAt", which generates from the fixture raw root
  - `generate.test.ts` (roundsCheckedAt recorded only when it differs)
  - `round-store.test.ts` (storeCurrentRoundPage ×2)
  - `guards.test.ts` (roundsCheckedAt)
- Focused: `npx vitest run scripts/import scripts/automation src/lib/data/guards.test.ts` gave 18 files and 177 tests passing.
- **R2 byte-identical:**
  - `npm run data:generate -- --as-at 2026-10 --checked-at 2026-11-17` left `git status src/data data/raw` empty, so every file is byte-identical, including the manifest, which gains no `roundsCheckedAt`.
  - The existing `generate-rounds.test.ts` byte-identical test passes.
- **End-to-end dry runs, no network; everything restored with git afterwards:**
  - `--rounds-only --checked-at 2026-11-20 --rounds-html scripts/import/__fixtures__ --report-file …`:
    - "New rounds: none", "Unchanged data/raw/rounds/2026-10-15.html"
    - The only change is `manifest.roundsCheckedAt: "2026-11-20"`, with `checkedAt` still 2026-11-17
    - The report says `mode: "rounds-only"`, `asAt: "2026-10"`, `newRounds: []`
  - A synthetic 12 Nov round (current page re-dated):
    - `detect-round.ts` with `ROUNDS_HTML_DIR` printed `new`
    - `--rounds-only` reported `newRounds: ["2026-11-12"]` and stored `data/raw/rounds/2026-11-12.html`
    - October stayed verbatim (nominations 2026-27, Actuary tie-break 2026-09-03)
  - Re-running with an edited copy of that page printed "Kept … differs" and left the saved file unchanged.
  - `ROUNDS_HTML_DIR=scripts/import/__fixtures__ npx tsx scripts/automation/detect-round.ts` against the real data printed `none`.
- **Full check:** format:check, lint and typecheck pass. The machine is heavily loaded (load average 20–30 from other processes):
  - The first full `npm run check` showed 4 failed files and a later run 12. Those were truncated outputs from timeout-style failures under load.
  - A third run passed 175/175 files and 1822/1822 tests, with 2 "Failed to start forks worker … Timeout waiting for worker" errors for `feedback-context.test.ts` and `check-actions.test.ts`, which are unrelated to this task.
  - Final run with `--maxWorkers=4`: see the "Final check" section below.

## TDD evidence

- RED: `npx vitest run scripts/import/rounds.test.ts scripts/import/cli.test.ts scripts/import/generate.test.ts scripts/automation/detect-round.test.ts` failed 14 tests plus detect-round.test.ts, which could not import `./detect-round`:
  - `newRoundDates is not a function` and `newestRoundDate is not a function`
  - `generateTarget` not exported
  - parseArgs `toEqual` missing `keepRounds`/`roundsOnly`
  - The old message "--rounds-html needs --generate-only"
  - The manifest had no `roundsCheckedAt`

  These failures were expected because none of these functions or fields existed yet. The two rejection tests ("rejects --rounds-only …" and "takes --keep-rounds only …") passed while RED only because the flags were unknown (`Unknown argument "--rounds-only"` matches the regex). They became meaningful once the flags existed.
- GREEN: the same command, plus round-store and guards, gave 177/177 passing.

## Files changed

- `scripts/import/cli.ts`, `cli.test.ts`, `generate.ts`, `generate.test.ts`, `round-store.ts`, `round-store.test.ts`, `rounds.ts`, `rounds.test.ts`
- `scripts/automation/detect-round.ts` (new), `detect-round.test.ts` (new)
- `scripts/updates/generate.ts` (cast removed)
- `src/lib/data/types.ts`, `guards.ts`, `guards.test.ts`
- `docs/DATA.md` (file table; rounds v2 page rule; `roundsCheckedAt`; `--keep-rounds`, `--rounds-only`, `detect-round.ts`; `--rounds-html` scope), `scripts/README.md` (commands, page rule, round-store line)

## Self-review and concerns

- `cli.ts` has grown from 388 to 512 lines. It was already the largest import module. A natural next split would move the round-page reading into its own module (`readKeptRounds`, `readRoundPages`, `saveCurrentPage`, `readRounds`). I did not split it, per the implementer rules (no plan guidance).
- `CliArgs` now has four mode booleans (`probe`, `generateOnly`, `keepRounds`, `roundsOnly`). That follows the existing pattern and the brief's `toMatchObject` shape, but ENGINEERING.md prefers discriminated unions, so it is a candidate for a later cleanup.
- For `--rounds-only` I added `revisionsUpTo: manifest.checkedAt`, which the brief doesn't name. It makes "regenerate for the current `manifest.checkedAt`" strict, so a raw revision left behind by a failed re-import is never picked up silently. It is tested in `generateTarget`.
- `--generate-only --rounds-html` keeps the previous round check date rather than claiming today's, because saved pages aren't a fresh read.
- Plan 1 deferred minor "cli.ts parses the current page twice": now the page is parsed once in full, and the second read is only the cheap `newestRoundDate`.
- Not covered by tests: the actual network fetch in `detect-round.ts` main and `--keep-rounds` with a live Qlik session. Both need the network.

## Final check

- `npm run format:check`: OK. `npm run lint`: 0 errors, 1 warning. The warning is the known untracked `.superpowers/brainstorm/round-recap-2026-11-24/assets/lib.js` asset (Plan 1 deferred item), not this task's code. `npm run typecheck`: OK.
- `npx vitest run --maxWorkers=4`: 177/177 files and 1824/1824 tests passed, with no errors. (The default worker count timed out under the machine's load. Those failures come from the environment, not from this change.)
- `npm run build`: exit 0.
