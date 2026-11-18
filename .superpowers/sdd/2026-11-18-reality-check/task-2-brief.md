### Task 2: Scorecard view-model (C2)

**Files:**

- Create: `src/lib/report/scorecard.ts`
- Test: `src/lib/report/scorecard.test.ts`
- Fixtures: extend `src/lib/data/__fixtures__/occupation.ts` (keep existing exports) or add `src/lib/report/__fixtures__/`.

**Interfaces:**

```ts
export type ScorecardData =
  | { kind: "ready"; core: OccupationCore; detail: OccupationDetail | null }
  | {
      kind: "none";
      reason: "notIndexed" | "noData" | "loadFailed" | "loading";
    };
export type Tone = "red" | "amber" | "green" | "neutral";
export type ScorecardCard = {
  visa: Visa;
  title: string; // "189 · Independent" | "190 · Nominated" | "491 · Regional"
  chip: { label: string; tone: Tone };
  sentence: string;
  points: number;
  pointsNote: string | null; // null | "with +5 if nominated" | "with +15 if nominated or sponsored"
  ahead: string | null; // formatCount, null when no pool
  atScore: string | null;
  href: string; // "#visa-189" | "#visa-190" | "#visa-491"
};
export type Scorecard = {
  headline: string;
  sourceLine: string; // "Source: SkillSelect, Department of Home Affairs · snapshot {d MMM yyyy} · counts are EOIs (one person can hold several)."
  cards: [ScorecardCard, ScorecardCard, ScorecardCard];
  overlapNote: string; // "One EOI can select several visas, so pools overlap."
};
export function buildScorecard(input: {
  occupationName: string;
  data: ScorecardData;
  points: { base: number; subclass190: number; subclass491: number };
  submittedMonth: MonthKey | null;
}): Scorecard;
```

**Headline:** the spec section 1 templates, verbatim.

- **none:** "189 hasn't listed {occupation} in its last four rounds. Your 190 and 491 prospects depend on state nomination."
- **occasional** / **regular:** use `latestCutoffInLastFour`.
- **No occupation data** (`kind: "none"`, or `kind: "ready"` with no 189, 190 or 491 pool): "Published SkillSelect data for {occupation} is too limited to compare. Your points breakdown is below."
- **`reason: "loading"`:** headline "Loading published data…".

**189 card sentence:**

| Status                      | Sentence                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------- |
| none, with a latest cut-off | "Not listed in the last 4 rounds. Last cut-off: {cutoff} points, {Mon YYYY}."      |
| none, never listed          | "Not listed in any round we can read."                                             |
| occasional / regular        | "Listed in {k} of the last 4 rounds. Latest cut-off: {cutoff} points, {Mon YYYY}." |
| no 189 pool                 | "No 189 EOIs are published for this occupation in this snapshot."                  |

**Chip tones:** none is red, occasional is amber, regular is green, no data is neutral.

**190/491 cards: interim ruling S1.** The state outlook is step 3, so for now the sentence summarises national invitations from `invitationActivity(core, visa)` over the last 12 calendar months.

- If `lastConfirmedMonth` is set: "At least {N} invited as at {Mon YYYY}, across all states. Each state selects by its own rules." N is that month's `invitedAtLeast.min`.
- Else if `lastPossibleMonth` is set: "Invitations recorded in the last 12 months are each under 20, so may be zero."
- Else: "No {visa} invitations recorded for this occupation in the last 12 months."

The chip is always `{label: "State decides", tone: "amber"}`.

**Ahead / at score:** `poolPosition(core, detail, visa, points, submittedMonth)` gives `formatCount(higher)` and `formatCount(same)`. Both are null when unavailable.

- [ ] **Step 1: Write failing tests:**
  - **Software Engineer–like fixture** (rounds none; 189 byScore `{"95":"608","100":"229","105":"35","110":"<20","90":"1132"}`; total `"9464"`) at 90 points:
    - the headline equals the "none" template with "Software Engineer";
    - card 189 has `ahead` "872–891", `atScore` "1,132" and the red chip;
    - the sentence is "Not listed in the last 4 rounds. Last cut-off: 95 points, Nov 2024."
  - **All-masked fixture:** the 190 sentence is "Invitations recorded in the last 12 months are each under 20, so may be zero."
  - **`kind: "none", reason: "notIndexed"`:**
    - the headline is "too limited to compare";
    - every `ahead` and `atScore` is null;
    - the points still show.
  - **Review Focus 1:** across every fixture, `BANNED_COPY` matches no headline or sentence.
- [ ] **Step 2: Run** `npx vitest run src/lib/report/scorecard.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): build the reality-check scorecard view-model`

