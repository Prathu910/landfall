# Task 7 report
Implemented scripts/import/rounds.ts (parseRoundPages, normalizeOccupationName, fetchRoundPages) and rounds.test.ts (4 tests).
TDD: RED = first run failed (module ./rounds missing); GREEN after implementation. npm run check passes (119 tests).
Fixtures: captured 2026-11-17 via curl, trimmed to the PageSchemaHiddenField input tag (previous page was 1.97 MB) and wrapped in a minimal html shell; added scripts/import/__fixtures__/ to .prettierignore.
Deviations driven by real data: "N/A*" / "Not invited" cut-offs are skipped (not-listed, not zero) rather than throwing; other non-integers throw. The cut-off column is found by header ("189"/"minimum points"), since older tables have an extra column. Previous-page rounds with no table headed "Occupation" (before April 2022 / 2023 layouts with a blank first header) are skipped; the current round must have one. 

## Fix report
RED: new tests failed with "parseRoundPagesDetailed is not a function". Added parseRoundPagesDetailed (rounds + skipped with reasons); parseRoundPages wraps it. Occupation table now detected in either of the first two header rows by any cell mentioning "occupation"; name taken from that column. Two-row 2022-23 headers: 189 columns found by splitting data columns evenly across group labels; cut-off = lowest score across offshore/onshore columns. Empty cells count as not listed. Only pre-2022 rounds without an occupation table are skipped (reported). GREEN: 6 tests pass; npm run check exits 0.
