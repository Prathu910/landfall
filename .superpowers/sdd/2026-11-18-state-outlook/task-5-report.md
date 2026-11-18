# Task 5 report: curated 2026–27 state rules

Status: **DONE_WITH_CONCERNS** (the interface additions and the Task 7 carries below need controller sign-off)
Commit: `be9a4d7 data: curate 2026–27 state nomination rules from the research` (base ebebd61)

## Implemented

- `src/data/state-rules/2026-27/{wa,nsw,qld,sa,vic,act,tas,nt}.ts`: 16 `StateVisaRules`, one per state and visa, transcribed only from `docs/research/state-nomination-2026-27.md`. No new browsing. Every `Sourced` has `checkedAt: "2026-11-17"`. Each state file is 250 lines or fewer (TAS, the largest, is 232). Judgement calls are commented with a pointer to the research section.
- `sourced.ts`: the `verified()` / `secondary()` builders (a single `CHECKED_AT`), cohort constants, list-ref constants and requirement builders.
- `index.ts`: exports `stateRules: StateRules`, which is validated by `isStateRules` at module load and throws if invalid.
- **Interface additions** in `rules-types.ts` and `rules-guards.ts`, plus guard tests:
  1. `{ kind: "list"; listId; streams?: string[] }`. An optional filter: only list entries tagged with at least one of these stream tags count. **Why:** the imported lists merge every stream into one entry per code. Without the filter, a stream with fewer requirements would accept occupations from another stream. Examples: WA 491 "Schedule 2" (no requirements) would pass the 104 Graduate-only codes; QLD "Building and construction" (3 months) would pass every onshore code; SA "Graduates" would pass Chef. With the filter, the streams reproduce the research's 11-occupation table exactly for WA, NSW, QLD and SA (cross-checked by script).
  2. `{ kind: "not-imported" }`: the state publishes a list or occupation restriction that Landfall hasn't imported (the URL is the `Sourced.source`). Used for the ACT list, the TAS overseas ANZSCO groups, TAS OSOP and NTOMOL. **Why:** `none-published` means "the state names no list", so using it for ACT would put a false statement in front of users. A `list` ref to an unimported id cannot resolve.
  3. A comment says `visa-expiry-before` means **on or before** the date ("by 31 Jan 2027").

## Per-state summary

| State | Visa | Streams (status)                                                                                                           | Verified | Secondary |
| ----- | ---- | -------------------------------------------------------------------------------------------------------------------------- | -------: | --------: |
| ACT   | 190  | canberra-resident (open), overseas (open)                                                                                  |        0 |        12 |
| ACT   | 491  | canberra-resident (open), overseas (open)                                                                                  |        0 |        10 |
| NSW   | 190  | working (open), living (open), offshore (open)                                                                             |       12 |         1 |
| NSW   | 491  | pathway-1, pathway-2, pathway-3 (all **closed**)                                                                           |       10 |         0 |
| NT    | 190  | resident (**closed**), offshore (**closed**)                                                                               |        0 |         9 |
| NT    | 491  | resident (restricted), graduate (restricted), offshore (**closed**)                                                        |        0 |        15 |
| QLD   | 190  | onshore, offshore, graduate, building (open), small-business (unknown)                                                     |       25 |         4 |
| QLD   | 491  | onshore, offshore, graduate, building (open), small-business (unknown)                                                     |       22 |         4 |
| SA    | 190  | graduates, skilled-employment, outer-regional (restricted: visa expiry by 31 Jan 2027), offshore (open)                    |       26 |         3 |
| SA    | 491  | same as 190                                                                                                                |       26 |         3 |
| TAS   | 190  | tse-priority, tse-long-term, tsg, ter, tbo, overseas (open)                                                                |        0 |        25 |
| TAS   | 491  | tse, tsg, ter, tbo (open), osop (**closed**)                                                                               |        0 |        20 |
| VIC   | 190  | roi (open)                                                                                                                 |        0 |         6 |
| VIC   | 491  | roi (**closed**)                                                                                                           |        0 |         5 |
| WA    | 190  | general-schedule-1, general-schedule-2, defence, graduate (open)                                                           |       14 |         4 |
| WA    | 491  | general-schedule-1, general-schedule-2, graduate (open)                                                                    |       11 |         1 |

Counts are `Sourced` fields: selectionSystem, ownScoreSystem, cohorts, status, occupations, requirements and restriction. `ownScoreSystem` is set for VIC (VPT), ACT (Canberra Matrix) and TAS (priority attributes). `resultsUrl` is set for WA, ACT, TAS and SA. SA's points to the news index, because no 2026–27 posts exist yet.

## Judgement calls (each is commented in the code)

**Secondary because Landfall can't test the rule faithfully.** Each of these was read directly ([D]); the reason is in its `note`.

1. **WA 190 employment contract** (Schedules 1–2 and Defence), research §WA item 4. Building and construction sector occupations are exempt, and the imported WA list has no sector column. As verified, this rule would wrongly fail B&C occupations. As a result, WA 190 can only pass through the Graduate stream until the sector is imported.
2. **QLD graduate work months**, research §QLD item 4. Any ANZSCO Skill Level 1 job counts, but Landfall's question asks about the nominated occupation. The graduate stream's use of the **onshore list** is also an inference (§QLD item 2), so that is secondary too.
3. **SA Outer Regional `lives-regional`**, research §SA item 4. "Outer regional" is narrower than "regional": all of SA, Adelaide included, is regional for 491.
4. **SA offshore 3-in-5 years**, research §SA item 4. Listed construction and trades occupations are exempt, and the list doesn't mark them. A **verified 1-in-3** check is kept, because it is a necessary condition for everyone: 3 years within the last 5 always includes at least 1 within the last 3. Effect: SA offshore never fully passes, but a user with no recent experience is still correctly told "not open".

**Contradictions, stored as secondary with both readings in `note`.**

5. WA ranking order (FAQ ranks sector first; the October PDF ranks residence first) → WA `selectionSystem`.
6. SA priority sectors ("defence" vs "trades") → SA `selectionSystem`.
7. NSW FAQ still says "2025-26" → NSW 190 `selectionSystem`, sourced to the FAQ. The 190-page requirements and the Skills List stay verified: the stale wording is in the FAQ, and the list page itself is current.
8. ACT residence, 3 vs 6 months. Each visa takes the reading of its most specific source: 491 uses 3 (the 491 resident page), 190 uses 6 (the resident-wide February 2026 guidelines). Both readings are in each note.
9. TAS TSE priority duration ("9 months" vs "the last nine months"). The value is 9; the note gives 6 for teaching and health roles.

**Encodings.**

10. **NSW "working in NSW" option: `min-months-working-in-state: 1`.** NSW sets no minimum duration, only current work of 20+ hours a week. Leaving the requirement out would pass every NSW resident. Encoding 1 month reads "currently working" in terms of the months question. Risk: someone in their first month of a job who has lived in NSW under 6 months is told "not open". **Please confirm or overrule.**
11. **NSW 190 interstate cohort excluded.** The work question covers the user's own state, so someone living in another state and working in NSW (for example Albury–Wodonga) is not matched. This is noted on the cohort.
12. **NSW's three residence options are three streams** (OR). NSW 491 is three closed pathways with `none-published` (verified: no 2026–27 regional list). The status is verified closed, with the notice's missing program year in the note.
13. **Business pathways with no recorded criteria** (QLD small business, TAS TER and TBO, NT graduate) are modelled but can never pass: their status or occupations are secondary/`unknown`. QLD small business keeps a **verified `lives-regional`**, so only regional QLD residents get "Not yet verified" from it. Everyone else still fails that stream.
14. **Requirements stated only qualitatively or not mapped are left out and described in notes or restriction text.** Examples: hours per week, salary ($57k TAS, the WA "appropriate" salary), the English level, the WA 3-month residence (it affects ranking, not eligibility), QLD prior-491 exclusion (190 `restriction`), the "otherwise similar" ACT 491 overseas rules, and the NT "visa deadline". The NT deadline covers turning 45 and points loss as well as visa expiry, so it is not encoded as `visa-expiry-before`.
15. **"N of the last M months" (QLD) is encoded as N months.** The note says the months questions count continuous months.
16. **WA Schedule 1 experience is `{years: 1, withinYears: 10}` (verified).**
17. **Occupation refs.** VIC uses `all-federally-eligible` (secondary). NT onshore and the TAS onshore pathways use `none-published` (secondary), as the research says "no list". ACT, TAS overseas, OSOP and NTOMOL use `not-imported` (secondary).
18. **Closed, as instructed:** NSW 491 (verified); NT 190, NT offshore, VIC 491 and TAS OSOP 491 (all secondary). The NT 491 resident and graduate streams are `restricted`, because they are open by exception only.
19. **No stream name, restriction, selectionSystem or note uses banned copy** ("applicants", "people", "apply to" and so on). There is a test for this, and it caught one "apply to" during GREEN.

## Carries to Task 7 (evaluator)

- Honour `list.streams`: the entry's `streams` must intersect the filter.
- `not-imported`, and any `secondary` field (cohorts, status, occupations, requirements), give `unverified` and never `fail`. Do not look up a list before checking verification. Status `unknown` gives `unverified`.
- `none-published` appears only on closed streams (verified) or as secondary. No verified open stream uses it.
- `visa-expiry-before` is inclusive (≤ date).
- `min-years-experience` with `withinYears: 10` (WA Schedule 1): under Ruling P2 it maps to `yearsExperienceLast5`. A last-5 answer that meets the minimum proves a pass. One that falls short does **not** prove a fail, so it would be safer to return `needs-answer`/`unverified` there.
- Known per-code limitation: the imported lists union a code's visa flags across its streams. A code that is 491-only in Schedule 2 but 190 in Graduate would match the 190 Schedule 2 stream (noted in a `wa.ts` comment).

## Tests and TDD evidence

RED for the guard test (`npx vitest run src/lib/state-outlook/rules-guards.test.ts`):

```
 × accepts a list reference narrowed to stream tags, and a not-imported list
AssertionError: expected false to be true
 Tests  1 failed | 9 passed (10)
```

RED for the state rules test (`npx vitest run src/data/state-rules/2026-27/state-rules.test.ts`): the import of `./index` failed because the module was missing (`Tests  no tests`, 1 failed file).

GREEN, after the fix that caught "apply to" in a QLD note:

```
 Test Files  3 passed (3)
      Tests  30 passed (30)
```

Final runs:

- `npm run check`: format, lint (0 warnings), typecheck and tests all pass. 47 files, 451 tests.
- `npm run build`: passes (static export).

The 15 state-rules tests check:

- there are 16 state and visa pairs;
- the guard passes, and every `checkedAt` is 2026-11-17;
- stream ids are unique and every rule has at least one stream;
- every ACT, VIC, TAS and NT `Sourced` is secondary;
- no verified rule cites an ACT, VIC, TAS or NT domain, and every verified source is on a host the research read directly;
- every NSW 491 stream is closed (verified);
- NT 190, NT offshore, VIC 491 and TAS OSOP are closed;
- WA, SA, QLD and NSW reference only their own imported lists;
- every listId and stream tag resolves in the imported JSON;
- every `none-published` and `not-imported` ref has a note, and every `not-imported` ref is secondary;
- VIC is all-federally-eligible and secondary;
- the contradictions are secondary, including both ACT months notes;
- all 6 SA onshore streams are restricted, carry the restriction text and require visa expiry by `2027-01-31`;
- `ownScoreSystem` and `resultsUrl` are set where expected;
- there is no banned copy.

## Files changed

- `src/lib/state-outlook/rules-types.ts`, `rules-guards.ts`, `rules-guards.test.ts`
- `src/data/state-rules/2026-27/`: `sourced.ts`, `index.ts`, `wa.ts`, `nsw.ts`, `qld.ts`, `sa.ts`, `vic.ts`, `act.ts`, `tas.ts`, `nt.ts`, `state-rules.test.ts`

## Self-review

- Every number comes from the research. None is invented, except the 1-month NSW encoding (call 10), which is flagged.
- The state files use builders so each stays under 250 lines. Notes repeat the research's caveats so the panels can show them.
- The cross-check script (in scratchpad, not committed) confirmed the list filters reproduce the research's occupation table for WA, NSW, QLD and SA.

## Concerns

1. **Interface additions to Task 1's types** (`streams` filter, `not-imported`): these were needed for honest data. Task 7 must implement them.
2. **WA 190 is effectively unverified** except through the Graduate stream (call 1). This is honest but loses coverage. The fix is to import the WA CSV's sector column and split the stream.
3. **The NSW 1-month encoding** (call 10) needs a ruling.

## Fix round 1 (rulings P11–P13)

- P11 and P12 were accepted with no change.
- P13: the `nsw-190-working` requirement `min-months-working-in-state: 1` is now `secondary`. Its note gives NSW's rule ("currently working in NSW (20+ hours a week)", no minimum duration) and says the 1-month encoding is Landfall's approximation. `nsw-190-living` (6 months) and `nsw-190-offshore` (6 months) stay verified. NSW 190 now has 11 verified and 2 secondary rules. Effect: an NSW resident with under 6 months' residence gets "Not yet verified" rather than a pass or fail from the working option.
- Test added: "keeps the NSW 1-month working approximation secondary, and the residence options verified". RED: `Expected: "secondary" / Received: "verified"`. GREEN after the change.
- `npm run check` passes (47 files, 452 tests, 0 warnings). `npm run build` passes.
- Commit: `data: mark the NSW working-in-state approximation as unverified`.

## Fix round 2 (review I1–I3: rulings P15–P17, plus extras)

Two commits, each with tests written first:

- `87e030a feat(state): model related work and month windows in state rules`
  - `Requirement`: `min-months-working-in-state` gains a required `related: "same-occupation" | "anzsco-2-digit" | "anzsco-3-digit"`. All three month requirements gain an optional `ofLastMonths`.
  - The guard checks `related` against the enum and requires `ofLastMonths >= months`. It now also rejects duplicate stream tags.
  - New `invalidRulePath(rules)`, which returns e.g. "WA 190 stream wa-graduate" or "WA 190 (rule fields)". `index.ts` now throws with that path.
  - Data values (P15):
    - SA onshore: `anzsco-2-digit`.
    - QLD: `anzsco-3-digit`.
    - TAS 190 TSE priority roles: `anzsco-3-digit` (research §TAS item 2: "closely related job (same 3-digit ANZSCO group)").
    - Everything else: `same-occupation`.
  - RED: 7 failures (the `related` and window guard cases, duplicate tags, the 3 `invalidRulePath` cases, and the data related-work test). The test "rejects a month window shorter than the months" passed vacuously before the change, because unknown keys were already rejected.
  - GREEN exposed a real bug: `invalidRulePath` reported a stream when a rule-level field was the problem. It now checks rule-level fields first.
- `4107d85 data: apply review rulings on interstate cohorts and QLD month windows`
  - P17: `nsw-190-working` and `qld-building` cohorts are now `["living-in-state", "living-in-other-state"]` (verified), with a note saying no residence condition is stated.
  - P16: the QLD onshore and graduate living/working requirements carry `ofLastMonths` (190: 9 of 12; 491: 6 of 9). These are the only 8 windowed rules. QLD 491 `lives-regional` (onshore and graduate) is now secondary, with a note explaining that living regionally now cannot show where the months were spent. The comment in `qld.ts` is rewritten to match P16, and `window` is renamed `windowText`.
  - Extras:
    - VIC cohorts are now `ALL_COHORTS` (still secondary).
    - The NSW list note says the research counted 80 unit groups and the imported list has 78.
  - RED: 5 failures. GREEN after the data changes.
- Both commits: `npm run check` passes (47 files, 465 tests, 0 warnings) and `npm run build` passes.
- New counts: NSW 190 has 11 verified and 2 secondary rules; QLD 491 has 20 verified and 6 secondary. All state files are 250 lines or fewer (TAS 232, QLD 223). The test file is 361 lines, and `rules-guards.ts` is 271, within the 300-line limit for `src/lib` modules.

### Concern: P17 for `qld-building` will not reach interstate users under the current list and P2

1. **List check.** The QLD importer (Ruling P9) maps the onshore list, and with it the B&C column, to `living-in-state` only. All 48 B&C entries list no `living-in-other-state` cohort. If Task 7 checks the entry's cohorts for the user's visa, an interstate user fails the list check before the stream's cohorts matter.
2. **Requirement mapping.** Ruling P2 fails `min-months-working-in-state` when the user lives in another state ("You don't currently live in {state}"). For `nsw-190-working` that requirement is secondary, so the result is unverified, which is acceptable. For `qld-building` it is verified, so the result is a fail.

Possible fixes, for the controller to choose:
- (a) When a stream lists a cohort the imported list doesn't record, Task 7 checks list membership by visa only.
- (b) The QLD importer adds `living-in-other-state` to B&C entries.
- (c) P2 maps interstate work to `needs-answer` or `unverified` for streams whose cohorts include `living-in-other-state`. The profile has no "months working in another state" field.

The data now matches P17. These are Task 7 or importer decisions.
