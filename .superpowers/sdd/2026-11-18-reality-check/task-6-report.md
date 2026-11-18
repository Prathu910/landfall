# Task 6 report
Implemented: shared useValidatedRecord hook (use-validated-record.ts), useOccupationCore/useOccupationDetail wrappers, rounds-meta.ts (throws on bad shape), generator writes+swaps rounds-meta.json, ReportOccupation ready gains core+detail, check-flow loads detail, /sample/ server-loads detail, CLAUDE.md updated. Regenerated data: only rounds-meta.json new.
## RED
     × adapts a loaded core to the report's pool and evidence 3ms
     × keeps a loaded occupation with no 189 pool ready, with a null pool 2ms
     × replaces the generated files and the occupations folder 8ms
     × leaves the target untouched when serialising fails partway (Review Focus 4) 5ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  scripts/import/generate.test.ts > writeGenerated > replaces the generated files and the occupations folder
 FAIL  scripts/import/generate.test.ts > writeGenerated > leaves the target untouched when serialising fails partway (Review Focus 4)
 FAIL  src/components/data/report-occupation.test.ts > toReportOccupation > adapts a loaded core to the report's pool and evidence
 FAIL  src/components/data/report-occupation.test.ts > toReportOccupation > keeps a loaded occupation with no 189 pool ready, with a null pool
      Tests  4 failed | 18 passed (22)
## GREEN
 Test Files  2 passed (2)
      Tests  22 passed (22)
npm run check: 35 files / 294 tests pass; npm run build passes.
