# Binding constraints (verbatim from plan)

Spec: docs/superpowers/specs/2026-11-17-data-foundation-design.md


- Follow `docs/ENGINEERING.md`. `npm run check` and `npm run build` must pass at the end of every task.
- Read only the dashboard's displayed `qText`. Never request unmasked counts or custom expressions. Never set any variable except `vShow*` toggles.
- **Guardrail:** each query uses ≤2 shown detail columns and ≤2 filtered detail fields. Detail fields are Occupation Group, Occupation, Score/points, Month Submitted, the profile fields, and Nominated State. `Visa Type`, `EOI Status` and `As At Month` are free. Exactly one `As At Month` is selected per query.
- Never narrow a `<20` cell by differencing. `<20` = interval `{min: 0, max: 19}`.
- Never sum INVITED counts across as-at snapshots. INVITED is a short-lived stock, so per-month figures are "at least N invited" lower bounds.
- Never sum across visas, or across states including `ANY`. Report `ANY` separately. Exclude `N/A` and `AUSTRADE` from state views.
- `CLOSED` is described only as "closed (expired, withdrawn or finalised)".
- **Budget:** a page read (`GetHyperCubeData`) is the unit. At most 600 per backfill and 150 per monthly import. Pause ≥250 ms between websocket calls. Page height = `floor(10000 / width)`.
- **Pre-approved reductions, in order:**
  1. Cohorts limited to the last 36 submitted months plus an `"older"` bucket.
  2. Drop months with no INVITED rows from multi-month invited views.
  3. `invited-profile` limited to the latest 6 months.
- **Size limits:** core file ≤50 KB, detail file ≤250 KB, raw ≤10 MB per as-at month.
- The first dataset is pinned to as-at `2026-10` (snapshot id `skillselect-2026-10-31`).
- Visas are `"189"` = `189PTS Points-Tested Stream`, `"190"` = `190SAS Skilled Australian Sponsored`, `"491"` = `491SNR State or Territory Nominated - Regional`. Family-sponsored 491 is excluded.
- **Dashboard identifiers:**
  - page `https://api.dynamic.reports.employment.gov.au/anonap/extensions/hSKLS02_SkillSelect_EOI_Data/hSKLS02_SkillSelect_EOI_Data.html`
  - websocket `wss://api.dynamic.reports.employment.gov.au/anonap/app/aaac76b5-ad30-477e-9ca0-472f8ab57fc8`
  - origin `https://api.dynamic.reports.employment.gov.au`
  - bookmark `44604edb-b94c-414b-b978-30bb79019ffd`
  - table object `eymDb`
- `docs/original-references/` stays unchanged. No network calls in tests.

