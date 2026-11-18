### Task 10: State outlook UI (tiles and panels)

**Files:**

- Create: `src/components/report/state-outlook.tsx`, `state-tile.tsx`, `state-panel.tsx`, and CSS modules

**Behaviour, following the E2 mockup and spec §4:**

- **Section:** `<section id="state-outlook">` with an h2. A 190 / 491 segmented control (Mantine) appears on screen and is hidden in print, where both visas' grids are printed one after the other.
- **Hash targets:** `#state-outlook-190` and `#state-outlook-491` select the matching visa on load.
- **Grid:** 4 × 2 tiles, 2 × 4 at 390px.
- **Tiles:**
  - the colour encodes the group, using design tokens and AA contrast;
  - the group label is always shown as text;
  - each tile is a button or link that opens or scrolls to its panel.
- **"Any state" tile:** separate and smaller.
- **Panels:** below the grid, every panel is visible in print. On screen they can be collapsed with `<details>` (the global print rule already expands them).
- **Order:** group order, then evidence.

- [ ] **Step 1: Implement.** Prove the CSS modules compile with a temporary import plus build, then revert it.
- [ ] **Step 2: Run** `npm run check && npm run build`.
- [ ] **Step 3: Commit** `feat(state): add the state outlook tiles and panels`

