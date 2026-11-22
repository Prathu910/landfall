# Task 4 report

Implemented `stamp.ts` (chooseStamp) and `evaluate-profile.ts` (evaluateProfile) in src/lib/outlook/.
- Tie-break: candidates listed 189, 190, 491; a later one wins only if strictly better.
- R7: state comes from the visa's best state; it is only used for single stamps (competitive or better), so not-invited/no-data stamps are always combined with no state.
- core null: v190/v491 null (treated as no-data); membership read from rules.federal.entries and rules.lists[stateCode.toLowerCase()].entries by occupation code.
- tooFew for single/combined comes from the chosen candidate (only 189 can set it).
- Tests: RED (both files failed to import), GREEN after implementation. All scenarios match the brief (strong 189 very-strong, middle 189 competitive, long 190 TAS, notinv 190 NT, below 190 TAS, lodged 189 competitive, none combined not-invited, nodata combined no-data with federal true/true, states ["WA"]).
- Difference: brief said nothing on `none` list membership; real data gives ["SA","WA"] (asserted).
- npm run check passes (935 tests).
