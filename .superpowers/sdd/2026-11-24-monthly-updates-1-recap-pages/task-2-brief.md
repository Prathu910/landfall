### Task 2: Freeze `/sample/` on 2026-10

**Files:**

- Create: `scripts/sample/freeze.ts`, `src/data/sample/2026-10/` (generated: `<code>.json`, `<code>.detail.json`, `meta.json`), `src/lib/sample-data.test.ts`
- Modify: `package.json` (`"sample:freeze": "tsx scripts/sample/freeze.ts"`), `.prettierignore`, `src/lib/sample.ts` (`SAMPLE_CODES`), `src/lib/data/load-server.ts`, `src/app/sample/page.tsx`, `src/components/report/sample-tabs.tsx`, `src/components/report.tsx`, `src/components/report/compare-section.tsx`

**Interfaces:**

- Consumes: `generateFrozenSnapshot` (Task 1).
- Produces: `SAMPLE_CODES: readonly string[]` = unique codes of `EXAMPLES` plus `SAMPLE_COMPARISON` (`["254499", "261313", "221214", "254412"]`); `SampleMeta = { snapshotId; asAt; checkedAt; sources: Manifest["sources"] }`; `loadSampleCore(code)`, `loadSampleDetail(code)`, `loadSampleMeta(): SampleMeta` in `load-server.ts` (read `src/data/sample/2026-10/`, guard with `isOccupationCore`/`isOccupationDetail`).
- Produces: `Report` prop `fixedComparisons?: OccupationEvidence[]`; when present the comparison picker lists only those codes and `useComparison` never fetches.

- [ ] **Step 1: Write the failing tests**

```ts
it("sample records equal the frozen 2026-10 regeneration", () => {
  for (const code of SAMPLE_CODES) {
    expect(loadSampleCore(code)).toEqual(frozenCore(code));
    expect(loadSampleDetail(code)).toEqual(frozenDetail(code));
  }
});
it("dates the sample to 31 Oct 2026, checked 17 Nov 2026", () => {
  expect(loadSampleMeta()).toMatchObject({
    snapshotId: "skillselect-2026-10-31",
    asAt: "2026-10",
    checkedAt: "2026-11-17",
  });
});
it("lists four unique codes", () =>
  expect(SAMPLE_CODES).toEqual(["254499", "261313", "221214", "254412"]));
```

- [ ] **Step 2: Run** `npx vitest run src/lib/sample-data.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the script (writes with the importer's serializer, refuses to run if a record fails its guard), run `npm run sample:freeze`, add the loaders, switch `/sample/` to `loadSample*` only (`reportSource` from `loadSampleMeta()`), pass `fixedComparisons` for the four codes, and add the dated line under the description: "Example reports use SkillSelect data as at 31 Oct 2026."
- [ ] **Step 4: Run** the test, `npm run check`, `npm run build`; then `grep -c "as at 31 Oct 2026" out/sample/index.html` ≥ 1.
- [ ] **Step 5: Commit** `feat(sample): freeze the sample reports on the 2026-10 snapshot`.

