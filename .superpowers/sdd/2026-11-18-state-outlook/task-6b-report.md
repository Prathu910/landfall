# Task 6b report: per-visa stream tags on imported lists

## Implemented
- `ImportedListEntry.streams` is now `{ "190"?: string[]; "491"?: string[] }`. Guard rejects non-objects, unknown keys, empty object, empty arrays and empty tags. viaUnitGroup unchanged.
- WA: tags come from each CSV row's own v190/v491. SA: per-block subclass; `title:<name>` tags go only under visas that title's blocks list. QLD: onshore/offshore tags and the building pathway tag per ticked visa column (Row.pathways is now per visa). NSW: `{ "190": ["nsw-skills-list"] }` (it did emit one tag; kept, per visa).
- Curated-rules test "every tag resolves" now resolves each stream's filter tags against its own rule's visa.

## TDD
RED (new tests before implementation): `Test Files 6 failed | 4 passed (10); Tests 27 failed | 119 passed (146)`.
GREEN: focused suites 125/125 pass after importers + guard; after re-import the rules test passes. `npm run check`: 48 files, 475 tests pass, 0 warnings. `npm run build` passes.

## Re-import (live sources, wa/sa/qld/nsw)
WA 384 codes (190: 323, 491: 383); SA 351 (190: 290, 491: 351); QLD 209 (190: 170, 491: 209); NSW 233.
Membership check (before vs after, per code and visa, cohort arrays compared): 0 differences in all four lists. The union of the new per-visa tags equals the old tag set for every code (0 differences). Only the tag structure changed.

## False-pass quantification (old union tags vs new per-visa tags, per filtered stream, among codes listed for that visa)
- WA: 0 codes for every stream (including wa-491 Schedule 2: 189 before and after). The T5 scenario (Schedule 2 190-only row plus Graduate 491 row) does not occur in the current data; the fix is preventive for WA, with a unit test for the case.
- QLD: 0 for every stream.
- SA: 4 false passes closed: sa-190 "Skilled Employment in South Australia" 290 -> 287 (149212, 149913, 222113; listed for 190 only through other streams); sa-190 "Offshore" 218 -> 217 (332211). SA 491 streams: 0.

## Files
scripts/state-lists/{wa,sa,qld,nsw}.ts and tests; src/lib/state-outlook/rules-{types,guards}.ts and guard tests; src/data/state-rules/2026-27/state-rules.test.ts; src/data/state-rules/lists/{wa,sa,qld,nsw}.json.
Commits: code and data separately (see git log).

## Concerns
None blocking. Live list checkedAt dates in the JSON moved to the re-import date.
