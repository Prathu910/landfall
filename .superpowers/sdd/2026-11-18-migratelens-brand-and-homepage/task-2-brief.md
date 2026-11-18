### Task 2: Readable type everywhere (the 12px floor)

**Files:**

- Create: `src/app/css-floor.test.ts`
- Modify: `src/app/globals.css` and any `src/**/*.module.css` with small text; small local layout fixes where needed

**Interfaces:**

- Consumes: Task 1 tokens.
- Produces: no new API.

- [ ] **Step 1: Write the failing test** `src/app/css-floor.test.ts`. It parses every `font-size` declaration in `globals.css` and `src/**/*.module.css`, including inside media queries, and asserts:
  - no `px` value under 12, and no `rem`/`em` value under `0.75`;
  - `clamp()`/`min()` minimums follow the same rule;
  - percentage and keyword values are skipped.

  The failure message lists `file:line value`.

- [ ] **Step 2: Run** `npx vitest run src/app/css-floor.test.ts`. **Expected:** FAIL, listing roughly 125 declarations.
- [ ] **Step 3: Raise every declaration to at least 12px.**
  - Make body copy at least 16px under `@media (max-width: 720px)`.
  - Allow small local layout fixes (padding, wrapping, a column becoming two rows at 390px).
  - Don't redesign report sections. Any section that can't hold 12px text without a redesign goes in the report under "needs the controller", left at 12px with an overflow-safe wrap.
- [ ] **Step 4: Run** `npm run check` and `npm run build`. Then, headless against `out/` at 1440 and 390, check `/`, `/check/`, `/sample/`, `/states/` and `/methodology/`: `scrollWidth <= viewport width`, and no text node with computed `font-size` under 12px. Save screenshots of `/sample/` at both widths to `.superpowers/sdd/<plan>/screenshots/`.
- [ ] **Step 5: Commit** `fix(type): no text under 12px and 16px body text on mobile`.

