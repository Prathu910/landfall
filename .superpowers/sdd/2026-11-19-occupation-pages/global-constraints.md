## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API (dynamic routes and `generateStaticParams`, `generateMetadata`, `sitemap`, `robots`, static exports). Route handlers and metadata routes need `export const dynamic = "force-static"` under the static export.
- Internal links end in `/`. The only allowed query parameter is `?occupation=<code>`.
- No forecasts, chances, "should" or visa recommendations; every rendered string passes `BANNED_COPY` (`src/lib/report/copy.ts`). "Is N points enough?" is answered from history only and ends "Past cut-offs are history, not a promise."
- A published `"<20"` is the interval `{min: 0, max: 19}` (`parseCountText`, `sumIntervals`, `formatCount`, `countInSentence`); never a single number. A `null` round cut-off is "Not listed", never zero. A month or state with no published data reads "Not published", never 0. Counts are EOIs, not people.
- `src/lib/occupation-page/*` is pure: no React, no `fs`, relative imports (it runs under tsx and vitest). Pages read files only through `src/lib/data/load-server.ts`.
- Reuse, do not re-implement: `summarise189Rounds` and `CHIP_LABEL` (`report/round-status.ts`), `buildEoisLikeYours` (`report/eois-like-yours.ts`), `poolPosition` (`data/pool-position.ts`), `formatMonth`, `formatCount`, `countInSentence` (`report/copy.ts`), `formatDate` (`migration.ts`), `STATE_NAMES`, `joinWords` (`state-outlook/context.ts`), `stateRuleData` (`components/data/state-rule-data.ts`), `TryIt` (`components/home/try-it.tsx`).
- Brand: tokens on `:root` in `src/app/globals.css` (no new hex literals in new CSS), Newsreader 600 for headings and big numbers, Inter for text, saffron never as text. No rendered text under 12px (`src/app/css-floor.test.ts`); running text 16px at phone width; AA contrast; everything visible in print; any animation respects reduced motion.
- `src/lib/site.ts`: `SITE_INDEXABLE = false` keeps every page `noindex` and `robots.txt` disallowing all. Do not flip it.
- `docs/ENGINEERING.md` readability limits apply (files under about 300 lines, functions small). `npm run check` and `npm run build` pass before every commit. Implementers never stage `.superpowers/`.

## Review Focus

1. An occupation with no 189 pool (279 of 493, e.g. the `no189PoolCore` fixture): no 189 bottom line, no "Is N points enough" question, the page leads with 190/491; tested in Tasks 2 and 4.
2. An occupation whose every count is "<20" (192): page builds, shows "under 20" everywhere, is `noindex` and absent from the sitemap; tested in Tasks 4 and 6.
3. A missing or failed detail file: the cohort section and the "EOIs like these" sentence are left out and the page still builds; tested in Tasks 2 and 3.
4. A state with no `stateInvited` entry for the snapshot month: "Not published", never "0"; tested in Task 3.
5. Long names at 320–390px ("Software and Applications Programmers nec"): heading wraps, round cards stay four per row, no horizontal scroll; checked in Task 7's browser pass.


## Rulings from the pre-flight scan
- R1: Task 2 also exports `sourceLine(core)` = "SkillSelect (Department of Home Affairs), snapshot {formatDate(monthEnd(core.asAt))} · counts are EOIs (one person can hold several) · updated monthly".
- R2: "the state with the most 190 invitations" ranks invited intervals by `min`, then `max`; name a state only when its `min` > 0.
- R3: no component render tests (the repo has none).
