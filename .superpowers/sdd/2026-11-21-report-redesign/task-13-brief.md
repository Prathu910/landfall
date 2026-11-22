### Task 13: Chart and route components

**Files:**

- Create: `src/components/report/cutoff-columns.tsx`, `queue-squares.tsx`, `route-line.tsx`, `route-list.tsx` (+ `.module.css` each)

**Interfaces:**

- Consumes: `CutoffColumns`, `QueueView` (Task 8), `Route` (Task 7).
- Produces: `<CutoffColumns data narrow? />` (viewBox 400 wide, or 340 with text ×1.18 when `narrow`), `<QueueSquares data narrow? />` (27 columns, or 20 when narrow, one-column legend), `<RouteLine route width? />` (horizontal SVG; default 860, print 700), `<RouteList route />` (vertical HTML `<ol>`). Screen components render both wide and narrow variants and switch with `@media screen and (max-width: 720px)`.

- [ ] **Step 1: Implement** the four components from the mockup's `cutoffChart`, `queueSquares`, `routeLine`, `routeList`.
- [ ] **Step 2: Run** `npm run check`. Expected: PASS (the 12 px floor test passes; SVG font sizes ≥ 12 at their smallest rendered scale).
- [ ] **Step 3: Commit** `feat(report): cut-off, queue and route graphics`.

