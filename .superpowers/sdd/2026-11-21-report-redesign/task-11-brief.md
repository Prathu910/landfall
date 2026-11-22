### Task 11: Brand tokens and fonts

**Files:**

- Modify: `src/app/globals.css` (`:root`), `src/lib/brand/palette.ts`, `src/app/layout.tsx`, `package.json`, `package-lock.json`
- Test: existing `src/lib/brand/palette.test.ts` (extend)

**Interfaces:**

- Produces CSS tokens `--label-{very-strong|strong|competitive|long-wait|not-invited|not-eligible|not-open|no-data}-ink` and `-bg`, and `--font-report` (Archivo variable) and `--font-stamp` (Big Shoulders Stencil Display). Values from the mockup: very-strong `#0F6B3C`/`#D6EFE0`, strong `#1E7A4C`/`#E5F3EA`, competitive `#A06400`/`#FBEFD6`, long-wait `#C2410C`/`#FDE8DB`, not-invited `#B42318`/`#FCE5E3`, not-eligible `#5B3F9E`/`#ECE6F8`, not-open `#B42318`/`#FCE5E3`, no-data `#586470`/`#E8ECEF`. `palette.ts` gains `LABEL_PAIRS` mirroring them.

- [ ] **Step 1: Extend the palette test**: every `LABEL_PAIRS` ink on its bg and on white meets 4.5:1; `globals.css` tokens equal `LABEL_PAIRS`.
- [ ] **Step 2: Run** `npx vitest run src/lib/brand`. Expected: FAIL.
- [ ] **Step 3: Install** `npm install --save-exact @fontsource-variable/archivo@5.3.0 @fontsource/big-shoulders-stencil-display@5.3.0`; import the width-axis Archivo CSS (check `node_modules/@fontsource-variable/archivo/` for `wdth.css`; use the default file if none) and `@fontsource/big-shoulders-stencil-display/latin-800.css` and `latin-900.css` in `layout.tsx`; add tokens. If a contrast pair fails, darken the ink until AA passes and note it in the commit.
- [ ] **Step 4: Run** `npx vitest run src/lib/brand && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(brand): outlook label tokens and report fonts`.

