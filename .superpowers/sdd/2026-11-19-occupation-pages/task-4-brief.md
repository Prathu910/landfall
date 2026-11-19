### Task 4: Questions, related occupations, metadata, JSON-LD and the sitemap rule

**Files:**

- Create: `src/lib/occupation-page/faq.ts`, `faq.test.ts`, `src/lib/occupation-page/meta.ts`, `meta.test.ts`

**Interfaces:**

- Consumes: `StateRow` (Task 3), `occupationPath`, `SITE_URL` (Task 1), `mostCommonScore` (Task 2).
- Produces (in `faq.ts`):
  - `export type Faq = { question: string; answer: string }`
  - `occupationFaq(core: OccupationCore, rows: StateRow[]): Faq[]`
- Produces (in `meta.ts`):
  - `relatedOccupations(code: string, index: OccupationIndexEntry[], limit = 6): { code: string; name: string; path: string }[]` (same first four digits, `hasData`, not itself, by code)
  - `isIndexable(core: OccupationCore): boolean` (false when no pool, or every pool total and score count is `"<20"`)
  - `pageTitle(core: OccupationCore): string`, `pageDescription(summary: string[]): string`
  - `occupationJsonLd(core: OccupationCore, faq: Faq[], summary: string[], checkedAt: string): object[]`
  - `sitemapEntries(cores: OccupationCore[], index: OccupationIndexEntry[], checkedAt: string): { url: string; lastModified: string }[]`

- [ ] **Step 1: Write the failing tests:**
  - FAQ for 261313: three questions, in order `"When did 189 last invite Software Engineer?"`, `"Which states nominate Software Engineer?"`, `"Is 75 points enough for Software Engineer 189?"`. The first answer contains `"7 Nov 2024"` and `"95 points"`. The third contains `"no recent cut-off"` and the count of EOIs above 75 from `poolPosition(core, null, "189", 75, null).higher` formatted with `formatCount`, and ends `"Past cut-offs are history, not a promise."`
  - FAQ for 254499: the third question is `"Is 70 points enough for Registered Nurses nec 189?"` and its answer contains `"70 to 80 points"`; the second names `"Victoria"` as the state with the most 190 invitations.
  - FAQ for `no189PoolCore` has two questions and none mentions points enough.
  - `relatedOccupations("261313", index)` codes start `"2613"`, exclude `"261313"`, and contain `"261312"`.
  - `isIndexable` is `true` for 261313 and `false` for `allMaskedCore`.
  - `pageTitle(core261313)` is `"Software Engineer (261313): 189, 190 and 491 EOIs and cut-offs, Oct 2026"`; `pageDescription` is at most 160 characters, ends at a word boundary, and adds `"…"` only when it trimmed.
  - `occupationJsonLd` returns `Dataset`, `FAQPage` and `BreadcrumbList` objects; the Dataset's `license` is `"https://creativecommons.org/licenses/by/3.0/au/"`, its `creator` names the Department of Home Affairs, and every URL starts with `SITE_URL`.
  - `sitemapEntries` includes `SITE_URL + "/occupations/"` and 261313's page, excludes `allMaskedCore`'s page, and every URL ends in `/`.
  - All FAQ strings pass `BANNED_COPY`.
- [ ] **Step 2: Run** the two test files; expect failures.
- [ ] **Step 3: Implement.** JSON-LD is plain objects; serialisation happens in the page (Task 6).
- [ ] **Step 4: Run** the tests and `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(occupation-page): questions, related occupations, metadata and sitemap rules`.

