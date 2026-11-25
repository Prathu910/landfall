# Task 5 report: occupations that drop out keep their pages

Status: DONE. Commit: feat(data): keep pages for occupations that drop out of the data (on top of 2327ba7).

Implemented
- Types/guards: `OccupationIndexEntry.lastAsAt?/lastCheckedAt?`; `isManifest` requires both or neither.
- `generate`: `previous?: PreviousData` carries absent codes forward unchanged with marks (`??` keeps earlier marks); returning codes lose them; outputs sorted by code. `scripts/import/previous-data.ts` reads src/data; `cli.ts` passes it in every mode (R7) and validates against `previous.manifest`.
- `validate-generated`: older snapshot allowed only with `lastAsAt` (must equal that month's snapshot id); `lastAsAt >= asAt` is an error (R7 same-month vanish); the 10% drop check counts current codes only.
- `formatLongMonth` (copy.ts), `nextMonth` (months.ts), `dropped.ts` (`droppedSince`, `droppedNote`).
- `publishedOccupationCode` returns null for marked entries; `unavailableReason` returns `{kind:"dropped", note}`; scorecard and outlook view (`status: "dropped"`) give "..., so this report uses your points only."
- Page: `DroppedNote` above the direct answer; Last updated/footer/JSON-LD use `lastCheckedAt`, footer uses the core's own snapshotId; verdict strip and check card show "Figures from Mon YYYY". Sitemap dates dropped entries by `lastCheckedAt`; indexability unchanged (R21 title/coverage follow the core's asAt; tested).
- DATA.md bullet added.

Tests: `npm run check` 142 files / 1498 tests pass; `npm run build` passes (no src/data change, no dropped occupation today). New tests in generate, validate-generated, dropped, occupation-url, meta.

Concerns
- R6 (excluding dropped entries from sums/picks) belongs to Tasks 8/9; not built here.
- The DATA.md index-file table row was not updated (only the new bullet).
- Lint warning from an untracked .superpowers brainstorm asset is pre-existing.
