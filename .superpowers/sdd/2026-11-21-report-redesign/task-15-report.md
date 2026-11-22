# Task 15 report: print layout and Download PDF

Status: DONE_WITH_CONCERNS (small concerns below; every scenario prints in at most 5 pages)
Commit: 5bd8a9c feat(report): A4 print layout and Download PDF

## What I implemented

- `src/components/report/print-report.tsx` (+ `.module.css`): `PrintReport`, rendered by `Report` after the screen layout. Screen tree: `article.page` gets `screenOnly` (display none in print) once the view is not loading. Print tree on screen: absolute, off screen, height 0, overflow hidden, `visibility: hidden`. It still lays out, so `useFitStampText` can measure the stamp words; it stays out of the accessibility tree and the tab order. With display none the stamps could not fit their text.
  - Brand line: "MigrateLens" + "Report for {name}, calculated {D Mon YYYY}. SkillSelect data to {snapshot}." ("Your report, …" when there is no name).
  - Page 1: who + whoDetail, h1, fact, Best route / Estimated wait tiles, Our read, why line, BigStamp (stamp column 230px), then `VisaRow`.
  - Forced break. Page 2: Last 6 cut-offs + queue (`narrow`) in two columns, "Your best route" (`RouteLine width={700}`, kept whole), `ImproveSection`.
  - Then `PointsPage`, `MethodNote` (each `break-inside: avoid`) and `ReportFooter` as the guarantee box.
  - Points-only view: brand line, "You have N points.", line, points, guarantee box.
  - Hidden text: the inked stamp prints as an image (its SVG filter rasterises it), so a transparent span over it ("Stamp: SUBCLASS 190 NT, Competitive.") keeps the label in the PDF's text layer for search, copy and screen readers.
  - In print, `main:has(.root) > .page-head` is hidden, so page 1 starts with the brand line. The body background is none, so the paper stays white. `print-color-adjust: exact` is set on the whole tree.
- `print-appendix.tsx` (+ module): forced break; "Appendix", "The evidence behind your report", every 189 round since 2022 (`RoundsTable`), the 189 pool by points (`PoolBars`), and the 190 and 491 state tables side by side. Each state row reads: latest month, then "{n} of the last 6 months. {rules note}", then the short label chip. Sources come after the tables.
- `report-sources.tsx` (+ module): the sources paragraph, moved out of `evidence-section.tsx` so the evidence section and the appendix share it.
- Reused sections got an `anchor` prop (default true; the print copy passes false), so each id appears only once on the page: `VisaRow`, `ImproveSection`, `PointsPage`, `MethodNote`.
- Print sizes live in each component's own module under `@media print`: section, visa-row, improve-section, points-page (no photo, fields three across), method-note, report-footer (rounded box), our-read, evidence-tables, label-chip. No size goes under 12px.
- Every `@media (max-width: 720px)` left in report modules is now `screen and (...)`: panel-189, queue-bar, sharpen-form, state-panel, state-tile, state-outlook.
- Pure lib (TDD):
  - `src/lib/outlook/print-page.ts`: `printFooterText`, `printPageStyle` (`@page` margin boxes `@bottom-left` / `@bottom-right` "Page " counter(page) " of " counter(pages), 12px, `var(--muted)`; anything outside letters, digits and plain punctuation is CSS hex-escaped, so a name can't close the string or `</style>`) and `printBrandLine`. The page injects the rule with `dangerouslySetInnerHTML`: React would HTML-escape `<style>` children, and the input is already escaped.
  - `StateLabel.rules` / `StateRow.rules` (`label-state.ts`, `evidence.ts`): "Rules being checked." (unverified); "N rule(s) need your answers." (needs-answers); otherwise the deciding reason plus a full stop ("Meets every verified rule for Living in NSW.", "Not on the Queensland 2026–27 list for 190 under Building and construction workers.", "Closed for 491 in 2026–27.").
  - Points-only `OutlookView` gains `dataMonth`, so its page footers name the month.
- `globals.css`: top-level `@page { size: A4; margin: 14mm 14mm 18mm; }` (the old 17mm rule inside `@media print` is gone). I removed the dead `.report-toolbar/layout/nav/sheet/heading*/body/timeline/event/source-footer/progress/checklist-meta`, `.audit-row`, `.checklist-item` and `.scenario-grid` rules, plus their media-query and print entries. I kept `.report-empty`, `.report-section` and `.report-accordion` (still used) and the details-open print rule (FAQ pages).
- `CLAUDE.md` and `docs/ENGINEERING.md` now say: "Every report section prints in the PDF; interactive controls and the detailed views inside "See the evidence" are screen only."

## Tests and TDD evidence

- RED: `npx vitest run src/lib/outlook/evidence.test.ts` gave 4 failed ("expected undefined to be 'Meets every verified rule for Living …'"). GREEN after `rules`: 341 passed in src/lib/outlook.
- RED: `npx vitest run src/lib/outlook/print-page.test.ts` failed with "Cannot find module './print-page'", then "printBrandLine is not a function". GREEN: 7 passed.
- RED: view.test points-only `dataMonth` failed ("expected undefined to be 'October 2026'"). GREEN: 34 passed.
- `npm run check`: format, lint and typecheck clean; 107 files, 1215 tests passed. `npm run build` passes.

## PDF verification (headless Chrome CLI, `--no-pdf-header-footer --print-to-pdf`, built `out/` on :3017)

A temporary page `src/app/print-check/[id]` rendered the eight fixture profiles at asOf 2026-11-21. I deleted it before committing and cleared stale `.next/types`.

| Scenario | 390x844 | 1280x900 | Same text both sizes |
|---|---|---|---|
| /sample/ (Aarav, lodged) | 5 | 5 | yes |
| strong (Aarav) | 4 | 4 | yes |
| middle (Priya) | 5 | 5 | yes |
| long (Meera) | 5 | 5 | yes |
| notinv (Rahul) | 5 | 5 | yes |
| below (Arjun) | 5 | 5 | yes |
| nodata (Sana) | 4 | 4 | yes |
| none (Dev) | 5 | 5 | yes |
| lodged (Kavya) | 5 | 5 | yes |

Page 1 text (`pdftotext -f 1 -l 1`) holds, for every scenario: "Stamp: … {label}.", the headline, Best route, Estimated wait, and the three visa titles (189 Independent, 190 Nominated, 491 Regional). Examples: Rahul "Stamp: SUBCLASS 190 NT, Competitive."; Dev "Stamp: 189 • 190 • 491, Not currently invited."; Sana "… Not enough data.". I checked the pages visually (contact sheets): colours print, there are no chips, buttons or feedback, the margin boxes show, and the appendix is one page.

## Self-review / concerns

1. Most scenarios print 5 pages, against 4 in the reference PDFs. The 12px floor (the mockup printed at 8–10pt) makes the plan section run past page 2. Points and the label rules then follow, and the appendix takes the last page. Rahul's appendix nearly fills its page; a longer state rules note could push it to a sixth.
2. The bottom-left footer with no name reads "MigrateLens report. Our best reading of SkillSelect data to {Month YYYY}, not a guarantee." The brief could also be read as "MigrateLens report." alone; I kept the not-a-guarantee sentence on every page.
3. I split points, method and footer into separate keep blocks rather than one keep block. One block left a near-empty page when the plan overflowed by one card ("kept together where possible").
4. Files beyond the brief's list: print-appendix, report-sources, `anchor` props on four sections, print rules in nine modules, and lib changes (`rules` on StateLabel/StateRow, points-only `dataMonth`).
5. The transparent stamp text exists only in print; it is not visible.
6. I didn't check Safari or Firefox. Safari omits the margin boxes, but the guarantee box still prints.

No data-vs-brief differences.

## Fix round 1 (commit 6e30bc2)

Changes:
1. Points-only print page: new `.pointsOnly` single-column block in `print-report.module.css`, so it no longer uses `.hero`'s two-column grid. Confirmed with a points-only PDF (Priya, no occupation): 1 page at both window sizes. The line now sits under the h1, followed by the points, the guarantee box and the footer.
2. `BigStamp` gains `decorative?: boolean`. When it is true there is no role and no aria-label, and the SVG gets `aria-hidden`. The print copy passes `decorative` and keeps the transparent "Stamp: …" span, so the label stays in the PDF text.
3. `print-page.ts` MARGIN_FONT is now `font: 12px var(--font-report); color: var(--muted);`. I checked that Chrome resolves `:root` custom properties inside `@page` margin boxes: a scratch page with `font: 12px var(--f)` embedded Courier New. Test assertion added.
4. `globals.css`: every `@media (max-width: …)` is now `screen and (max-width: …)` (8 queries: 1100, 800 ×2, 720, 480 ×2, 400, 369). On screen, `screen and (max-width: N)` matches exactly where `(max-width: N)` did, so the homepage and occupation pages render the same on screen; only print stops matching them.
5. `view.ts` computes `dataMonth(noCore)` once (`month`). `report.tsx`: `printed` becomes `hasPrintLayout`.

Tests and commands:
- `npx vitest run src/lib/outlook/print-page.test.ts src/lib/outlook/view.test.ts`: 41 passed.
- `npm run build`: exit 0. `npm run check`: exit 0, 107 files, 1215 tests passed.
- PDFs (headless Chrome CLI, built `out/`, temporary print-check page deleted before the commit and `.next/types` cleared):
  - pointsonly: pages390=1, pages1280=1, same text
  - notinv: pages390=5, pages1280=5, same text; page 1 has "Stamp: SUBCLASS 190 NT, Competitive."
  - /sample/: pages390=5, pages1280=5, same text
