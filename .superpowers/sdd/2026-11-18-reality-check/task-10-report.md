# Task 10 report: report integration, clean-up, docs and browser verification

Status: DONE_WITH_CONCERNS (small, listed at the end). Base 13a7399, branch roadmap/reality-check.

## Commits

- `fff95f6` feat(report): open the report with the reality check and visa panels
- `dc1759a` docs: record the reality-check release

(A first attempt committed the docs before the code because a `git add` pathspec for the already-`git rm`'d files failed and the deletions rode into the docs commit. I soft-reset that unpushed commit and re-committed in the brief's order. Nothing was pushed.)

## Implemented

- **Report order and nav** exactly as the brief: header, `#reality-check`, `#visa-189`, `#visa-190`, `#visa-491`, points, scenarios, timeline, states, compare, prepare, definitions. The nav list lives in `src/components/report/report-sections.ts` (two module-level arrays, so the nav observer effect has a stable dependency). Section labels ("05 / YOUR POINTS AUDIT") are numbered from the same list, so nav and labels always agree; when there is no occupation data the panels are omitted from both (points-only shows "02 / YOUR POINTS AUDIT").
- **View-models**: new pure `src/lib/report/report-view.ts` `buildReportView({occupationName, data, detailUnavailable, profile, asOf, skippedRounds})` → `{ scorecard, panels: PanelViews | null }`. Ruling S3 implemented there (`scenarioGains`: each scenario alone, `calculatePoints(applyScenarios(profile,[id],asOf),asOf).base − base`, label = title) and passed with `buildTimeline` events to `buildWhatCouldChange`. A thin adapter `src/components/report/report-view.ts` (`reportView`) maps `ReportOccupation` via the new `toScorecardData` (in `src/components/data/report-occupation.ts`; mapping exactly per the controller decision: ready → `{kind:"ready", core, detail: detail.status==="ready" ? detail.detail : null}`, loading → `{kind:"none", reason:"loading"}`, unavailable → `unavailableReason(...)`) and supplies `skippedRounds` from rounds-meta.
- **Panels**: `src/components/report/visa-panels.tsx` `VisaPanels` renders Panel189 + both PanelNominated when ready (also when the 189 pool is absent — unit-tested), a single `LoadingData` while loading, nothing when unavailable. The 189 `trend` prop is a `Trend189` (heading "Twelve months of published 189 totals", the existing `TrendChart`, and the R17 coverage caveat verbatim). Panel source line = the scorecard's `sourceLine` (snapshot date included).
- **Detail file failed** (not in the brief, found while wiring): `buildSameScore`/`buildEoisLikeYours` return `loading` for a null detail, which would spin forever after a failed fetch. `buildReportView` replaces those with "Published counts by submission month could not be loaded. Try again later." / "Published outcomes by submission month could not be loaded. Try again later." when `detailUnavailable`.
- **Carried T2(a)**: `scorecard.ts` stateSentence now says "Invitations for the last 12 months are not published for this occupation." when no month in the window was fetched (`activity.months.length === 0`). Unit test added (TDD).
- **Scorecard links without panels**: `ScorecardCard.href` is now `string | null`; null for `kind: "none"`, and the card omits the "details" link, so points-only/unavailable reports have no dead `#visa-*` links. Test added.
- **Carried T6**: `/sample/` uses `requireDetail` (like `requireCore`). Verified by temporarily moving `src/data/occupations/261111.detail.json` away: the build fails with `Error: Sample report needs the detail file for 261111` / `Export encountered an error on /sample/page`. File restored; `git status src/data` clean.
- **Points audit**: extracted to `src/components/report/points-audit.tsx` (+ tiny module CSS for spacing). The eligibility notice moved, wording unchanged, to the top of the section (after the h2). The old score cards' "Partial score · answers incomplete" information is kept in the audit's lead: "Your self-reported score is {base} federal points (partial: some answers are incomplete), separated into the categories behind it."
- **Scenarios**: extracted to `src/components/report/scenarios-section.tsx` with its own state. The "Compare this scenario in the pool" button is removed (its target, the pool controls, no longer exist); caption now ends "The reality check and visa panels above use your current score."
- **Removed**: `pool-section.tsx`, `rounds-section.tsx`, the three score cards, `.report-intro` paragraph, `ReportOccupation.pool` and `poolUnavailableMessage` (+ their tests), and the dead global CSS (`.score-cards`, `.score-card*`, `.report-intro`, `.pool-controls*`, `.report-data-layout*`, `.report-number`, `.pool-metric-label`, `.report-notes`, `.trend-heading*`, including their responsive and print copies; 161 lines). Kept `trend-chart.tsx`, `compare-section.tsx` (now takes a `label` prop), `pool-chart.tsx` (homepage explorer still uses it), `.rounds-table` (trend chart's table uses it).
- **Footer** gains the 189 round sources ("current results and previous rounds"), which previously lived only in the removed rounds section. The "What this report can and cannot tell you" list mentions the reality check and EOI outcomes.
- **Print fixes** (carried T7/T8, verified):
  - Reveal: the existing `@media print [style*="opacity"]` rule works (opacity 0 on screen before scroll → 1 in print).
  - Closed `<details>`: the existing rule (children `display:block; content-visibility:visible`) is NOT enough in Chrome 157 — a real `Page.printToPDF` omitted the "See all rounds" list even though the list's box reported a height under emulated print media. Added `details:not([open])::details-content { content-visibility: visible !important; display: block !important; }` in globals.css print block; confirmed in the built CSS and in a regenerated PDF (all rounds printed).
  - The trend chart's "View monthly figures" accordion moved out of `.report-section`, so the print rule `.report-section .mantine-Accordion-panel` no longer reached it; widened to `.report-sheet .mantine-Accordion-panel`.
  - Pagination: `.block { break-inside: avoid }` in panel-189.module.css made whole blocks (trend, EOIs table) jump pages leaving near-blank pages; replaced with `.h3 { break-after: avoid }`. In visa-panels.module.css print rules let the trend chart split between the SVG and its table and keep its heading with it.

## report.tsx line count

716 before → 537 after (−179). Still over the 250 guideline; the timeline, states, prepare and definitions sections remain inline (not touched by this task; no big-bang rewrite).

## `rg "PoolSection|RoundsSection|score-card" src`

No matches.

## Tests and TDD evidence

- Scorecard (carried T2a + null href). RED: `npx vitest run src/lib/report/scorecard.test.ts` → 2 failed / 9 passed:
  ```
  × says invitations are not published when no month in the window was fetched
  × handles occupations with no data
  AssertionError: expected 'No 491 invitations recorded for this …' to be 'Invitations for the last 12 months ar…'
  Expected: "Invitations for the last 12 months are not published for this occupation."
  Received: "No 491 invitations recorded for this occupation in the last 12 months."
  AssertionError: expected [ '#visa-189', '#visa-190', …(1) ] to deeply equal [ null, null, null ]
  ```
  GREEN: 11/11.
- report-view (new). RED: `npx vitest run src/lib/report/report-view.test.ts` → `Failed to load ./report-view` (no tests ran). GREEN: 7/7 (ready panels + points; EOI month used; S3 "Community language · +5"; 190/491 panels without a 189 pool; detail loading; detail failed; no panels for loading/notIndexed/noData).
- toScorecardData. RED: `npx vitest run src/components/data/report-occupation.test.ts` → 4 failed / 5 passed (`TypeError: toScorecardData is not a function`; the two toReportOccupation tests failed on the removed `pool` field). GREEN: 9/9.
- No component tests for presentational components (ruling S9); covered by the browser run.
- Final: `npm run check` passes (Prettier, ESLint, tsc, Vitest 37 files / 308 tests). `npm run build` passes (all routes static).

## Browser verification (headless Chrome 157 via CDP, Node built-in WebSocket, no new deps)

Served `out/` with `python3 -m http.server 3017 --bind 127.0.0.1 --directory out` and Chrome `--headless=new --remote-debugging-port=9333` (both in background, both stopped afterwards). Viewports set with `Emulation.setDeviceMetricsOverride` (`innerWidth === 390` confirmed). The check flow was completed by interaction (typed dates, Mantine selects, radio, Continue ×3, "Open my overview"). Scripts kept at `/private/tmp/claude-501/-Users-aveomac-aveo-projects-landfall/bf2c0e48-6228-44dd-99b2-f35c431c2c58/scratchpad/view/{verify,states,cdp,flow}.mjs`. Final run against the final build: **48/48 + 9/9 PASS**.

| Check | Result |
| --- | --- |
| /sample/ headline is the "none" template ("189 hasn't listed ICT Business Analyst in its last four rounds. Your 190 and 491 prospects depend on state nomination.") | PASS |
| /sample/ 189 card: "865–903" ahead, "1,093" at your score | PASS |
| /sample/ all three panels render | PASS |
| Report order = brief; nav mirrors it with Reality check first | PASS |
| Eligibility notice at the top of the points audit, wording unchanged | PASS |
| Old score cards, #pool, #rounds gone | PASS |
| Clicking "189/190/491 details" moves focus to `#visa-189/190/491` | PASS (3/3) |
| Enter on "491 details" (keyboard) moves focus to `#visa-491` | PASS |
| /sample/ 1440: no horizontal overflow; no console errors | PASS |
| /sample/ 390: no horizontal overflow; cards stack 189 (y 1058), 190 (1392), 491 (1775), same left edge | PASS |
| /sample/ 390: no reality-check/panel text below 12px (excluding the legacy trend SVG) | PASS |
| Print emulation: Reveal-wrapped scorecard opacity 1 (was 0 on screen, never scrolled) | PASS |
| Print: nearby-months table visible | PASS |
| Print: all-rounds list in the closed `<details>` visible (`::details-content` content-visibility visible) — also confirmed in a real A4 PDF | PASS |
| Print: trend's monthly-figures table visible; every accordion panel displayed; every section has height | PASS |
| Reduced motion (1440 and 390): scorecard visible, no console errors on /sample/ | PASS |
| /check/?occupation=254499 (1440 and 390, reduced motion at 390): preselected; EOI date 14 Feb 2025; sentence "Of the 887–906 Registered Nurses nec EOIs from Feb 2025, as at Oct 2026: 175 are invited and 60 have a visa application lodged."; stats Invited 175 / Lodged a visa 60 | PASS |
| Nurse: headline "Registered Nurses nec was listed in each of the last four 189 rounds. The latest published cut-off was 70 points; you have 75."; all three panels; no overflow; no console errors | PASS |
| Points only (picked "Other occupation · points check only" in step 1): "too limited to compare" headline; no pool numbers; no details links; no panels; nav/labels renumbered consistently | PASS |
| Loading (occupation files held via `Fetch.requestPaused`): loading headline, one "Loading published data…" placeholder in place of the panels, no counts on cards; panels appear after release; no console errors | PASS |
| Detail file blocked: same-score and EOIs-like-yours say "could not be loaded", no endless loading, 190/491 panels render | PASS |

Note on `?occupation=other`: the check only preselects codes in the index, so "other" is not preselected by URL; I chose "Other occupation" in the picker during the flow.

## Screenshots (full page)

- `/Users/aveomac/aveo-projects/landfall/.superpowers/sdd/2026-11-18-reality-check/screenshots/sample-desktop-1440.png`
- `/Users/aveomac/aveo-projects/landfall/.superpowers/sdd/2026-11-18-reality-check/screenshots/sample-mobile-390.png`
- `/Users/aveomac/aveo-projects/landfall/.superpowers/sdd/2026-11-18-reality-check/screenshots/nurse-check-desktop-1440.png`
- `/Users/aveomac/aveo-projects/landfall/.superpowers/sdd/2026-11-18-reality-check/screenshots/nurse-check-mobile-390.png`
- Bonus: `/Users/aveomac/aveo-projects/landfall/.superpowers/sdd/2026-11-18-reality-check/screenshots/sample-print-a4.pdf` (headless print of /sample/, A4)

## Docs

- `docs/REPORT-COVERAGE.md`: intro; rows for the reality check (with S1), points audit, scenarios (pool control removed, "what could change" added), 189 pool (189 panel), rounds (tiles + all rounds), 190/491 (panels, monthly invitations, render without a 189 pool), 12-month trend ("Kept in the 189 panel, with its caveat"), new "What happened to EOIs like yours" row; data-sources loading/empty-state paragraph. Prettier re-padded the whole table, so the diff is wide.
- `docs/HANDOFF.md`: new "Latest: reality check complete (18 November 2026)" resume point; roadmap list marks step 2 done; step 3 next; follow-ups listed.
- `docs/STRATEGY.md`: decision-log row for ruling S1 (18 Nov 2026); "Last updated" → 18 November 2026.

## Files changed

New: `src/lib/report/report-view.ts` (+test), `src/components/report/{report-view.ts, report-sections.ts, visa-panels.tsx, visa-panels.module.css, points-audit.tsx, points-audit.module.css, scenarios-section.tsx}`.
Modified: `src/components/report.tsx`, `src/components/data/report-occupation.ts` (+test), `src/lib/report/scorecard.ts` (+test), `src/components/report/{scorecard.tsx, compare-section.tsx, panel-189.module.css}`, `src/app/sample/page.tsx`, `src/app/globals.css`, docs above.
Deleted: `src/components/report/pool-section.tsx`, `src/components/report/rounds-section.tsx`.
`check-flow.tsx` needed no change.

## Self-review

- report.tsx shrank; logic lives in `src/lib` (tested) and small components. One exported component per new file. No `any`, no eslint-disable added.
- Copy checked against the banned list: new strings ("could not be loaded. Try again later.", "Invitations for the last 12 months are not published…", "The reality check and visa panels above use your current score.") contain no banned words; numbers in panels sit under the snapshot-dated source line.
- `reportView` runs every render (cheap pure functions); not memoised because `toReportOccupation` creates a new object each render in the check flow.

## Concerns / follow-ups (not fixed; outside the brief or owned by earlier tasks)

1. **loadFailed headline**: when a published occupation's core file fails to load, the scorecard says "Published SkillSelect data for X is too limited to compare" and cards say "No published data to compare" — the existing reason logic treats `loadFailed` like `notIndexed`. A network failure is not a data fact; suggest a "could not be loaded" headline (scorecard.ts, small).
2. **CLAUDE.md is stale** ("its pool, rounds and comparison sections live in `src/components/report/`"). I did not edit CLAUDE.md (project configuration); the controller may want to update that line.
3. Dates print "Sept" (en-GB `formatDate`, deferred T3 minor) — visible in the round tiles ("5 Sept 2024").
4. The legacy `TrendChart` axis labels and caption (8–10px) are small at 390px; it is the existing chart moved as-is.
5. `report.tsx` is still 537 lines; the remaining inline sections (timeline, states, prepare, definitions) are candidates for extraction when next touched; "State pathways" is replaced in step 3 anyway.
6. Removing the "Compare this scenario in the pool" button is a small behaviour change (its target no longer exists); recorded in REPORT-COVERAGE.

---

## Fix report: ruling S10

Commit: `92de400` fix(report): honest load-failure headline, Sep dates and updated architecture notes. I kept the subject line the controller asked for, but the commit does not contain the architecture notes; see item 2.

### 1. Load-failure headline (done)
- `src/lib/report/scorecard.ts`: `reason: "loadFailed"` now has its own headline: "Published data for {occupation} could not be loaded. Your points breakdown is below." The cards stay points-only, with neutral chips, the sentence "Published data could not be loaded.", no counts and no details link. `notIndexed` and `noData` keep the "too limited" headline. `loadFailed` was added to the banned-copy sweep.
- RED: `npx vitest run src/lib/report/scorecard.test.ts src/lib/migration.test.ts` gave 2 failed / 43 passed:
  `Expected: "Published data for Software Engineer could not be loaded. Your points breakdown is below." Received: "Published SkillSelect data for Software Engineer is too limited to compare. …"`
- GREEN: all pass.
- Browser check: I blocked `/data/occupations/254499.json`, completed the check, and got the headline "Published data for Registered Nurses nec could not be loaded. Your points breakdown is below." The three cards show the could-not-load sentence and points only. No panels render. PASS.
- Note: the neutral chip label on the 189 card is still "No data", which is the existing label for kind "none". That is arguably imprecise for a failed load. I left it as is because the ruling covers only the tone. Changing it to "Not loaded" would be a one-line change if wanted.

### 2. CLAUDE.md (not done; needs the user's approval)
My operating rules do not allow an instruction from another agent to authorise edits to CLAUDE.md. Only the user can. Suggested replacement for the `UI in src/components/` bullet's report sentence, for the user or controller to apply:
> `report.tsx` is the generated report, shared by `/check/` and `/sample/`. It opens with the reality-check scorecard (`report/scorecard.tsx`), then the 189 panel (`report/panel-189.tsx`, which includes `report/trend-chart.tsx`) and the 190/491 panels (`report/panel-nominated.tsx`), all wired through `report/visa-panels.tsx`. The occupation comparison is `report/compare-section.tsx`. Their view-models are pure functions in `src/lib/report/` (`report-view.ts` builds them all from one profile and occupation).

### 3. Sep dates (done)
- `src/lib/migration.ts`: `formatDate` now builds `"{d} {Mon} {yyyy}"` from an exported `MONTH_NAMES` array and UTC parts, not from locale output. `src/lib/report/copy.ts` `formatMonth` reuses `MONTH_NAMES`, which removes its duplicate array.
- RED (same run as above): `Expected: "5 Sep 2024" Received: "5 Sept 2024"`. GREEN: all pass. New assertions cover 5 Sep 2024, 4 Jun 2026 and 1 Jan 2025. The existing date tests still pass.
- Browser check: `/sample/` now shows "5 Sep 2024" and "30 Sep 2027", with no "Sept" anywhere. PASS.
- Not changed: the legacy `trend-chart.tsx` axis labels still use `toLocaleDateString("en-GB", {month: "short", year: "2-digit"})`. They could print "Sept 26" when September falls on a labelled tick. That does not happen with the current data (the ticks are Nov, Feb, May, Aug and Oct).

### Verification
- `npm run check` passes (37 files, 310 tests). `npm run build` passes.
- Headless Chrome against the rebuilt `out/`: S10 checks 4/4, the full regression script 48/48, and loading/failed-detail 9/9. The server and Chrome were stopped afterwards.
- Both `/sample/` screenshots were refreshed, because the visible "Sep" text changed (`screenshots/sample-desktop-1440.png`, `screenshots/sample-mobile-390.png`).

---

## Fix report: HANDOFF follow-ups

Commit `fbd7db6` docs: correct the step 2 handoff follow-ups.

`docs/HANDOFF.md`: I removed the two follow-ups that 92de400 fixed ("Sept" dates and the "too limited" headline on a failed load). I added the three that are still open:
- the trend axis uses locale month names, so a September tick could read "Sept";
- the "No data" chip still shows on a failed load;
- `report.tsx` (537 lines) is still over the length guideline.

The existing note that the trend axis labels are small at 390px stays. `npm run format:check` passes.
