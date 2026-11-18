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
