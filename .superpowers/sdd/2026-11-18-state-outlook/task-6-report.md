# Task 6 report
Implemented: optional Profile fields (incl. yearsExperienceLast10, JSDoc on month fields = current continuous streak) in src/lib/migration.ts; src/lib/state-answers.ts with normaliseStateAnswers + restoreProfile (invalid/null -> unanswered, other answers kept); check-flow restore calls restoreProfile. New fields not added to emptyProfile/sampleProfile (absent = unanswered), so isProfile guard is unchanged and old saves restore.
TDD: RED = state-answers.test.ts failed (module missing); GREEN = 5 tests pass. npm run check: 48 files / 470 tests pass; npm run build OK.
Files: src/lib/migration.ts, src/lib/state-answers.ts, src/lib/state-answers.test.ts, src/components/check-flow.tsx.
