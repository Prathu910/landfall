### Task 3: Sort the live-data tests

**Files:**

- Modify (move to frozen data: they assert specific figures or labels): `src/lib/outlook/__fixtures__/scenario-input.ts`, `src/lib/outlook/__fixtures__/review-profiles.ts` (these two cover evidence, examples, headline, points-page, read-template, view, visa-cards, improve, review-repros), and the direct readers `src/lib/home/{example,try-it}.test.ts`, `src/lib/occupation-page/{charts,faq,states,summary,meta}.test.ts`, `src/lib/outlook/{charts,evaluate-profile,label-189,label-state,losses,queue-view,route,wait}.test.ts`, `src/lib/report/state-outlook-view.test.ts`, `src/lib/state-outlook/{outlook.real-data,questions,view}.test.ts`, `src/lib/guide/picker-view.test.ts`, `src/lib/data/coverage.test.ts` (its "493 occupations, 479 with data" case), `src/lib/report-evidence.test.ts` (its `LEGACY_CODES` case).
- Modify (keep live: invariants that should stop a bad month): `src/lib/outlook/__fixtures__/sweep.ts` and `sweep-{60,70,80,90}.test.ts`, `src/lib/occupation-page/copy-sweep.test.ts`, `src/lib/occupation-page/slug.test.ts`, `report-evidence.test.ts` ("every generated occupation"). Replace their hard counts (`toBe(493)`, `toBe(479)`) with the live index's own length and `toBeGreaterThan(400)`.

**Interfaces:**

- Consumes: `frozenCore`, `frozenDetail`, `frozenIndex` (Task 1). Swap `loadOccupationCore` → `frozenCore`, `loadOccupationDetail` → `frozenDetail`, `occupationIndex`/`occupation-index.json` → `frozenIndex()` in the first group. No assertion value changes.

- [ ] **Step 1: Write the guard test** `src/lib/data/live-data-tests.test.ts`: it reads every `*.test.ts` under `src/lib/` and fails if a file outside an explicit `LIVE_INVARIANT_TESTS` list imports `load-server` or `occupation-index` (directly or through `scenario-input`/`review-profiles`).
- [ ] **Step 2: Run** it. Expected: FAIL listing the first group.
- [ ] **Step 3: Implement** the swaps file by file. Confirm that `scenarios.ts`'s `asOf = "2026-11-17"` and `check-flow.tsx`'s initial state are placeholders replaced by `localToday()` at run time (spec 6.14) and leave them; note it in the ledger.
- [ ] **Step 4: Run** `npm test`. Expected: PASS, and no test was deleted or loosened in the first group (`git diff --stat` shows only import and loader changes there).
- [ ] **Step 5: Commit** `test: pin figure tests to the frozen 2026-10 snapshot; keep invariants on live data`.

