### Task 8: Chart data

**Files:**

- Create: `src/lib/outlook/charts.ts`
- Test: `src/lib/outlook/charts.test.ts`

**Interfaces:**

- Consumes: Tasks 2, 5; `formatMonth`, `formatCount` (`src/lib/report/copy.ts`).
- Produces:

  ```ts
  export type CutoffColumn = { month: string; cutoff: number | null }; // "Oct 26"; oldest first
  export type CutoffColumns = {
    columns: CutoffColumn[];
    you: number;
    target: { points: number; label: string } | null;
    pass: 65 | null;
    aria: string;
  };
  export function cutoffColumns(
    core: OccupationCore | null,
    points: number,
    improve: Improve,
  ): CutoffColumns | null;
  export type QueueGroup = {
    key:
      | "ahead"
      | "tied"
      | "behind"
      | "you"
      | "higher"
      | "earlier"
      | "month"
      | "later";
    label: string;
    squares: number;
    emphasis: boolean;
  };
  export type QueueView = {
    kind: "pool" | "lodged";
    unit: 10 | 40 | 50 | 100;
    title: string;
    groups: QueueGroup[];
    aria: string;
  };
  export function queueView(
    core: OccupationCore | null,
    detail: OccupationDetail | null,
    points: number,
    eoiDate: string,
    stampedClosed: boolean,
  ): QueueView | null;
  ```

  Target = the best move's points and "With {move short name}, {points}". `pass = 65` only when points < 65. Unit = smallest of 10/40/50/100 giving ≤ 200 squares; squares round to nearest, minimum 1 for a non-zero group. Title "A queue that isn't moving" when `stampedClosed` (189 not-invited), "Your place at {points}" for lodged, else "Who's in the queue". Labels use ranges ("Ahead: 107–126") and "about" for derived behind counts.

- [ ] **Step 1: Write the failing tests**: Priya columns (oldest first) Sep 24 75, Nov 24 70, Aug 25 80, Nov 25 75, Jun 26 75, Oct 26 70, target 80; Rahul columns end with four `null`; Arjun `pass: 65`; core null → null. Queue: Priya unit 40 squares [3, 46, 58]; Aarav groups ahead 0, tied 0, you 1, behind 107; Meera unit 100; Kavya kind `lodged` groups higher/earlier/month/later; Rahul title "A queue that isn't moving".
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/charts.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): cut-off columns and queue squares data`.

