# Binding constraints (verbatim from plan)

Spec: docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md (sections Placement, 1, 2, 3, 7)


- Follow `docs/ENGINEERING.md`. `npm run check` and `npm run build` must pass at the end of every task. Files in `src/lib/` use relative imports.
- **Copy rules (spec section 7, binding):**
  - `<20` is written "under 20", and in sentences "under 20, so may be zero". Never "some" or "a few".
  - Absent from a round is "Not listed", never "0" or "no cut-off".
  - INVITED snapshot counts are "at least N invited (as at {Mon YYYY})". Never summed across months.
  - CLOSED is "closed (expired, withdrawn or finalised)". In the EOIs-like-yours section, finalised additionally "includes granted visas".
  - Pools are "EOIs", never "people" or "applicants".
  - Never write "should", "apply to", "best" or "likely to be invited".
  - Every number sits beside its source or snapshot date within the same section.
- **No percentages, no forecasts and no growth figures** (the step 1 coverage finding; spec section 2.1).
- **Intervals:** an interval with `min === max` prints as one number with en-AU grouping. `{min: 0, max: 19}` prints as "under 20". Any other interval prints as "min–max" (en dash).
- Months print as "Oct 2026" and dates as "15 Oct 2026" (reuse `formatDate` from `src/lib/migration.ts` for dates).
- Client components may import only `occupation-index.json` and the new tiny `rounds-meta.json`. Everything else arrives through hooks or server props. Pass hooks stable module-level arrays.
- Every report section, including collapsed content, is visible in print. Every animation respects reduced motion. Text is at least 12px, body text at least 16px on mobile.
- **Profile EOI month:** `profile.eoiDate` (`YYYY-MM-DD`, may be empty) gives the submission month `YYYY-MM`.
- **Report points:** `calculatePoints(profile, asOf)`, which provides `base` (189), `subclass190` and `subclass491`.

