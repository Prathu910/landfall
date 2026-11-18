### Task 8: 189 panel components

**Files:**

- Create, in `src/components/report/`: `queue-bar.tsx`, `panel-189.tsx`, `eois-like-yours.tsx`, `rounds-tiles.tsx`, plus CSS modules as needed.

**Interfaces:**

- `QueueBar({ segments, labels })`: an SVG or CSS bar.
  - Widths use the interval midpoint; every label uses `formatCount`.
  - It needs a text equivalent (`aria-label` plus a visible sentence).
- `Panel189({ whereYouStand, trend, sameScore, rounds, eois, changes, source })`, in the approved order: where you stand (with the existing `TrendChart` and its coverage caveat, reused from `src/components/report/trend-chart.tsx`), among your score, recent rounds, EOIs like yours, what could change.
  - Section id `visa-189`.
  - "See all rounds" is a `<details>` that prints open: add `@media print { details > :not(summary) { display: block } }`, or use the project's existing print rule if there is one.
- `EoisLikeYours`: the sentence, four numbers, a stacked bar, `closedNote`, and the nearby-months table inside `<details open>` ("Compare with nearby months"), visible in print.

Steps:

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 3: Commit** `feat(report): add the 189 detail panel components`

