# Resume here

17 November 2026. The user requested pushing the current work to GitHub and continuing later. This checkpoint contains the premium redesign and expanded evidence-backed report. No new preview deployment was requested at this stopping point; the existing private Sites preview still has the previous release.

## Implemented

- Mantine 9 controls and mobile drawer; Motion feature tabs, step/score transitions and section entrances, with reduced-motion support.
- Redesigned landing page, guided check, report workspace and state directory.
- Report credential scenarios, explicit scenario-to-pool action, three visa pools, twelve monthly 189 occupation totals, six actual invitation rounds, personal dates, state summaries, occupation comparisons, general checklist and glossary.
- Reproducible official-data importer and source/coverage documentation.
- Review fixes for bounded chart input, printing collapsed content, expired-credential scenarios and SVG title hydration.

## Verified

47 domain/data tests pass, TypeScript passes and the static production build passes. Production dependency audit reports no vulnerabilities. Original SPEC and four HTML references remain byte-for-byte unchanged.

Production browser checks exercised homepage searchable occupation, keyboard score slider and feature tabs; empty validation; calendar selection; full four-step sample check; 90-point report; credential scenario and applying it to the pool; 190/491 score defaults; oversized pasted input; checklist and glossary; edit, opt-in saving, restoration and clear. No JavaScript page errors in the completed flow. Mobile navigation and sample-report width passed a 390px smoke check; collapsed glossary content is visible in production print media. A decorative halo causing homepage horizontal overflow was corrected.

## Continue next time

As of 17 November 2026, follow the approved roadmap in `docs/STRATEGY.md`, in order:

1. Data foundation: import all occupations, EOI statuses, Month Submitted cohorts, Nominated State and profile attributes. First resolve the open status-semantics questions listed there.
2. A reality-check section in the report.
3. A 190/491 state outlook, covering rules, evidence and points, ranked into groups.
4. SEO foundation and occupation pages for every occupation.
5. Polish: readability, copy, sample report, `npm ci` lockfile.
6. Content engine.
7. Monetisation, with lawyer review first.

The earlier QA items still apply as part of step 5: mobile/tablet visual QA, print pagination and step-to-step scrolling under the sticky header. Preserve `.openai/hosting.json` when publishing.

`docs/REPORT-COVERAGE.md` records every original report section and the evidence or product dependency behind each remaining gap. `docs/DESIGN.md` records the design approach and library choices. Exact queue positions, forecast waits, percentage chances and current ceiling utilisation remain unsupported and are not fabricated. History-based outcome counts and historical waits are now planned; see `docs/STRATEGY.md`.
