### Task 10: Legacy adapters and the reproducibility test

**Files:**

- Create: `src/lib/data/legacy.ts`
- Test: `src/lib/data/legacy.test.ts`
- Move: `src/data/pool.json` → `src/lib/data/__fixtures__/legacy-2026-10/pool.json`, and `src/data/report-evidence.json` → `src/lib/data/__fixtures__/legacy-2026-10/report-evidence.json`. Make this move in Task 12, after the UI stops importing them. Until then the test reads them from `src/data/`.

**Interfaces:**

```ts
export type PoolOccupation = {
  code: string;
  name: string;
  points: { score: number; count: CountText }[];
}; // 189 SUBMITTED, ascending score
export function toPoolOccupation(core: OccupationCore): PoolOccupation | null; // null when no 189 pool
export function toOccupationEvidence(core: OccupationCore): OccupationEvidence; // existing type from src/lib/report-evidence.ts: latest 6 rounds, 12 monthly 189 SUBMITTED totals (month-end dates), 3 pathways
```

- [ ] **Step 1: Failing test.** For each of the 11 codes in the legacy `pool.json`, load the generated core from `src/data/occupations/<code>.json`, then:
  - `toPoolOccupation(core).points` equals `pool.json`'s points;
  - `toOccupationEvidence(core)` deep-equals the matching `report-evidence.json` occupation.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/legacy.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the tests again. Expect PASS.
  - If values differ, investigate. An **unexplained** mismatch blocks the task.
  - An explained one (an old importer bug, or a government revision) is recorded in an `explainedDifferences` table in the test, with the reason, and in `docs/DATA.md`.
- [ ] **Step 5: Run** `npm run check`, then **commit** `test(data): prove the new pipeline reproduces the 2026-10 legacy data`

