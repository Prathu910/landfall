# News index and onshore visa charge article

Approved scope: the founder requested a news index with an article card and an easy-to-read, illustrated, SEO-ready article using the existing MigrateLens theme. The reel's agreed destination is `/news/onshore-visa-fee-increase-2026/`.

## Experience

- `/news/` introduces Australian visa news and lists the one real article. Its entire card links to the detail page; no invented stories or empty categories.
- The article leads with the effective date, additional AUD 1,500 per affected applicant, and the three standard main-applicant examples. An accessible comparison table gives the same figures as its graphic.
- Sections explain the affected visa groups, conditional exemptions, per-applicant family effect, applications made before commencement, and the difference between this charge and 189/190/491 fees. A separate note covers the instrument's specified subclass 202 adjustment.
- An in-page contents list, short paragraphs, visible sources and a reviewed date support reading and fact checking. Relevant guide links and the official estimator provide useful next steps.
- Reuse Archivo, white paper, sage surfaces, green emphasis, passport linework, and existing light/dark tokens. Graphics are code-native and source their numbers from the same typed data as the table.

## Architecture and SEO

Static Server Components; no new client JavaScript. Hand-sourced fee data and article metadata live in `src/data/news/`; small pure helpers and tests live in `src/lib/news/`. Route files compose feature components and export metadata.

Use the existing typed JSON-LD builders for NewsArticle, CollectionPage and breadcrumbs. Add unique titles/descriptions, canonical trailing-slash URLs, dated Article Open Graph metadata, a generated 1200×630 PNG, sitemap entries, navigation/footer discovery, and `/llms.txt` discovery. News stays separate from the monthly SkillSelect `/updates/` pages.

## Evidence and validation

Primary sources: F2026L01607 as made, its explanatory statement, the 13 November 2026 compilation's Schedule 1 fee tables (items 1124B, 1222 and 1229), and the Home Affairs estimator. Amounts are AUD, examples exclude other charges and concessions, and affected subclasses alone never imply every applicant pays.

Run the repository checks and static build. Verify desktop, 390px mobile, dark mode and reduced motion against the production export. Add both routes to the Lighthouse page matrix and audit the changed page types. Work stays on `feat/news-visa-fees` for review; no production release is part of this request.
