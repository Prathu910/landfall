### Task 12: Move the UI to the new data, remove the old pipeline, and document

**Files:**

- Modify:
  - `src/components/pool-explorer.tsx`: occupation index for search; `initial: PoolOccupation` prop; hook for other codes.
  - `src/components/home-experience.tsx` and `src/app/page.tsx`: the page loads core `261111` server-side and passes it down.
  - `src/components/check-flow.tsx`: index for the picker and the `?occupation=` check; hook for the chosen code.
  - `src/components/report.tsx`.
  - `src/app/sample/page.tsx`: server-loads `261111` and `261313`.
  - `src/app/methodology/page.tsx`: replace "covers 11 occupations" with the manifest count.
  - `src/lib/pool.ts`: drop the `snapshot` JSON import; `Occupation` becomes `PoolOccupation`.
  - `src/lib/report-evidence.ts`: drop the JSON import and `evidence`; keep types and `netPoolChange`; move `validateOccupationEvidence` tests onto generated data via `toOccupationEvidence`.
- Delete: `scripts/import-report-evidence.py`.
- Move: the two legacy JSON files into the Task 10 fixtures folder, updating the test path.
- Create: `docs/DATA.md`.
- Modify: `scripts/README.md`, `CLAUDE.md` (the architecture data bullets and commands), `docs/REPORT-COVERAGE.md` (data sources section), `docs/HANDOFF.md`.

**Interfaces:**

- `Report` gets these new props, replacing the internal JSON lookups:
  - `occupation: { status: "loading" } | { status: "ready"; pool: PoolOccupation | null; evidence: OccupationEvidence } | { status: "unavailable" }`;
  - `comparisonIndex: OccupationIndexEntry[]`.
- The comparison occupation is loaded through `useOccupationCore`.
- Snapshot dates displayed come from `core.asAt` and `manifest.checkedAt`, passed as props.

**Steps:**

- [ ] **Step 1: Update the components and pages** as listed. While `status === "loading"`, the pool, rounds and comparison sections show "Loading published data…" (at least 12px text), never the "not in snapshot" message.
- [ ] **Step 2: Run** `rg "pool.json|report-evidence.json" src`. Expect matches only in `src/lib/data/__fixtures__` and the legacy test.
- [ ] **Step 3: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 4: Browser smoke test** against `python3 -m http.server 3017 --bind 127.0.0.1 --directory out`:
  - **Homepage:** the explorer shows ICT Business Analyst at 865–903, and searching "Registered Nurses" loads its chart.
  - **`/check/?occupation=233211`:** the occupation is preselected. Complete the four steps and confirm the report shows the pool chart and rounds.
  - **`/sample/`:** the content is identical to before, with 90/95/105 points.
  - At 390px width, nothing overflows horizontally. There are no console errors.
- [ ] **Step 5: Write `docs/DATA.md`.** Cover:
  - each view's shown columns, filters and months, plus any reductions applied in Task 9;
  - status meanings and the observed behaviour table from the spec;
  - known limits: multi-visa, the CLOSED mix, no onshore/offshore, masking, the INVITED lower bound, `ANY`, and the SUBMITTED coverage-window finding (compare `statusHistory` SUBMITTED for 189 against the legacy trend and record what it shows);
  - the guardrail rules;
  - snapshot, revision and versioning rules;
  - how to run monthly and backfill imports;
  - any explained differences from Task 10.

  Update the other docs listed.

- [ ] **Step 6: Run** `npm run check`, then **commit** in two parts:
  - `refactor: feed the UI from per-occupation data`
  - `docs: add data dictionary and update import docs`
