# Task 11 report
Implemented occupation-url.ts (+test), load-server.ts (server-only header, cwd paths, code regex, guard validation), use-occupation-core.ts (AbortController, stale-safe, all failures -> unavailable), scripts/copy-public-data.ts (clears stale, exits 1 if source missing), predev/prebuild scripts.
RED: vitest failed "no tests" / module missing before implementation. GREEN: 2 tests pass; npm run check passes (198 tests); npm run build OK; out/data/occupations has 986 files incl. 261313.json and 261313.detail.json.
Concerns: hook has no browser test (no DOM test env); loadOccupation* additionally reject non-6-digit codes.
