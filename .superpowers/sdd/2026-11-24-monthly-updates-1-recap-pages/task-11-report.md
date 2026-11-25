# Task 11 report: recap view-model, FAQ and metadata

Status: DONE_WITH_CONCERNS (file split beyond the plan's list; see Concerns)
Commit: 1e87237 feat(updates): recap view-model, FAQ and JSON-LD (BASE df2a228). Not pushed.

## What I implemented

- `src/lib/updates/recap-view.ts`: `buildRecapView(facts, ctx)` returns `RecapView` with `kind` ("round-only" | "data-only" | "full"), `path`, `breadcrumb` (Home › Updates › {Month YYYY}), `hero`, `passport`, `rounds` (newest first), `noRound`, `pool`, `notable`, `notListed`, `states`, `movers`, `compare`, `method` and `faq`. It also exports `recapPath` and the `RecapContext` type. `ctx` is `{ recapMonths; occupationPages? }`; see concern 2. It throws on a facts file with no section.
- `round-view.ts`: `buildRoundView`. It covers the lead, the distribution bars, the listed and not-listed-again lists, the full round table (previous-round cell "Not listed" or "75" with "−5"/"+5"/"same"; the column is null when no earlier round is stored), and the cut-off moves. Shared helpers: `occupationLinker` (unmatched names stay unlinked), `round189Total`, `roundsNewestFirst`, `lastRoundBefore`, `noRoundText`, `cutoffBounds`, `cutoffRangeText`, `occupationsText` and `previousCell`.
- `state-view.ts`: `shadeBand` (700+ → 4, 200+ → 3, 20+ → 2, else 1), `STATE_ORDER`, `buildStateSection` and `stateLeader`.
  - Each section has tiles, map labels, legend, the "State not recorded" tile, and the nominations table as published with the "A different measure" caption.
  - `stateLeader` sets `strictlyMost` only when the top floor is above every other state's `total.max`.
  - A tile's top occupation is labelled "Highest published minimum", because an occupation's own range can't prove "most".
- `hero-view.ts`: `buildHero` and `buildPassport`.
  - H1 and pending-note copy are verbatim from the spec. The pending note ends with a period.
  - The answer is 2–3 sentences. A month with data opens "As at {last day}:".
  - The dateline reads Updated · 189 round(s) · Data as at · Sources checked. Sources checked is the newest `checkedAt` across the sections shown.
  - Round stamp: "SUBCLASS 189 ROUND · 20,000 INVITED · 15 OCT 2026". Data stamp: "SKILLSELECT · DEC 2026 · AS AT 31 DEC 2026".
- `data-view.ts` ([D] parts):
  - `buildPoolView`: scores with a published floor plus one hidden-only score either side; labels never read "0–N".
  - `buildNotableView`: a null previous cut-off reads "Not listed" only when a previous round is known; otherwise "—" under "Previous round".
  - `buildNotListedView`: "Not listed in the last N rounds; last listed …", or "Not listed in any of the N rounds in our data" when it was never listed.
  - `buildMoversView`: pool moves, plus the newest round's cut-off moves.
- `compare-view.ts`: `buildCompareView`. The lead states both months' numbers with no difference or percentage. A row whose previous month wasn't fetched reads "Not available". The four cautions come from the mockup.
- `method-view.ts`: `buildMethodView` names only the sources of the sections shown. A round-only page cites the Home Affairs rounds page alone. A data-only page cites the rounds page only for the notable table or the nominations table, and the occupation list only when `notListed` is shown.
- `faq.ts`: `recapFaq` gives up to 4 fact questions, then "Is this migration advice?".
  - Candidates, in order: the latest round; the lowest score (example: the spotlight occupation if the round listed it, else `cardPicks[0]`); "Was there a 189 round in {Month}?" when there was none; the first large pool not listed; which state gave the most (only when `strictlyMost`); the 189 pool size; the 190 invitation minimum.
  - Every file gets 3–5 questions. For 2026-10 the state question is left out (VIC 1,018 against NSW max 6,946).
- `meta.ts`:
  - `recapTitle`: spec wording with "| MigrateLens". Its doc says to use `title.absolute` (R20).
  - `recapDescription`: the answer cut to 155 characters through `pageDescription`, which gained an optional `limit` parameter (default 160, so no change for occupation pages).
  - `recapJsonLd`: Article (`datePublished` = `firstGeneratedAt`, `dateModified` = `updatedAt`, absolute `image`, the source URLs as citations); a Dataset only with data (`temporalCoverage` = month, `dateModified` = the data source's `checkedAt`); FAQPage; and BreadcrumbList built from `view.breadcrumb`.
- `src/lib/seo/json-ld.ts`:
  - `datasetLd`: the occupation-page builder, moved here; the occupation Dataset JSON is unchanged.
  - `collectionPageLd`: a CollectionPage with an ItemList, for Task 13.
  - `articleLd` takes optional `datePublished` and `image`.
- `src/lib/occupation-page/meta.ts` now uses `datasetLd`.
- `format.ts` changes:
  - New helpers: `hiddenCountsText` ("+ N hidden small counts", null for 0), `intervalText` ("under N" instead of "0–N"), `leastText`, `dayText`, `longDayText` and `monthEnd`.
  - Fixes: `aboutText` returns null rather than "about 0", and `stateFigureText` reads "none published" rather than "at least 0".
- Fixtures: `src/lib/updates/__fixtures__/recap-facts.ts` exports `roundOnly` (2026-11), `dataOnly` (2026-12; no round, previous month not fetched, an all-masked state, a state with no cells, a never-listed large pool, a 491 national range that would round to "about 0") and `twoRounds` (2027-03).

## Tests

New test files: `round-view.test.ts`, `state-view.test.ts`, `recap-view.test.ts`, `faq.test.ts`, `meta.test.ts`, `copy-sweep.test.ts` and `src/lib/seo/json-ld.test.ts`. `format.test.ts` is extended.

- Every brief assertion is covered, using the brief's values verbatim (H1, title, the "As at 31 October 2026:" answer, a description of 155 characters or fewer, no "which state" question for October, TAS 491 "under 20 for each occupation", "about 167,000", the round-only `toMatchObject`, JSON-LD types, `noRound`, the two-round order and the round-only method sources).
- The copy sweep reads every file in `src/data/updates/` through `listRecapMonths`/`loadRecap` (allowed under R8; the live-data guard passes), plus the three fixtures. It checks every string in the view, the title, the description and the JSON-LD against: `BANNED_COPY`, NaN/undefined/null, a "0–" range, a repeated range ("80–80"), "at least 0"/"about 0", internal hrefs ending in "/" and `isRecapFacts`.
- The occupation-page meta tests pass unchanged after the `datasetLd` move.

### TDD evidence

- RED: `npx vitest run src/lib/updates/{round-view,state-view,recap-view,faq,meta,copy-sweep}.test.ts src/lib/seo/json-ld.test.ts` → 7 files failed. The new modules didn't exist yet ("Cannot find module './recap-view'"…), and the json-ld tests failed with "datasetLd is not a function" and "collectionPageLd is not a function". `format.test.ts` failed 4 of 8 before its new helpers existed.
- GREEN: `npx vitest run src/lib/updates src/lib/seo src/lib/occupation-page` → 26 files, 222 tests passed.
- `npm run check` → format, lint (0 errors; 1 warning from the known untracked `.superpowers/brainstorm` asset), typecheck, and 160 test files / 1,655 tests passed.
- `npm run build` passed.

## Concerns

1. **Files beyond the plan's list.** The plan lists recap-view, round-view, state-view, faq and meta. With every slice included, `recap-view.ts` and `data-view.ts` came to 325 lines each, over ENGINEERING's 300-line limit for a lib module. I split them by responsibility: `hero-view.ts` (hero and passport), `data-view.ts` ([D] pool, notable, not-listed and movers), `compare-view.ts` and `method-view.ts`. All are now 296 lines or fewer. Revert to the plan's layout if the controller prefers.
2. **Occupations without a page.** 3 occupations listed in the 15 Oct round have no occupation page (`hasData: false`): Endocrinologist 253315, Neurosurgeon 253513 and Shipwright 399112. Linking them would 404. I added an optional `ctx.occupationPages` set: when it is given, only those codes are linked. **Task 12 should pass the codes of index entries with `hasData`.** Without it, every matched code is linked; that is how the tests run, because they can't read the live index.
3. **Previous cut-off in the notable table for a month without a round.** The notable round isn't in that month's file. The cell reads "Not listed" only when a previous round is provably known, from the round's own section or from another row's non-null previous cut-off; otherwise it reads "—" under "Previous round". This follows the ledger note about `notable189`'s null `previousCutoff`.
4. **"No 189 round in {Month}" and skipped rounds.** The facts file doesn't record skipped rounds, so a month whose only round was skipped (unparseable) would still say "No 189 round". The only skipped rounds today are from 2022 or earlier. Worth a note for Plan 3's round job.
5. **Card numbers (Plan 2, R10).** The view includes the full round table, every state floor and map label, the notable and not-listed figures, and the national figures. These should cover the non-spotlight card numbers, but Plan 2's test will be the real check.
6. **Wording choices not fixed by the spec** (open to founder review):
   - "Highest published minimum" on the state tiles.
   - "none published" for a state with no cells.
   - "none recorded" for a notable row whose INVITED is "0".
   - The FAQ example is the spotlight occupation; the not-listed FAQ picks `largePoolsNotListed[0]`, which is Chef for 2026-10, whereas the mockup used Software Engineer.

## Files

- Created:
  - `src/lib/updates/`: `recap-view.ts`, `round-view.ts`, `state-view.ts`, `hero-view.ts`, `data-view.ts`, `compare-view.ts`, `method-view.ts`, `faq.ts`, `meta.ts`
  - Their tests: `recap-view.test.ts`, `round-view.test.ts`, `state-view.test.ts`, `faq.test.ts`, `meta.test.ts`, `copy-sweep.test.ts`
  - `src/lib/updates/__fixtures__/recap-facts.ts` and `src/lib/seo/json-ld.test.ts`
- Modified: `src/lib/seo/json-ld.ts`, `src/lib/occupation-page/meta.ts`, `src/lib/updates/format.ts` and `format.test.ts`
