# Task 12 report: Stamp components

Status: DONE_WITH_CONCERNS. Commit `a2ad468 feat(report): ink stamp components`.

## What was implemented

- `src/lib/outlook/stamp-geometry.ts` (pure, 140 lines):
  - `stampLines(word, maxChars = 12)`: greedy break at spaces; a single over-long word stays whole.
  - `stampFontSize(text, width, max)`: `min(max, width / (len × 0.56))`, the mockup's `fit`.
  - `floorUnits(viewBoxWidth, minWidth)`: the user-unit size that renders at 12px at the stamp's narrowest layout width.
  - `stampTextSize(text, width, max, floor)`: the fitted size, never under the floor. Text that is then too wide gets squeezed by the hook, not shrunk.
  - `longestLine`, `bigWordLayout(lineCount, size)` (the mockup's box and baseline maths), `viewBoxAttr`.
  - `BIG_STAMP`, `VISA_STAMP`, `SHIFT_STAMP` specs: viewBox, `minWidth`, `floor`, the text sizes and fit widths, plus `fixedSizes`, so a unit test proves every fixed size clears the floor.
- `src/components/report/big-stamp.tsx`: `<BigStamp label ring bottom tooFew />`. It has two rings, ring text on a top arc and bottom text on a lower arc, and a ruled word box. The word comes from `stampName(label, tooFew)`, so "TOO FEW TO / COUNT" breaks onto two lines. The aria-label is `Stamp: {ring}, {labelName(label, tooFew)}`.
- `src/components/report/visa-stamp.tsx`: `<VisaStamp shape top word points label rotate />`. The frame is a rect, hex or oval using the mockup's coordinates. The three lines are top, word and `{points} PTS`. The aria-label is `{top}: {word}, {points} points`, and it reads the full label name when the word is the short stamp name (for example "Not currently invited", not "Not invited").
- `src/components/report/shift-stamps.tsx`: `<ShiftStamps from to />` takes `Shift` from `losses.ts`: two tilted boxes and an ink arrow. The aria-label is `From 70 points, Competitive, to 80 points, Very strong`.
- `src/components/report/use-fit-stamp-text.ts`: `useFitStampText(ref)` clears and re-measures every `text[data-fit]`. When the text is wider than `data-fit` it sets `textLength` and `lengthAdjust="spacingAndGlyphs"`. It runs on mount and on every render, after `document.fonts.ready`, and on `loadingdone` (`ready` can settle before the stencil face is first requested). It cleans up on unmount.
- `src/components/report/ink-filter.tsx` (extra file, not in the brief's list): `<InkFilter id />` holds the mockup's `#ink` filter. All three stamps share it so it isn't written three times. Each stamp passes its own `useId`-derived id, and marker/mask/path ids also come from `useId`.
- `src/components/report/stamp.module.css` sets one class per label to `color: var(--label-…-ink)`. Shapes and text draw in `currentColor`, the font is `var(--font-stamp)`, the arrow uses `var(--ink)`, and print uses `print-color-adjust: exact`. No raw colours. Stamps never animate.

## Design decisions to note

1. **12px floor at the smallest layout width.** Spec section 8 puts the visa stamps in 116px rows and the big stamp at about 230px. At those widths the mockup's sizes render under 12px (visa bottom 17u at 116px is about 8px; big-stamp bottom 19u at 230px is 11.9px). Changes:
   - Big stamp bottom text: 19 → 20u.
   - Visa stamp viewBox tightened from `-12 -12 244 184` to `-2 -4 224 168`. It still clears the 5° tilt, the stroke and the filter.
   - Visa top and bottom text fixed at 23.5u, and the word floored at 23.5u.
   - Shift text floored at 14.5u. This assumes a minimum width of 240px, which is what a 320px phone gives.
   - Each svg gets an inline `style={{ minWidth }}` from the spec constants, so layout can't shrink a stamp under its floor. **Tasks 14/15 must leave at least 230 / 116 / 240px for big / visa / shift stamps**, or the stamp overflows its column instead of shrinking.
2. **Visa word stays on one line** (as in the mockup). Big Shoulders is condensed, so "ON 3 STATE LISTS" and "TOO FEW TO COUNT" fit at the floor, and the hook squeezes anything wider. A two-line version crowded the bottom line.
3. **The big stamp masks its rings behind the word box** instead of the mockup's white-filled rect. There is no white token, and this way it works on any band colour. The mask's white and black are luminance values, not visible colours.

## Tests and TDD evidence

- RED: `npx vitest run src/lib/outlook/stamp-geometry.test.ts` failed at import, because `./stamp-geometry` didn't exist yet. Result: "Test Files 1 failed (1), Tests no tests".
- GREEN: the same command now passes 15 tests, covering:
  - `stampLines`: 4 cases.
  - `stampFontSize`: 2 cases.
  - `floorUnits`.
  - `stampTextSize`: 2 cases.
  - The per-spec floor check: 3 cases.
  - `bigWordLayout`: 2 cases.
  - `longestLine`.
- `npm run check`: Prettier, ESLint and tsc clean; Vitest 103 files and 1161 tests pass, including `src/app/css-floor.test.ts`.
- `npm run build`: pass.
- **Browser check.** No page uses the stamps yet; Task 14 wires them in. I added a temporary `src/app/stamp-preview` route, served it from the webpack dev server, and deleted it afterwards along with its `.next/dev/types` entry. `next-env.d.ts` was restored. Results:
  - Playwright measured every stamp text's rendered size (font-size × svg width ÷ viewBox width) at big 340/230px, visa 220/116px and shift 300/240px. The minimum was **12.17px**.
  - The fit hook squeezed "491 ANY STATE" to 130.
  - No duplicate ids. The stencil font loaded. No console errors or hydration warnings.
  - Screenshots at 1× and 2× looked right against the mockup shapes.

## Concerns

1. **Brief value vs mockup formula.** The brief expects `stampFontSize("COMPETITIVE", 250, 56)` ≈ 36.2. The mockup's 0.56 ratio, which the brief names, gives 250 / (11 × 0.56) = **40.58**. I implemented the mockup formula, asserted 40.58 (±0.05), and commented the difference in the test (in the spirit of R2). If 36.2 was intended, the ratio would need to be about 0.628.
2. **The approved mockup and PDFs don't actually render the stamps in Big Shoulders.**
   - The mockup's CSS rule `svg text { font-family: "Archivo", sans-serif; }` overrides the SVG `font-family` attribute.
   - `pdffonts` on `pdf/7-nothing-suits-dev.pdf` lists only Archivo.
   - So the founder's reference stamps are wide Archivo 800/900. Following the spec and `--font-stamp`, these components use the condensed Big Shoulders Stencil, so the words look narrower and fill less of the box than in the PDFs.
   - Worth confirming with the founder. Switching back would be a token change, and the floor and fit maths still hold.
3. One extra file (`ink-filter.tsx`) beyond the brief's list, to avoid three copies of the filter.
4. `minWidth` is enforced inline (see design decision 1), which constrains Task 14/15 layouts.

## Files

- `src/lib/outlook/stamp-geometry.ts`, `src/lib/outlook/stamp-geometry.test.ts`
- `src/components/report/big-stamp.tsx`, `visa-stamp.tsx`, `shift-stamps.tsx`, `ink-filter.tsx`, `use-fit-stamp-text.ts`, `stamp.module.css`

## Self-review

- Each component file is under 160 lines and the lib module is 140 lines.
- One exported component per file. `Frame` and `ShiftBox` are private helpers.
- `src/lib` is pure and uses relative imports only.
- Every svg has `role="img"` and an aria-label that names its label(s).
- No `any`, no raw colours, no literal font sizes in TSX under 12.
- No dead code: I removed the two-line visa layout (`visaWordBaselines`, `twoLineWordMax`) after choosing one line.

---

# Fix round 1 (R22 font swap, fit-hook safety, arc caps)

Commit: `65ddf0f fix(report): stamps in wide Archivo, arc caps, safe fit`.

## Changes

- **Font (R22).**
  - `--font-stamp` is now `"Archivo Variable", "Inter", Arial, sans-serif` in `globals.css`.
  - Removed the two Big Shoulders imports from `layout.tsx` and ran `npm uninstall @fontsource/big-shoulders-stencil-display` (package.json + lock; the diff only removes that package).
  - `palette.test.ts` now asserts that `--font-stamp` starts with Archivo Variable and that globals.css has no "Big Shoulders".
- **Calibration.** I measured Archivo 800 in Chrome (Playwright, local woff2) and recorded em per character for the stamp strings:

  | String | 100% | 116% | 62% |
  |---|---|---|---|
  | COMPETITIVE | 0.665 | 0.765 | 0.452 |
  | NOT ELIGIBLE | 0.608 | 0.700 | |
  | VERY STRONG | 0.687 | 0.798 | |
  | ON 3 STATE LISTS | 0.571 | 0.665 | 0.378 |
  | TOO FEW TO COUNT | 0.651 | 0.763 | 0.430 |

  - `FIT_RATIO` is now 0.628, the mean width of Archivo 800 capitals at 100% stretch. So `stampFontSize("COMPETITIVE", 250, 56)` = 36.19. That matches the brief's 36.2 again: **R23 is superseded**, and the test asserts 36.2 ±0.05.
  - Width scales almost linearly with stretch.
- **Wide by default, narrow to fit.** Stamp text renders at `STAMP_STRETCH` = 116% when it has room. When it doesn't, it narrows along Archivo's real width axis, down to `MIN_STRETCH` = 62%, the font's narrowest cut. This replaces geometric squeezing, so condensed glyphs stay well drawn. It works in two stages:
  1. Server/no-JS: `stampStretch(text, size, width, spacing)` sets a static `font-stretch` presentation attribute on every stamp text. A tree that is hidden until printing is therefore already roughly fitted.
  2. `useFitStampText` resets each `[data-fit]` element (`text` or `textPath`) to 116% inline, measures it, and narrows with `fitStretch` in up to two passes. It applies `textLength` only for the small remainder.
- **Fit-hook safety.** `getComputedTextLength` is wrapped in `measure()`, which returns null on a throw or a length of 0. Text it can't measure (for example under `display:none`) is skipped and keeps the server-rendered stretch. Browser check: a hidden stamp in the preview stayed at its static stretch with no errors.
- **Arc caps.**
  - `bigArcWidths(boxHeight)` works out the length of each ring arc that stays clear of the word box: ring radius 120, bottom radius 108, box stroke plus 10u clearance. One-line box: 263.8 / 225.0u. A two-line box is shorter.
  - `capArcText(text, size, arcWidth, spacing)` cuts a line with "…" only when it can't fit even at 62% stretch with an 80% `textLength` squeeze (`ARC_SQUEEZE`).
  - Ring and bottom lines carry `data-fit` on their `textPath`, so the hook fits them to the arc.
  - `ArcText` is a private helper in `big-stamp.tsx`.
- **Visa widths per shape.** `VISA_STAMP.widths[shape]` is `{top, word, bottom}`: rect 160/168/150, hex 160/168/120, oval 130/156/100. The oval word no longer touches the dashed rule.
- Floors, viewBoxes and min widths are unchanged: big 230px / 19.5u, visa 116px / 23.5u, shift 240px / 14.5u. Word weight is 900; edge and ring weight is 800.

## Tests and commands

- RED:
  - `npx vitest run src/lib/brand/palette.test.ts` gave 1 failed (font mirror).
  - `npx vitest run src/lib/outlook/stamp-geometry.test.ts` gave 10 failed: the new estimatedWidth, stampStretch, fitStretch and capArcText cases, plus the 36.2 test.
- GREEN:
  - The palette tests pass: 12 passed.
  - The stamp-geometry tests pass: 27 passed. The new cases cover:
    - `bigArcWidths`: one-line values, and a two-line box giving shorter arcs.
    - `capArcText`: a line that fits stays unchanged; a too-long line is cut with "…" and fits squeezed; "OCT 2026 • 75 POINTS" around a two-line box stays whole.
- `npm run check`: exit 0, 103 files, 1173 tests.
- `npm run build`: exit 0.
  - The first build run failed its type check on a stale `.next/dev/types` entry left by my temporary preview route.
  - I deleted the dev cache (`.next/dev`, which `next dev` regenerates) and both commands then passed.

## Browser check

I used a temporary preview route on the webpack dev server and deleted it afterwards; `next-env.d.ts` was restored. Playwright at device scale 2:

- **Minimum rendered stamp text: 12.17px**, across:
  - big stamps at 230 and 340px;
  - visa stamps at 116 and 220px, for each of the five words;
  - shift stamps at 240 and 300px.
- No duplicate ids, Archivo loaded, no console errors.
- **Stretch each text ends at, at the minimum widths (glyph distortion is only the small `textLength` remainder):**

  | Stamp | Text | Final stretch |
  |---|---|---|
  | Big | COMPETITIVE | 83% |
  | Big | NOT ELIGIBLE | 91% |
  | Big | VERY STRONG | 81% |
  | Big | TOO FEW TO / COUNT | 89% / 116% |
  | Visa | ON 3 STATE LISTS | 73% |
  | Visa | TOO FEW TO COUNT | 64% |
  | Visa | NOT ELIGIBLE | 86% |
  | Visa | COMPETITIVE | 89% |
  | Visa | VERY STRONG | 87% |
  | Visa | 491 ANY STATE (oval top) | 62% |
  | Shift | 85 VERY STRONG | 75% |

- **Look.** The big stamps match the PDFs closely: heavy Archivo, ring text set wide, and the word filling the box. The visa stamps keep the mockup frames.
- **Remaining tightness.** The 116px visa row is dense. "TOO FEW TO COUNT" and "491 ANY STATE" sit near Archivo's narrowest cut there, but they stay readable at 2×. A wider phone visa stamp (about 140px) would loosen this if the founder wants.

## Files

`package.json`, `package-lock.json`, `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/brand/palette.test.ts`, `src/lib/outlook/stamp-geometry.ts` (240 lines), `src/lib/outlook/stamp-geometry.test.ts`, `src/components/report/big-stamp.tsx` (182), `visa-stamp.tsx` (167), `shift-stamps.tsx` (114), `use-fit-stamp-text.ts` (79).
