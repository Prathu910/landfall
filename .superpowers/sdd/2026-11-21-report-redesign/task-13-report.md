# Task 13 report
Implemented CutoffColumns, QueueSquares, RouteLine, RouteList (+ css modules), label-ink.ts helper, and pure src/lib/outlook/route-geometry.ts (+5 tests: deadline position, stepX, deadline title split, wrap, route aria). Route has no `aria` field, so routeAria builds it from steps/deadlines.
TDD: geometry tests were written with the module (no separate RED run captured). GREEN: vitest route-geometry 5 passed; npm run check passes (1178+ tests, floor test ok); npm run build ok.
Visual check via temporary page (deleted) at 900 and narrow widths: fine.
Concerns: deadline flags in RouteLine may overlap if two deadlines are adjacent; "You" guide label can cross a bar (added halo); RouteLine has no narrow switch (integration hides it with RouteList); charts capped at max-width 560px so wide text stays >=12px.

## Fix report
Changes: RouteLine text >=14 units (title 16), maxWidth = viewBox width, height derived from wrapped lines (wrap computed once per step), overlapping deadline flags stacked by `deadlineTiers` (new test); queue narrow note wrapped to two lines; RouteList shows a label chip and visually hidden "N points." per item; cut-off target/You labels offset when within 5 points (lower line labels below).
Tests: route-geometry 6 passed; npm run check and npm run build pass.
Smallest rendered text (headless Chrome, temp page deleted): cutoff wide@400 13.0px, cutoff narrow@328 13.0px, queue wide@400 13.5px, queue narrow@328 14.0px, route 860@760 12.4px, route 700@700 14.0px; no text overflows its SVG. RouteList uses CSS text (chip 13px).
