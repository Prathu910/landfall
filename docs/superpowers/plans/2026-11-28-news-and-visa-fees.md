# MigrateLens news implementation plan

**Goal:** Build the agreed news index and sourced onshore visa fee article, with graphics, search metadata and a verified local preview.

**Architecture:** Static Next.js routes compose Server Components. Typed hand-sourced article data supplies graphics, fee tables, cards and SEO. Existing shared theme tokens handle both colour schemes.

## 1. Evidence, catalogue and SEO contracts

- [x] Confirm the commencement, applicant scope, exemptions and three standard base fees against government sources.
- [x] Add `src/lib/news/news.test.ts` covering the approved route, linked index card, exact fee examples, official source provenance, NewsArticle/breadcrumb/collection schema, and sitemap dates. Observe its failure before implementing the modules.
- [x] Implement `src/data/news/onshore-visa-fee-increase-2026.ts`, `src/lib/news/catalogue.ts` and `src/lib/news/meta.ts`; extend the shared typed JSON-LD helper for news articles.
- [x] Run `npx vitest run src/lib/news/news.test.ts` and confirm all contracts pass.

## 2. Pages and illustrations

- [x] Create `src/components/news/` components for the reusable fee artwork, linked article card, comparison table, contents and article sections, with adjacent CSS Modules.
- [x] Create `src/app/news/page.tsx` and `src/app/news/onshore-visa-fee-increase-2026/page.tsx`. Use one h1, semantic article/table/figure markup and visible source links.
- [x] Add `scripts/news/render-og.ts` to render the article's share PNG using the site's own fonts, logo and data. Run it before the production build.

## 3. Site integration

- [x] Link News from the shared navigation and footer. Add the index and article to `src/app/sitemap.ts`, `src/lib/seo/llms-txt.ts` and `scripts/lighthouse/pages.ts`.
- [x] Record the founder's news-section and route decisions in `docs/STRATEGY.md` and add the implementation/validation handoff to `docs/HANDOFF.md`.

## 4. Verification and review

- [x] Format changed files, run `npm run check`, and run `npm run build`; investigate failures before claiming completion.
- [x] Serve `out/` locally. Use the Playwright CLI to follow the news card, check both URLs, inspect metadata/structured data, and verify 1440px, 390px, dark mode and reduced motion. Save evidence under `output/playwright/`.
- [x] Run Lighthouse for the new page types and shared navigation pages. Resolve any new accessibility, SEO or performance regression.
- [x] Request an independent code/content review, resolve actionable findings, and report the branch, preview URLs and verification evidence.

## Verification evidence — 28 November 2026

- `npm run check`: formatting, lint, TypeScript and 2,391 tests passed (250 files).
- `npm run build`: 522 routes exported; both News routes present; bundle lock passed.
- The final export's canonical URLs, one-h1 structure, descriptions, NewsArticle/CollectionPage/breadcrumb/FAQ schema, sitemap entries, `/llms.txt` and 1200×630 share image passed explicit checks.
- Playwright CLI verified the index card opening the detail route, 1440px desktop, 390px mobile, the shared header at 1041px, light/dark themes and reduced motion. No horizontal page overflow; mobile fee table fits.
- Lighthouse on the final build: both new routes score 100 in Performance, Accessibility, Best Practices and SEO on mobile and desktop (medians of three runs); dark accessibility 100 on both form factors. Evidence: `output/playwright/news-lighthouse-final.json`.
- Independent review found no factual or SEO defects. Its mobile 16px paragraph finding was fixed; browser review also corrected the global serif-heading override so News uses Archivo consistently.
- Shared-header smoke audit: homepage 100 in all four Lighthouse categories on mobile and desktop (one run each), after adding News. Evidence: `output/playwright/news-shared-header-lighthouse.json`.
- Source and publishing work remain on `feat/news-visa-fees`; production has not been deployed.
