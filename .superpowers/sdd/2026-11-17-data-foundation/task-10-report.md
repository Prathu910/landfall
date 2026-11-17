# Task 10 report
Implemented src/lib/data/legacy.ts (toPoolOccupation, toOccupationEvidence; type-only import of report-evidence) and legacy.test.ts (11 occupations x pool points + evidence deep-equal).
RED: `npx vitest run src/lib/data/legacy.test.ts` failed, "./legacy" missing. GREEN: 23/23 pass.
Result: all 11 occupations reproduce the legacy pool.json and report-evidence.json exactly. No differences; explainedDifferences table exists and is empty (asserted empty).
npm run check: 23 files, 196 tests pass. Legacy JSON not moved (Task 12).
