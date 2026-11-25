# Task 12 report: the recap page

Status: DONE_WITH_CONCERNS (concerns at the end; none blocks the task)
Base: 1e87237. Commits:
- 9005c49 refactor(updates): require the occupation pages in the recap context
- f58d58f feat(updates): /updates/YYYY-MM/ recap page

Not pushed (as instructed).

## What I built

Route `src/app/updates/[month]/page.tsx` (+ `page.module.css`):
- `generateStaticParams` gives one `{ month }` per facts file (`listRecapMonths`). `dynamicParams = false`.
- Metadata: `title: { absolute: recapTitle(facts) }` (R20), `recapDescription`, canonical `view.path`. `openGraph` (article, siteName, title, description, url, images) and `twitter` use `/social/<month>/og.png` when that file is in `public/`, else `/og.png`.
- `buildRecapView` gets `occupationPages` = codes of index entries with `hasData`. 253315, 253513 and 399112 render as plain names. Every one of the 168 occupation links in the built page resolves to an `out/occupations/.../index.html`.
- Sections follow spec 6.4 and the mockup's order: hero and passport, 189, 190, 491, movers, month on month, CTA, method, FAQ (`id="faq"`). [D] sections drop out when the view slice is null. Paper and desk bands alternate.
- JSON-LD comes from `recapJsonLd` through `serializeJsonLd`.

Components in `src/components/updates/` (each with its CSS module unless noted):
- From the brief: `recap-hero`, `passport-panel`, `round-stamp` and `rect-stamp`, `round-section`, `pool-chart`, `notable-table`, `state-section`, `state-recap-map`, `movers-section`, `compare-section`, `recap-cta`, `recap-method`, `recap-faq`.
  - The two stamps are pure SVG with no CSS module (R9).
  - The `recap-cta` card is static. It uses the round stamp "MIGRATELENS · FREE POINTS CHECK · 189 · 190 · 491", links to `/check/` and `/sample/`, and is an always-dark panel.
- Small extras to keep files focused:
  - `recap-band` (section band; `recap-parts.module.css` holds shared kicker, heading, card, list and stacked-table styles);
  - `section-head` (kicker, h2, lead and visa stamp);
  - `occupation-link`;
  - `move-list`;
  - `cutoff-change`;
  - `distribution-card`;
  - `round-table`;
  - `not-listed-card`.

Details that follow the rules:
- **Stamps (R9).**
  - Relative imports only, no CSS module, no `"use client"`, and no hooks except `useId`.
  - Sizes come from `stamp-geometry.ts`: `BIG_STAMP`, `bigWordLayout`, `bigArcWidths`, `capArcText` and `VISA_STAMP`.
  - The round stamp's ring lines get a static `textLength` squeeze when `estimatedWidth` is larger than the clear arc. That works in static markup, where `useFitStampText` can't run.
  - Stamps are drawn at 230px (round) and 116px (rect), their `minWidth`, so their text stays at 12px or more. They never animate: `document.getAnimations().length` is 0.
- **Map.**
  - It uses the atlas geometry with the depth layers and four `--updates-map-*` bands.
  - It is `role="img"` with an aria-label listing every state's figure, inside a `<figure>` whose figcaption is the legend. The same numbers are in the tiles.
  - Labels use `--brand-ink`. The frame is a size container:
    - 540px and wider: code, figure and "at least" at 17, 28 and 17 units;
    - narrower: the figure words drop and codes and figures grow (23/30, then 31/38 below 400px), so no label renders under 12px at any width.
- **Tables.**
  - The notable, full round and compare tables are real `<table>`s with `th scope="row"` and stack into label–value cards at 640px and below.
  - The full round table (every listed occupation, spec 6.4 item 4) sits after the notable table in a closed `<details>`, so the visible layout matches the mockup.
  - The nominations table keeps its own horizontal scroll.
- **MRZ.** `aria-hidden`. The figures are in a `<dl>`.
- **Cut-off moves.**
  - With data, they sit in the movers section beside the pool moves, in a 2×2 grid.
  - On a round-only page (movers null), they sit beside the columns in the 189 section.
- **Data-only months.** The 189 section shows "The 189 pool", the no-round sentence with a link to the last round's recap when one exists, then the pool, notable and not-listed parts.

Tokens:
- `--updates-map-1..4` in `globals.css` as `light-dark()` (mockup `--map-*` values). The `@supports not` fallback is updated, and `palette.test.ts` confirms it equals `lightFallback(themed)`.
- `UPDATES_MAP` in `palette.ts` and `UPDATES_MAP_DARK` in `palette-dark.ts` (a `ListTwin` type keeps the lengths in step).
- Mirror assertions in `palette.test.ts`.
- `text-pairs.ts` gains "updates map label on band 1–4" (shell ink on each fill) for both themes (R23). Lowest contrast: 6.05 light and 5.04 dark.
- Everything else reuses existing tokens (`--brand-*`, `--homepage-lede/rule/code-fill/bar/strong/map-*`, `--label-long-wait-ink`, `--saffron` for lines only). `colour-literals.test.ts` passes.

`occupationPages` is now required (carry-forward):
- `RecapContext.occupationPages` is a required `ReadonlySet<string>`.
- Tests pass `pagesFor(...facts)`, a new fixture helper in `__fixtures__/occupation-pages.ts`; tests can't read the live index (R8).
- A new test checks that an occupation without a page stays unlinked.
- `occupationLinker`'s own parameter stays optional for its unit tests.

## Tests and checks

- `npm run check`: Prettier, ESLint, tsc and Vitest all pass. 161 files, 1660 tests.
  - The only lint output is the known warning from the untracked `.superpowers/brainstorm/.../lib.js` (deferred in Task 4).
- New tests:
  - `src/components/updates/stamps.test.tsx`: both stamps render with `renderToStaticMarkup` under vitest, with the aria-label and word lines; two stamps get distinct filter ids; both stamp files have no `@/` import, CSS module or client code.
  - `recap-view.test.ts`: "links only occupations that have a page".
  - `palette.test.ts`: the map token mirror and the four label pairs.
- `npm run build` passes. `out/updates/2026-10/index.html`:
  - one `<h1>`;
  - canonical `https://migratelens.com/updates/2026-10/`;
  - title "SkillSelect October 2026 update: 189 round, 190 and 491 by state | MigrateLens";
  - JSON-LD types Article, Dataset, FAQPage and BreadcrumbList;
  - `og:image` `/og.png`, since no social image exists yet.
- Browser checks: the built `out/` served by `python3 -m http.server` on 127.0.0.1:3047, headless Chrome via puppeteer-core, server stopped afterwards.
  - 1280 and 390, light and dark: `scrollWidth == innerWidth`, no text under 12px, 0 animations. The text check walks every visible text node; SVG text is scaled by its CTM and `.sr-only` is skipped.
  - Same result at 360, 600, 768, 1000 and 1100 (light).
  - With the full round table open at 390, scrollWidth is still 390.
- Lighthouse (local, python server, so no performance numbers): accessibility 100 and SEO 100 on mobile and desktop. Best practices is 96: see concern 1.

Screenshots (full page) are in `.superpowers/sdd/2026-11-24-monthly-updates-1-recap-pages/task-12-screens/`:
- `recap-1280-light.png`
- `recap-1280-dark.png`
- `recap-390-light.png`
- `recap-390-dark.png`

Compared with `screens/recap-*.png`, the layout and order match. Differences:
- Map labels are larger on desktop, and on phones show only codes and figures (12px floor).
- The section and passport stamps are drawn larger (116px and 230px, for the same floor).
- The newly listed list shows all 22 names, not 7 plus "and 15 more".
- Movers have four cards in a 2×2 grid (the mockup showed three).
- The full round table is added behind a disclosure.
- Bands alternate strictly, so movers is desk and compare paper.
- The CTA stamp ink is `--brand-on-dark`. The mockup's light sage has no token that survives the panel's `color-scheme: light`.

## Concerns

1. Best practices is 96 because the breadcrumb's `<Link href="/updates/">` prefetch returns 404 (`/updates/__next._tree.txt`). Task 13 adds `/updates/`, which clears it. Check it in Task 13's Lighthouse run.
2. The page uses wording from the view-model that's already on the founder review list ("Highest published minimum", "none recorded"). Two strings are new in components:
   - "The 189 pool" (the h2 on a data-only month);
   - "Read that round’s update" (the link after the no-round sentence).
   Both pass `BANNED_COPY` and the copy sweep (they aren't in the view, so the sweep doesn't see them).
3. The FAQ heading "{Month YYYY} SkillSelect questions" and the CTA copy are taken verbatim from the mockup and written in components, not the view-model.
4. Tiles stack in one column at 420px and below, which makes the 190 and 491 sections long on phones. Two columns would wrap the detail text heavily. This is a judgement call.
