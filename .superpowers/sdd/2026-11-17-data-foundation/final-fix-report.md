# Final fix wave report (data foundation, roadmap/foundation)

Base: 13b251f. Head: c21d23f. No network calls. Guardrail rules were not touched.

## Commits

| SHA     | Subject                                                                  | Finding |
| ------- | ------------------------------------------------------------------------ | ------- |
| 8a353c0 | fix(import): fail when a table returns fewer rows than reported          | I3      |
| b3861fe | fix(import): skip unit-group rounds and require an explicit 189 column   | I2      |
| 610a791 | fix(data): build month windows from the calendar, not stored keys        | I1      |
| b0e0e7c | data: regenerate 2026-10 with explicit fetched months and skipped rounds | I1 + I2 |
| c1e9412 | test(data): reproduce the legacy data from raw history, not live src/data | I4      |
| aeff8c0 | refactor(report): declare one trend chart constant per line              | minor   |
| 86c4ca8 | fix(report): replace the trend's net change with a coverage caveat       | R17     |
| c7fdd6e | docs: record fetched-month, skipped-round and legacy-test rulings        | minors  |
| c21d23f | refactor(import): narrow state visas with a type guard, not a cast       | review  |

## I3: completeness assert

- **Change.** `scripts/import/qlik-client.ts` `readTable` now throws `Incomplete table: <id> returned N rows but reported qcy` after paging when `rows.length !== qcy`.
- **Test.** `qlik-client.test.ts`: the fake server takes `missingRows`, which drops rows from the last page.
- **RED** (`npx vitest run scripts/import/qlik-client.test.ts`):
  ```
  × fails when the pages return fewer rows than the reported row count
  AssertionError: promise resolved "{ header: [ 'a', 'b', 'c' ], …(1) }" instead of rejecting
  Tests  1 failed | 14 passed (15)
  ```
- **GREEN** (`npx vitest run scripts/import/`): 11 files, 79 tests passed.

## I2: 189 rounds misparse (R15)

### Changes

- **`scripts/import/rounds.ts`**
  - Tables keep each cell's `colspan`.
  - A header with an `Occupation ID` column (the `Subclass | Occupation ID | Description | Minimum points score` layout) returns a skip reason: _"unit-group layout (Subclass | Occupation ID | Description): its cut-offs cover a 4-digit occupation group and cannot be attributed to one 6-digit occupation"_.
  - The 189 column must be explicit. Either the column header matches `SUBCLASS_189`, which accepts `189`, `Subclass 189…` and `Lowest Points Score Invited subclass 189…` but rejects `189/491`, or the group label above the column does.
  - Group labels are expanded by colspan. A different span count throws `Round group header spans N columns but the table has M`, so there is no silent even split any more.
  - `Minimum points score` is accepted only when the round's own totals table (the first "Visa subclass" table) lists subclass 189 alone, and no header names a subclass. This is how the current-round page lays out its table.
  - `parseRoundBlock` is exported for tests, and a `RoundPages` type was added.
- **`scripts/import/generate-rounds.ts`**
  - New `ROUND_NAME_ALIASES`: `Life Scientist (nec)` → `Life Scientists nec` and `Psychologist (nec)` → `Psychologists nec`. Both spellings are from 13 June 2024.
  - `RoundsFile` is now `{ rounds, skipped }`.
  - New `readRoundsFile(value: unknown)` is the runtime guard. It rejects the old bare array, non-integer cut-offs and bad dates.
- **`generate.ts`.** `GenerateInput.rounds` is now `RoundPages`, and the skipped rounds are persisted into `rounds.json`.
- **`cli.ts`.** `readStoredRounds` uses `readRoundsFile`, which replaces the unchecked cast. Skipped rounds are now printed in `--generate-only` too.
- **Alias verification.** A test checks every alias in both directions. The source text must appear on the recorded fixture pages and must not already match the index. The target must exist in `src/data/occupation-index.json`.
- **Remaining unmatched names:**
  - `Patho` (25 May 2023). This is the source's own truncated text. It sits alphabetically between Paediatrician and Physiotherapist, but I did not alias it, because the page does not say which occupation it means.
  - `Rheumatologist` (22 Aug 2022 and 25 May 2023). This occupation is not on the dashboard.

### RED

`npx vitest run scripts/import/rounds.test.ts`. I first exported `parseRoundBlock` without changing behaviour, so these failures are behavioural:

```
× skips the unit-group layout (Subclass | Occupation ID) with a reason   (.toMatch() got undefined)
× never reads a 4-digit unit group or a 491 cell as a 189 cut-off        (expected '2335' not to match /^\d+$/)
× requires an explicit 189 column                                        (expected [Function] to throw)
× reads Minimum points score only when the round lists 189 alone         (expected [Function] to throw)
× maps two-row group headers by colspan                                  (even split took the wrong columns)
× throws when the group header spans a different number of columns      (expected [Function] to throw)
Tests  6 failed | 6 passed (12)
```

`npx vitest run scripts/import/generate-rounds.test.ts scripts/import/generate.test.ts`:

```
× matches reviewed source name variants through the alias map  (expected [ 'Psychologist (nec)' ] to deeply equal [])
× uses only aliases seen on the recorded round pages …          (ROUND_NAME_ALIASES undefined)
× turns a stored rounds file back …  /  × rejects the old bare-array file …  (readRoundsFile is not a function)
× 9 generate tests: rounds is not iterable (new { rounds, skipped } input)
Tests  13 failed | 5 passed (18)
```

### GREEN

- `npx vitest run scripts/import`: 12 files, 89 tests passed.
- The re-parse leaves the 13 kept rounds row-for-row identical to the previously stored `rounds.json`. All 13 compare as "same" in `scratchpad/cmp.ts`.

## I1: window/zero semantics (R14)

### Schema (records now `schemaVersion: 2`)

`types.ts` gains `RecordSchemaVersion`, and the guards check it. The manifest stays at 1.

- **Every fetched month gets a key.** Every multi-month map (`statusHistory`, `invitedByScore`, `stateInvited[visa][state]` including `ANY`, and `invitedProfile`) has a key for every covered view-month part, for every visa the view selects. The value is `{}` when the occupation had no rows that month.
- **`invitedProfile` is re-keyed** to `[visa][attribute][month][value]`, so an empty month can be expressed. The old shape put the month in the leaf. This is the breaking change behind the version bump.
- **`invitedProfileState`** also gets `{}` for every fetched state × attribute. It is not multi-month, but it had the same missing-versus-zero problem.

### Generator

- `generate-rows.ts` has a new `parseViewCoverage`, which lists every part of a raw file with validated partitions.
- `generate.ts` `readRows` returns `{ rows, coverage }`.
- `generate-assemble.ts` `fillCoverage` runs when a builder is created, before any row. As a result, month keys stay oldest-first.

### Accessors

- **`src/lib/data/months.ts`** has two helpers:
  - `calendarMonths(asAt, count)` returns `[]` when `count <= 0`, as R14 requires for `latestMonthKeys`.
  - `splitCoverage(window, map)` splits a window into `{ covered, notPublished }`.
- **`latestMonthKeys` was removed.** It was the "keys that exist = window" bug, and its `count <= 0` behaviour is now pinned on `calendarMonths`.
- **`invitationActivity(core, visa, months = 24)`** builds a calendar window back from `core.asAt` and returns `notPublished`. Its `scoreRange` uses the last 12 calendar months.
- **`stateEvidence`** windows from `asAt` and returns `notPublished` on each side. `peak` is now `null` unless some month has `min > 0`. This closes the parked T4 minor, which zero-filled months would otherwise have made worse.
- **`similarProfileInvited`:**
  - It returns `{ perMonth, notPublished, latest }`.
  - `latest` is the as-at month only, and is `undefined` when that month was not fetched.
  - A value missing from a fetched slice counts as `{0, 0}`.
  - It returns `undefined` only when the attribute or state was never fetched.
  - The JSDoc documents the real value encodings.
- **`legacy.trendFor`** covers the last 12 calendar months from `core.asAt`. Fetched months with no SUBMITTED row show as zero, and unfetched months are left out.

### Fixtures

`src/lib/data/__fixtures__/occupation.ts` now uses real encodings. English is `"20"`/`"10"` instead of `"superior"`, and Professional Year is `N`/`-1`. The fixtures include a zero month inside the window, an unfetched month and a month outside the window.

### Tests pinning the ruling

- **A zero month inside the window:**
  - `invitations.test` "reads a covered month with no INVITED row as zero";
  - `state-evidence` ANY 2026-09;
  - `similar-profile` 2026-10;
  - `legacy.test` "reads a covered month with no SUBMITTED row as zero".
- **An unfetched month:** the "reports an uncovered month as not published, never zero" tests in invitations, state-evidence and similar-profile, plus legacy "leaves out a month that was not fetched".
- **Latest is the as-at month only:** `similar-profile` "takes latest from the as-at month only".
- **The window is built from asAt, not from stored keys:** the score range ignores 2025-09, and the state window ignores 2025-06.
- **Generator:** a fetched month with no rows becomes `{}`, and an unfetched month has no key.
- **`calendarMonths`:** crosses a year boundary, and a count of 0 or less gives `[]`.

### RED

`npx vitest run src/lib/data scripts/import` before implementation: **22 failed | 158 passed (180)**, plus `Cannot find module './months'`. Examples:

```
AssertionError: expected { min: 60, max: 100 } to deeply equal { min: 90, max: 100 }        (score range outside 12 months)
AssertionError: expected [ '2025-03-31', '2026-10-31' ] to not include '2025-03-31'          (legacy trend, 212111 shape)
AssertionError: expected undefined to deeply equal { min: +0, max: +0 }                      (latest = as-at only)
AssertionError: expected [ '2025-06', '2026-08', …(2) ] to deeply equal [ '2026-08', … ]     (state window)
AssertionError: expected undefined to deeply equal {}                                         (generator empty month)
```

### GREEN

- `npx vitest run src/lib/data scripts/import`: 156 passed.
- `legacy.test.ts` could not load until the data was regenerated, because the live cores were still schema 1. After commit b0e0e7c the full suite passes.

## Regenerated data (b0e0e7c)

### rounds.json migration

`--generate-only` cannot re-parse rounds from the stored `rounds.json`, because the raw round HTML is not kept and the stored file still held the misparsed rounds. So, once, I re-parsed the round pages recorded on 2026-11-17 in `scripts/import/__fixtures__/`. That is the same capture date as the live import, and the 13 kept rounds were verified identical. I ran `generate` → `validateGenerated` (0 issues) → `writeGenerated` with them (scratchpad `migrate-rounds.ts`).

I then ran the required command, `npm run data:generate -- --as-at 2026-10 --checked-at 2026-11-17`, which reads the new `rounds.json` back:

- 8 rounds skipped, with reasons;
- 493 occupations;
- unmatched names: Patho and Rheumatologist;
- 0 validation issues.

A second run gives a byte-identical `src/data` (shasum `599f129d…` both times).

### Sizes

| Item           | Before                       | After                        | Limit  |
| -------------- | ---------------------------- | ---------------------------- | ------ |
| Largest core   | 254499.json, about 27 KB     | 254499.json, 27,276 bytes    | 50 KB  |
| Largest detail | 233211.detail.json, about 29 KB | 233211.detail.json, 29,364 bytes | 250 KB |

### Before and after: 212111 Artistic Director, 12-month trend

- **Before:** `["2025-03:<20", "2026-10:<20"]`. That is 2 points spanning Mar 2025 – Oct 2026. Before the fix, its stored 189 history skipped 2024-11 to 2025-02 and 2025-04/05.
- **After:** 12 points, `2025-11:0 … 2026-09:0, 2026-10:0-19`.

### Before and after: 272399 Psychologists nec, rounds189

- **Before:** 20 rounds.
  - 2024-06-13 was `null`; this was the name variant.
  - 2022-01-21 was `null`.
  - The seven rounds from 2021-10-29 to 2020-08-11 were all `null`, which falsely said "not listed".
- **After:** 13 rounds.
  - 2024-06-13 is now `85`, through the alias.
  - 2022-01-21 is still `null`: it has no row in that round.
  - The seven unit-group rounds are absent. They are recorded in `rounds.json` `skipped`, not shown as "not listed".
- **234599 Life Scientists nec:** 2024-06-13 changes from `null` to `95`.
- **233512 Mechanical Engineer:** the seven skipped-layout dates are gone, which removes the false nulls. Its genuine nulls (for example 2026-10-15) remain.

### Sweep over all 493 cores (scratchpad `sweep.ts`)

- 0 cores have a legacy trend other than the 12 months 2025-11 to 2026-10.
- 0 visa activities have an unfetched month in their 24-month window.
- 0 profile lookups lack an as-at figure. The reviewer measured 2,792 wrong ones before the fix.
- The score range is now a 12-calendar-month window by construction.

## I4: legacy test (R16)

- **Change.** `legacy.test.ts` now calls `generate()` in memory:
  - on `data/raw`, at as-at 2026-10;
  - with the rounds read from `src/data/rounds.json` through `readRoundsFile`, filtered to dates up to 2026-10-31;
  - comparing the 11 legacy occupations exactly.
- **`explainedDifferences` removed.** It was always empty and never applied; the test asserts exact equality instead.
- **RED, the failure mode.** I simulated a next import by editing `src/data/occupations/261313.json` to asAt 2026-11 with a new month, pool and round. The old test then failed: `× pool points match`, `× evidence deep-equals`, `Tests 2 failed | 24 passed (26)`.
- **GREEN.** With the same simulated file still in place, the new test passes: 26 tests. I restored the file and it passes again. The generate step adds about 0.5 s.

## Must-fix minors

- **CLAUDE.md:** removed the second `npm run check` line.
- **DATA.md:**
  - checkedAt: the snapshot date is shown beside the data, and `checkedAt` in the report footer ("sources checked").
  - The two coverage-window inference sentences now start with "If so,".
  - The unmatched-names paragraph is rewritten. It now explains the different layout (skipped) plus name variants (aliased), says `Patho` is the source's own text, and adds `Rheumatologist`.
  - Documented R14 (fetched-month keys, calendar windows, `notPublished`, `latest` and `peak`), R15 (skipped layouts, the explicit 189 column, the colspan check), R16 (in-memory legacy test) and R17.
  - Documented the profile encodings: English `20/10/0`, partner `10/5/0`, Australian study `Y/N`, Professional Year `N` and `-1`, where `-1` appears to mean unknown. No `Y` is observed.
  - Documented the record schemaVersion of 2, `rounds.json` `{ rounds, skipped }`, and the I3 short-read stop.
- **R17:**
  - `pool-section.tsx` no longer shows the "Net change … EOIs" sentence.
  - The caption now reads: "These are published monthly totals. The published data appears to include EOIs submitted from about late 2024 onward, so earlier months may undercount the pool; treat month-to-month rises with caution."
  - The chart stays.
  - `REPORT-COVERAGE.md` and `HANDOFF.md` are updated, since the sample text is no longer identical.
- **trend-chart.tsx:** one `const` per line.
- **Fixture "superior":** fixed to real encodings (see I1).

## Final verification

- **`npm run check`:** Prettier, ESLint and tsc clean. Vitest: 28 files, 237 tests passed.
- **`npm run build`:** passes, with all 7 routes static.
- **Headless Chrome (CDP)** against `out/`, served by `python3 -m http.server 3017 --bind 127.0.0.1 --directory out`. I stopped the server afterwards and port 3017 is free.
  - On /sample/ at 1280px, and at 390px with reduced motion:
    - the trend SVG is present, its accessible table has 12 rows, and the detail reads "31 Oct 2026 · 7,774 EOIs";
    - the new caveat caption is shown, and "Net change" is absent;
    - the rounds section has 6 rows (for example 7 Nov 2024 is 95 points; 15 Oct 2026 is Not listed);
    - there is no horizontal overflow.
  - In print media, the trend and rounds are visible.
  - No console errors.

## Self-review

- `generate-assemble.ts` is 310 lines, slightly over the 300-line aim. `fillCoverage` needs the shared `child` helper, and splitting it out would create an import cycle, so I left it in place.
- A follow-up commit (c21d23f) replaced two `as StateVisa[]` casts with a type guard. The regenerated data did not change.
- `netPoolChange` in `src/lib/report-evidence.ts` is now unused by the UI. It is kept, with its tests, in case step 2 needs it.
- `cohortWindowStart` (scripts) still has its own month arithmetic and could reuse `calendarMonths`. I did not change it, because it is outside this scope.

## Concerns

1. **Commit 610a791 does not pass `npm run check` on its own.** The schema 2 guards reject the still-schema-1 live data: 5 report-evidence tests fail and legacy.test cannot load. The brief asked for the data regeneration in its own `data:` commit, so the pair 610a791 + b0e0e7c is only green together. Every other commit passes check. If every commit must be green, squash those two.
2. **rounds.json was rebuilt from the recorded fixture pages, not by a live fetch.** Both are from the same capture date (2026-11-17), and the 13 kept rounds are identical. The next `data:import` re-reads the live pages anyway.
3. **New schema 2 shapes and `notPublished` fields.** `invitedProfile` is re-keyed (attribute → month → value) and the accessor return types gained `notPublished`. No UI used these accessors yet, so only the legacy adapter is user-visible.
