# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js 16 is newer than most training data. Before using any Next.js API or convention, read the relevant guide in `node_modules/next/dist/docs/`. `next dev` rewrites the `AGENTS.md` block, so commit that change with your work rather than removing it.

## What this is

Landfall is a personalised Australian skilled-migration (189/190/491) information tool. The current phase is the "useful first release": a free points check and report built from real published SkillSelect data. It has no backend, accounts, payments, email or PDF worker. The site must not claim that any of those exist. **Read `docs/STRATEGY.md` first.** It holds the founder's goals, decisions and approved roadmap, and it overrides older docs where they conflict. Working history lives in `.superpowers/`. `sdd/<plan>/progress.md` holds each plan's ledger: rulings, task outcomes and deferred issues. Briefs and reports sit beside it. `brainstorm/*/` holds the design mockups and `decisions.md`. Read the relevant ledger before continuing a plan. **Follow `docs/ENGINEERING.md`** for every code change: architecture, readability limits, styling, testing and the definition of done. Background direction is in `docs/PRODUCT.md`. The resume point and open QA list are in `docs/HANDOFF.md`. `docs/REPORT-COVERAGE.md` records which report sections are supported, limited or deferred.

## Commands

```sh
npm ci
npm run dev          # next dev --webpack on 127.0.0.1
npm test             # vitest run (domain/data tests in src/lib/*.test.ts)
npx vitest run src/lib/pool.test.ts          # single file
npx vitest run -t "rejects duplicate dates"  # single test by name
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (next core-web-vitals + typescript)
npm run format       # prettier --write .
npm run check        # format:check + lint + typecheck + test — must pass before every commit
npm run build        # static export to out/
npm run data:import -- --as-at YYYY-MM   # SkillSelect import (network); see docs/DATA.md
npm run data:generate -- --as-at YYYY-MM # rebuild src/data from data/raw, no network
python3 -m http.server 3017 --bind 127.0.0.1 --directory out   # serve the production build
```

Both dev and build use webpack on purpose. A stale Turbopack dev bundle once caused false regressions, so do not switch to Turbopack. Do final browser verification against the built `out/` static export, not the dev server. Node 22.12+ is required.

## Architecture

- **Static export only.** `next.config.ts` sets `output: "export"` and `trailingSlash: true`. Internal links therefore end in `/` (`/check/`, `/sample/`). Server-only features (route handlers, server actions, dynamic rendering) will not work in this phase.
- **Pure domain layer in `src/lib/`.** Keep it separate from the UI and test it directly.
  - `migration.ts`: the `Profile` type, `calculatePoints(profile, asOf)` and `buildTimeline(profile, asOf)`. All dates are `YYYY-MM-DD` calendar strings, parsed and calculated in UTC so the host time zone never matters. Only `localToday()` reads the browser's local date. Every calculation takes an explicit `asOf`: the check flow uses `localToday()`, and the sample page pins `"2026-11-17"`.
  - `pool.ts`: SkillSelect counts. A published `"<20"` becomes the interval `{min: 0, max: 19}`, and all arithmetic is on intervals (`comparePool`, `formatInterval`). Never collapse a masked count to a single number.
  - `report-evidence.ts`: the report's evidence types (190/491 distributions, monthly 189 totals, invitation rounds), `netPoolChange` and `validateOccupationEvidence`. A `null` round cutoff means "not listed". It does not mean zero.
  - `data/`: the per-occupation dataset. `types.ts` and `guards.ts` define and check the records; pure accessors (`pool-position`, `invitations`, `cohorts`, `state-evidence`, `similar-profile`) answer report questions; `legacy.ts` adapts a core record to the shapes the current report reads (`toPoolOccupation`, `toOccupationEvidence`). `load-server.ts` reads files with `fs` and is for Server Components only. Files here and in `scripts/import/` use relative imports, not `@/`, because they run under tsx and vitest.
  - `scenarios.ts`: "what if" credential scenarios. These produce a modified `Profile` that goes back through `calculatePoints`.
- **Checked-in data.** The SkillSelect dataset (snapshot `skillselect-2026-10-31`, 493 occupations) is written only by the TypeScript importer in `scripts/import/`: raw history in `data/raw/<asAt>/`, and `src/data/manifest.json`, `occupation-index.json`, `rounds.json` and `occupations/<code>.json` (core) plus `<code>.detail.json`. Read `docs/DATA.md` (the data dictionary) before using any of it; `scripts/README.md` covers the commands. `states.ts` holds hand-sourced summaries of the state/territory programs.
- **Loading data.** Server Components (pages) load what they render statically through `load-server.ts`. Client components may import only `occupation-index.json` (via `src/components/data/occupation-index.ts`) and `rounds-meta.json` (the skipped 189 rounds, via `src/components/data/rounds-meta.ts`) and the state rule data (the 2026–27 rules, the four imported state lists and the federal occupation list, about 10 KB gzipped, via `src/components/data/state-rule-data.ts`; see "State rules" in `docs/DATA.md`), and fetch one occupation at a time with `useOccupationCore` (or `useOccupationDetail` for the detail file), from `/data/occupations/<code>.json` and `<code>.detail.json` (copied to `public/` before `dev` and `build`). Pass that hook a stable, module-level index array. While loading, show "Loading published data…", never a "not in snapshot" message.
- **UI in `src/components/`.** These are large client components. `check-flow.tsx` is the four-step form, with validation and opt-in `localStorage` saving. `report.tsx` is the generated report, shared by `/check/` and `/sample/`; it opens with the reality check (`report/scorecard.tsx`), then the visa panels (`report/panel-189.tsx`, `report/panel-nominated.tsx`), then the state outlook with the optional "Sharpen my state outlook" questions (`report/state-outlook-section.tsx`: `state-outlook.tsx`, `state-tile.tsx`, `state-panel.tsx`, `sharpen-form.tsx`; pure logic in `src/lib/state-outlook/`), and keeps the comparison (`report/compare-section.tsx`) and trend chart (`report/trend-chart.tsx`) in `src/components/report/`. Their display strings and numbers come from pure, tested view-models in `src/lib/report/` (`scorecard.ts`, `panel-189.ts`, `eois-like-yours.ts`, `what-could-change.ts`, `panel-nominated.ts`, `state-outlook-view.ts`, `report-view.ts`, `copy.ts`); components only render them. All report copy follows the rules in `src/lib/report/copy.ts` (`BANNED_COPY`). `providers.tsx` sets up the Mantine 9 theme (custom `forest` palette, forced light scheme) and Motion with `reducedMotion="user"`. Styling is mostly global classes in `src/app/globals.css`; new components use CSS modules next to the component. Charts are hand-written SVG and do not use a chart library.
- `.openai/hosting.json` identifies the private preview hosting project. Preserve it, and never put credentials there.

## Product constraints

These come from the docs and past reviews:

- Do not invent data. That means no percentage chances, forecast wait times, exact same-score rankings, testimonials, user counts or claims of live services. Pool comparisons count EOIs, not people. You may show history-based counts (EOIs ahead of you, at your score, outcomes of similar EOIs) and historical waits, as defined in `docs/STRATEGY.md`.
- Personal profile data stays in the browser. Never put it in the URL; the only allowed query parameter is a pre-selected `?occupation=` code. Save locally only after explicit opt-in, and always provide a way to clear it.
- `eligible` in `PointsResult` covers only age, English and assessment validity. It never means full visa eligibility. State summaries must keep federal points separate from state scoring.
- Every report section, including collapsed accordion/glossary content, must remain visible when printed.
- Every animation must respect reduced motion.
- `docs/original-references/` holds the original SPEC and HTML mockups. They must stay byte-for-byte unchanged. Treat them as historical context only; they are not current requirements.
