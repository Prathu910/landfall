# Task 2 report
Implemented guards.ts (isCountText, isOccupationCore, isOccupationDetail, isManifest) with deep key/value checks; guards.test.ts (19 tests).
RED: `npx vitest run src/lib/data/guards.test.ts` failed (module missing, "no tests"). GREEN: 19 passed. `npm run check`: tsc ok, 74 tests passed.
Files: src/lib/data/guards.ts, guards.test.ts. Manifest also rejects bad checkedAt/asAt and duplicate codes.
