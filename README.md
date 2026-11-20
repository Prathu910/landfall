# Landfall

> The product is now called **MigrateLens**. "Landfall" remains the repository's name. The brand and homepage are set by [docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md](docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md).

A first useful release of a personalised Australian skilled migration information tool. The original `SPEC.md` and HTML references are preserved in [docs/original-references](docs/original-references/); independent `RESEARCH.md` also lives in the parent folder; the current product direction is in [docs/PRODUCT.md](docs/PRODUCT.md).

## Run locally

Use Node.js 22.12+ or a recent supported Node version.

```sh
npm ci
npm run dev
```

The development server prints its local address. The dev and production scripts use webpack consistently. The final private preview uses the static production build.

```sh
npm test
npm run typecheck
npm run build
python3 -m http.server 3017 --bind 127.0.0.1 --directory out
```

## What works

- Redesigned premium homepage with interactive pool/points/timeline tabs, Mantine controls and reduced-motion-aware Motion transitions.
- Four-step federal points check, with validation and live category totals.
- Expanded report with conditional nomination totals, credential scenarios, 189/190/state-491 pool comparisons, twelve monthly occupation totals, six actual invitation rounds, personal dates, occupation comparisons, preparation checklist and glossary.
- Birthdays from 18 through the under-45 boundary, evidence expiries, EOI validity and entered visa expiry.
- Optional browser-local full-profile saving and a clear control. A required email plus limited calculation summary is saved through Supabase before the personal report opens; feedback accepts optional contact details. Full profile dates stay local. See [operations](docs/OPERATIONS.md) for required setup.
- Sample report, all eight state/territory program summaries, searchable state directory, source links and methodology.
- Browser print stylesheet and Print / save PDF control.

## Data and boundaries

The SkillSelect data is a real published snapshot dated 31 October 2026, imported on 17 November 2026. It covers 493 occupations: EOI counts by status, visa (189, 190 and state-nominated 491), score, nominated state and month submitted, 24 months of status history, and the official 189 invitation rounds. See [docs/DATA.md](docs/DATA.md) for the data dictionary and [scripts/README.md](scripts/README.md) for the importer.

Masked values remain `<20` in source and 0–19 intervals in arithmetic. Pool comparisons do not establish exact tie-break ranking. No individual invitation probabilities, wait predictions or community samples are invented.

The points check is self-reported. This release does not verify documents, audit individual English test scores, implement full state eligibility engines, or establish complete visa eligibility. State summaries distinguish federal points from state scoring. WA and NT current cohort rules need further verification.

There is no checkout, paid report entitlement, transactional email, account system, automated PDF worker, scheduled import or alert service in this phase. The website makes no claim that those services are available.

## Structure

- `src/lib/migration.ts`: pure calendar, federal points and timeline engine.
- `src/lib/pool.ts`: published-count intervals and cohort comparisons.
- `src/data/`: checked-in snapshot and sourced state summaries.
- `src/components/`: guided check, generated report, explorer and shared site shell.
- `src/app/`: Next.js routes and styles.
- `docs/`: phase boundaries, implementation plan and verification notes.
- `.openai/hosting.json`: owner-private Sites project identity and static output configuration. No credentials belong here.

See [the reference coverage audit](docs/REPORT-COVERAGE.md) for every supported, limited and deferred section, and [design notes](docs/DESIGN.md) for the UI approach.

## Next phase: first sales

Implement validated source imports, private report persistence and revocable delivery, one payment provider with verified webhooks, transactional email and reproducible PDF generation. Complete legal review of real outputs and the operating model, source-specific reuse/automation checks, support/refund terms and paid refresh entitlements before accepting purchases.

Measure usefulness, willingness to pay, conversion and support cost before expanding to alerts, SEO pages or agent partnerships. The code is a portable Next.js application; the private preview host does not determine the eventual commercial hosting choice.
