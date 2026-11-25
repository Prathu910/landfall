### Task 4: Round pages v2 (totals, tie-break dates, nominations)

**Files:**

- Create: `src/lib/data/rounds-file.ts`, `scripts/import/round-store.ts`, `data/raw/rounds/2026-10-15.html` (written by the command below)
- Modify: `scripts/import/rounds.ts`, `scripts/import/generate-rounds.ts` (types and `readRoundsFile` move/re-export), `scripts/import/cli.ts` (`--rounds-html <dir>`), `src/data/rounds.json` (regenerated), `docs/DATA.md` ("189 invitation rounds")
- Test: `scripts/import/rounds.test.ts`, `scripts/import/generate-rounds.test.ts`, `scripts/import/cli.test.ts`, `src/lib/data/rounds-file.test.ts`

**Interfaces:**

- Produces in `rounds-file.ts`: `RoundTotal = { subclass: string; label: string; invited: number }`; `NominationsTable = { programYear: string; from: string; to: string; byVisa: Record<"190" | "491", Record<StateCode, string>> }` (values are the published text); `StoredRow = { name: string; code: string | null; cutoff: number; tieBreak: string | null }`; `StoredRound = { date; totals: RoundTotal[] | null; tieBreak: string | null; rows: StoredRow[]; nominations: NominationsTable | null }`; `RoundsFile = { schemaVersion: 2; rounds: StoredRound[]; skipped: SkippedRound[] }`; `isRoundsFile(v: unknown): v is RoundsFile`.
- `ParsedRound` gains `totals`, `tieBreak` (round-level, from the totals table) and per-row `tieBreak`; only the current-round page yields `nominations`.
- Produces: `writeRoundPage(rawRoot: string, date: string, html: string): string` (path `data/raw/rounds/<date>.html`, atomic, no-op if identical).
- CLI: `--rounds-html <dir>` reads `invitation-rounds.html` and `previous-rounds.html` from `<dir>` instead of fetching; requires `--generate-only`; stores the current page with `writeRoundPage`.

- [ ] **Step 1: Write the failing tests** (against `scripts/import/__fixtures__/`)

```ts
const pages = parseRoundPagesDetailed(currentHtml, previousHtml);
const oct = pages.rounds.find((r) => r.date === "2026-10-15")!;
expect(oct.totals).toEqual([{ subclass: "189", label: "Skilled Independent visa (subclass 189)", invited: 20000 }]);
expect(oct.rows.find((r) => r.occupationName === "Actuary")).toEqual({ occupationName: "Actuary", cutoff: 85, tieBreak: "2026-09-03" });
expect(oct.nominations).toEqual({ programYear: "2026-27", from: "2026-07-01", to: "2026-09-30", byVisa: {
  "190": { ACT: "<5", NSW: "11", NT: "188", QLD: "7", SA: "0", TAS: "271", VIC: "0", WA: "17" },
  "491": { ACT: "<5", NSW: "0", NT: "208", QLD: "<5", SA: "0", TAS: "96", VIC: "0", WA: "120" } } });
const jun = pages.rounds.find((r) => r.date === "2026-06-04")!;
expect(jun.totals?.[0].invited).toBe(10000);
expect(jun.tieBreak).toBe("2026-04-24");
expect(jun.rows.every((r) => r.tieBreak === null)).toBe(true);
expect(pages.rounds).toHaveLength(13); // unchanged
it("stops when the nominations table loses a state column", ...) // "Official page schema changed"
it("rejects a rounds file without schemaVersion 2", ...)
it("rejects --rounds-html without --generate-only", ...)
```

- [ ] **Step 2: Run** `npx vitest run scripts/import src/lib/data/rounds-file.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Totals: the block's first "Visa subclass" table with a "Total EOIs Invited" column; a row whose count isn't digits (commas allowed) throws; no such table gives `null`. Tie-break: a "Tie break date" column (per row) or column in the totals table (round-level), `dd/mm/yyyy` → ISO. Nominations: the "State and Territory nominations" block; state headers must be exactly `ACT NSW NT Qld SA Tas Vic WA` in order (map `Qld`→`QLD` etc.), else throw "Official page schema changed".
- [ ] **Step 4: Regenerate** `npm run data:generate -- --as-at 2026-10 --checked-at 2026-11-17 --rounds-html scripts/import/__fixtures__`. Expected `git status --short`: only `src/data/rounds.json` modified and `data/raw/rounds/2026-10-15.html` added. Run `npm run check`.
- [ ] **Step 5: Commit** `feat(import): parse round totals, tie-break dates and state nominations (rounds.json v2)` (code) and `data: rounds.json v2 from the 17 Nov 2026 round pages` (data).

