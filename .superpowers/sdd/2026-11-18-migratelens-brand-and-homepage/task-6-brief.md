### Task 6: Live try-it component

**Files:**

- Create: `src/components/home/try-it.tsx`, `src/components/home/try-it.module.css`
- Modify: none outside these

**Interfaces:**

- Consumes: `buildTryIt`, `TRY_IT_POINTS` and `TRY_IT_DEFAULT` (Task 5); `useOccupationCore` with the module-level `occupationIndex`; Mantine `Select`.
- Produces: `TryIt({ defaultOccupation: string })`, a client component. The heading is "Try it with your occupation". The link reads "Get the full report" and points to `/check/?occupation=<code>`.

- [ ] **Step 1: Write the failing test.** If the repo has no component testing, cover the URL rule in a pure helper instead: export `fullReportHref(code: string): string` and test that it equals `/check/?occupation=${code}` and never contains the total.
- [ ] **Step 2: Run** it. **Expected:** FAIL.
- [ ] **Step 3: Build the component.**
  - A searchable occupation `Select` (index entries with `hasData`), a points `Select` and the three rows: "EOIs with a higher score (189)", "At your score" and "Latest 189 round".
  - A source line reads "SkillSelect, as at {Mon YYYY}".
  - While loading it shows "Loading published data…".
  - `kind: "none"` shows its message.
  - Long occupation names wrap.
  - Labels are tied to their inputs.
- [ ] **Step 4: Run** `npm run check` and `npm run build`. **Expected:** pass.
- [ ] **Step 5: Commit** `feat(home): live try-it with published 189 data`.

