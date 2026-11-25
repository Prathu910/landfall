# Task 3 report: Look A card templates and preview

**Status:** DONE_WITH_CONCERNS (concerns are hand-offs to Task 4 plus one product risk; the task itself is complete)
**Commit:** 9ab09d8 `feat(social): Look A card templates` (base 9d92968)

## What I implemented

- `scripts/social/tokens.ts`: `cardTokenCss(theme)` returns `:root{color-scheme:<theme>;--desk:…;…}` with plain per-theme values. Every colour is a named palette entry paired with its night twin: SHELL_PALETTE (desk = sage, paper, ink, muted, line, green), CHECK_PALETTE.soft (fact boxes), HOMEPAGE_TEXT.lede, PALETTE.saffron (marks only), UPDATES_MAP 1–4 and the new ARTWORK group (see below). It also defines the fonts (`--font`, `--font-stamp`) and the site's non-colour switches: guilloche paint, mask and opacity (0.9 / 0.27, the mockup's `--guill-opacity * .9`), `--stamp-glow` and `--page-shadow` (a `color-mix` of tokens).
- **New palette group `ARTWORK` / `ARTWORK_DARK`** (`palette.ts`, `palette-dark.ts`): rule, map edge and edge-strong, map shades 1–3, map shadow, guilloche a and b. These were already `light-dark()` tokens in globals.css (`--homepage-rule`, `--homepage-map-*`, `--guilloche-a/b`) but had no palette mirror. I added them so the cards take every colour from palette.ts per CLAUDE.md and ENGINEERING.md, and added a mirror test in `palette.test.ts` (globals.css unchanged, so no light-fallback regeneration was needed).
- `scripts/social/html.ts`: `cardHtml(card, format, theme)` builds a full document. Both faces are loaded by `file://` URL under the exact family names Task 4's `fonts.check` uses ("Archivo", weight 100–900 with stretch 62–125%, and "Big Shoulders Stencil Display" 900). It inlines the tokens and `card.css`, renders the template with `renderToStaticMarkup`, and sizes the frame and body from `FEED`/`STORY`/`OG` in social-spec. `writeCardHtml(jobs, dir)` writes `<dir>/<basename of out>.html`; its `HtmlJob` has RenderJob's fields (`card`, `format`, `theme`, `out`), so Task 4's `--html-only` can pass its jobs straight in. It also exports the `CardFormat` and `Theme` types.
- `scripts/social/card.css`: the mockup's Look A rules with every colour a token. Format classes are `.feed`, `.story` (inner padding 290 top / 380 bottom) and `.og`, a landscape cover with no swipe cue and no "n/N" position.
- `scripts/social/templates/`:
  - `card-page.tsx`: the frame, guilloche, logo from `markSvgBody("var(--ink)")` (R15), the tag "Oct 2026 · 3/6" (card 2 and OG show no position), the source line with its "as at" date in bold, and the MRZ. On a story, all content sits in one `<div class="content" data-safe="">`.
  - `cover-card.tsx`: handles both `cover` and `round-cover`. The title size comes from line length, so "15 September" fits. Covers with no round use the `no-round` layout and the round cover uses `single`. `data-essential` marks the text and stamps.
  - `round-card.tsx`: score ranges don't break at the en dash.
  - `state-card.tsx`
  - `spotlight-card.tsx`: handles a null stamp, "Not listed" columns, the little-changed note and empty facts.
  - `closing-card.tsx`: shows the handle `@migratelens`, with the disclaimer pinned above the source.
  - `card-map.tsx`
  - `swipe-cue.tsx`: an SVG arrow; there is no "→" anywhere.
- **Shared map geometry:** I moved the recap map's label placement (draw order, ACT circle, nudges, tilt) into `src/components/updates/state-map-geometry.ts`, which uses relative imports only, so `card-map.tsx` and `state-recap-map.tsx` share it. The recap page's map markup in the built `out/updates/2026-10/index.html` is **byte-identical** before and after (98,836 bytes, `cmp` clean).
- `src/app/colour-literals.test.ts` now also walks `scripts/social/`. It checks `.tsx` files and the `.css` there. I planted `#fff` in card.css and `stroke="#000"` in swipe-cue.tsx: both were caught, then reverted.

## Decisions and deviations from the mockup

- **The guilloche is inlined as a `data:` URI**, not referenced by `file://`. Chrome treats a `file://` mask image as cross-origin and drops it, so the night linework vanished in my first dark render. The source is still the site's `public/report-passport-a.svg`.
- **`.inner { overflow: hidden }`.** Without it, content running into `.inner`'s bottom padding was invisible to a `scrollHeight > clientHeight` check: the state cards overflowed by 17 px and the check passed. As a scroll container, `.inner` counts its end padding, so the overflow is now detected (verified). Titles marked `.fit` get `padding-bottom: .06em` with a matching negative margin, because Archivo's glyphs reach below the tight 0.98 line box and would otherwise trip the check falsely.
- **Map labels use ink on every band**, as the recap map does, which has tested contrast pairs. The mockup used muted and map-label colours, which fail on the deeper bands.
- **Card 2 sizing:** the mockup's 189 card overflowed its source line. I tightened the bar heights, the row font and the block spacing so everything fits.
- **The spotlight heading adds " · lowest score invited"** in the template, as the mockup and the alt text in social-copy.ts do. This is the only template-only copy besides "MigrateLens".
- The MRZ uses Archivo (plan decision 4).

## Tests

- `scripts/social/tokens.test.ts` (4 tests):
  - Every `var()` in card.css is defined, in both themes.
  - **R14:** every `var()` in the rendered HTML of every 2026-10 card × feed/story/og × light/dark is defined.
  - Both themes have the same token names and their own `color-scheme`.
  - The values come from the palette and its night twin.
- `scripts/social/html.test.ts` (13 tests): both faces load by `file://` URL; occupation names are escaped (a fixture "Fish & Chips Cook" renders as `&amp;`); story content is wrapped in `[data-safe]` and feed content isn't; the cover is marked `data-essential`; frame sizes are right for each format; the theme and colour scheme come through; no "→" glyph appears; card 2 is unnumbered; the cover of a month with no round has no round stamp; the round cover has its single stamp; TAS 491 shows "<20" / "each occupation"; the closing card has the handle and disclaimer; `writeCardHtml` file naming.
- `palette.test.ts`: the new ARTWORK mirror test. `colour-literals.test.ts`: extended scope.

### TDD evidence

- **RED:** I wrote the implementation and tests in the same pass, not strictly test-first. To show the tests fail without the code, I moved `html.ts` and `tokens.ts` aside and ran `npx vitest run scripts/social`. Result: `Test Files 2 failed (2)` with an import failure at `import { cardHtml } from "./html"`. That is expected, since the modules didn't exist. The planted-literal run above is a real RED for the colour-literal scan: `Tests 2 failed | 4 passed`, naming `scripts/social/card.css:658 color: #fff` and `scripts/social/templates/swipe-cue.tsx:14 stroke="#000"`.
- **GREEN:** `npx vitest run scripts/social` gives `Test Files 2 passed (2)`, `Tests 17 passed (17)`.
- `npm run check` gives `Test Files 169 passed (169)` and `Tests 1731 passed (1731)`. Prettier, typecheck and lint are clean. The one ESLint warning is in the untracked mockup folder (`.superpowers/brainstorm/.../lib.js`), which this task didn't touch.
- `npm run build` passes.

## Browser preview (Step 4)

I wrote a scratch script (not committed) that calls `writeCardHtml`. It opens each file through puppeteer-core in headless Chrome at device scale 1 and runs Task 4's planned checks: `fonts.check` for the four faces, `.fit`/`.inner` overflow, the story `[data-safe]` box within 250–1580, the feed `[data-essential]` boxes within 34–1046, and the computed `--paper` value. Then it takes a screenshot.

**Results:**

- All 2026-10 cards pass every check in both themes: the month set, the round cover, story and OG.
- All four fonts load.
- `--paper` reads `#ffffff` in light and `#14212B` in dark.
- The edge cases also pass: a month with no round (cover reads "190 and 491 by state … in four cards", 1/5).
- A fixture spotlight named "Natural and Physical Science Professionals nec" **fails** with `title fit 584x397 > 584x162`. That is the intended overflow failure.

I compared the renders with the mockup PNGs: cover A, 189, 190, 491, spotlight, closing and story cover all match the approved look, light and dark, including the dark guilloche lines and the stamp glow.

**Screenshots** (27) are in `.superpowers/sdd/2026-11-24-monthly-updates-2-instagram-images/task-3-screens/`. The main ones:

- `month-cover-light.png`, `month-cover-dark.png`
- `month-story-cover-light.png`, `month-story-cover-dark.png`, `month-og-cover.png`
- `month-round-light.png`, `month-round-dark.png`
- `month-state-190-light.png`, `month-state-190-dark.png`, `month-state-491-light.png`, `month-state-491-dark.png`
- `month-spotlight-light.png`, `month-spotlight-dark.png`
- `month-closing-light.png`, `month-closing-dark.png`
- `round-round-cover-light.png`, `round-round-cover-dark.png`, `round-story-round-cover-*.png`, `round-og-round-cover.png`
- `noround-cover-light.png`, `noround-cover-dark.png`, `noround-og-cover.png`
- `long-spotlight-light.png` (overflowing; a negative check)

## Files

- Created: `scripts/social/{tokens.ts, tokens.test.ts, html.ts, html.test.ts, card.css}`, `scripts/social/templates/{card-page, cover-card, round-card, state-card, spotlight-card, closing-card, card-map, swipe-cue}.tsx`, `src/components/updates/state-map-geometry.ts`
- Modified: `src/app/colour-literals.test.ts`, `src/components/updates/state-recap-map.tsx` (imports the shared geometry), `src/lib/brand/palette.ts`, `palette-dark.ts`, `palette.test.ts` (ARTWORK)

## Concerns / notes for Task 4 and the controller

1. **Use `page.goto(file://…)`, not `setContent`.** The Task 4 plan says `setContent(html)`, but that leaves the page on `about:blank`, and Chrome normally refuses `file://` subresources (the fonts) from there. My preview wrote each document to disk with `writeCardHtml` and used `page.goto(pathToFileURL(file))`, which loads everything. If Task 4 keeps `setContent`, its font check will likely fail.
2. **The `[data-essential]` boxes on the OG image lie outside 34–1046.** The OG canvas is 1200 wide, so this is expected. Task 4's check should apply to feed covers only, as the plan says.
3. **Product risk: long spotlight names fail the render.** The spotlight title wraps to two lines and the render fails beyond that (Review Focus). Popular occupations with long names, such as "Registered Nurse (Disability and Rehabilitation)" (48 characters), would fail, which blocks the month set until the founder swaps the spotlight. Card 2's pick rows wrap to two lines and fit names up to about 53 characters (the longest in the index). If that's unwanted, the spotlight title could step down in size for long names, as the cover title already does.
4. **The ARTWORK palette group and the shared map geometry module are small changes outside the brief's file list**, made to follow the colour rule and avoid duplicating the map placement. The recap map output is verified identical.

---

## Fix round 1 (review: two Important issues)

**Commit:** 98d57cd `fix(social): fit long spotlight names and keep the stamp in place` (a new commit; nothing amended)

### 1. Long spotlight titles blocked the month set

- **New `scripts/social/title-fit.ts`.**
  - `textEm(text)` estimates a title's width from a per-character advance table measured in Chrome from the bundled face (Archivo 800, 112% width, -0.025em tracking), with a 2% margin. Unlisted characters count as the widest letter.
  - `estimatedLines(text, size, width)` wraps between words only. It returns Infinity when a single word is wider than the box.
  - `fitTitle(text, box)` returns the largest size that fits, and whether it fits.
  - `SPOTLIGHT_TITLE` is 506 px wide (816 px content minus the 290 px stamp column and 20 px gap) and 162 px tall. Sizes are 80, 64, 52, 46 and 40 px.
  - The number of lines allowed comes from the box height: two lines at 80 and 64, three at 52 and 46, four at 40.
- **Sizes.** The reviewer suggested 80 → 64 → 52. Those three steps still failed "Software and Applications Programmers nec" and "Computer Network and Systems Engineer", so I added 46. A scan of all 493 index names then showed 13 more failing, all on long words such as "Telecommunications" and "Otorhinolaryngologist", so I added 40.
  - Every name in the index now fits, which also covers a founder swap.
  - "Registered Nurses nec" (2026-10) stays at 80 px, as in the mockup.
- **Template.** `spotlight-card.tsx` sets the title's font size from `fitTitle` and its max height from `SPOTLIGHT_TITLE.height`. These replace the CSS `max-height: 2.02em; font-size: 80px`.
  - The `.fit` overflow guard stays. A name nothing fits renders at 40 px and fails the render.
- **Cover.** `cover-card.tsx`'s `titleSize` now uses the same `textEm` estimate instead of a flat 0.66em per character.
- **Spotlight candidates.** `popularOccupations(cores, month)` is extracted from `pickSpotlight` in `src/lib/updates/spotlight.ts` with no behaviour change; the existing spotlight tests pass. Tests can now list the spec 6.8 candidates.
- **Note for Task 4.** "Natural and Physical Science Professionals nec" now **fits** at 46 px (three lines), so it no longer works as the overflow fixture. The failing fixture I used is "Supercalifragilisticexpialidocious Specialist", one word wider than the column at every size.

### 2. A long single word pushed the stamp aside

- `card.css` sets `.spot-head > div { min-width: 0; }`. An unbreakable word now overflows its `.fit` title and the `scrollWidth` check catches it; the `1fr` track no longer widens.
- With the new sizes, "Developer Programmer", "Engineering Technologist" and "Analyst Programmer" render at 64 px with the stamp in place. The Chrome test asserts that the stamp's left edge is identical to the 2026-10 baseline for all 20 names.

### Covering tests

- **`scripts/social/title-fit.test.ts`** (pure, 8 tests):
  - Each of the 20 most popular names for 2026-10 (spec 6.8 rule, `popularOccupations(loadAllCores(), "2026-10")`) fits.
  - Every name in `occupation-index.json` fits.
  - "Registered Nurses nec" stays at 80 px.
  - The steps land where expected: Developer Programmer at 64, Early Childhood at 52, Telecommunications Engineer at 40.
  - The unbreakable fixture gives `{ size: 40, fits: false }`.
  - Lines wrap only between words, and a too-wide word gives Infinity.
  - The estimate errs wide of the measured "Programmer" (6.71em) and "Registered" (5.87em).
- **`scripts/social/spotlight-render.test.ts`** (headless Chrome via puppeteer-core; skipped unless `CHROME_PATH` is set or the macOS Chrome exists):
  - It renders the spotlight card with each of the 20 names and asserts no `.fit`/`.inner` overflow and the stamp's left edge unchanged. "Computer Network and Systems Engineer" is asserted to be in the list.
  - It renders the unbreakable fixture and asserts a `title fit` overflow with the stamp in place.
  - It uses `page.goto(file://)` and a string `evaluate`, because tsx injects `__name` helpers into function arguments that the page doesn't have. Task 4 should do the same.

### RED evidence (each fix removed in turn, then restored)

- Without `min-width: 0`: `npx vitest run scripts/social/spotlight-render.test.ts` gave `AssertionError: expected [ 'inner' ] to include 'title fit'` and `Tests 1 failed | 1 passed (2)`.
- With the title fixed at 80 px: `AssertionError: Early Childhood (Pre-primary School) Teacher: expected [ 'title fit' ] to deeply equal []` and `Tests 1 failed | 1 passed (2)`.
- The 80/64/52 ladder alone: `title-fit.test.ts` failed on "Software and Applications Programmers nec". This is why the 46 step was added.

### GREEN

- `npx vitest run scripts/social` gave `Test Files 4 passed (4)` and `Tests 27 passed (27)`. The Chrome tests ran (verbose: both ✓, about 1.1 s), not skipped.
- `npm run check`:
  - format:check: "All matched files use Prettier code style!"
  - lint: 0 errors. The single warning is in the untracked mockup `lib.js`.
  - typecheck: clean.
  - `npm test`: `Test Files 171 passed (171)`, `Tests 1741 passed (1741)`.
- **Flaky timeouts.** One earlier full run had 5 failures and a second had 1. Each was a 5-second timeout in unrelated suites under CPU load (for example `src/lib/outlook/view.test.ts > 'strong'`, "Test timed out in 5000ms"). The two runs after that passed 1741/1741, and the final run passed. Task 4's Chrome render tests will add similar load.

### Previews

I re-rendered every 2026-10 preview with the same scratch script and checks. Everything passes: fonts, overflow, story safe zone, the feed cover's essential area, and `--paper` in both themes. The only failure is the deliberately failing `spot-unbreakable-light.png`, which reports `title fit 709x81 > 506x81`.

The new screenshots are in `task-3-screens/`:
- `spot-developer-programmer-light.png`
- `spot-engineering-technologist-light.png`
- `spot-analyst-programmer-light.png`
- `spot-computer-network-light.png`
- `spot-early-childhood-light.png`
- `spot-unbreakable-light.png`

The existing month, round, no-round and OG screenshots there were refreshed too.
