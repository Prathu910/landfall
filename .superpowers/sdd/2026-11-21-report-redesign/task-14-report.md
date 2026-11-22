# Task 14 report: report sections and composition

Status: DONE_WITH_CONCERNS (concerns below are small; nothing blocks Task 15)
Commit: d6ee9ce feat(report): verdict-first report layout

## What I implemented

`Report` keeps its props. It now builds `buildOutlookView` once per profile/occupation (useMemo keyed on profile, asOf, status, core, detail; Sharpen answers change the profile and so rebuild the whole view) and renders, in spec 5 order:

1. `OutlookHero` (`#outlook`): who + whoDetail, h1, fact, `OurRead` (template text, "Written from the numbers in this report."), Best route / Estimated wait, why line, `DownloadPdfButton` (window.print, `no-print`), `BigStamp`. Phone: stamp first (max 230px), tiles for best route and wait, then why, Our read, button.
2. `VisaRow` (`#visas`): three `VisaStamp`s with title, caption, flag. Phone: rows with a 140px stamp (R24).
3. `ChartsSection` (`#charts`): `CutoffColumns` + `QueueSquares` (wide/narrow switch at 720 built in), dashed empty states; single column below 1024.
4. `RouteSection` (`#route`): `RouteLine` at >=1024px, `RouteList` below (R25).
5. `ImproveSection` (`#improve`): mode titles/subs from the mockup, banner (protect = very-strong colours, points-not-problem = not-invited), move cards with `ShiftStamps` and "Biggest jump", plain list, red deadline cards. Plain mode passes `labels=false`, so loss cards show no label chip; experience moves show no date.
6. `EvidenceSection` (`#evidence`, folded `<details>`): rounds since 2022 (Enough / Short by N / Not listed), 189 pool by points, cohort ("from a year ago" or "from your month" when lodged), 190 and 491 state tables (state, latest invited at or below, months of last 6, label chip, flag note), then the existing `StateOutlookSection` (wired to `onAnswer`), `CompareSection`, the 12-month `TrendChart` with its caveat, and a sources line (dashboard, rounds, methodology link).
7. `PointsPage` (`#points`): fields, category rows (detail stacks under each on phones), zero bonus categories in one row, three totals, the points warnings ("Assumptions behind your points", moved here from the old body), passport line (`aria-hidden`), photo placeholder hidden on phones.
8. `MethodNote` (`#method`), then `ReportFeedback` (screen only), then `ReportFooter`.

Loading shows "Loading published data…" in `#outlook`. Points-only shows "You have N points." with the view's line, then the points page and feedback (no stamp, chips or charts).

`SectionChips`: Outlook, Visas, Cut-offs, Route, Improve, Evidence, Points; sticky under the site header below 1024px. I added the token `--site-header-height` (88px, 74px at <=800px) in globals.css so the header and chips stay in sync. The sheet uses `overflow: clip` (not hidden), which keeps sticky working. All phone/tablet queries use `screen and (...)`.

New pure view-models (TDD), wired into `OutlookView`:
- `src/lib/outlook/evidence.ts` (`buildEvidence`): rounds, pool bars, cohort (reuses `buildEoisLikeYours` with the chosen month), state tables, empty sentences. View fields: `evidence`.
- `src/lib/outlook/points-page.ts` (`buildPointsPage`): fields, rows, zero line, totals, MRZ. View fields: `pointsPage` on `report` and `points-only`.
- `view.ts` also exports `ReportOutlookView`.

Removed from the report body and deleted, because nothing imports them any more: scorecard, data-says, visa-panels, panel-189.tsx, panel-nominated, scenarios-section, rounds-tiles, eois-like-yours.tsx, note-with-link, points-audit (+ their CSS modules). I kept `panel-189.module.css` (outcome-bar uses it), `outcome-bar`, `queue-bar`, `state-tile`, `components/report/report-view.ts` and all `src/lib/report/*` (homepage and occupation pages use them). Typecheck and build pass without the deleted files. The timeline, Get organised, definitions and the "What this report can and cannot tell you" accordion are gone from the body. The old side nav and the toolbar's Print button are gone too, because the hero now has Download PDF. The toolbar keeps the sample note and Edit answers.

## Tests and TDD evidence

- RED `npx vitest run src/lib/outlook/evidence.test.ts`, with the module moved aside: "Test Files 1 failed … no tests". The implementation was written before this run, so I moved it aside to get the RED.
- GREEN: 11 passed. One assertion yielded to the data (R2): Dev's states are a mix of `not-invited` and `not-open`, not all `not-invited`.
- RED `npx vitest run src/lib/outlook/points-page.test.ts`: "Cannot find module './points-page'". GREEN: 6 passed.
- RED view.test.ts (2 new cases: evidence/pointsPage on report, pointsPage on points-only): "2 failed | 32 passed". GREEN after wiring: outlook suite 330 passed. The banned-copy test now also covers evidence and points-page strings.
- `npm run check`: Prettier, ESLint and tsc are clean. 106 test files and 1197 tests pass. `npm run build` passes.

## Browser verification (out/, python http.server 3017, playwright-core scratch install, system Chrome, reducedMotion: reduce)

I didn't drive the real `/check/` flow for Priya and Rahul, because the email gate needs Supabase and Turnstile. As the dispatch allows, I added a temporary `src/app/dev-report/[id]/` page that rendered `Report` with each fixture profile and real core/detail at asOf 2026-11-21. I deleted it before committing, rebuilt, and checked that `out/` has no dev-report.
- All 8 fixtures (strong, middle/Priya, long, notinv/Rahul, below, nodata, none, lodged) and `/sample/` were checked at 390, 820 and 1280. Every run had: no horizontal scroll (scrollWidth === innerWidth, evidence opened); every section id present in order (outlook, visas, charts, route, improve, evidence, points, method); `document.getAnimations().length === 0`; no page errors. After one fix (below), no rendered text was under 12px, including SVG text at rendered scale.
- Fix made during verification: the existing TrendChart draws 12-unit text in a 600-unit box, which rendered at 5.8px on phones. Inside the evidence it now keeps a 600px minimum width and scrolls sideways within its card.
- Sticky chips: at 360/390 the chips stick at top 74 (header bottom 74), at 820 at 88, and at 1280 they're hidden. Tapping "Improve" lands the section just below the chips.
- Real `/check/` client path, "Try sample answers" → View sample report at 390: the report renders after the client fetch (h1 "You're at the front of the queue.", stamp "SUBCLASS 189, Very strong"), with 7 chips, the Sharpen inputs live inside the evidence, no errors and no horizontal scroll.
- Screenshots match the mockup's section order and structure for Priya (390, 820, 1280) and Rahul (1280).

## Concerns / deviations

1. Pool by points is a table of horizontal bars, not the mockup's vertical histogram. The mockup's bar labels are 10.5 units, which renders under 12px. The table also doubles as the chart's text alternative.
2. The mockup's guilloche background behind the hero is left out (decorative). Task 15 or a later polish could add it.
3. Inside the evidence, the existing state outlook, compare and trend keep their old (serif, newsprint) styling. They're unchanged components.
4. The state outlook's existing `Reveal` uses whileInView with amount 0.12. With all 8 state panels forced open it never reaches 12% and stays invisible. A user opens one panel at a time, so this only showed up in my forced-open test. The existing print rule forces opacity to 1.
5. Two sources can read differently for the same state: the evidence 190 table shows TAS "Oct 2026: under 58" (several masked score cells summed, R20), while the old state tile says "No invitations recorded at your score in 12 months". Both are honest readings of masked data, but a reader may see them as contradictory. Worth a look in final review.
6. globals.css still holds dead `.report-*` rules (report-nav, report-timeline, checklist and similar) and their print rules. I left them for Task 15, which owns print, rather than editing globals print CSS here.
7. The sample page now has two h1s (page head + hero), as the old report did.
8. Sharpen re-render: the profile flows through `onAnswer` into `useOutlookView`'s memo. I confirmed the inputs are live in the /check/ sample run, but I didn't script an answer change end to end.

## Files

Created (src/components/report/): outlook-hero, visa-row, charts-section, route-section, improve-section, evidence-section, cohort-evidence, rounds-table, pool-bars, state-tables, label-chip, points-page, method-note, report-footer, section-chips, download-pdf-button, our-read (.tsx), plus CSS modules: section, report, outlook-hero, visa-row, route-section, improve-section, evidence-section, evidence-tables, label-chip, points-page, method-note, report-footer, section-chips, download-pdf-button, our-read.
Created (src/lib/outlook/): evidence.ts(+test), points-page.ts(+test).
Modified: src/components/report.tsx (186 lines), src/components/report/report-sections.ts, src/lib/outlook/view.ts (+test), src/app/globals.css (header height token only).
Deleted: listed above.

## Fix round 1 (review findings), commit 1fd33b2

Changes:
1. **Masked state counts (Important).** `evidence.ts` state rows go through a new `latestText`, which adds " (may be zero)" whenever the latest count's min is 0. Priya's 190 TAS row now reads "Oct 2026: under 58 (may be zero)"; VIC still reads "Oct 2026: 36". Each table's sub now names the series: "{occupation} invitations issued each month, at or below your {N} points, over the last 6 months: the latest month with any, and how many months had some."
2. **Points-only footer (Important).** The points-only view gains `footer` (`footerText(dataMonth(noCore))`, so the month comes from the snapshot), and `report.tsx` renders `ReportFooter` on that path.
3. **Tablet hero.** I deleted the 760px block in `outlook-hero.module.css`, so only the 720px phone query stacks the hero (stamp first, max 230px). Tablets at 721–1023px keep two columns. The stamp column is `minmax(230px, 0.85fr)`, so at 721px it sits exactly inside the band instead of 5px into the padding.
4. **Points page dates.** `migration.ts` now exports two string wrappers over its internal helpers: `addYearsToDate` (over `addYears`) and `assessmentEndDate` (over `assessmentEnd`). I wrapped them because the module's other exports work on YYYY-MM-DD strings, not `Date` objects. `points-page.ts` uses both and its own `yearsLater` copy is gone. An assessment past its end date reads "Expired {date}", like English.
5. **Method note.** `METHOD_LINES` gains a ninth line: "Future points assume today's points test; the announced reforms could change them." It passes REPORT_BANNED_COPY; the view banned-copy test covers it.
6. **Pool band label.** `PoolBar` gains `label`: "70", "70 (you)", or "70 (your band)" when the reader's score falls inside a band without matching it. `poolBars` is exported for the test, and `pool-bars.tsx` renders `bar.label`.

Tests, test-first. The RED run failed 7 tests (the TAS masked sum, the series sub, both poolBars labels, expired assessment, method lines, points-only footer):
- `npx vitest run src/lib/outlook/evidence.test.ts src/lib/outlook/points-page.test.ts src/lib/outlook/view.test.ts`: RED "7 failed | 51 passed (58)", then GREEN "58 passed (58)".
- `npm run check`: Prettier, ESLint, tsc clean; 1204 tests pass.
- `npm run build`: passes.

Browser: I put back the temporary `/dev-report/[id]/` page with an extra points-only case, verified, deleted it and rebuilt; `out/` has no dev-report.
- middle, notinv and pointsonly at 390, 820 and 1280, plus `/sample/`: no horizontal scroll, no text under 12px, no animations, no errors.
- middle at 360, 721, 760 and 1023: no horizontal scroll.
- Hero grid: one column at 390 (stamp above the h1); two columns at 820 (361px + 267px) and 1280; 299px + 230px at 721.
- Rendered text: TAS cell "Oct 2026: under 58 (may be zero)"; last method line present; pool row "70 (you)"; points-only footer starts "This is our best reading of the data, not a guarantee. It comes from published SkillSelect figures up to October 2026."
