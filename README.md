# Landfall

A first useful release of a personalised Australian skilled migration information tool. The original `SPEC.md`, HTML references and independent `RESEARCH.md` live in the parent folder; the current product direction is in [docs/PRODUCT.md](docs/PRODUCT.md).

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

- Editorial homepage with an interactive official-snapshot occupation/points explorer.
- Four-step federal points check, with validation and live category totals.
- Generated overview with conditional nomination totals, pool comparisons, score scenarios, sourced state summaries and personal dates.
- Birthdays from 18 through the under-45 boundary, evidence expiries, EOI validity and entered visa expiry.
- Optional browser-local saving and an explicit clear control. No profile API or personal-data database.
- Sample report, all eight state/territory program summaries, searchable state directory, source links and methodology.
- Browser print stylesheet and Print / save PDF control.

## Data and boundaries

`src/data/pool.json` is a real published SkillSelect snapshot dated 31 October 2026, imported on 17 November 2026. It covers 11 occupations, visa type 189PTS and SUBMITTED status. See [scripts/README.md](scripts/README.md) for import provenance.

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

## Next phase: first sales

Implement validated source imports, private report persistence and revocable delivery, one payment provider with verified webhooks, transactional email and reproducible PDF generation. Complete legal review of real outputs and the operating model, source-specific reuse/automation checks, support/refund terms and paid refresh entitlements before accepting purchases.

Measure usefulness, willingness to pay, conversion and support cost before expanding to alerts, SEO pages or agent partnerships. The code is a portable Next.js application; the private preview host does not determine the eventual commercial hosting choice.
