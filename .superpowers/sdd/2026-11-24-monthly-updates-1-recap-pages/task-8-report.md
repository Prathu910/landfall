# Task 8 report: spotlight

Implemented `src/lib/updates/spotlight.ts` (`guaranteedChange`, `pickSpotlight`) and `spotlight.test.ts` (11 tests, frozen fixtures only). `npm run check` passes (148 files, 1530 tests).

Decisions:
- `cores` is `OccupationCore[]`; cores with `asAt !== month` (dropped, R6) are ignored everywhere; an override naming one throws.
- Rounds are cut to those whose Sydney month <= `month` (R5) inside `pickSpotlight` too; throws if none. Card `rounds` are newest first, max six; cut-off null = not listed.
- Popularity = sum of floors of `pool[visa].total` (equals `statusHistory[visa][month].SUBMITTED`, checked on all 493).
- Series read `statusHistory`; unfetched previous month (no key) is skipped; fetched month with no status row = "0".
- `top190` uses the 190 INVITED floor in the month per state (excl. ANY), not the pool (the brief's VIC 337 / NSW 327 / QLD 260 / WA 253 match INVITED).
- `previousCode` is skipped for the fallback too (most popular other than last month's).
- Override with no positive change gets `qualifiedBy: null`; with one, the qualifying series is recorded.
