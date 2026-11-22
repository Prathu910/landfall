# Task 19 report

## Done
- docs/ENGINEERING.md Data honesty reworded (estimates allowed when computed in code and labelled; no percentages; AI never decides labels or numbers; "you should apply" line removed; Task 15 printing rule kept).
- CLAUDE.md: Product constraints updated to the 21 Nov decision; client-importable JSON now includes src/data/manifest.json (R15); UI bullet rewritten for the new report; added outlook logic, print layout, sample tabs, write-read + env vars + NEXT_PUBLIC_READ_ENABLED; Archivo stamps (R22).
- docs/REPORT-COVERAGE.md: new "Report redesign" section (new, moved, removed, print, sample).
- docs/HANDOFF.md: new resume point; switches off; enablement checklist with Functions + frontend deployed back to back (or accept both versions); R6 state differences list. docs/OPERATIONS-BACKEND.md checklist order fixed likewise (READ_ENABLED=true last).
- Methodology page: "Useful definitions" section (six terms from fede1ab), nav link added (R26).
- use-our-read.ts doc comment fixed. STRATEGY.md unchanged (no new founder decision).

## Verification
- npm run check: 109 files, 1232 tests pass. npm run build passes. backend:check ok; backend:test 35 passed.
- Built out/ served on 3017, scratch playwright-core (system Chrome), /sample/ 4 tabs and /check/ after "Try sample answers" at 360/390/820/1280, reduced motion on and off: scrollWidth == clientWidth everywhere, 0 text nodes under 12px (HTML and scaled SVG), 0 console/page errors.
- Print PDFs of each /sample/ tab: Strong 4, In the middle 5, 189 closed 5, Nothing suits 5 pages, identical at 1280 and 390 px windows.
- Homepage, /occupations/, one occupation page (aeroplane-pilot-231111) and /methodology/ render, no errors, no horizontal scroll.
- Not verified: /check/ report for the eight scenario profiles in the browser (the email gate needs a Turnstile-configured backend; covered by unit scenario tests). The check page itself loads and "Try sample answers" works.
