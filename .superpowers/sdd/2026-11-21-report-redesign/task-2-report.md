# Task 2 report: 189 label

Implemented `src/lib/outlook/label-189.ts` (label189, higherScoreCount, Label189), `__fixtures__/scenarios.ts` (SCENARIOS, ScenarioId, ENDOCRINOLOGIST) and `label-189.test.ts`.

TDD: RED = `npx vitest run src/lib/outlook/label-189.test.ts` failed ("Test Files 1 failed", module label-189 missing). GREEN = `npx vitest run src/lib/outlook`: 2 files, 30 tests pass. `npm run check`: 87 files, 892 tests pass.

Data vs brief: no differences. All fixture points (90,70,80,85,60,75,75,70,80) and teacher ahead {2444,2463}, lastThree values matched the real snapshot.

Decisions: "no listing ever + pool present with confirmed counts" -> not-invited. tooFew only when no round ever lists the occupation and every pool count is "<20". Not-eligible why ignores the eligible-null suffix. `tied` = count at exactly the reader's score (zero if key absent).
Concerns: the why wording for strong/very-strong/long-wait/no-data is my own (only competitive was specified).

## Fix report
- very-strong check now uses `(ahead?.max ?? 0) <= 19` (returned `ahead` stays null); test: no-pool core above all cut-offs -> very-strong.
- `competitiveWhy` built from met (<= points) and unmet (> points) cut-offs; brief string unchanged. Tests: 75 on [80,75,70], duplicates at 70 on [75,70,70].
- "last N listed cut-offs" wording fixed for 1 and 2 listed rounds (`cutoffPhrase`), with tests.
- Command: `npx vitest run src/lib/outlook/label-189.test.ts` -> 25 passed; `npm run check` passed.
