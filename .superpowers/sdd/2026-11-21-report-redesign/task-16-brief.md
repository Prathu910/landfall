### Task 16: `/sample/` with four example tabs

**Files:**

- Create: `src/lib/outlook/examples.ts`, `src/components/report/sample-tabs.tsx` (+ CSS module)
- Modify: `src/app/sample/page.tsx`
- Test: `src/lib/outlook/examples.test.ts`

**Interfaces:**

- Consumes: scenario profiles (copy the four into `examples.ts`; tests import them from there, the fixture file re-exports to avoid duplication), `buildOutlookView`, `checkRead`.
- Produces: `export const EXAMPLES: { id: "strong" | "middle" | "notinv" | "none"; tab: string; profile: Profile }[]` with tabs "Strong", "In the middle", "189 closed", "Nothing suits". The sample page loads each example's core and detail at build (`loadOccupationCore`/`loadOccupationDetail`), renders the tabs (keyboard accessible, `?example=` is not used; tab state stays in memory), and shows each example's template read. `asOf` stays pinned for the sample.

- [ ] **Step 1: Write the failing tests**: each example's `buildOutlookView` stamp matches Task 10's table (so a data refresh that changes a stamp fails the build); each example's `templateRead` passes `checkRead`.
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/examples.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Keep the homepage's existing sample constants (`src/lib/sample.ts`, `buildSampleView`) untouched.
- [ ] **Step 4: Run** `npm run check && npm run build`, then the Task 15 Step 3 PDF check on `/sample/` for each tab. Expected: PASS, ≤ 5 pages each.
- [ ] **Step 5: Commit** `feat(sample): four example reports as tabs`.

