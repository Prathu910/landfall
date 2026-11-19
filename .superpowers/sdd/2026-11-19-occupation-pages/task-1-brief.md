### Task 1: Site settings, slugs and occupation paths

**Files:**

- Create: `src/lib/site.ts`, `src/lib/occupation-page/slug.ts`, `src/lib/occupation-page/slug.test.ts`
- Modify: `src/app/layout.tsx` (metadata `robots` and `metadataBase` from `site.ts`)

**Interfaces:**

- Produces: `SITE_NAME = "MigrateLens"`, `SITE_URL = "https://migratelens.com"` (placeholder until the founder confirms the domain), `SITE_INDEXABLE = false`; `occupationSlug(entry: { code: string; name: string }): string`; `codeFromSlug(slug: string): string | null` (the trailing 6-digit code, else null); `occupationPath(entry): string` (`/occupations/<slug>/`).

- [ ] **Step 1: Write the failing tests** in `slug.test.ts`:
  - `occupationSlug({ code: "261313", name: "Software Engineer" })` is `"software-engineer-261313"`; `{ code: "254499", name: "Registered Nurses nec" }` is `"registered-nurses-nec-254499"`; `{ code: "231213", name: "Ship's Master" }` is `"ship-s-master-231213"`; `{ code: "1", name: "  A, B / C  " }` has no leading, trailing or doubled hyphens.
  - `codeFromSlug("software-engineer-261313")` is `"261313"`; `codeFromSlug("software-engineer")` and `codeFromSlug("")` are `null`.
  - Every entry of `src/data/occupation-index.json` round-trips: `codeFromSlug(occupationSlug(e)) === e.code`, and all slugs are unique.
  - `occupationPath({ code: "261313", name: "Software Engineer" })` is `"/occupations/software-engineer-261313/"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/occupation-page/slug.test.ts`; expect failures (module missing).
- [ ] **Step 3: Implement** `site.ts` and `slug.ts` (lower-case, every run of non-alphanumerics becomes one hyphen, trim hyphens, append `-<code>`). In `layout.tsx` set `metadataBase: new URL(SITE_URL)` and `robots: SITE_INDEXABLE ? { index: true, follow: true } : { index: false, follow: false }`.
- [ ] **Step 4: Run** the test file, then `npm run check`; expect PASS.
- [ ] **Step 5: Commit** `feat(seo): site settings and occupation slugs`.

