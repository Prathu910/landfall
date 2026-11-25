### Task 3: `--keep-rounds`, `--rounds-only` and new-round detection

**Files:**

- Modify: `scripts/import/cli.ts`, `scripts/import/generate.ts` (`roundsCheckedAt`), `src/lib/data/types.ts` and `guards.ts` (`Manifest.roundsCheckedAt?: string`), `scripts/import/rounds.ts` (`newestRoundDate`)
- Create: `scripts/automation/detect-round.ts`
- Test: `scripts/import/cli.test.ts`, `scripts/import/rounds.test.ts`, `scripts/automation/detect-round.test.ts`

**Interfaces:**

- Consumes: `writeRoundPage` (Plan 1), `readRoundsFile` (Plan 1, v2).
- CLI: `--keep-rounds` (monthly import that fetches no round pages and regenerates with the stored `rounds.json`, as `--generate-only` does for rounds); `--rounds-only` (no Qlik session: fetches both round pages, stores the current one with `writeRoundPage`, regenerates `src/data/` from stored raw for the current `manifest.asAt` and `manifest.checkedAt`, sets `roundsCheckedAt` to the `--checked-at` date, lists new round dates in the report). `--rounds-only` takes no `--as-at`; `--keep-rounds` requires a monthly import. Plan 1's `--rounds-html <dir>` is also accepted with `--rounds-only` (pages read from disk, for tests and dry runs); `detect-round.ts` reads `$ROUNDS_HTML_DIR/invitation-rounds.html` when that variable is set.
- Produces: `newestRoundDate(currentHtml: string): string`; `newRoundDates(stored: RoundsFile, parsed: RoundPages): string[]` (dates in `parsed` newer than the newest stored round, oldest first). `detect-round.ts` fetches the current page only and prints `new` or `none`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(newestRoundDate(currentFixtureHtml)).toBe("2026-10-15");
expect(newRoundDates(storedUpTo("2026-06-04"), parsedFixtures)).toEqual(["2026-10-15"]);
expect(newRoundDates(storedUpTo("2026-10-15"), parsedFixtures)).toEqual([]);
expect(parseArgs(["--as-at", "2026-11", "--keep-rounds"])).toMatchObject({ mode: "monthly", keepRounds: true });
expect(() => parseArgs(["--rounds-only", "--as-at", "2026-11"])).toThrow();
expect(() => parseArgs(["--as-at", "2026-11", "--backfill", "--keep-rounds"])).toThrow();
it("--rounds-only leaves checkedAt and sets roundsCheckedAt", ...) // generate with a fixture raw root
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(import): --keep-rounds, --rounds-only and stored round pages`.

