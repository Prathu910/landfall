### Task 7: Scorecard component

**Files:**

- Create: `src/components/report/scorecard.tsx` and `scorecard.module.css`
- Test: render-free. Logic is already tested; verify visually in Task 10.

**Interface:** `export function RealityScorecard({ scorecard }: { scorecard: Scorecard })`. It renders:

- a dark headline strip with the source line under it;
- three cards in a grid, stacking at ≤ 720px in the order 189, 190, 491;
- the overlap note.

Each card shows its title, chip (colour plus the text label), sentence, points with note, "Ahead of you" / "At your score" rows when present, and a details link (`href`). Use the design tokens from `globals.css`. Follow the mockup `scorecard-depth-v2.html`. No animation beyond what `Reveal` already does, and that respects reduced motion.

- [ ] **Step 1: Implement** the component and CSS module.
- [ ] **Step 2: Run** `npm run check && npm run build`. Expect PASS.
- [ ] **Step 3: Commit** `feat(report): add the reality-check scorecard component`

