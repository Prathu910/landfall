### Task 2: Record guards

**Files:**

- Create: `src/lib/data/guards.ts`
- Test: `src/lib/data/guards.test.ts`

**Interfaces:**

- Consumes: the types from Task 1.
- Produces: `isOccupationCore(v: unknown): v is OccupationCore`, `isOccupationDetail(v: unknown): v is OccupationDetail`, `isManifest(v: unknown): v is Manifest`, `isCountText(v: unknown): v is CountText` (matches `/^(\d+|<20)$/`).

- [ ] **Step 1: Failing tests.**
  - A minimal valid core fixture (one visa, one month) passes.
  - Each of these fails:
    - `schemaVersion: 2`;
    - a count `"12a"`;
    - a month key `"2026-13"`;
    - a `rounds189` cutoff `"95"` (a string);
    - a missing `code`.
  - `isManifest` rejects duplicate occupation codes.
- [ ] **Step 2: Run** `npx vitest run src/lib/data/guards.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** hand-written guards. Add no runtime dependency. Month keys match `/^\d{4}-(0[1-9]|1[0-2])$/`, and cohort keys also allow `"older"`.
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(data): add runtime guards for generated records`

