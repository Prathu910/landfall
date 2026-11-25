### Task 5: Occupations that drop out keep their pages

**Files:**

- Modify: `src/lib/data/types.ts` (`OccupationIndexEntry.lastAsAt?`, `lastCheckedAt?`), `src/lib/data/guards.ts`, `scripts/import/generate.ts`, `scripts/import/cli.ts` (pass previous data), `scripts/import/validate-generated.ts`, `src/lib/data/occupation-url.ts`, `src/lib/occupation-page/meta.ts` (sitemap date), `src/app/occupations/[slug]/page.tsx`, `src/components/occupation/` (note component), `src/components/data/report-occupation.ts` (dropped reason), `docs/DATA.md` (R9)
- Create: `src/lib/occupation-page/dropped.ts`
- Test: `scripts/import/generate.test.ts`, `scripts/import/validate-generated.test.ts`, `src/lib/occupation-page/dropped.test.ts`, `src/lib/data/occupation-url.test.ts`, `src/lib/occupation-page/meta.test.ts`

**Interfaces:**

- Produces: `GenerateInput.previous?: { manifest: Manifest; core(code): OccupationCore | null; detail(code): OccupationDetail | null } | null`. A code in the previous index but absent now is carried forward unchanged, with index and manifest entries `{ ...previousEntry, lastAsAt: previousEntry.lastAsAt ?? previous.manifest.asAt, lastCheckedAt: previousEntry.lastCheckedAt ?? previous.manifest.checkedAt }`; a returning code is regenerated and loses both marks.
- Produces: `formatLongMonth(month: MonthKey): string` in `src/lib/report/copy.ts` ("2026-11" → "November 2026", fixed names beside `formatMonth`); `droppedSince(entry: OccupationIndexEntry): MonthKey | null` (the month after `lastAsAt`); `droppedNote(entry): string | null` = "Not in the SkillSelect data since {Month YYYY}".
- `publishedOccupationCode` returns `null` for an entry with `lastAsAt`, so the check and report take the points-only path; the report's unavailable reason for it is `{ kind: "dropped", note }`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(entryFor("254499")).toMatchObject({ hasData: true, lastAsAt: "2026-10", lastCheckedAt: "2026-11-17" }); // previous 2026-10, current 2026-11 lacks it
expect(coreFor("254499").snapshotId).toBe("skillselect-2026-10-31");
it("keeps an earlier lastAsAt when a dropped code stays out", ...)
it("clears the marks when a code returns", ...)
it("allows an older snapshot id only with lastAsAt", ...)       // validate-generated
it("counts current codes only for the 10% drop check", ...)
expect(droppedNote({ code: "1", name: "A", hasData: true, lastAsAt: "2026-10" })).toBe("Not in the SkillSelect data since November 2026");
expect(publishedOccupationCode("1", [{ code: "1", name: "A", hasData: true, lastAsAt: "2026-10" }])).toBeNull();
it("dates a dropped occupation's sitemap entry by lastCheckedAt", ...)
```

- [ ] **Step 2: Run** the five test files. Expected: FAIL.
- [ ] **Step 3: Implement.** The occupation page shows the note above the direct answer; "Last updated" and the evidence footer use `lastCheckedAt` and the core's own `snapshotId`; the verdict strip and check card say "Figures from {Mon YYYY}". The report's note: "Not in the SkillSelect data since {Month YYYY}, so this report uses your points only." `isIndexable` is unchanged.
- [ ] **Step 4: Run** `npm run check` and `npm run build` (no occupation is dropped today, so `out/` is unchanged apart from code).
- [ ] **Step 5: Commit** `feat(data): keep pages for occupations that drop out of the data`.

