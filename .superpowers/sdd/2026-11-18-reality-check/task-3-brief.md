### Task 3: 189 panel view-model, part 1 (where you stand, same score, rounds)

**Files:**

- Create: `src/lib/report/panel-189.ts`
- Test: `src/lib/report/panel-189.test.ts`

**Interfaces:**

```ts
export type QueueSegments = {
  ahead: Interval;
  same: Interval;
  lower: Interval;
  total: Interval;
}; // lower = total − ahead − same, interval-safe, clamped ≥ 0
export type WhereYouStand =
  { segments: QueueSegments; sentence: string } | { unavailable: string };
// sentence: "{ahead} EOIs have a higher score. {same} share your {score} points. The pool holds {total} EOIs as at {Mon YYYY}."
export type SameScore =
  | { kind: "split"; sentence: string; note: string }
  | { kind: "prompt"; text: string }
  | { kind: "loading" };
// split sentence: "About {before} were submitted before {Mon YYYY}, {sameMonth} in the same month and {after} after."
// note: "Approximate: ties are broken by date of effect, which isn't published and can differ from the submission month."
// prompt (no EOI date, or EOI date after asOf): "Add your EOI date to see how many same-score EOIs were submitted before yours."
export type RoundTile = {
  date: string;
  label: string;
  value: string;
  listed: boolean;
}; // value "95 pts" | "Not listed"; label "15 Oct 2026"
export type RoundsBlock = {
  tiles: RoundTile[]; // first 6
  all: RoundTile[]; // every parsed round
  skippedNote: string | null; // "{n} older rounds use a different table layout and are not shown." from rounds-meta skipped list
  note: string; // "“Not listed” means the official results didn't include this occupation. It is not a cut-off of zero."
};
export function buildWhereYouStand(
  core: OccupationCore,
  score: number,
): WhereYouStand;
export function buildSameScore(
  core: OccupationCore,
  detail: OccupationDetail | null,
  score: number,
  submittedMonth: MonthKey | null,
  asOf: string,
): SameScore;
export function buildRounds(
  core: OccupationCore,
  skippedRounds: { date: string }[],
): RoundsBlock;
```

- **Unavailable 189 pool:** `{ unavailable: "No 189 EOIs are published for this occupation in this snapshot." }`
- **`SameScore`:** returns `loading` when `detail` is null and a submitted month exists.

- [ ] **Step 1: Write failing tests:**
  - Segments for the Task 2 fixture at 90: ahead {872,891}, same {1132,1132}, lower {7441,7460}, total {9464,9464}.
  - The sentence uses "872–891", "1,132" and "9,464".
  - The split using step 1's `detailFixture` cohortsByScore ("90": older 30, 2025-02 "<20", 2025-03 25, 2025-04 40; submitted month 2025-03) produces "About 30–49 were submitted before Mar 2025, 25 in the same month and 40 after."
  - **Review Focus 2:** an `eoiDate` after `asOf` gives the prompt.
  - Rounds:
    - tiles are capped at 6;
    - a null cut-off gives "Not listed" with `listed false`;
    - `skippedNote` is null when the list is empty;
    - with 8 skipped rounds, the note starts "8 older rounds".
- [ ] **Step 2: Run** `npx vitest run src/lib/report/panel-189.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.** Reuse `poolPosition` and `formatCount`, and `formatDate` from `src/lib/migration.ts`.
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): add 189 position, same-score and rounds view-models`

