### Task 9: Data facts

**Files:**

- Create: `src/lib/updates/facts-data.ts` (compose), `src/lib/updates/facts-national.ts`, `src/lib/updates/facts-states.ts`, `src/lib/updates/movers.ts`
- Test: one `*.test.ts` each; 2026-10 values use `frozenCore`/`frozenIndex` and the stored `rounds.json`

**Interfaces:**

- Consumes: `pickSpotlight` (Task 8); `OccupationCore`, `Manifest`, `RoundsFile`, `FederalList` (`src/lib/state-outlook/rules-types.ts`), `sumIntervals`/`parseCountText`, `shiftMonth` (copy the 3-line helper into `src/lib/data/months.ts` if it isn't exported there).
- Produces: `nationalFigures(cores, month): DataSection["national"]` (`{ submitted: { current: Interval; previous: Interval | null }; invited: same }` per visa; `previous` is null when no core has the previous month fetched); `scoreTotals(cores, month, visa, kind: "pool" | "invited"): { score: number; count: Interval }[]`; `stateFigures(cores, month): Record<StateVisa, Record<StateKey, StateFigure>>` (top 3 by floor); `poolMovers(cores, month, limit = 6): { fell: PoolMove[]; rose: PoolMove[] }`; `notable189(cores, rounds, month, limit = 10)`; `largePoolsNotListed(cores, rounds, federal, month, limit = 6)`; `buildDataSection(input: { month; cores; manifest; previousManifest: Manifest | null; previousFacts: RecapFacts | null; rounds: RoundsFile; federal: FederalList; today }): DataSection`.
- `notable189` uses the newest round dated on or before the month's last day (ten listed occupations with the largest exact 189 pools). `nominations` is the newest stored round's table that isn't null. `sources.previous` takes its `checkedAt` from the previous manifest, else the previous month's facts file, else is `null`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(national["189"].submitted).toEqual({ current: { min: 166555, max: 167904 }, previous: { min: 181076, max: 182254 } });
expect(national["189"].invited).toEqual({ current: { min: 14876, max: 16643 }, previous: { min: 0, max: 285 } });
expect(national["190"].invited.current).toEqual({ min: 7017, max: 9867 });
expect(states["190"].VIC.floor).toBe(1018);
expect(states["190"].NSW.total).toEqual({ min: 790, max: 6927 });
expect(states["190"].NSW.maskedCells).toBe(323);
expect(states["190"].ANY.floor).toBe(243);
expect(states["491"].TAS).toMatchObject({ floor: 0, maskedCells: 138 });
expect(states["190"].VIC.previousFloor).toBe(0);
expect(movers.fell[0]).toEqual({ code: "254499", name: "Registered Nurses nec", previous: 7500, current: 4280 });
expect(notable.rows[0]).toMatchObject({ code: "241111", cutoff: 90, pool: "13693" });
expect(notListed.map((o) => o.name)).toEqual(["Chef", "Software Engineer", "Civil Engineer", "ICT Business Analyst", "Mechanical Engineer", "Accountant (General)"]);
expect(notListed[1]).toMatchObject({ pool: 9464, roundsNotListed: 4, lastListed: { date: "2024-11-07", cutoff: 95 } });
it("never sums INVITED across months: national figures read one month per visa", ...)
it("skips a mover masked in either month", ...)
it("returns null previous values when the previous month was not fetched", ...)
it("gives null added/removed without a previous manifest", ...)
```

- [ ] **Step 2–4:** fail, implement, pass. Each module stays under 300 lines.
- [ ] **Step 5: Commit** `feat(updates): data facts (national, states, movers, notable 189)`.

