# SDD ledger — plan: docs/superpowers/plans/2026-11-24-monthly-updates-2-instagram-images.md

Spec: docs/superpowers/specs/2026-11-24-monthly-updates-design.md
Branch: roadmap/monthly-updates (controller ruling: Plans 1 → 2 → 3 stacked on one branch; the plan's `roadmap/monthly-updates-social` and "Plan 1 merged" are superseded). Push after every task; never merge.

## Controller rulings
- Ruling (recorded in Plan 1's ledger, 24 Nov 2026): Spec decision 6 → commit the locally rendered 2026-10 sets. The founder said "go ahead".

## Pre-flight scan

Scanned 24 Nov 2026. Checked: puppeteer-core 25.18.1 and sharp 0.35.5 are present; both font files exist; `markSvg` lives in `scripts/og-image/render.ts` (`mark-geometry.ts` exports `markSvgBody(colour)`, whose default colour is a hex value); `colour-literals.test.ts` walks `src/` only; `.prettierignore` doesn't cover `public/`; there is no vitest config (no `@/` alias); the existing stamps use `@/`, CSS modules and `useFitStampText`; the recap mockup page has no spotlight section.

### Pair rows

| # | Pair | Produces → consumes | Finding |
|---|---|---|---|
| 1 | P2T1 → P2T2 | `CardView.visas` → `hashtagsFor` | Clean. The spotlight always shows 189 figures (spec 6.8), so month sets always carry `#189visa`. That's consistent with 6.7. |
| 2 | P2T1 → P2T3 | `CardView` → templates | Clean. |
| 3 | P2T3 → P2T4 | `cardHtml` → render jobs and browser checks | Clean. |
| 4 | P2T4 → P2T5 | `roundSetJobs` (9) / `monthSetJobs` (13) → `set.json`, limits | Counts agree with Task 6 (22 PNGs; month/ holds 12 plus root `og.png`). The month set's `reused` assumes the round set's files exist. See R13. |
| 5 | P2T5 → P2T6 | renders + `set.json` under `public/social/` → `npm run check` | `public/social/**/set.json` isn't prettier-ignored, and `JSON.stringify` output fails `prettier --check` (short arrays collapse). See R12. |
| 6 | P2T6 → P2T6 | `ogImageFor` round fallback ↔ retention | Retention keeps only "each month's og.png", which could delete the `round-*/og.png` the fallback serves. See R11. |
| 7 | P1T11 ↔ P2T1 (cross) | `RecapView` has no spotlight slice ↔ cards-numbers test | The spotlight card's numbers (top 190 floors, last six rounds) aren't in the view. See R10. |
| 8 | P1T11 → P2T1 (cross) | `shadeBand` | Clean. |
| 9 | P1T12 ↔ P2T3 (cross) | `round-stamp`/`rect-stamp` → `renderToStaticMarkup` under tsx and vitest | Needs relative imports and no hooks. See R9. |
| 10 | P1T12 ↔ P2T6 (cross) | page OG check → `ogImageFor` | Clean. |
| 11 | P1T10 → P2T4 (cross) | `loadRecap` | Clean. |
| 12 | P1T8/T9 ↔ P2T1 (cross) | spotlight and round facts must be month-bounded | See R5 (Plan 1 ledger). |
| 13 | P2T4 ↔ P3T6 (cross) | `CHROME_PATH`, `--no-sandbox` under CI | Clean. On ubuntu-24.04, Chrome's sandbox normally fails, so expect to need it. |
| 14 | P2T5 ↔ P3T6/T7 (cross) | render.ts "prune" ↔ `updates:retention` step in the monthly job; the round job renders too | Pruning twice, and the round PR would prune. See R11. |
| 15 | P2T5 → P3T4 (cross) | `SetManifest` (`set.json`) → PR summary images | Clean. |
| 16 | P2T6 ↔ P3T9 (cross) | committed Mac-rendered 2026-10 sets ↔ rehearsal "renders only missing" | Clean under the controller ruling. CI will never re-render them, and that's accepted. |
| 17 | P2T6 ↔ P1T13, P3T9 (cross) | CLAUDE.md, HANDOFF, scripts/README edits | Sequential, clean. |

### Per-task rows

| Task | Self-consistent? | Finding |
|---|---|---|
| P2T1 | Partly | The numbers test against the recap view can't hold for the spotlight (R10). Its token rule needs whole-token matching, excluding position, tag and MRZ (R10). Glyph ranges: "→" (U+2192) is outside Archivo's latin range, as planned. |
| P2T2 | Yes | Clean. |
| P2T3 | Partly | The test "defines every var() card.css uses" misses `var()` written inline by the stamp SVGs. See R14. For `markSvg`, use `markSvgBody("var(--ink)")` (R15). The `colour-literals.test.ts` extension to `scripts/social/` is consistent with `tokens.ts` reading palette objects. |
| P2T4 | Yes | Sizes and safe-zone maths agree (250…1580, 34…1046). `render.test.ts` runs in every local `npm run check` because the macOS Chrome exists. Slow but acceptable. |
| P2T5 | Partly | R11, R12, R13. |
| P2T6 | Partly | The founder's go-ahead is a founder decision and belongs in the STRATEGY.md decision log (R16). `npm run lighthouse -- --only` exists. |
| Plan header | No | Branch and "Depends on: Plan 1 merged" are superseded (controller ruling). Clean otherwise. |

### Proposed rulings

- **R9** Ruling: Plan 1's `round-stamp.tsx` and `rect-stamp.tsx` use relative imports only, no CSS module, no `"use client"` and no hooks except `useId`. — Why: vitest has no `@/` alias and `renderToStaticMarkup` runs no effects; the existing stamps break both rules. — Cost if wrong: P2T3 rework in Plan 1 code.
- **R10** Ruling: The cards-numbers test checks every card except the spotlight against the recap view (whole tokens; position, tag and MRZ excluded). The spotlight card is checked against `facts.data.spotlight` formatted through the same `format.ts` helpers. The recap page gets no spotlight section. — Why: spec 6.4 and the mockup have no spotlight section (the spec wins); 6.7's aim, that the page and a card never disagree, holds because the page doesn't show those numbers. — Cost if wrong: the test can't pass, or the view carries a dead slice.
- **R11** Ruling: `render.ts` never prunes; only `npm run updates:retention`, run by the monthly job, deletes files. `retentionPlan` keeps every `og.png`, including `round-*/og.png`. — Why: spec 6.7 says "the monthly PR deletes older sets", and the `ogImageFor` fallback needs the round OG images. — Cost if wrong: a round PR deletes images, or a recap's OG image breaks.
- **R12** Ruling: P2T5 adds `public/social/` to `.prettierignore` (or writes `set.json` through Prettier). — Why: `npm run check` must pass in every data PR (spec section 3). — Cost if wrong: every monthly PR fails its check.
- **R13** Ruling: `--set month` exits 1 when the newest round's `round-light.png`/`round-dark.png` are missing ("render the round set first"). — Why: spec 6.7 says card 2 is reused and never re-rendered. — Cost if wrong: broken images embedded in the PR.
- **R14** Ruling: The `tokens.test.ts` check also scans the rendered static markup of each card for `var(--…)` names. — Why: the stamps paint through inline SVG attributes, not `card.css`. — Cost if wrong: a stamp renders unpainted in one theme with no failing test.
- **R15** Ruling: Use `markSvgBody("var(--ink)")` from `mark-geometry.ts`. Don't copy `scripts/og-image`'s `markSvg`. — Why: the token-only templates rule (spec 6.7). — Cost if wrong: a colour-literal test failure.
- **R16** Ruling: P2T6 adds the 24 Nov founder go-ahead for committing local 2026-10 sets to the `docs/STRATEGY.md` decision log. — Why: AGENTS.md ("add each new founder decision"). — Cost if wrong: an undocumented exception to the spec 6.7 CI-only rule.

- Controller (24 Nov): all proposed pre-flight rulings above are ACCEPTED as written; implementers follow the ones naming their task.

## Execution
- P2 Task 1: BASE b1cc161, implementer dispatched (sonnet)
Task 1: minor (deferred): spotlight with zero rounds → empty heading; as StateCard cast; not-on-list spotlight keeps visas ['189'] (adds #189visa); numbers test whitelists '20' and all spotlight numbers.
Task 1: complete (commits b1cc161..8d8dd6b, review clean)
- P2 Task 2: BASE 8d8dd6b, implementer dispatched (sonnet)
Task 2: minor (deferred): caption('round') silently falls back to month sentences when no round card; no sentence-count/round last-line test; needless temp.
Task 2: complete (commits 8d8dd6b..9d92968, review clean)
- P2 Task 3: BASE 9d92968, implementer dispatched (opus)
Task 3: minor (deferred): SourceLine finds bold date by searching ' · as at ' in copy; 'lowest score invited' copy only in template; card-map vs state-recap-map SVG body near-duplicate; optionally list ARTWORK in CLAUDE.md brand paragraph.
Carry-forward to Task 4: overflow fixture must be 'Supercalifragilisticexpialidocious Specialist' (old long name now fits); use page.goto(file://) and pass evaluate a string (tsx __name helpers); pin puppeteer-core (already imported by a Task 3 Chrome test).
Task 3: fix round 1/5 (2 addressed, 0 open — spotlight title fit; long word pushes stamp; commits 9ab09d8..98d57cd)
Task 3: minor (deferred): title-fit uses hand-measured width table (Chrome test is the guard, skips without Chrome); vitest 5s timeouts under load — consider longer timeouts for Chrome tests.
Task 3: complete (commits 9d92968..98d57cd, review clean after 1 fix round)
- P2 Task 4: BASE 98d57cd, implementer dispatched (opus)
Carry-forward to Plan 3: render launch has no --no-sandbox; ubuntu-24.04 runners restrict unprivileged user namespaces (AppArmor) — CI job may need a sandbox workaround (e.g. env-gated --no-sandbox or sysctl). Task 5 must bring dark month images (312/320 KB pre-quantise) under 300 KB and set ≤2.5 MB.
Task 4: minor (deferred): run-as-main path-suffix guard; temp dir cleanup on partial launch failure; stem() mapping for month cover tested only indirectly.
Task 4: complete (commits 98d57cd..f73a61c, review clean)
- P2 Task 5: BASE f73a61c, implementer dispatched (sonnet)
Controller verified: npm run check exit 0 after Task 5 (1784 tests). Untracked public/social/2026-10 renders left for Task 6.
Task 5: minor (deferred): manifestPath derived from first job folder; set limit excludes reused round images; no test for limit-violation-writes-nothing; '2.5 MB over 2.5 MB' rounding; setManifest casts nullable round.
Task 5: complete (commits f73a61c..a86d84e, review clean)
- P2 Task 6: BASE a86d84e, implementer dispatched (sonnet)
Task 6: rendered 2026-10 sets (22 PNGs) from scratch, viewed all in light and dark, committed per R16. Instagram safe-zone/grid-crop guidance was not re-checked online on the day (no network use); social-spec.ts unchanged (story 250/340 px, feed 34 px grid crop).
Task 6: Instagram safe-zone/grid-crop guidance not re-checked online (spec risk 19) — deferred, note in handoff. Minor (deferred): ogImageFor readdir path handling untested.
Task 6: fix round 1 dispatched (cover 'five cards' vs 1/6; month set.json lacks card-2 alt text; controller copy fix for round rows).
Task 6: fix round 1/5 (3 addressed, 0 open — cover count; card-2 alt in month manifest; previous-cutoff copy incl. cross-year; commits 4d6ea4f..c6790a8)
Task 6: minor (deferred): cross-year render test title overstates; possible flaky test (one npm run check exit 1, rerun passed).
Task 6: complete (commits a86d84e..c6790a8, review clean after 1 fix round). Plan 2 complete.
Founder (in chat): stop pushing after every task; push once at the end. Also: do NOT shut down the Mac or close the terminal.
Founder (25 Nov, chat): at the end push roadmap/monthly-updates but do NOT create or open the PR page; founder creates it manually.
