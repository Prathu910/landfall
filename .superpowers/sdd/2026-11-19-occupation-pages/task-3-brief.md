### Task 3: Chart and table rows (pool bars, round cards, cohorts, states)

**Files:**

- Create: `src/lib/occupation-page/charts.ts`, `charts.test.ts`, `src/lib/occupation-page/states.ts`, `states.test.ts`

**Interfaces:**

- Produces (charts):
  - `poolBars(pool: { total: CountText; byScore: ScoreCounts } | undefined): { score: number; label: string; masked: boolean; share: number }[]` sorted by score ascending; `label` is the formatted count or `"under 20"`; `share` is 0–1 against the largest bar (a masked bar counts as 19).
  - `roundCards(rounds189: Round[], n = 8): { date: string; label: string; cutoff: number | null }[]`, oldest first; `label` is `formatDate(date)`.
  - `roundsNote(rounds189: Round[], n = 8): string`
  - `cohortRows(detail: OccupationDetail | null, asAt: MonthKey, months = 12): CohortRow[] | null` where `CohortRow = { month: string; segments: { key: "INVITED" | "LODGED" | "SUBMITTED" | "HOLD" | "CLOSED"; label: string; count: Interval; masked: boolean }[]; total: Interval }`, months oldest first, labels `"Invited"`, `"Lodged a visa"`, `"Still waiting"`, `"On hold"`, `"Closed"`; a status missing from a fetched month is 0; `null` without 189 cohorts.
  - `cohortNote(name: string, rows: CohortRow[]): string`
- Produces (states):
  - `stateRows(code: string, core: OccupationCore, data: StateRuleData): StateRow[]` with `StateRow = { state: StateCode; name: string; onList: string; openTo: string; invited190: string; href: string | null }`, in the order NSW, VIC, QLD, WA, SA, ACT, TAS, NT.

- [ ] **Step 1: Write the failing tests:**
  - `roundCards(core261313.rounds189)` cut-offs, oldest first: `[null, 100, 100, 95, null, null, null, null]`, first label `"18 Dec 2023"`.
  - `roundsNote(core261313.rounds189)` is `"Not listed in the last 4 rounds. The last 8 rounds listed it 3 times, at 95 to 100 points."`; for 254499 `"Listed in every one of the last 8 rounds, at 65 to 85 points. The latest cut-off was 70."`; all `null` gives `"Not listed in any of the last 8 rounds."`; a newest round listed with others missing gives `"Listed in k of the last 8 rounds, at … The latest cut-off was c."`.
  - `poolBars(core261313.pool["189"])`: the 75-point bar has `share` 1 and label `"1,552"`; the 110 bar is `masked` with label `"under 20"`.
  - `cohortRows(detail254499, "2026-10")` has 12 rows, the last `month` `"Oct 2026"`, its `INVITED` count `{min: 40, max: 40}`, and a masked `LODGED`; `cohortRows(null, …)` is `null`.
  - `cohortNote` for 254499 starts `"Across the last 12 submission months, "` and contains `"are invited"`; for 261313 the invited count reads as a range, never `"0"` when any month is masked.
  - `stateRows("254499", core, stateRuleData)`: NSW `onList` `"190"`, `openTo` `"Living in NSW, elsewhere in Australia or offshore"`; QLD `onList` `"190 and 491"`, `openTo` `"Living in QLD or offshore"`; VIC `onList` `"Rules being checked"`; VIC `invited190` `"337–375"`; NSW `"327–346"`; every `href` is an `https://` URL taken from that state's 190 rule (`data.rules.rules`, first stream's `status.source`).
  - `stateRows("261313", …)`: QLD `openTo` `"Living in QLD only"`; NSW `invited190` `"0–38"`.
  - A core whose `stateInvited["190"].NSW` has no key for `asAt` gives NSW `invited190` `"Not published"`.
  - A code missing from an imported list gives `onList` `"Not on its 2026–27 list"`.
  - All strings pass `BANNED_COPY`.
- [ ] **Step 2: Run** the two test files; expect failures.
- [ ] **Step 3: Implement.** Sums use `parseCountText` and `sumIntervals`; formatting uses `formatCount`. `openTo` maps list cohorts `living-in-state` → `"Living in {code}"`, `living-in-other-state` → `"elsewhere in Australia"`, `offshore` → `"offshore"`, joined with `joinWords(…, "or")`; only `living-in-state` → `"Living in {code} only"`.
- [ ] **Step 4: Run** the tests and `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(occupation-page): pool bars, round cards, cohorts and state rows`.

