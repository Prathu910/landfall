# Final fix wave report (P27–P31 + "Also in wave")

Status: DONE_WITH_CONCERNS (concerns at the end). Branch `roadmap/reality-check`, base `4e9e517`.

## Commits

| SHA | Subject |
| --- | --- |
| e512730 | fix(state): clear occupation work answers when the occupation changes (P30) |
| 214d6f1 | fix(state-rules): hold the WA and SA graduate study rules as secondary (P28, data) |
| c594bc6 | fix(state): check the points check's federal minimums before any state rule (P27) |
| e1bcd6a | fix(state): record which work counts towards each experience rule (P31; data rides along because the type requires it) |
| 55336b7 | fix(state): say why each rule fails or can't be confirmed in the panels (P29 + view split, stable keys, shared closure label, any-state wording) |
| 39216e2 | fix(state-lists): stop the QLD import when the onshore pathway column is missing |
| 705bc01 | refactor(state): let a stream carry several unchecked restrictions |
| 0989aab | fix(state-rules): show QLD's Notice of Assessment gate and Queensland employer rule (data) |
| e93d078 | docs: record the state outlook's final review fixes |

`npm run check`: 0 warnings, 652 tests pass (628 before). `npm run build`: passes (no staleness warning). Nothing under `.superpowers/` was staged.

## P27 (C1): federal baseline from the points check

Change:
- `PointsResult.ineligibleReasons: string[]` (migration.ts): "age 45 or over" / "age under 18", "English test expired", "skills assessment expired"; `eligible` is now `false` exactly when the list is non-empty. Empty when eligible or unknown.
- New `src/lib/state-outlook/baseline.ts`: every stream starts with two checks, `basis: "points-check"`, no source link, note "From your points check":
  1. "Age, English test and skills assessment within the federal limits": `eligible === false` → fail "Your points check shows {reasons}"; `null` → needs-answer, question "Complete your points check" (no profile field, so no Sharpen question); `true` → pass.
  2. "At least 65 points for {visa} with nomination": under 65 → fail "Under the 65-point pass mark for {visa}".
- `OutlookInput`/`StreamContext` gain `eligibility: PointsEligibility` (= `Pick<PointsResult, "eligible" | "ineligibleReasons">`) and the context carries `points`. `buildStateOutlookView` now takes the whole `PointsResult`; `report-view.ts` passes it.
- Judgement: with the federal list missing, `checksFor` still returns only the federal-missing check (global constraint "If the federal list is unavailable, all tiles are Not yet verified" wins over "baseline first").

Tests (RED captured, then GREEN): migration reasons test (RED: `expected undefined to deeply equal []`); 4 evaluator baseline tests + 23 index-shifted tests (RED: 27 failed, e.g. `expected 'pass' to be 'fail'`); 3 outlook tests (RED: `expected 'strongest' to be 'not-open'`, `'watching' to be 'not-open'`, `'strongest' to be 'needs-answers'`); report-level test with a real age-47 331212 profile (RED: `expected [ 'watching', … ] to not include 'watching'`). Test files now name check indices (`FEDERAL = 2`, …) and the real-data helper skips the two points-check indices.

## P28 (C2): WA and SA graduate rules secondary

Change (data only): `wa.ts` `waStudy` and all three SA Graduates course rules (study, 6 months living, 6 months working after the course) are `secondary`, with notes saying what Landfall can't test (87 weeks face-to-face / Certificate III; 46-week CRICOS, 75% in SA, a year living in SA; whether the months came after the course).

Tests: "keeps the WA and SA graduate study rules secondary…" (RED: `expected 'verified' to be 'secondary'`). Consequence tests updated: the study question is no longer asked (it can't change a tile); questions test now uses a real QLD nurse.

Sweep: graduate-stream passes (reviewer's `strong.ts`, by deciding stream) before: Strongest 190 SA sa-graduates 4 codes, 190 WA wa-graduate 9 codes, 491 SA sa-graduates 1 code; Worth watching 190 SA 275, 190 WA 266, 491 SA 332, 491 WA 104 codes. After: **0** graduate-stream Strongest or Worth watching rows (full sweep tally of graduate deciding streams: 0).

## P29 (I3): findings on lines

Change:
- `RuleCheck` gains `finding` (required) and `verification` (of the rule behind it); `evaluateStream` now returns the `StreamResult` directly (the parallel `findings` array is gone); `judge.ts` exports `toCheck`.
- Filtered list labels name the stream: "On the Queensland 2026–27 list for 190 under Building and construction workers".
- Panel lines (`panel-lines.ts`): `CanApplyLine` gains `key` and optional `finding`. A ✗ line, and an unverified line whose rule is verified and fresh, show the finding; "Not yet verified on the official page" only for secondary rules; stale rules say "Last checked …; may have changed"; the federal-missing line says "Not checked".
- Not-open panels list each stream's first failing finding (text = stream name), collapsing to one line when every stream fails on the same check (e.g. NSW 491 closed, or the points check); `streamName` is null for not-open panels. Restriction lines are not added to not-open panels.
- `state-panel.tsx` renders the finding in its own span (`.finding`, ink colour, body size) and keys lines by `line.key`.

Reproduction fixed (Software Engineer living in NSW, QLD 190): before, the panel showed `✗ On the Queensland 2026–27 list for 190` under "Building and construction workers". After:
```
✗ Skilled workers living in Queensland — Not open to those living elsewhere in Australia
✗ Skilled workers living offshore — Not open to those living elsewhere in Australia
✗ Graduates of a Queensland university — Not open to those living elsewhere in Australia
✗ Building and construction workers — Not on the Queensland 2026–27 list for 190 under Building and construction workers
✗ Small business owners in regional Queensland — Not open to those living elsewhere in Australia
```
A QLD nurse with 6 months now reads "? At least 9 of the last 12 months living in Queensland — Under 9 months in a row living in Queensland; 9 of the last 12 months may still be met · checked 17 Nov 2026" instead of "Not yet verified on the official page".

Tests: view tests for the QLD reproduction, the collapsed NSW 491 line, verified-fresh findings vs secondary notes, and unique stable keys; evaluator assertions on `verification` and the filtered list label (RED: 72 failed across the rewritten evaluate tests and new view tests; GREEN after).

## P30 (I4): occupation change clears work answers

Change: `resetStateRelativeAnswers` also clears `monthsWorkingInState` and `yearsExperienceLast3/5/10` when `occupation` changes. Also applied to the `?occupation=` preselect over a restored saved profile in `check-flow.tsx`, which bypassed the update path.

Test: "clears the answers about your occupation's work when the occupation changes (ruling P30)" (RED: `expected 14 to be null`).

## P31 (I5): which work counts towards experience

Change: `RelatedWork` adds `anzsco-4-digit` and `any-skilled`; `min-years-experience` requires `related` (guard enforces it). Data: WA Schedule 1 `anzsco-4-digit`; QLD offshore `anzsco-3-digit`; SA offshore (both rules) `any-skilled`; ACT (both) and NT `same-occupation` (both secondary anyway). Labels name the definition ("…in the last 10 years in your nominated occupation or one Western Australia treats as related (same first 4 ANZSCO digits)"; "…in any skilled occupation"). An answer below the minimum is a fail only for `same-occupation`; otherwise unverified: "Under 1 year in the last 10 years by your answer; Western Australia also counts work in a related occupation (same first 4 ANZSCO digits)". The experience question names the definition and states when all affected states share it (P15 style); when they differ it asks about the nominated occupation alone (a pass is then true for every state) and the help adds "Count only your nominated occupation; some states also count related work." Rule wording moved to `wording.ts` to keep `requirements.ts` under 300 lines.

Research quotes (docs/research/state-nomination-2026-27.md):
- WA, §WA item 4: "**Work experience (Schedule 1 only, 190 and 491):** at least one year in the nominated or a closely related occupation (same first four ANZSCO digits) within the last 10 years." → `anzsco-4-digit`.
- QLD, §QLD item 4: "**All pathways:** at least 65 points, at least competent English, and post-qualification work of 20+ hours a week. "Closely related" means the same first **3** ANZSCO digits." and "**Offshore:** at least 1 year of skilled employment in the last 3 years." → `anzsco-3-digit`.
- SA, §SA item 4: "**Offshore:** at least **3 years** of skilled experience in the last 5 years. Listed construction and trades occupations need only 1 year in the last 3." No occupation is named → `any-skilled`. (The onshore work rule stays "Employment must be in the same ANZSCO sub-major group (2 digits)".)
- ACT, §ACT item 4: "**3 years** of full-time, post-graduate work in the occupation within the last 5 years" → `same-occupation`; "Overseas 491: **1 year** of experience in the last 5 years, with otherwise similar rules" → `same-occupation`.
- NT, §NT: "**Offshore (when open):** at least 2 years of post-qualification experience in the last 5." No definition recorded → `same-occupation` per the ruling (secondary, never decides).

Tests: guard, rules-data, evaluator and questions tests (RED: 11 failed, e.g. guard rejecting the new shape, label/finding mismatches; GREEN after).

Sweep effect: on eligible profiles, not-open fell from 82,926 to 82,223 (703 outcomes with 0 years now unverified instead of failing a wider-definition experience rule).

## Also in wave

- QLD importer: `parseQldTable(html, "onshore" | "offshore")`; the onshore list throws "QLD onshore list has no Building and Construction pathway column (got …); review the source" when that heading is missing or renamed; `buildQldList` passes the list kind. Test (RED: `expected [Function] to throw an error`).
- QLD restrictions: `Stream.restriction` → `Stream.restrictions` (list; refactor commit, guard + staleness + panel lines). QLD data: every onshore pathway shows "Those living in Australia need a 2025–26 ATO Notice of Assessment before they submit an ROI." (verified, source the QLD home page, research §QLD item 1 [D]); the onshore pathway shows "Must currently live and work in Queensland for a Queensland employer." (verified, onshore page, §QLD item 4 [D]). Wording avoids the banned word "applicants". Test (RED: `190 qld-onshore: expected undefined to be 'verified'`).
- `view.ts` split: `view.ts` 119 lines, `panel-lines.ts` 171, `evidence-text.ts` 132. All `src/lib/state-outlook` modules are under 300 lines.
- Stable unique line keys (`{streamId}:{index}`, `:closure`, `:restriction:{i}`, `:first-fail`, `first-fail`, `no-rules`).
- One closure label: `closedLabel(programYear)` in `context.ts`, used by `evaluate.ts` and `panel-lines.ts`.
- Any-state tile: "no published invitation data for EOIs not tied to one state in the last 12 months" (`EvidenceScope`).

## Sweep (reviewer's script, adapted)

Adapted copy: `scratchpad/fix/sweep.ts` (passes `eligibility: pts`; `EXTRA` JSON and `DOB` override the base profile). 493 occupations × 9 places × 3 answer sets × 2 visas × 8 states = 212,976 outcomes per run.

Before (original script, `sampleProfile` has no assessment date so `eligible` is null throughout): viol 0; not-open 87,046, needs-answers 5,641, unverified 112,144, watching 7,984, strongest 161. With `DOB=1979-06-01` (age 47): **56 Strongest** with `eligible === false` (e.g. 331212 / NSW / 491 / WA at 75) and 8,089 watching. With a 45/55-point profile: **8,145 Worth watching under 65 points**.

After (final code):

| Profile | not-open | unverified | needs-answers | watching | strongest | pass while ineligible or < 65 | viol |
| --- | --- | --- | --- | --- | --- | --- | --- |
| eligible (assessment date set) | 82,223 | 121,223 | 2,227 | 7,162 | 141 | 0 | 0 |
| age 47 | 212,976 | 0 | 0 | 0 | 0 | 0 | 0 |
| 45/55 points | 212,976 | 0 | 0 | 0 | 0 | 0 | 0 |
| points check incomplete (`eligible` null) | 82,223 | 121,223 | 9,530 | 0 | 0 | 0 | 0 |

- Zero Strongest/Watching for `eligible === false` or points < 65.
- Zero not-open without a fresh failing check; a stricter run (every not-open stream's first fail must also have `verification === "verified"`) also gives 0.
- WA/SA graduate Strongest after P28: 0 (Watching: 0).

Surprises: (1) the reviewer's sweep profiles had `eligible: null` all along, so its "ineligibleStrong: 0" hid the age bug unless `DOB` was set; (2) an age-47 or under-65 profile is now not-open in ACT, VIC, TAS and NT too (the fail is the user's own points check, not a state rule); (3) a user who leaves the English test date empty gets `eligible: null`, so every state that would pass reads "Needs your answers" with "Complete your points check".

## Browser smoke (headless Chrome over CDP against `out/`)

Script `scratchpad/cdp/finalfix.mjs`, 14/14 checks pass: `/sample/` both grids (8 tiles, 8 panels each); NSW 491 not-open panel shows "Closed for 491 in 2026–27" in its own finding span; WA 491 panel starts with the two "From your points check" lines; 390px no horizontal overflow; NSW Software Engineer through `/check/`: QLD 190 lists each stream with why and no bare "On the Queensland 2026–27 list for 190" line; age 47 (331212): no Strongest/Worth watching tile, WA 491 tile reads "Your points check shows age 45 or over"; no console errors on any page. Screenshots: `screenshots/final-fix-qld-not-open.png`, `screenshots/final-fix-sample-390.png`.

## Self-review

- Each ruling is covered by behaviour tests on real data where it matters (QLD reproduction, age-47 331212, nurse months).
- `StreamEvaluation`/`findings` removed rather than duplicated; `Judged` replaced by `RuleCheck`.
- Copy passes `BANNED_COPY` (one restriction reworded from "Onshore applicants").

## Concerns

1. **Incomplete points checks**: `eligible` is null when the English test date is left empty (allowed by the check flow) or the assessment date is missing. Per P27 such users see no Strongest/Worth watching anywhere, and the Sharpen form has no question for it (the fix is in the main check). If that is common, the founder may want the check flow to ask for the test date, or a visible prompt in the outlook.
2. **Federal list missing + ineligible**: kept "all tiles Not yet verified" (global constraint) instead of putting the baseline first; an age-47 user then sees "Not yet verified", not "Not open".
3. **Not-open tile reason** is still the furthest-reaching stream's finding (e.g. "Not on the Queensland 2026–27 list for 190 under Building and construction workers" for a NSW resident). True and now names its stream, and the panel explains every stream, but a residence reason might read better on the tile. Left as is (it would change the deciding-stream tiebreak).
4. P31 data for ACT and NT uses `same-occupation` per the ruling; NT's text says only "post-qualification experience" (both secondary, never decide).
5. Commits e1bcd6a and 55336b7 combine code with the data or extras they need to compile; data-only changes (P28, QLD restrictions) are separate.

## Follow-up: ruling P32 (concern 1), commit ff174e7

`fix(state): let the outlook ask for the missing points-check dates`

Change:
- `PointsResult.uncheckedDates: UncheckedDate[]` (`englishDate`, `assessmentDate`, `assessmentExpiry`): date answers that are empty or invalid. This replaces the internal `unknown` flag, so `eligible` is null exactly when `uncheckedDates` or `missing` is non-empty. An English date is not asked while the English level itself is missing.
- `PointsEligibility` also picks `missing` and `uncheckedDates`. When `eligible` is null, the baseline emits one needs-answer line per missing item, each with `basis: "points-check"` and its Profile field:
  - "Add your English test date" (`englishDate`)
  - "Add your skills assessment issue date" (`assessmentDate`)
  - "Correct your skills assessment expiry date" (`assessmentExpiry`)
  - `missing` labels become "Edit your answers to add your date of birth / your English level / your highest qualification / your partner status" (fields `dob`, `english`, `qualification`, `partner`; these have no Sharpen template, so they are not asked there).
  - If nothing specific is known, the line still reads "Complete your points check".
- `questionsNeeded`: points-check needs-answer checks from every stream are added, so the date questions affect every state ("Affects: every state and territory" when all 8 are affected). New templates (kind `date`): "When did you take your English test?", "When was your skills assessment issued?", "When does your skills assessment expire?". The `visa-expiry` kind is renamed `date`. The Sharpen form's DateInput serves any date field, and `patchFor` stores these as strings ("" clears). Answers go through `updateMany`.
- Docs: DATA.md "State rules" and HANDOFF.md updated in the same commit.

Tests:
- RED (`scratchpad/fix/red-p32.txt`): 6 failed. They were the migration `uncheckedDates` test, the two evaluator item tests, the questions every-state test, the questions kinds test, and the real-data nurse test.
- GREEN: 657 pass. The real-data test uses the QLD nurse (`cases[1]`) with an assessment date and an empty `englishDate`:
  - `eligible` is null and QLD 190 is in needs-answers.
  - The English-date question is kind `date` and affects every state and territory.
  - The QLD panel line reads "Add your English test date" with "From your points check".
  - After answering 2025-02-02, QLD 190 is Strongest again.

Verification:
- `npm run check`: 0 warnings, 657 tests.
- `npm run build`: passes.
- Headless Chrome on /check/ (`scratchpad/cdp/p32.mjs`), 8/8 checks:
  - The nurse with no English date starts with QLD 190 in "Needs your answers", and the panel asks "Add your English test date".
  - Sharpen shows "When did you take your English test?" (Affects: every state and territory).
  - Typing 02 Feb 2025 moves QLD 190 to "Strongest evidence" live.
  - The opt-in save stores `englishDate: "2025-02-02"`, the URL is unchanged, and there are no console errors.
- Sweep invariants (strict) are unchanged:
  - eligible: viol 0, with 0 passes while ineligible or under 65.
  - age 47 and 45/55 points: all not-open.
  - eligible null: 0 passes, 9,530 needs-answers.
  - Every not-open stream has a fresh, verified fail.

Note: once a date makes the check complete, its question leaves the Sharpen list. The baseline then passes with no field. The date can still be edited in the main check.
