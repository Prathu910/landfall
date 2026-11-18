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

