# Task 4 report: QLD and NSW list importers

Status: DONE. Network was not blocked (HTTP 200 on all three pages).

## Sources
- QLD onshore: https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list
- QLD offshore: https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)
- NSW: https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists

## Counts (checked 2026-11-18)
- QLD onshore 209 codes (170 for 190; research said ~207/169). Offshore 97 codes (90 for 190, matches research). Combined list: 209 codes.
- NSW 78 unit groups (research said 80) -> 233 dashboard codes, all 190, no 491. Unmatched unit groups: none.
- Floors: QLD onshore 176, offshore 82, NSW unit groups 66.

## 11-occupation check against the research table: all match
QLD 233211/233311/233512/254499: 190+491, onshore+offshore. 261312/261313/241111/241411: 190+491 onshore only. 351311: 491 onshore only. 261111, 221111: absent.
NSW 190 present via unit group: 261312/261313 (2613), 233211 (2332), 233311 (2333), 254499 (2544), 241111 (2411), 241411 (2414). Absent: 261111, 221111, 233512, 351311.

## TDD
RED (qld.test.ts and nsw.test.ts failed to import ./qld and ./nsw; cli test):
    FAIL scripts/state-lists/cli.test.ts > ... accepts --only qld and --only nsw
    Error: Unknown importer "qld" (have: federal,wa,sa)
    Test Files 3 failed (3); Tests 1 failed | 6 passed (7)
GREEN: `npx vitest run scripts/state-lists` -> Test Files 7 passed, Tests 98 passed. `npm run check` passed (46 files, 434 tests); `npm run build` passed.

## Design notes
- html-table.ts: small shared table-to-text parser. Fail-closed: heading check, non-tick visa cell, non-6-digit/4-digit code, listed row with no visa ticked all throw.
- QLD streams: "onshore", "offshore", plus "building-and-construction" when the onshore pathway column is ticked. Graduate pathway is not named in the list tables, so it is not recorded. ImportedList.source holds both URLs joined by " ; ".
- Fixtures are trimmed (header + selected rows); full pages were used for the real import.
- Files: scripts/state-lists/{qld,nsw,html-table}.ts + tests, cli.ts/cli.test.ts (--only qld|nsw), fixtures, src/data/state-rules/lists/{qld,nsw}.json.
