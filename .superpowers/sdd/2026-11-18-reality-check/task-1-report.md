# Task 1 report
Implemented src/lib/report/copy.ts and round-status.ts with tests (15 tests).
RED: `npx vitest run src/lib/report/` -> 2 files failed, modules missing.
GREEN: same command -> 15 passed. `npm run check` passed (30 files, 252 tests).
Extra: submissionMonth also rejects non-existent days (2025-02-30). formatCount reuses formatInterval from ../pool.
Concerns: none. `npm run build` not run (not required by brief step list).
