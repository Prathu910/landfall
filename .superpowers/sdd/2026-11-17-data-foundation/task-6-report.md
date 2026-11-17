# Task 6 report
Implemented views.ts (9 VIEWS, FIELD_NAMES, guardrail with R1 attributeVariants), raw-store.ts (encode/decode, write with dated revisions, read newest), run-view.ts (clears 12 filter fields, sets all 12 toggles, selects Visa/Status/As At, partition combos x variants), .gitignore public/data/.
TDD: tests written first; RED = 3 files failed to import modules; GREEN = 11 tests pass. npm run check passes (115 tests).
Notes: runView does not apply the bookmark (caller does). Raw root is a parameter (data/raw by caller). Partition records for variants: {attribute}.
