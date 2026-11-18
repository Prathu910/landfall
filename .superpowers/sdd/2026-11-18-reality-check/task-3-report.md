# Task 3 report
Implemented buildWhereYouStand, buildSameScore, buildRounds in src/lib/report/panel-189.ts with 10 tests.
TDD: RED = vitest "no tests"/failed (module missing); GREEN = 10 passed. npm run check: 272 tests pass; npm run build OK.
Concern: none. Note formatDate uses en-GB (Sep may render "Sept" on newer ICU; not hit by tests).

## Fix report (ruling S6)
RED: 4 new tests failed (3 masked-count sentences, unavailable kind). GREEN: 14 pass; npm run check (276 tests) and build pass.
Changes: added SameScore "unavailable" kind; per-clause masked wording in buildWhereYouStand; exported isMasked from copy.ts. Clamp and all-masked lower tests added.
