# Report Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the long report with a verdict-first, mobile-first report (stamp, best route, estimated wait, Our read, three visas, charts, route, how to improve, folded evidence, points in full), a 4-page A4 PDF, four example tabs on `/sample/`, and an env-configured AI "Our read" with a template fallback.

**Architecture:** New pure domain modules in `src/lib/outlook/` compute labels, the stamp, waits, improvements, the route, queue and chart data, the facts and a template read, all tested against nine real-data scenarios. New components in `src/components/report/` render a screen layout and a separate print layout from one view-model. A new Supabase Edge Function `write-read` words the facts with Claude, behind two switches and a model allowlist.

**Tech Stack:** Next.js 16 static export (webpack), React, TypeScript strict, Mantine 9, CSS Modules, Vitest, Supabase Edge Functions (Deno), `@anthropic-ai/sdk` 1.12.0 via `npm:` specifier, `@fontsource-variable/archivo`, `@fontsource/big-shoulders-stencil-display`.

**Spec:** `docs/superpowers/specs/2026-11-21-report-redesign-design.md`. Visual and copy reference: `.superpowers/brainstorm/report-redesign-2026-11-21/report-e-final.html` (open in a browser; tabs per scenario) and `pdf/`.

## Global Constraints

- Branch `roadmap/report-redesign` (exists). Conventional Commits; end every commit with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Every task ends with `npm run check` passing; tasks that touch UI also run `npm run build`.
- `src/lib` is pure: no React, DOM or fetch. Files in `src/lib/data/` and `src/lib/outlook/` use relative imports (no `@/`), because they run under tsx and vitest.
- Every calculation takes an explicit `asOf` (`YYYY-MM-DD`). Scenario tests use `asOf = "2026-11-21"` and snapshot `skillselect-2026-10-31`.
- "<20" is the interval `{ min: 0, max: 19 }`; never a number; a cautious reading decides labels. A missing month key is "not fetched", never zero; build month windows with `calendarMonths(core.asAt, n)`.
- File sizes: about 250 lines per component, 300 per `src/lib` module. One exported component per file, kebab-case file name. CSS Modules next to components; colours only through tokens.
- No readable text under 12 px (CSS, TSX, TS and SVG text at rendered size). Body 16 px on phones. Reduced motion respected; stamps never animate.
- Label display names (exact): Very strong, Strong, Competitive, Long wait, Not eligible yet, Not open to you, Not currently invited, Not enough data, Too few to count. Stamp short names: Not invited, Not eligible, Not open, No data.
- Rank, best first: very-strong > strong > competitive > long-wait > not-eligible > not-open > not-invited > no-data.
- Footer text (exact): "This is our best reading of the data, not a guarantee. It comes from published SkillSelect figures up to {Month YYYY}. Home Affairs and the states can change round sizes, cut-offs and rules at any time, so your real result may be different. MigrateLens isn't a registered migration agent; for advice on your own case, talk to one."
- AI settings are server-side env vars only: `ANTHROPIC_API_KEY`, `READ_MODEL` (default `claude-opus-5-5`), `READ_ENABLED` (default `false`), `READ_MAX_OUTPUT_TOKENS`, plus `READ_TOKEN_SECRET` for the HMAC. Frontend switch: `NEXT_PUBLIC_READ_ENABLED` (default off).
- Occupations with `hasData: false` are never fetched by the client (existing rule, `docs/DATA.md`); in the product they take the no-core path (all three visas No data, list membership shown).
- Homepage, occupation pages, `/states/` and methodology stay unchanged; keep every module they import.

## Review Focus

1. **Occupation data still loading or failed** (`ReportOccupation` `loading` / `unavailable`): the report shows "Loading published data…" (loading) or the no-core path (unavailable), never a stamp built from nothing. Test in Task 10.
2. **Points-only check** (no occupation, `profile.occupation === ""`): the outlook section shows the points and a plain line inviting the reader to choose an occupation; no stamp, no charts. Test in Task 10.
3. **Detail file failed while core loaded** (`DetailLoad` not ready): the lodged pace and cohort evidence are omitted with a plain sentence; labels still compute from the core. Test in Task 5.
4. **Unconfirmed dates** (`eligible === null`, `uncheckedDates` not empty): the 189 label is computed (only `eligible === false` means Not eligible yet) and the why line adds "Confirm your English and skills assessment dates." Test in Task 2.
5. **EOI date after the snapshot month or in the future**: no pace estimate; the wait uses the planner text and the queue uses the pool variant. Test in Task 5.

---

## File structure

```
src/lib/outlook/
  labels.ts            label union, rank, names, bestLabel
  label-189.ts         189 label (spec 6.2)
  label-state.ts       per-state evidence label + visa label (6.3)
  evaluate-profile.ts  points + three visa labels + stamp for one Profile
  stamp.ts             best visa or combined stamp (6.4)
  wait.ts              estimated wait + lodged pace (6.5)
  improve.ts           moves, dated losses, modes (6.7)
  route.ts             route steps + deadlines (6.8)
  charts.ts            last six cut-off columns + queue groups
  read-contract.ts     dependency-free: ReportFacts, allowedNumbers, checkRead, READ_BANNED (shared with Deno)
  facts.ts             buildFacts
  read-template.ts     deterministic Our read
  headline.ts          who line, headline, fact, why line templates
  view.ts              buildOutlookView: the one view-model components render
  examples.ts          the four /sample/ example profiles + their checked-in reads
  __fixtures__/scenarios.ts   nine scenario profiles + endocrinologist case
src/components/report/
  outlook-hero.tsx, big-stamp.tsx, visa-stamp.tsx, shift-stamps.tsx, fit-stamp-text.ts (hook),
  visa-row.tsx, cutoff-columns.tsx, queue-squares.tsx, route-line.tsx, route-list.tsx,
  improve-section.tsx, evidence-section.tsx, points-page.tsx, method-note.tsx,
  report-footer.tsx, section-chips.tsx, print-report.tsx, download-pdf-button.tsx,
  our-read.tsx, use-our-read.ts  (+ a .module.css per component)
supabase/functions/write-read/index.ts, supabase/functions/_shared/read.ts
supabase/tests/write_read_test.ts
```

---

### Task 1: Labels

**Files:**

- Create: `src/lib/outlook/labels.ts`
- Test: `src/lib/outlook/labels.test.ts`

**Interfaces:**

- Produces:

  ```ts
  export type OutlookLabel =
    | "very-strong"
    | "strong"
    | "competitive"
    | "long-wait"
    | "not-eligible"
    | "not-open"
    | "not-invited"
    | "no-data";
  export const LABEL_RANK: readonly OutlookLabel[]; // best first
  export function labelName(label: OutlookLabel, tooFew?: boolean): string;
  export function stampName(label: OutlookLabel, tooFew?: boolean): string;
  export function bestLabel(labels: OutlookLabel[]): OutlookLabel; // "no-data" for []
  export function isAtLeast(label: OutlookLabel, floor: OutlookLabel): boolean;
  ```

- [ ] **Step 1: Write the failing tests**: `labelName` returns each Global Constraints name (`"not-invited"` → "Not currently invited", `("no-data", true)` → "Too few to count"); `stampName("not-invited")` → "Not invited", `stampName("very-strong")` → "Very strong"; `bestLabel(["not-invited","long-wait","no-data"])` → `"long-wait"`; `bestLabel(["not-eligible","not-open"])` → `"not-eligible"`; `isAtLeast("strong","competitive")` true, `isAtLeast("long-wait","competitive")` false.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/labels.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `labels.ts` with `LABEL_RANK` in the Global Constraints order.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): outlook labels, names and rank`.

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

### Task 5: Estimated wait and lodged pace

**Files:**

- Create: `src/lib/outlook/wait.ts`
- Test: `src/lib/outlook/wait.test.ts`

**Interfaces:**

- Consumes: Tasks 1–4; `submissionMonth` (`src/lib/report/copy.ts`); `STATE_NAMES`.
- Produces:

  ```ts
  export type LodgedPace = {
    ahead: Interval;
    pace: Interval;
    roundsPerYear: number;
    roundsNeeded: { min: number; max: number };
  };
  export function lodgedPace(
    core: OccupationCore,
    detail: OccupationDetail,
    points: number,
    eoiDate: string,
  ): LodgedPace | null;
  export function estimatedWait(
    o: ProfileOutlook,
    input: OutlookInput,
  ): { text: string; pace: LodgedPace | null };
  ```

  Texts are the spec 6.5 table, verbatim. Lodged applies when `eoiDate` is valid, its month ≤ `core.asAt`, the stamp is 189, the 189 label is strong or competitive, and `detail` is present. Years = rounds ÷ rounds per year, rounded outward to whole years ("plan for 1 to 2 years"); if pace max is 0 or masked: "No recent invitations at your score to measure a pace."

- [ ] **Step 1: Write the failing tests**: Aarav → "The next 189 round."; nurse 75 → "The next 1 to 2 rounds."; Priya → "Uncertain. Possible in a round that goes down to 70, like Oct 2026."; Kavya → pace ahead {871..966} (higher {107..126} + SUBMITTED at 70 from months before Mar 2026 {764..840}), pace {262..262}, rounds per year 2, rounds needed {3..4}, text "Roughly 870 to 970 EOIs ahead. At the latest pace, about 3 to 4 rounds, so plan for 1 to 2 years at 70 (estimate)."; Meera (TAS stamp) → "States don't publish a queue. Tasmania invited at or below your points in 3 of the last 6 months."; Rahul → NT text; Dev → "No 189 invitations to measure."; Sana → "We can't estimate one without data."; Arjun → TAS text. Review Focus 3: Kavya with `detail: null` → planner text, `pace: null`. Review Focus 5: Kavya with `eoiDate: "2026-12-01"` → planner text, `pace: null`.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/wait.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Rounds per year = rounds in `rounds189` dated within 12 months before `asOf`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): estimated wait and lodged pace`.

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

### Task 7: Route

**Files:**

- Create: `src/lib/outlook/route.ts`
- Test: `src/lib/outlook/route.test.ts`

**Interfaces:**

- Consumes: Tasks 4–6.
- Produces:

  ```ts
  export type RouteStep = {
    title: string;
    sub: string;
    points: number | null;
    label: OutlookLabel | null;
  };
  export type RouteDeadline = {
    date: string;
    title: string;
    sub: string;
    afterStep: number;
  }; // index of the step it follows
  export type Route = { steps: RouteStep[]; deadlines: RouteDeadline[] };
  export function buildRoute(
    input: OutlookInput,
    o: ProfileOutlook,
    improve: Improve,
  ): Route;
  ```

  Patterns are the six in spec 6.8; step titles and subs as in the mockup (e.g. "Submit EOI" / "189 + NSW 190, now"). Deadlines are `improve.losses` (title "Turns 33: −5", "English test expires", "EOI expires"), placed after the last step dated before them; undated steps count as "now".

- [ ] **Step 1: Write the failing tests**: Aarav → 4 steps (Today 90 VS, Submit EOI, Gather documents, Invitation "60 days to lodge"), deadlines 2027-08-09 and 2028-02-02 both after step index 2; Priya → steps Today 70, Submit EOI, Superior English 80 VS, Update your EOI; deadline after index 2; Rahul → Today, Check state rules ("NT and Tasmania"), Submit EOI, Keep 189 ticked; Kavya → EOI submitted (12 Mar 2026, 70), Today ("254 days waiting"), Superior English (80), Invitation; deadline EOI expiry after index 2; Dev → Today, Keep your EOI in, Check other occupations, Watch SA and WA; Arjun → Today, Submit EOI ("190 + 491, Tasmania"), English retake (80), Update your EOI.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/route.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): best route steps and deadlines`.

### Task 8: Chart data

**Files:**

- Create: `src/lib/outlook/charts.ts`
- Test: `src/lib/outlook/charts.test.ts`

**Interfaces:**

- Consumes: Tasks 2, 5; `formatMonth`, `formatCount` (`src/lib/report/copy.ts`).
- Produces:

  ```ts
  export type CutoffColumn = { month: string; cutoff: number | null }; // "Oct 26"; oldest first
  export type CutoffColumns = {
    columns: CutoffColumn[];
    you: number;
    target: { points: number; label: string } | null;
    pass: 65 | null;
    aria: string;
  };
  export function cutoffColumns(
    core: OccupationCore | null,
    points: number,
    improve: Improve,
  ): CutoffColumns | null;
  export type QueueGroup = {
    key:
      | "ahead"
      | "tied"
      | "behind"
      | "you"
      | "higher"
      | "earlier"
      | "month"
      | "later";
    label: string;
    squares: number;
    emphasis: boolean;
  };
  export type QueueView = {
    kind: "pool" | "lodged";
    unit: 10 | 40 | 50 | 100;
    title: string;
    groups: QueueGroup[];
    aria: string;
  };
  export function queueView(
    core: OccupationCore | null,
    detail: OccupationDetail | null,
    points: number,
    eoiDate: string,
    stampedClosed: boolean,
  ): QueueView | null;
  ```

  Target = the best move's points and "With {move short name}, {points}". `pass = 65` only when points < 65. Unit = smallest of 10/40/50/100 giving ≤ 200 squares; squares round to nearest, minimum 1 for a non-zero group. Title "A queue that isn't moving" when `stampedClosed` (189 not-invited), "Your place at {points}" for lodged, else "Who's in the queue". Labels use ranges ("Ahead: 107–126") and "about" for derived behind counts.

- [ ] **Step 1: Write the failing tests**: Priya columns (oldest first) Sep 24 75, Nov 24 70, Aug 25 80, Nov 25 75, Jun 26 75, Oct 26 70, target 80; Rahul columns end with four `null`; Arjun `pass: 65`; core null → null. Queue: Priya unit 40 squares [3, 46, 58]; Aarav groups ahead 0, tied 0, you 1, behind 107; Meera unit 100; Kavya kind `lodged` groups higher/earlier/month/later; Rahul title "A queue that isn't moving".
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/charts.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): cut-off columns and queue squares data`.

### Task 9: Facts, template read and read check

**Files:**

- Create: `src/lib/outlook/read-contract.ts` (no imports at all), `src/lib/outlook/facts.ts`, `src/lib/outlook/read-template.ts`, `src/lib/outlook/headline.ts`
- Modify: `src/lib/report/copy.ts` (add `REPORT_BANNED_COPY`; keep `BANNED_COPY` for old modules)
- Test: `src/lib/outlook/read-contract.test.ts`, `src/lib/outlook/read-template.test.ts`, `src/lib/outlook/headline.test.ts`

**Interfaces:**

- Produces:

  ```ts
  // read-contract.ts (dependency-free; imported by Deno as ../../../src/lib/outlook/read-contract.ts)
  export type ReportFacts = {
    occupation: string;
    dataMonth: string;
    stamp: { visa: string; state: string | null; label: string };
    visas: {
      visa: string;
      label: string;
      state: string | null;
      points: number;
      caption: string;
    }[];
    counts: { name: string; text: string; numbers: number[] }[]; // e.g. { name: "tied", text: "1,841", numbers: [1841] }
    route: string[];
    wait: string;
    changes: {
      title: string;
      fromPoints: number;
      toPoints: number;
      toLabel: string;
      month: string | null;
    }[];
    extraNumbers: number[]; // rounds, months counts, days waiting, years
  };
  export const READ_BANNED: RegExp; // guarantee(d), definitely, will be invited, %, chance(s) of, likely to be invited, some invitations, a few
  export function allowedNumbers(facts: ReportFacts): Set<number>;
  export function checkRead(
    text: string,
    facts: ReportFacts,
  ): { ok: true } | { ok: false; reason: "number" | "banned" | "length" };
  // facts.ts
  export function buildFacts(
    input: OutlookInput,
    o: ProfileOutlook,
    wait: string,
    improve: Improve,
    route: Route,
  ): ReportFacts;
  // read-template.ts
  export function readTemplate(facts: ReportFacts): string;
  // headline.ts
  export type Headline = {
    who: string;
    h1: string;
    fact: string;
    best: string;
    why: string;
  };
  export function buildHeadline(
    input: OutlookInput,
    o: ProfileOutlook,
    improve: Improve,
  ): Headline;
  ```

  `checkRead`: numbers are every `\d[\d,]*(\.\d+)?` token with commas removed; years 2000–2100 and month numbers inside facts' month strings are allowed when present in `allowedNumbers`; length 40–110 words. `READ_BANNED` is case-insensitive. `REPORT_BANNED_COPY` in `copy.ts` re-exports `READ_BANNED`. Headlines and facts follow the mockup copy for the eight scenarios (h1 exact): "You're at the front of the queue." / "You're on the edge for 189." / "Your best chance is Tasmania, not 189." / "Your way in is state nomination, not 189." / "190 in Tasmania is open to you now. 189 isn't, yet." / "There isn't enough published data to judge your occupation." / "None of the three visas is inviting {occupation} right now." / "You're in the queue, right at the cut-off." Templates use the ANZSCO name from the core or index (no hand plurals). Who line: "{Name}'s report." or "Your report." when the name is empty.

- [ ] **Step 1: Write the failing tests**: `checkRead` rejects a number not in the facts (reason `number`), a banned phrase (`banned`), 30 words (`length`); accepts the mockup's Priya read when the facts contain 10, 80, 6, 190, 85, 168. For every scenario fixture: `readTemplate(buildFacts(...))` passes `checkRead` and contains no `REPORT_BANNED_COPY` match; `buildHeadline(...).h1` equals the strings above; the who line for an empty name is "Your report.".
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/read-contract.test.ts src/lib/outlook/read-template.test.ts src/lib/outlook/headline.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): report facts, template read and read check`.

### Task 10: Outlook view-model

**Files:**

- Create: `src/lib/outlook/view.ts`
- Test: `src/lib/outlook/view.test.ts`

**Interfaces:**

- Consumes: Tasks 1–9.
- Produces:

  ```ts
  export type OccupationState =
    | { status: "loading" }
    | { status: "ready"; core: OccupationCore; detail: OccupationDetail | null }
    | { status: "unavailable" }; // report.tsx converts ReportOccupation to this
  export type VisaCard = {
    visa: Visa;
    shape: "rect" | "hex" | "oval";
    top: string;
    stampWord: string;
    points: number;
    label: OutlookLabel;
    title: string;
    caption: string;
    flagText: string | null;
  };
  export type OutlookView =
    | { kind: "loading" }
    | { kind: "points-only"; points: PointsResult; line: string }
    | {
        kind: "report";
        headline: Headline;
        stamp: Stamp;
        stampRing: string;
        stampBottom: string;
        wait: string;
        visas: VisaCard[];
        cutoffs: CutoffColumns | null;
        cutoffsEmpty: string | null;
        queue: QueueView | null;
        queueEmpty: string | null;
        route: Route;
        improve: Improve;
        facts: ReportFacts;
        templateRead: string;
        points: PointsResult;
        methodLines: string[];
        footer: string;
        dataMonth: string;
      };
  export function buildOutlookView(
    input: Omit<OutlookInput, "core" | "detail"> & {
      occupation: OccupationState;
    },
  ): OutlookView;
  ```

  Stamp ring: "SUBCLASS 189", "SUBCLASS 190 TAS", or "189 • 190 • 491" for combined; bottom "{MON YYYY} • {points} POINTS". Method lines are the eight bullets of the mockup's "How we label your outlook". Footer is the Global Constraints sentence with the data month.

- [ ] **Step 1: Write the failing tests**: a table over the eight scenario fixtures asserting stamp (kind, visa, state, label), the three visa card labels, `wait` (from Task 5) and the best move id (from Task 6); `loading` → `{ kind: "loading" }`; `unavailable` → `report` with combined `no-data` (Review Focus 1); empty occupation → `points-only` with line "Choose an occupation to see how your points compare." (Review Focus 2); every string in the view (headline, captions, route, improve, method, footer) has no `REPORT_BANNED_COPY` match except the footer's "guarantee".
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/view.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the whole outlook folder: `npx vitest run src/lib/outlook`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(outlook): one view-model for the redesigned report`.

### Task 11: Brand tokens and fonts

**Files:**

- Modify: `src/app/globals.css` (`:root`), `src/lib/brand/palette.ts`, `src/app/layout.tsx`, `package.json`, `package-lock.json`
- Test: existing `src/lib/brand/palette.test.ts` (extend)

**Interfaces:**

- Produces CSS tokens `--label-{very-strong|strong|competitive|long-wait|not-invited|not-eligible|not-open|no-data}-ink` and `-bg`, and `--font-report` (Archivo variable) and `--font-stamp` (Big Shoulders Stencil Display). Values from the mockup: very-strong `#0F6B3C`/`#D6EFE0`, strong `#1E7A4C`/`#E5F3EA`, competitive `#A06400`/`#FBEFD6`, long-wait `#C2410C`/`#FDE8DB`, not-invited `#B42318`/`#FCE5E3`, not-eligible `#5B3F9E`/`#ECE6F8`, not-open `#B42318`/`#FCE5E3`, no-data `#586470`/`#E8ECEF`. `palette.ts` gains `LABEL_PAIRS` mirroring them.

- [ ] **Step 1: Extend the palette test**: every `LABEL_PAIRS` ink on its bg and on white meets 4.5:1; `globals.css` tokens equal `LABEL_PAIRS`.
- [ ] **Step 2: Run** `npx vitest run src/lib/brand`. Expected: FAIL.
- [ ] **Step 3: Install** `npm install --save-exact @fontsource-variable/archivo@5.3.0 @fontsource/big-shoulders-stencil-display@5.3.0`; import the width-axis Archivo CSS (check `node_modules/@fontsource-variable/archivo/` for `wdth.css`; use the default file if none) and `@fontsource/big-shoulders-stencil-display/latin-800.css` and `latin-900.css` in `layout.tsx`; add tokens. If a contrast pair fails, darken the ink until AA passes and note it in the commit.
- [ ] **Step 4: Run** `npx vitest run src/lib/brand && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(brand): outlook label tokens and report fonts`.

### Task 12: Stamp components

**Files:**

- Create: `src/components/report/big-stamp.tsx`, `visa-stamp.tsx`, `shift-stamps.tsx`, `use-fit-stamp-text.ts`, `stamp.module.css`, `src/lib/outlook/stamp-geometry.ts`
- Test: `src/lib/outlook/stamp-geometry.test.ts`

**Interfaces:**

- Consumes: `labelName`, `stampName`, label tokens.
- Produces: `<BigStamp label ring bottom tooFew />`, `<VisaStamp shape top word points label rotate />`, `<ShiftStamps from to />` (each `role="img"` with an `aria-label` naming the labels). `stamp-geometry.ts`: `export function stampLines(word: string, maxChars = 12): string[]; export function stampFontSize(text: string, width: number, max: number): number;` (fit ratio 0.56 as in the mockup). `useFitStampText(ref)` measures `text[data-fit]` after `document.fonts.ready` and sets `textLength` + `lengthAdjust="spacingAndGlyphs"` when wider than `data-fit`. Ink filter: one `<filter id>` per component instance via `useId`.

- [ ] **Step 1: Write the failing tests**: `stampLines("NOT ELIGIBLE YET")` → `["NOT ELIGIBLE","YET"]`; `stampLines("COMPETITIVE")` → one line; `stampFontSize("COMPETITIVE", 250, 56)` ≈ 36.2 (±0.1).
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/stamp-geometry.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the helpers and components following the mockup SVG (`bigStamp`, `visaStamp`, `shiftStamps` in `report-e-final.html`), with colours from tokens and the stamp font from `--font-stamp`.
- [ ] **Step 4: Run** `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(report): ink stamp components`.

### Task 13: Chart and route components

**Files:**

- Create: `src/components/report/cutoff-columns.tsx`, `queue-squares.tsx`, `route-line.tsx`, `route-list.tsx` (+ `.module.css` each)

**Interfaces:**

- Consumes: `CutoffColumns`, `QueueView` (Task 8), `Route` (Task 7).
- Produces: `<CutoffColumns data narrow? />` (viewBox 400 wide, or 340 with text ×1.18 when `narrow`), `<QueueSquares data narrow? />` (27 columns, or 20 when narrow, one-column legend), `<RouteLine route width? />` (horizontal SVG; default 860, print 700), `<RouteList route />` (vertical HTML `<ol>`). Screen components render both wide and narrow variants and switch with `@media screen and (max-width: 720px)`.

- [ ] **Step 1: Implement** the four components from the mockup's `cutoffChart`, `queueSquares`, `routeLine`, `routeList`.
- [ ] **Step 2: Run** `npm run check`. Expected: PASS (the 12 px floor test passes; SVG font sizes ≥ 12 at their smallest rendered scale).
- [ ] **Step 3: Commit** `feat(report): cut-off, queue and route graphics`.

### Task 14: Report sections and composition

**Files:**

- Create: `outlook-hero.tsx`, `visa-row.tsx`, `improve-section.tsx`, `evidence-section.tsx`, `points-page.tsx`, `method-note.tsx`, `report-footer.tsx`, `section-chips.tsx`, `download-pdf-button.tsx`, `our-read.tsx` (template text only in this task) in `src/components/report/` (+ CSS modules)
- Modify: `src/components/report.tsx` (compose new sections; remove scorecard, data-says, visa panels, scenarios, compare, timeline, prepare and definitions from the report body), `src/components/report/report-sections.ts` (new ids: outlook, visas, charts, route, improve, evidence, points)
- Modify: `src/app/check/page.tsx` only if props change

**Interfaces:**

- Consumes: `buildOutlookView` (Task 10), Tasks 12–13; existing `StateOutlookSection`, `CompareSection`, `TrendChart`, `ReportFeedback`, `PointsAudit` data.
- Produces: `Report` keeps its current props. The evidence section (folded `<details>`) contains: every 189 round since 2022 table ("Enough" / "Short by N"), pool histogram, the cohort bar (reader's month if lodged, else 12 months back), 190 and 491 state tables (state, latest invited at or below, months of last 6, label chip, flag), then the existing `StateOutlookSection` (tiles, panels, Sharpen questions), `CompareSection` and the trend chart. Sharpen answers flow through the existing `onAnswer` and re-render the whole view (spec 7, changes after render).

- [ ] **Step 1: Implement** the sections and the composition. Phone rules from spec 8: stamp first (max 230 px), Best route and Estimated wait as two tiles, sticky chips (`position: sticky` under the site header) below 1024 px, visa stamps as rows, points table stacked, photo placeholder hidden.
- [ ] **Step 2: Run** `npm run check && npm run build`. Expected: PASS.
- [ ] **Step 3: Verify in a browser** against `out/` (`python3 -m http.server 3017 --bind 127.0.0.1 --directory out`): open `/check/`, complete the check for Priya's answers (fixture values) and for Rahul's; compare with the mockup tabs 2 and 4 at 390, 820 and 1280 px. Expected: same sections and order, no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`), no rendered text under 12 px, reduced motion on shows no motion.
- [ ] **Step 4: Commit** `feat(report): verdict-first report layout`.

### Task 15: Print layout and Download PDF

**Files:**

- Create: `src/components/report/print-report.tsx`, `print-report.module.css`
- Modify: `src/components/report.tsx` (render `<PrintReport view />` after the screen layout), `src/app/globals.css` (`@page` rule only), `CLAUDE.md` and `docs/ENGINEERING.md` (printing rule reworded to the spec 11 sentence)

**Interfaces:**

- Consumes: the view (Task 10), Tasks 12–13 (`narrow` charts, `RouteLine width={700}`).
- Produces: a print-only tree: brand line; page 1 outlook (tiles, Our read, why) + stamp + three visas; forced break; charts two columns + route + improve; points + method + guarantee box (kept together); forced break; appendix (rounds, pool, 190/491 state tables side by side with a one-line rules note per state, sources). `@page { size: A4; margin: 14mm 14mm 18mm; }` and per-report margin boxes (`@bottom-left` name + not-a-guarantee, `@bottom-right` "Page x of y") injected as a `<style>` element. Screen chips, buttons and the feedback prompt are hidden in print.

- [ ] **Step 1: Implement** from the mockup's `renderPrint`, `appendix` and print CSS; all phone/tablet media queries in report CSS modules are `screen and (...)`.
- [ ] **Step 2: Run** `npm run check && npm run build`. Expected: PASS.
- [ ] **Step 3: Verify PDFs** from the built site for the four `/sample/` examples once Task 16 lands, or for `/check/` reports now, with headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer --print-to-pdf=/tmp/r.pdf "<url>"` at two window sizes (`--window-size=390,844` and `--window-size=1280,900`). Expected: ≤ 5 pages each, page 1 holds the stamp, headline, best route, wait and three visas (`pdftotext -f 1 -l 1`), and the two sizes give the same page count and text.
- [ ] **Step 4: Commit** `feat(report): A4 print layout and Download PDF`.

### Task 16: `/sample/` with four example tabs

**Files:**

- Create: `src/lib/outlook/examples.ts`, `src/components/report/sample-tabs.tsx` (+ CSS module)
- Modify: `src/app/sample/page.tsx`
- Test: `src/lib/outlook/examples.test.ts`

**Interfaces:**

- Consumes: scenario profiles (copy the four into `examples.ts`; tests import them from there, the fixture file re-exports to avoid duplication), `buildOutlookView`, `checkRead`.
- Produces: `export const EXAMPLES: { id: "strong" | "middle" | "notinv" | "none"; tab: string; profile: Profile }[]` with tabs "Strong", "In the middle", "189 closed", "Nothing suits". The sample page loads each example's core and detail at build (`loadOccupationCore`/`loadOccupationDetail`), renders the tabs (keyboard accessible, `?example=` is not used; tab state stays in memory), and shows each example's template read. `asOf` stays pinned for the sample.

- [ ] **Step 1: Write the failing tests**: each example's `buildOutlookView` stamp matches Task 10's table (so a data refresh that changes a stamp fails the build); each example's `templateRead` passes `checkRead`.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/examples.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Keep the homepage's existing sample constants (`src/lib/sample.ts`, `buildSampleView`) untouched.
- [ ] **Step 4: Run** `npm run check && npm run build`, then the Task 15 Step 3 PDF check on `/sample/` for each tab. Expected: PASS, ≤ 5 pages each.
- [ ] **Step 5: Commit** `feat(sample): four example reports as tabs`.

### Task 17: `write-read` Edge Function

**Files:**

- Create: `supabase/functions/write-read/index.ts`, `supabase/functions/_shared/read.ts`, `supabase/tests/write_read_test.ts`
- Modify: `supabase/functions/_shared/handler.ts` (calculation success returns `read_token`), `supabase/functions/deno.json` (check and test tasks include the new files), `supabase/tests/submissions_test.ts` (token present on success), `docs/OPERATIONS-BACKEND.md`

**Interfaces:**

- Consumes: `checkRead`, `ReportFacts` from `../../../src/lib/outlook/read-contract.ts`.
- Produces:

  ```ts
  // _shared/read.ts
  export const READ_MODELS: readonly string[]; // ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-fable-5-2"]
  export type ReadConfig =
    | {
        enabled: true;
        apiKey: string;
        model: string;
        maxTokens: number;
        tokenSecret: string;
      }
    | { enabled: false; reason: string };
  export function readConfig(
    env: (name: string) => string | undefined,
  ): ReadConfig;
  export function signReadToken(
    submissionId: string,
    expiresAt: number,
    secret: string,
  ): Promise<string>;
  export function verifyReadToken(
    token: string,
    now: number,
    secret: string,
  ): Promise<{ ok: true; submissionId: string } | { ok: false }>;
  export type Complete = (
    system: string,
    facts: ReportFacts,
    config: Extract<ReadConfig, { enabled: true }>,
  ) => Promise<string | null>;
  export function createReadHandler(deps: {
    env: (n: string) => string | undefined;
    complete: Complete;
    now: () => number;
  }): (req: Request) => Promise<Response>;
  ```

  Responses: `200 { read: string }`, `200 { read: null, reason: "disabled" | "check-failed" | "timeout" | "refused" }`, `403` bad origin or token, `400` invalid facts, `429` rate limit (per-IP, in-memory window). Token: HMAC-SHA256 over `{submissionId}.{expiresAt}`, 10-minute expiry, up to 3 uses per token (in-memory counter). `readConfig`: disabled unless `READ_ENABLED === "true"`, `ANTHROPIC_API_KEY` set, `READ_TOKEN_SECRET` set and `READ_MODEL` (default `claude-opus-5-5`) in `READ_MODELS`; `READ_MAX_OUTPUT_TOKENS` default `2000` (thinking cannot be disabled on Opus 5.5; it counts toward the cap). The production `complete` uses `npm:@anthropic-ai/sdk@1.12.0`: `client.beta.messages.create({ model, max_tokens, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", output_config: { effort: "low" }, system, messages: [{ role: "user", content: JSON.stringify(facts) }] })` with an 8-second timeout; returns the text block, or null on `stop_reason: "refusal"`. Nothing about facts or text is logged; configuration errors log only the reason. The system prompt (exact text in `read.ts`) states: write 60–90 words in plain, second-person sentences; use only numbers present in the facts; no greeting or name; never promise an outcome; follow the stamp and wait; mention the 189 position when a state route is stamped.

- [ ] **Step 1: Write the failing tests** (`write_read_test.ts`, with a fake `complete`): disabled when `READ_ENABLED` unset; disabled when `READ_MODEL="claude-opus-55"` (misspelt) and `complete` never called; valid token → `{ read }`; expired token → 403; fourth use → 403; text with a number not in the facts → `{ read: null, reason: "check-failed" }`; `complete` returning null → `reason: "refused"`; invalid facts body → 400; other origin → 403. In `submissions_test.ts`: calculation success includes a `read_token` that `verifyReadToken` accepts.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement**, then document the five variables, defaults and how to set them (`supabase secrets set ...`) in `docs/OPERATIONS-BACKEND.md`.
- [ ] **Step 4: Run** `npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): write-read function with model allowlist and read tokens`.

### Task 18: Client "Our read", gate copy and privacy

**Files:**

- Create: `src/components/report/use-our-read.ts`
- Modify: `src/components/report/our-read.tsx`, `src/components/submissions/transport.ts` (return `read_token`), `src/components/submissions/use-submission.ts` (expose the token), `src/components/submissions/calculation-email.tsx` (gate sentence when enabled), `src/components/submissions/config.ts` (`readEnabled` from `NEXT_PUBLIC_READ_ENABLED === "true"`), privacy section (wherever the current privacy text lives; search for "Cloudflare Web Analytics"), `src/lib/submissions/contract.ts` (`PRIVACY_VERSION`), `src/components/submissions/transport.test.ts`
- Test: `src/components/submissions/transport.test.ts`

**Interfaces:**

- Consumes: `ReportFacts`, `checkRead`, `readTemplate`; the token from Task 17.
- Produces: `useOurRead(facts: ReportFacts, template: string, token: string | null, enabled: boolean): { text: string; source: "ai" | "template"; pending: boolean }`. Behaviour: when disabled or no token → template immediately; else show "Writing our read…" up to 6 s, accept the reply only if `checkRead` passes, otherwise template; refetch when the facts' JSON changes, at most 3 calls per token. The gate adds "Your summary is written by AI from your results (not your answers)." only when `readEnabled`. Privacy text adds one sentence: computed results (not your answers, name, email or date of birth) are sent to Anthropic to write your summary and are not stored by MigrateLens. Bump `PRIVACY_VERSION` to the release date and note in `docs/HANDOFF.md` that frontend and functions must deploy together.

- [ ] **Step 1: Write the failing tests**: transport parses `read_token` from a success body and tolerates its absence; `useOurRead`'s pure decision helper (export `decideRead(reply, facts, template)` from the hook file) returns the template for a failing reply and the reply for a passing one.
- [ ] **Step 2: Run** `npx vitest run src/components/submissions/transport.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check && npm run build && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(report): AI-written Our read behind two switches`.

### Task 19: Docs and final verification

**Files:**

- Modify: `docs/ENGINEERING.md` ("Data honesty": estimates allowed when computed in code from published history and labelled; still no percentages; AI never decides labels or numbers; remove the "never write 'you should apply'" line for the report), `docs/REPORT-COVERAGE.md`, `docs/HANDOFF.md` (resume point; switches stay off until the privacy deploy), `CLAUDE.md` (architecture: `src/lib/outlook/`, the print layout, `write-read`, the env vars), `docs/STRATEGY.md` (decision log only if a new founder decision arose)

- [ ] **Step 1: Update the docs** as listed; note the rules-engine state differences found in Task 3 against the mockups.
- [ ] **Step 2: Run** `npm run check && npm run build && npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 3: Verify** against `out/` at 360, 390, 820 and 1280 px with reduced motion on and off: `/check/` for the eight scenario profiles and `/sample/` for its four tabs. Expected: matches the mockups (allowing rules-engine state differences), no horizontal scroll, no text under 12 px, PDFs ≤ 5 pages and identical at two window sizes, homepage and an occupation page unchanged.
- [ ] **Step 4: Commit** `docs: report redesign architecture, coverage and handoff`.
