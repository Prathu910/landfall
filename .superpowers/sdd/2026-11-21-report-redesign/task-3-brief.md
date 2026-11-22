### Task 3: State and visa labels

**Files:**

- Create: `src/lib/outlook/label-state.ts`
- Test: `src/lib/outlook/label-state.test.ts`

**Interfaces:**

- Consumes: Task 1; `stateOutlook`, `Outlook`, `StateOutcome`, `Group` (`src/lib/state-outlook/outlook.ts`); `calendarMonths`; `parseCountText`; `StateRuleData` (`src/lib/report/state-outlook-view.ts`); real-data fixtures `realLists`, `realFederal` (`src/lib/state-outlook/__fixtures__/real-data`) and `stateRules` (`src/data/state-rules/2026-27/index`) in tests.
- Produces:

  ```ts
  export type StateFlag = "rules-being-checked" | "needs-answers" | null;
  export type StateLabel = {
    state: StateCode;
    visa: StateVisa;
    label: OutlookLabel;
    flag: StateFlag;
    confirmedAtOrBelow: number; // sum of mins, last 3 months
    monthsAtOrBelow6: number; // months with any invitation at/below, last 6
    latest: { month: MonthKey; count: Interval } | null; // latest month with invitations at/below
  };
  export type VisaLabel = {
    visa: StateVisa;
    points: number;
    label: OutlookLabel;
    best: StateLabel | null;
    states: StateLabel[];
  };
  export function evidenceLabel(
    core: OccupationCore,
    visa: StateVisa,
    state: StateCode,
    points: number,
  ): Omit<StateLabel, "flag">;
  export function visaLabel(
    outlook: Outlook,
    core: OccupationCore,
    points: number,
  ): VisaLabel;
  ```

  Group mapping from the rules engine: `not-open` → label `not-open`; `unverified` → evidence label + flag `rules-being-checked`; `needs-answers` → evidence label + flag `needs-answers`; `strongest`/`watching` → evidence label, no flag. `ANY` is never a ranked state. Best-state order: label rank → unflagged before flagged → `confirmedAtOrBelow` desc → `monthsAtOrBelow6` desc → state code. (The flag and months tie-breaks refine spec 6.3; they reproduce the approved mockups.) Visa label = best state's label; when every state is `not-open`, `not-open`.

- [ ] **Step 1: Write the failing tests**: synthetic cores covering each ladder rung in spec 6.3 order, including: 20 confirmed at/below with half at/below → `strong`; 19 confirmed at/below → `competitive`; masked at/below in 2 of last 3 months → `competitive`; masked in 1 of last 3 but 3 of last 6 → `long-wait`; only above in last 6 → `long-wait`; nothing in 6 months → `not-invited`; no fetched months → `no-data`. Real data (asOf 2026-11-18 for rules, as `outlook.real-data.test.ts` does): Meera 190 at 85 best `TAS` `competitive` flag `rules-being-checked`; Rahul 190 at 90 best `NT` `competitive`, 491 at 100 best `NT` `competitive`; Arjun 190 at 65 best `TAS` `competitive`, 491 at 75 `long-wait`; Dev 190 at 80 and 491 at 90 `not-invited`; Aarav 190 at 95 `strong` (assert the label; record the best state the rules engine yields and compare it with the mockup's NSW in the PR).
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/label-state.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** "Half at or below" compares the at/below interval min with the month-window total interval max (cautious).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): state evidence labels and visa labels`.

