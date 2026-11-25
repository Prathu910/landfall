### Task 8: Spotlight

**Files:**

- Create: `src/lib/updates/spotlight.ts`
- Test: `src/lib/updates/spotlight.test.ts`

**Interfaces:**

- Consumes: `Spotlight` (Task 6).
- Produces: `guaranteedChange(current: Interval, previous: Interval): number` (0 if `[cur.min − prev.max, cur.max − prev.min]` contains 0, else the smaller absolute end); `pickSpotlight(input: { cores; month; previousCode: string | null; override: string | null; rounds: RoundsFile; federal: FederalList }): Spotlight`. `buildDataSection` (Task 9) calls it with `previousCode` from the previous month's facts file.
- Rules (spec 6.8): popular = top 20 by the sum of SUBMITTED floors over 189, 190, 491 at the month (ties by code; never shown); six series; a series with an unfetched previous month is skipped; score = largest guaranteed change; ties by guaranteed relative change (`guaranteed / max(previous.max, 1)`), then code; skip `previousCode`; no change above 0 → the most popular occupation; `override` sets `pickedBy: "founder"` and must be an indexed code, else throw. `top190`: up to four states by 190 floor, floor > 0. `rounds`: last six parsed rounds.

- [ ] **Step 1: Write the failing tests**

```ts
expect(guaranteedChange({ min: 4280, max: 4280 }, { min: 7500, max: 7500 })).toBe(3220);
expect(guaranteedChange({ min: 2730, max: 2730 }, { min: 0, max: 19 })).toBe(2711);
expect(guaranteedChange({ min: 0, max: 19 }, { min: 0, max: 19 })).toBe(0);
const s = pickSpotlight({ cores, month: "2026-10", previousCode: null, override: null, ... });
expect(s).toMatchObject({ code: "254499", pickedBy: "auto", qualifiedBy: { series: "SUBMITTED-189", guaranteed: 3220 } });
expect(s.card.pool189).toEqual({ current: "4280", previous: "7500" });
expect(s.card.invited189).toEqual({ current: "2730", previous: "<20" });
expect(s.card.top190).toEqual([{ state: "VIC", floor: 337 }, { state: "NSW", floor: 327 }, { state: "QLD", floor: 260 }, { state: "WA", floor: 253 }]);
expect(s.card.tieBreak).toBe("2025-11-19");
expect(pickSpotlight({ ..., previousCode: "254499" }).code).toBe("241111");
it("falls back to the most popular occupation, little changed, when nothing moved", ...)
it("uses a founder override", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(updates): spotlight pick`.

