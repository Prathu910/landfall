### Task 2: The page's summary ("What the data says") and chips

**Files:**

- Create: `src/lib/occupation-page/summary.ts`, `src/lib/occupation-page/summary.test.ts`

**Interfaces:**

- Consumes: `OccupationCore`, `OccupationDetail`, `FederalList | null`; `Round` is exported from `src/lib/report/round-status.ts`; `StateRuleData` from `src/lib/report/state-outlook-view.ts`.
- Produces:
  - `roundsSentence(name: string, rounds189: Round[]): string`
  - `poolSentence(name: string, core: OccupationCore): string`
  - `likeTheseSentence(name: string, core: OccupationCore, detail: OccupationDetail | null): string | null`
  - `occupationSummary(core: OccupationCore, detail: OccupationDetail | null): string[]` (two or three sentences, in page order)
  - `statusChips(core: OccupationCore, federal: FederalList | null): { label: string; tone: "red" | "amber" | "green" | "neutral" }[]`
  - `mostCommonScore(byScore: ScoreCounts): { score: number; count: number } | null` (ignores `"<20"` cells; ties go to the higher count, then the lower score)

- [ ] **Step 1: Write the failing tests**, with the real records (`loadOccupationCore` / `loadOccupationDetail` as in `src/lib/home/try-it.test.ts`) and the fixtures in `src/lib/report/__fixtures__/scorecard.ts`:
  - `roundsSentence("Software Engineer", core261313.rounds189)` is `"189 hasn't listed Software Engineer in its last four rounds; the last cut-off was 95 points, in Nov 2024."`
  - `roundsSentence("Registered Nurses nec", core254499.rounds189)` is `"189 listed Registered Nurses nec in each of its last four rounds, at 70–80 points."`
  - With only `null` cut-offs: `"189 hasn't listed X in any round we can read."`; with `occasionalCore.rounds189`: begins `"189 listed X in 2 of its last four rounds, at "`.
  - `poolSentence("Software Engineer", core261313)` is `"The 189 pool holds 9,464 EOIs; the most common score is 75 points (1,552 EOIs)."`
  - `poolSentence` for `no189PoolCore` starts `"No 189 EOIs are published for "` and names the 190 and 491 pool totals.
  - `likeTheseSentence` uses the submission month six months before `core.asAt` (`"2026-04"` for `"2026-10"`) and equals `buildEoisLikeYours({ occupationName, core, detail, submittedMonth: "2026-04", asOf: "2026-10-31" })`'s sentence; it is `null` when `detail` is `null` or the result is not `"ready"`.
  - `occupationSummary(no189PoolCore, null)` contains no sentence starting `"189 "` and no `"EOIs submitted"`.
  - `statusChips(core261313, federal)` is `[{ label: "189: No recent invitations", tone: "red" }, { label: "190 eligible", tone: "neutral" }, { label: "491 eligible", tone: "neutral" }]`; a code `false` on the federal list gives `"Not on the federal list for 190"`; a `null` federal list leaves the 190/491 chips out.
  - Every string from these functions, over all scorecard fixtures and both real records, passes `BANNED_COPY`.
- [ ] **Step 2: Run** `npx vitest run src/lib/occupation-page/summary.test.ts`; expect failures.
- [ ] **Step 3: Implement** with `summarise189Rounds` for the four-round window and `CHIP_LABEL`/the scorecard tones for the 189 chip; the cut-off range uses the listed cut-offs among the last four rounds (`lo === hi` prints one number).
- [ ] **Step 4: Run** the tests and `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(occupation-page): summary sentences and status chips`.

