# Data foundation: design

Roadmap step 1 of `docs/STRATEGY.md`. Date: 17 November 2026. Status: draft for founder approval.

## Intent

Landfall's promise is a frank reality check. Examples: "this many EOIs are ahead of you", "this is what happened to EOIs like yours", "this is what Victoria invited at your score". Today's data covers 11 occupations and only SUBMITTED EOIs, so none of that is possible yet.

This step builds **one reproducible, validated, versioned dataset covering every occupation**. It will power:

- the reality-check section (step 2);
- the state outlook for 190/491 (step 3);
- about 470 occupation pages (step 4).

It ships no new UI. The existing site must keep working, fed from the new dataset.

## Goals

1. Import, for **every occupation with EOIs**:
   - EOI counts by status, visa, score, nominated state and Month Submitted;
   - 24 months of status history;
   - profile-attribute slices of invitations.
2. Import every occupation's 189 cut-offs from the official round pages, not just 11.
3. Write per-occupation data files, so each page and component loads only what it needs.
4. Give typed, pure accessors in `src/lib` that answer the questions steps 2–4 ask (see "Questions the accessors must answer").
5. Validate everything. A failed check stops the import and nothing is written.
6. **Keep our own history.** The dashboard only keeps 24 months. Every monthly import appends a snapshot that we keep permanently. Over time this becomes data competitors cannot rebuild.
7. Document what each status means in a data dictionary, so no agent misreads it.

## Non-goals

- No new UI and no copy changes. Steps 2–5 do those.
- No percentage chances and no forecasts (founder decision).
- No hand-curated state rules (step 3), and no state-published results such as WA cut-offs or ACT Matrix results (step 3).
- No automatic scheduled imports or alerts. The import is run by hand monthly, and after each round.
- No database or backend. The output stays static JSON consumed at build time.

## Anti-goals (failure even if it "works")

- Collapsing `<20` to a number, or treating a missing row as zero.
- Presenting `CLOSED` as "closed without invitation". It mixes expired, withdrawn and finalised EOIs.
- Summing pools across visas or states as if they were unique people.
- Querying anything the public dashboard does not display: unmasked counts, or custom count expressions. We read the displayed `qText` only, as today.
- Shipping the full all-occupation dataset to the browser.
- Overloading the government server. Queries are sequential and throttled.

## What we know about the source (recon, 17 Nov 2026)

The source is the public SkillSelect dashboard: Qlik app `aaac76b5-ad30-477e-9ca0-472f8ab57fc8`, table object `eymDb`. That is the same object `scripts/import-report-evidence.py` uses.

- **Filter fields:** `Visa Type`, `EOI Status`, `As At Month` (24 values, 11/2024–10/2026), `Occupation`, `Nominated State`, `Month Submitted` (82 values, back to 2017), `Score`, plus the profile fields.
- **Display toggles.** These are the public dashboard's own toggles, each a variable set to `'Y'`. Each adds a dimension to the table:
  - `vShowSubmittedOn`, `vShowOccupationGroups`, `vShowOccupations`, `vShowPoints`;
  - `vShowPartnerSkillsScore`, `vShowEnglishLanguageScore`, `vShowAustralianStudy`, `vShowRegionalStudy`, `vShowSpecialistEducation`;
  - `vShowEOINomState`, `vShowEduCommLanguageQual`, `vShowEmpProfessionalYear`.
- **Statuses:** SUBMITTED, INVITED, LODGED, HOLD, CLOSED.
- **Page size:** one data request returns at most 10,000 cells (`qHeight × qWidth`). Page height is therefore `floor(10000 / width)`, and you page until `qcy` is reached. The current importer's 1,000 rows × 5–6 columns is within that. My early recon used 200 rows by my own choice; that was not a cap.
- **No onshore/offshore field.**

### Publisher guardrail (must be respected)

The table has a calculation condition. It returns nothing (error 7005, "too many columns to display and/or too many filters") unless all of these hold:

- exactly one `As At Month` is selected;
- **at most 2 detail columns are shown**: occupation group, occupation, points, Month Submitted, any profile field, or nominated state;
- **at most 2 detail fields are filtered**: the same list. `vSelectionsLimit = 2`. `Visa Type`, `EOI Status` and `As At Month` don't count towards the limit.

Rules for Landfall:

- Every query stays within the guardrail.
- Never change `vSelectionsLimit` or any other variable, except the public `vShow*` display toggles.
- **No assembled cube may have more detail dimensions than one permitted query could produce.** That means at most 4: 2 shown plus 2 filtered.
- Never derive masked values by differencing overlapping queries. A `<20` cell stays an interval, even if another query's totals would let you narrow it.

The guardrail shapes the views below. For example, nominated state is used as a **filter**, run once per state, with occupation and points as the shown columns.

### Observed status behaviour (189, Registered Nurses nec and Software Engineer, 24 snapshots)

| As at   | Nurse S / I / L / H / C       | Software Engineer S / I / L / H / C |
| ------- | ----------------------------- | ----------------------------------- |
| 2025-07 | 5341 / <20 / 408 / 42 / 1472  | 5833 / <20 / 215 / 104 / 4522       |
| 2025-08 | 4736 / 846 / 469 / 45 / 1674  | 6456 / – / 209 / 108 / 5113         |
| 2026-05 | 7398 / 82 / 583 / 74 / 5310   | 8736 / <20 / 167 / 235 / 10061      |
| 2026-06 | 6056 / 905 / 1442 / 78 / 5465 | 8939 / <20 / 175 / 250 / 10430      |
| 2026-10 | 4280 / 2730 / 989 / 91 / 7936 | 9464 / <20 / 119 / 343 / 12354      |

What this shows:

- **INVITED is a short-lived stock, not a running total.** It spikes in the first snapshot after a round and falls back once invitees lodge or their 60-day window lapses.
  - Invitations "in a round" ≈ INVITED in the next snapshot. Some invitees will have lodged before the snapshot, so this is a **lower bound**.
  - Label it "at least N invited".
- **LODGED also rises and falls.** EOIs leave LODGED, most likely to CLOSED when the visa is finalised.
- **CLOSED grows steadily** and mixes expiry (two years), withdrawal and finalisation.
- **SUBMITTED for Software Engineer rose from 1,129 to 9,464** over the 24 months. Either the dataset only covers recently active EOIs, or the pool genuinely grew.
  - **Builder must check:** compare against `pool.json` totals for the same months, and document the finding in the data dictionary.
- **Month Submitted cohorts work.** Example: nurse 189 EOIs submitted 02/2025, as at 10/2026: SUBMITTED 142, INVITED 175, LODGED 60, CLOSED 510. Very old cohorts show only LODGED/CLOSED.
- **Multi-visa EOIs.** One EOI can select 189, 190 and 491, and it appears in each visa's rows. How a 190 invitation affects the same EOI's 189 row is **not determinable** from aggregates.
  - Rule: analyse each visa separately, and never subtract or sum across visas. Record this in the data dictionary as a known limit.

## Approaches considered

1. **Mirror the full cube.** One fact table for as-at × visa × occupation × status × score × state × every profile field.
   - Pros: maximum flexibility.
   - Cons: an enormous number of queries and rows. Most cells mask to `<20`. Slow, and hard on the server.
   - Rejected.
2. **Declared views (chosen).** A small manifest of named views. Each view is one specific table: which filters, which toggles, which months.
   - A generic importer runs every view.
   - Output is split per occupation.
   - Pros: each view exists because a product question needs it. Query count scales with views × months × states, not occupations, because occupation is a displayed dimension. Easy to review and extend.
3. **Raw dump into SQLite/DuckDB, then generate JSON at build.**
   - Pros: flexible querying, and a good fit for later alerts or a backend.
   - Cons: new infrastructure and binary files in git, more than this phase needs.
   - Deferred: approach 2's raw view files can load into a database later without a rewrite.

**Implementation language: TypeScript (my call, not the founder's).** Port the importer from Python to TypeScript and run it with Node ≥22.12.

- The dashboard websocket needs the anonymous session cookie and an `Origin` header. Check first whether Node's built-in (undici) `WebSocket` can send custom headers. If it can't, use the `ws` package as an exact-pinned dev dependency.
- Reasons:
  - The importer, the validators and the app share one set of types.
  - Tests run in the same Vitest suite.
  - Agents work in a single language.
- The Python script stays until the TypeScript importer reproduces `report-evidence.json` for the original 11 occupations. Then it is deleted in the same PR.

## Design

### Views (initial manifest)

`occ` = occupation shown. All views cover visas 189, 190 and 491SNR (state-nominated 491; family-sponsored 491 is excluded, as today).

Shown columns and filters both respect the guardrail: at most 2 detail columns and at most 2 detail filters. Page counts were measured on 17 Nov 2026 for the 10/2026 snapshot.

| View                    | Shown (≤2)        | Detail filters (≤2)                 | Status / visa          | Months    | Measured size               | Answers                                              |
| ----------------------- | ----------------- | ----------------------------------- | ---------------------- | --------- | --------------------------- | ---------------------------------------------------- |
| `pool-by-score`         | occ, points       | –                                   | SUBMITTED; 189/190/491 | latest    | 9,135 rows, 6 pages         | EOIs ahead of you / at your score                    |
| `status-history`        | occ               | –                                   | all 5; 3 visas         | all 24    | 4,200 rows a month, 3 pages | invitation activity, "last invited", trends          |
| `invited-by-score`      | occ, points       | –                                   | INVITED; 3 visas       | all 24    | 1,799 rows a month, 2 pages | scores invited after each round                      |
| `cohorts`               | occ, submitted-on | –                                   | all 5; 3 visas         | latest    | 67,616 rows, 41 pages       | what happened to EOIs submitted in month M           |
| `cohorts-by-score`      | occ, submitted-on | Score = s, one query per score band | SUBMITTED; 3 visas     | latest    | measure                     | same-score EOIs submitted before or after your month |
| `state-pool`            | occ, points       | Nominated State = X, one per state  | SUBMITTED; 190/491     | latest    | measure                     | competitors per state                                |
| `state-invited`         | occ, points       | Nominated State = X                 | INVITED; 190/491       | latest 12 | measure                     | what each state invited, at which scores             |
| `invited-profile`       | occ, attribute    | – (national)                        | INVITED; 3 visas       | latest 12 | measure                     | "similar profiles invited" nationally                |
| `invited-profile-state` | occ, attribute    | Nominated State = X                 | INVITED; 190/491       | latest    | measure                     | the same, per state                                  |

`attribute` is English Test Score, Australian Study Flag, Professional Year or PartnerSkills Score, one query per attribute. State values are ACT, NSW, NT, QLD, SA, TAS, VIC, WA, plus `ANY` as its own pseudo-state. `N/A` and `AUSTRADE` are excluded from state views.

Notes on the views:

- **`invited-profile`** runs once per profile toggle, never with two toggles together, because combined slices are almost always masked.
- **The builder may merge views** that one query can serve, and may skip months with no INVITED spike. Document either choice in the manifest.
- **Query budget.** One "request" is one `GetHyperCubeData` page read. Selections and variable changes don't count, but they share the same throttle.
  - The **first backfill** (all 24 as-at months) is at most 600 page reads.
  - Each **monthly import** is at most 150.
  - Requests are sequential, with a ≥250 ms pause between websocket calls.
- **Pre-approved reductions, in this order, if the budget or size limits are exceeded:**
  1. Limit `cohorts` and `cohorts-by-score` to the last 36 submitted months, plus one "older" bucket. Older cohorts show only LODGED/CLOSED and don't answer user questions.
  2. Drop months with no INVITED rows from `invited-by-score` and `state-invited`.
  3. Reduce `invited-profile` to the latest 6 months.

  Anything beyond these needs a decision from the founder.

- **Each view records** the exact selections and toggles used, so an import can be reproduced.

### 189 invitation rounds

- Parse the current and previous round pages, as today, but keep **every occupation row**.
- A missing row stays `null` (not listed), never zero.
- Keep every round available on the official pages, not just six.

### Storage layout

```
data/raw/<asAt>/<view>.json       Raw displayed rows per view, plus selections, fetchedAt and source URL. Committed. This is our permanent history.
src/data/manifest.json            Snapshot id, as-at, checkedAt, import version, sources, the occupation index (code, name, group, totals, hasData).
src/data/occupations/<code>.json  Everything about one occupation, built from the raw views.
src/data/rounds.json              All 189 rounds, all occupations.
```

- **A snapshot id** looks like `skillselect-2026-10-31`. Every value derived from it carries the id.
- **Raw folders are keyed by as-at month**, not import date. A raw file stores the column header once, then dictionary-indexed dimension values and the displayed count text. The repeated long names would otherwise inflate it about 10×.
- **Targeting.** The importer takes `--as-at YYYY-MM`. It also offers `--backfill`, which fetches every as-at month the dashboard offers and has not been stored yet.
  - The first dataset is pinned to `--as-at 2026-10`, so it matches today's checked-in files and the sample page.
  - Moving to a newer snapshot is a separate, reviewed change.
- **Monthly import:**
  - fetch the new as-at month for every view;
  - re-fetch the previous month for the multi-month views (`status-history`, `invited-by-score`, `state-invited`) to detect government revisions.
- **Revisions are never silently overwritten.** If a re-fetched month differs from the stored one:
  - write `<view>.rev-<YYYY-MM-DD>.json` next to it;
  - the generator uses the newest revision;
  - the import prints a diff summary for review.
- **History beyond the dashboard's 24-month window** is rebuilt from our stored raw folders. Each as-at month comes from its own folder, newest revision first.
- **Size limits.** All three are guidance; if one is exceeded, use the pre-approved reductions above.
  - **Core file per occupation:** at most 50 KB, holding pool, history, invited-by-score and state summaries.
  - **Detail file** (`src/data/occupations/<code>.detail.json`): cohorts and profile slices, loaded only where needed, at most 250 KB.
  - **Raw:** at most about 10 MB per as-at month in compact form.

### Domain types (`src/lib/data/`)

- `PublishedCount = { kind: "count"; value: number } | { kind: "masked" }`. A masked count means 0–19.
  - An absent row in a complete table is a known zero only when the view guarantees completeness. Otherwise the accessor returns `undefined`, meaning not published.
  - The data dictionary states which views are complete.
- Keep the existing `Interval` arithmetic, and convert `PublishedCount` to `Interval` at the edge.
- Pure accessors (no I/O) that take a loaded occupation record:
  - `poolPosition(record, visa, score)` returns:
    - `higher`, `same`, `total` as intervals;
    - `sameScoreSubmittedBefore(month)` and `sameScoreSubmittedAfter(month)` as intervals, labelled approximate.
  - `invitationActivity(record, visa)` returns:
    - per as-at month: an "at least N invited" interval;
    - the last month with any invited EOIs;
    - the score range invited.
  - `cohortOutcomes(record, visa, submittedMonth, score?)` returns:
    - SUBMITTED, INVITED, LODGED, HOLD, CLOSED intervals;
    - `CLOSED` documented as mixed.
  - `stateEvidence(record, visa, state, score)` returns `{ state, anyState }`. They are never summed: an `ANY` EOI may or may not compete for that state's places. Each holds:
    - competitors at or above your score;
    - invited at or below your score in the last N months;
    - the score range invited.

    Invitations recorded under `ANY` mean the nominating state was not recorded on the EOI; the 10/2026 data shows 130 nurse 190 invitations under `ANY`. Report them nationally as "invited, state not recorded". Never attribute them to a state.

  - `similarProfileInvited(record, visa, state, attribute, value)` returns an interval, or masked/unavailable.
- **Loaders** read one occupation file at build time, in Server Components or `generateStaticParams`. Client components receive only the computed results.

### Validation (import fails on any error)

- **Schema:** every count is a non-negative integer string or `<20`, and dates parse. The builder chooses the method; prefer no new runtime dependency.
- **Completeness:**
  - every view returned `qcy` rows, after paging;
  - the expected visas, statuses and months are present;
  - the occupation index is non-empty and has no duplicate codes.
- **Consistency:**
  - Per occupation, visa and month, the total with points hidden lies within the sum of the score-row intervals. The rule exists today for SUBMITTED; extend it to every status.
  - State-pool sums are **not** checked against national totals, because EOIs can select several states.
- **Continuity:** the snapshot is not older than the newest raw folder, and the occupation count does not drop by more than 10% month to month without a flag.
- **Backward compatibility:** for the original 11 occupations, at `--as-at 2026-10`, the new pipeline reproduces today's `pool.json` and `report-evidence.json` values.
  - An **unexplained** mismatch blocks the work.
  - A mismatch **explained** in the PR (for example, an old importer bug or a government revision) is accepted, with the reviewed diff recorded in `docs/DATA.md`.

### Migration of existing code

- **Replace** `src/lib/pool.ts` and `src/lib/report-evidence.ts` data loading with the new loaders and accessors. Keep `countInterval`, `formatInterval` and `normalizePoolScore`.
- The current UI (homepage explorer, check flow, report, sample) keeps working unchanged.
- The occupation pickers list **all occupations**. Occupations without enough data show the existing "points check only" behaviour until step 2 adds proper empty states.
- **Avoid a bundle blow-up.** The check flow is a client component. Its occupation search may receive the occupation index (code and name only), not the occupation data.
  - Once an occupation is chosen, its record is fetched as a static JSON asset from `out/`, e.g. `/data/occupations/<code>.json`, copied at build.
  - The builder decides the exact mechanism within the static-export constraints. Read the Next 16 docs in `node_modules/next/dist/docs/` first.

### Documentation

- `docs/DATA.md` (new) is the data dictionary. It covers:
  - every view and its filters;
  - what each status means and its observed behaviour;
  - known limits: multi-visa, CLOSED mix, no onshore/offshore, masking, the dataset coverage window;
  - snapshot and versioning rules;
  - how to run an import.
- Update `scripts/README.md`, the importer section of `CLAUDE.md`, and `docs/REPORT-COVERAGE.md` where evidence status changes.

### Testing

- Unit tests (TDD) for every accessor, using small hand-written fixtures. Cover:
  - masked intervals;
  - missing versus not-published;
  - the INVITED lower-bound label;
  - same-score split around the user's month, including the user's own month being ambiguous (counted in neither, and reported separately);
  - score bands outside the published range.
- Importer tests run against recorded Qlik responses, with no network in tests:
  - paging;
  - selection application;
  - a changed table shape fails loudly.
- One reproducibility test: today's 11-occupation values equal the generated values.
- All the usual gates: `npm run check`, `npm run build`, and a browser smoke test of the existing flows.

## Constraints

- Static export, Next 16 and webpack (see `CLAUDE.md`). Follow `docs/ENGINEERING.md`.
- Government data reuse and attribution: CC BY 3.0 AU, credited on the site.
- `docs/original-references/` stays unchanged.

## Left to the builder

- The exact module layout under `src/lib/data/`, and the importer CLI flags.
- Merging or splitting views, within the query budget.
- How the client fetches a single occupation's record, within static export.
- How to word the data dictionary, within the facts above.

## Calls made without the founder (check these while reading)

1. The importer moves to TypeScript, and the Python script is removed once the TypeScript version reproduces its data.
2. Data is stored in three places:
   - raw history in `data/raw/`, committed, compact and keyed by as-at month;
   - per-occupation core and detail files;
   - revisions kept, never overwritten.
3. The query budget is 600 page reads for the first backfill and 150 a month after that, with pre-approved reductions if exceeded.
4. Queries stay within the dashboard's guardrail (2 shown + 2 filtered), with no differencing of masked cells. This is stricter than the guardrail alone strictly requires.
5. `ANY`-state EOIs and invitations are kept separate from named states, and are never summed.
6. The first dataset is pinned to the 31 Oct 2026 snapshot.

## Open questions for the founder

None blocking.
