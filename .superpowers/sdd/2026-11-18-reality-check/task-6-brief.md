### Task 6: Data plumbing (detail loading, rounds meta)

**Files:**

- **Modify:**
  - `scripts/import/generate-write.ts` (or wherever `rounds.json` is written): also write `src/data/rounds-meta.json` = `{ skipped: { date: string; reason: string }[] }`.
  - `src/components/data/use-occupation-core.ts`: extract a shared internal hook. Add `useOccupationDetail(code, index): DetailLoad`, where `DetailLoad = {status:"idle"}|{status:"loading"}|{status:"ready"; detail: OccupationDetail}|{status:"unavailable"}`. It fetches `occupationDataUrl(code, index, "detail")` and validates with `isOccupationDetail`.
  - `src/components/data/report-occupation.ts`: the `ready` state gains `core: OccupationCore` and `detail: DetailLoad`.
  - `src/components/check-flow.tsx`: load the detail alongside the core.
  - `src/app/sample/page.tsx`: server-load the detail and pass `{status:"ready", detail}`.
  - `CLAUDE.md`: client components may also import `rounds-meta.json`.
- **Create:** `src/components/data/rounds-meta.ts`, which exports the typed, validated `skippedRounds` (module-level constant).
- **Test:**
  - extend `scripts/import/generate.test.ts`: `rounds-meta.json` is written and matches the `rounds.json` skipped list;
  - `src/components/data/report-occupation.test.ts`: the ready state carries the core.

Steps:

- [ ] **Step 1: Write failing tests** for the generator output and the `ReportOccupation` shape.
- [ ] **Step 2: Run** them. Expect FAIL.
- [ ] **Step 3: Implement, then regenerate** with `npm run data:generate -- --as-at 2026-10 --checked-at 2026-11-17`. No network. Only `rounds-meta.json` should be new: check with `git status`.
- [ ] **Step 4: Run** `npm run check && npm run build`. Expect PASS, with no visible UI change yet.
- [ ] **Step 5: Commit** `feat(data): load occupation detail in the report and expose skipped rounds`. Commit the data file separately: `data: add rounds-meta.json`.

