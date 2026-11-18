# State Outlook (Step 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** For 190 and 491, place all eight jurisdictions into evidence groups for the user's occupation and situation. The output is colour-coded tiles, and each tile opens a panel with its reasons, sources and checked dates. This replaces the old "State pathways" cards and the interim 190/491 card sentences (ruling S1).

**Architecture:**

- **Data:** typed, hand-curated state rules (programs, streams, cohorts and requirements, each with source, checked date and verification status) in `src/data/state-rules/2026-27/`, plus imported official occupation lists (federal, WA, QLD, SA, NSW) from importers in `scripts/state-lists/`.
- **Logic:** a pure `stateOutlook()` in `src/lib/state-outlook/` combines the rules, the user's profile and step 1's `stateEvidence()` into groups and panel view-models. All copy is unit-tested there, as in step 2.
- **Questions:** an optional "Sharpen my state outlook" form collects the facts the rules need.

**Tech Stack:** Next.js 16 static export, TypeScript strict, tsx scripts, Vitest, CSS Modules, Mantine 9 (segmented control and inputs).

**Spec:** `docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md`, sections 4, 5 and 6, plus "Resolved after the builder check" and "Founder decisions after the draft". Research and sources: `docs/research/state-nomination-2026-27.md`. Mockup: `.superpowers/brainstorm/85678-1794923233/content/state-outlook-layouts.html` (E2 tiles chosen) and `decisions.md`. Step 2 ledger, for patterns and deferred items: `.superpowers/sdd/2026-11-18-reality-check/progress.md`.

## Global Constraints

- Follow `docs/ENGINEERING.md`. `npm run check` (0 warnings) and `npm run build` must pass at the end of every task. `src/lib` and `scripts` use relative imports. CSS-module selectors always contain a local class.
- Copy rules (spec §7) apply to every new string. Use `BANNED_COPY` and the helpers in `src/lib/report/copy.ts`; don't duplicate them. Never write "best", "should", "apply to" or "likely to be invited". Group labels describe **evidence**:
  - "Strongest evidence"
  - "Worth watching"
  - "Needs your answers"
  - "Not yet verified"
  - "Not open to you now"
- **Founder decision (17 Nov 2026):** ACT, VIC, TAS and NT rules are not browser-verified, so their tiles show "Not yet verified" with their published evidence still visible. Any rule sourced only from a search extract (`[S]` in the research) has `verification: "secondary"` and never decides eligibility.
- **Every rule** carries `source` (URL), `checkedAt` (YYYY-MM-DD) and `verification: "verified" | "secondary"`. A rule with `checkedAt` more than 60 days before the report's `asOf` is treated as unverified at render time. A build-time warning (not a failure) lists rules more than 45 days old. Tests use fixed dates and never the real clock.
- **Streams are modelled:** a state passes for a visa if any of its streams passes, and the panel names that stream. The cohort is one of `living-in-state`, `living-in-other-state` or `offshore`, derived from the profile's `onshore` and `state` answers.
- **Federal eligibility** comes only from the imported official list. EOI counts are never used as a proxy. An occupation that is federally ineligible for a visa is "Not open to you now" in every state for that visa. If the federal list is unavailable, all tiles are "Not yet verified".
- **Evidence:** reuse `stateEvidence(core, visa, state, score)` from `src/lib/data/state-evidence.ts`. "Strongest evidence" requires `peak.invitedAtLeast.min > 0` at or below the user's score within the last 12 calendar months. "Any state" invitations are shown separately and never change a state's group.
- **"Not advice to apply. Rules change; check the official page."** appears in every state panel.
- **Profile data stays in the browser:** opt-in saving, clearable, never in the URL. New optional profile fields must not break restoring previously saved profiles: missing means unanswered.
- **Printing** shows both visas' grids and every state panel, expanded. Animations respect reduced motion.
- **Network:** only importer fixture capture and the import runs may use it. Tests never do. If an official source blocks automated access (HTTP 403, a login wall, or JS-only data), stop that importer and report BLOCKED with evidence. Do not work around blocks.

## Review Focus

1. **A user with no "Sharpen" answers.** Tiles must be "Needs your answers" (with the deciding question named) or another honest group. They must never pass on unanswered facts or fail on them. Tested in Task 7.
2. **Rules with contradictory or secondary sources.** These must give "Not yet verified", even when a verified rule in the same state passes. Tested in Task 7.
3. **An occupation not on any imported list** (most of the 493). States with a verified list give "Not open to you now: not on {state}'s list". States without an imported list give "Not yet verified". Never "eligible". Tested in Task 7.
4. **Stale rules.** A rule older than 60 days relative to `asOf` becomes "Not yet verified", with "Last checked {date}; may have changed". Tested in Task 7 with fixed dates.
5. **Masked evidence:** a state whose invitations are all `<20` is "Worth watching", never "Strongest evidence", and its fragment reads "under 20 invited, so may be zero". Tested in Task 8.

---

### Task 1: State rules model, guards and staleness

**Files:**

- Create: `src/lib/state-outlook/rules-types.ts`, `src/lib/state-outlook/rules-guards.ts`, `src/lib/state-outlook/staleness.ts`
- Test: `src/lib/state-outlook/rules-guards.test.ts`, `src/lib/state-outlook/staleness.test.ts`

**Interfaces:**

```ts
export type Verification = "verified" | "secondary";
export type Sourced<T> = {
  value: T;
  source: string;
  checkedAt: string;
  verification: Verification;
  note?: string;
};
export type Cohort = "living-in-state" | "living-in-other-state" | "offshore";
export type ProgramStatus = "open" | "closed" | "restricted" | "unknown";
export type OccupationListRef =
  | { kind: "list"; listId: string } // an imported list in src/data/state-rules/lists/<listId>.json
  | { kind: "all-federally-eligible" }
  | { kind: "none-published" }; // the state names no list
export type Requirement =
  | { kind: "min-months-living-in-state"; months: number }
  | { kind: "min-months-working-in-state"; months: number } // working in the nominated occupation
  | { kind: "min-months-living-offshore"; months: number }
  | { kind: "job-offer-in-state" }
  | { kind: "visa-expiry-before"; date: string }
  | { kind: "min-years-experience"; years: number; withinYears: number }
  | { kind: "lives-regional" }
  | { kind: "studied-in-state" };
export type Stream = {
  id: string; // "wa-general", "sa-skilled-employment", ...
  name: string; // "General stream"
  cohorts: Sourced<Cohort[]>;
  status: Sourced<ProgramStatus>;
  restriction?: Sourced<string>; // human text, e.g. "Visa must expire by 31 Jan 2027"
  occupations: Sourced<OccupationListRef>;
  requirements: Sourced<Requirement>[];
};
export type StateVisaRules = {
  state: StateCode;
  visa: StateVisa;
  selectionSystem: Sourced<string>;
  ownScoreSystem?: Sourced<{ name: string; url: string }>;
  streams: Stream[];
  resultsUrl?: string;
};
export type StateRules = { programYear: "2026-27"; rules: StateVisaRules[] };
export type ImportedList = {
  listId: string;
  source: string;
  checkedAt: string;
  entries: Record<string, { "190"?: Cohort[]; "491"?: Cohort[] }>;
}; // code -> cohorts listed per visa
export type FederalList = {
  source: string;
  checkedAt: string;
  entries: Record<string, { "190": boolean; "491": boolean }>;
};

export function isStateRules(v: unknown): v is StateRules;
export function isImportedList(v: unknown): v is ImportedList;
export function isFederalList(v: unknown): v is FederalList;
export function isStale(checkedAt: string, asOf: string, maxDays = 60): boolean; // pure UTC calendar arithmetic
export function staleRules(
  rules: StateRules,
  buildDate: string,
  maxDays = 45,
): { path: string; checkedAt: string }[];
```

- [ ] **Step 1: Write failing tests.**
  - The guards accept a minimal valid structure.
  - The guards reject a rule with no `source`, with `checkedAt` "2026-13-01", or with `verification: "maybe"`.
  - `isStale("2026-09-01","2026-11-17")` is true (77 days > 60).
  - `isStale("2026-10-01","2026-11-17")` is false.
  - `staleRules` lists the paths of rules more than 45 days old.
- [ ] **Step 2: Run** `npx vitest run src/lib/state-outlook/`. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 5: Commit** `feat(state): model state rules with sources, verification and staleness`

### Task 2: Federal occupation eligibility importer

**Files:**

- Create: `scripts/state-lists/federal.ts`, `scripts/state-lists/__fixtures__/federal.*`, `scripts/state-lists/federal.test.ts`
- Data: `src/data/state-rules/federal-occupations.json` (FederalList)
- Modify: `package.json`, adding the script `"data:state-lists": "tsx scripts/state-lists/cli.ts"` (create a minimal `cli.ts` that runs the available importers; later tasks extend it)

**Source:** the official list of eligible skilled occupations for 190 and 491. That is the Home Affairs skilled occupation list, or the current legislative instrument on legislation.gov.au. Find the official machine-readable or HTML source and record its URL.

- [ ] **Step 1: Capture a fixture once** from the official source. If it is blocked (403, login, or JS-only with no reachable data endpoint), stop and report BLOCKED with the URLs tried and the responses.
- [ ] **Step 2: Write failing parser tests** against the fixture:
  - 261313 Software Engineer is eligible for 190 and 491;
  - every entry has both booleans;
  - an unknown code is absent.
- [ ] **Step 3: Implement** the parser and writer: atomic write, guard-validated (`isFederalList`).
- [ ] **Step 4: Run the import.** Check that the entry count is plausible (hundreds) and that all 11 original occupations are present.
- [ ] **Step 5: Run** `npm run check && npm run build`, then **commit** the code and data separately:
  - `feat(state): import federal 190/491 occupation eligibility`
  - `data: add federal occupation eligibility`

### Task 3: State occupation list importers (WA, SA)

**Files:**

- Create: `scripts/state-lists/wa.ts`, `scripts/state-lists/sa.ts`, their fixtures and tests
- Modify: `scripts/state-lists/cli.ts`
- Data: `src/data/state-rules/lists/wa.json`, `src/data/state-rules/lists/sa.json` (ImportedList)

**Sources (research doc):**

- **WA:** the occupation search CSV, `https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv`.
- **SA:** the occupation list page, `https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list`.

Map each listed occupation to the cohorts per visa that it is available to, following the research doc's cell rules:

- WA "off" = listed, with no residence requirement;
- SA "on" = available in at least one onshore stream.

Keep stream detail in each entry if the source provides it, in an optional `streams?: string[]` field (extend `ImportedList` compatibly).

- [ ] **Step 1: Capture fixtures** (BLOCKED rule applies).
- [ ] **Step 2: Write failing tests.** The expected values come from the research doc's 11×8 table:
  - WA 261313: 190 and 491 for all cohorts;
  - SA 221111: 491 only, onshore.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the importers.** Spot-check against the research table for all 11 occupations, and report any differences instead of "fixing" the data.
- [ ] **Step 5: Run** `npm run check && npm run build`, then **commit** the code and data separately.

### Task 4: State occupation list importers (QLD, NSW)

**Files:** as in Task 3, for `qld.ts` and `nsw.ts`.

**Sources:**

- **QLD:** the onshore list `https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list` and the offshore list `https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)`.
- **NSW:** the Skills List `https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists`. NSW lists 4-digit ANZSCO unit groups.

Mapping rules:

- Map NSW unit groups to 6-digit codes by prefix, using `src/data/occupation-index.json`, and mark each entry `viaUnitGroup: "<4-digit>"`.
- NSW 491 is closed. Record that in the rules (Task 5), not in the list.

- [ ] **Step 1: Capture fixtures.**
- [ ] **Step 2: Write failing tests:**
  - QLD 233211 Civil Engineer: 190 and 491, onshore and offshore;
  - NSW 261313 is present via unit group 2613.
- [ ] **Steps 3–5:** as in Task 3.

### Task 5: Curated 2026–27 rules for all eight jurisdictions

**Files:**

- Create: `src/data/state-rules/2026-27/{wa,nsw,qld,sa,vic,act,tas,nt}.ts`, plus `index.ts` exporting `stateRules: StateRules` (validated by `isStateRules` at module load)
- Test: `src/data/state-rules/2026-27/state-rules.test.ts`

**Content:** transcribe from `docs/research/state-nomination-2026-27.md` only, with no new browsing:

- every program, stream, cohort, status, restriction and requirement;
- each with its source URL and `checkedAt: "2026-11-17"` (the research date);
- `verification: "verified"` only for facts the research read directly (WA, NSW, QLD, SA, Home Affairs);
- every `[S]` fact as `"secondary"`;
- contradictions (WA ranking order, ACT 3 vs 6 months, SA priority sectors) as `"secondary"`, with both readings in `note`.

Occupation lists are referenced via `OccupationListRef`:

| Jurisdiction     | Reference                                                  |
| ---------------- | ---------------------------------------------------------- |
| WA, SA, QLD, NSW | their imported lists                                       |
| VIC              | `all-federally-eligible`, as `"secondary"`                 |
| ACT, TAS, NT     | `"secondary"` / `none-published`, as the research supports |

Programs the research shows as closed must be recorded with `status: "closed"`, using the research's `verification` for each:

- NSW 491;
- NT 190;
- NT offshore;
- VIC 491;
- TAS offshore 491.

- [ ] **Step 1: Write failing tests.**
  - Every state and visa pair exists (16).
  - Every rule passes the guards.
  - Every ACT/VIC/TAS/NT eligibility-deciding rule is `"secondary"`.
  - NSW 491 is closed.
  - Every `listId` resolves to an imported list or a documented `none-published`.
- [ ] **Step 2: Run** the test. Expect FAIL.
- [ ] **Step 3: Write the rule files.** Keep each under 250 lines, and comment any judgement with a pointer to the research doc section.
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 5: Commit** `data: curate 2026–27 state nomination rules from the research`

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

### Task 8: State tile and panel view-models

**Files:**

- Create: `src/lib/state-outlook/view.ts`
- Test: `src/lib/state-outlook/view.test.ts`

**Interfaces:**

```ts
export type Tile = {
  state: StateCode;
  group: Group;
  label: string;
  fragment: string;
  href: string; /* "#state-<visa>-<code>" */
};
export type StatePanel = {
  id: string;
  heading: string; // "Victoria · 190"
  groupLabel: string;
  canApply: {
    text: string;
    mark: "✓" | "✗" | "?";
    source: string;
    checkedNote: string;
  }[]; // checkedNote "checked 17 Nov 2026" | "Last checked 1 Sep 2026; may have changed" | "Not yet verified on the official page"
  data: string[]; // evidence sentences (competitors at or above, per-month invitations at or below, peak, score range); masked → countInSentence / "under 20 invited, so may be zero"
  pointsThere: string[]; // federal points with nomination; own-system line when the rules name one: "Victoria ranks with its own points test (not calculated here)."
  resultsLink: { href: string; text: string } | null; // the state's published results page, if any, as "past results, not a prediction"
  footer: string; // "Not advice to apply. Rules change; check the official page."
};
export function buildTiles(outlook: Outlook): Tile[];
export function buildStatePanel(
  outcome: StateOutcome,
  rules: StateVisaRules,
  points: number,
  asOf: string,
): StatePanel;
export function buildAnyStateTile(
  anyState: StateSide,
  visa: StateVisa,
): { label: string; fragment: string };
```

**Fragments:**

| Case                                  | Fragment                                               |
| ------------------------------------- | ------------------------------------------------------ |
| Confirmed peak at or below your score | "at least {n} invited at ≤{points} (as at {Mon YYYY})" |
| Masked                                | "under 20 invited, so may be zero"                     |
| None                                  | "no invitations recorded at your score in 12 months"   |
| Not open                              | the short reason                                       |

- [ ] **Step 1: Write failing tests.**
  - **Review Focus 5:** an all-masked state gives the `watching` fragment "under 20 invited, so may be zero".
  - A stale rule's `checkedNote` reads correctly.
  - A secondary rule says "Not yet verified on the official page".
  - The VIC own-system line is present.
  - `BANNED_COPY` matches nothing.
- [ ] **Steps 2–4:** RED, implement, `npm run check && npm run build`.
- [ ] **Step 5: Commit** `feat(state): build state tiles and panels`

### Task 9: "Sharpen my state outlook" form

**Files:**

- Create: `src/components/report/sharpen-form.tsx` and `sharpen-form.module.css`
- Modify: wherever the report receives `onEdit`/profile updates, so the form can update the profile (follow the existing check-flow update pattern and opt-in saving)

**Behaviour:**

- An optional, collapsible form under the state outlook titled "Sharpen my state outlook".
- It asks only the questions whose answers would change at least one tile for the current occupation and visa. Each question names the states it affects ("Answers WA and SA questions").
- It uses Mantine inputs with labels and helper text, and every field can be cleared.
- Answers update the outlook live.
- It must never put answers in the URL.
- On `/sample/` it is read-only: shown with the sample's answers and a note.

**Interface:** `SharpenForm({ questions, profile, onChange })`. `questions` comes from a pure `questionsNeeded(outlook): Question[]` in `src/lib/state-outlook/view.ts`, which needs a unit test.

- [ ] **Step 1: Write a failing unit test** for `questionsNeeded`: questions are de-duplicated across states and list the states each affects.
- [ ] **Steps 2–4:** implement the function and the component; run `npm run check && npm run build`.
- [ ] **Step 5: Commit** `feat(state): add the optional sharpen-my-outlook questions`

### Task 10: State outlook UI (tiles and panels)

**Files:**

- Create: `src/components/report/state-outlook.tsx`, `state-tile.tsx`, `state-panel.tsx`, and CSS modules

**Behaviour, following the E2 mockup and spec §4:**

- **Section:** `<section id="state-outlook">` with an h2. A 190 / 491 segmented control (Mantine) appears on screen and is hidden in print, where both visas' grids are printed one after the other.
- **Hash targets:** `#state-outlook-190` and `#state-outlook-491` select the matching visa on load.
- **Grid:** 4 × 2 tiles, 2 × 4 at 390px.
- **Tiles:**
  - the colour encodes the group, using design tokens and AA contrast;
  - the group label is always shown as text;
  - each tile is a button or link that opens or scrolls to its panel.
- **"Any state" tile:** separate and smaller.
- **Panels:** below the grid, every panel is visible in print. On screen they can be collapsed with `<details>` (the global print rule already expands them).
- **Order:** group order, then evidence.

- [ ] **Step 1: Implement.** Prove the CSS modules compile with a temporary import plus build, then revert it.
- [ ] **Step 2: Run** `npm run check && npm run build`.
- [ ] **Step 3: Commit** `feat(state): add the state outlook tiles and panels`

### Task 11: Integration, scorecard summary, removing old state cards, docs and browser checks

**Files:**

- **Modify:**
  - `src/components/report.tsx`: replace the old "State pathways" section with `StateOutlook` plus `SharpenForm`.
  - `src/lib/report/scorecard.ts`: the 190/491 card sentence becomes `Outlook.summary`; ruling S1 is retired. Update its tests.
  - `src/lib/report/panel-nominated.ts`: `statesLink` becomes `#state-outlook-190` or `#state-outlook-491`, with text "See your state outlook".
  - The nav entry "State pathways" becomes "State outlook".
- **Data loading:**
  - rules, lists and the federal list are small, so client import is allowed;
  - add them to CLAUDE.md's allowed client imports;
  - keep each list under about 100 KB, or load lists per state if larger (decide and document).
- **Build warning:** a `prebuild` step prints `staleRules(stateRules, today, 45)` as a warning. It must not fail the build.
- **Docs:**
  - `docs/DATA.md`: a "State rules" section on sources, verification, staleness, the monthly re-verify routine and importer commands;
  - `docs/REPORT-COVERAGE.md`;
  - `docs/HANDOFF.md`;
  - `docs/STRATEGY.md` decision log: "State outlook shipped; ruling S1 retired".
- **Delete:** the now-unused `src/components/state-explorer.tsx` usage in the report, if unused elsewhere (`/states/` page: keep it or point it to the outlook explanation, and record the choice), and `src/data/states.ts` if unused.

Steps:

- [ ] **Step 1: Write failing tests** for the scorecard summary sentence change.
- [ ] **Step 2: Integrate.** Then run `npm run check && npm run build`.
- [ ] **Step 3: Browser verification.** Headless Chrome via CDP against `out/`, with no new dependencies.
  - **`/sample/` (ICT Business Analyst, onshore VIC):**
    - both grids render;
    - VIC/ACT/TAS/NT tiles read "Not yet verified";
    - NSW 491 reads "Not open to you now";
    - every tile opens its panel;
    - "Not advice to apply" is present.
  - **Nurse check flow:**
    - answering a Sharpen question moves at least one tile out of "Needs your answers";
    - the answers are not in the URL.
  - **Layout:** 390px with no overflow; print to PDF shows both grids and every panel; reduced motion is respected; no console errors.
  - **Screenshots:** save them to `.superpowers/sdd/2026-11-18-state-outlook/screenshots/`.
- [ ] **Step 4: Update the docs** listed above.
- [ ] **Step 5: Commit** `feat(report): show the state outlook and retire the interim state sentences`, then `docs: record the state outlook release`.
