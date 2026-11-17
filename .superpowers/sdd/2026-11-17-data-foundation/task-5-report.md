# Task 5 report
Implemented scripts/import/qlik-client.ts, qlik-constants.ts, qlik-client.test.ts; tsx@4.23.15 pinned exact.
RED: `npx vitest run scripts/import/qlik-client.test.ts` failed (module missing, no tests). GREEN: 6/6 pass. `npm run check` passes (12 files, 101 tests). `npm ci` OK.
Notes: header-shape mismatch throws "Table shape changed"; budget check happens before each page read; OpenDoc + bookmark applied on open (also with injected transport). Throttle uses real timers; tests use throttleMs 0.

## Fix report (I1, I2)
Changes: Transport gained required onClose(handler); pending requests are rejected on close/error; per-call timeout (callTimeoutMs, default 60000) rejects "Qlik <method> timed out"; live transport listens for error/close after open and closes the socket if open fails; OpenDoc/ApplyBookmark wrapped in try/catch that closes the transport and rethrows.
RED: 3 new tests failed (timeout test hung to vitest 5s limit, close test hung, OpenDoc-failure test did not close transport).
GREEN: `npx vitest run scripts/import/qlik-client.test.ts` 9/9; `npm run check` passes (104 tests).
