### Task 12: The recap page

**Files:**

- Create: `src/app/updates/[month]/page.tsx`, `src/app/updates/[month]/page.module.css`, `src/components/updates/` (`recap-hero.tsx`, `passport-panel.tsx`, `round-stamp.tsx` and `rect-stamp.tsx` (pure SVG, no CSS-module import, `className` prop; Plan 2's cards reuse them), `round-section.tsx`, `pool-chart.tsx`, `notable-table.tsx`, `state-section.tsx`, `state-recap-map.tsx` (static, from `atlas-map-geometry.json`, like `src/components/states/state-map.tsx`), `movers-section.tsx`, `compare-section.tsx`, `recap-cta.tsx`, `recap-method.tsx`, `recap-faq.tsx`), each with its CSS module
- Modify: `src/app/globals.css` (four `--updates-map-1..4` fill tokens, values from the mockup's `assets/brand.css` `--map-*`; regenerate the fallback block), `src/lib/brand/palette.ts`, `src/lib/brand/palette-dark.ts`

**Interfaces:**

- Consumes: `buildRecapView`, `recapTitle`, `recapDescription`, `recapJsonLd` (Task 11); `listRecapMonths`, `loadRecap` (Task 10).
- Route: `generateStaticParams` returns `{ month }` for each facts file; `dynamicParams = false`; metadata has the title, description, canonical `/updates/<month>/`, `openGraph.images` = `/social/<month>/og.png` when that file exists in `public/`, else `/og.png` (Plan 2 renders it).

- [ ] **Step 1:** Build each component from its view slice, following the mockup's order and layout; MRZ `aria-hidden`; the map is a text-labelled figure with its numbers also in the tiles; tables are real `<table>`s and stack on phones; the CTA links `/check/` and `/sample/`.
- [ ] **Step 2: Run** `npm run check` and `npm run build`. Expected: `out/updates/2026-10/index.html` exists, has one `<h1>`, the canonical, three JSON-LD types plus `Dataset`.
- [ ] **Step 3: Browser check** the built page (`python3 -m http.server 3017 --bind 127.0.0.1 --directory out`, visual check only; performance numbers come from `npm run lighthouse`) at 1280 and 390 px, light and dark, against `screens/recap-*.png`: no horizontal scroll, no text under 12 px, stamps static.
- [ ] **Step 4: Commit** `feat(updates): /updates/YYYY-MM/ recap page`.

