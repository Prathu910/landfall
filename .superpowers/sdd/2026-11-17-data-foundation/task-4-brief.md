### Task 4: Invitation, state and similar-profile accessors

**Files:**

- Create: `src/lib/data/invitations.ts`, `src/lib/data/state-evidence.ts`, `src/lib/data/similar-profile.ts`
- Test: one `*.test.ts` per file, using the Task 3 fixtures (extend them as needed).

**Interfaces:**

```ts
export type MonthlyInvited = { asAt: MonthKey; invitedAtLeast: Interval }; // lower bound: INVITED stock at that snapshot
export type InvitationActivity = {
  months: MonthlyInvited[]; // ascending
  lastConfirmedMonth: MonthKey | null; // latest month with invitedAtLeast.min > 0
  lastPossibleMonth: MonthKey | null; // latest month with invitedAtLeast.max > 0
  scoreRange: { min: number; max: number } | null; // scores with a positive (min > 0) INVITED count, latest 12 months
};
export function invitationActivity(
  core: OccupationCore,
  visa: Visa,
): InvitationActivity;

export type StateSide = {
  competitorsAtOrAbove: Interval; // statePool, latest
  invitedAtOrBelow: MonthlyInvited[]; // per month, latest `months` months, ascending
  peak: MonthlyInvited | null; // the month with the highest invitedAtLeast.min; never a sum
  scoreRange: { min: number; max: number } | null;
};
export function stateEvidence(
  core: OccupationCore,
  visa: StateVisa,
  state: StateCode,
  score: number,
  months?: number /* default 12 */,
): { state: StateSide; anyState: StateSide };

export function similarProfileInvited(
  detail: OccupationDetail,
  visa: Visa,
  attribute: ProfileAttribute,
  value: string,
  scope:
    | { kind: "national"; months?: number }
    | { kind: "state"; visa: StateVisa; state: StateKey },
): { perMonth?: MonthlyInvited[]; latest?: Interval } | undefined;
```

- [ ] **Step 1: Failing tests.**
  - `invitationActivity` with monthly INVITED `{"2026-05":"82","2026-06":"905","2026-07":"<20"}` gives months in order, `lastConfirmedMonth` `"2026-06"` and `lastPossibleMonth` `"2026-07"`.
  - **Review Focus 1:** `stateEvidence` for VIC, where two months each have `"50"` at or below the score, returns `peak.invitedAtLeast` `{50,50}`, and no field equals 100.
  - `anyState` is computed from `ANY` rows only. `state.competitorsAtOrAbove` excludes `ANY`.
  - `similarProfileInvited` returns `undefined` when the attribute wasn't imported.
- [ ] **Step 2: Run** these tests. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(data): add invitation, state and similar-profile accessors`

