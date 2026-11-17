### Task 3: Pool position and cohort accessors

**Files:**

- Create: `src/lib/data/pool-position.ts`, `src/lib/data/cohorts.ts`
- Test: `src/lib/data/pool-position.test.ts`, `src/lib/data/cohorts.test.ts`
- Create fixture: `src/lib/data/__fixtures__/occupation.ts`, which exports `coreFixture: OccupationCore` and `detailFixture: OccupationDetail`. Keep them small and hand-written; Tasks 4 and 10 reuse them.

**Interfaces:**

- Consumes: Tasks 1–2.
- Produces:

```ts
export type PoolPosition =
  | { available: false; reason: "no-eois-for-visa" }
  | {
      available: true;
      asAt: MonthKey;
      score: number; // normalised to the 5-point band
      higher: Interval;
      same: Interval;
      total: Interval;
      sameSubmitted?: {
        before: Interval;
        sameMonth: Interval;
        after: Interval;
        approximate: true;
      };
    };
export function poolPosition(
  core: OccupationCore,
  detail: OccupationDetail | null,
  visa: Visa,
  score: number,
  submittedMonth: MonthKey | null,
): PoolPosition;

export type CohortOutcome = {
  submittedMonth: MonthKey | "older";
  counts: Record<EoiStatus, Interval>;
};
export function cohortOutcomes(
  detail: OccupationDetail,
  visa: Visa,
  submittedMonth: MonthKey,
): CohortOutcome | undefined;
```

`sameSubmitted` is present only when `detail` and `submittedMonth` are given. The `"older"` bucket counts as `before`. The user's own month goes in `sameMonth`, never in `before` or `after`.

- [ ] **Step 1: Failing tests.**
  - `poolPosition` at score 90 against byScore `{"85":"100","90":"<20","95":"50"}` gives `higher` `{50,50}`, `same` `{0,19}` and `total` `{150,169}`.
  - Score 47 normalises to 45.
  - Score 135, with no rows above, gives `higher` `{0,0}`.
  - A visa missing from `core.pool` returns `{available:false, reason:"no-eois-for-visa"}`.
  - The same-score split for submitted month `2025-03` (cohortsByScore `"90"`: `{"older":"30","2025-02":"<20","2025-03":"25","2025-04":"40"}`) gives `before` `{30,49}`, `sameMonth` `{25,25}` and `after` `{40,40}`.
  - `cohortOutcomes` returns all five statuses, with absent statuses as `{0,0}`, and returns `undefined` for an unknown month.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/pool-position.test.ts src/lib/data/cohorts.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** using `normalizePoolScore` from `src/lib/pool.ts` and the Task 1 helpers.
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(data): add pool position and cohort outcome accessors`

