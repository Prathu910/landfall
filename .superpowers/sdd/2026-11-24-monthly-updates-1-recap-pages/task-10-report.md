# Task 10 report
Implemented `scripts/updates/generate.ts` (`parseGenerateArgs`, CLI), `src/lib/updates/load-server.ts` (`listRecapMonths`, `loadRecap`, both take an optional dir), tests in `scripts/updates/generate.test.ts` (18 passing), `updates:generate` script, `.prettierignore` entry, docs (scripts/README.md, CLAUDE.md commands).
Generated `src/data/updates/2026-10.json` (32 KB; firstGeneratedAt = updatedAt = 2026-11-24). Facts file is written compact (indented was 65 KB, over the 20-60 KB bound).
Spotlight-swap wiring: `--previous-manifest` must be the previous month's manifest (CLI exits 1 if its asAt is not month-1), and the CLI never defaults it to the current manifest. A rerun of the same month without the flag keeps the existing data section's occupationsAdded/Removed instead of resetting them to null. Previous facts come from src/data/updates/<month-1>.json if present. Verified: rerun with --spotlight on 2026-11-25 kept firstGeneratedAt and moved updatedAt.
Tests: npm run check passes (153 files, 1586 tests), npm run build passes. Note: tests were written alongside the implementation, not strictly red-first.
Concerns: R22 `roundsCheckedAt` is read via a type cast (field not yet on Manifest; Plan 3 Task 3 adds it). 2026-10 has no occupationsAdded/Removed (null) since no previous manifest was given, per spec decision 6.

## Fix round 1
`loadAllCores` now loads every index entry that has a core file (no hasData filter); `checkPreviousManifest` and `keepAddedAndRemoved` extracted and exported. Regenerated 2026-10.json: 189 invited current max 16,700; 189 submitted previous max 182,311; 190 invited current max 9,905; NSW 190 max 6,946, 324 masked; firstGeneratedAt kept 2026-11-24.
Tests added in scripts/updates/generate.test.ts: pinned maxima (skipped once manifest.asAt moves past 2026-10), core count 493, month-1 check on --previous-manifest, keep-added/removed on rerun.
Command: `npx vitest run scripts/updates src/lib/updates` -> 11 files, 94 tests passed. `npm run check` -> 153 files, 1593 tests passed.
