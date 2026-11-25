### Task 7: Round facts

**Files:**

- Create: `src/lib/updates/facts-round.ts`
- Test: `src/lib/updates/facts-round.test.ts` (2026-10 values from the frozen `rounds.json` v2 via `readJson`, plus small explicit fixtures)

**Interfaces:**

- Consumes: `StoredRound`, `RoundsFile` (Task 4); types (Task 6).
- Produces: `buildRoundSection(input: { round: StoredRound; previous: StoredRound | null; names: ReadonlyMap<string, string>; sources: RoundSection["sources"]; today: string }): RoundSection`; `previousRound(file: RoundsFile, date: string): StoredRound | null` (the next older parsed round).
- Rules: one entry per listed occupation (rows with the same code collapse to their lowest cut-off; unmatched names count by name); `falls`/`rises` up to 6, largest change first, ties by name; `cardPicks` = two largest falls and one largest rise when both exist, otherwise the three largest moves of either kind, ties by name, matched codes only.

- [ ] **Step 1: Write the failing tests**

```ts
const s = buildRoundSection({ round: oct, previous: jun, ... });
expect(s.occupations).toHaveLength(159);
expect(s.distribution).toEqual([[65,44],[70,36],[75,9],[80,36],[85,19],[90,10],[95,3],[100,2]].map(([score, occupations]) => ({ score, occupations })));
expect(s.comparison).toMatchObject({ fell: 78, rose: 9, same: 50 });
expect(s.comparison!.newlyListed).toHaveLength(22);
expect(s.comparison!.notListedAgain.map((o) => o.name)).toEqual(["Fitter and Turner", "Organisational Psychologist", "Thoracic Medicine Specialist"]);
expect(s.cardPicks.map((m) => m.code)).toEqual(["134214", "342111", "272311"]); // Welfare Centre Manager 85→65, Airconditioning and Refrigeration Mechanic 80→65, Clinical Psychologist 75→90
expect(s.totals[0].invited).toBe(20000);
expect(s.previousRound).toEqual({ date: "2026-06-04", listed: 140 });
it("counts an unmatched name as listed but never picks it", ...)
it("gives no comparison when there is no previous parsed round", ...)
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5: Commit** `feat(updates): round facts`.

