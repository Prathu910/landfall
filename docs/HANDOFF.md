# Resume here

## Latest: MigrateLens brand and homepage shipped (18 November 2026)

The brand and homepage plan is done on branch `brand/migratelens` (spec `docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md`, ledger `.superpowers/sdd/2026-11-18-migratelens-brand-and-homepage/progress.md`). The site is renamed MigrateLens everywhere in rendered HTML; the old storage key is migrated and cleared (ruling B3). New brand tokens, Newsreader + Inter, the C1 logo, favicon and OG image; a 12px text floor under test; a rebuilt homepage (two doors, try-it, three questions, FAQ) with a Stageshow hero demo. "Worth watching" is slate. Where things live: `CLAUDE.md`, "Brand" and "Homepage".

Next: roadmap step 4, SEO foundation and occupation pages (`robots` stays `noindex` until the founder launches). Known follow-ups: not checked in Safari, Firefox or on touch (the demo poster scales with `tan(atan2())`); the poster CSS repeats the 576/720/436/358/660 layout literals with no test pinning them to `demo-layout.ts`; the fixed demo frame could overflow with more profile categories; `toPoolOccupation` in `src/lib/data/legacy.ts` is now used only by tests; `EOI_CAVEAT` duplicates a scorecard string; `OutcomeBar` shows a double label; a doubled full stop in one doc comment; `verifyPng` checks size only; merge the duplicate mobile media blocks in `globals.css`.

## Latest: state outlook shipped (18 November 2026)

Roadmap step 3 is done on branch `roadmap/reality-check`. The report order is now: header, reality check, 189 / 190 / 491 panels, **state outlook** (`#state-outlook`) with the optional **"Sharpen my state outlook"** questions under it, then points audit, scenarios, timeline, occupation context, get organised and definitions.

- **State outlook.** A 190 / 491 switch (both print, one after the other), a 4 × 2 grid of tiles (2 × 4 at 390px) and a separate "Any state" tile, then a `<details>` panel per state. Groups: Strongest evidence, Worth watching, Needs your answers, Not yet verified, Not open to you now. `#state-outlook-190` / `#state-outlook-491` select a visa; a tile opens, scrolls to and focuses its panel. Pure logic in `src/lib/state-outlook/` (`stateOutlook`, `buildTiles`, `buildStatePanel`, `questionsNeeded`); `src/lib/report/state-outlook-view.ts` assembles both visas inside `buildReportView` (evidence read at the 190 / 491 points with nomination). Without occupation data (loading, no data, points only) the outlook and the questions are left out and the scorecard explains why.
- **Scorecard.** The 190 and 491 card sentences are now the outlook summaries; ruling S1 (national-invitations sentence) is retired. The 190 / 491 panels link to "See your state outlook".
- **Removed** from the report: the "State pathways" overview cards. `/states/` keeps them (`src/components/state-explorer.tsx` and `src/data/states.ts` still feed that page), so the page keeps working as a general directory; pointing it at the outlook is a later choice.
- **Sharpen answers** go through `check-flow.tsx`'s update path (`updateMany`), so the existing opt-in saving applies; nothing goes into the URL. Answered questions stay listed (answered checks carry their `field`, and `questionsNeeded` lists open and answered fields from the profile alone), so a saved answer can be changed or cleared after a reload or Edit. Changing the state or onshore answer clears the answers about where you live (`resetStateRelativeAnswers` in `src/lib/state-answers.ts`, ruling P25), so months in one state are never read as months in another; changing the occupation clears the work answers (P30). On `/sample/` the form is read-only.
- **Data.** Rules in `src/data/state-rules/2026-27/`, lists and the federal list as JSON, all imported on the client through `src/components/data/state-rule-data.ts` (the lists and federal list total about 11 KB gzipped). First-load JS grew by about 29 KB gzipped on `/check/` and 53 KB on `/sample/`. `npm run build` prints a staleness warning (never a failure) for rules checked more than 45 days ago. Routine and sources: `docs/DATA.md`, "State rules".
- **Verified:** `npm run check`, `npm run build`, and headless Chrome over CDP against `out/`. On `/sample/`: both grids, VIC / ACT / TAS / NT "Not yet verified" with evidence, NSW 491 "Not open to you now", 16 tiles open and focus their panels, footer in every panel, scorecard summaries, read-only questions, 390px with no overflow, reduced motion, print media and a printed PDF with both visas and all 16 panels. Nurse check (QLD): answering "8 years in the last 10" moves WA 491 from "Needs your answers" to "Strongest evidence" live, with saving on (stored, then cleared by "Clear this answer") and off (nothing stored); the URL stays `/check/`. No console errors. Screenshots: `.superpowers/sdd/2026-11-18-state-outlook/screenshots/task11-*`.

- **Final review fixes (18 Nov 2026).** A sweep of about 213,000 real outcomes found input gaps, now closed. Every stream starts with the points check: an ineligible check (age 45 or over, an expired English test or skills assessment, named from `PointsResult.ineligibleReasons`) or under 65 points for the visa makes every state "Not open to you now"; an incomplete check never passes, and a missing English test or skills assessment date is asked in place in "Sharpen my state outlook" (rulings P27, P32; the report passes the whole `PointsResult`). The WA and SA graduate study rules, and SA's months after the course, are `secondary` because the questions cannot test them (P28). Panel lines show why a rule failed or can't be confirmed; a not-open panel lists each stream's first failing finding (P29). Changing the occupation clears the work answers (P30). Experience rules name the work each state counts and never fail on an answer below a wider definition (P31). QLD's Notice of Assessment gate and Queensland employer rule show as restrictions, and the QLD importer stops if the onshore Building and Construction column disappears. Verified with `npm run check`, `npm run build`, the reviewer's sweep (no pass while ineligible or under 65; every not-open stream has a verified, fresh fail) and headless Chrome against `out/` (screenshots `final-fix-*`). Report: `.superpowers/sdd/2026-11-18-state-outlook/final-fix-report.md`.

Next: roadmap step 4, SEO foundation and occupation pages. Known follow-ups: browser-verify ACT, VIC, TAS and NT (founder to decide how); import WA's sector column so the WA General stream can be checked (ruling P12); `report.tsx` (500 lines) and `check-flow.tsx` are still over the size limit; minor items in `.superpowers/sdd/2026-11-18-state-outlook/progress.md`.

## Earlier: reality check complete (18 November 2026)

Roadmap step 2 is done on branch `roadmap/reality-check`. The report now opens with the reality check, then a detail panel for each visa:

1. Header.
2. **Reality check** (`#reality-check`): a factual headline from the last four 189 rounds, three visa cards (chip, one sentence, your points, "Ahead of you" on 189 or "Higher score (national pool)" on 190/491, "At your score", a details link), the queue caveat with a link to `/methodology/#pool`, and the pool-overlap note.
3. **189 panel** (`#visa-189`): where you stand (with the 12-month trend and its coverage caveat), among your score, recent rounds (all rounds on tap), what happened to EOIs like yours (nearby months on tap), what could change your position.
4. **190 and 491 panels** (`#visa-190`, `#visa-491`): where you stand in the national pool and 12 months of recorded invitations, linking to the state pathways.
5. Points audit (the eligibility notice now opens it), scenarios, timeline, state pathways, occupation context, get organised, definitions.

- The old score cards, pool section and invitation-history section are gone. View-models live in `src/lib/report/` (`report-view.ts` builds them all from one profile and occupation); components in `src/components/report/`. The nav numbers follow the sections actually shown: without occupation data the panels are left out and the scorecard explains why.
- Final-review honesty fixes (S11–S16): the queue caveat under the scorecard and every queue bar; "Invited, not yet lodged" and the current-status note in EOIs like yours; masked same-score counts say they may be zero; an EOI month after the snapshot says it is not published yet (in both the same-score block and EOIs like yours); points-only checks say "You chose a points check only…"; 190/491 invitations are labelled "all states". A failed load's 189 chip says "Not loaded".
- Ruling S1: until step 3, the 190/491 card sentences summarise national invitations, not a state outlook (decision log in `docs/STRATEGY.md`).
- Print: closed `<details>` content (all rounds) and the trend's monthly table now print; panel blocks may break across pages, headings stay with their content.
- Verified: `npm run check`, `npm run build`, and headless Chrome against `out/` at 1440px and 390px — `/sample/` (ICT Business Analyst at 90: "none" headline, 865–903 ahead, 1,093 at your score, all three panels), the nurse check (`?occupation=254499`, EOI date 14 Feb 2025: Feb 2025 cohort, 175 invited, 60 lodged), points only, print media and a printed PDF, reduced motion, loading and failed-detail states, details links moving focus to the panels, no console errors. Screenshots for the founder are in `.superpowers/sdd/2026-11-18-reality-check/screenshots/`.

Next: roadmap step 3, the 190/491 state outlook (same spec, sections 3 onward). It replaces the "State pathways" section and the S1 card sentences. Known small follow-ups: the legacy trend chart's axis labels are small at 390px and still use locale month names, so a September tick could read "Sept"; on a failed load the 189 card's neutral chip still says "No data"; `report.tsx` (537 lines) is still over the length guideline.

## Earlier: data foundation complete (17 November 2026)

Roadmap step 1 is done on branch `roadmap/foundation`. The site is fed by one validated, versioned dataset covering every occupation: snapshot `skillselect-2026-10-31`, 493 occupations (479 with published EOIs), produced by the TypeScript importer in `scripts/import/`. The Python importer and the 11-occupation `pool.json` / `report-evidence.json` are gone; the two files are kept as test fixtures, and the new pipeline reproduces them with zero differences. `docs/DATA.md` is the data dictionary; read it before using the data.

- The UI looks and behaves as before for the original 11 occupations. The one copy change is the 12-month trend caption: the net-change sentence was replaced by a coverage caveat (ruling R17).
- Final-review fixes: multi-month data now records every fetched month (`{}` = zero) and accessors use calendar windows from `asAt` (R14, records at `schemaVersion: 2`); the 2020-21 unit-group 189 rounds are skipped with reasons instead of being misread, and `rounds.json` is `{ rounds, skipped }` (R15); the legacy test regenerates 2026-10 from `data/raw` (R16); a short Qlik table read now stops the import. All 493 occupations are now searchable in the homepage explorer, the check's occupation picker and the report's comparison picker.
- Pages server-load the occupations they render statically (Registered Nurses nec on the homepage; Registered Nurses nec and Registered Nurse (Aged Care) on `/sample/`, since 19 Nov 2026). Other occupations are fetched one file at a time from `/data/occupations/<code>.json`, showing "Loading published data…" meanwhile.
- Occupations with no published 189 pool, or no published EOIs, keep the points check and say that no pool comparison is available.
- Verified: `npm run check`, `npm run build`, and a headless-Chrome run against `out/` (explorer search and loading state, the four-step check from `?occupation=233211`, the sample report, print media, 390px width, reduced motion, no console errors).

Next: roadmap step 2, the reality-check section (`docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md`). Open data questions are listed under "Known limits" in `docs/DATA.md`, notably the SUBMITTED coverage window: re-check it after the 11/2026 import.

## Earlier checkpoint

17 November 2026. The user requested pushing the current work to GitHub and continuing later. This checkpoint contains the premium redesign and expanded evidence-backed report. No new preview deployment was requested at this stopping point; the existing private Sites preview still has the previous release.

## Implemented

- Mantine 9 controls and mobile drawer; Motion feature tabs, step/score transitions and section entrances, with reduced-motion support.
- Redesigned landing page, guided check, report workspace and state directory.
- Report credential scenarios, explicit scenario-to-pool action, three visa pools, twelve monthly 189 occupation totals, six actual invitation rounds, personal dates, state summaries, occupation comparisons, general checklist and glossary.
- Reproducible official-data importer and source/coverage documentation (since replaced by the all-occupation importer; see `docs/DATA.md`).
- Review fixes for bounded chart input, printing collapsed content, expired-credential scenarios and SVG title hydration.

## Verified

47 domain/data tests pass, TypeScript passes and the static production build passes. Production dependency audit reports no vulnerabilities. Original SPEC and four HTML references remain byte-for-byte unchanged.

Production browser checks exercised homepage searchable occupation, keyboard score slider and feature tabs; empty validation; calendar selection; full four-step sample check; 90-point report; credential scenario and applying it to the pool; 190/491 score defaults; oversized pasted input; checklist and glossary; edit, opt-in saving, restoration and clear. No JavaScript page errors in the completed flow. Mobile navigation and sample-report width passed a 390px smoke check; collapsed glossary content is visible in production print media. A decorative halo causing homepage horizontal overflow was corrected.

## Continue next time

As of 17 November 2026, follow the approved roadmap in `docs/STRATEGY.md`, in order:

1. Data foundation: done.
2. A reality-check section in the report: done (see "Latest" above).
3. A 190/491 state outlook, covering rules, evidence and points, ranked into groups: done (see "Latest" above).
4. SEO foundation and occupation pages for every occupation.
5. Polish: readability, copy, sample report, `npm ci` lockfile.
6. Content engine.
7. Monetisation, with lawyer review first.

The earlier QA items still apply as part of step 5: mobile/tablet visual QA, print pagination and step-to-step scrolling under the sticky header. Preserve `.openai/hosting.json` when publishing.

`docs/REPORT-COVERAGE.md` records every original report section and the evidence or product dependency behind each remaining gap. `docs/DESIGN.md` records the design approach and library choices. Exact queue positions, forecast waits, percentage chances and current ceiling utilisation remain unsupported and are not fabricated. History-based outcome counts and historical waits are now planned; see `docs/STRATEGY.md`.
