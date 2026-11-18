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
