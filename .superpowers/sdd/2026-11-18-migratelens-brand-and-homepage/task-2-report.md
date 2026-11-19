# Task 2 report
Status: DONE. Test src/app/css-floor.test.ts scans CSS font-size (px/rem/em, incl. clamp) and numeric fontSize in TSX, excluding src/components/stageshow-kit/ (B1).
RED: test failed before changes. GREEN after. npm run check: 668 tests pass; npm run build passes.
Raised: 146 CSS declarations to 12px (floor), 2 TSX fontSize (pool-chart 11, trend-chart 10) to 12. Plus a Mantine Badge --badge-fz: 12px rule.
Mobile body 16px: @media (max-width:720px) blocks appended to globals.css and 10 module CSS files for paragraph/help/form text.
Layout fixes: none needed. Needs the controller: nothing found; unchecked at 390px: check-flow steps 2-4 and a loaded /check/ report (only step 1 rendered).
Browser (out/, 1440 and 390, /, /check/, /sample/, /states/, /methodology/): scrollWidth == viewport everywhere; no text node under 12px after Badge fix (before: one Mantine badge at 11px on /check/). Ignored: display:none, visibility:hidden, zero-size elements. No aria-hidden SVG ignored.
Remaining mobile p/li under 16px are labels/captions/legends/footers (12-14px), allowed.
Screenshots: .superpowers/sdd/2026-11-18-migratelens-brand-and-homepage/screenshots/sample-1440.png, sample-390.png

## Fix report (review gap)
- Parser extracted to src/app/font-floor.ts (`findSmallFontSizes(source, "css"|"tsx")`): global scan per file, comment stripping, `font:` shorthand (ignores line-height after `/` and keywords), clamp() lengths, multi-line and multi-declaration values, TS/TSX `fontSize={n}`, `fontSize: n`, `font-size="n"`, string values with units.
- src/app/font-floor.test.ts: 8 fixture tests. RED first (module missing), then GREEN (one fixture line number corrected, 2 -> 3).
- css-floor.test.ts now scans every .css/.ts/.tsx in src/ (B1 exclusion kept; the two helper files excluded); found no violations.
- Mobile 16px: added `.details summary` (panel-189); `.checked` (state-panel) was already in its mobile block.
- npm run check: 676 tests pass, 0 warnings; npm run build passes.
