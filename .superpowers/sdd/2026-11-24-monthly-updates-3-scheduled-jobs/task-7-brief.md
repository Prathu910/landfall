### Task 7: `round-189.yml`

**Files:**

- Create: `.github/workflows/round-189.yml`, `scripts/automation/round.sh`

**Interfaces:**

- Consumes: Tasks 3–5; `updates:generate --section round`, `social:render --set round`.
- Triggers: `schedule: - cron: "0 21 * * *"`; `workflow_dispatch`. Same `concurrency`, permissions, base-branch rule (fresh branch `data/round-<date>`), failure handling (title `189 round import failed ({d Mon YYYY})`).
- Body (spec 6.10): `detect-round.ts` (exit 0 on `none`); `npm run data:import -- --rounds-only --checked-at … --report-file …`; for each date in `report.newRounds`, oldest first: `updates:generate -- --month <Sydney month of the date> --section round --round <date>` and `social:render -- --month … --set round --round <date>`; check; build; frozen check; summary `--kind round`; commit `data: 189 round of {d Mon YYYY}` and `feat(updates): {d Mon YYYY} round recap and cards`; push; PR or joined PR as in Task 6.

- [ ] **Step 1: Lint** with actionlint and `bash -n`, as in Task 6.
- [ ] **Step 2: Dry-run** `DRY_RUN=1 bash scripts/automation/round.sh`. Expected: `none` (the 15 Oct 2026 round is stored), exit 0, nothing written. Then with a scratch `rounds.json` whose newest round is 4 Jun 2026 and the fixture pages served from disk (`ROUNDS_HTML_DIR=scripts/import/__fixtures__`, honoured by `detect-round.ts` and passed as `--rounds-html` in dry runs): the 15 Oct round is detected, and its section is skipped because `main` already has `rounds[2026-10-15]` (the script says so); the frozen check passes.
- [ ] **Step 3: Commit** `ci: 189 round workflow`.

