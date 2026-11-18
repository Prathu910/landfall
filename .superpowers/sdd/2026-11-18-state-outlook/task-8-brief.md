### Task 8: State tile and panel view-models

**Files:**

- Create: `src/lib/state-outlook/view.ts`
- Test: `src/lib/state-outlook/view.test.ts`

**Interfaces:**

```ts
export type Tile = {
  state: StateCode;
  group: Group;
  label: string;
  fragment: string;
  href: string; /* "#state-<visa>-<code>" */
};
export type StatePanel = {
  id: string;
  heading: string; // "Victoria · 190"
  groupLabel: string;
  canApply: {
    text: string;
    mark: "✓" | "✗" | "?";
    source: string;
    checkedNote: string;
  }[]; // checkedNote "checked 17 Nov 2026" | "Last checked 1 Sep 2026; may have changed" | "Not yet verified on the official page"
  data: string[]; // evidence sentences (competitors at or above, per-month invitations at or below, peak, score range); masked → countInSentence / "under 20 invited, so may be zero"
  pointsThere: string[]; // federal points with nomination; own-system line when the rules name one: "Victoria ranks with its own points test (not calculated here)."
  resultsLink: { href: string; text: string } | null; // the state's published results page, if any, as "past results, not a prediction"
  footer: string; // "Not advice to apply. Rules change; check the official page."
};
export function buildTiles(outlook: Outlook): Tile[];
export function buildStatePanel(
  outcome: StateOutcome,
  rules: StateVisaRules,
  points: number,
  asOf: string,
): StatePanel;
export function buildAnyStateTile(
  anyState: StateSide,
  visa: StateVisa,
): { label: string; fragment: string };
```

**Fragments:**

| Case                                  | Fragment                                               |
| ------------------------------------- | ------------------------------------------------------ |
| Confirmed peak at or below your score | "at least {n} invited at ≤{points} (as at {Mon YYYY})" |
| Masked                                | "under 20 invited, so may be zero"                     |
| None                                  | "no invitations recorded at your score in 12 months"   |
| Not open                              | the short reason                                       |

- [ ] **Step 1: Write failing tests.**
  - **Review Focus 5:** an all-masked state gives the `watching` fragment "under 20 invited, so may be zero".
  - A stale rule's `checkedNote` reads correctly.
  - A secondary rule says "Not yet verified on the official page".
  - The VIC own-system line is present.
  - `BANNED_COPY` matches nothing.
- [ ] **Steps 2–4:** RED, implement, `npm run check && npm run build`.
- [ ] **Step 5: Commit** `feat(state): build state tiles and panels`

