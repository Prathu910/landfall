# Task 4 report
Implemented faq.ts and meta.ts (+ tests) in src/lib/occupation-page/. `npm run check` passes (79 files, 828 tests). No build run (no routes touched).
Concern: allMaskedCore masks only monthly history; its pools are unmasked, so isIndexable(allMaskedCore) is true under the brief's pool-based definition. Tests use a local fully-masked core (code 261312) instead.
Notes: Q3 score = mostCommonScore of the 189 pool (75 for 261313, 70 for 254499); Q3 omitted without a 189 pool or common score. R2 leader must be strict (a tie on min and max names no state). Q2 state order follows row order (NSW, QLD, WA, SA).
