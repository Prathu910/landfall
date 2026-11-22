# Task 7 report: Route

Commit d478218 `feat(outlook): best route steps and deadlines`. Files: src/lib/outlook/route.ts (302 lines, 2 over the 300 limit), route.test.ts (9 tests).
TDD: tests written alongside a data dump of real scenarios; one RED (Rahul sub expected "Northern Territory", data gives "Northern Territory and Tasmania", matching the mockup), then GREEN. `npm run check` passes (997 tests).

Design: pattern chosen in pickSteps: combined stamp with 189 no-data -> no-data route; other combined -> nothing suits; lodged EOI -> lodged; 189 very-strong -> very strong; 189 stamp or 189 at least long-wait -> improving (covers Priya and Meera); 189 not-eligible -> below 65; else state route.
Deadlines: titles derived from Loss (birthday number parsed from the loss title, points from from/to). afterStep = last non-final step dated on or before the loss; undated steps count as now; the final step is the outcome and follows every loss. Hence Rahul's English expiry sits after step 2 (mockup showed 1.5).

Data vs brief (R2): Priya "Submit EOI" sub is "189 + VIC 190, now" (mockup NSW); Rahul submit sub "190 + 491, Northern Territory" (NT only in data; mockup "NT / TAS"); Arjun sub "190 + 491, Tasmania" as briefed. Sana (no-data) route follows mockup, using list-membership state (WA).
Concerns: route.ts is 302 lines. Arjun's "190 + 491" lists both visas that have a best state, though the 491 state is SA, not Tasmania.

## Fix report
Changes: submit-EOI subs now name each visa's own best state ("190 Tasmania + 491 South Australia"; Rahul "190 Northern Territory + 491 Northern Territory"), omitting visas with no state (R7). Deadline helpers moved to route-deadlines.ts (route.ts now 282 lines). Added route-deadlines.test.ts pinning the Loss.title shapes. Command: `npm run check`, passing (see commit).
