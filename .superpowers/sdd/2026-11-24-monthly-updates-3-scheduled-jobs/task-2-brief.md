### Task 2: `--probe` and the target month

**Files:**

- Modify: `scripts/import/qlik-client.ts` (`listAsAtMonths`), `scripts/import/cli.ts` (`--probe`, `--report-file`), `scripts/import/qlik-client.test.ts`, `scripts/import/cli.test.ts`
- Create: `scripts/automation/next-month.ts`, `scripts/automation/next-month.test.ts`

**Interfaces:**

- Produces: `monthFromSerial(serial: number): MonthKey` (inverse of `asAtSerial`); `QlikSession.listAsAtMonths(): Promise<MonthKey[]>` (a session list object on the `As At Month` field: no `readTable`, no variable or toggle change, not counted as a page read); CLI `--probe` prints `Newest As At Month: YYYY-MM` and exits 0 without writing anything (no other flag allowed with it except `--report-file`).
- Produces: `--report-file <path>` writes `ImportReport = { mode: "probe" | "monthly" | "backfill" | "generate-only" | "rounds-only"; asAt: MonthKey | null; newestAsAt: MonthKey | null; pageReads: number; budget: number | null; revisions: { path: string; rowsBefore: number; rowsAfter: number }[]; unmatched: string[]; newRounds: string[]; durationSeconds: number }` (written on success and on failure, with what is known).
- Produces: `nextImportMonth(manifestAsAt: MonthKey, newest: MonthKey, requested: MonthKey | null): MonthKey | null` (the requested month when given; else `manifestAsAt + 1` when `newest > manifestAsAt`; else null). CLI `tsx scripts/automation/next-month.ts --newest YYYY-MM [--requested YYYY-MM]` prints the month or nothing.

- [ ] **Step 1: Write the failing tests**

```ts
expect(monthFromSerial(asAtSerial("2026-10"))).toBe("2026-10");
it("probes with no table read and no variable change", async () => {
  /* fake transport: record methods */ expect(methods).not.toContain(
    "GetHyperCubeData",
  );
  expect(methods).not.toContain("SetNumValue");
  expect(session.pageReads()).toBe(0);
});
expect(nextImportMonth("2026-10", "2026-10", null)).toBeNull();
expect(nextImportMonth("2026-10", "2026-12", null)).toBe("2026-11");
expect(nextImportMonth("2026-10", "2026-10", "2026-10")).toBe("2026-10"); // rehearsal
expect(() => parseArgs(["--probe", "--as-at", "2026-10"])).toThrow();
```

- [ ] **Step 2–4:** fail, implement, pass. Then run `npm run data:import -- --probe` once locally; expected `Newest As At Month: 2026-10` (until November's data appears).
- [ ] **Step 5: Commit** `feat(import): --probe for the newest As At Month, and a run report`.

