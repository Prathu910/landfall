### Task 1: Copy helpers and 189 round status

**Files:**

- Create: `src/lib/report/copy.ts`, `src/lib/report/round-status.ts`
- Test: `src/lib/report/copy.test.ts`, `src/lib/report/round-status.test.ts`

**Interfaces:**

```ts
// copy.ts
export function formatCount(i: Interval): string; // "1,132" | "under 20" | "872–891"
export function countPhrase(i: Interval): string; // like formatCount, but {0,19} -> "under 20, so may be zero"
export function formatMonth(month: MonthKey): string; // "Oct 2026"
export function submissionMonth(eoiDate: string): MonthKey | null; // "2025-02-14" -> "2025-02"; "" or invalid -> null
export const BANNED_COPY: RegExp; // /\b(should|apply to|best|likely to be invited|people|applicants|some invitations|a few)\b/i
// round-status.ts
export type RoundStatus = "regular" | "occasional" | "none";
export type RoundSummary = {
  status: RoundStatus;
  listedInLastFour: number; // 0..4
  roundsConsidered: number; // min(4, rounds.length)
  latestCutoff: { date: string; cutoff: number } | null; // newest non-null cut-off in ANY parsed round
  latestCutoffInLastFour: { date: string; cutoff: number } | null;
};
export function summarise189Rounds(
  rounds189: { date: string; cutoff: number | null }[],
): RoundSummary; // input newest first
export const CHIP_LABEL: Record<RoundStatus, string>; // regular: "Regular invitations", occasional: "Occasional invitations", none: "No recent invitations"
```

**Status rules:**

- **regular:** listed in all of the last four rounds.
- **occasional:** listed in 1–3 of them.
- **none:** listed in none.

If fewer than four rounds exist, use the ones there are, and record `roundsConsidered`.

- [ ] **Step 1: Write failing tests.**
  - `formatCount({0,19})` is "under 20".
  - `formatCount({1132,1132})` is "1,132".
  - `formatCount({872,891})` is "872–891".
  - `countPhrase({0,19})` is "under 20, so may be zero".
  - `formatMonth("2026-10")` is "Oct 2026".
  - `submissionMonth("")` and `submissionMonth("2025-13-01")` are `null`.
  - The Software Engineer rounds `[null, null, null, null, 95 (2024-11-07), 100 (2024-09-05)]` give `status "none"`, `listedInLastFour 0` and `latestCutoff {date:"2024-11-07", cutoff:95}`.
  - Four listed rounds give "regular". Two give "occasional".
  - `[]` gives "none" with `roundsConsidered 0` and `latestCutoff null`.
  - `BANNED_COPY` matches "you should apply" but not "EOIs".
- [ ] **Step 2: Run** `npx vitest run src/lib/report/`. Expect FAIL: modules missing.
- [ ] **Step 3: Implement both files.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): add copy helpers and 189 round status`

