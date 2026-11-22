### Task 2: 189 label

**Files:**

- Create: `src/lib/outlook/label-189.ts`, `src/lib/outlook/__fixtures__/scenarios.ts`
- Test: `src/lib/outlook/label-189.test.ts`

**Interfaces:**

- Consumes: `OutlookLabel` (Task 1); `OccupationCore`, `Interval` (`src/lib/data/types.ts`); `parseCountText`, `sumIntervals` (`src/lib/data/published-count.ts`); `loadOccupationCore` (`src/lib/data/load-server.ts`, tests only).
- Produces:

  ```ts
  export type Label189 = {
    label: OutlookLabel;
    tooFew: boolean;
    lastThree: number[]; // cut-offs of the last 3 listed rounds, newest first
    ahead: Interval | null; // EOIs with a higher score; null when no pool
    tied: Interval | null;
    why: string; // e.g. "70 meets the lowest of your occupation's last 3 listed cut-offs (70) but not the other two (75, 75)."
  };
  export function higherScoreCount(
    core: OccupationCore,
    visa: Visa,
    points: number,
  ): Interval | null;
  export function label189(input: {
    points: number;
    eligible: boolean | null;
    core: OccupationCore | null;
  }): Label189;
  ```

  `__fixtures__/scenarios.ts` exports `SCENARIOS: Record<ScenarioId, Profile>` and `ScenarioId = "strong" | "middle" | "long" | "notinv" | "below" | "nodata" | "none" | "lodged"`, plus `ENDOCRINOLOGIST: Profile`. Profiles (all `onshore: false` unless stated, `qualification` and years as listed; copy dates exactly):
  - strong: `{ ...sampleReportProfile, eoiDate: "" }` from `src/lib/sample.ts` (Aarav, 90, onshore NSW, planner).
  - middle: Priya, dob 1994-03-14, 254499, proficient 2025-02-02, bachelor, overseas 4, single, assessment expiry 2028-06-10 (70).
  - long: Meera, dob 1998-05-02, 241111, superior 2025-01-10, bachelor, overseas 4, single (80).
  - notinv: Rahul, dob 1996-01-18, 261313, superior 2024-06-05, bachelor, overseas 6, single (85).
  - below: Arjun, dob 1996-07-22, 254499, competent 2024-09-09, bachelor, overseas 3, single (60).
  - nodata: Sana, dob 1997-04-12, 362311, proficient 2026-01-30, trade, overseas 8, single (75).
  - none: Dev, dob 1991-09-09, 221214, proficient 2024-08-01, bachelor, overseas 9, partner "english", community language true (75).
  - lodged: Kavya, dob 1992-06-25, 254499, proficient 2026-01-04, bachelor, overseas 6, partner "english", community language true, eoiDate 2026-03-12 (70).
  - ENDOCRINOLOGIST: dob 1988-02-03, 253315, superior 2025-11-11, bachelor, overseas 9, partner "english" (80).

- [ ] **Step 1: Write the failing tests**: each fixture's `calculatePoints(p, "2026-11-21").base` equals the number in brackets above. With real cores: nurse at 90 → `very-strong` (lastThree `[70,75,75]`, ahead `{min:0,max:0}`); nurse 75 → `strong`; nurse 70 → `competitive` with the exact why string above; teacher 241111 at 80 → `long-wait` (lastThree `[90,85,85]`, ahead `{min:2444,max:2463}`); software engineer 261313 at 85 → `not-invited`; internal auditor 221214 at 75 → `not-invited`; nurse at 60 → `not-eligible`; `eligible: false` at 90 → `not-eligible`; `core: null` → `no-data`; endocrinologist core at 80 → `competitive` with `ahead: null`; a synthetic core whose every count is "<20" and no listing → `no-data` with `tooFew: true`; a synthetic core where ahead is `"<20"` and points > max(L3) → `very-strong` (max 19 ≤ 19); `eligible: null` keeps the computed label and the why ends with "Confirm your English and skills assessment dates." (Review Focus 4).
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/label-189.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** in the spec 6.2 order. "Last 4 rounds" are `core.rounds189.slice(0, 4)`; L3 are the first three non-null cut-offs.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): 189 label from rounds and pool`.

