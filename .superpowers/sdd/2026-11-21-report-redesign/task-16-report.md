# Task 16 report: /sample/ four example tabs

Status: DONE. Implemented examples.ts (EXAMPLE_PROFILES + EXAMPLES, tabs Strong / In the middle / 189 closed / Nothing suits); scenarios.ts fixture re-exports the four profiles (strong stays { ...sampleReportProfile, eoiDate: "" }); SampleTabs (role tablist/tab/tabpanel, roving tabindex, Arrow/Home/End, visible focus ring, in-memory state, only the selected Report mounted so print covers that example only; tabs and intro hidden in print); sample page loads core+detail for each example at build.
Tests: examples.test.ts (tab names; stamps match Task 10 table at 2026-11-21 AND at the pinned SAMPLE_AS_OF 2026-11-17; templateRead passes checkRead at both). Note: I wrote implementation and test together, so no separate RED run. npm run check (108 files, 1228 tests) and npm run build pass.
asOf: stays SAMPLE_AS_OF 2026-11-17 (scenario tests use 2026-11-21); stamps are identical at both dates, but PDFs read "calculated 17 Nov 2026".
h1: removed the page-level h1 on /sample/; the report headline is the one visible h1. The Task 15 print h1 remains in the DOM, positioned off-screen (left -10000), as on /check/.
Browser (built out/, playwright-core): 390/820/1280 no horizontal scroll, 0 text under 12px, ArrowRight cycles tabs with focus following, no URL change, no console errors. Print PDFs: Strong 4 pages, others 5; each contains only that example; tablist not rendered in print.
Concerns: all four cores+details are serialised into the page payload (client component props); comparison section defaults to SAMPLE_COMPARISON for every tab.
