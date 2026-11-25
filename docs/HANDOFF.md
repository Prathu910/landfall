# Resume here

## Founder: set up the scheduled jobs (25 November 2026)

The three workflows (`monthly-data`, `round-189`, `page-watch`) are on branch `roadmap/monthly-updates` and run only after the merge to `main`. Details are in `docs/OPERATIONS.md`, "Monthly data pipeline".

- [ ] GitHub, Settings, Actions, General: tick "Allow GitHub Actions to create and approve pull requests".
- [ ] Optional: set the repository variable `CF_PAGES_PROJECT` (Cloudflare Pages project name) so pull requests link a preview.
- [ ] Merge to `main`.
- [ ] Rehearse with "Run workflow": `monthly-data` with month `2026-10` (a no-op check), `round-189`, and `page-watch` twice. Read each run's summary and note durations in the Plan 3 ledger.
- [ ] Watch the first scheduled runs. The Chrome sandbox step on `ubuntu-latest` (currently Ubuntu 24.04) is first exercised when the first new month renders (about mid-December 2026).
- Closing a month's pull request holds that month (delete `data/skillselect-YYYY-MM` to import it again); closing a round pull request does not hold it.

## Monthly updates, Plan 2: Instagram images (25 November 2026)

The 2026-10 Instagram sets are rendered locally and committed (founder go-ahead, 24 Nov 2026; later months are rendered in CI only). Branch `roadmap/monthly-updates`, not pushed.

- **Where.** Everything is under `public/social/2026-10/`. The month set is the 6-card carousel (counter 1/6 to 6/6), in this order, using the `-light` or the `-dark` files (one theme for all six):
  1. `month/cover-<theme>.png`
  2. `round-2026-10-15/round-<theme>.png` (the round card; the month set reuses it and never re-renders it)
  3. `month/state-190-<theme>.png`
  4. `month/state-491-<theme>.png`
  5. `month/spotlight-<theme>.png`
  6. `month/closing-<theme>.png`

  The story is `month/story-cover-<theme>.png` (1080×1920). `og.png` is the recap's OG image. The round set (`round-2026-10-15/`) is a separate 3-card carousel for the 15 Oct 189 round alone: `cover-<theme>.png`, `round-<theme>.png`, `closing-<theme>.png` (counter 1/3 to 3/3), plus its own `story-cover-<theme>.png` and `og.png`.

- **How to post.** Instagram is posted by hand; nothing posts automatically. The month carousel's caption and every card's alt text are in `month/set.json`: the `caption` field, and for each card the `alt` of its `images` entry. Card 2's alt text ("Card 2 of 6. ...") is in that file too, in the two entries with `"card": "round"`, which name the round-set files. The round set's `round-2026-10-15/set.json` has the round-only carousel's caption and alt text (its card 2 has no "Card N of M" prefix).
- **Re-render.** `rm -rf public/social/2026-10`, then `npm run social:render -- --month 2026-10 --set round` and `-- --month 2026-10 --set month` (needs Chrome; `scripts/README.md`). The recap page uses `/social/<month>/og.png` when it exists, else the newest round's `og.png`, else `/og.png` (`ogImageFor`).

## Monthly updates, Plan 1: recap pages (25 November 2026)

Branch `roadmap/monthly-updates` (not merged, not pushed, not deployed). Spec `docs/superpowers/specs/2026-11-24-monthly-updates-design.md`; plan `docs/superpowers/plans/2026-11-24-monthly-updates-1-recap-pages.md`; ledger `.superpowers/sdd/2026-11-24-monthly-updates-1-recap-pages/progress.md` (rulings, outcomes, deferred minors). Plans 2 (Instagram images) and 3 (scheduled jobs) run next on the same branch.

- **Unpinned from 2026-10, safely.** `/sample/` is frozen on 2026-10 (`src/data/sample/2026-10/`, `npm run sample:freeze`); live-data tests are sorted from frozen ones (`src/lib/data/__fixtures__/frozen-2026-10.ts`); a dropped occupation keeps its page with `lastAsAt` (`docs/DATA.md`); `rounds.json` is v2 (totals, tie-break dates, the state nominations table) and stored rounds are never re-derived; round pages are kept in `data/raw/rounds/`.
- **Recap facts.** `npm run updates:generate` writes `src/data/updates/<YYYY-MM>.json` (a round section per 189 round, one data section per month, each frozen once merged; `scripts/README.md`). `2026-10.json` holds the 15 Oct 2026 round and the October data.
- **Pages.** `/updates/2026-10/` (the recap) and `/updates/` (the index: dated answer, the latest month's stamp, headline and three figures, every month newest first, the points-check card). Both are in the sitemap, dated by `updatedAt`, round-only months included; the footer links "Monthly updates"; the header is unchanged. Lighthouse audits `/updates/` and the newest recap (`scripts/lighthouse/pages.ts`).
- **Lighthouse** (`npm run lighthouse -- --only updates`, and `--only /` as a regression check): every gated score is 100 on mobile and desktop for `/updates/` (mobile LCP 0.9 s, TBT 4 ms), `/updates/2026-10/` (mobile LCP 1.1 s, TBT 7 ms) and `/`, dark accessibility 100, CPU benchmark ~4,200 (25 Nov 2026). A first run during Spotlight indexing (CPU ~860) read 95 and 84 on mobile; re-runs at normal CPU are 100. Best Practices on the recap is 100 now that its breadcrumb's `/updates/` exists.
- **Founder review list** (from Task 11): the wording "Highest published minimum", "none published", "none recorded"; the not-listed FAQ uses Chef (the largest pool) rather than the mockup's Software Engineer.

## Lighthouse 100s (24 November 2026)

Branch `roadmap/perf-100` (from `main` 9853460; not merged, not pushed, not deployed). Founder goal in `docs/STRATEGY.md`: 100 in Performance, Accessibility, Best Practices and SEO, mobile and desktop, for every SEO page type. Rules and budget: `docs/ENGINEERING.md`, "Performance budget".

- **`npm run lighthouse`** (`scripts/lighthouse/`, Lighthouse 13.6.0 pinned): serves `out/` like Cloudflare Pages on 127.0.0.1:3020 (brotli/gzip, `_headers`, 404.html), three runs per page on mobile and desktop plus dark accessibility, medians in a table, exit 1 below 100. The CPU column is Lighthouse's benchmark index; Spotlight indexing once dropped it from ~4,200 to ~860 and tripled blocking time, so re-run rows whose CPU is far below the rest. `--cpu-slowdown 10` approximates PageSpeed Insights' CPU.
- **Fixes.** Homepage LCP was the decorative guilloche `<img>` (4.0 s): every guilloche (homepage panels, report hero, `/check/` preview, `/occupations/` heading) is now CSS masks, one per line colour (`components/guilloche/`, SVGs split in `public/`), same pixels by day (mean brightness within 0.1), same UV gradient at night, and it prints in both themes. Mantine's CSS is cut to the components used (`components/mantine-styles.ts`, tested): 49–60 → 28–40 KB gzipped CSS per page. Select dropdowns mount on open (Floating UI positioned six hidden dropdowns per guide page on load, the "forced reflow"). Metric-matched Arial fallbacks for Archivo and Inter (the `/sample/` 0.038 layout shift is gone). Next's legacy polyfills replaced (only `URL.canParse` kept; browserslist pinned to Next's floor). Stamp fitting reads before it writes; the count formatter is built on first use. Accessibility: plain links in running text are underlined sitewide (guide, methodology, feedback and homepage links gain an underline); map states are named "Western Australia (WA)". `public/_headers` caches hashed assets for a year.
- **Results** (`npm run lighthouse` on the built `out/`, median of 3 runs, Lighthouse 13.6.0, CPU benchmark ~4,250): every gated score is 100 (the 404's SEO is not gated: it is `noindex` by design; before = `main` 9853460, where Aquaculture Farmer stood in for an off-list page but is `noindex`, so Cook 351411 replaced it).

| Page                                                    | Form    | Before (Perf/A11y/BP/SEO, LCP, TBT) | After                     | Dark A11y |
| ------------------------------------------------------- | ------- | ----------------------------------- | ------------------------- | --------- |
| /                                                       | mobile  | 87/97/100/100 4.0s 11ms             | 100/100/100/100 1.1s 4ms  | 97→100    |
| /                                                       | desktop | 100/97/100/100 0.7s 0ms             | 100/100/100/100 0.3s 0ms  | 97→100    |
| /guide/                                                 | mobile  | 100/100/100/100 1.4s 23ms           | 100/100/100/100 1.1s 25ms | 100→100   |
| /guide/                                                 | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /guide/189/                                             | mobile  | 100/100/100/100 1.4s 33ms           | 100/100/100/100 1.1s 33ms | 100→100   |
| /guide/189/                                             | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /guide/190/                                             | mobile  | 100/100/100/100 1.4s 56ms           | 100/100/100/100 1.1s 36ms | 100→100   |
| /guide/190/                                             | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /guide/491/                                             | mobile  | 100/100/100/100 1.4s 37ms           | 100/100/100/100 1.1s 39ms | 100→100   |
| /guide/491/                                             | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /occupations/                                           | mobile  | 100/100/100/100 1.2s 4ms            | 100/100/100/100 1.1s 3ms  | 100→100   |
| /occupations/                                           | desktop | 100/100/100/100 0.8s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /occupations/registered-nurses-nec-254499/              | mobile  | 100/100/100/100 1.4s 10ms           | 100/100/100/100 1.1s 10ms | 100→100   |
| /occupations/registered-nurses-nec-254499/              | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /occupations/software-engineer-261313/                  | mobile  | 100/100/100/100 1.4s 4ms            | 100/100/100/100 1.1s 10ms | 100→100   |
| /occupations/software-engineer-261313/                  | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /occupations/cook-351411/                               | mobile  | 100/100/100/100 1.2s 6ms            | 100/100/100/100 0.9s 4ms  | 100→100   |
| /occupations/cook-351411/                               | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.2s 0ms  | 100→100   |
| /occupations/intensive-care-ambulance-paramedic-411112/ | mobile  | 100/100/100/100 1.2s 11ms           | 100/100/100/100 0.9s 9ms  | 100→100   |
| /occupations/intensive-care-ambulance-paramedic-411112/ | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.2s 0ms  | 100→100   |
| /states/                                                | mobile  | 100/100/100/100 1.4s 4ms            | 100/100/100/100 1.1s 3ms  | 100→100   |
| /states/                                                | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.3s 0ms  | 100→100   |
| /methodology/                                           | mobile  | 100/100/100/100 1.1s 10ms           | 100/100/100/100 0.9s 10ms | 100→100   |
| /methodology/                                           | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.2s 0ms  | 100→100   |
| /sample/                                                | mobile  | 84/100/100/100 4.4s 18ms            | 100/100/100/100 1.4s 12ms | 100→100   |
| /sample/                                                | desktop | 99/100/100/100 1.0s 0ms             | 100/100/100/100 0.3s 0ms  | 100→100   |
| /check/                                                 | mobile  | 100/100/100/100 1.4s 8ms            | 100/100/100/100 1.1s 12ms | 100→100   |
| /check/                                                 | desktop | 99/100/100/100 0.8s 0ms             | 100/100/100/100 0.2s 0ms  | 100→100   |
| /feedback/                                              | mobile  | 100/100/100/100 1.2s 8ms            | 100/100/100/100 0.9s 8ms  | 100→100   |
| /feedback/                                              | desktop | 100/100/100/100 0.3s 0ms            | 100/100/100/100 0.2s 0ms  | 100→100   |
| 404                                                     | mobile  | 100/100/100/63 1.2s 8ms             | 100/100/100/63 0.9s 3ms   | 100→100   |
| 404                                                     | desktop | 100/100/100/63 0.3s 0ms             | 100/100/100/63 0.2s 0ms   | 100→100   |

- **Checked:** screenshots of 12 pages at 390 and 1280 in light and dark against `main` (only the guilloche antialiasing and the new underlines differ); `/sample/` tabs print 4, 5, 5, 5 A4 pages with Light and Dark saved, identical to `main`, guilloche included; homepage, `/occupations/` and `/check/` print identically; no-flash matrix (saved none/light/dark/system × device light/dark, scripts blocked) correct; every select opens and picks by keyboard with no console errors.
- **Cloudflare Web Analytics** (founder action): the injected beacon's site token is rejected by the collector (404, so CORS errors in the console and Best Practices 96 on PageSpeed). Steps in `docs/OPERATIONS.md`.

Follow-ups (not done): at a PageSpeed-like CPU (`--cpu-slowdown 10`, one run, `main` → this branch) Performance is `/` 87 → 100, `/sample/` 80 → 97, `/check/` 97 → 99 and `/guide/` 98 → 98; the rest is blocking time (105–190 ms), mostly Next/React hydration of large RSC payloads (`/sample/` 310 KB, `/guide/` 106 KB) and Mantine `SegmentedControl` measuring its indicator on mount; trimming client components or the four server-rendered `/sample/` reports is the next lever. Archivo's variable latin file is 90 KB.

## Dark mode, "passport at night" (23 November 2026)

Branch `roadmap/dark-mode` (from `roadmap/pr-guide` 5e7223f; not merged, not pushed, not deployed). Founder decision in `docs/STRATEGY.md`; the approved preview, tokens and rationale are in `.superpowers/brainstorm/dark-mode-2026-11-23/`.

- **Behaviour.** Follows the device by default; Light / Dark / System in a header menu (desktop) and a three-part switch in the phone menu, stored in `localStorage` (`migratelens-theme`, Mantine's manager, which tolerates blocked storage). An inline head script (`themeScript`, `src/lib/brand/theme-script.ts`; it does what Mantine's `ColorSchemeScript` did) sets the scheme before first paint, so the static export never flashes; without JavaScript the CSS still follows the device. `SITE_VIEWPORT` is `light dark` with a `theme-color` per scheme, rewritten by the always-mounted `ThemeSync` (`components/theme/theme-sync.tsx`) when the reader's choice differs from the device, on every load and client navigation. A switch eases colours for 200ms and wakes the guilloche 80ms later; nothing animates under reduced motion.
- **How it is built.** Every colour token is `light-dark(light, dark)` (values from the preview's `tokens.md`), mirrored in `palette.ts` (light) and `palette-dark.ts` (dark), with contrast pairs in `text-pairs.ts` tested in both themes; CSS modules and TSX SVG paint carry no colour literals (`src/app/colour-literals.test.ts`). Always-dark panels (site footer, guide and occupation calls to action, report footer) keep the light design inside and deepen to `--brand-deep` at night. Guilloche artwork is the original image by day and the same SVG as a recoloured mask at night. Mantine surfaces map to our tokens at night (`providers.tsx`).
- **Light changes on purpose:** the homepage map compass and state code now use a 4.5:1 sage (`--homepage-map-label`; the two low-contrast tokens are gone), and inputs, checkboxes and radios have a 3:1 border (`--input-border`). Otherwise light is pixel-identical to `pr-guide` except the new header button.
- **Deleted:** the unused Stageshow hero demo and vendored kit, doors, three questions, the FAQ list and their copy modules and tests.
- **Print stays light.** `@media print` forces `color-scheme: light`, every dark switch is screen-only, and `ThemeSync` sets the root to light on `beforeprint` (and the print media query) so Mantine's dark rules don't print, restoring it after; with Dark saved, the four `/sample/` PDFs are pixel-identical to `pr-guide` (4, 5, 5 and 5 A4 pages).
- **Review fixes (23 Nov).**
  - **JS weight.** Importing `ColorSchemeScript` from the `@mantine/core` barrel in the Server Component layout put a 160 KB Mantine chunk on every route; the inline `themeScript` replaces it. The appearance menu is hand-built (button and panel, focus on the current choice, Tab trapped, Escape or a click outside closes) instead of Mantine's Popover (about 5 KB), and the text pairs moved out of the palette module so the layout chunk no longer ships them. Gzipped JS referenced by each page, `pr-guide` → before → after: `/` 278.6 → 459.0 → 280.3 KB, `/methodology/` 223.2 → 420.0 → 225.1, `/check/` 434.6 → 592.5 → 436.2, `/sample/` 415.2 → 580.3 → 416.9, `/guide/` 256.5 → 436.7 → 258.3, `/states/` 218.6 → 419.3 → 220.5, an occupation page 244.3 → 427.8 → 246.2 (`gzip -9` of every script the HTML references; all within 2 KB of `pr-guide`).
  - **theme-color** followed a saved choice only while the menu was open; `ThemeSync` now applies `themeColorFor` on load and after client navigation (light device + Dark saved gives a dark bar on reload, and the reverse).
  - **Print with Dark saved** is now fully light: the cost estimator's checkboxes no longer print dark, and the homepage guilloche prints (its day image was lazy and hidden at night, so never fetched; it now loads eagerly). Day images are fetched with CORS like the night mask, so each artwork downloads once (`/sample/` fetched `report-passport.svg` twice at night). PDFs with Dark saved are pixel-identical to Light saved; `/sample/` tabs 4, 5, 5 and 5 pages.
  - **Browsers without `light-dark()`** (before Safari 17.5, Chrome 123, Firefox 120) get the full light design and no appearance control: an `@supports not` block at the end of `globals.css` restates every colour token's light value (derived by `lightFallback`, checked by `palette.test.ts`), the head script and Mantine stay light, and the dark switches need `light-dark()`. Policy in `docs/ENGINEERING.md`.
  - **Tidy:** `--homepage-color-<hex>` tokens renamed by role (`--homepage-map-shade-1..3`, `--homepage-control-edge` and so on); the dark-mode design source is committed (screenshots as downscaled JPEGs, fonts from `node_modules`).
- **Merged `roadmap/pr-guide`'s review fixes** (60ccd18…43e4524) on 23 Nov 2026 with a merge commit; only `CLAUDE.md` conflicted (kept dark mode's Brand and Homepage text and pr-guide's indexing, sitemap and PR guide text). The new UI already reads tokens: the cost estimator's native selects use the shared input classes and follow `color-scheme` (dark field, option list and focus ring at night), the lazy placeholders use `--muted`, and the one-line sticky bar is the inverted ivory pill like other dark buttons. Checked on the built `out/` at 360 and 1280 in both themes.

## Interactive PR guide (23 November 2026)

Branch `roadmap/pr-guide` (from `main` 4068056; not merged, not pushed, not deployed). Founder decision in `docs/STRATEGY.md` (23 Nov 2026).

- **Routes.** `/guide/` (hub) and `/guide/189/`, `/guide/190/`, `/guide/491/`, all static HTML with a unique title, description and canonical, a dated direct answer, "Last checked" and "Fees as at" dates, FAQ, sources and JSON-LD (Article, FAQPage, BreadcrumbList; HowTo on the hub). All four are in the sitemap; nothing else in the SEO output changed (489 existing HTML pages compared against a `main` build: titles, descriptions, canonicals, robots, JSON-LD and h1 counts identical; `robots.txt` identical; the sitemap gains only the four guide URLs).
- **Interactive leaves** (client, sharing one in-memory occupation and situation in `components/guide/guide-store.ts`; only `?occupation=` is read): the path picker (Home Affairs list flags for 189/190/491, and for each state whether its imported 190/491 list names the occupation for the reader's situation, with VIC, ACT, TAS and NT "Rules being checked"), the quick points and basics check (`calculatePoints`; age, English, skills assessment, occupation list, 65 points, with nomination points for 190/491) with the "65 is the pass mark, not a promise" block linking `/check/?occupation=` and `/sample/`, and the cost estimator (visa charges, skills assessment by body, English tests, NAATI, state nomination, AFP check; health, overseas police and translations listed as "Varies"; totals per currency, no exchange rate). Phones get a sticky running tally in the calculator and the estimator.
- **Data.** `src/data/guide/` (research `docs/research/pr-guide-2026-11.md`), checked 23 Nov 2026. Read on the official page: visa charges (pricing table, 1 Jul 2026), every Home Affairs rule used, the points tables, ACS (with its 5 Jan 2027 rise), Engineers Australia, ANMAC, VETASSESS, CPA Australia, IPA, AITSL, IELTS in India (INR 19,000; IDP says it changes 1 Jan 2027), the AFP check, and QLD, SA and WA nomination fees. **Check current fee** (page unreadable, no figure shown): PTE Academic, IELTS in Australia, NAATI CCL (maintenance mode), CA ANZ, TRA, the Indian police clearance, and NSW, VIC, ACT, TAS and NT nomination. Processing times link the official guide tool; no durations are given except the published 60 days to lodge and the 2-year EOI window.
- **Staleness.** `npm run build` warns (never fails) when a guide fee or rule is more than 12 months old, and once the build date reaches the 1 July after `FEES.feesAsAt` (`src/lib/guide/staleness.ts`, run from `scripts/check-rule-staleness.ts`). Visa charges change every 1 July: re-read the sources then.
- **Links in.** "Guide" in the header and the footer, one homepage strip after the report example, a "How to apply" strip under each occupation page's verdict (guides for the visas the Home Affairs list has), and a line on `/check/` and `/sample/`.
- **Verified** on the built `out/` at 360, 390, 820 and 1280 with reduced motion: no sideways scroll, no text under 12px, no console errors, one h1 per guide page; keyboard reaches and operates every select, segmented control, checkbox and disclosure; prefill from `?occupation=` works. Gzipped JS at that point: `/guide/` 285 KB, a visa guide 283 KB (`/states/` 217, `/check/` 432); see the review fixes for the current figures.

- **Review fixes (23 Nov).**
  - **191 pathway** stated in full wherever the guide says how a 491 holder reaches PR (491 page rules, its FAQ, the hub FAQ and the 491 direct answer; one clause, `PATHWAY_191` in `src/lib/guide/faq.ts`): held the 491 (or another eligible visa) at least 3 years, ATO notices of assessment for 3 of the 5 income years (no minimum income, as the official page says), and the visa's conditions met, including regional living, work and study. Re-read on the Home Affairs 191 page on 23 Nov 2026.
  - **Visa charges** warn at build once the build date reaches the 1 July after `FEES.feesAsAt` (`nextChargeChange`, `chargesOutdated`, tested with explicit dates).
  - **Sticky points bar** no longer hides a focused field on phones (WCAG 2.4.11): while the quick check or estimator is on the page the root gets `scroll-padding-bottom` (a field's `scroll-margin` alone didn't make Chrome scroll a partly visible field), and the bar is one line ("189: 80 · 190: 85 · 491: 95") down to 320px. Checked by tabbing through every control at 320, 360 and 768px.
  - **Fees:** ACS no longer says "Excludes GST" (its page doesn't say); the AFP line asks how many applicants aged 16 or over have 12 months or more in Australia (one check each, capped at the applicants); the estimator's pickers are native selects; `fees.ts` is split into `visa-charges.ts`, `third-party-fees.ts` and `fee-amounts.ts` (same `FEES`).
  - **Accessibility:** only the cost totals are `aria-live`; the hub's per-visa table reads each cell's detail ("62 points: 3 short.") as visually hidden text and its corner cell is a `th`.
  - **Copy:** "Receive an invitation" says a 190 or 491 invitation follows a state's nomination (and a relative-sponsored 491 EOI can be invited in a round).
  - **Sitemap:** the four guide URLs' `lastmod` is `GUIDE_CHECKED_AT`; still exactly 4 URLs more than `main` (359). Other pages' metadata and JSON-LD match the build before these fixes (only `/guide/` and `/guide/491/` changed, for the copy above).
  - **Performance:** the quick check reads the federal list alone (`components/data/federal-list.ts`); the hub's path picker fetches the state rules and lists as their own chunk once an occupation is chosen ("Loading published data…" meanwhile); the calculator and estimator load client-only through `next/dynamic` (`components/guide/lazy-tools.tsx`) behind placeholders sized to their first render (`lazy-tools.module.css`, within about 60px from 320 to 1600px). First-load JS, gzipped without polyfills: `/guide/` 247.8 → 217.1 KB, each visa guide 245.1 → 181.4 KB (`/methodology/` is 184). The webpack runtime on every page grows 0.8 KB for the async chunk map.

Follow-ups (not done): fetch the "Check current fee" items in a normal browser and fill them in; consider importing each occupation's assessing authority from the Home Affairs list so the cost estimator can preselect it; the guide's VIC/ACT/TAS/NT lines stay "Rules being checked" until those rules are verified.

## Polish and occupation verdict strip (23 November 2026)

Branch `roadmap/polish-and-occupation-verdict` (from `main` 257b44e; not merged, not pushed, not deployed).

- **R34 fixed.** The "opens 189" best line now says reaching 65 lets the reader submit an EOI, though 189 isn't inviting the occupation (or has too little data); the template read calls a change the biggest jump only when it lifts the 189 label; changes that still leave the reader under 65 sort last; readers under 18 or 45+ get a banner; the under-18 route step names the 18-or-over rule; "Next steps" keeps "Superior English" and "Professional Year" capitalised. The sweep tests flag both contradictions.
- **One stamp face.** Every stamp (homepage, report screen and print) uses Big Shoulders Stencil Display 900 from `@fontsource/big-shoulders-stencil-display` through `--font-stamp` (founder decision, superseding R22). The face has no width axis, so `stamp-geometry.ts` lost its stretch logic.
- **`/sample/`** has a page head (a styled paragraph, so the report's headline stays the one h1) on the check's sage desk.
- **Homepage on phones:** bytes at load 2.06 MB to 1.59 MB (duplicate Archivo removed, passport SVGs refitted from about 100 KB to 39 KB each and lazy-loaded, hidden occupation options no longer server-rendered: HTML 290 KB to 171 KB).
- **Wording:** homepage shift stamps spell labels in full; the map writes "under 58" and notes an under count may be zero; occupation pages lost their all-caps eyebrows.
- **Occupation verdict strip:** under each occupation page's direct answer, the 189 label at common scores (e.g. 65 Long wait, 70 Competitive, 75 Strong, 80+ Very strong) by the report's rules, or one line for not-invited / no-data / too-few occupations, with a Check my points link. Metadata, JSON-LD, sitemap and robots are unchanged (compared against a `main` build).
- **189 eligibility imported (23 Nov 2026).** `npm run data:state-lists -- --only federal` now records each code's 189 (Points-Tested) listing beside 190 and 491 in `federal-occupations.json` (212 codes; 211 of the 493 dashboard occupations; 190/491 flags unchanged). The occupation strip reads "Not available" (neutral stamp) for the 274 pages whose occupation isn't listed for 189, naming 190 and/or 491 only when the list has them; 165 pages show scores, 37 "Not currently invited", 3 "Not enough data"/"Too few to count" (on the 189 list but no usable data). SEO output unchanged against the previous build (488 pages, sitemap, robots).
- **Light only** (superseded the same day by dark mode, above): `color-scheme: only light` and a white `theme-color`.
- **Review fixes (23 Nov).** Phone gutters on `/sample/`, `/check/` and the occupation verdict strip are screen-only queries and read one `--page-gutter` token (also cancelled by the report sheet); the oval stamp test sizes by the oval's own width; internal occupation links use `→`, not `↗`.
- **Supporting pages in the passport identity.** `/states/`, `/methodology/`, `/feedback/` and the 404 share `components/info-page/` (sage desk shell and `PageHead`: breadcrumb, eyebrow, the one h1, intro). `/states/` is static HTML: a card per state (`components/states/state-card.tsx`) from `buildStateCards` (`src/lib/states-page/state-cards.ts`), showing who 190 and 491 are open (or restricted) to from verified 2026–27 streams, "Closed in 2026–27" only when every stream is verified closed, otherwise "Rules being checked" (ACT, VIC, TAS, NT), plus whether the occupation list is imported; the summary and "What changes the picture" open on tap; the homepage atlas shapes are a static pointer map (desktop) beside jump links (`#nsw` … `#nt`). The client filter and search were dropped. `/methodology/` has a contents list, section cards, a sources table that stacks on phones, label names in ink; text, ids (`#sources`, `#pool`, `#points`, `#limitations`, `#definitions`, `#privacy`, `#questions`) and the collection notice are unchanged. Feedback uses the shared form controls (`FormTheme`, `components/forms/`), the same look as the check without the check's own styles. The old global page styles (`.page-head`, `.method-*`, `.state-*`, `.notice`, `.pill`, `.text-link`, `.button`, `.final-cta`, `.container` and more) are gone. Metadata, JSON-LD, sitemap and robots match the build before the change (only the colour-scheme meta differs).
- **`/sample/` call to action** (`report/sample-cta.tsx`): white card, homepage primary action, a passport page whose blank "your stamp" outline takes an ink stamp once as it scrolls into view (Motion `useAnimate`; the server renders the pressed state, so reduced motion and no-JS stay static; never printed).
- Verified on the built `out/` at 360, 390, 820 and 1280 with reduced motion: no sideways scroll, no text under 12px, no console errors, anchors land under the header, `/sample/` tabs print in 4–5 A4 pages.
- **Report: 189 isn't available off the 189 list (founder, 23 Nov 2026).** `label189` takes the federal list's 189 flag (`listed189`, from `OutlookInput.rules.federal` via `listMembership.federal189`; null when the list is unreadable, which keeps the data-only behaviour). Off the list it returns the existing `not-open` label with `offList: true` (a failed basic requirement still reads "Not eligible yet" first, with `offList` set so no fix is said to open 189). `name189`/`stampName189` give "Not available"; the 189 card uses neutral `no-data` ink (new `VisaCard.ink`). Headline, wait ("189: not available for your occupation, so there's no 189 wait"), best line ("More points could help 491, with state nomination"), improve (new `off-list` mode: plain list plus a banner), route (state visas only, no "Keep 189 ticked", no 189 label on Today), facts and template read, charts/evidence empties and the points page ("189 Independent (not available for this occupation)") all follow. `ReportFacts` shape is unchanged, so `read-facts.ts` needed nothing. The sweep fails any off-list report that says "not enough … 189 data", "submit an EOI", "opens 189", "189 +" or lacks the "Not available" stamp. Greenkeeper (scenario Sana) is off the list, so its 189 expectations changed; Pressure Welder 322312 now covers on-list-but-no-189-data.
- **Occupation pages:** for the 274 off-list pages the first summary sentence reads "{Name} isn't on the Home Affairs list for 189; the 491 pool holds …" instead of "No 189 EOIs are waiting in the published pool for {Name} …" (this changes meta/og/twitter description and the Dataset JSON-LD description on exactly those 274 pages; titles, FAQ JSON-LD, canonicals, robots and sitemap unchanged), and the check card says "189 isn't available for this occupation: it isn't on the Home Affairs list for 189".
- **Methodology:** "covers 11 occupations" now reads "covers 493 occupations, 479 of them with published SkillSelect data" from `snapshotCoverage(occupationIndex)` (`src/lib/data/coverage.ts`).
- **Final review fixes (23 Nov).**
  - **CSS on every route.** The root `not-found.tsx` loads on every route, and importing `HomeAction` and the info-page shell put homepage and supporting-page styles everywhere; `/feedback/` wrapping its form in `CheckFlowTheme` then let Next's CSS merger (it glues route stylesheets into ~30 KB chunks) pull the check, report and homepage styles onto every page. Now the 404 uses a plain `components/ui/button-link.tsx` and its own shell; the shared controls live in `components/forms/` (`form-controls.module.css`, `formComponents`, `FormTheme`), the check keeps only its calendar, segmented, radio and progress styles; the report's feedback prompt has its own module; `next.config.ts` sets `experimental.cssChunking: false` (measured: `"strict"` still merged up to ~30 KB, `false` was smallest on every route with fewer files). Gzipped CSS per route, main → before → after: `/` 54.6 → 67.3 → 53.2 KB; `/states/` 47.7 → 61.6 → 48.6; `/check/` 59.3 → 61.6 → 59.8; `/feedback/` 59.3 → 61.6 → 48.5; 404 47.7 → 61.6 → 46.5; `/sample/` 59.7 → 62.1 → 56.4; an occupation page 53.1 → 67.2 → 51.1. Script JS before → after: `/states/` 278 → 218 KB, 404 278 → 217, `/feedback/` 290 → 246, occupation page 282 → 243, `/check/` 452 → 435, `/sample/` 433 → 415, `/` unchanged at 278.
  - **Homepage atlas off the 189 list** says "Not available" with the off-list reason (`buildHomeAtlas` takes the 189 flag; the page passes `listed189Codes(federal)`, null when the list is unreadable; stamps take `stampWord`).
  - **Off-list best line and banner** no longer say more points could help 190 and 491 when neither invites at any score (e.g. Flower Grower 121212 at 70): `Improve.pointsHelpStates` is true only when a state visa invites, has too little data, or a change lifts one; otherwise "Points aren't what's holding you back." The sweep asserts it for all 493 occupations.
  - `stateVisasOnList` (`label-189.ts`) replaces three copies; `checkRead` fails "opens 189" / "submit … 189 EOI" when the facts' 189 label is "Not available" (the write-read prompt says the same); the unused `components/home/try-it.tsx` and eight unused global classes are gone.
  - Still unimported in `components/home/`: `doors.tsx`, `three-questions.tsx`, `home-faq-list.tsx`, `hero-demo-loader.tsx` (and what only they use); not removed here.
- **Found and fixed:** on phones a shown report scrolled sideways by 5px (14px at 600px) on `/check/` and `/sample/`; both pages now keep the gutter the report sheet cancels.

Follow-ups (not done): a 190 card for an occupation off the federal 190 list says "No state's rules fit your answers" rather than naming the list; Mantine's full stylesheet (about 250 KB uncompressed) loads on every page; header and footer links prefetch other routes' code and data as they scroll into view (about 1.2 MB more after a full scroll on the homepage, including a 215 KB `/sample/` payload); `public/report-passport.svg` (223 KB, used by reports and `/occupations/`) could get the same curve refit.

## Occupation pages redesigned (22 November 2026)

The directory and all 479 generated detail pages now follow the approved passport-style identity. Preview `/occupations/` and `/occupations/registered-nurses-nec-254499/` on the local dev server. Search, visa pool tabs, round/cohort/state evidence, FAQ and related links are restyled; a scoped points preview keeps the existing occupation-only check URL contract. Federal-list chips now say membership rather than implying eligibility.

See `docs/OCCUPATION-REDESIGN-HANDOFF.md` for exact files, reviews, checks and screenshots. SEO comparison covers 480 HTML paths: unchanged route set, metadata, canonical/robots/JSON-LD and byte-identical sitemap, 130 unchanged noindex pages, 479 FAQ parity checks and zero broken internal links. Built-browser checks cover 35 route/width cases plus keyboard, touch, reduced motion, search, disclosures, prefill and print. Parent inspected representative screenshots and SEO/test/build artifacts and tightened directory placeholder contrast with the existing muted token. No merge or deployment. State/supporting-page redesigns remain next.

## Shared identity and shell implemented (22 November 2026)

The locally implemented recommendation is **Open lens**: a simple lens/bearing mark, Archivo wordmark, matching sage-backed favicon and ordinary/reversed SVG assets. Header, mobile navigation and footer now match the approved homepage/check palette. Preview `http://127.0.0.1:3000/`. This is ready for founder review, not a founder-approved logo decision or a deployment.

Detailed assets, checks and screenshots: `docs/BRAND-SHELL-HANDOFF.md`. Agent verification: `npm run check` (120 files / 1,287 tests), `npm run build` (491 pages), separate spec/quality reviews, 56 route/width combinations and mobile drawer keyboard/touch/print checks. Parent inspected the identity board, phone homepage and QA artifacts, and confirmed dev preview responds. No commit, merge or deployment.

Follow-ups: refresh the older social-share PNG separately; fix the existing 320px Feedback Turnstile overflow during that page's redesign. Those do not block reviewing the shared shell. Earlier notes below describing the shell as reserved are historical.

## Approved homepage implementation (22 November 2026)

The actual `/` route now implements Direction A+: passport/stencil hero, searchable occupation control, points and visa chips, interactive state map, historical evidence, report examples and compact FAQ. Preview `http://127.0.0.1:3000/`. The original prototypes are unchanged. Full file ownership, domain/provenance details, visual artifacts and independent review evidence are in `docs/HOMEPAGE-IMPLEMENTATION-HANDOFF.md`; implementation checklist is `docs/superpowers/plans/2026-11-22-approved-homepage.md`. Verified 288 state combinations and 18 national cases, keyboard/touch/zoom, loading/missing/error states and mobile layouts. Shared shell, logo and favicon remain a separate design task. No deployment.

## Points-check redesign (22 November 2026)

`/check/` now follows the approved Direction A+ homepage identity: sage desk, white paper, ink Archivo headings, scoped premium Mantine controls and a passport security-line live points preview. Preview: `http://127.0.0.1:3000/check/`; built static verification: `http://127.0.0.1:3017/check/`.

The four steps, calculations, dependent-answer resets, validation, opt-in local saving, required email, Turnstile and report handlers are preserved. Step bodies and reusable date/experience fields now live under `src/components/check/`. `CheckFlowTheme` inherits the root Mantine theme without affecting other routes or the generated report. Paired fields keep shared label/help/control tracks. The points breakdown is an accessible disclosure, and the introductory check header hides once the report is shown. No backend submissions were made in browser QA.

Verification: all four steps at eight widths (1440/1280/1024/820/600/390/360/320), no page/form overflow; sample flow reaches the report; manual profile reaches required-email validation with focus on the email field. Conditional state/study/Professional Year fields and points updates checked. Keyboard occupation search/selection, radio arrow navigation and the points disclosure work. The final built recheck confirms white controls, full-opacity placeholders and no obsolete local-token classes. Independent scoped review passed after fixing placeholder contrast to 6.41:1 and centralizing check tokens in `globals.css`/`CHECK_PALETTE`. Full `npm run check`: 119 files / 1,286 tests pass. Production build and combined homepage final verification are recorded in the homepage implementation handoff. Screenshots: `output/playwright/check-points-final-desktop.png`, `check-points-final-mobile.png`, `check-review-desktop.png`, `check-review-mobile.png`.

Shared header/footer, logo and favicon retain their existing design, awaiting the founder's separate design pass. Work remains on `roadmap/report-redesign`, uncommitted and undeployed.

## Revised homepage: Direction A plus interactive map (22 November 2026)

The founder prefers the original 21 November Direction A to the blue/white proposal and requested enhancing a separate copy. Open `http://127.0.0.1:3001/homepage-2026-11-22/direction-a-plus.html`. The original Direction A is unchanged. The new preview keeps the paper/sage/ink/stamp language, adds explicit Australian permanent-residency context, and replaces the old doors/try-it layout with an interactive state map and passport evidence panel. State shapes and equivalent buttons select all eight states/territories; 189/190/491 controls, occupation, points and zoom work locally. State evidence is generated by the existing `stateEvidence` / `evidenceLabel` code, with nomination points included and masked counts retained as ranges. This is historical evidence, not state-policy status or eligibility. The app homepage is unchanged pending design approval. Research and provenance are in `direction-a-plus-notes.md` beside the preview. AI scope remains summary only.

## Homepage design preview and AI scope (22 November 2026)

The founder chose AI summary only for the current release. Deferred AI explanations, comparisons, state explanations and report questions are recorded in `docs/AI-ROADMAP.md`.

The founder rejected the four 21 November homepage directions and requested a premium, attractive, graphics-led page that clearly explains Australian PR. A new interactive design preview is in `.superpowers/brainstorm/homepage-2026-11-22/`; open `http://127.0.0.1:3001/homepage-2026-11-22/` while the brainstorm server is running. It uses a real Australian coastline, a sample outlook, pathway controls and an occupation/points example generated with the existing calculation code. The illustration is not an eligibility map. The app homepage is unchanged pending founder review. Design plan and asset provenance are in the preview's `notes.md`.

## Passport background restored (22 November 2026)

The founder identified that the implemented report and PDF were missing the approved Option E passport security-line artwork and requested restoring it. The shared `PassportBackground` decoration uses the original mockup's SVG paths, cached as `public/report-passport.svg`, behind both the screen hero and print hero. It is hidden from assistive technology, ignores pointer events, and takes no layout space. The image loads eagerly for the offscreen print tree and remains printable with browser background graphics disabled. This applies to personal and sample reports through their shared components. The original omission is resolved. Follow-up: the print artwork now spans the full hero instead of starting 40% across it, removing the abrupt vertical edge through the horizontal security lines. No AI enablement or deployment is included.

Verified: `npm run check` (1,276 tests) and `npm run build` pass. Built-export browser checks cover all four sample tabs at 1280, 820, 390 and 360px with reduced motion, no horizontal overflow or page errors, and loaded, non-interactive artwork hidden from assistive technology. Eight PDFs exported with background graphics off retain the original page counts (Strong 4; the other three 5) from both desktop and mobile viewports; all four opening pages were rendered and visually inspected. Scoped code review confirms all 35 SVG paths match the approved artwork.

## Report redesign: shipped on the branch, not merged, not deployed (22 November 2026)

Branch `roadmap/report-redesign` (spec `docs/superpowers/specs/2026-11-21-report-redesign-design.md`; ledger `.superpowers/sdd/2026-11-21-report-redesign/progress.md`). Every plan task (1 to 19) is done, and the whole-branch review's fix wave (ruling R32) is in; its report is `.superpowers/sdd/2026-11-21-report-redesign/final-fix-report.md`. Nothing is merged to `main` or deployed. What changed: the 34-page report is replaced by a short report built around stamps (a label from code for 189, 190 and 491), a route line, queue and cut-off charts, an improve section, an evidence section (closed on screen, the old state panels and tables inside) and a 4 to 5 page print layout; `/sample/` has four example tabs; a `write-read` Function and "Our read" client exist but stay dark. See `docs/REPORT-COVERAGE.md`.

**Both AI switches stay off.** `NEXT_PUBLIC_READ_ENABLED` is unset and `READ_ENABLED` is not `true`, so every report shows the template read. `PRIVACY_VERSION` stays `2026-11-20` on purpose (ruling R31): the deployed Functions check it exactly. The AI sentences (the email gate's "Your summary is written by AI from your results (not your answers)." and the privacy text's Anthropic sentence) show only in a build with `NEXT_PUBLIC_READ_ENABLED=true`.

**Enablement checklist.** Merging the branch changes nothing visible about the AI. Before step 1, three things must be done (final review, ruling R32):

- Set a monthly spend limit on the Anthropic workspace that holds `ANTHROPIC_API_KEY`, so a leaked token or a flood of reads has a hard cost ceiling.
- Build a Postgres-backed use counter per submission id (ids only, never facts or text) and have `write-read` check it. Today's per-token count lives in memory per Function instance, so a cold start or a second instance resets it. Do not set `READ_ENABLED=true` until this exists.
- Confirm on the hosted project that Supabase sets the first `X-Forwarded-For` entry to the real client address (the rate limit keys on it, and requests without it share one bucket), and that a hosted deploy resolves the `npm:@anthropic-ai/sdk` import.

Then, to turn it on:

1. Set the Function secrets: `ANTHROPIC_API_KEY`, `READ_MODEL`, `READ_MAX_OUTPUT_TOKENS`, `READ_TOKEN_SECRET`. Leave `READ_ENABLED` unset for now.
2. In code, bump `PRIVACY_VERSION` in `src/lib/submissions/contract.ts` and the "Collection notice version" date in `src/app/methodology/page.tsx`. Build the frontend with `NEXT_PUBLIC_READ_ENABLED=true`.
3. Deploy the three Functions and the frontend **back to back**, Functions first. Between the two deploys the old live frontend still sends the old `PRIVACY_VERSION`, which the new Functions reject, so submissions fail until the frontend lands. To avoid any window, have the Functions accept both the old and new version for a day, then remove the old one.
4. Then set `READ_ENABLED=true`. Kill switch: `READ_ENABLED=false`.

The read token lives in memory only (never localStorage or the URL); the report allows at most 3 `write-read` calls per token.

**Rulings the founder should know.** R22 (stamps in Archivo) was superseded on 23 Nov 2026: every stamp now uses the Big Shoulders Stencil face. R25: the route line shows only at 1024 px and wider; tablets and phones get a vertical route list. R27: the print `@page` margins (14/14/18 mm) apply to every route. R26: the old "Useful definitions" glossary now lives on the methodology page.

**Where the real rules engine's states differ from the approved mockups** (spec section 9 accepts this; the stamp labels are unaffected unless noted). Mockup copy was hand-written; the engine names the state its evidence and rules support:

- Priya and Kavya, 190: Victoria (rules being checked), not NSW. 491: Northern Territory. SA has 20 confirmed invitations but fails the half test, so it is only competitive.
- Arjun, 491: South Australia (tied with Tasmania, wins on code); 190: Tasmania.
- Rahul: Northern Territory for both 190 and 491 (only NT shows for 491).
- Aarav, 491: Victoria (rules being checked); his 190 is NSW as in the mockup.
- Meera: 190 Tasmania (rules being checked), 491 Western Australia.
- Dev: no state is named for a not-invited visa (ruling R7).

Other differences: Kavya reads "Roughly 870 to 970 EOIs ahead" (data), not the mockup's 870 to 990 (R2); the pool-by-points chart is a table of bars so its labels reach 12 px; the mockup's guilloche hero background was restored on 22 November at the founder's request (see above).

Verification of the built export is in `.superpowers/sdd/2026-11-21-report-redesign/task-19-report.md`.

## Search indexing launched (20 November 2026)

The founder launched indexing: `SITE_INDEXABLE = true` in `src/lib/site.ts`, so `robots.txt` allows all crawlers, pages are indexable (occupation pages whose every count is "<20" stay `noindex`), and `sitemap.xml` lists the 5 site pages and 349 occupation pages. Robots rules are a pure function (`src/lib/robots-rules.ts`) tested in both states.

**Deadline: install the daily 180-day retention cleanup in Supabase by 1 May 2027.** The privacy section now says "We delete submitted calculations and feedback 180 days after they are submitted"; the first records (20 Nov 2026) turn 180 days old around 19 May 2027. The steps are in `docs/OPERATIONS-BACKEND.md`.

Privacy text: the "daily cleanup once collection is enabled" clause was removed (no cleanup is scheduled yet) and one sentence now discloses Cloudflare Web Analytics (cookieless page counts). `PRIVACY_VERSION` was left at `2026-11-20` on purpose: the deployed Edge Functions check it exactly, so bumping it needs a coordinated backend deploy.

Founder's open items: the www.migratelens.com redirect (was returning 522), one live personal check and one feedback submission with test rows deleted afterwards, Google Search Console (Domain property via Cloudflare DNS) with the sitemap submitted, Bing Webmaster Tools import, and confirming Cloudflare Web Analytics records `migratelens.com` (its beacon upload failed in a headless test). Live checks on 20 Nov: the backend answers `migratelens.com` with CORS 204, rejects other origins (403) and rejects malformed submissions (400) without saving; the forms and the Turnstile widget render.

## Deployment fix: complete the npm lockfile (20 November 2026)

Merged and pushed the release to `main` as `16469a8`; Cloudflare's first deployment failed during dependency installation, before `npm run build`. Reproduced its exact missing `@emnapi/runtime@1.11.3` and `@emnapi/core@2.0.0-beta.2` entries in a fresh directory with Node 22.23.4 and npm 10.9.9. Regenerated the existing lockfile using that toolchain: the two entries are added, npm peer metadata is normalized, and existing package versions remain unchanged. Include a fresh `npm ci` check when validating lockfile changes; an existing local dependency tree did not expose this deployment failure.

## Release integration: production domain confirmed (20 November 2026)

The founder confirmed the three Cloudflare Pages Production public variables are configured, `https://migratelens.com` is live, and requested merging `roadmap/occupation-pages` into `main`. Added the exact production origin to Supabase `ALLOWED_ORIGINS`; both submission endpoints return 204 for production preflights and 403 for an unapproved origin. A read-only aggregate check confirms one saved calculation and no feedback yet; successful hosted feedback remains unverified. The production Turnstile widget must permit `migratelens.com`.

Integration includes the occupation pages, required calculation email and limited summary capture, feedback, Supabase backend, and paired-field alignment. Earlier “not merged/deployed” notes below describe their individual checkpoints. Indexing stays disabled (`SITE_INDEXABLE=false`); enabling search visibility is a separate launch action. Retention Cron scheduling remains explicitly deferred by the founder; the SQL is ready but has not been installed.

## Latest UI fix: paired field alignment (20 November 2026)

Fixed the shared `.columns` layout in `src/components/check-flow.module.css`: paired fields share label, helper, input and error tracks; single-column breakpoints return to normal stacked flow. This covers name/birth date, state/visa expiry, work experience, and assessment dates. Reproduced the original 30px offset; corrected paired controls measure 0px difference. Verified the built export at 1440, 1024, 900, 760, 640, 481, 480 and 390px, including wrapped labels/help and an error, with no horizontal overflow. Scoped code review clean; `npm run check` (860 tests) and `npm run build` pass. Local preview restarted on port 3000. No backend or collection behavior changed.

## Latest: Supabase backend configured, local preview restarted (20 November 2026)

The founder completed Supabase CLI login/link/migrations, supplied Turnstile keys, and confirmed `hello@migratelens.com` is set up. Configured the public project URL/site key/contact in ignored `.env.local`; saved `TURNSTILE_SECRET_KEY` and exact testing `ALLOWED_ORIGINS` in Supabase private secret storage (no private value in source or frontend). The project is `tyhwoehzjjrjwojzwjbg`. Deployed both `submit-calculation` and `submit-feedback` with the pinned CLI; both report ACTIVE and scoped `verify_jwt=false`.

Verified hosted migration dry-run reports up to date, both local-origin preflights return 204 with the expected CORS header, unapproved origins return 403, and valid-shaped requests with intentionally invalid Turnstile tokens return 403 without saving. A successful real human-verified submission and REST gateway role smoke test still remain to be checked. Restarted the local frontend at `http://127.0.0.1:3000`; `/feedback/` returns 200. The testing allowed origins are local port 3000 (127.0.0.1 and localhost) and the exact `https://landfall-584.pages.dev` host. Add the final production origin and use the appropriate widget/project when releasing the frontend.

The founder explicitly deferred step 6 (retention scheduling); no Cron schedule was installed. Complete that before public collection launch. The hosted Pages frontend is still on its prior release: no merge/push or Cloudflare frontend deployment was performed in this configuration step.

## Earlier: calculation capture and feedback implemented locally (20 November 2026)

Implementation remains on `roadmap/occupation-pages`; no merge, push or production deployment was performed. The founder's current Cloudflare hosting test is `https://landfall-584.pages.dev/`; automated requests returned 403, so live page behavior was not independently verified. The provided Supabase public URL is configured in ignored `.env.local`; no credentials were stored or collected.

Implemented: a required email plus allowlisted calculation summary before personal reports; sample-origin exclusion and disabled sample saving; idempotent retries; `/feedback/` with optional email/context; server-validated Turnstile; Supabase Postgres tables/RLS/atomic RPCs and two Edge Functions; explicit CORS and request limits; separate daily retention schedule; privacy and operating documentation. Full profiles/dates remain local, email is excluded from device saving and report printing, and no account/marketing/email-delivery service is implied.

Verified: `npm run check` (85 files, 860 tests; format/lint/TypeScript), `npm run build` (all 479 occupation pages plus feedback, still static), `npm run backend:check`, `npm run backend:test` (11), and `npm run backend:test:sql` (real isolated Postgres role permissions, atomic/concurrent idempotency, backlog statuses and retention boundaries). Separate spec and code-quality reviews are clean after fixes. One intermediate typecheck collided with a simultaneous build regenerating `.next/types`; final sequential checks pass.

Built-export browser checks: desktop 1440px and mobile 390px, reduced motion, required-email rejection, confirmed-save report opening, current-step verification preservation, feedback optional context, linked validation errors, sample capture exclusion, print-hidden feedback prompt, no horizontal overflow, unconfigured unavailable state. Browser success/failure/retry states used controlled Turnstile/API responses; these do not prove live persistence. A stale heading assertion was corrected in the QA script; the report itself opened correctly. Browser captures are in ignored `output/playwright/` (viewport captures avoid full-page screenshot stitching artifacts).

Remaining external work: Supabase CLI is not logged in; no schema/functions/secrets/Cron have been deployed to the founder's project. Need public Turnstile site key and a real privacy/contact mailbox; private keys belong in Supabase secrets. Staging REST-gateway role denial, actual Turnstile verification, real persisted submissions/deletion and scheduled Cron execution still need a configured project. Then configure Cloudflare public build variables and rebuild, integrate the release branch, verify the custom domain, enable indexing and submit Search Console. Exact steps are in `docs/OPERATIONS.md` and `docs/OPERATIONS-BACKEND.md`. The implementation plan is `docs/superpowers/plans/2026-11-20-calculation-capture-and-feedback.md`.

## Planned before launch: calculation emails and feedback (20 November 2026)

The founder purchased `migratelens.com` through Hostinger and is configuring Cloudflare. They requested storing calculation records and collecting feedback on the current `roadmap/occupation-pages` branch before going live, and explicitly chose **email required before viewing the personal report**.

The design is `docs/superpowers/specs/2026-11-20-calculation-capture-and-feedback-design.md`. The founder approved switching the backend plan to **Supabase Postgres and Edge Functions**, retaining **Cloudflare Pages** for the static frontend and **Turnstile** for both submission forms. Store an email plus a limited calculation summary; add `/feedback/`, private review in Supabase, and accurate privacy wording. Use separate staging/production Supabase projects, locked-down table access, and Supabase Cron for daily retention. Login, email verification, delivery, alerts and payments remain later work. This is planning only: no database, form, email gate, or collection behavior has been implemented. Indexing remains disabled. Continue the code work on this branch as requested.

Deployment investigation (20 November): the founder's `main` deployment log shows Next.js static generation succeeding, followed by failure in `npx opennextjs-cloudflare build`. This static-export project should use the Pages static HTML export setup with `npm run build` and output `out`. The logged route list has no occupation pages. Verify the Cloudflare project type, build command and intended release revision before redeploying; the failure has not been resolved or verified in Cloudflare by this documentation update.

## For the founder: what happened while you were away (19 November 2026)

**Done and pushed** to branch `roadmap/occupation-pages` (not merged into `main`; that is your call):

- **479 occupation pages** at `/occupations/<name>-<code>/`, one for every occupation with published data, each opening with "What the data says", then the pool by points (189, 190 and 491 tabs), the last 8 rounds as round cards (your pick), what happened to EOIs submitted each month, a state-by-state table, three questions answered from history, and related occupations.
- **An A–Z occupations page with search**, "Occupations" in the main menu, and a "See the {occupation} page" link from the homepage try-it.
- **Google plumbing**: sitemap (354 pages: 5 site pages and 349 occupations), robots file, canonical addresses and structured data. **Everything stays hidden from Google** until launch.
- **Checks**: 845 tests pass, the build makes all 479 pages, and real pages were checked in a browser at desktop and phone widths (no errors, no sideways scrolling, printing shows every section).
- **The final review caught a real honesty problem**, now fixed: the "Which states nominate?" answer said a state had "the most invitations" even when the published ranges overlapped (19 pages). It now names a state only when its range is clearly above every other, which is 1 page today.

**To launch** (when you have the domain): change two lines in `src/lib/site.ts` (`SITE_URL` to your domain, `SITE_INDEXABLE = true`), build, and host it. Hosting is still to choose (my suggestion: Cloudflare Pages).

**Decisions I made for you** (each is in the ledger with its cost if wrong):

- R1: the occupation summary's source line wording ("SkillSelect (Department of Home Affairs), snapshot … · counts are EOIs (one person can hold several) · updated monthly"). Cost if wrong: one string.
- R2 → replaced by R8: "the state with the most 190 invitations" is named only when its range is strictly above every other state's. Cost if wrong: that sentence appears less often.
- R3: no component render tests (the repo has none); view-model tests and the browser check cover them. Cost if wrong: a render bug caught later.
- R4: share links use the placeholder domain until you set yours, so preview link images may not show yet. Cost if wrong: one line.
- R5: commits name the model that wrote them. Cost: cosmetic.
- R6: a month with no EOIs in the monthly table counts as zero (the data is one full download). Cost if wrong: an empty bar.
- R7: a test uses its own fully masked example instead of the plan's wrong fixture. Cost: none to behaviour.
- R9: pages are hidden from Google only when every count is "under 20", which leaves 349 visible pages, not the ~287 I estimated. Cost if wrong: some thin pages indexed at launch; one rule to tighten.
- R10: a small hardening (a state with an unpublished count) is a follow-up; it never happens in today's data.
- The alert sign-up box is left out until you choose an email service.

**Small follow-ups** (none block launch) are listed in the ledger: keyboard Home/End on the tabs, "(opens in a new tab)" on state links, two similar greys in the monthly bars, the source line appearing twice on a page, and a few test gaps.

## Latest: occupation pages shipped, hidden from search (19 November 2026)

Roadmap step 4 tier 1 is done on branch `roadmap/occupation-pages` (spec `docs/superpowers/specs/2026-11-19-occupation-pages-design.md`, ledger `.superpowers/sdd/2026-11-19-occupation-pages/progress.md`). `/occupations/` and a page for each of the 479 occupations with published data (14 of the 493 have none), each with its own title, description, canonical, three JSON-LD scripts, round cards, pool tabs (189 / 190 / 491, all printed), questions, related occupations, a sitemap and robots. Everything is `noindex` and `robots.txt` disallows all until launch. Where things live: `CLAUDE.md`, "Occupation pages".

To launch: `SITE_URL` in `src/lib/site.ts` is a placeholder (`https://migratelens.com`) until the founder buys the domain; set it to the bought domain and `SITE_INDEXABLE = true`, then build and check `out/sitemap.xml` and `out/robots.txt`. Occupations where every count is "<20" stay `noindex` and out of the sitemap.

Deferred: per-occupation share images (the site-wide `og.png` is used), tier 2 deep pages for the top 30 occupations, the alert sign-up box (waiting for the founder to pick an email service), and `llms.txt`.

Verified: `npm run check`, `npm run build` and headless Chrome against `out/` at 1440 and 390px (index, 261313, 254499, an all-"<20" occupation, one with no 189 pool, 261399) and at 320px for the long name only (261399, Software and Applications Programmers nec): no console errors, no horizontal scroll, tabs switch, index search filters, head tags present, print shows every panel and FAQ answer. Screenshots: `.superpowers/sdd/2026-11-19-occupation-pages/screenshots/`.

## Earlier: MigrateLens brand and homepage shipped (18 November 2026)

The brand and homepage plan is done on branch `brand/migratelens` (spec `docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md`, ledger `.superpowers/sdd/2026-11-18-migratelens-brand-and-homepage/progress.md`). The site is renamed MigrateLens everywhere in rendered HTML; the old storage key is migrated and cleared (ruling B3). New brand tokens, Newsreader + Inter, the C1 logo, favicon and OG image; a 12px text floor under test; a rebuilt homepage (two doors, try-it, three questions, FAQ) with a Stageshow hero demo. "Worth watching" is slate. Where things live: `CLAUDE.md`, "Brand" and "Homepage".

State verification (19 Nov 2026): VIC, ACT, TAS and NT rules still need reading on the official pages through the founder's Chrome (Claude in Chrome must be connected; the sites return 403 to automated requests). NSW's "working in NSW" option needs a "working there now?" question, and WA's 6-month contract rule needs the WA list's Industry Sector column (construction is exempt), before either can be verified.

Known follow-ups: not checked in Safari, Firefox or on touch (the demo poster scales with `tan(atan2())`); the poster CSS repeats the 576/720/436/358/660 layout literals with no test pinning them to `demo-layout.ts`; the fixed demo frame could overflow with more profile categories; `toPoolOccupation` in `src/lib/data/legacy.ts` is now used only by tests; `EOI_CAVEAT` duplicates a scorecard string; `OutcomeBar` shows a double label; a doubled full stop in one doc comment; `verifyPng` checks size only; merge the duplicate mobile media blocks in `globals.css`.

## Latest: state outlook shipped (18 November 2026)

Roadmap step 3 is done on branch `roadmap/reality-check`. The report order is now: header, reality check, 189 / 190 / 491 panels, **state outlook** (`#state-outlook`) with the optional **"Sharpen my state outlook"** questions under it, then points audit, scenarios, timeline, occupation context, get organised and definitions.

- **State outlook.** A 190 / 491 switch (both print, one after the other), a 4 × 2 grid of tiles (2 × 4 at 390px) and a separate "Any state" tile, then a `<details>` panel per state. Groups: Strongest evidence, Worth watching, Needs your answers, Not yet verified, Not open to you now. `#state-outlook-190` / `#state-outlook-491` select a visa; a tile opens, scrolls to and focuses its panel. Pure logic in `src/lib/state-outlook/` (`stateOutlook`, `buildTiles`, `buildStatePanel`, `questionsNeeded`); `src/lib/report/state-outlook-view.ts` assembles both visas inside `buildReportView` (evidence read at the 190 / 491 points with nomination). Without occupation data (loading, no data, points only) the outlook and the questions are left out and the scorecard explains why.
- **Scorecard.** The 190 and 491 card sentences are now the outlook summaries; ruling S1 (national-invitations sentence) is retired. The 190 / 491 panels link to "See your state outlook".
- **Removed** from the report: the "State pathways" overview cards. `/states/` keeps them (`src/components/state-explorer.tsx` and `src/data/states.ts` still feed that page), so the page keeps working as a general directory; pointing it at the outlook is a later choice.
- **Sharpen answers** go through `check-flow.tsx`'s update path (`updateMany`), so the existing opt-in saving applies; nothing goes into the URL. Answered questions stay listed (answered checks carry their `field`, and `questionsNeeded` lists open and answered fields from the profile alone), so a saved answer can be changed or cleared after a reload or Edit. Changing the state or onshore answer clears the answers about where you live (`resetStateRelativeAnswers` in `src/lib/state-answers.ts`, ruling P25), so months in one state are never read as months in another; changing the occupation clears the work answers (P30). On `/sample/` the form is read-only.
- **Data.** Rules in `src/data/state-rules/2026-27/`, lists and the federal list as JSON, all imported on the client through `src/components/data/state-rule-data.ts` (the lists and federal list total about 11 KB gzipped). First-load JS grew by about 29 KB gzipped on `/check/` and 53 KB on `/sample/`. `npm run build` prints a staleness warning (never a failure) for rules checked more than 45 days ago. Routine and sources: `docs/DATA.md`, "State rules".
- **Verified:** `npm run check`, `npm run build`, and headless Chrome over CDP against `out/`. On `/sample/`: both grids, VIC / ACT / TAS / NT "Not yet verified" with evidence, NSW 491 "Not open to you now", 16 tiles open and focus their panels, footer in every panel, scorecard summaries, read-only questions, 390px with no overflow, reduced motion, print media and a printed PDF with both visas and all 16 panels. Nurse check (QLD): answering "8 years in the last 10" moves WA 491 from "Needs your answers" to "Strongest evidence" live, with saving on (stored, then cleared by "Clear this answer") and off (nothing stored); the URL stays `/check/`. No console errors. Screenshots: `.superpowers/sdd/2026-11-18-state-outlook/screenshots/task11-*`.

- **Final review fixes (18 Nov 2026).** A sweep of about 213,000 real outcomes found input gaps, now closed. Every stream starts with the points check: an ineligible check (age 45 or over, an expired English test or skills assessment, named from `PointsResult.ineligibleReasons`) or under 65 points for the visa makes every state "Not open to you now"; an incomplete check never passes, and a missing English test or skills assessment date is asked in place in "Sharpen my state outlook" (rulings P27, P32; the report passes the whole `PointsResult`). The WA and SA graduate study rules, and SA's months after the course, are `secondary` because the questions cannot test them (P28). Panel lines show why a rule failed or can't be confirmed; a not-open panel lists each stream's first failing finding (P29). Changing the occupation clears the work answers (P30). Experience rules name the work each state counts and never fail on an answer below a wider definition (P31). QLD's Notice of Assessment gate and Queensland employer rule show as restrictions, and the QLD importer stops if the onshore Building and Construction column disappears. Verified with `npm run check`, `npm run build`, the reviewer's sweep (no pass while ineligible or under 65; every not-open stream has a verified, fresh fail) and headless Chrome against `out/` (screenshots `final-fix-*`). Report: `.superpowers/sdd/2026-11-18-state-outlook/final-fix-report.md`.

Known follow-ups: browser-verify ACT, VIC, TAS and NT (founder to decide how); import WA's sector column so the WA General stream can be checked (ruling P12); `report.tsx` (500 lines) and `check-flow.tsx` are still over the size limit; minor items in `.superpowers/sdd/2026-11-18-state-outlook/progress.md`.

## Earlier: reality check complete (18 November 2026)

Roadmap step 2 is done on branch `roadmap/reality-check`. The report now opens with the reality check, then a detail panel for each visa:

1. Header.
2. **What the data says** (`#reality-check`, renamed from "Reality check" on 19 Nov 2026): the bottom line from the last four 189 rounds and a state line ("The published evidence for 190 is strongest in NSW…"), three visa cards (190/491 chips name the best state group) (chip, one sentence, your points, "Ahead of you" on 189 or "Higher score (national pool)" on 190/491, "At your score", a details link), the queue caveat with a link to `/methodology/#pool`, and the pool-overlap note, then the last six 189 cut-offs against the reader's points, "EOIs like yours", and "What could change it" (points you could add, dated changes ahead). The same bottom line is repeated before "What this report can and cannot tell you". View-model: `src/lib/report/data-says.ts`; components: `src/components/report/data-says.tsx`.
3. **189 panel** (`#visa-189`): where you stand (with the 12-month trend and its coverage caveat), among your score, recent rounds (all rounds on tap), what happened to EOIs like yours (nearby months on tap), what could change your position.
4. **190 and 491 panels** (`#visa-190`, `#visa-491`): where you stand in the national pool and 12 months of recorded invitations, linking to the state pathways.
5. Points audit (the eligibility notice now opens it), scenarios, timeline, state pathways, occupation context, get organised, definitions.

- The old score cards, pool section and invitation-history section are gone. View-models live in `src/lib/report/` (`report-view.ts` builds them all from one profile and occupation); components in `src/components/report/`. The nav numbers follow the sections actually shown: without occupation data the panels are left out and the scorecard explains why.
- Final-review honesty fixes (S11–S16): the queue caveat under the scorecard and every queue bar; "Invited, not yet lodged" and the current-status note in EOIs like yours; masked same-score counts say they may be zero; an EOI month after the snapshot says it is not published yet (in both the same-score block and EOIs like yours); points-only checks say "You chose a points check only…"; 190/491 invitations are labelled "all states". A failed load's 189 chip says "Not loaded".
- Ruling S1: until step 3, the 190/491 card sentences summarise national invitations, not a state outlook (decision log in `docs/STRATEGY.md`).
- Print: closed `<details>` content (all rounds) and the trend's monthly table now print; panel blocks may break across pages, headings stay with their content.
- Verified: `npm run check`, `npm run build`, and headless Chrome against `out/` at 1440px and 390px — `/sample/` (ICT Business Analyst at 90: "none" headline, 865–903 ahead, 1,093 at your score, all three panels), the nurse check (`?occupation=254499`, EOI date 14 Feb 2025: Feb 2025 cohort, 175 invited, 60 lodged), points only, print media and a printed PDF, reduced motion, loading and failed-detail states, details links moving focus to the panels, no console errors. Screenshots for the founder are in `.superpowers/sdd/2026-11-18-reality-check/screenshots/`.

Next: roadmap step 3, the 190/491 state outlook (same spec, sections 3 onward). It replaces the "State pathways" section and the S1 card sentences. Known small follow-ups: the legacy trend chart's axis labels are small at 390px and still use locale month names, so a September tick could read "Sept"; on a failed load the 189 card's neutral chip still says "No data"; `report.tsx` (537 lines) is still over the length guideline.

## Earlier: data foundation complete (17 November 2026)

Roadmap step 1 is done on branch `roadmap/foundation`. The site is fed by one validated, versioned dataset covering every occupation: snapshot `skillselect-2026-10-31`, 493 occupations (479 with published EOIs), produced by the TypeScript importer in `scripts/import/`. The Python importer and the 11-occupation `pool.json` / `report-evidence.json` are gone; the two files are kept as test fixtures, and the new pipeline reproduces them with zero differences. `docs/DATA.md` is the data dictionary; read it before using the data.

- The UI looks and behaves as before for the original 11 occupations. The one copy change is the 12-month trend caption: the net-change sentence was replaced by a coverage caveat (ruling R17).
- Final-review fixes: multi-month data now records every fetched month (`{}` = zero) and accessors use calendar windows from `asAt` (R14, records at `schemaVersion: 2`); the 2020-21 unit-group 189 rounds are skipped with reasons instead of being misread, and `rounds.json` is `{ rounds, skipped }` (R15); the legacy test regenerates 2026-10 from `data/raw` (R16); a short Qlik table read now stops the import. All 493 occupations are now searchable in the homepage explorer, the check's occupation picker and the report's comparison picker.
- Pages server-load the occupations they render statically (Registered Nurses nec on the homepage; Registered Nurses nec and Registered Nurse (Aged Care) on `/sample/`, since 19 Nov 2026). Other occupations are fetched one file at a time from `/data/occupations/<code>.json`, showing "Loading published data…" meanwhile.
- Occupations with no published 189 pool, or no published EOIs, keep the points check and say that no pool comparison is available.
- Verified: `npm run check`, `npm run build`, and a headless-Chrome run against `out/` (explorer search and loading state, the four-step check from `?occupation=233211`, the sample report, print media, 390px width, reduced motion, no console errors).

Next: roadmap step 2, the reality-check section (`docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md`). Open data questions are listed under "Known limits" in `docs/DATA.md`, notably the SUBMITTED coverage window: re-check it after the 11/2026 import.

## Earlier checkpoint

17 November 2026. The user requested pushing the current work to GitHub and continuing later. This checkpoint contains the premium redesign and expanded evidence-backed report. No new preview deployment was requested at this stopping point; the existing private Sites preview still has the previous release.

## Implemented

- Mantine 9 controls and mobile drawer; Motion feature tabs, step/score transitions and section entrances, with reduced-motion support.
- Redesigned landing page, guided check, report workspace and state directory.
- Report credential scenarios, explicit scenario-to-pool action, three visa pools, twelve monthly 189 occupation totals, six actual invitation rounds, personal dates, state summaries, occupation comparisons, general checklist and glossary.
- Reproducible official-data importer and source/coverage documentation (since replaced by the all-occupation importer; see `docs/DATA.md`).
- Review fixes for bounded chart input, printing collapsed content, expired-credential scenarios and SVG title hydration.

## Verified

47 domain/data tests pass, TypeScript passes and the static production build passes. Production dependency audit reports no vulnerabilities. Original SPEC and four HTML references remain byte-for-byte unchanged.

Production browser checks exercised homepage searchable occupation, keyboard score slider and feature tabs; empty validation; calendar selection; full four-step sample check; 90-point report; credential scenario and applying it to the pool; 190/491 score defaults; oversized pasted input; checklist and glossary; edit, opt-in saving, restoration and clear. No JavaScript page errors in the completed flow. Mobile navigation and sample-report width passed a 390px smoke check; collapsed glossary content is visible in production print media. A decorative halo causing homepage horizontal overflow was corrected.

## Continue next time

As of 17 November 2026, follow the approved roadmap in `docs/STRATEGY.md`, in order:

1. Data foundation: done.
2. A reality-check section in the report: done (see "Latest" above).
3. A 190/491 state outlook, covering rules, evidence and points, ranked into groups: done (see "Latest" above).
4. SEO foundation and occupation pages for every occupation.
5. Polish: readability, copy, sample report, `npm ci` lockfile.
6. Content engine.
7. Monetisation, with lawyer review first.

The earlier QA items still apply as part of step 5: mobile/tablet visual QA, print pagination and step-to-step scrolling under the sticky header. Preserve `.openai/hosting.json` when publishing.

`docs/REPORT-COVERAGE.md` records every original report section and the evidence or product dependency behind each remaining gap. `docs/DESIGN.md` records the design approach and library choices. Exact queue positions, forecast waits, percentage chances and current ceiling utilisation remain unsupported and are not fabricated. History-based outcome counts and historical waits are now planned; see `docs/STRATEGY.md`.
