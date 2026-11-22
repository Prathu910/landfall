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

