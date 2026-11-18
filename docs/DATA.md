# Data dictionary

This file describes Landfall's SkillSelect dataset: where it comes from, what each number means, what it cannot tell you, and how to refresh it. Read it before writing any code or copy that uses the data. The design is in `docs/superpowers/specs/2026-11-17-data-foundation-design.md`.

Current dataset: snapshot `skillselect-2026-10-31`, as at October 2026, checked on 17 November 2026. It covers 493 occupations, and 479 of them have published EOIs (`hasData`).

## Where the data lives

```
data/raw/<asAt>/<view>.json          Raw displayed rows for one view and one as-at month. Committed, permanent history.
data/raw/<asAt>/<view>.rev-<date>.json   A later re-fetch that differed from the stored file (a government revision).
src/data/manifest.json               Snapshot id, as-at, checkedAt, import version, source URLs, unmatched round names, and the occupation index with totals.
src/data/occupation-index.json       Code, name and hasData for every occupation. The only multi-occupation file a client component may import.
src/data/occupations/<code>.json     Core record: pools, status history, invited-by-score, state pools and state invitations, 189 rounds.
src/data/occupations/<code>.detail.json   Detail record: cohorts, cohorts by score, invited profiles.
src/data/rounds.json                 { rounds, skipped }: every parsed 189 round (all occupations, newest first) and every skipped round with its reason.
src/data/state-rules/                State nomination rules and lists for the state outlook; see "State rules" below.
```

- Only the importer writes `data/raw/` and `src/data/`. Never hand-edit them.
- `npm run dev` and `npm run build` copy `src/data/occupations/` to `public/data/occupations/` (`scripts/copy-public-data.ts`, git-ignored output). The browser fetches one occupation at a time from `/data/occupations/<code>.json`, through `useOccupationCore`. Only codes in the index are ever fetched.
- Server Components read files with `src/lib/data/load-server.ts`. Never import it, or any multi-occupation JSON other than the index, into a `"use client"` module.
- A raw file stores the column header once, a dictionary of dimension values per column, and rows of dictionary indexes plus the displayed count text. It also records the selections used, `fetchedAt` and the source URL.

## Source

The public [SkillSelect EOI dashboard](https://api.dynamic.reports.employment.gov.au/anonap/extensions/hSKLS02_SkillSelect_EOI_Data/hSKLS02_SkillSelect_EOI_Data.html) (Qlik app `aaac76b5-ad30-477e-9ca0-472f8ab57fc8`, table object `eymDb`). Government material is reused under CC BY 3.0 AU.

The 189 round results come from the official [invitation rounds](https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds) and [previous rounds](https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/previous-rounds) pages.

### Guardrail rules (binding)

The dashboard table has a calculation condition. It returns error 7005 unless exactly one `As At Month` is selected, at most 2 detail columns are shown, and at most 2 detail fields are filtered. Detail fields are Occupation Group, Occupation, Score, Month Submitted, the profile fields and Nominated State. `Visa Type`, `EOI Status` and `As At Month` do not count.

Landfall's rules:

- Every query stays within the guardrail. `assertWithinGuardrail` in `scripts/import/views.ts` checks each view.
- Read only the displayed `qText`. Never request unmasked counts or custom count expressions.
- Never change any variable except the public `vShow*` display toggles. Never change `vSelectionsLimit`.
- No assembled table has more detail dimensions than one permitted query could produce.
- Never narrow a `<20` cell by differencing overlapping queries.
- Queries are sequential, with at least 250 ms between websocket calls. Page height is `floor(10000 / width)` cells.

## Views

All views use visa types `189PTS Points-Tested Stream` (`"189"`), `190SAS Skilled Australian Sponsored` (`"190"`) and `491SNR State or Territory Nominated - Regional` (`"491"`). Family-sponsored 491 is excluded. "Latest" means the as-at month being imported. Page reads are for as-at 2026-10.

| View                    | Shown columns               | Detail filters (one query per value) | Statuses  | Visas         | As-at months | Page reads | Output                                   |
| ----------------------- | --------------------------- | ------------------------------------ | --------- | ------------- | ------------ | ---------- | ---------------------------------------- |
| `pool-by-score`         | Occupation, Score           | none                                 | SUBMITTED | 189, 190, 491 | latest       | 6          | core `pool[visa].byScore`                |
| `status-history`        | Occupation                  | none                                 | all five  | 189, 190, 491 | latest 24    | 3 a month  | core `statusHistory`, `pool[visa].total` |
| `invited-by-score`      | Occupation, Score           | none                                 | INVITED   | 189, 190, 491 | latest 24    | 2 a month  | core `invitedByScore`                    |
| `cohorts`               | Occupation, Month Submitted | none                                 | all five  | 189, 190, 491 | latest       | 41         | detail `cohorts`                         |
| `cohorts-by-score`      | Occupation, Month Submitted | Score (each score in the pool)       | SUBMITTED | 189, 190, 491 | latest       | 71         | detail `cohortsByScore`                  |
| `state-pool`            | Occupation, Score           | Nominated State                      | SUBMITTED | 190, 491      | latest       | 32         | core `statePool`                         |
| `state-invited`         | Occupation, Score           | Nominated State                      | INVITED   | 190, 491      | latest 12    | 9 a month  | core `stateInvited`                      |
| `invited-profile`       | Occupation + one attribute  | none                                 | INVITED   | 189, 190, 491 | latest 12    | 4 a month  | detail `invitedProfile`                  |
| `invited-profile-state` | Occupation + one attribute  | Nominated State                      | INVITED   | 190, 491      | latest       | 35         | detail `invitedProfileState`             |

Notes:

- **Profile attributes** are English Test Score, Australian Study Flag, Professional Year and PartnerSkills Score. Each runs as its own query (ruling R1), never two together, because combined slices are almost always masked.
- **State values** are ACT, NSW, NT, QLD, SA, TAS, VIC, WA and `ANY`. `N/A` and `AUSTRADE` are excluded.
- **The Score filter must be selected by number.** Selecting `Score` by its text (`"20"`) returns success but leaves the table unfiltered (9,135 rows instead of 1). Scores are therefore selected by `qNumber`. Nominated State works by text. The importer also stops if two consecutive partition queries return the same table of 20 or more rows, which means a selection silently failed.
- **"None Provided" (ruling R12).** The dashboard lists one row with the occupation text `None Provided` (status-history, 2026-04, 491 SUBMITTED `<20`). That single exact text is skipped. Any other occupation text without a code stops the import.
- **Reductions applied in the import (Task 9): none at query time.** No budget or size limit was reached, so pre-approved reductions 1–3 were not needed. The generator still applies the 36-month cohort window (ruling R8, below).
- **Cohort window (ruling R8).** `cohorts` and `cohortsByScore` keep only submitted months within 36 months of the as-at month (2023-11 to 2026-10 for this snapshot). Older months are **dropped, never summed** into an `older` bucket, because a sum of masked cells cannot be stored as a published count. The `older` key in the types stays unused. Older cohorts hold almost only LODGED and CLOSED EOIs.
- **Occupation set (ruling R9).** The index holds the codes present at the as-at month, in any latest-only view or in that month's status history. Codes seen only in older history are excluded.
- **Sizes for 2026-10.** All of `data/raw` is 9.3 MB, and 2026-10 alone is 5.0 MB (limit 10 MB a month). The largest core is `254499.json` at 27 KB (limit 50 KB), and the largest detail is `233211.detail.json` at 29 KB (limit 250 KB).

### Missing versus zero

- Every view-month is paged to the reported row count (`qcy`), so the stored table is complete for its selections. The dashboard omits zero rows. Inside a fetched view-month, **an absent row means zero** for that combination. The validator relies on this for `status-history`.
- **A month, view, visa or state that was not fetched is "not published", not zero.** For example, `stateInvited` covers only the latest 12 months, and `invitedProfileState` only the latest month. An accessor returns `undefined` for these, or lists them as `notPublished`, never 0.
- **Every fetched month has a key (ruling R14).** The multi-month maps (`statusHistory`, `invitedByScore`, `stateInvited` per state including `ANY`, and `invitedProfile`) hold a key for every view-month that was fetched, for every visa the view selects, with `{}` when the occupation had no rows that month. `invitedProfileState` likewise holds `{}` for every fetched state and attribute. So a record shows on its own which months were fetched: a key with `{}` is a published zero, a missing key was not fetched.
- **Accessors build calendar windows back from `asAt`** (`calendarMonths` in `src/lib/data/months.ts`), never from the keys a record happens to hold. In the window, a fetched month with no row is `{ min: 0, max: 0 }`; a month that was not fetched is left out and returned in `notPublished`. `similarProfileInvited(...).latest` is the as-at month only, and is absent when that month was not fetched. A state `peak` is `null` unless some month confirms an invitation (`min > 0`). The report's 12-month trend is the last 12 calendar months, zero where fetched.
- `<20` is a masked count. It is always the interval `{ min: 0, max: 19 }` (`parseCountText`).
- A 189 round cut-off of `null` means the occupation is **not listed** in that round. It does not mean a zero cut-off or that nobody was invited.

## EOI statuses

| Status    | Meaning                                                                  | Observed behaviour                                                                                                                  |
| --------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| SUBMITTED | An EOI in the pool, available to be invited.                             | The pool. See the coverage-window finding below before reading it as a trend.                                                       |
| INVITED   | The EOI received an invitation and has not yet lodged, lapsed or closed. | A **short-lived stock**. It spikes in the first snapshot after a round, then falls as invitees lodge or their 60-day window lapses. |
| LODGED    | A visa application was lodged from the invitation.                       | Rises and falls. EOIs leave LODGED, most likely to CLOSED once the visa is decided.                                                 |
| HOLD      | The EOI is on hold. The dashboard does not publish why.                  | Small and slowly rising.                                                                                                            |
| CLOSED    | **Closed (expired, withdrawn or finalised).**                            | Grows steadily. It mixes two-year expiry, withdrawal and finalisation. Never describe it as "closed without invitation".            |

Observed 189 counts (S / I / L / H / C; `–` means no row, so zero):

| As at   | Registered Nurses nec (254499) | Software Engineer (261313)     |
| ------- | ------------------------------ | ------------------------------ |
| 2025-07 | 5341 / <20 / 408 / 42 / 1472   | 5833 / <20 / 215 / 104 / 4522  |
| 2025-08 | 4736 / 846 / 469 / 45 / 1674   | 6456 / – / 209 / 108 / 5113    |
| 2026-05 | 7398 / 82 / 583 / 74 / 5310    | 8736 / <20 / 167 / 235 / 10061 |
| 2026-06 | 6056 / 905 / 1442 / 78 / 5465  | 8939 / <20 / 175 / 250 / 10430 |
| 2026-10 | 4280 / 2730 / 989 / 91 / 7936  | 9464 / <20 / 119 / 343 / 12354 |

Rules that follow:

- **INVITED is a lower bound.** Invitations in a round ≈ INVITED in the next snapshot, minus anyone who already lodged. Label each month "at least N invited". **Never sum INVITED across as-at months**: the same invitation can appear in several snapshots.
- Month Submitted cohorts work. For example, nurse 189 EOIs submitted in 02/2025, as at 10/2026: SUBMITTED 142, INVITED 175, LODGED 60, CLOSED 510.

## Generated records

- **`pool[visa]`** (core): `total` is the SUBMITTED total read with points hidden, from `status-history` at the as-at month (rulings R4 and R5). `byScore` is the SUBMITTED count per score from `pool-by-score`. The total is published directly, so it is never replaced by the sum of masked score cells. The validator checks that the total falls within that sum's interval.
- **`statusHistory[visa][month][status]`**: every stored as-at month (newest revision of each), including months that have left the dashboard's 24-month window. `{}` means the month was fetched and the occupation had no rows.
- **`invitedByScore[visa][month]`**: INVITED by score for each stored month.
- **`statePool[visa][state]`** and **`stateInvited[visa][state][month]`**: per-state SUBMITTED and INVITED by score. `ANY` is its own key.
- **`rounds189`**: every parsed round, newest first, with this occupation's cut-off or `null`.
- **Detail**: `cohorts[visa][submittedMonth][status]`, `cohortsByScore[visa][score][submittedMonth]` (SUBMITTED only), `invitedProfile[visa][attribute][month][value]`, `invitedProfileState[visa][state][attribute][value]`.
- **Profile values are the dashboard's displayed text.** Observed in every stored month: English Test Score `"20"`, `"10"`, `"0"` (English points); PartnerSkills Score `"10"`, `"5"`, `"0"` (partner points); Australian Study Flag `"Y"`, `"N"`; Professional Year `"N"` and `"-1"`, where `-1` appears to mean unknown or not recorded (no `"Y"` value appears). Callers pass these exact strings.
- **`hasData`** (index and manifest) is true when any visa's SUBMITTED total may be above zero. A masked `<20` total counts as data. Occupations with `hasData: false` get the points-only behaviour in the UI and are never fetched.
- **`snapshotId`** is `skillselect-<asAt>-<last day>`, for example `skillselect-2026-10-31`. Every record carries it. The UI shows the snapshot date (the last day of `asAt`) beside the data, and the manifest's `checkedAt` in the report footer ("sources checked").

### 189 invitation rounds

- 13 rounds are parsed, from 21 Jan 2022 to 15 Oct 2026. Every occupation row is kept.
- **Eight rounds are skipped**, each with its reason in `rounds.json` `skipped` and printed by the CLI. A skipped round is absent from `rounds189`; it is never shown as "not listed".
  - **6 October 2022.** Its page has no table with an Occupation column. It is recoverable later.
  - **The seven rounds from 11 Aug 2020 to 29 Oct 2021 (ruling R15).** They use a `Subclass | Occupation ID | Description | Minimum points score` layout that lists 4-digit unit groups (for example `2211 Accountants`) and mixes 189 and 491 rows. A unit-group cut-off cannot honestly be attributed to one 6-digit occupation, so these rounds are skipped. Before this fix the parser read the 4-digit ID as the name and stored 491 rows as 189 cut-offs.
- **The 189 column must be explicit.** A cut-off column header must name subclass 189 (`189`, `Subclass 189…`, `Lowest Points Score Invited subclass 189…`), or sit under a group label that does. Group labels are mapped to columns by `colspan`, and a group row that spans a different number of columns stops the import. The current-round page's `Minimum points score` column is accepted only when that round's totals table lists subclass 189 alone.
- For the two-row-header rounds (Aug 2022 – May 2023), the cut-off is the lowest of the offshore and onshore 189 minimums: "the lowest score invited in that round" (ruling R7). A blank 189 cell, `N/A*` or "Not invited" gives no row, so `null` (ruling R6).
- **Name variants.** Round pages sometimes spell an occupation differently from the dashboard. A small reviewed alias map (`ROUND_NAME_ALIASES` in `scripts/import/generate-rounds.ts`) handles the two seen on 13 June 2024: `Life Scientist (nec)` → `Life Scientists nec` (234599) and `Psychologist (nec)` → `Psychologists nec` (272399). A test checks that each alias appears on the recorded round pages and names an indexed occupation.
- **Two round-table names still match no dashboard occupation** and are listed in `manifest.roundsUnmatched`: `Patho` (25 May 2023; the source's own text, apparently truncated, so the occupation it means is not stated and it is not aliased) and `Rheumatologist` (22 Aug 2022 and 25 May 2023; no such occupation is on the dashboard). Their cut-offs are not attributed to any occupation. (The earlier unmatched `2335` and `2339` were unit-group IDs from the skipped layout.)

## Known limits

- **Multi-visa EOIs.** One EOI can select 189, 190 and 491 and appears in each visa's rows. How a 190 invitation affects the same EOI's 189 row cannot be determined from aggregates. Analyse each visa separately. Never sum or subtract across visas.
- **States overlap.** An EOI can select several states, so state pools are never summed or checked against national totals. `ANY` is reported separately and never summed with a named state: an `ANY` EOI may or may not compete for a given state's places. Invitations under `ANY` mean the nominating state was not recorded (130 nurse 190 invitations in 10/2026). Report them nationally as "invited, state not recorded".
- **CLOSED is mixed**: expired, withdrawn or finalised. It is not a rejection count.
- **No onshore/offshore field** exists on the dashboard.
- **Masking.** Every count below 20 is `<20`. Small occupations and fine slices are mostly masked, and a masked cell is never narrowed.
- **INVITED is a lower bound** and a stock, not a flow (see above).
- **Same-score order.** Month Submitted is not date of effect, so same-score EOIs cannot be ranked exactly.
- **Cohorts cover 36 months** (ruling R8).

### SUBMITTED coverage window

The spec asked why Software Engineer 189 SUBMITTED rose from 1,129 (as at 11/2024) to 9,464 (as at 10/2026), and whether the dashboard covers only recently active EOIs.

**Legacy comparison.** For November 2025 – October 2026, `statusHistory["189"]` SUBMITTED equals the legacy 12-month trend exactly, for all 11 original occupations (Task 10 reproducibility test). The legacy importer read only those 12 months, so there is no legacy figure for earlier months.

**What the data shows** (Software Engineer, 189):

| As at   | SUBMITTED | INVITED | LODGED | HOLD | CLOSED | All statuses  |
| ------- | --------- | ------- | ------ | ---- | ------ | ------------- |
| 2024-11 | 1,129     | 296     | 126    | <20  | 366    | 1,917–1,936   |
| 2025-05 | 4,868     | <20     | 211    | 87   | 3,620  | 8,786–8,805   |
| 2025-11 | 7,851     | <20     | 188    | 130  | 6,928  | 15,097–15,116 |
| 2026-10 | 9,464     | <20     | 119    | 343  | 12,354 | 22,280–22,299 |

- The sum across all statuses rises by about 885 a month, from about 1,900. If the dashboard held every EOI from the start, that sum could not begin so low: EOIs stay valid for two years.
- In the 10/2026 `cohorts` table, every SUBMITTED Software Engineer EOI was submitted in 10/2024 or later (10/2024: `<20`; 11/2024: 483). EOIs submitted from 11/2022 to 10/2024 appear only as CLOSED (`<20` LODGED aside): 204–674 a month, 11,566 in total. That is almost all of the 12,354 CLOSED.
- National 189 SUBMITTED across all occupations follows the same shape: about 19,000–20,000 as at 11/2024, rising to about 167,000 as at 10/2026.

**What this implies.** The dashboard's data appears to start around October/November 2024. If so, EOIs submitted before then are not counted while SUBMITTED in the early as-at months, and seem to enter the data only when they close. If so, most of the rise in SUBMITTED from 11/2024 is the coverage window filling, not the pool genuinely growing. The two-year validity window for as-at 10/2026 is 11/2024 – 10/2026, which lies inside the coverage. The current pool is therefore plausibly complete, but **monthly SUBMITTED totals before about late 2026 understate the real pool, and the 12-month trend overstates its growth.** Do not describe that rise as "more people applying". The report no longer shows a net change for the trend; its caption says the data appears to cover EOIs submitted from about late 2024, so earlier months may undercount the pool (ruling R17).

**What remains unknown.**

- Why coverage starts there: a system change, the dashboard's launch, or a deliberate extract rule. Home Affairs does not document it.
- Whether pre-coverage EOIs that were invited or lodged are counted in INVITED and LODGED for early months.
- Whether any EOIs submitted before 10/2024 are still SUBMITTED but excluded from the current snapshot. The cohorts table shows only `<20` for 10/2024, and EOIs from 10/2024 or earlier would have expired by 10/2026, so the effect on the current pool should be small.
- These are inferences from aggregates, not a documented rule. Re-check after the 11/2026 import: once the window is full, the all-status sum should stop rising this fast.

## Snapshots, revisions and versioning

- Raw folders are keyed by **as-at month**, not import date. They are our permanent history: the dashboard keeps only 24 months, so older months are rebuilt only from `data/raw/`.
- **The first dataset is pinned to `--as-at 2026-10`** so it matches the sample page and the legacy data. Moving to a newer snapshot is a separate, reviewed change.
- **Revisions are never silently overwritten.** When a re-fetched month differs from the stored file, the importer writes `<view>.rev-<YYYY-MM-DD>.json` (or `-2`, `-3` the same day) beside it and prints the revision with row counts before and after. The generator always uses the newest revision. Identical re-fetches write nothing.
- **Resumable fetches (ruling R10).** Each completed view-month raw file is written atomically as soon as it finishes, so a failed run leaves only complete files and a re-run skips them. `src/data` is written only after the whole dataset passes validation, all-or-nothing, with rollback.
- `manifest.importVersion` is `"1"`. Core and detail records carry `schemaVersion: 2` (ruling R14: explicit fetched months, and `invitedProfile` keyed attribute → month → value); the manifest stays at `1`. A breaking shape change bumps it, along with the guards in `src/lib/data/guards.ts`.

## Validation (the import fails on any issue)

- Schema guards on every core, detail and the manifest. Counts are digit strings or `<20`; dates parse.
- Every record carries the manifest's snapshot id and as-at month. No duplicate codes; every index code has a core and a detail, and no record lacks an index entry.
- Per occupation, visa and month: the SUBMITTED pool total equals the status-history total and lies within the score-row interval sum. Each month's INVITED total lies within its invited score rows.
- While fetching, every table is paged until it has returned `qcy` rows; a table that returns fewer rows than `qcy`, or a changed table shape, stops the run.
- The as-at month is not older than the newest raw month, and the occupation count does not fall by more than 10% from the previous manifest.
- State pools are not checked against national totals (EOIs select several states).

## Running an import

The importer is TypeScript (`scripts/import/`). Node 22.12+ is required, and it has no extra runtime dependencies.

```sh
npm run data:import -- --as-at 2026-11                # monthly import (budget 250 page reads)
npm run data:import -- --as-at 2026-11 --backfill     # fetch every unstored month in each view's window (budget 600)
npm run data:generate -- --as-at 2026-10              # rebuild src/data from stored raw files, no network
```

- `--checked-at YYYY-MM-DD` sets `manifest.checkedAt` (default: today, local date).
- A **monthly import** fetches every view at the as-at month, plus the previous month of `status-history`, `invited-by-score` and `state-invited`, to detect revisions. It also re-reads both round pages.
- A **backfill** fetches every unstored month in each view's window up to the as-at month. It is resumable.
- **Page-read budgets (ruling R11):** backfill 600, monthly 250. The as-at views alone cost about 203 reads, so the spec's original 150 a month was raised. The first backfill used about 440 reads in total; the stored dataset cost 428.
- The dashboard streams at about 12–19 KB/s, so a full backfill takes about an hour.
- `--generate-only` needs an existing `src/data/rounds.json` in the `{ rounds, skipped }` shape (checked by `readRoundsFile`), because the raw round HTML is not stored. The 2026-10 file was rebuilt from the round pages recorded on 17 November 2026 (`scripts/import/__fixtures__/`) when the parser changed.
- The CLI prints parsed and skipped rounds, page reads used, revisions, the occupation count, unmatched round names and validation issues. It exits 1 on any issue.

After an import:

1. Review the printed revisions, skipped rounds and unmatched names.
2. Run `npm run check` and `npm run build`. The evidence tests in `src/lib/report-evidence.test.ts` validate every generated occupation.
3. Commit `data/raw/` and `src/data/` together, in a `data:` commit.

## State rules

The state outlook (`#state-outlook` in the report) reads three kinds of state data. They are separate from the SkillSelect dataset above.

```
src/data/state-rules/2026-27/<state>.ts      Hand-curated 2026–27 rules per state and visa: streams, cohorts, status, requirements, restrictions.
src/data/state-rules/2026-27/index.ts        Combines them and validates them on import (rules-guards.ts).
src/data/state-rules/lists/<wa|sa|qld|nsw>.json   Imported state occupation lists: code → visa → cohorts (and per-visa stream tags).
src/data/state-rules/federal-occupations.json     The Home Affairs skilled occupation list: each code's 190 and 491 eligibility.
```

**Sources.** The curated rules come from `docs/research/state-nomination-2026-27.md`. The lists are imported from the official pages:

- WA: [occupation search CSV](https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv).
- SA: [occupation list](https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list).
- QLD: the [onshore](https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list) and [offshore](<https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)>) lists.
- NSW: the [skills lists](https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists), published as 4-digit unit groups and expanded to every 6-digit code in the occupation index (`viaUnitGroup`).
- Federal: the [skilled occupation list](https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list).

VIC, ACT, TAS and NT publish no list we import. Their rules are `secondary`, so their tiles read "Not yet verified" and still show the published evidence (founder decision, 17 Nov 2026).

**Verification.** Every rule carries `source`, `checkedAt` (YYYY-MM-DD) and `verification`:

- `verified`: read directly on the official page (`[D]` in the research).
- `secondary`: a search extract (`[S]`), a contradiction between official pages, or our own approximation. It never decides eligibility: a check that depends on it reads "Not yet verified on the official page".

Federal eligibility comes only from the imported federal list, never from the dashboard having EOIs for a visa. A code that is absent or `false` there is "Not open to you now" in every state for that visa. If the federal list is missing or invalid, every tile is "Not yet verified". A state list that fails validation in the browser is left out, so the rules that need it read "Not yet verified" too.

**Staleness.** Tests never read the clock; they use fixed dates.

- At render time, a rule or list checked more than 60 days before the report's `asOf` counts as unverified, and its panel line says "Last checked {date}; may have changed".
- At build time, `npm run build` runs `scripts/check-rule-staleness.ts`. It prints a `WARNING` naming the rules checked more than 45 days before today (the first 20, then a count). It never fails the build.

**Monthly re-verify routine** (alongside the SkillSelect import):

1. Re-import the lists: `npm run data:state-lists` (all of them), or `npm run data:state-lists -- --only federal|wa|sa|qld|nsw`. Add `--checked-at YYYY-MM-DD` to set the check date (default: today). The importer stops on a list that shrinks below its floor, fails validation, or is blocked by the source (HTTP 403, a login wall, JS-only data); never work around a block.
2. Open each rule's `source` page in a browser and compare it with the curated rule. Update the rule and its `checkedAt`. Mark anything you could not read yourself as `secondary`, with the reason in `note`.
3. Run `npm run check` and `npm run build` (the build prints no staleness warning once every rule is fresh), then commit the list JSON and the rule files together in a `data:` commit.

**Client import.** The rules (TypeScript), the four lists and the federal list are imported whole by `src/components/data/state-rule-data.ts`, the only client module that may import them. Two lists are above the plan's 100 KB guide (SA 174 KB and WA 138 KB raw), but all five files total about 10 KB gzipped, so they are not split per state (ruling P24). Adding state-outlook code and data grew the first-load JS by about 29 KB gzipped on `/check/` and 53 KB on `/sample/`. Split the lists per state if that budget (about 60 KB) is ever exceeded.

## Reproducibility against the legacy data (Task 10)

The 11-occupation files that fed the site before this pipeline (`pool.json` and `report-evidence.json`, produced by the removed `scripts/import-report-evidence.py`) are kept verbatim in `src/lib/data/__fixtures__/legacy-2026-10/`. `src/lib/data/legacy.test.ts` checks that the new pipeline at as-at 2026-10 reproduces them: score distributions, three visa pools, twelve monthly 189 totals and six rounds for all 11 occupations.

**It found zero differences**, and the test asserts exact equality. The test regenerates 2026-10 in memory from `data/raw` and the stored rounds up to 31 October 2026 (ruling R16), so a later import that replaces `src/data` does not break it. The adapters `toPoolOccupation` and `toOccupationEvidence` in `src/lib/data/legacy.ts` give the current UI those same shapes from the new files.
