### Task 7: `stateOutlook()`: rule evaluation and groups

**Files:**

- Create: `src/lib/state-outlook/evaluate.ts`, `src/lib/state-outlook/outlook.ts`
- Test: `src/lib/state-outlook/evaluate.test.ts`, `src/lib/state-outlook/outlook.test.ts` (small hand-written fixtures for rules, lists and cores)

**Interfaces:**

```ts
export type RuleCheck = {
  label: string;
  outcome: "pass" | "fail" | "needs-answer" | "unverified";
  source: string;
  checkedAt: string;
  stale: boolean;
  question?: string;
};
export type StreamResult = {
  streamId: string;
  name: string;
  outcome: RuleCheck["outcome"];
  checks: RuleCheck[];
};
export type Group =
  "strongest" | "watching" | "needs-answers" | "unverified" | "not-open";
export type StateOutcome = {
  state: StateCode;
  visa: StateVisa;
  group: Group;
  deciding: StreamResult | null;
  streams: StreamResult[];
  evidence: StateSide;
  reasonText: string;
};
export type Outlook = {
  visa: StateVisa;
  states: StateOutcome[] /* ordered: group order, then evidence peak.min desc, then code */;
  anyState: StateSide;
  summary: string;
};
export function stateOutlook(input: {
  core: OccupationCore;
  rules: StateRules;
  lists: Record<string, ImportedList>;
  federal: FederalList | null;
  profile: Profile;
  points: number;
  visa: StateVisa;
  asOf: string;
}): Outlook;
```

**Evaluation order, per stream.**

1. Is the federal list missing? → `unverified`.
2. Is the occupation federally ineligible? → `fail` ("Not on the federal list for {visa}").
3. Is the status closed? → `fail`.
4. Is the cohort not allowed? → `fail`.
5. The occupation list:
   - absent from a verified list → `fail`;
   - `all-federally-eligible` that is verified, with the federal flag true → `pass`;
   - secondary → `unverified`.
6. Each requirement: `needs-answer` when the profile field is null or undefined, otherwise `pass` or `fail`. A secondary requirement → `unverified`.

**Aggregation.**

- Stale rules count as `unverified`.
- The stream outcome is the worst outcome across its checks, in this order: `fail` > `unverified` > `needs-answer` > `pass`.
- The state outcome is the best outcome across its streams, in this order: `pass` > `needs-answer` > `unverified` > `fail`.
- **Group:**
  - a state with no passing stream maps directly: `fail` → `not-open`, `unverified` → `unverified`, `needs-answer` → `needs-answers`;
  - a passing state is `strongest` when `evidence.peak.invitedAtLeast.min > 0` at or below the points within the last 12 months, otherwise `watching`.
- **`summary`** (replaces ruling S1 on the scorecard):
  - with strongest states: "Strongest evidence in {A and B}. Not open to you now in {n} states.", omitting the second sentence when n = 0;
  - with none: "No state shows strong published evidence for your profile yet."

- [ ] **Step 1: Write failing tests,** one per group, plus every Review Focus 1–4 case:
  - an unanswered requirement gives `needs-answers`, with the question named;
  - a secondary rule gives `unverified` even when another verified stream needs answers (the best stream wins, so the expected result is `needs-answers`; test both orders explicitly);
  - an occupation missing from a verified list gives `not-open`, with reason "Not on {state}'s 2026–27 list";
  - stale rules at `asOf` + 61 days give `unverified`;
  - NSW 491 closed gives `not-open`;
  - a federally ineligible occupation gives `not-open` everywhere;
  - a null federal list gives everything `unverified`;
  - the summary text;
  - `BANNED_COPY` matches nothing.
- [ ] **Steps 2–4:** RED, implement, `npm run check && npm run build`.
- [ ] **Step 5: Commit** `feat(state): evaluate state rules into evidence groups`

