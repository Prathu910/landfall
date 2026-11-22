# Task 6 report: How to improve and protect

Status: DONE_WITH_CONCERNS (module length 337 lines, over the 300-line `src/lib` limit; not split, per instructions)

Commit: `0dd3bc9 feat(outlook): how to improve, protect and dated losses`

## What was implemented

`src/lib/outlook/improve.ts` exports `Shift`, `Move`, `Loss`, `Improve` and `buildImprove(input, base)`, with the interface exactly as in the brief.

- **Candidates.** Every candidate is applied to a copy of the profile and run back through `evaluateProfile`. Only candidates that raise `points.base` are kept.
  - `english-proficient` sets English to Proficient with `englishDate = asOf`.
  - `english-superior` uses `applyScenarios(["english"])`.
  - `naati` uses `applyScenarios(["language"])`.
  - `professional-year` sets `professionalYear: true` with an empty date. `calculatePoints` decides which occupations it counts for, so the move only survives for 26xxxx, 233xxx and 2211xx.
  - `partner-skills` is offered only when `partner === "english"`, and changes it to `"skilled"`.
  - `experience` is the next band from `applyScenarios`: Australian work if onshore, overseas work otherwise. Its `date` is null because the profile holds years, not dates.
- **Combined.** This joins the top-ranked single with the next-ranked single that stacks with it. Two English moves never stack. It is listed last.
- **Ranking (R1).** Moves are ranked by after-label (`LABEL_RANK`), then most points, then a fixed lead-time order: naati < english-proficient < english-superior < partner-skills < professional-year < experience. Exactly one move is `best`. The combined move is best only when its label is strictly better than the best single move's label.
- **Visa.** Every move reports 189 (`visa: "189"`). The `why` line is the 189 label's own `why` without the "Confirm your English…" suffix. When the after-label is not-invited, it starts with "At {n}, 189 is still Not currently invited."
- **Modes.**
  - `plain`: the stamp is combined `no-data`. Lines read "{name}, +{n}. Takes you to {total}." and there are no moves.
  - `protect`: 189 is very-strong. There are no moves.
  - `points-not-problem`: 189 is not-invited.
  - `improve`: everything else.
- **Banners** (wording from the mockup `report-e-final.html`):
  - protect: "You're already at the top. The only risk is waiting too long."
  - points-not-problem: "Points aren't what's holding you back. 189 needs to start listing your occupation again."
  - points-not-problem when the stamp is combined (Dev): "Points won't change this. No visa is inviting your occupation right now."
  - Otherwise there is no banner.
- **Losses.** These are `buildTimeline` events dated on or before asOf + 2 years, applied cumulatively in date order. Each running total adds the event's `delta`, then the 189 label is recomputed with `label189`.
  - English test expiry, skills assessment expiry and the 45th birthday are kind `eligibility`. Eligibility stays false for the rest of the list, so `to.label` is `not-eligible`.
  - EOI expiry is kind `eoi-expiry`.
  - Other events with a negative delta (age-band birthdays, Professional Year points ending, community language expiry) are kind `points`.
  - Visa expiry and gains are skipped.
  - The timeline has no event ids, so events are matched by their fixed titles. A comment in the code says why.
- I made one small change to `label-189.ts`: `CONFIRM` is now exported so `improve.ts` can strip the suffix.

## Tests

`src/lib/outlook/improve.test.ts` has 32 tests on the real snapshot, using the same rules wiring as `evaluate-profile.test.ts`. They cover every brief expectation:

- Priya: Superior English is best, 70 Competitive to 80 Very strong. NAATI gives 75 Strong; combined gives 85 Very strong. Losses: 2027-03-14 70 to 65 Long wait, then 2028-02-02 eligibility to Not eligible.
- Aarav: protect mode with the banner. Losses: 2027-08-09 90 to 85, both Very strong; then 2028-02-02 85 to 65 Not eligible.
- Arjun: Superior English is best, 60 Not eligible to 80 Very strong. Proficient gives 70 Competitive; NAATI gives 65 Long wait. The combined move never pairs two English moves. Loss: 2027-09-09 eligibility.
- Meera: NAATI and experience each give 80 Long wait to 85 Competitive, with `date: null`. Combined gives 90 Strong and is best. Loss: 2028-01-10 eligibility.
- Rahul: points-not-problem with the banner. Professional Year goes from 85 to 90 and stays Not invited, and its why names it. Exactly one move is best. Loss: 2027-06-05 eligibility.
- Dev: the combined not-invited banner.
- Kavya: Superior English is best, 70 to 80 Very strong. Partner skills gives 75 Strong. Loss: 2028-03-12 EOI expiry, 70 Competitive unchanged.
- Sana (no core): plain mode with "Superior English, +10. Takes you to 85." and "NAATI CCL test, +5. Takes you to 80."
- Every scenario's copy is checked against the banned-phrase list, and every loss date is checked to fall within 2 years of asOf.

TDD evidence:

- RED: `npx vitest run src/lib/outlook/improve.test.ts` failed with "Failed to resolve import ./improve" (Test Files 1 failed, no tests ran).
- GREEN: `npx vitest run src/lib/outlook/improve.test.ts` passed: Test Files 1 passed (1), Tests 32 passed (32).
- `npm run check` passed: format, lint and typecheck were clean, and vitest ran 92 files and 985 tests, all passing.

## Data-vs-brief differences (R2)

- **Priya** has a third loss that the brief does not list. Her skills assessment expires on 2028-06-10, which is inside the 2 years. It is asserted as `eligibility`, not-eligible to not-eligible. Her English-expiry card also has concrete points: 65 to 55.
- **Rahul** has three moves, not only Professional Year. Their order is NAATI, Professional Year, then 8 years' overseas experience, and all go 85 to 90 Not invited. Combined (NAATI + PY) is 95 Not invited. NAATI is `best` because of the lead-time tie-break. The test asserts that exactly one move is best, not which one.
- **Sana with a core.** `loadOccupationCore("362311")` returns a core, and with it the stamp is not combined no-data, so the mode is `improve`. The product never fetches `hasData: false` occupations, so the plain-mode test runs with `core: null`, as `evaluate-profile.test.ts` does.

## Interpretation choices worth reviewing

1. **Professional Year.** `buildScenarios` has no Professional Year scenario, so "only when the occupation already offers it in buildScenarios" could not be followed literally. The move instead relies on `calculatePoints`'s own occupation check: a Professional Year that adds no points is dropped.
2. **`buildScenarios` is not called.** Its offer conditions are all "points could rise", and the points-gain filter does the same job. `applyScenarios` is reused for English, NAATI and the experience bands.
3. **The 45th birthday is treated as an eligibility loss** (not-eligible), consistent with `calculatePoints`. No scenario covers it.
4. **"Shortest time" uses a fixed lead-time order**, because the profile has no dates to compute it from. `date` is always null today.
5. **Lodged readers' move details get an extra sentence:** "Updating your EOI with new points resets your date of effect to that day." This follows the mockup's Kavya card.

## Concerns

- `improve.ts` is 337 lines, over the 300-line limit for `src/lib` modules. The obvious split is to move the dated-loss half (`NAMED_LOSSES`, `describeLoss`, `buildLosses`, about 65 lines) to `src/lib/outlook/losses.ts`. I did not split it, per the implementer instructions. Controller to decide.

## Files changed

- `src/lib/outlook/improve.ts` (new)
- `src/lib/outlook/improve.test.ts` (new)
- `src/lib/outlook/label-189.ts` (`CONFIRM` exported)

## Fix report (review round 1)

Commit: `8c07123 refactor(outlook): split dated losses and mark no best when 189 is closed`

### Changes

1. **R11.** `buildMoves(input, base, markBest)` now takes a flag. `buildImprove` passes `mode === "improve"`, so in `points-not-problem` mode (Rahul and Dev) no move is `best`. That includes the combined move. The Rahul test now asserts `bestIds(improve)` equals `[]`.
2. **R12.** `NAMED_LOSSES`, `describeLoss`, `buildLosses` and `LOSS_YEARS` now live in the new `src/lib/outlook/losses.ts` (89 lines). That file also defines `Shift`, `Loss` and the new `LossStart` type.
   - `buildLosses(profile, asOf, core, start)` takes its starting position explicitly, so it no longer depends on `evaluate-profile`.
   - `improve.ts` re-exports `Loss` and `Shift` (`export type { Loss, Shift } from "./losses"`), so the public `buildImprove` API is unchanged.
   - `improve.ts` is now 280 lines, under the 300-line limit.
   - The scenario loss assertions stay in `improve.test.ts`, because they test the losses through `buildImprove`'s base position.
3. **New unit tests** in `src/lib/outlook/losses.test.ts`:
   - A 45th birthday on 2027-05-01 (dob 1982-05-01, asOf 2026-11-21) is an `eligibility` loss with the title "Your 45th birthday, 1 May 2027", going from 80 Very strong to 65 Not eligible.
   - The same birthday from asOf 2024-11-21 is more than 2 years away, so it is left out.
   - A visa expiry, which changes no points, is skipped.
4. **Cast removed.** `buildMoves` now sorts `{ candidate, move }` pairs and reads the first and second candidates from them. The `scored.find(...) as Scored` cast is gone.

### Tests

- `npx vitest run src/lib/outlook/improve.test.ts src/lib/outlook/losses.test.ts`: Test Files 2 passed (2), Tests 35 passed (35).
- `npm run check`: exit 0 (format, lint, typecheck and tests all pass), Test Files 93 passed (93), Tests 988 passed (988).

### Note on the first report

The first report said Rahul's NAATI move was `best` because of the lead-time tie-break. Under R11 it is no longer marked, so none of Rahul's moves are best.
