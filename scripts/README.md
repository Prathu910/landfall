# Data scripts

All SkillSelect data is produced by the TypeScript importer in `scripts/import/`. It is the only writer of `data/raw/` and `src/data/` (apart from the hand-sourced `src/data/states.ts`). The data dictionary, status meanings, known limits and the full import procedure are in [`docs/DATA.md`](../docs/DATA.md).

## Commands

```sh
npm run data:import -- --as-at YYYY-MM              # monthly import: every view at that month, plus a revision check of the previous month
npm run data:import -- --as-at YYYY-MM --backfill   # fetch every unstored month in each view's window (resumable)
npm run data:generate -- --as-at YYYY-MM            # rebuild src/data from stored raw files; no network
```

Add `--checked-at YYYY-MM-DD` to set the source check date (default: today). The first dataset was `--as-at 2026-10`; new months arrive through the monthly pull request (`docs/superpowers/specs/2026-11-24-monthly-updates-design.md`).

The importer:

- reads the public SkillSelect dashboard's displayed text only, inside the publisher's guardrail (at most 2 shown and 2 filtered detail fields, one As At Month per query);
- keeps `<20` as text, which the app treats as the interval 0–19, and never narrows it;
- throttles calls (at least 250 ms apart) and stops at its page-read budget: 250 for a monthly import, 600 for a backfill;
- stores each finished view-month in `data/raw/<asAt>/` atomically, and writes a `.rev-<date>` file instead of overwriting a month the government revised;
- writes `src/data/` only after every validation check passes, and exits 1 on any issue.

After an import, run `npm run check` and `npm run build`, then commit `data/raw/` and `src/data/` together.

## Monthly recap facts

`npm run updates:generate -- --month YYYY-MM --section round --round YYYY-MM-DD` and `-- --month YYYY-MM --section data [--spotlight <code>] [--previous-manifest <file>]` write `src/data/updates/<month>.json` (`scripts/updates/generate.ts`), the only writer of that folder. Each file is one month's frozen facts for `/updates/<month>/` and the `/updates/` index; a round-only file (`data: null`) is a full page and is in the sitemap. Each run replaces only its own section, keeps `firstGeneratedAt` and sets `updatedAt`; `--today YYYY-MM-DD` overrides the Sydney date. It exits 1 if the round is not in `rounds.json` or not in `--month`, if `--section data` is asked for a month other than `manifest.asAt`, or if the merged file fails `isRecapFacts`. `--previous-manifest` must be the previous month's manifest (for the occupations added and removed); a rerun of the same month (such as `--spotlight` swapping the pick) without it keeps the lists the first run recorded and never treats this month's own manifest as the previous one. `src/lib/updates/load-server.ts` reads the files (`listRecapMonths`, `loadRecap`).

## Instagram cards

```sh
npm run social:render -- --month YYYY-MM --set round [--round YYYY-MM-DD]   # 9 PNGs in public/social/<month>/round-<date>/
npm run social:render -- --month YYYY-MM --set month                       # 12 PNGs in public/social/<month>/month/, plus public/social/<month>/og.png
npm run social:render -- --month YYYY-MM --set month --html-only <dir>     # each card's HTML, no Chrome
```

`scripts/social/render.ts` renders one set of the month's Instagram cards from `src/data/updates/<month>.json`: each feed card in light and dark (1080×1350), the story cover in both (1080×1920) and the OG image in light (1200×630). The round set is the round cover, card 2 and the closing card; `--round` defaults to the month's newest round. The month set is the cover, the two state cards, the spotlight and the closing card. It reuses the newest round set's card 2 (`round-light.png`, `round-dark.png`) and never re-renders it, so it exits 1 until that round set exists. `--set month` also exits 1 for a month whose facts file has no data section. `jobs.ts` lists the images and their paths.

Each card opens in headless Chrome through puppeteer-core (`CHROME_PATH`, default the macOS Google Chrome). `browser-checks.ts` runs in the page before the screenshot, and any failure renders nothing, names the image and exits 1. It checks that both faces loaded, that no `.fit` or `.inner` box overflows, that story content stays within y 250 to 1580, that feed cover text stays within x 34 to 1046 (the profile-grid crop), and that `--paper` is the theme's token. `--html-only` writes the same cards as HTML files for a browser preview. The templates are in `scripts/social/templates/`. `render.test.ts` and `spotlight-render.test.ts` run in Chrome and are skipped when no Chrome binary exists.

## Frozen sample

`npm run sample:freeze` (`scripts/sample/freeze.ts`) writes the 2026-10 core and detail records of the `/sample/` occupations (`SAMPLE_CODES` in `src/lib/outlook/examples.ts`) and a `meta.json` to `src/data/sample/2026-10/`, regenerated in memory from `data/raw/` and the stored rounds up to 31 October 2026. `/sample/` reads only these, so a monthly import never moves its stamps. Run it only when the founder asks for the sample to be refreshed.

## State nomination lists and rule staleness

`npm run data:state-lists` (optionally `-- --only federal|wa|sa|qld|nsw --checked-at YYYY-MM-DD`) re-imports the state occupation lists and the federal occupation list into `src/data/state-rules/` (`scripts/state-lists/`). `scripts/check-rule-staleness.ts` runs before every build and prints a warning, never a failure, for state rules checked more than 45 days ago. Sources and the monthly re-verify routine are under "State rules" in [`docs/DATA.md`](../docs/DATA.md).

## Modules

- `cli.ts`: argument parsing and the run.
- `qlik-client.ts`, `qlik-constants.ts`: the throttled, guardrail-aware dashboard session.
- `views.ts`: the declared views and the guardrail check.
- `import-plan.ts`, `import-fetch.ts`, `run-view.ts`: which view-months to fetch, and fetching them.
- `raw-store.ts`, `atomic-write.ts`: the compact raw format, revisions and atomic writes.
- `rounds.ts`, `round-tables.ts`, `html-tables.ts`: the official 189 round pages (occupation tables; totals, tie-break dates and the state nominations table; table and date reading).
- `round-store.ts`: saving the current round page to `data/raw/rounds/<date>.html` and keeping stored rounds when the pages are re-read.
- `generate*.ts`, `validate-generated.ts`: building and validating `src/data/`.

`copy-public-data.ts` runs before `dev` and `build`. It copies `src/data/occupations/` to `public/data/occupations/`, so the static site can serve one occupation file at a time.

## History

The Python script `import-report-evidence.py` imported 11 occupations into `src/data/pool.json` and `src/data/report-evidence.json`. The TypeScript importer reproduces both exactly for as-at 2026-10, so the script was removed. The two files are kept as test fixtures in `src/lib/data/__fixtures__/legacy-2026-10/`.

## Lighthouse

`npm run lighthouse` (after `npm run build`) audits every SEO page type in `out/` on mobile and desktop, three runs each, plus accessibility in dark, and exits 1 if any gated median is under 100 (`scripts/lighthouse/`). It serves `out/` itself on 127.0.0.1:3020 with brotli or gzip and the `public/_headers` caching, like Cloudflare Pages. Flags: `--only <path or text>`, `--form mobile|desktop`, `--runs N`, `--no-dark`, `--cpu-slowdown N` (10 approximates PageSpeed Insights), `--base-url <url>` (audit a running site instead), `--json <file>` and `--save-dir <dir>` (every report as JSON). The page list and the rules are in `docs/ENGINEERING.md` ("Performance budget").
