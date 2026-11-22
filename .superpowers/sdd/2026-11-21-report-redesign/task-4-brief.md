### Task 4: Evaluate a profile and choose the stamp

**Files:**

- Create: `src/lib/outlook/stamp.ts`, `src/lib/outlook/evaluate-profile.ts`
- Test: `src/lib/outlook/stamp.test.ts`, `src/lib/outlook/evaluate-profile.test.ts`

**Interfaces:**

- Consumes: Tasks 1–3; `calculatePoints`; `stateOutlook`.
- Produces:

  ```ts
  export type Stamp =
    | {
        kind: "single";
        visa: Visa;
        state: StateCode | null;
        label: OutlookLabel;
        points: number;
        tooFew: boolean;
      }
    | { kind: "combined"; label: OutlookLabel; tooFew: boolean };
  export function chooseStamp(
    v189: Label189,
    v190: VisaLabel | null,
    v491: VisaLabel | null,
    points: { base: number; s190: number; s491: number },
  ): Stamp;
  export type OutlookInput = {
    profile: Profile;
    asOf: string;
    core: OccupationCore | null;
    detail: OccupationDetail | null;
    rules: StateRuleData;
  };
  export type ProfileOutlook = {
    points: PointsResult;
    v189: Label189;
    v190: VisaLabel | null;
    v491: VisaLabel | null;
    stamp: Stamp;
    listMembership: {
      federal190: boolean;
      federal491: boolean;
      states: StateCode[];
    };
  };
  export function evaluateProfile(input: OutlookInput): ProfileOutlook;
  ```

  Stamp rule (spec 6.4): best label among the three, ties 189 → 190 → 491; if the best is below `competitive`, `combined` with the best of the three. `core === null` → v190/v491 null, both treated as `no-data`. List membership reads `rules.lists` and `rules.federal` by occupation code (works without a core).

- [ ] **Step 1: Write the failing tests**: `chooseStamp` unit cases (189 VS beats 190 strong; 189 long-wait with 190 competitive → single 190; all ≤ long-wait → combined with the best; tie competitive 189 vs 190 → 189). `evaluateProfile` for every scenario fixture (asOf 2026-11-21) gives: strong → single 189 `very-strong`; middle → single 189 `competitive`; long → single 190 TAS `competitive`; notinv → single 190 NT `competitive`; below → single 190 TAS `competitive`; nodata (core null) → combined `no-data`, list membership federal 190/491 true, states `["WA"]`; none → combined `not-invited`; lodged → single 189 `competitive`.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/stamp.test.ts src/lib/outlook/evaluate-profile.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** both files.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): evaluate a profile and choose the stamp`.

