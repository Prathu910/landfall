# Task 2 report
Implemented src/lib/report/scorecard.ts (+ test, + fixtures in src/lib/report/__fixtures__/scorecard.ts).
TDD: RED = scorecard.test.ts failed (module ./scorecard missing); GREEN = 10 tests pass. npm run check (262 tests) and npm run build pass.
Decisions/concerns:
- invitationActivity called with an explicit 12-month window (its default is 24), to match the "last 12 months" copy.
- card.points = the visa's total (base / subclass190 / subclass491); pool position uses that number; pointsNote is static text per brief.
- Occasional/regular headline uses spec templates (not in brief); {score} = points.base; regular says "each of the last four".
