### Task 6: Facts types, guard, formatting and merging

**Files:**

- Create: `src/lib/updates/types.ts`, `src/lib/updates/guards.ts`, `src/lib/updates/format.ts`, `src/lib/updates/dates.ts`, `src/lib/updates/merge.ts`
- Test: `src/lib/updates/{guards,format,dates,merge}.test.ts`

**Interfaces:**

- Produces (types.ts): `OccRef = { code: string | null; name: string }`; `CutoffMove = { code: string; name: string; previous: number; current: number }`; `PoolMove` (same shape, exact pool counts); `RoundSection = { generatedAt; sources: { currentRounds; previousRounds; checkedAt }; totals: RoundTotal[]; occupations: { code: string | null; name; cutoff; previousCutoff: number | null; tieBreak: string | null }[]; distribution: { score: number; occupations: number }[]; previousRound: { date; listed: number } | null; comparison: { fell; rose; same; newlyListed: OccRef[]; notListedAgain: OccRef[]; falls: CutoffMove[]; rises: CutoffMove[] } | null; cardPicks: CutoffMove[] }`; `StateFigure = { total: Interval; floor: number; maskedCells: number; previousFloor: number | null; top: { code; name; total: Interval }[] }`; `MonthPair = { current: Interval; previous: Interval | null }`; `ScoreTotal = { score: number; count: Interval }`; `NotableRow = { code; name; cutoff: number; previousCutoff: number | null; tieBreak: string | null; pool: CountText; invited: CountText | null }`; `NotListedRow = { code; name; pool: number; roundsNotListed: number; lastListed: { date; cutoff: number } | null }`; `SpotlightSeries = "SUBMITTED-189" | "SUBMITTED-190" | "SUBMITTED-491" | "INVITED-189" | "INVITED-190" | "INVITED-491"`; `Spotlight` (Task 8 states its rules) `= { code; name; pickedBy: "auto" | "founder"; qualifiedBy: { series: SpotlightSeries; change: Interval; guaranteed: number } | null; card: { latest189: { kind: "listed"; date; cutoff } | { kind: "not-listed"; date } | { kind: "not-on-list" }; rounds: { date; cutoff: number | null }[]; tieBreak: string | null; invited189: { current: CountText | null; previous: CountText | null }; pool189: { current: CountText | null; previous: CountText | null }; top190: { state: StateCode; floor: number }[] } }` (`qualifiedBy: null`= "little changed this month");`DataSection = { generatedAt; sources: { snapshotId; checkedAt; previous: { month; snapshotId; checkedAt } | null; federalListCheckedAt }; national: Record<Visa, { submitted: MonthPair; invited: MonthPair }>; pool189ByScore: ScoreTotal[]; invitedByScore: Record<Visa, ScoreTotal[]>; states: Record<StateVisa, Record<StateKey, StateFigure>>; nominations: NominationsTable | null; movers: { fell: PoolMove[]; rose: PoolMove[] }; notable189: { round: string; rows: NotableRow[] } | null; largePoolsNotListed: NotListedRow[]; spotlight: Spotlight; occupationsAdded: OccRef[] | null; occupationsRemoved: OccRef[] | null }`; `RecapFacts = { schemaVersion: 1; month: MonthKey; firstGeneratedAt; updatedAt; rounds: Record<string, RoundSection>; data: DataSection | null }`.
- Produces (format.ts): `formatNumber(n)`, `rangeText(i)`, `minimumText(i)`, `stateFigureText(f)`, `aboutText(i): string | null`, `countText(t: CountText)`, `mrzLine(month)`; re-exports `formatLongMonth` (Task 5).
- Produces (dates.ts): `sydneyDate(now: Date): string`; `monthOfDate(date): MonthKey` (Sydney calendar month of a round date, which is already a Sydney date).
- Produces (merge.ts): `withRoundSection(existing: RecapFacts | null, month, date, section, today): RecapFacts`; `withDataSection(existing, month, section, today): RecapFacts`. Each sets `firstGeneratedAt` only when `existing` is null, sets `updatedAt = today`, replaces only its own section and never touches another.

- [ ] **Step 1: Write the failing tests**

```ts
expect(aboutText({ min: 166555, max: 167904 })).toBe("about 167,000");
expect(aboutText({ min: 790, max: 6927 })).toBeNull();
expect(rangeText({ min: 181076, max: 182254 })).toBe("181,076–182,254");
expect(minimumText({ min: 0, max: 285 })).toBe("under 286");
expect(minimumText({ min: 14876, max: 16643 })).toBe("at least 14,876");
expect(stateFigureText({ floor: 0, maskedCells: 138, ... })).toBe("under 20 for each occupation"); // TAS 491
expect(stateFigureText({ floor: 1018, ... })).toBe("at least 1,018");
expect(countText("<20")).toBe("under 20");
expect(formatLongMonth("2026-10")).toBe("October 2026");
expect(mrzLine("2026-10")).toMatch(/^P<AUSSKILLSELECT<<UPDATE<OCTOBER<2026<+$/);
expect(sydneyDate(new Date("2026-11-24T20:30:00Z"))).toBe("2026-11-25");
it("adds a round section without touching data or firstGeneratedAt", ...)
it("keeps two rounds keyed by date", ...)
it("rejects a facts file whose round key isn't in its month", ...) // guard
```

- [ ] **Step 2–4:** Run `npx vitest run src/lib/updates`, expect FAIL; implement; expect PASS.
- [ ] **Step 5: Commit** `feat(updates): recap facts types, formatting and section merging`.

