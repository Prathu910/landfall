### Task 19: Docs and final verification

**Files:**

- Modify: `docs/ENGINEERING.md` ("Data honesty": estimates allowed when computed in code from published history and labelled; still no percentages; AI never decides labels or numbers; remove the "never write 'you should apply'" line for the report), `docs/REPORT-COVERAGE.md`, `docs/HANDOFF.md` (resume point; switches stay off until the privacy deploy), `CLAUDE.md` (architecture: `src/lib/outlook/`, the print layout, `write-read`, the env vars), `docs/STRATEGY.md` (decision log only if a new founder decision arose)

- [ ] **Step 1: Update the docs** as listed; note the rules-engine state differences found in Task 3 against the mockups.
- [ ] **Step 2: Run** `npm run check && npm run build && npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 3: Verify** against `out/` at 360, 390, 820 and 1280 px with reduced motion on and off: `/check/` for the eight scenario profiles and `/sample/` for its four tabs. Expected: matches the mockups (allowing rules-engine state differences), no horizontal scroll, no text under 12 px, PDFs ≤ 5 pages and identical at two window sizes, homepage and an occupation page unchanged.
- [ ] **Step 4: Commit** `docs: report redesign architecture, coverage and handoff`.
