### Task 5: Estimated wait and lodged pace

**Files:**

- Create: `src/lib/outlook/wait.ts`
- Test: `src/lib/outlook/wait.test.ts`

**Interfaces:**

- Consumes: Tasks 1–4; `submissionMonth` (`src/lib/report/copy.ts`); `STATE_NAMES`.
- Produces:

  ```ts
  export type LodgedPace = {
    ahead: Interval;
    pace: Interval;
    roundsPerYear: number;
    roundsNeeded: { min: number; max: number };
  };
  export function lodgedPace(
    core: OccupationCore,
    detail: OccupationDetail,
    points: number,
    eoiDate: string,
  ): LodgedPace | null;
  export function estimatedWait(
    o: ProfileOutlook,
    input: OutlookInput,
  ): { text: string; pace: LodgedPace | null };
  ```

  Texts are the spec 6.5 table, verbatim. Lodged applies when `eoiDate` is valid, its month ≤ `core.asAt`, the stamp is 189, the 189 label is strong or competitive, and `detail` is present. Years = rounds ÷ rounds per year, rounded outward to whole years ("plan for 1 to 2 years"); if pace max is 0 or masked: "No recent invitations at your score to measure a pace."

- [ ] **Step 1: Write the failing tests**: Aarav → "The next 189 round."; nurse 75 → "The next 1 to 2 rounds."; Priya → "Uncertain. Possible in a round that goes down to 70, like Oct 2026."; Kavya → pace ahead {871..966} (higher {107..126} + SUBMITTED at 70 from months before Mar 2026 {764..840}), pace {262..262}, rounds per year 2, rounds needed {3..4}, text "Roughly 870 to 970 EOIs ahead. At the latest pace, about 3 to 4 rounds, so plan for 1 to 2 years at 70 (estimate)."; Meera (TAS stamp) → "States don't publish a queue. Tasmania invited at or below your points in 3 of the last 6 months."; Rahul → NT text; Dev → "No 189 invitations to measure."; Sana → "We can't estimate one without data."; Arjun → TAS text. Review Focus 3: Kavya with `detail: null` → planner text, `pace: null`. Review Focus 5: Kavya with `eoiDate: "2026-12-01"` → planner text, `pace: null`.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/wait.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Rounds per year = rounds in `rounds189` dated within 12 months before `asOf`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): estimated wait and lodged pace`.

