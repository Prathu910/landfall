# Task 3 report: WA and SA list importers

Status: DONE.

Sources (fetched 2026-11-18, HTTP 200, no blocks)
- WA: https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv (669 rows, 384 distinct codes; Schedule 1: 89, Schedule 2: 189, Schedule 3: 60, Graduate: 331)
- SA: https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list (353 occupation blocks, 351 distinct codes)

Output: src/data/state-rules/lists/wa.json (384 codes; 190: 323, 491: 383), sa.json (351 codes; 190: 290, 491: 351). Both pass isImportedList. Floor 250 codes.

Mapping: WA visa listed on any row of a code -> all three cohorts, streams = schedule-1/2/3/graduate. SA: "South Australia" location -> living-in-state, "Offshore" -> offshore, never living-in-other-state; streams = stream names with a 190/491 subclass. "Any Location" (232214 Outer Regional) is not read as a cohort. Occupations with no 190/491 anywhere are omitted.

Decisions to note
- SA repeats 234914 (Medical Physicist Only / Physicist non-medical; offshore 190 differs) and 242211 (Vocational Education Teacher Trades / Non-Trades). Conservative: cohorts intersected, streams unioned, CLI prints the repeated codes. Result: 234914 190 = onshore only, 491 = onshore + offshore.
- .prettierignore: added src/data/state-rules/lists/ (generated JSON with importer formatting, as src/data/ already is).
- Fixtures (kept verbatim, prettier-ignored): wa.csv (27 rows), sa.html (16 blocks, 130 KB).
- Shared helpers in scripts/state-lists/imported-list.ts (size floor, atomic write with guard, fetch, sort). Fail-closed: changed columns/headers, unknown stream/location/subclass/status/Yes-No, bad code, wrong cell count, no blocks all throw.
- cli.ts: --only federal|wa|sa; default runs all three.

11-occupation comparison against the research 11x8 table (WA, SA columns): NO differences.
- WA: all 11 are 190 and 491 for all cohorts. 254499 on schedule-1; others schedule-2 (+graduate); 233512 and 233311 also schedule-3.
- SA: 261111/261312/261313 190+491 onshore only; 221111 491 onshore only; 233211/233512/233311/254499/241111/241411 190+491 onshore+offshore; 351311 491 onshore only (streams Skilled Employment + Outer Regional, no Graduates).

TDD
RED (before wa.ts/sa.ts/imported-list.ts existed):
  FAIL ... Error: Failed to resolve import "./imported-list" from "scripts/state-lists/wa.test.ts" (Test Files 2 failed, no tests)
RED cli: x accepts --only wa and --only sa (Tests 1 failed | 5 passed)
GREEN: wa+sa tests 33 passed; final npm run check: 44 files, 398 tests passed, lint/format/typecheck clean; npm run build succeeded.

Commits: code "feat(state): import WA and SA state nomination occupation lists"; data "data: add WA and SA state occupation lists".

## Fix report (ruling P7)
- Duplicate SA codes (234914, 242211) now take the UNION of cohorts. Repeated codes carry `title:<name>` entries in `streams` (e.g. "title:Physicist (Medical Physicist Only)"). 234914 190 is now living-in-state + offshore. CLI still prints repeated codes.
- Any Location (232214, Outer Regional Skilled Employment, subclasses 190 and 491). Source wording: "Applying from Any Location ... Eligible temporary visa holders working full-time in Outer Regional South Australia, and in employment closely related to their nominated occupation, are able to register their interest for SA nomination." The label says Any Location but the text requires work in Outer Regional SA, so it is AMBIGUOUS (FLAG). Mapped per the ambiguity rule: its visas take the cohorts the occupation's other blocks give. 232214 stays 190+491 living-in-state + offshore (no change in data); a visa listed only under Any Location would now be included rather than dropped.
- TDD: RED = 3 failures (union, titles, Any-Location-only visa). GREEN = sa tests 18 pass; npm run check 44 files / 400 tests pass; build passes.
- Commits: "fix(state): union duplicate SA codes and map the Any Location block", "data: refresh the SA list".

## Fix report (ruling P8)
- I1: sa.ts now throws "Review: <code> appears only under Any Location; its cohorts cannot be read" when an Any Location block has no cohorts from other blocks. With other blocks, the visa takes their cohorts (documented heuristic comment tied to the 232214 wording). Tests for both cases.
- I2: new scripts/state-lists/shared.ts (fetchText, generic sortedEntries, writeJsonFile); federal.ts and imported-list.ts use it, duplicated user agent/timeout/fetch/sort/write removed from federal.ts. Federal tests unchanged and passing.
- WA: both visa cells validated on every row (no short-circuit), test with later invalid row; comment + test that "Regional WA only" is ignored.
- SA floor raised to 300 (WA stays 250).
- RED: 3 failures (2 SA Any Location, 1 WA validation). GREEN: check 44 files / 404 tests; build passes.
- Re-ran WA and SA imports: data unchanged (WA 384 codes, SA 351; git shows no diff in src/data). No data commit.
- Commit: "fix(state): fail closed on Any Location, share importer helpers, validate every WA row".
