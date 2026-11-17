# Data scripts

All SkillSelect data is produced by the TypeScript importer in `scripts/import/`. It is the only writer of `data/raw/` and `src/data/` (apart from the hand-sourced `src/data/states.ts`). The data dictionary, status meanings, known limits and the full import procedure are in [`docs/DATA.md`](../docs/DATA.md).

## Commands

```sh
npm run data:import -- --as-at YYYY-MM              # monthly import: every view at that month, plus a revision check of the previous month
npm run data:import -- --as-at YYYY-MM --backfill   # fetch every unstored month in each view's window (resumable)
npm run data:generate -- --as-at YYYY-MM            # rebuild src/data from stored raw files; no network
```

Add `--checked-at YYYY-MM-DD` to set the source check date (default: today). The first dataset is pinned to `--as-at 2026-10`; moving to a newer month is a separate, reviewed change.

The importer:

- reads the public SkillSelect dashboard's displayed text only, inside the publisher's guardrail (at most 2 shown and 2 filtered detail fields, one As At Month per query);
- keeps `<20` as text, which the app treats as the interval 0–19, and never narrows it;
- throttles calls (at least 250 ms apart) and stops at its page-read budget: 250 for a monthly import, 600 for a backfill;
- stores each finished view-month in `data/raw/<asAt>/` atomically, and writes a `.rev-<date>` file instead of overwriting a month the government revised;
- writes `src/data/` only after every validation check passes, and exits 1 on any issue.

After an import, run `npm run check` and `npm run build`, then commit `data/raw/` and `src/data/` together.

## Modules

- `cli.ts`: argument parsing and the run.
- `qlik-client.ts`, `qlik-constants.ts`: the throttled, guardrail-aware dashboard session.
- `views.ts`: the declared views and the guardrail check.
- `import-plan.ts`, `import-fetch.ts`, `run-view.ts`: which view-months to fetch, and fetching them.
- `raw-store.ts`, `atomic-write.ts`: the compact raw format, revisions and atomic writes.
- `rounds.ts`: the official 189 round pages.
- `generate*.ts`, `validate-generated.ts`: building and validating `src/data/`.

`copy-public-data.ts` runs before `dev` and `build`. It copies `src/data/occupations/` to `public/data/occupations/`, so the static site can serve one occupation file at a time.

## History

The Python script `import-report-evidence.py` imported 11 occupations into `src/data/pool.json` and `src/data/report-evidence.json`. The TypeScript importer reproduces both exactly for as-at 2026-10, so the script was removed. The two files are kept as test fixtures in `src/lib/data/__fixtures__/legacy-2026-10/`.
