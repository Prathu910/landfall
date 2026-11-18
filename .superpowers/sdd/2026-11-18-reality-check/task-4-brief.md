### Task 4: 189 panel view-model, part 2 (EOIs like yours, what could change)

**Files:**

- Create: `src/lib/report/eois-like-yours.ts`, `src/lib/report/what-could-change.ts`
- Test: one `*.test.ts` each

**Interfaces:**

```ts
export type CohortRow = {
  month: MonthKey;
  label: string;
  invited: string;
  lodged: string;
  waiting: string;
  closed: string;
  isYours: boolean;
};
export type EoisLikeYours =
  | {
      kind: "ready";
      month: MonthKey;
      basis: "your-month" | "latest-complete";
      basisNote: string | null; // latest-complete: "You haven't added an EOI date, so this shows EOIs submitted in {Mon YYYY}."
      sentence: string; // spec 2.4 verbatim: "Of the {range} {occupation} EOIs from {Mon YYYY}, as at {Mon YYYY}: {invited} are invited and {lodged} have a visa application lodged."
      numbers: {
        invited: string;
        lodged: string;
        waiting: string;
        closed: string;
        hold: string | null;
      }; // hold null when {0,0}
      bar: {
        invited: Interval;
        lodged: Interval;
        waiting: Interval;
        closed: Interval;
      };
      closedNote: string; // "Closed means expired, withdrawn or finalised (finalised includes granted visas)."
      nearby: CohortRow[]; // up to two months either side that exist, ascending, yours flagged
    }
  | { kind: "too-old"; text: string } // "Not available for EOIs this old."
  | { kind: "unavailable"; text: string } // "Published outcomes by submission month are not available for this occupation."
  | { kind: "loading" };
export function buildEoisLikeYours(input: {
  occupationName: string;
  core: OccupationCore;
  detail: OccupationDetail | null;
  submittedMonth: MonthKey | null;
  asOf: string;
}): EoisLikeYours;

export type ChangeItem = {
  label: string;
  effect: string;
  href: "#timeline" | "#scenarios";
}; // effect "+10" | "−5"
export function buildWhatCouldChange(
  events: TimelineEvent[],
  scenarios: { label: string; delta: number }[],
  asOf: string,
): ChangeItem[]; // next 2 future events with a non-zero delta, then the 2 largest positive scenarios
```

**Rules:**

- **Latest complete month:** the as-at month minus one.
- **Too old:** the EOI month is before the earliest stored cohort month (`cohortWindowStart`, ruling R8).
- **Range:** the sum of all five statuses, as an interval.
- **Waiting** is SUBMITTED.
- Check `TimelineEvent` and the scenario shape in `src/lib/migration.ts` and `src/lib/scenarios.ts`, and adapt the parameter types to the real exported types. Don't duplicate them.

- [ ] **Step 1: Write failing tests,** using a fixture with nurse-like Feb 2025 values (S 142, I 175, L 60, H "<20", C 510):
  - The sentence is "Of the 887–906 Registered Nurses nec EOIs from Feb 2025, as at Oct 2026: 175 are invited and 60 have a visa application lodged."
  - `hold` is "under 20".
  - `nearby` holds at most 5 rows and flags Feb 2025.
  - **Review Focus 2:**
    - no EOI date gives `latest-complete`, with the note naming Sep 2026 for as-at 2026-10;
    - an EOI month older than the window gives "too-old".
  - `buildWhatCouldChange` drops past events and events with zero delta.
  - `BANNED_COPY` never matches any output.
- [ ] **Step 2: Run** these tests. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expect PASS.
- [ ] **Step 5: Commit** `feat(report): add EOIs-like-yours and what-could-change view-models`

