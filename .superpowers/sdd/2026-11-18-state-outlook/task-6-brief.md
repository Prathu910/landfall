### Task 6: Profile fields for state questions

**Files:**

- Modify: `src/lib/migration.ts` (the `Profile` type and `emptyProfile`), plus the `isProfile` restore guard in `src/components/check-flow.tsx` (or wherever it lives)
- Test: `src/lib/migration.test.ts` (or a new `profile.test.ts`)

**New optional fields.** All may be absent (unanswered):

```ts
monthsLivingInState?: number | null;
monthsWorkingInState?: number | null; // in the nominated occupation, in the state they live in
monthsLivingOffshore?: number | null;
yearsExperienceLast3?: number | null;
yearsExperienceLast5?: number | null;
jobOfferState?: StateCode | "none" | null;
livesRegional?: boolean | null;
studyState?: StateCode | "none" | null;
incomeBand?: "under-60k" | "60-90k" | "90-130k" | "over-130k" | null; // stored, unused (future VPT)
```

- [ ] **Step 1: Write failing tests.**
  - A profile saved before this change (without the fields) still restores, with every new field treated as unanswered.
  - Out-of-range values are rejected or clamped, e.g. negative months or more than 600.
- [ ] **Steps 2–4:** RED, implement, `npm run check && npm run build`.
- [ ] **Step 5: Commit** `feat(profile): add optional state-outlook questions`

