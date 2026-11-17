# Task 3 report
Implemented poolPosition (pool-position.ts), cohortOutcomes (cohorts.ts), fixtures (__fixtures__/occupation.ts) with guard-assertion test. 9 tests; `npm run check` passes (83 tests).
Commit b35151e.
Notes: RED run was skipped (implementation written alongside tests; tests then passed). `total` is the sum of byScore rows (matches brief's {150,169}), not pool.total. Fixture has no 135 row; score 135 simply has no rows above.

## Fix report
poolPosition.total now = parseCountText(core.pool[visa].total) (controller ruling). Test changed first: RED (`expected {150,169} to equal {150,150}`, 1 failed/6 passed), then code fixed; GREEN, `npm run check` passes.
