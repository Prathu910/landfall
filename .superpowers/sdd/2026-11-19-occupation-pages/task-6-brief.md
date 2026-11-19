### Task 6: The routes: occupation page, index, navigation, sitemap and robots

**Files:**

- Create: `src/app/occupations/[slug]/page.tsx`, `src/app/occupations/page.tsx`, `src/components/occupation/occupation-search.tsx` (client), `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/robots.test.ts`
- Modify: `src/components/site-header.tsx` (add `["/occupations/", "Occupations"]` first in `links`)

**Interfaces:**

- Consumes: everything above; `loadManifest`, `loadOccupationCore`, `loadOccupationDetail`; `occupationIndex`; `stateRuleData`; `TryIt`.

- [ ] **Step 1: Write the failing test** `robots.test.ts`: the default export of `src/app/robots.ts` returns rules disallowing `/` for every user agent while `SITE_INDEXABLE` is false, and a `sitemap` of `SITE_URL + "/sitemap.xml"`.
- [ ] **Step 2: Implement the occupation route:** `generateStaticParams` returns `{ slug: occupationSlug(e) }` for every index entry with `hasData`; `dynamicParams = false`; `generateMetadata` gives `pageTitle`, `pageDescription`, `alternates.canonical` (`occupationPath`) and `robots` `noindex` when `!SITE_INDEXABLE || !isIndexable(core)`. The page renders, in the spec's order: breadcrumb, H1 and subtitle, `OccupationSummary`, `PoolTabs`, `RoundCards` (only with a 189 pool), `CohortBars` (only with rows), a sidebar with `TryIt defaultOccupation={code}` and a "Check my points, free" link to `/check/?occupation={code}`, `StateTable`, `OccupationFaq`, `RelatedOccupations`, and the sources line with "Last updated {formatDate(manifest.checkedAt)}" and "General information, not migration advice. MigrateLens is not a registered migration agent." JSON-LD goes in one `<script type="application/ld+json">` per object, serialised with `<` escaped as `<`.
- [ ] **Step 3: Implement the index:** H1 "Occupations", one sentence on what each page shows, `OccupationSearch` filtering by name or code, and an A–Z list grouped by first letter; occupations without data are listed without a link and marked "No published data". Metadata title "Occupations: 189, 190 and 491 data for every skilled occupation".
- [ ] **Step 4: Implement** `sitemap.ts` (`dynamic = "force-static"`, `sitemapEntries` over every `hasData` core) and `robots.ts` (`dynamic = "force-static"`, disallow all while `SITE_INDEXABLE` is false, allow all otherwise, sitemap URL either way); add the header link.
- [ ] **Step 5: Run** `npm run check` and `npm run build`; expect PASS, `out/occupations/` holding 479 page folders plus `index.html`, and `out/sitemap.xml` and `out/robots.txt` present. Count with `ls out/occupations | wc -l` (480).
- [ ] **Step 6: Commit** `feat(occupation-page): occupation pages, index, sitemap and robots`.

