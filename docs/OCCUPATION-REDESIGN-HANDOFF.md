# Occupation redesign handoff

22 November 2026. Implemented locally on the existing `roadmap/report-redesign` branch. No commit, push, merge or deployment. Existing unrelated dirty work is preserved.

## Result

The directory and all 479 generated occupation details use the approved ink / sage / white paper / Archivo identity. The directory adds explicit Australian skilled-migration context, an accessible Mantine search, A–Z navigation, readable occupation/code hierarchy and honest unavailable / no-match states. Every published detail link remains in the initial HTML.

Details lead with the occupation, ANZSCO code, snapshot / checked dates and exact evidence summary. Chips follow the summary for mobile reading priority. The existing evidence calculations remain: visa pools, masked bars, national 189 rounds, submission cohorts, state nomination evidence, FAQ and related occupations. Cohort evidence uses progressive disclosure without removing HTML. The new occupation-specific points preview uses existing `buildTryIt` calculations, precomputed on the server at 65–140 points. The client receives only the rendered fields, not a core file or a multi-occupation dataset. The check link preserves the existing occupation-only query contract; preview points intentionally do not travel in the URL.

A narrow honesty correction changes the old “190 eligible” / “491 eligible” chips to “190: on federal list” / “491: on federal list.” Federal-list membership does not establish eligibility. The existing explicit test was changed first and failed, then passed after the copy correction. No calculations, generated data, slug helpers, metadata helpers, FAQ helpers or indexability rules changed.

## Files

- Routes and scoped detail layout: `src/app/occupations/page.tsx`, `src/app/occupations/[slug]/page.tsx`, `src/app/occupations/[slug]/page.module.css`.
- Directory, summary, pool tabs, rounds, cohorts, state table, related links and FAQ presentation: `src/components/occupation/`.
- New occupation-only components: `occupation-check-panel` (server projection), `occupation-check` (small Mantine client leaf), `occupation-section-nav`, `occupation-evidence-footer`; scoped shell and component CSS modules.
- Copy correction and existing contract test: `src/lib/occupation-page/summary.ts` and `summary.test.ts`.
- Reused existing `public/report-passport.svg` for restrained directory linework; no new shared tokens or global / brand / homepage / check changes.

## Checks

- Baseline `npm run check`: passed, 120 files / 1,287 tests.
- `npx vitest run src/lib/occupation-page/summary.test.ts`: observed expected red for the list-membership copy assertion, then green, 19 tests.
- Final `npm run check`: passed formatting, ESLint, TypeScript and all 120 files / 1,287 tests.
- Final `npm run build`: passed; 491 static pages, including 479 occupation detail routes.
- `git diff --check` for occupation-owned changes: passed.
- Logs: `output/playwright/occupation-redesign-baseline-check.log`, `occupation-redesign-final-check.log`, `occupation-redesign-final-build.log`.

## SEO and static HTML check

Captured the pre-change built HTML and compared it against the final build. All 480 occupation HTML paths (directory + details) remain identical as a set. There are zero title, description, canonical, robots or JSON-LD differences. Sitemap XML is byte-identical. The same 130 pages retain noindex directives. The directory retains all 479 server-rendered detail links; 14 no-data entries remain unlinked. All 479 detail FAQs exactly match their JSON-LD questions and answers. An exported-HTML internal-link sweep found zero missing destinations. Each representative page has one h1.

Evidence: `output/playwright/occupation-redesign-seo.json`.

## Browser check

Used the Playwright skill wrapper, named session `occupation-production`, against built `out/` at `http://127.0.0.1:3017`, with explicit navigation, no-cache request headers and QA query strings. No live forms were submitted.

The final matrix covers the directory and rich (Registered Nurses nec), not recently invited (Software Engineer), masked (Flower Grower), and absent-189/190-pool (Nurseryperson) details at **1440 / 1024 / 901 / 820 / 390 / 360 / 320px**. All 35 cases had no horizontal document overflow, one h1 and no text below 12px. Inspected desktop, 901px state-table, 390px evidence and 320px screenshots.

Verified name/code filtering; no-match feedback; the missing-data Greenkeeper entry; pointer, keyboard and real touch-context clear buttons; arrow-key visa tabs and pointer selection; points selection and updated EOI counts; keyboard FAQ disclosure; cohort disclosure and chart text alternatives; semantic state table; reduced motion; occupation-only check URL and selected occupation on the check form. Verified an absent-189 pool shows “No EOIs published for this visa.” Print media retains cohort and FAQ evidence, hides section navigation and the points preview, and prints all pool panels. No runtime console errors occurred; Chromium reported non-blocking CSS preload warnings on navigation.

Evidence: `occupation-redesign-widths.log`, `occupation-redesign-interactions.log`, `occupation-redesign-extra-qa.log`, and `occupation-redesign-print.pdf` under `output/playwright/`.

## Review

Independent specification review completed first: no material implementation gaps; independently confirmed route / metadata / JSON-LD / sitemap parity and static links. The reviewer identified a minor print selector typo, corrected before final build.

Separate independent code-quality review identified Mantine's default `rightSectionPointerEvents="none"` on the custom search clear button. Set it to `auto` with a 52px section and verified pointer / keyboard / touch clearing against the final build. Also removed unused serialized preview fields and obsolete CSS; detail route is 250 lines. Narrow cleanup re-review is clean, with no remaining material findings.

## Review URLs and screenshots

- Directory: `http://127.0.0.1:3017/occupations/`.
- Rich: `http://127.0.0.1:3017/occupations/registered-nurses-nec-254499/`.
- Not recently invited: `http://127.0.0.1:3017/occupations/software-engineer-261313/`.
- Masked: `http://127.0.0.1:3017/occupations/flower-grower-121212/`.
- Sparse / missing pools: `http://127.0.0.1:3017/occupations/nurseryperson-362411/`.

Key screenshots in `output/playwright/`:

- `occupation-redesign-directory-1440.png`, `occupation-redesign-directory-390.png`, `occupation-redesign-directory-320.png`.
- `occupation-redesign-nurse-1440.png`, `occupation-redesign-registered-nurses-nec-254499-390.png`, `occupation-redesign-registered-nurses-nec-254499-320.png`.
- `occupation-redesign-software-engineer-261313-390.png`, `occupation-redesign-flower-grower-121212-390.png`.
- `occupation-redesign-states-901.png`, `occupation-redesign-evidence-open-390.png`, `occupation-redesign-missing-pool-390.png`.
- `occupation-redesign-no-match-390.png`, `occupation-redesign-keyboard-focus-1440.png`, `occupation-redesign-check-prefill-390.png`.

## Limits

Source limitations are preserved: 14 occupations have no published data, some counts are masked and some state rules remain under review. The points preview is 189-specific; the personal check covers all three visas. No new forecasting, eligibility judgment or AI behavior was introduced. Browser coverage uses Chromium with mobile/touch emulation, not physical iOS/Android devices or a screen reader. State/supporting pages, old social OG artwork and the known report R34 wording are outside this work.

## Parent final verification

Parent inspected directory/detail screenshots and the SEO parity artifact, set the directory placeholder to full-opacity existing muted ink for AA contrast, and reran `npm run check` (120 files / 1,287 tests) and `npm run build` successfully. Logs: `occupation-redesign-parent-check.log` and `occupation-redesign-parent-build.log`. Final built placeholder appearance verified in Chromium; screenshot `occupation-redesign-directory-parent-final.png`.
