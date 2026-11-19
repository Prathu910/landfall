# Task 5 report
Implemented seven components + CSS modules in src/components/occupation/ (summary, pool-tabs [client, own accessible tablist, all panels in HTML, print shows all], round-cards, cohort-bars, state-table [stacks on phones], occupation-faq [native details], related-occupations). Props use view-model types; no computation. No render tests (R3).
Verification: `npm run check` passes (79 files, 828 tests, incl. 12px floor). `npm run build` not run (components not yet routed; Task 6).
Notes: PoolTabs uses a small custom tablist rather than Mantine Tabs (brief allowed). FAQ print relies on existing global details print rules. StateTable header shows the asAt string as passed.

## Fix round 1
See commit.

## Fix round 1 (recorded by the controller from the implementer's reply)
- `.strip`: `print-color-adjust: exact` and `-webkit-print-color-adjust: exact`.
- `StateTable`: explicit ARIA roles (table, rowgroup, row, columnheader, rowheader, cell).
- `CohortBars`: a visually hidden text summary per month (masked counts read "under 20"); Closed segment and legend swatch use `--muted` instead of `--rule`.
- Command: `npm run check` → 79 files, 828 tests passed. Commit 5fa111c.
