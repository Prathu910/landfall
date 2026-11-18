### Task 5: 190/491 panel view-model

**Files:**

- Create: `src/lib/report/panel-nominated.ts`
- Test: `src/lib/report/panel-nominated.test.ts`

**Interfaces:**

```ts
export type InvitationRow = { month: MonthKey; label: string; text: string }; // "at least 330 invited (as at Oct 2026)" | "under 20, so may be zero (as at Sep 2026)" | "none recorded (as at Aug 2026)" | "not published (as at Jul 2026)"
export type NominatedPanel = {
  visa: StateVisa;
  heading: string; // "Where you stand in the national 190 pool"
  whereYouStand: WhereYouStand; // from Task 3 at score = subclass190 / subclass491
  nationalNote: string; // "This is the national pool. States select by their own rules."
  invitations: InvitationRow[]; // last 12 calendar months back from core.asAt, newest first, never summed
  statesLink: { href: "#states"; text: string }; // "See how each state selects"
};
export function buildNominatedPanel(
  core: OccupationCore,
  visa: StateVisa,
  score: number,
): NominatedPanel;
```

- [ ] **Step 1: Write failing tests.**
  - 12 rows, newest first.
  - A covered month with no rows gives "none recorded (as at …)".
  - An uncovered month gives "not published (as at …)".
  - A month at "<20" gives "under 20, so may be zero (as at …)".
  - **Review Focus 1:** with an all-masked fixture, no row says "at least" with a positive number.
  - No output matches `BANNED_COPY`.
- [ ] **Step 2: Run** the test. Expect FAIL.
- [ ] **Step 3: Implement.** Reuse `invitationActivity` and `buildWhereYouStand`.
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): add 190 and 491 panel view-models`

