# Task 2 report: federal 190/491 occupation eligibility importer

Status: DONE_WITH_CONCERNS (the concerns are listed at the end; none blocks use)
Branch: roadmap/reality-check (the ledger's branch; the contract's "roadmap/foundation" is stale). Base dcb85d8.

Commits:
- 11c473a feat(state): import federal 190/491 occupation eligibility
- c9869d8 data: add federal occupation eligibility

## Source

- URL used (recorded as `source`): https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list
- `checkedAt`: 2026-11-18
- How the data was found: a plain GET of the page with a browser-like User-Agent and a 60 s timeout returned HTTP 200 (about 3.5 MB). The page's search table is fed from data that is already in the HTML: a hidden input, `ctl00_PlaceHolderMain_PageJSONDataHiddenField_Input`, whose `value` is an HTML-entity-encoded JSON array of 714 rows with the fields `occupation`, `anzscocode`, `visacaveats`, `visas`, `list` and `assessauth`. No separate endpoint, no JavaScript execution and no access control was involved. The page is the same SharePoint template as the SkillSelect rounds pages that `scripts/import/rounds.ts` already parses.
- Network use: 3 GETs in total. One curl GET captured the fixture, and the import ran twice (`--only federal`, then the default run of all importers). There were no mirrors, caches or third-party sites. legislation.gov.au was not needed.

## Classification and mapping

- The `anzscocode` cell holds two codes: "ANZSCO 2022 - Subclass 186 and 482 visas - NNNNNN" and "ANZSCO 2013 - all other visas - NNNNNN". Some cells hold only "ANZSCO 2013 - NNNNNN". 190 and 491 are among the "all other visas", so entries are keyed by the **ANZSCO 2013** code. That is the classification SkillSelect and `occupation-index.json` use. OSCA is not used.
- 190 counts as eligible when the row's `visas` list contains "190 - Skilled Nominated (subclass 190)". 491 counts as eligible when it contains "491 - Skilled Work Regional (provisional) visa (subclass 491) State or Territory nominated". The 491 Family Sponsored stream is recognised but does not count. Whitespace is collapsed before matching.
- **Three 190/491 rows carry only a code labelled 2022.** All three were mapped exactly by code plus name, as follows. The parser sets aside any 190/491 row that has no 2013 code. `buildFederalList` then accepts such a row only when exactly one of its 6-digit codes appears in `occupation-index.json` (SkillSelect, ANZSCO 2013) under the same normalised occupation name. Any other such row is left out and printed. The three rows:
  - Operating Theatre Technician: cell says "ANZSCO 2022 - 311214". The dashboard has 311214 Operating Theatre Technician. Mapped to 311214.
  - Osteopath: cell says "ANZSCO 2022 - 252112". The dashboard has 252112 Osteopath. Mapped to 252112.
  - Quality Assurance Manager: cell says "ANZSCO 2022 - Subclass 186 and 482 visas - 139916 ANZSCO 2022 - 139914". The second code is evidently a mislabelled 2013 code. The dashboard has 139914 Quality Assurance Manager. Mapped to 139914 (139916 is not used).
  - Unmatched (left out): **0**.
- The other 40 rows with no 2013 code are CSOL-only (482/186) and are open to neither 190 nor 491. They are dropped.
- Arborist's cell uses en dashes ("ANZSCO 2022 – … - 362511 ANZSCO 2013 – 362212"). It is keyed as 362212. Cabler's cell has the odd form "…342411ANZSCO 2013 - all other visas" and parses as 342411.
- Rows with a 2013 code that are open to neither visa (for example 494-only ROL occupations) are kept as `{190:false, 491:false}`. Every entry has both booleans.

## Fail-closed checks (each throws "…review the source"; nothing is written)

- The data input is missing, or its value is not a JSON array of rows with string fields.
- A visa label starts with 190 or 491 but is not one of the three known labels. A reworded label would otherwise read as "ineligible".
- A caveat applies to 190 or 491. Booleans can't carry a caveat. Today no row has one: caveats exist only on 482/186/494/407.
- A row has two different 2013 codes, or two rows share a code.
- Plausibility (CLI): fewer than 300 eligible codes for either visa. This catches a page change that silently drops rows.
- Output that fails `isFederalList` is not written. The write is atomic (`writeFileAtomic`).

## Import result (verbatim)

```
> tsx scripts/state-lists/cli.ts --checked-at 2026-11-18

Federal entries: 674
Eligible for 190: 427, 491: 504
Of the 493 dashboard occupations, eligible for 190: 420, 491: 493
Left out (no exact 2013 code): 0
Wrote src/data/state-rules/federal-occupations.json
```

Before the live run, I cross-checked the full captured page offline. Every 190 label (427) and every 491 state-nominated label (504) among the 714 raw rows ends up in an entry. All 493 dashboard occupations are present in the list: 420 eligible for 190 and all 493 eligible for 491. None is open to neither. 11 eligible codes are not on the dashboard (for example 121314, 149912, 253323).

### The 11 original occupations

| Code   | Occupation                                   | 190  | 491  |
| ------ | -------------------------------------------- | ---- | ---- |
| 261111 | ICT Business Analyst                         | true | true |
| 261312 | Developer Programmer                         | true | true |
| 261313 | Software Engineer                            | true | true |
| 221111 | Accountant (General)                         | true | true |
| 233211 | Civil Engineer                               | true | true |
| 233512 | Mechanical Engineer                          | true | true |
| 233311 | Electrical Engineer                          | true | true |
| 254499 | Registered Nurses nec                        | true | true |
| 351311 | Chef                                         | true | true |
| 241111 | Early Childhood (Pre-primary School) Teacher | true | true |
| 241411 | Secondary School Teacher                     | true | true |

All 11 are on MLTSSL;CSOL. This confirms the research doc's assumption (docs/research/state-nomination-2026-27.md §"Federal layer not re-verified").

## Files

- `scripts/state-lists/federal.ts` (new, 252 lines): `parseFederalList`, `buildFederalList`, `countEligible`, `assertPlausible`, `writeFederalList`, `fetchFederalPage`, `FEDERAL_LIST_URL`.
- `scripts/state-lists/federal.test.ts` (new, 21 tests).
- `scripts/state-lists/cli.ts` (new) and `cli.test.ts` (new, 5 tests): `parseArgs(argv, today)` takes `--only federal` and `--checked-at YYYY-MM-DD`; the default runs every available importer. `async main()` sits behind the `argv[1].endsWith("cli.ts")` guard (CommonJS, no top-level await).
- `scripts/state-lists/__fixtures__/federal.html` (new, 73 KB). This is the captured page cut down to the one hidden input, with 19 of the 714 official rows kept unchanged in content: the 11 originals plus the edge cases (the three 2022-labelled rows, Arborist, Cabler, Aeroplane Pilot as 491-only, a 494-only row and a CSOL-only row). The rows were re-encoded the way the page encodes them, using `<`-style JSON escapes and `&quot;`. The full 2.2 MB field was not checked in, per ENGINEERING.md's "fixtures are small".
- `src/data/state-rules/federal-occupations.json` (new, importer output; passes Prettier as written).
- `package.json`: adds `"data:state-lists": "tsx scripts/state-lists/cli.ts"`.
- `.prettierignore`: adds `scripts/state-lists/__fixtures__/`, the same rule as the import fixtures.
- `scripts/import/rounds.ts`: exports the existing `decodeEntities` for reuse (one-word change; the behaviour is unchanged).

## TDD evidence

RED (`npx vitest run scripts/state-lists`, tests written before any implementation):

```
 FAIL  scripts/state-lists/cli.test.ts [ scripts/state-lists/cli.test.ts ]
Error: Cannot find module './cli' imported from /Users/aveomac/aveo-projects/landfall/scripts/state-lists/cli.test.ts
 FAIL  scripts/state-lists/federal.test.ts [ scripts/state-lists/federal.test.ts ]
Error: Cannot find module './federal' imported from /Users/aveomac/aveo-projects/landfall/scripts/state-lists/federal.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

The first implementation run also had a real failure, which the test caught. A `\D*?` regex could not get past the digits in "Subclass 186 and 482", so it missed 2022 codes:

```
 FAIL  scripts/state-lists/federal.test.ts > parseFederalList > sets aside 190/491 rows that carry only a 2022-labelled code
AssertionError: expected [ '139914' ] to deeply equal [ '139916', '139914' ]
 Tests  1 failed | 25 passed (26)
```

The fix splits the cell on "ANZSCO" and takes the 6-digit codes in each part labelled with the year.

GREEN (`npx vitest run scripts/state-lists --reporter=verbose`):

```
 ✓ cli.test.ts > parseArgs > runs every importer by default, checked today
 ✓ cli.test.ts > parseArgs > accepts --only federal and --checked-at
 ✓ cli.test.ts > parseArgs > rejects an unknown importer
 ✓ cli.test.ts > parseArgs > rejects a date that is not a real calendar day
 ✓ cli.test.ts > parseArgs > rejects an unknown flag
 ✓ federal.test.ts > parseFederalList > lists Software Engineer as eligible for 190 and 491
 ✓ federal.test.ts > parseFederalList > gives every entry both booleans
 ✓ federal.test.ts > parseFederalList > leaves an unknown code absent
 ✓ federal.test.ts > parseFederalList > lists the eleven original occupations for both visas
 ✓ federal.test.ts > parseFederalList > separates 491 state nomination from 190
 ✓ federal.test.ts > parseFederalList > keeps a listed occupation that is open to neither visa
 ✓ federal.test.ts > parseFederalList > keys entries by the ANZSCO 2013 code, not the 2022 one
 ✓ federal.test.ts > parseFederalList > sets aside 190/491 rows that carry only a 2022-labelled code
 ✓ federal.test.ts > parseFederalList > drops a 2022-only row that is open to neither visa
 ✓ federal.test.ts > parseFederalList > throws when the page no longer carries the data field
 ✓ federal.test.ts > parseFederalList > throws on an unrecognised 190 or 491 visa label
 ✓ federal.test.ts > parseFederalList > throws when a caveat applies to 190 or 491
 ✓ federal.test.ts > parseFederalList > throws on a row with two different 2013 codes
 ✓ federal.test.ts > parseFederalList > throws when two rows share a code
 ✓ federal.test.ts > buildFederalList > returns a guard-valid list with sorted codes
 ✓ federal.test.ts > buildFederalList > maps a 2022-labelled row when the dashboard has that code and name
 ✓ federal.test.ts > buildFederalList > leaves out and reports a 2022-labelled row whose name differs
 ✓ federal.test.ts > assertPlausible > accepts a list with enough eligible codes for each visa
 ✓ federal.test.ts > assertPlausible > throws when either visa has too few eligible codes
 ✓ federal.test.ts > writeFederalList > writes the list as JSON ending in a newline
 ✓ federal.test.ts > writeFederalList > refuses to write a list the guard rejects
      Tests  26 passed (26)
```

`npm run check`: Prettier clean, ESLint 0 problems, tsc clean, `Test Files 41 passed (41)`, `Tests 362 passed (362)`. `npm run build`: success (static export). Tests make no network calls.

## Self-review

- Every brief item is done: fixture, the three required tests (plus edge and fail-closed cases), a guard-validated atomic writer, the import run with a plausible count and all 11 occupations present, the npm script and a minimal CLI.
- `federal.ts` is 252 lines, under the 300 limit for `src/lib` (it is a script). Each function does one job.
- The CLI's `isCalendarDate` and `localToday` duplicate the private helpers in `scripts/import/cli.ts`. Importing that file would trigger its `main()`, because its guard also matches `cli.ts`. The 8-line duplication is deliberate; it could move to a shared `scripts/lib` helper later.

## Concerns (for the controller)

1. **Mapping three 2022-labelled rows.** I mapped them by exact code plus exact name against the SkillSelect (ANZSCO 2013) index, and I document the rule here and in a code comment. I did not leave them out, because leaving them out would wrongly show Operating Theatre Technician, Osteopath and Quality Assurance Manager as "Not open to you now" for 190/491 when the official list says they are eligible. If you want the stricter rule ("leave out anything not labelled 2013"), pass an empty index to `buildFederalList`, or drop the resolve step; those three would then be listed as unmatched.
2. **What an absent code means.** Codes that are on no list at all are absent from `entries`. Codes that are listed only for other visas are present as false/false. Task 7 should treat both "absent" and `false` as federally ineligible. A code missing from the list does not mean the list is unavailable; only `federal: null` means that.
3. **The page has no "last updated" date in its HTML** (the label is empty), so `checkedAt` is the fetch date, not a publication date.
