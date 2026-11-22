### Task 6: How to improve and protect

**Files:**

- Create: `src/lib/outlook/improve.ts`
- Test: `src/lib/outlook/improve.test.ts`

**Interfaces:**

- Consumes: `evaluateProfile` (Task 4); `buildTimeline`, `TimelineEvent`, `calculatePoints` (`src/lib/migration.ts`).
- Produces:

  ```ts
  export type Shift = { points: number; label: OutlookLabel };
  export type Move = {
    id:
      | "english-proficient"
      | "english-superior"
      | "naati"
      | "professional-year"
      | "partner-skills"
      | "experience"
      | "combined";
    title: string;
    detail: string;
    why: string;
    from: Shift;
    to: Shift;
    visa: Visa;
    best: boolean;
    date: string | null;
  };
  export type Loss = {
    date: string;
    title: string;
    detail: string;
    from: Shift;
    to: Shift;
    kind: "points" | "eligibility" | "eoi-expiry";
  };
  export type Improve = {
    mode: "improve" | "protect" | "points-not-problem" | "plain";
    banner: string | null;
    moves: Move[];
    losses: Loss[];
    plain: string[];
  };
  export function buildImprove(
    input: OutlookInput,
    base: ProfileOutlook,
  ): Improve;
  ```

  Candidate moves apply to a copy of the profile: English proficient/superior (`englishDate = asOf`), NAATI (`communityLanguage = true`), Professional Year (only when the occupation already offers it in `buildScenarios`), partner skills (`partner: "skilled"` when current is `"english"`), next experience band (with the date it is reached), and "combined" for the top two when they stack. Each move re-runs `evaluateProfile` and reports the shift for 189, unless 189 is `not-invited`, then for 189 still (showing it stays `not-invited`) with mode `points-not-problem`. Best = highest `to.label`, then most points, then shortest time; exactly one `best`. Losses: timeline `loss`/`expiry` events within 2 years of `asOf`, applied cumulatively in date order; English or skills-assessment expiry → `kind: "eligibility"`, `to.label: "not-eligible"`; EOI expiry → `kind: "eoi-expiry"`. Mode `protect` when base 189 is `very-strong` (moves empty); `plain` when the stamp is combined `no-data` (plain lines list available points without labels); banner text per spec 6.7.

- [ ] **Step 1: Write the failing tests**: Priya → best `english-superior` 70 competitive → 80 very-strong; `naati` → 75 strong; `combined` → 85 very-strong; losses 2027-03-14 70 → 65 long-wait (`points`), then 2028-02-02 English expiry `eligibility` → `not-eligible`. Aarav → mode `protect`, losses: 2027-08-09 90 VS → 85 VS, then 2028-02-02 85 → 65 `eligibility` `not-eligible`. Arjun → `english-superior` 60 not-eligible → 80 very-strong best; `english-proficient` → 70 competitive; `naati` → 65 long-wait; loss 2027-09-09 English expiry `eligibility`. Meera → `naati` 80 → 85 competitive; `experience` (next overseas band, `date: null` because the profile holds years, not dates) 80 → 85 competitive; `combined` → 90 strong best; loss 2028-01-10 English expiry `eligibility`. Rahul → mode `points-not-problem`, Professional Year move stays `not-invited`, loss English expiry 2027-06-05 `eligibility`. Kavya → `english-superior` 70 → 80 very-strong best; `partner-skills` 70 → 75 strong; loss EOI expiry 2028-03-12 `eoi-expiry`. Sana → mode `plain`.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/improve.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): how to improve, protect and dated losses`.

