# Task 4 report
Implemented eois-like-yours.ts, what-could-change.ts (+tests); moved cohortWindowStart (and COHORT_MONTHS) into src/lib/data/months.ts with a unit test; generator now imports it (duplicate deleted).
RED: months test failed (cohortWindowStart not exported); the two new test files failed (modules missing). GREEN: 10 new tests pass; scripts tests 93 pass; npm run check (287 tests) and npm run build pass.
Notes: nearby rows come from stored cohort keys (existing months only); a masked count in the sentence reads "under 20 (so may be zero)"; the non-null assertion in nearby mapping is safe because keys come from the same cohort map.
