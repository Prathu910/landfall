# Task 8 report
Implemented queue-bar (exported QueueBar, segmentWidth), rounds-tiles, eois-like-yours (D3), panel-189 + CSS modules; removed unused countPhrase import. All view-model kinds handled (loading uses LoadingData). Print rule `details:not([open]) > :not(summary){display:block}` is in panel-189.module.css.
Verification: npm run check 0 errors/0 warnings (294 tests pass); npm run build passes.
Concern: no tests (presentational only; no component test setup). Built CSS cannot show the print rule yet because the components are not imported by any page (tree-shaken); re-verify after Task 10 wiring. Rounds "See all" details is only rendered when all > tiles.

## Fix report (S8)
- Removed the impure print rule from panel-189.module.css; added global `details:not([open]) > :not(summary){display:block!important;content-visibility:visible!important}` to the first @media print block in globals.css (confirmed emitted in built CSS).
- Added sr-only `<caption>` to the nearby-months table.
- Added queue-bar.test.ts (4 segmentWidth tests).
- Verification: temporarily side-effect-imported both CSS modules in src/app/page.tsx (a `false &&` JSX use was tree-shaken, so it proved nothing); build compiled and module classes were emitted. Import reverted. check: 0 warnings, 298 tests; build OK.
