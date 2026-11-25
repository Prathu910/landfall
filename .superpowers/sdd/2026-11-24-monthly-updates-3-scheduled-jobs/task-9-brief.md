### Task 9: Docs, founder setup and the rehearsal

**Files:**

- Modify: `docs/OPERATIONS.md` (new "Monthly data pipeline" section: the three workflows, the one-time setup of spec 6.16, how to swap the spotlight, how to skip a month, what a failure issue means), `docs/DATA.md` and `scripts/README.md` ("After an import" now happens in the workflow; `--probe`, `--keep-rounds`, `--rounds-only`, `--report-file`, `roundsCheckedAt`), `docs/HANDOFF.md`, `docs/STRATEGY.md` (decision log, if the founder decides anything new), `CLAUDE.md` (`.github/workflows/` and `scripts/automation/` lines)

- [ ] **Step 1: Write the docs** and run `npm run check` and `npm run build`; commit `docs: monthly data pipeline operations`.
- [ ] **Step 2: Hand off for merge.** The workflows only run from `main`. Ask the founder to do the one-time setup (Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"; notifications; labels `data-update` and `source-watch`; confirm Cloudflare previews and, if on, set the `CF_PAGES_PROJECT` variable) and to merge.
- [ ] **Step 3: Rehearse** (after merge): `gh workflow run monthly-data.yml -f month=2026-10`. Expected PR: `src/data/manifest.json` changes only in `checkedAt` (and `data/raw/` only if Home Affairs revised 2026-10, listed under "Needs your decision"); `src/data/updates/2026-10.json` unchanged; `public/social/2026-10/` month set added if it wasn't committed in Plan 2; the summary renders in GitHub with the images. Then `gh workflow run round-189.yml` (expected: no new round, exit 0) and `gh workflow run page-watch.yml` twice (first: "baseline stored", no issues; second: no issues). Record durations and page reads in the ledger.
- [ ] **Step 4:** Leave the rehearsal PR for the founder to merge or close. Target: done before November's data appears (about mid-December 2026).
