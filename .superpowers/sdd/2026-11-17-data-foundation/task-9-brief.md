### Task 9: CLI and the first real import (as-at 2026-10)

**Files:**

- Create: `scripts/import/cli.ts`
- Modify: `package.json`. Add the scripts `"data:import": "tsx scripts/import/cli.ts"` and `"data:generate": "tsx scripts/import/cli.ts --generate-only"`.
- Generated and committed: `data/raw/2024-11/` … `data/raw/2026-10/`, `src/data/manifest.json`, `src/data/occupation-index.json`, `src/data/occupations/*.json`

**Interfaces:**

- CLI flags: `--as-at YYYY-MM` (required), `--backfill`, `--generate-only`, `--checked-at YYYY-MM-DD` (default: today).
- **Monthly mode:**
  - every view for `--as-at`;
  - plus a re-fetch of the previous month for `status-history`, `invited-by-score` and `state-invited`;
  - budget 150.
- **Backfill:** multi-month views for every month in their window that is ≤ `--as-at` and not yet in `data/raw/`. Budget 600.
- **Partition values:**
  - states: `ACT NSW NT QLD SA TAS VIC WA ANY`;
  - scores: every score present in `pool-by-score` for that as-at;
  - profile attributes: the four in `ProfileAttribute`.
- The CLI prints page reads used, revisions found, unmatched round names and validation issues. It exits non-zero on any issue, and writes `src/data` only when valid.

- [ ] **Step 1: Write the CLI** with argument parsing in an exported pure function `parseArgs(argv: string[])`. Test it in `scripts/import/cli.test.ts`:
  - a missing `--as-at` throws;
  - `--as-at 2026-13` throws.
- [ ] **Step 2: Run** `npx vitest run scripts/import/cli.test.ts`. Expect PASS after implementation.
- [ ] **Step 3: Run the real import.** `npm run data:import -- --as-at 2026-10 --backfill --checked-at <today>`.
  - Expected: exit 0, and page reads ≤600 printed.
  - If over budget or size, apply the pre-approved reductions in order and re-run. Note which ones were applied in `docs/DATA.md` (Task 12).
- [ ] **Step 4: Check sizes.** `du -sh data/raw/*`, `ls -l src/data/occupations | sort -k5 -n | tail`. Expect raw ≤10 MB per month, core ≤50 KB and detail ≤250 KB.
- [ ] **Step 5: Spot-check against the recon values** in the spec, as at 2026-10. Each cell is that occupation's `statusHistory["189"]["2026-10"]` value:
  - Software Engineer: INVITED `<20`, LODGED `119`, HOLD `343`, CLOSED `12354`.
  - Registered Nurses nec: INVITED `2730`.
- [ ] **Step 6: Run** `npm run check`, then **commit** the code and data separately:
  - `feat(import): add data import CLI`
  - `data: import SkillSelect snapshot as at 2026-10 (all occupations)`

