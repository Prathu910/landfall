# Reality Check (Step 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open every report with the approved three-pathway reality check (C2 scorecard) and detailed 189, 190 and 491 panels, all built from the step 1 per-occupation data.

**Architecture:** Pure view-model builders in `src/lib/report/` turn `OccupationCore`, `OccupationDetail` and the profile into display-ready strings and intervals. All copy rules are unit-tested there. Thin components in `src/components/report/` render them. The report loads the detail file alongside the core (a client hook on `/check/`, server loading on `/sample/`). The old score cards, pool section and rounds section are replaced.

**Tech Stack:** Next.js 16 static export (webpack), React 19, TypeScript strict, Mantine 9, Motion, CSS Modules, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md` (sections Placement, 1, 2, 3, 7). Data meanings: `docs/DATA.md`. Mockups: `.superpowers/brainstorm/85678-1794923233/content/` (`scorecard-depth-v2.html`, `eois-like-yours-v2.html`, `189-detail-panel.html`). Decisions: `.superpowers/brainstorm/85678-1794923233/decisions.md`.

## Global Constraints

- Follow `docs/ENGINEERING.md`. `npm run check` and `npm run build` must pass at the end of every task. Files in `src/lib/` use relative imports.
- **Copy rules (spec section 7, binding):**
  - `<20` is written "under 20", and in sentences "under 20, so may be zero". Never "some" or "a few".
  - Absent from a round is "Not listed", never "0" or "no cut-off".
  - INVITED snapshot counts are "at least N invited (as at {Mon YYYY})". Never summed across months.
  - CLOSED is "closed (expired, withdrawn or finalised)". In the EOIs-like-yours section, finalised additionally "includes granted visas".
  - Pools are "EOIs", never "people" or "applicants".
  - Never write "should", "apply to", "best" or "likely to be invited".
  - Every number sits beside its source or snapshot date within the same section.
- **No percentages, no forecasts and no growth figures** (the step 1 coverage finding; spec section 2.1).
- **Intervals:** an interval with `min === max` prints as one number with en-AU grouping. `{min: 0, max: 19}` prints as "under 20". Any other interval prints as "min–max" (en dash).
- Months print as "Oct 2026" and dates as "15 Oct 2026" (reuse `formatDate` from `src/lib/migration.ts` for dates).
- Client components may import only `occupation-index.json` and the new tiny `rounds-meta.json`. Everything else arrives through hooks or server props. Pass hooks stable module-level arrays.
- Every report section, including collapsed content, is visible in print. Every animation respects reduced motion. Text is at least 12px, body text at least 16px on mobile.
- **Profile EOI month:** `profile.eoiDate` (`YYYY-MM-DD`, may be empty) gives the submission month `YYYY-MM`.
- **Report points:** `calculatePoints(profile, asOf)`, which provides `base` (189), `subclass190` and `subclass491`.

## Review Focus

1. **An occupation whose counts are all masked** (`"<20"` everywhere). Every sentence must still say "under 20, so may be zero", and no chip or headline may imply invitations. Tested in Tasks 2 and 5.
2. **EOI date edge cases:** no EOI date, an EOI date after `asOf`, or an EOI month outside the 36-month cohort window. Each gets the spec's exact message, with no crash and no empty table. Tested in Tasks 3 and 4.
3. **"Points check only" users** (`occupation: "other"`), occupations with `hasData: false`, and failed loads. The scorecard shows points with the "too limited to compare" headline and no pool numbers. Tested in Task 2.
4. **Occupations listed in fewer than four parsed rounds, or never listed.** The status and the "latest cut-off" text stay true ("Not listed in any round we can read"). Tested in Task 1.
5. **Printing:** the scorecard, all three panels, the nearby-months table and the "all rounds" list must all appear in print. Verified in Task 10's browser checks.

---

### Task 1: Copy helpers and 189 round status

**Files:**

- Create: `src/lib/report/copy.ts`, `src/lib/report/round-status.ts`
- Test: `src/lib/report/copy.test.ts`, `src/lib/report/round-status.test.ts`

**Interfaces:**

```ts
// copy.ts
export function formatCount(i: Interval): string; // "1,132" | "under 20" | "872–891"
export function countPhrase(i: Interval): string; // like formatCount, but {0,19} -> "under 20, so may be zero"
export function formatMonth(month: MonthKey): string; // "Oct 2026"
export function submissionMonth(eoiDate: string): MonthKey | null; // "2025-02-14" -> "2025-02"; "" or invalid -> null
export const BANNED_COPY: RegExp; // /\b(should|apply to|best|likely to be invited|people|applicants|some invitations|a few)\b/i
// round-status.ts
export type RoundStatus = "regular" | "occasional" | "none";
export type RoundSummary = {
  status: RoundStatus;
  listedInLastFour: number; // 0..4
  roundsConsidered: number; // min(4, rounds.length)
  latestCutoff: { date: string; cutoff: number } | null; // newest non-null cut-off in ANY parsed round
  latestCutoffInLastFour: { date: string; cutoff: number } | null;
};
export function summarise189Rounds(
  rounds189: { date: string; cutoff: number | null }[],
): RoundSummary; // input newest first
export const CHIP_LABEL: Record<RoundStatus, string>; // regular: "Regular invitations", occasional: "Occasional invitations", none: "No recent invitations"
```

**Status rules:**

- **regular:** listed in all of the last four rounds.
- **occasional:** listed in 1–3 of them.
- **none:** listed in none.

If fewer than four rounds exist, use the ones there are, and record `roundsConsidered`.

- [ ] **Step 1: Write failing tests.**
  - `formatCount({0,19})` is "under 20".
  - `formatCount({1132,1132})` is "1,132".
  - `formatCount({872,891})` is "872–891".
  - `countPhrase({0,19})` is "under 20, so may be zero".
  - `formatMonth("2026-10")` is "Oct 2026".
  - `submissionMonth("")` and `submissionMonth("2025-13-01")` are `null`.
  - The Software Engineer rounds `[null, null, null, null, 95 (2024-11-07), 100 (2024-09-05)]` give `status "none"`, `listedInLastFour 0` and `latestCutoff {date:"2024-11-07", cutoff:95}`.
  - Four listed rounds give "regular". Two give "occasional".
  - `[]` gives "none" with `roundsConsidered 0` and `latestCutoff null`.
  - `BANNED_COPY` matches "you should apply" but not "EOIs".
- [ ] **Step 2: Run** `npx vitest run src/lib/report/`. Expect FAIL: modules missing.
- [ ] **Step 3: Implement both files.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): add copy helpers and 189 round status`

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

### Task 3: 189 panel view-model, part 1 (where you stand, same score, rounds)

**Files:**

- Create: `src/lib/report/panel-189.ts`
- Test: `src/lib/report/panel-189.test.ts`

**Interfaces:**

```ts
export type QueueSegments = {
  ahead: Interval;
  same: Interval;
  lower: Interval;
  total: Interval;
}; // lower = total − ahead − same, interval-safe, clamped ≥ 0
export type WhereYouStand =
  { segments: QueueSegments; sentence: string } | { unavailable: string };
// sentence: "{ahead} EOIs have a higher score. {same} share your {score} points. The pool holds {total} EOIs as at {Mon YYYY}."
export type SameScore =
  | { kind: "split"; sentence: string; note: string }
  | { kind: "prompt"; text: string }
  | { kind: "loading" };
// split sentence: "About {before} were submitted before {Mon YYYY}, {sameMonth} in the same month and {after} after."
// note: "Approximate: ties are broken by date of effect, which isn't published and can differ from the submission month."
// prompt (no EOI date, or EOI date after asOf): "Add your EOI date to see how many same-score EOIs were submitted before yours."
export type RoundTile = {
  date: string;
  label: string;
  value: string;
  listed: boolean;
}; // value "95 pts" | "Not listed"; label "15 Oct 2026"
export type RoundsBlock = {
  tiles: RoundTile[]; // first 6
  all: RoundTile[]; // every parsed round
  skippedNote: string | null; // "{n} older rounds use a different table layout and are not shown." from rounds-meta skipped list
  note: string; // "“Not listed” means the official results didn't include this occupation. It is not a cut-off of zero."
};
export function buildWhereYouStand(
  core: OccupationCore,
  score: number,
): WhereYouStand;
export function buildSameScore(
  core: OccupationCore,
  detail: OccupationDetail | null,
  score: number,
  submittedMonth: MonthKey | null,
  asOf: string,
): SameScore;
export function buildRounds(
  core: OccupationCore,
  skippedRounds: { date: string }[],
): RoundsBlock;
```

- **Unavailable 189 pool:** `{ unavailable: "No 189 EOIs are published for this occupation in this snapshot." }`
- **`SameScore`:** returns `loading` when `detail` is null and a submitted month exists.

- [ ] **Step 1: Write failing tests:**
  - Segments for the Task 2 fixture at 90: ahead {872,891}, same {1132,1132}, lower {7441,7460}, total {9464,9464}.
  - The sentence uses "872–891", "1,132" and "9,464".
  - The split for the Task 3 Pool-position fixture (before {30,49}) produces "About 30–49 were submitted before Mar 2025, 25 in the same month and 40 after."
  - **Review Focus 2:** an `eoiDate` after `asOf` gives the prompt.
  - Rounds:
    - tiles are capped at 6;
    - a null cut-off gives "Not listed" with `listed false`;
    - `skippedNote` is null when the list is empty;
    - with 8 skipped rounds, the note starts "8 older rounds".
- [ ] **Step 2: Run** `npx vitest run src/lib/report/panel-189.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.** Reuse `poolPosition` and `formatCount`, and `formatDate` from `src/lib/migration.ts`.
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): add 189 position, same-score and rounds view-models`

### Task 4: 189 panel view-model, part 2 (EOIs like yours, what could change)

**Files:**

- Create: `src/lib/report/eois-like-yours.ts`, `src/lib/report/what-could-change.ts`
- Test: one `*.test.ts` each

**Interfaces:**

```ts
export type CohortRow = {
  month: MonthKey;
  label: string;
  invited: string;
  lodged: string;
  waiting: string;
  closed: string;
  isYours: boolean;
};
export type EoisLikeYours =
  | {
      kind: "ready";
      month: MonthKey;
      basis: "your-month" | "latest-complete";
      basisNote: string | null; // latest-complete: "You haven't added an EOI date, so this shows EOIs submitted in {Mon YYYY}."
      sentence: string; // spec 2.4 verbatim: "Of the {range} {occupation} EOIs from {Mon YYYY}, as at {Mon YYYY}: {invited} are invited and {lodged} have a visa application lodged."
      numbers: {
        invited: string;
        lodged: string;
        waiting: string;
        closed: string;
        hold: string | null;
      }; // hold null when {0,0}
      bar: {
        invited: Interval;
        lodged: Interval;
        waiting: Interval;
        closed: Interval;
      };
      closedNote: string; // "Closed means expired, withdrawn or finalised (finalised includes granted visas)."
      nearby: CohortRow[]; // up to two months either side that exist, ascending, yours flagged
    }
  | { kind: "too-old"; text: string } // "Not available for EOIs this old."
  | { kind: "unavailable"; text: string } // "Published outcomes by submission month are not available for this occupation."
  | { kind: "loading" };
export function buildEoisLikeYours(input: {
  occupationName: string;
  core: OccupationCore;
  detail: OccupationDetail | null;
  submittedMonth: MonthKey | null;
  asOf: string;
}): EoisLikeYours;

export type ChangeItem = {
  label: string;
  effect: string;
  href: "#timeline" | "#scenarios";
}; // effect "+10" | "−5"
export function buildWhatCouldChange(
  events: TimelineEvent[],
  scenarios: { label: string; delta: number }[],
  asOf: string,
): ChangeItem[]; // next 2 future events with a non-zero delta, then the 2 largest positive scenarios
```

**Rules:**

- **Latest complete month:** the as-at month minus one.
- **Too old:** the EOI month is before the earliest stored cohort month (`cohortWindowStart`, ruling R8).
- **Range:** the sum of all five statuses, as an interval.
- **Waiting** is SUBMITTED.
- Check `TimelineEvent` and the scenario shape in `src/lib/migration.ts` and `src/lib/scenarios.ts`, and adapt the parameter types to the real exported types. Don't duplicate them.

- [ ] **Step 1: Write failing tests,** using a fixture with nurse-like Feb 2025 values (S 142, I 175, L 60, H "<20", C 510):
  - The sentence is "Of the 887–906 Registered Nurses nec EOIs from Feb 2025, as at Oct 2026: 175 are invited and 60 have a visa application lodged."
  - `hold` is "under 20".
  - `nearby` holds at most 5 rows and flags Feb 2025.
  - **Review Focus 2:**
    - no EOI date gives `latest-complete`, with the note naming Sep 2026 for as-at 2026-10;
    - an EOI month older than the window gives "too-old".
  - `buildWhatCouldChange` drops past events and events with zero delta.
  - `BANNED_COPY` never matches any output.
- [ ] **Step 2: Run** these tests. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): add EOIs-like-yours and what-could-change view-models`

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

### Task 6: Data plumbing (detail loading, rounds meta)

**Files:**

- **Modify:**
  - `scripts/import/generate-write.ts` (or wherever `rounds.json` is written): also write `src/data/rounds-meta.json` = `{ skipped: { date: string; reason: string }[] }`.
  - `src/components/data/use-occupation-core.ts`: extract a shared internal hook. Add `useOccupationDetail(code, index): DetailLoad`, where `DetailLoad = {status:"idle"}|{status:"loading"}|{status:"ready"; detail: OccupationDetail}|{status:"unavailable"}`. It fetches `occupationDataUrl(code, index, "detail")` and validates with `isOccupationDetail`.
  - `src/components/data/report-occupation.ts`: the `ready` state gains `core: OccupationCore` and `detail: DetailLoad`.
  - `src/components/check-flow.tsx`: load the detail alongside the core.
  - `src/app/sample/page.tsx`: server-load the detail and pass `{status:"ready", detail}`.
  - `CLAUDE.md`: client components may also import `rounds-meta.json`.
- **Create:** `src/components/data/rounds-meta.ts`, which exports the typed, validated `skippedRounds` (module-level constant).
- **Test:**
  - extend `scripts/import/generate.test.ts`: `rounds-meta.json` is written and matches the `rounds.json` skipped list;
  - `src/components/data/report-occupation.test.ts`: the ready state carries the core.

Steps:

- [ ] **Step 1: Write failing tests** for the generator output and the `ReportOccupation` shape.
- [ ] **Step 2: Run** them. Expect FAIL.
- [ ] **Step 3: Implement, then regenerate** with `npm run data:generate -- --as-at 2026-10 --checked-at 2026-11-17`. No network. Only `rounds-meta.json` should be new: check with `git status`.
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS, with no visible UI change yet.
- [ ] **Step 5: Commit** `feat(data): load occupation detail in the report and expose skipped rounds`. Commit the data file separately: `data: add rounds-meta.json`.

### Task 7: Scorecard component

**Files:**

- Create: `src/components/report/scorecard.tsx` and `scorecard.module.css`
- Test: render-free. Logic is already tested; verify visually in Task 10.

**Interface:** `export function RealityScorecard({ scorecard }: { scorecard: Scorecard })`. It renders:

- a dark headline strip with the source line under it;
- three cards in a grid, stacking at ≤ 720px in the order 189, 190, 491;
- the overlap note.

Each card shows its title, chip (colour plus the text label), sentence, points with note, "Ahead of you" / "At your score" rows when present, and a details link (`href`). Use the design tokens from `globals.css`. Follow the mockup `scorecard-depth-v2.html`. No animation beyond what `Reveal` already does, and that respects reduced motion.

- [ ] **Step 1: Implement** the component and CSS module.
- [ ] **Step 2: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 3: Commit** `feat(report): add the reality-check scorecard component`

### Task 8: 189 panel components

**Files:**

- Create, in `src/components/report/`: `queue-bar.tsx`, `panel-189.tsx`, `eois-like-yours.tsx`, `rounds-tiles.tsx`, plus CSS modules as needed.

**Interfaces:**

- `QueueBar({ segments, labels })`: an SVG or CSS bar.
  - Widths use the interval midpoint; every label uses `formatCount`.
  - It needs a text equivalent (`aria-label` plus a visible sentence).
- `Panel189({ whereYouStand, trend, sameScore, rounds, eois, changes, source })`, in the approved order: where you stand (with the existing `TrendChart` and its coverage caveat, reused from `src/components/report/trend-chart.tsx`), among your score, recent rounds, EOIs like yours, what could change.
  - Section id `visa-189`.
  - "See all rounds" is a `<details>` that prints open: add `@media print { details > :not(summary) { display: block } }`, or use the project's existing print rule if there is one.
- `EoisLikeYours`: the sentence, four numbers, a stacked bar, `closedNote`, and the nearby-months table inside `<details open>` ("Compare with nearby months"), visible in print.

Steps:

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 3: Commit** `feat(report): add the 189 detail panel components`

### Task 9: 190/491 panel components

**Files:**

- Create: `src/components/report/panel-nominated.tsx` (+ CSS module if needed)

**Interface:** `PanelNominated({ panel, source })`. It renders:

- section id `visa-190` or `visa-491`;
- the heading;
- `QueueBar` with its sentence;
- `nationalNote`;
- an invitations list (12 rows, newest first);
- `statesLink`.

Steps:

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 3: Commit** `feat(report): add the 190 and 491 panel components`

### Task 10: Report integration, clean-up, docs and browser verification

**Files:**

- **Modify:**
  - `src/components/report.tsx`: build the view-models and render `RealityScorecard`, then the three panels, then the existing sections.
  - `src/app/sample/page.tsx` and `src/components/check-flow.tsx` as needed.
  - `docs/REPORT-COVERAGE.md`, `docs/HANDOFF.md`.
  - `docs/STRATEGY.md`: one decision-log row for ruling S1.
- **Delete** (if unused after integration): `src/components/report/pool-section.tsx`, `src/components/report/rounds-section.tsx`, and their now-dead helpers and CSS. Keep `trend-chart.tsx` and `compare-section.tsx`.

**Report order (spec Placement):**

1. Header
2. **Reality check:** the scorecard, section id `reality-check`
3. 189 panel
4. 190 panel
5. 491 panel
6. Points audit. The eligibility notice moves to the top of this section, unchanged in wording.
7. Scenarios
8. Timeline
9. State pathways (existing; step 3 replaces it)
10. Occupation context
11. Get organised
12. Definitions

The nav `sections` list mirrors this order, with "Reality check" first. Remove the old three `score-card`s, the old pool section and the old rounds section.

Steps:

- [ ] **Step 1: Integrate and delete dead code.** Then run `rg "PoolSection|RoundsSection|score-card" src`. Expect no matches, except any CSS you deliberately keep, and say why.
- [ ] **Step 2: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 3: Browser verification** against `out/`. Use headless Chrome driven via the DevTools protocol, as in step 1 Task 12; no new dependencies.
  - **`/sample/`**, ICT Business Analyst at 90: the headline is the "none" template; card 189 shows "865–903" ahead and "1,093" at your score; all three panels render.
  - **`/check/?occupation=254499`** (Registered Nurses nec): complete the four steps with an EOI date of 2025-02-14. The EOIs-like-yours sentence names Feb 2025 and shows 175 invited / 60 lodged.
  - **`/check/?occupation=other`** (points only): the "too limited to compare" headline, and no pool numbers.
  - **Widths:** at 390px and 1440px, no horizontal overflow. Cards stack 189, 190, 491 at 390px.
  - **Print media emulation:** the nearby-months table and the all-rounds list are visible.
  - **Reduced motion on:** no console errors.
  - Save screenshots of `/sample/` (desktop and 390px) into `.superpowers/sdd/2026-11-18-reality-check/` for the founder.
- [ ] **Step 4: Update docs.**
  - `REPORT-COVERAGE.md`: the reality check and panels are now supported; the 189 trend is kept with its caveat.
  - `HANDOFF.md`: the resume point.
  - `STRATEGY.md`: a decision-log row for S1.
- [ ] **Step 5: Run** `npm run check`, then **commit** in two parts: `feat(report): open the report with the reality check and visa panels`, then `docs: record the reality-check release`.
