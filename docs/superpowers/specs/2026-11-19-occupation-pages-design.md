# Occupation pages and SEO foundation: design (roadmap step 4, tier 1)

Date: 19 Nov 2026. Mockup: `.superpowers/brainstorm/occupation-pages-2026-11-19/` (round cards chosen for the 189 rounds). Founder decisions: build the occupation pages now; the domain is being bought (the founder will say which); the site stays hidden from search engines until the founder launches.

## Why

Nobody can find MigrateLens yet. People search for their occupation ("Software Engineer 189 cut-off", "is 85 points enough for nurse"); a page per occupation that answers that from official data, then hands them to the free check, is the main route to visitors (STRATEGY roadmap step 4). Paid features come after there are visitors.

## Goals

- A statically generated page for every occupation with published data (479 of 493), answer first, every number dated and sourced, each page different because its numbers are.
- An A–Z occupations index with search, linked from the main navigation.
- The SEO plumbing: canonical URLs from one site setting, unique titles and descriptions, a sitemap, a robots file, structured data (Dataset, FAQPage, BreadcrumbList), and "last updated" stamps.
- Thin pages (every count published as "<20": 192 occupations) exist but are never indexed and are left out of the sitemap.

## Non-goals (later)

- Tier 2 deep pages for about 30 occupations; per-occupation share images (pages use the site's `og.png`); `llms.txt`; the "Tell me when this changes" alert sign-up (founder has not chosen an email service; the sidebar leaves room for it); going live (domain, hosting and removing `noindex` are the founder's call).

## Anti-goals

- No forecasts, chances, "should" or visa recommendations (STRATEGY "Data, not advice"; `BANNED_COPY`). "Is N points enough?" is answered only from history.
- No masked "<20" collapsed to a number; no `null` cut-off read as zero; counts are EOIs, never people.
- No page that claims more than its data: an occupation without 189 data says so and leads with 190/491.

## Approaches considered

1. **Static pages generated from the checked-in dataset (chosen).** `app/occupations/[slug]/page.tsx` with `generateStaticParams` over the occupation index, Server Components reading `load-server.ts`, pure view-models in `src/lib/occupation-page/`. Fits the static export, no new infrastructure, pages refresh with each monthly data import and build.
2. A single client page that fetches the occupation JSON. Rejected: search engines and AI crawlers would see an empty shell.
3. Pages for only the top occupations. Rejected for tier 1: the long tail is where an honest, specific page wins; tier 2 adds depth to the top ones later.

## Design

### Addresses

- Page: `/occupations/<slug>/` where slug is the kebab-cased name plus the code, e.g. `/occupations/software-engineer-261313/`, `/occupations/registered-nurses-nec-254499/`. The code makes it unique and stable; a pure `occupationSlug(entry)` and `codeFromSlug(slug)` round-trip.
- Index: `/occupations/`.
- Only occupations with `hasData` get a page; the index lists the other 14 without a link ("No published data").

### One site setting

`src/lib/site.ts`: `SITE_URL` (placeholder until the domain is bought, then one line to change) and `SITE_INDEXABLE = false`. While false, every page keeps `noindex` and `robots.txt` disallows everything; flipping it is the launch switch. Canonicals, sitemap URLs and JSON-LD URLs all come from `SITE_URL` via `metadataBase`.

### The occupation page, top to bottom

1. **Breadcrumb** (Occupations › unit group › occupation) and **H1** "{name} ({code})", subtitle "Australian skilled visas: 189, 190 and 491 EOIs, cut-offs and invitations · as at {Mon YYYY}".
2. **Status chips**: the 189 round status ("189: regular / occasional / no recent invitations", the report's `CHIP_LABEL` and tones), and "190 eligible" / "491 eligible" from the federal list (or "Not on the federal list for 190").
3. **What the data says** (dark box, as in the report), two or three sentences:
   - 189 rounds, occupation-level (no reader points): "189 hasn't listed {name} in its last four rounds; the last cut-off was {c} points, in {Mon YYYY}." / "189 listed {name} in each of (or k of) its last four rounds, at {lo}–{hi} points." / "189 hasn't listed {name} in any round we can read."
   - The 189 pool: "The 189 pool holds {total} EOIs; the most common score is {s} points ({n} EOIs)." The most common score ignores "<20" cells; when there is no 189 pool, the sentence is about 190 and 491 instead ("No 189 EOIs are published for {name}; the 190 pool holds {n} and the 491 pool {m}.").
   - EOIs like these: "Of the EOIs submitted in {month}, {invited} are invited and {lodged} have lodged a visa application." using the most recent submission month at least six months before the snapshot, with masked counts kept as "under 20 (so may be zero)". Left out when that month has no published EOIs.
   - Source line: "SkillSelect (Department of Home Affairs), snapshot {date} · counts are EOIs (one person can hold several) · updated monthly".
4. **Who's in the pool**: the three pool totals, and a bar chart by points with tabs for 189, 190 and 491 (all three rendered in the HTML; tabs only show one). "<20" bars are striped and labelled "under 20".
5. **189 invitation rounds: round cards** (founder's choice). The last eight rounds oldest to newest; a listed round shows its date and cut-off ("95 points") on a light slate card; a round that did not list the occupation is a dashed card reading "Not listed" in the not-open red. Four per row on phones. One sentence above: "Not listed in the last 4 rounds. When it was last listed ({months}), cut-offs were {lo} to {hi}." / "Listed in every one of the last 8 rounds, at {lo} to {hi} points. The latest cut-off was {c}."
6. **What happened to EOIs submitted each month**: the last 12 submission months for 189, a stacked bar each (invited, lodged, still waiting, on hold, closed) with a key and one sentence summarising the invited and lodged counts across those months. Masked segments are drawn as a thin striped sliver and the row's text gives "under 20".
7. **Sidebar**: the existing homepage try-it (`TryIt`) opened on this occupation, and "Check my points, free" to `/check/?occupation={code}`.
8. **State and territory nomination**: one row per state: on its 2026–27 list for 190 / 491 (from the imported NSW, QLD, SA and WA lists; "Rules being checked" for VIC, ACT, TAS and NT), who it is open to (living there / elsewhere in Australia / offshore, from the list cohorts), and EOIs in invited status for 190 as at the snapshot, summed across scores as an interval. Each state links to its official page. Federal eligibility comes only from the federal list.
9. **Common questions** (3, answered from data, also emitted as FAQPage JSON-LD):
   - "When did 189 last invite {name}?"
   - "Which states nominate {name}?"
   - "Is {s} points enough for {name} 189?" where {s} is the pool's most common score; answered with the recent cut-offs and the EOIs above that score, ending "Past cut-offs are history, not a promise." Left out without a 189 pool.
10. **Related occupations**: others in the same 4-digit ANZSCO unit group (by code prefix), up to six, linked.
11. **Footer line**: sources, "Last updated {checkedAt}", "General information, not migration advice. MigrateLens is not a registered migration agent."

### The index page

`/occupations/`: H1 "Occupations", a one-line explanation, a client-side search box over names and codes, and an A–Z list grouped by first letter, each linking to its page with its code. Added to the header navigation as "Occupations".

### Metadata and structured data

- Title: "{name} ({code}): 189, 190 and 491 EOIs and cut-offs, {Mon YYYY}"; description: the first two "What the data says" sentences, trimmed to about 155 characters at a word boundary.
- Robots: `noindex` when `SITE_INDEXABLE` is false or every pool count is "<20".
- JSON-LD per page: `Dataset` (name, description, `temporalCoverage`, `dateModified`, creator/source Department of Home Affairs, license CC BY 3.0 AU, `isAccessibleForFree`), `FAQPage`, `BreadcrumbList`. JSON-LD is serialised safely (escape `<`).
- `app/sitemap.ts` and `app/robots.ts` with `dynamic = "force-static"`: the sitemap lists the home, sample, states, methodology, the index and every indexable occupation page with `lastModified` from the manifest.

### Data and logic

- Pure, tested view-models in `src/lib/occupation-page/` (no React, no `fs`): summary sentences, pool bars, round cards, cohort bars, state rows, FAQ, related, metadata, JSON-LD. Reuse the report's helpers (`summarise189Rounds`, `CHIP_LABEL`, `formatCount`, `countInSentence`, interval arithmetic, `BANNED_COPY`) instead of re-implementing them.
- Pages are Server Components using `load-server.ts`; only the pool tabs, the index search and the try-it are client components.
- Copy follows `src/lib/report/copy.ts`; every string a page renders is checked against `BANNED_COPY` in tests.

### Quality bar

- Tests for every view-model with fixtures and with the real Software Engineer (261313), Registered Nurses nec (254499) and an all-"<20" occupation; slug round-trip; sitemap excludes noindex pages; every generated page has a unique title and description.
- `npm run check` and `npm run build` pass; the build generates 479 occupation pages; brand tokens, the 12px floor, 16px mobile running text, AA contrast, print visibility and reduced motion as elsewhere; checked in a browser against `out/` at 1440 and 390 for the two example occupations, an all-"<20" one and one without a 189 pool.

## Left to the builder

Component structure and file split within the engineering limits, exact spacing and chart proportions within the brand system, and the index page's search behaviour details.

## Settled after the builder check (Claude's calls, from the code and data)

1. **Rounds.** Every window (last four for sentences, last eight for the round cards) counts the entries of `core.rounds189`, the rounds the importer could read, newest first. The rounds the importer skipped (`rounds.json` `skipped`: 2021–22 unit-group tables and one table without an Occupation column) are not cards; all of them are older than the eight-round window today. A `null` cut-off is "Not listed".
2. **Data per page.** The state rows use `core.stateInvited["190"][state][asAt]` (EOIs in invited status as at the snapshot, by score), summed as an interval. The cohort section and the "EOIs like these" sentence need the detail file, so each page loads both `<code>.json` and `<code>.detail.json` through `load-server.ts` at build time; a missing detail file leaves those two parts out and fails nothing.
3. **Before launch.** Pages emit canonicals and JSON-LD from the placeholder `SITE_URL` (harmless while every page is `noindex`); `sitemap.xml` lists the pages that are indexable by content (not all "<20"), so it is ready at launch; `robots.txt` disallows everything and points to the sitemap until `SITE_INDEXABLE` is true. Tests check the sitemap against the content rule, and that `robots` follows the switch.
4. **Unit group.** The manifest's `group` is `null` for all 493 occupations and no ANZSCO unit-group titles are in the repo, so the breadcrumb is Occupations › {name}, and "Related occupations" are those sharing the first four digits of the code, headed "Related occupations (ANZSCO unit group {first four digits})".
5. **Slugs.** Names are unique; slugs lower-case, turn any run of non-alphanumeric characters (including "'" in "Ship's Master") into one hyphen, and end with the code. The 14 occupations without data get no page (a request for one is the site's 404); the index lists them without a link.
6. **Licence.** `docs/DATA.md` records the SkillSelect material as reused under CC BY 3.0 AU; the Dataset JSON-LD cites that licence and attributes the Department of Home Affairs.
7. **"EOIs like these" month.** The `detail.cohorts["189"]` key for the month six months before `asAt` (Apr 2026 for Oct 2026); the sentence is left out when that month has no rows, and masked counts stay "under 20 (so may be zero)".
8. **Navigation.** `SiteHeader` (`src/components/site-header.tsx`) is shared by `layout.tsx`, so "Occupations" is one link there.
