# Task 1 report
Implemented rules-types.ts, rules-guards.ts, staleness.ts (+ tests) in src/lib/state-outlook/. P1 applied: ImportedListEntry has optional streams?: string[] and viaUnitGroup?: string (4-digit); other entry keys rejected.
Guards are strict (unknown keys rejected, real calendar dates, 6-digit codes). isStale uses UTC day arithmetic, boundary 60 days is not stale.
RED: both test files failed to resolve ./rules-guards and ./staleness. GREEN: 11 tests pass. npm run check (334 tests) and npm run build pass.

## Fix report
Review fix: XX state mutation now applied to a fresh object (d). P4: isStale returns true when either date is unparseable (NaN age). Added tests: unparseable dates, 2027-12-31 -> 2028-03-01 (61, stale), 2028-01-01 -> 2028-03-01 (60, not stale).
RED: "fails closed on unparseable dates" failed (expected false to be true). GREEN after fix; npm run check passes.
