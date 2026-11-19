### Task 3: Logo, header, footer and the MigrateLens name

**Files:**

- Create: `src/components/brand/logo.tsx` (and `logo.module.css`), `src/components/brand/logo.test.tsx` (if `@testing-library/react` is absent, test the exported SVG geometry constants instead), `src/app/no-old-name.test.ts`
- Modify: `src/app/icon.svg`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/app/layout.tsx` (metadata), `src/app/not-found.tsx`, `src/app/methodology/page.tsx`, `src/components/report.tsx` (the disclaimer line), the comments in `src/data/state-rules/2026-27/{sourced,sa,nsw,qld,wa}.ts`

**Interfaces:**

- Produces:
  - `LogoMark({ size?: number, reversed?: boolean, title?: string })`: an SVG, `aria-hidden` unless `title` is set.
  - `Logo({ reversed?: boolean })`: the lockup, the mark plus a "MigrateLens" wordmark.
  - `MARK_BARS` (the geometry constants above).
  - Header nav: "Sample report" `/sample/`, "States" `/states/`, "Method" `/methodology/`, plus a primary button "Check my points" `/check/`.
  - Footer disclaimer, verbatim: "MigrateLens gives general information from published data. We are not registered migration agents and don't give migration advice."

- [ ] **Step 1: Write the failing tests.**
  - `no-old-name.test.ts`: no file under `src/` contains `Landfall` or `landfall` (case-insensitive), excluding `*.json` data files and test files.
  - The logo test asserts the three bars' x/height/fill values and the ring's r and stroke.
- [ ] **Step 2: Run** them. **Expected:** FAIL.
- [ ] **Step 3: Build the logo and rename everything.**
  - Implement `logo.tsx`.
  - Replace `icon.svg` with the favicon variant.
  - Set the metadata title default to `"MigrateLens: your points and where they'd put you"`, the template to `"%s · MigrateLens"`, and a matching description. Use "points-test basics", not "eligibility".
  - Update the header (keep the mobile drawer and `aria-current`), the footer (disclaimer, links, the "as at" month from the manifest), the 404, methodology and the report disclaimer.
  - Rename the product in comments.
- [ ] **Step 4: Run** `npm run check` and `npm run build`. **Expected:** pass, with no "Landfall" in `out/**/*.html` (`grep -ril landfall out` is empty).
- [ ] **Step 5: Commit** `feat(brand): MigrateLens logo, header, footer and name`.

