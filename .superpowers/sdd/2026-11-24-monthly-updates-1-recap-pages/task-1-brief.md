### Task 1: Frozen 2026-10 snapshot for tests

**Files:**

- Modify: `scripts/import/raw-store.ts` (`readRawView` options), `scripts/import/generate.ts` (`GenerateInput.revisionsUpTo`), `src/lib/data/legacy.test.ts` (use the helper)
- Create: `scripts/import/frozen-snapshot.ts`, `src/lib/data/__fixtures__/frozen-2026-10.ts`
- Test: `scripts/import/raw-store.test.ts`, `scripts/import/frozen-snapshot.test.ts`

**Interfaces:**

- Produces: `readRawView(root, asAt, viewId, options?: { revisionsUpTo?: string }): RawViewFile | undefined` (ignores `.rev-<date>` files dated after `revisionsUpTo`); `GenerateInput.revisionsUpTo?: string`.
- Produces: `FROZEN_2026_10 = { asAt: "2026-10", checkedAt: "2026-11-17", roundsUpTo: "2026-10-31", revisionsUpTo: "2026-11-17" } as const`; `generateFrozenSnapshot(rawRoot: string, rounds: RoundPages): GeneratedData` (filters rounds and skipped to `roundsUpTo`).
- Produces (test-only, memoised per worker): `frozenCore(code): OccupationCore | null`, `frozenDetail(code): OccupationDetail | null`, `frozenIndex(): OccupationIndexEntry[]`, `frozenManifest(): Manifest`.

- [ ] **Step 1: Write the failing tests**

```ts
// raw-store.test.ts
it("ignores a revision fetched after revisionsUpTo", () => {
  // tmp root: status-history.json, status-history.rev-2026-12-14.json
  expect(
    readRawView(root, "2026-10", "status-history", {
      revisionsUpTo: "2026-11-17",
    })?.fetchedAt,
  ).toBe(baseFile.fetchedAt);
  expect(readRawView(root, "2026-10", "status-history")?.fetchedAt).toBe(
    revision.fetchedAt,
  );
});
// frozen-snapshot.test.ts
it("regenerates the 2026-10 snapshot", () => {
  const data = generateFrozenSnapshot(
    "data/raw",
    readRoundsFile(readJson("src/data/rounds.json")),
  );
  expect(data.manifest.snapshotId).toBe("skillselect-2026-10-31");
  expect(data.index).toHaveLength(493);
  expect(data.index.filter((e) => e.hasData)).toHaveLength(479);
  expect(data.rounds.rounds[0].date).toBe("2026-10-15");
});
```

- [ ] **Step 2: Run** `npx vitest run scripts/import/raw-store.test.ts scripts/import/frozen-snapshot.test.ts`. Expected: FAIL (`generateFrozenSnapshot` not defined, option ignored).
- [ ] **Step 3: Implement** the option (filter `revisionNames` by date before `.at(-1)`), thread `revisionsUpTo` through `readRows`, add `frozen-snapshot.ts`, the fixture helper (one cached `generateFrozenSnapshot` call), and switch `legacy.test.ts`'s `generate202610` to the helper.
- [ ] **Step 4: Run** the two files and `npx vitest run src/lib/data/legacy.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `test: regenerate the frozen 2026-10 snapshot in memory`.

