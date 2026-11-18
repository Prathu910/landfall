# Task 7 report
Implemented RealityScorecard (scorecard.tsx + scorecard.module.css). Added --danger-tint/--amber-tint tokens to globals.css and exported LOADING_HEADLINE from lib/report/scorecard.ts (replaces the string literal). Loading state: strip + points-only cards. One h2 (the headline), h3 per card, "189 details" links. 3-col grid, stacked at <=720px, print: bordered light strip, break-inside avoid. Not wired into report.tsx. npm run check and npm run build pass (294 tests). No visual browser check done.

## Fix report
Replaced next/link with plain <a>, link text from card.visa, removed duplicate print break-inside. check and build pass.
