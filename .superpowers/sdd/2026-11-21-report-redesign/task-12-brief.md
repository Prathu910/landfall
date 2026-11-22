### Task 12: Stamp components

**Files:**

- Create: `src/components/report/big-stamp.tsx`, `visa-stamp.tsx`, `shift-stamps.tsx`, `use-fit-stamp-text.ts`, `stamp.module.css`, `src/lib/outlook/stamp-geometry.ts`
- Test: `src/lib/outlook/stamp-geometry.test.ts`

**Interfaces:**

- Consumes: `labelName`, `stampName`, label tokens.
- Produces: `<BigStamp label ring bottom tooFew />`, `<VisaStamp shape top word points label rotate />`, `<ShiftStamps from to />` (each `role="img"` with an `aria-label` naming the labels). `stamp-geometry.ts`: `export function stampLines(word: string, maxChars = 12): string[]; export function stampFontSize(text: string, width: number, max: number): number;` (fit ratio 0.56 as in the mockup). `useFitStampText(ref)` measures `text[data-fit]` after `document.fonts.ready` and sets `textLength` + `lengthAdjust="spacingAndGlyphs"` when wider than `data-fit`. Ink filter: one `<filter id>` per component instance via `useId`.

- [ ] **Step 1: Write the failing tests**: `stampLines("NOT ELIGIBLE YET")` → `["NOT ELIGIBLE","YET"]`; `stampLines("COMPETITIVE")` → one line; `stampFontSize("COMPETITIVE", 250, 56)` ≈ 36.2 (±0.1).
- [ ] **Step 2: Run** `npx vitest run src/lib/outlook/stamp-geometry.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the helpers and components following the mockup SVG (`bigStamp`, `visaStamp`, `shiftStamps` in `report-e-final.html`), with colours from tokens and the stamp font from `--font-stamp`.
- [ ] **Step 4: Run** `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(report): ink stamp components`.

