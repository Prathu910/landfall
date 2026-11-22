# Shared brand and site shell handoff

22 November 2026. Implemented locally on the existing `roadmap/report-redesign` branch. No commit, push, merge or deployment.

## Recommended identity

**Open lens** replaces the old growth-chart mark. A circular lens opens toward the upper right; a single bearing line crosses that opening. It connects the product's purpose—seeing a migration profile in context—with direction, without implying an invitation outcome. Two strokes stay readable at 16, 24 and 32px and work in one ink or reversed white. The comparison board also explores a meridian and passport monogram; the open lens is the quieter, more distinctive choice at small sizes.

The wordmark uses Archivo with deliberate weight contrast between “Migrate” and “Lens”, restrained spacing and no stencil. The existing passport linework and stencil stamps remain supporting product language. The shared shell uses ink `#12202c`, sage `#eef2f0` and white, matching the approved homepage and check. Existing root theme values and other page bodies retain their own styling.

## Implementation and assets

- `src/components/brand/mark-geometry.ts` owns the viewBox, paths, stroke and SVG serialization. React logo, favicon, downloadable marks and the OG renderer all consume that geometry. Tests catch static asset drift.
- `public/brand/mark-ink.svg` and `public/brand/mark-reversed.svg` are accessible standalone vector assets. `src/app/icon.svg` uses the same geometry on an opaque sage tile so it remains visible on light and dark browser tabs.
- `src/components/brand/logo.tsx`, `logo.module.css` and `brand.tsx` provide the Archivo lockup and explicitly named “MigrateLens home” link; its SVG is decorative. A standalone mark can receive an accessible title.
- `site-header.tsx` and its CSS Module provide quiet desktop navigation, a pill points-check action, subroute active states and a Mantine mobile drawer. The header keeps the existing `--site-header-height` contract: 88px, then 74px at 800px. The desktop navigation switches to the drawer at 1040px; phones place the full points-check action in the drawer.
- `site-footer.tsx` and its CSS Module provide the reversed lockup, grouped exploration/source links, the manifest-derived SkillSelect snapshot month, feedback/privacy/registered-agent links and the existing general-information disclosure.
- Touched shared-shell rules were extracted from `globals.css`. Stable `.site-header` and `.site-footer` print hooks remain. New `--brand-*` tokens are mirrored in the palette and contrast tests.
- `scripts/og-image/render.ts` now serializes the new mark, preserving consumer compatibility. The existing `public/og.png` and old OG composition were deliberately not regenerated; a full social-card design refresh remains separate.

## Verification

### Project checks

- `npm run check`: Prettier, ESLint, TypeScript and Vitest passed; **120 test files, 1,287 tests**.
- `npm run build`: static export passed; **491 pages**.
- Focused geometry/assets, route matching, palette/contrast and OG-consumer tests: **4 files, 20 tests**. The route-matching test was observed failing before implementation.

### Built browser checks

Verified the production `out/` export at `http://127.0.0.1:3017/` in the isolated `brand-shell-production` Playwright session.

- Eight routes at **1440, 1024, 901, 820, 390, 360 and 320px**: homepage, check, sample, occupation listing, Software Engineer detail, states, feedback and methodology; **56 combinations**. Header/footer fit the viewport, visible shell text stays at least 12px, and there are exactly two home lockups with the drawer closed. Active navigation covers occupation detail routes.
- Drawer separately checked at **1024, 820, 390, 360 and 320px**: no internal overflow; home link, close control, navigation links and CTA are at least **44px high**. The burger and close control are **44×44px**. `aria-controls` resolves to Mantine's actual body ID.
- Keyboard opening, forward/reverse focus trapping, visible focus rings, Escape closing, focus restoration to the burger and body-scroll unlocking passed. Tests wait for closing transitions before evaluating restoration. Repeated fast keyboard cycles also passed.
- Drawer navigation, points-check CTA and drawer logo all close it; header/footer logo home links and desktop-resize dismissal passed. A separate mobile context with touch enabled successfully opened the drawer and navigated by tapping.
- Reduced motion on homepage/check and drawer passed; drawer and CTA transitions compute to **0s**. The report's sticky jump links remain clear: at 820px, `#visas` begins at 144.42px, below the 142.59px chip bottom and 88px header.
- Print emulation on the sample report computes both shared shell hooks to `display: none`. The drawer portal also hides when printing with navigation open; a dedicated print rule covers its root because portals live outside the header hook. A sample print PDF was captured.
- The board verifies ordinary/reversed marks and sage-backed favicon tiles at **16/24/32px** on light and dark surfaces.

### Independent reviews

Spec review passed after fixing a mobile extraction regression and correcting the drawer's controlled-element ID. A fresh, separate code-quality review then passed with no material findings. Reviewers checked scope, geometry consumers, token/contrast contracts, navigation, Mantine focus behavior, disclosures and print hooks.

## Review artifacts

All paths are relative to the repository root:

| Artifact                              | Path                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Identity comparison and favicon sizes | `output/playwright/brand-shell-identity-board.png`                                                                                   |
| Homepage desktop                      | `output/playwright/brand-shell-home-1440.png`                                                                                        |
| Homepage phone                        | `output/playwright/brand-shell-home-390.png`                                                                                         |
| Homepage narrow phone                 | `output/playwright/brand-shell-home-320.png`                                                                                         |
| Check desktop / phone                 | `output/playwright/brand-shell-check-1440.png`, `brand-shell-check-390.png`                                                          |
| Footer desktop / phone                | `output/playwright/brand-shell-footer-1440.png`, `brand-shell-footer-390.png`                                                        |
| Drawer phone / narrow phone           | `output/playwright/brand-shell-drawer-390.png`, `brand-shell-drawer-320.png`                                                         |
| Reduced-motion narrow phone           | `output/playwright/brand-shell-home-320-reduced.png`, `brand-shell-check-320-reduced.png`                                            |
| Other route images                    | `output/playwright/brand-shell-{sample,occupations,occupations-software-engineer-261313,states,feedback,methodology}-{1440,390}.png` |
| Browser matrix and interactions       | `output/playwright/brand-shell-browser-qa.json`, `brand-shell-interaction-qa.json`, `brand-shell-final-browser-qa.json`              |
| Print hiding capture                  | `output/playwright/brand-shell-sample-print.pdf`                                                                                     |

## Remaining limitations

- The old OG PNG still uses the previous identity; its geometry consumer is ready for a separately designed refresh. No layout/provider or social-image regeneration change was made.
- The existing feedback form's Turnstile widget expands to 300px inside a 236px fieldset at 320px, producing a 342px document width after the external widget loads. The shared header/footer still measure 320px. This is in the untouched feedback/submission body and should be handled in that page's later redesign; no form submission or backend behavior was changed.
- Verification used Chromium with desktop and touch emulation. Safari/Firefox and physical devices were not checked.
- Existing report wording issue R34 remains outside this assignment.
