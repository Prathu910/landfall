## Global Constraints

- Branch `roadmap/report-redesign` (exists). Conventional Commits; end every commit with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Every task ends with `npm run check` passing; tasks that touch UI also run `npm run build`.
- `src/lib` is pure: no React, DOM or fetch. Files in `src/lib/data/` and `src/lib/outlook/` use relative imports (no `@/`), because they run under tsx and vitest.
- Every calculation takes an explicit `asOf` (`YYYY-MM-DD`). Scenario tests use `asOf = "2026-11-21"` and snapshot `skillselect-2026-10-31`.
- "<20" is the interval `{ min: 0, max: 19 }`; never a number; a cautious reading decides labels. A missing month key is "not fetched", never zero; build month windows with `calendarMonths(core.asAt, n)`.
- File sizes: about 250 lines per component, 300 per `src/lib` module. One exported component per file, kebab-case file name. CSS Modules next to components; colours only through tokens.
- No readable text under 12 px (CSS, TSX, TS and SVG text at rendered size). Body 16 px on phones. Reduced motion respected; stamps never animate.
- Label display names (exact): Very strong, Strong, Competitive, Long wait, Not eligible yet, Not open to you, Not currently invited, Not enough data, Too few to count. Stamp short names: Not invited, Not eligible, Not open, No data.
- Rank, best first: very-strong > strong > competitive > long-wait > not-eligible > not-open > not-invited > no-data.
- Footer text (exact): "This is our best reading of the data, not a guarantee. It comes from published SkillSelect figures up to {Month YYYY}. Home Affairs and the states can change round sizes, cut-offs and rules at any time, so your real result may be different. MigrateLens isn't a registered migration agent; for advice on your own case, talk to one."
- AI settings are server-side env vars only: `ANTHROPIC_API_KEY`, `READ_MODEL` (default `claude-opus-5-5`), `READ_ENABLED` (default `false`), `READ_MAX_OUTPUT_TOKENS`, plus `READ_TOKEN_SECRET` for the HMAC. Frontend switch: `NEXT_PUBLIC_READ_ENABLED` (default off).
- Occupations with `hasData: false` are never fetched by the client (existing rule, `docs/DATA.md`); in the product they take the no-core path (all three visas No data, list membership shown).
- Homepage, occupation pages, `/states/` and methodology stay unchanged; keep every module they import.

