# Task 3 report: State and visa labels

Status: DONE
Commit: 15b19b5 feat(outlook): state evidence labels and visa labels

## What I implemented

`src/lib/outlook/label-state.ts` (178 lines), with the interfaces exactly as the brief gives them (`StateFlag`, `StateLabel`, `VisaLabel`, `evidenceLabel`, `visaLabel`).

- **Windows.** `calendarMonths(core.asAt, 6)` and `(…, 3)`, split with `splitCoverage`. Only fetched months count: `{}` is a published zero, and a missing key is left out. The reader's points go through `normalizePoolScore`, as `stateEvidence` does.
- **Ladder (spec 6.3 order):**
  1. no-data: no fetched month in the last 6.
  2. strong: at-or-below mins over the last 3 months are at least 20, and the cautious half holds (`atOrBelow.min * 2 >= total.max`).
  3. competitive: at-or-below min > 0 in the last 3, or masked at-or-below in at least 2 of the last 3.
  4. long-wait: any invitation in the last 6, at or above the reader's points.
  5. not-invited: otherwise.
- **Fields.** `confirmedAtOrBelow` is the sum of at-or-below mins over the last 3 months. `monthsAtOrBelow6` counts months in the last 6 with at-or-below `max > 0`. `latest` is the latest such month with its at-or-below interval.
- **Group mapping.**
  - `not-open` gets label `not-open` with no flag. Its evidence numbers are still filled in.
  - `unverified` keeps the evidence label and gets the flag `rules-being-checked`.
  - `needs-answers` keeps the evidence label and gets the flag `needs-answers`.
  - `strongest` and `watching` keep the evidence label with no flag.
- **Best state and order.** States are sorted in this order:
  1. Not-open states last. They can never be the best route, even though "not open" outranks "not invited" in `LABEL_RANK`.
  2. Label rank.
  3. States without a flag before flagged ones.
  4. `confirmedAtOrBelow`, highest first.
  5. `monthsAtOrBelow6`, highest first.
  6. State code.

  `best` is the first state that is open, or null. The visa label is `best.label`, or `not-open` when every state is not open. `ANY` never takes part: the outlook holds only the eight states, and `evidenceLabel` reads only the named state (a test covers this).

## Tests (`src/lib/outlook/label-state.test.ts`, 22 tests)

- **Ladder (synthetic, asAt 2026-10):**
  - 20 confirmed with half at or below gives strong.
  - 20 confirmed but under half (cautious) gives competitive.
  - 19 confirmed gives competitive.
  - Masked in 2 of the last 3 gives competitive.
  - Masked in 1 of the last 3 but 3 of the last 6 gives long-wait.
  - Invitations only above the reader's points give long-wait.
  - Nothing in 6 months gives not-invited, including when an invitation 7 months back sits outside the window.
  - No fetched months gives no-data (no key, only old keys, no state record).
  - Unfetched months are left out, not counted as zero.
  - Invitations to "any state" are ignored.
- **visaLabel (synthetic outlooks):** group mapping and flags; label rank before flag; unflagged before flagged; confirmed, then months; code tie-break; a not-open state is never best, even over not-invited; all states not open gives `not-open` with `best` null.
- **Real snapshot** (rules asOf 2026-11-18, points from `calculatePoints` at 2026-11-21, `ELIGIBLE`, `realLists`/`realFederal`/`stateRules`):

  | Reader | Visa and points | Label | Best state |
  |---|---|---|---|
  | Meera | 190 at 85 | competitive | TAS, flag rules-being-checked |
  | Rahul | 190 at 90 | competitive | NT |
  | Rahul | 491 at 100 | competitive | NT |
  | Arjun | 190 at 65 | competitive | TAS |
  | Arjun | 491 at 75 | long-wait | not asserted |
  | Dev | 190 at 80 | not-invited | not asserted |
  | Dev | 491 at 90 | not-invited | not asserted |
  | Aarav | 190 at 95 | strong | NSW (recorded, not asserted) |

  Aarav's best 190 state is **NSW**, the same as the mockup. I asserted only the label, as the brief asks. To pin the state, add `best: "NSW"`.

## TDD evidence

- RED: `npx vitest run src/lib/outlook/label-state.test.ts` failed with "Failed to resolve import ./label-state" (Test Files 1 failed, no tests).
- GREEN: the same command gave `Tests 22 passed (22)` before and after the readability edit.
- `npm run check`: format, lint and typecheck clean, `Test Files 88 passed (88)`, `Tests 918 passed (918)`.

## Real-data probe (all scenarios, for later tasks)

The table shows the visa label and best state. `(rbc)` means the flag is rules-being-checked.

| Reader | 190 | 491 |
|---|---|---|
| Aarav | 95: strong, NSW. VIC and WA are also strong but flagged. QLD and SA are not open. | 105: strong, VIC (rbc) |
| Meera | 85: competitive, TAS (rbc). TAS beats NT on months, 6 to 4. | 95: competitive, WA, no flag |
| Rahul | 90: competitive, NT (rbc) | 100: competitive, NT (rbc) |
| Arjun | 65: competitive, TAS (rbc) | 75: long-wait, SA (rbc). SA ties TAS and wins on code. |
| Dev | 80: not-invited, ACT (rbc). NSW, QLD and SA are not open. | 90: same as 190 |
| Priya and Kavya | 75: competitive, VIC (rbc). SA has 20 confirmed but fails the half test, so it is competitive. | 85: competitive, NT (rbc) |

## Files

- Added: `src/lib/outlook/label-state.ts`
- Added: `src/lib/outlook/label-state.test.ts`

## Self-review

- Requirements are covered. The module is pure, with relative imports, no `any`, and one statement per line except the guard-clause returns, which match `label-189.ts`.
- `sumScores` is a small duplicate of the private helper in `src/lib/data/state-evidence.ts`. I did not reuse `StateSide`, because it has no total per month, which the half test needs, and its window is 12 months. If the reviewer wants the helper shared, it could be exported from `state-evidence.ts`.
- When Dev's visa is not-invited, `best` is still a state (ACT, flagged), because a not-invited state is open. This follows "visa label = best state's label". Later tasks should not name a "best route" for a not-invited visa unless the spec asks for it.
- Not-open states are sorted last in `states`, not by `LABEL_RANK`. This is deliberate and commented in the code.

## Concerns and data-vs-brief differences

None. Every expected real-data value in the brief matched the snapshot.
