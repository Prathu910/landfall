# Monthly SkillSelect updates: recap pages, Instagram cards and an approval-gated data pipeline (design)

Date: 24 November 2026. Status: founder decisions recorded, including the founder's answers to the first open questions and the builder-check results (both 24 Nov 2026); written design for the builder.

Approved mockups: `.superpowers/brainstorm/round-recap-2026-11-24/` (`index.html` gallery, `page/updates-2026-10.html` recap page, `instagram/card.html` and its PNGs, `data/extract.py` → `data/figures.json`). `notes.md` there lists every figure, its source and the data caveats; this document carries those caveats into rules. The mockups are the visual and copy reference. Where this document and a mockup disagree, this document wins.

Each decision below is marked either **Founder** (decided on 24 Nov 2026) or **Claude's call** (proposed by Claude from the code and data; the builder may revise a Claude's call with a reason, but not a Founder decision).

## 1. Intent

The founder wants two things:

1. **Traffic.** An Instagram page for MigrateLens that posts Australian PR content every month, pointing people to the free points check. Instagram content needs fresh, specific, dated numbers.
2. **Fresh data without manual work.** Today a new SkillSelect month only reaches the site when someone remembers to run `npm run data:import`, review it and commit it (`docs/DATA.md`, "Running an import"). The dataset is still the October 2026 snapshot. The site's value (occupation pages, the report, the guide) decays every month it is stale.

The founder must approve every data change before it goes live. So the work is: **a scheduled job prepares each month's update as a pull request; the founder reads a plain-English summary, looks at the recap page and the Instagram images, and merges; Cloudflare Pages deploys as it does today.**

Each update also produces a public **recap page per data month** (`/updates/2026-10/`), which serves the roadmap's content-engine step ("recap pages within 24 hours of each invitation round", `docs/STRATEGY.md` step 6) and gives Google and AI answer engines a dated, citable page for searches such as "SkillSelect October 2026" or "189 invitation round October 2026".

## 2. Goals, non-goals, anti-goals

**Goals**

1. When SkillSelect publishes a new as-at month, a pull request with the imported data, the recap page and the Instagram images is open within about a day, with no one running anything.
2. When Home Affairs publishes a new 189 invitation round, a pull request adds the round to the site and to that month's recap within about a day.
3. When a state nomination page or a fee page we cite changes, the founder gets a GitHub issue naming the page and showing what changed. Nothing on the site changes by itself.
4. One recap page per data month at `/updates/YYYY-MM/`, plus an `/updates/` index, covering 189, 190 and 491: pool by points, invitations by points, 190 and 491 invitations by state, and 189 round results.
5. A carousel of Instagram images per month in Look A, "Passport page", light and dark, drawn from the same view-model as the recap page, so an image and the page can never show different numbers.
6. Nothing goes live without the founder merging a pull request. A failed import, validation or check never opens a pull request.

**Non-goals (later, or never in this step)**

- Daily data refresh. The dashboard publishes monthly; a daily import would add nothing.
- Generated reel videos. Carousels first; reels are a later step.
- Automatic posting to Instagram, or any Instagram API, token or account automation.
- Automatic edits to state rules, state lists or fees. The page watcher only opens issues. (Folding `npm run data:state-lists` into the monthly pull request is a sensible later step; it is not in this design.)
- Email alerts to users ("tell me when my occupation is invited"): needs an email service the founder has not chosen.
- Refreshing the `/sample/` reports. They stay frozen on the 2026-10 snapshot and are refreshed only when the founder asks, never by the monthly job (Founder; section 6.14).

**Anti-goals**

- No auto-deploy. No Cloudflare API keys and no deploy secrets in GitHub. No Supabase involvement (Supabase is only for form submissions).
- No invented or narrowed numbers: no "<20" collapsed to a value, no INVITED summed across months or visas, no state totals presented as exact, no percentage chances, no guessed date for the next round.
- No causal claims the data cannot support ("the pool fell because…").
- No advice. Every card set ends with "General information, not migration advice".

## 3. Constraints

- **Static export only** (`next.config.ts` `output: "export"`). Recap pages are statically generated Server Components; data is read at build through `load-server.ts`-style loaders.
- **Only scripts write `data/raw/` and `src/data/`** (`docs/ENGINEERING.md`). Everything the job writes comes from a script; nothing in `src/data/` is hand-edited, including the spotlight choice.
- **Importer rules stay binding** (`docs/DATA.md`, "Guardrail rules"): displayed `qText` only, at most 2 shown and 2 filtered detail fields, one As At Month per query, no variable changes except `vShow*`, at least 250 ms between calls, page-read budget 250 for a monthly import, never narrow a masked cell, never work around a block.
- **Number rules** (`docs/DATA.md`): "<20" is the interval 0–19; an absent row in a fetched view-month is zero, an unfetched month is "not published"; INVITED is a short-lived stock and a lower bound; visas and states are never added together; `ANY` is reported as "state not recorded", never added to a state; a `null` round cut-off is "not listed".
- **Copy rules**: `src/lib/report/copy.ts` `BANNED_COPY`; specific, dated, sourced; "EOIs", never "people" or "applicants".
- **Engineering**: `npm run check` and `npm run build` pass; Lighthouse 100 on the new page types; both themes; 12 px floor; tokens only (`src/app/colour-literals.test.ts`); pure view-models in `src/lib/` with tests; files within the readability limits.
- **Hosting**: Cloudflare Pages builds `main` on merge (`npm run build`, output `out`). GitHub Actions free minutes.
- **The repository is public** (Founder: `github.com/Prathu910/landfall`), so GitHub Actions minutes are free, and **everything the pipeline produces is public**: branches, data PRs and their summaries, draft captions and Instagram images before they are posted, issues, workflow logs and artifacts. Nothing private goes into any of them. Commits are made as the `github-actions[bot]` identity, not a personal email. The workflows trigger only on `schedule` and `workflow_dispatch` (which needs write access), never on `pull_request_target` or forked pull requests.

## 4. Approaches considered

**(a) GitHub Actions prepares, pull request approval, Cloudflare deploys on merge (chosen, Founder).** A scheduled workflow runs the existing TypeScript importer, validation, recap generation, image rendering, `npm run check` and `npm run build` on a GitHub-hosted runner, then opens a pull request. The founder's merge is the approval; Cloudflare's existing Git integration deploys `main`. No new hosting, no keys beyond the built-in `GITHUB_TOKEN`, and the repo stays the single source of truth. Cost: the founder must open and merge a pull request each month (and after each round).

**(b) Fully automatic GitHub Actions deploy (rejected).** The same job merges or deploys by itself. One bad month (a dashboard layout change the validator doesn't catch, a revision, a masked-count edge case) would publish wrong numbers to every occupation page, the report and Instagram before anyone looks. It also needs Cloudflare API credentials in GitHub. The founder requires approval of every data change.

**(c) Supabase scheduled Edge Functions (rejected).** Edge Functions run Deno with short time limits. They cannot run the importer (about 200 page reads over a websocket, tens of minutes), `next build`, the test suite or headless Chrome, and the data must end up committed to this repo anyway because the site is a static export built from `src/data/`. It would also put the data pipeline on infrastructure reserved for form submissions.

**(d) Manual monthly updates by Claude sessions (rejected).** Works today, but depends on someone remembering, in the right week, every month and after every round. Rounds come at irregular dates. The point of the feature is that freshness doesn't depend on memory.

**Smaller choices (Claude's calls)**

- **Freeze each recap's facts in a file, rather than recomputing old months from raw history.** Recomputing `/updates/2026-10/` after the November import would let later revisions, round re-parses or code changes silently alter numbers on a page that Instagram has already quoted. A frozen facts file per month keeps citable numbers stable (a stated AEO goal in `docs/STRATEGY.md`) and makes the build cheap. See 6.3.
- **Render images with puppeteer-core, not the Chrome `--screenshot` flag used by `scripts/og-image/`.** The cards need `document.fonts.ready`, a check that each face loaded, and an overflow check before the screenshot (the mockup's `render.mjs` does all three). puppeteer-core is already present as a transitive dependency of Lighthouse; pin it as a direct dev dependency at an exact version.
- **Probe the dashboard for its newest As At Month rather than trying an import blind.** A cheap probe means 27 of 28 daily runs connect for a few seconds and exit, using no table page reads.

## 5. Decisions at a glance

| Decision                                                                                                                                                                                                                                                                                                                                                             | Who                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Approval flow: scheduled GitHub Actions job opens a PR; founder merges; Cloudflare deploys on merge. No Supabase, no Cloudflare keys.                                                                                                                                                                                                                                | Founder                                         |
| Covers 189, 190 and 491: pool by points, invitations by points, 190/491 invitations per state, 189 round results.                                                                                                                                                                                                                                                    | Founder                                         |
| One recap page per data month at `/updates/YYYY-MM/`, plus `/updates/`; a 189 round joins the page for its data month.                                                                                                                                                                                                                                               | Founder                                         |
| State counts shown as "at least N" (the floor of the interval).                                                                                                                                                                                                                                                                                                      | Founder                                         |
| Instagram Look A, "Passport page", for all cards; feed 1080×1350 (cover, 189 round, 190 by state, 491 by state, occupation spotlight, closing card) and story/reel cover 1080×1920 in safe zones; light and dark; headless Chrome from templates fed by the recap view-model; saved under `public/social/YYYY-MM/`, linked from the PR; recap OG image from the set. | Founder                                         |
| Spotlight: biggest month-on-month change among the 20 most popular occupations; swappable before merge.                                                                                                                                                                                                                                                              | Founder (definitions in 6.8 are Claude's calls) |
| Carousels first; reels later; no automatic posting.                                                                                                                                                                                                                                                                                                                  | Founder                                         |
| `/sample/` stays frozen on the 2026-10 snapshot (`asOf` pinned), clearly dated; refreshed only on request, never by the monthly job.                                                                                                                                                                                                                                 | Founder                                         |
| An occupation that drops out of a new month's data keeps its page, with its last published data and "Not in the SkillSelect data since {Month YYYY}"; no 404.                                                                                                                                                                                                        | Founder (details in 6.17 are Claude's calls)    |
| Instagram handle `@migratelens` on the closing card; captions end with a few relevant hashtags.                                                                                                                                                                                                                                                                      | Founder                                         |
| If the step 0 spike shows the dashboard blocks GitHub-hosted runners: stop and ask the founder. No fallback to the founder's Mac.                                                                                                                                                                                                                                    | Founder                                         |
| The repo is public: Actions minutes are free, and every PR, issue, log and artifact is public.                                                                                                                                                                                                                                                                       | Founder                                         |
| A round-only recap shows round facts only; dashboard sections are added when the month's data arrives; the facts file has separate round and data sections, each frozen once written.                                                                                                                                                                                | Claude's call                                   |
| Every round is owned by the round job; the monthly import adds no rounds; a job that finds a data PR open adds its update to that PR.                                                                                                                                                                                                                                | Claude's call                                   |
| Daily probe in the first part of the month; full pipeline on a new month; PR summary; failure means no PR and an email.                                                                                                                                                                                                                                              | Claude's call                                   |
| 189 round job opens its own PR.                                                                                                                                                                                                                                                                                                                                      | Claude's call                                   |
| Daily page watcher for state and fee pages opens issues, never edits.                                                                                                                                                                                                                                                                                                | Claude's call                                   |
| Daily data refresh is a non-goal.                                                                                                                                                                                                                                                                                                                                    | Claude's call                                   |
| One-time setup: "Allow GitHub Actions to create and approve pull requests".                                                                                                                                                                                                                                                                                          | Claude's call                                   |
| Frozen recap facts per month; puppeteer-core; probe; at most one open data PR; image retention.                                                                                                                                                                                                                                                                      | Claude's call                                   |

## 6. Design

### 6.1 The pieces

```
GitHub Actions (scheduled, ubuntu-latest)
  monthly-data.yml   daily, days 1–28 → probe → import (no rounds) → data facts → month cards → check → build → PR
  round-189.yml      daily → read rounds page → new round? → rounds-only import → round facts → round cards → check → build → PR (owns every round)
  page-watch.yml     daily → fetch cited state/fee pages → normalise → compare → open or comment on an issue

Founder: reads PR summary + images + Cloudflare preview → merges (or closes)
Cloudflare Pages: builds main → migratelens.com (unchanged)
```

New code, by layer (names are suggestions; the builder may rename within the conventions):

- `scripts/import/`: a `--probe` command (newest As At Month), a `--rounds-only` mode, a `--keep-rounds` flag for the monthly import, round-page parsing of the totals table, tie-break dates and the state nominations table, and storage of each new round page's HTML.
- `scripts/updates/`: `generate.ts` (writes `src/data/updates/<YYYY-MM>.json`), `summary.ts` (writes the PR body), `retention.ts` (prunes old image sets).
- `scripts/social/`: `render.ts` and the card templates.
- `scripts/page-watch/`: `sources.ts` (collects every cited URL), `normalise.ts`, `watch.ts`.
- `src/lib/updates/`: pure facts builders and view-models shared by the page, the cards and the PR summary (`facts.ts`, `recap-view.ts`, `state-view.ts`, `movers.ts`, `spotlight.ts`, `faq.ts`, `meta.ts`, `cards.ts`, `summary-view.ts`), all with tests.
- `src/app/updates/page.tsx` and `src/app/updates/[month]/page.tsx`; components in `src/components/updates/`.
- `.github/workflows/` with the three workflows (the repo has no `.github/` today).

### 6.2 The data month (Founder)

- A recap is keyed by the **data month**: the SkillSelect as-at month (`manifest.asAt`, snapshot `skillselect-YYYY-MM-<last day>`). URL `/updates/YYYY-MM/`, e.g. `/updates/2026-10/`. Keywords go in the title, H1 and description, not the slug.
- A **189 round belongs to the data month of its date** (Australia/Sydney calendar month). The 15 Oct 2026 round belongs to `/updates/2026-10/`.
- Because a round is published around mid-month and that month's dashboard data appears around mid-next-month, a page usually goes live first with **the round only** (for example a mid-November round at `/updates/2026-11/` before November's data exists), then gains the dashboard sections when the month's data is merged. A month with no round gets a page from the dashboard data alone, whose 189 section says "No 189 round in {Month}; the last was on {date}" and links that month's recap.
- **A round-only recap shows round facts only** (Claude's call): the round date, the total invited, the lowest score invited for each listed occupation, tie-break dates, and the occupations listed in the previous round but not this one. It shows **nothing derived from the dashboard**: no pool, no "holding a 189 invitation", no pool columns in the occupation table, no pool figure in the passport panel. When the month's dashboard data arrives, those sections are **added**; the round facts already on the page never change. The order of arrival doesn't matter: a round added to a month that already has its data gets its round sections beside the existing data sections.
- Two rounds in one month: both appear, newest first.

### 6.3 Recap facts file (Claude's call)

`src/data/updates/<YYYY-MM>.json`, one per data month, written only by scripts: `npm run updates:generate -- --month YYYY-MM --section data [--spotlight <code>]` (monthly job) and `--section round --round YYYY-MM-DD` (round job). It holds the computed facts the page, the cards and the PR summary need, already reduced with the number rules in 6.13, with provenance. It has a header and **separate, independent sections** (Claude's call, from the builder check):

- **Header**: `schemaVersion`, `month`, `firstGeneratedAt`, `updatedAt` (Sydney date of the last section written).
- **`rounds[date]`**, one per 189 round in the month, written only by the round job, from round facts alone:
  - `generatedAt`, the round page URLs and their check date;
  - total invited per subclass as published in the Home Affairs totals table (189 only is shown);
  - every listed occupation with its lowest score invited and tie-break date (the full round table);
  - the cut-off distribution; the comparison with the previous parsed round (fell / rose / same counts, newly listed, listed before but not this time, the biggest moves);
  - `cardPicks`: the three occupations for card 2 (6.7), chosen from round facts only.
- **`data`**, written only by the monthly job, from the month's dashboard snapshot (plus, where it says so, the round facts already in the file):
  - `generatedAt`; `sources`: snapshot id and `checkedAt` for this month and the previous month, the federal list `checkedAt`.
  - `national[visa]`: SUBMITTED and INVITED for this and the previous month as intervals (sum across occupations within one visa and one month, masked cells kept as 0–19).
  - `pool189ByScore`: interval per score (from `pool.189.byScore`, latest month only; the raw data has no earlier month for this view, so there is no month-on-month by score).
  - `invitedByScore[visa]`: interval per score for this month.
  - `states[visa][state]` for 190 and 491, each of ACT, NSW, NT, QLD, SA, TAS, VIC, WA and `ANY`: the interval, its floor, the number of masked cells, the previous month's floor, and the top occupations by floor.
  - `nominations`: the Home Affairs "State and Territory nominations" table copied as published (text, including "<5"), with its program year and period, as stored in `rounds.json` at the time of the data import.
  - `movers`: the largest 189 pool changes with exact counts at both ends (an occupation is eligible only when neither month is masked).
  - `notable189`: the ten occupations listed in the month's latest round (or, with no round in the month, the latest round before it) with the largest 189 pools, with their pool and "holding a 189 invitation" figures; and `largePoolsNotListed` (occupations on the Home Affairs 189 list with large pools that the latest round didn't list, with their last listed round).
  - `spotlight`: code, `pickedBy: "auto" | "founder"`, the change that qualified it, and its card facts (6.8).
  - `occupationsAdded` / `occupationsRemoved` against the previous manifest.

Rules:

- **Each section is frozen once written** (once its PR is merged), so numbers already quoted on Instagram never change. A job only adds its own section; it never edits another section or an earlier month. Before merge, the open PR may regenerate its own section (the spotlight swap, 6.8). A test on every data PR compares each facts file with `main`'s copy and fails if a section that exists on `main` has changed.
- If an import finds a **revision** of a month whose `data` section is published, the PR summary says so under "Needs your decision", with the figures before and after. The published section is not changed unless the founder asks for a deliberate regeneration (a reviewed change that relaxes the frozen-section test for that one section).
- The view-model code renders every facts file in the repo, so code changes re-render old months with their frozen facts. A test renders all of them.
- Expected size: 20–60 KB a month (the full round table is most of a round section).

The `/updates/` index is built from the facts files present (a `load-server` helper lists `src/data/updates/`); no separate index file.

### 6.4 The recap page, top to bottom

Follow `page/updates-2026-10.html`. Facts drive every sentence. Each part below is marked **[R]** (rendered from a `rounds` section, so it appears on a round-only page) or **[D]** (rendered from the `data` section, so it appears only once the month's dashboard data is merged). A [D] part is simply absent until then; the page says once, under the hero, "SkillSelect's {Month} figures for pools and state invitations will be added here when they are published", with no date.

1. **Breadcrumb** Home › Updates › {Month YYYY}.
2. **Hero**: eyebrow "SkillSelect update · {Month YYYY}"; H1 "SkillSelect {Month YYYY}: {total} EOIs invited in the 189 round" (with a round) or "SkillSelect {Month YYYY}: 190 and 491 invitations by state" (without). Dated **direct answer** of 2–3 sentences: round-only, "On {date}, Home Affairs invited {total} EOIs for the 189 visa, across {k} occupations…"; with data, starting "As at {last day}:" and adding the state sentence. Dateline: Updated {updatedAt} · 189 round {date} [R] · Data as at {date} [D] · Sources checked {checkedAt}. Actions: "Check my points free" (`/check/`) and "Questions".
3. **Passport panel** (key figures): [R] round stamp ("SUBCLASS 189 ROUND · {total} INVITED · {date}"), occupations listed, lowest-score range; [D] 189 pool ("about N", with the range) and holding a 189 invitation ("at least N"); the MRZ line. A month with no round shows a data stamp instead ("SKILLSELECT · {MON YYYY} · AS AT {date}"). MRZ text is decorative: `aria-hidden`, the figures are in the panel's text.
4. **189**:
   - [R] the round lead; occupations by lowest score invited (columns); listed this round but not the previous one, and the reverse; the full round table (every listed occupation: lowest score invited, previous round, tie-break date), compact on phones; lowest score fell and rose against the previous round.
   - [D] the 189 pool by points (bars, published floor solid, masked remainder striped, "under N" labels); the notable table (the ten listed occupations with the largest 189 pools: lowest score invited, previous round, tie-break date, 189 pool, holding a 189 invitation); large 189 pools not listed (each on the Home Affairs 189 list, with "Not listed in the last N rounds; last listed {date} at {score}").
5. [D] **190 by state** and 6. [D] **491 by state**: the state map (homepage atlas geometry) with four shade bands, a tile per state ("at least N", or "under 20 for each occupation"; the occupation with the most; "+ N hidden small counts"), a "State not recorded" tile, and the Home Affairs nominations table labelled "A different measure" with its own period.
6. [D] **Biggest movers**: 189 pool fell or rose most (exact counts only), beside the [R] cut-off moves when the month has a round.
7. [D] **Month on month**: the national table (pool and holding an invitation, per visa, previous month and this month) and the four cautions from the mockup (invitations are a snapshot; visas are separate; a pool change isn't new interest; ranges come from hidden counts).
8. **Call to action** card (stamp "MIGRATELENS · FREE POINTS CHECK · 189 · 190 · 491"), links to `/check/` and `/sample/`.
9. **Method and sources**, linking `/methodology/`, naming only the sources of the sections shown.
10. **Questions** (3–5, all generated from facts, emitted as FAQPage): [R] when was the latest 189 round; [R] what was the lowest score invited (with one real example); [D] was {large not-listed occupation} invited (needs its pool); [D] which state gave the most 190 invitations (only when one floor is strictly above every other state's interval maximum; otherwise the question is left out, as on the occupation pages); is this migration advice.

Occupation names link to their occupation pages (`occupationSlug`). The page follows the site themes through tokens; stamps never animate; it is not a print target. Internal links end in `/`.

### 6.5 The `/updates/` index

H1 "SkillSelect monthly updates", one dated sentence ("The latest update covers SkillSelect data as at {date}"), the latest month as a large card (its stamp, headline and three figures), then every month newest first with its headline sentence and round date. Linked from the site footer ("Monthly updates", as in the mockup). Header navigation is unchanged (Claude's call).

### 6.6 SEO and structured data

- Title: "SkillSelect {Month YYYY} update: 189 round, 190 and 491 by state | MigrateLens" (no round: "SkillSelect {Month YYYY} update: 190 and 491 invitations by state | MigrateLens"). Description: the direct answer trimmed to about 155 characters at a word boundary. Canonical from `SITE_URL`.
- JSON-LD through `src/lib/seo/json-ld.ts` only: `Article` (headline, `datePublished` = `firstGeneratedAt`, `dateModified` = `updatedAt`, image = the OG image), `Dataset` (temporal coverage = the month, creator and source Department of Home Affairs, CC BY 3.0 AU; move the Dataset builder from `src/lib/occupation-page/meta.ts` into `json-ld.ts` so both pages share it), `FAQPage`, `BreadcrumbList`. The index gets `CollectionPage` with an `ItemList` and `BreadcrumbList`.
- `src/app/sitemap.ts` lists `/updates/` and every recap, `lastModified` = `updatedAt`. `Dataset` JSON-LD is emitted only once a page has its `data` section. All recap pages are indexable (`SITE_INDEXABLE` governs as elsewhere).
- OG image: `public/social/YYYY-MM/og.png`, 1200×630, rendered from the cover template (6.7).
- Add `/updates/` and the latest recap to `scripts/lighthouse/pages.ts`; both must score 100.

### 6.7 Instagram cards (Founder; rendering details Claude's calls)

**Set per data month**, all in Look A (guilloche paper, ink stamps, Archivo editorial type, MRZ line on the cover), following `instagram/card.html` and `card.css`:

| Card           | Size           | Content                                                                                                                                   |
| -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Cover        | feed 1080×1350 | "SkillSelect update · {Month YYYY}", three stamps (189 round total, 190 by state, 491 by state), swipe cue, MRZ                           |
| 2 189 round    | feed           | round facts only: total invited, occupations listed, cut-off distribution, three occupations with previous round, "not listed again" line |
| 3 190 by state | feed           | compact state map with floors, legend, "State not recorded: at least N", the hidden-counts note                                           |
| 4 491 by state | feed           | same for 491                                                                                                                              |
| 5 Spotlight    | feed           | the spotlight occupation (6.8)                                                                                                            |
| 6 Closing      | feed           | "Check your points free · migratelens.com", the handle `@migratelens`, and "General information, not migration advice"                    |
| Story cover    | 1080×1920      | the cover, laid out inside Instagram's safe zones                                                                                         |
| OG             | 1200×630       | the cover, for the recap page (light only, like the site OG)                                                                              |

- **Two sets, one per kind of PR** (Claude's call), each rendered once from its own frozen section, light and dark:
  - **Round set** (round job, `public/social/YYYY-MM/round-YYYY-MM-DD/`): a round cover (the round stamp only), card 2 and the closing card, plus the story cover: 3 × 2 + 2 = 8 PNGs. Posted within a day of the round.
  - **Month set** (monthly job, `public/social/YYYY-MM/month/`): the full cover, card 2 when the month has a round (the round set's files, reused, never re-rendered, so the numbers match what was posted), cards 3–6, the story cover and the OG image: 5 × 2 + 2 + 1 = 13 new PNGs. A month with no round drops card 2 and the cover's round stamp (the cover then reads "190 and 491 by state").
  - Card numbering ("2/6") follows the cards in the carousel. The founder chooses which to post.
- **Card 2 uses round facts only**, whenever it is rendered: its three occupations are `cardPicks` from the round section, the listed occupations with the largest change in lowest score invited against the previous round (two falls and one rise when there are both, ties by name), never chosen by pool size.
- **Safe zones** (Claude's understanding; re-check Instagram's current guidance when building): on the 1080×1920 story keep text and stamps out of the top 250 px and bottom 340 px (the mockup's 13% / 17.7% overlay). The profile grid now shows posts at about 3:4, so on feed cards keep the cover's essential text inside the central 1012 px.
- **Same view-model**: `src/lib/updates/cards.ts` turns a facts file into card view-models; the page uses `recap-view.ts` over the same facts, and both call the same formatting helpers ("at least N", "under 20", ranges). A test asserts that every number on each card view-model appears in the recap view-model for the same month.
- **Rendering**: `npm run social:render -- --month YYYY-MM` builds each card's HTML from the card view-model (React `renderToStaticMarkup` or string templates; builder's choice), with colour tokens generated from `src/lib/brand/palette.ts` and `palette-dark.ts` (no hex in the templates), fonts loaded by `file://` URL from `node_modules/@fontsource-variable/archivo` and `@fontsource/big-shoulders-stencil-display` (as `scripts/og-image/render.ts` does), guilloche from the site's SVGs, the map from the homepage atlas geometry. puppeteer-core opens each at device scale 1, emulates the theme, waits for `document.fonts.ready`, **fails** if `document.fonts.check` is false for any required face or if any text box overflows, then screenshots.
- **Glyphs**: card copy uses only characters in the bundled Latin subsets. A test scans card strings for characters outside them (for example "→" in the mockup's swipe cue may not be in Archivo's Latin subset and would fall back to a different system font on Linux). Draw such marks as SVG.
- **Compression**: quantise with `sharp` (already in `node_modules`; pin it if used directly) to palette PNG, then verify. Limits: each PNG at most 300 KB, a set at most 2.5 MB; the job fails above either.
- **Retention**: `public/social/` keeps the sets for the latest 3 data months; the monthly PR deletes older sets except each month's `og.png`, which stays forever because its recap page references it. Git history keeps the deleted sets. (A round-only page's OG image is the round cover at 1200×630, `round-YYYY-MM-DD/og.png`, until the month set replaces it.)
- Images are rendered **in CI only** for committed sets, so what the founder reviews is exactly what was generated. Local renders are for development. The repo is public, so the images are visible on the PR branch before they are posted.
- The PR body also carries a **draft caption and alt text** per image, generated from the card view-models (Claude's call), for the founder to paste. **Captions end with a few relevant hashtags** (Founder), for example `#australiapr #skillselect #189visa #190visa #491visa`; the builder settles the exact set as a constant in one module, choosing per set (no `#189visa` on a set without 189 content).

### 6.8 Spotlight (Founder; definitions Claude's calls)

- **Popular**: the 20 occupations with the highest sum of the floors of their SUBMITTED totals for 189, 190 and 491 at the as-at month. This sum is a ranking key only; it is never shown, because one EOI can appear under several visas.
- **Change**: for each of six series (SUBMITTED and INVITED, for each of 189, 190 and 491) the month-on-month change is the interval `[cur.min − prev.max, cur.max − prev.min]`. Its **guaranteed change** is 0 if the interval contains 0, otherwise the smaller of its two absolute ends. A series whose previous month was not fetched is skipped, not zero. The occupation's score is its largest guaranteed change.
- **Pick**: the highest score among the 20, ties broken by the larger guaranteed relative change, then by code. Skip last month's spotlight so the same occupation doesn't run twice in a row. If no occupation has a guaranteed change above 0, use the most popular occupation and say "little changed this month".
- On the 2026-10 data this picks Registered Nurses nec (254499): 189 pool 7,500 → 4,280, holding a 189 invitation under 20 → at least 2,730.
- **Card content**: name and code; the latest 189 lowest score invited (or "Not listed" / "189 isn't available for this occupation" from the federal list); the last six parsed 189 rounds; tie-break date; holding a 189 invitation and 189 pool, now and last month; up to four states with the largest 190 floors above zero.
- **Swap**: the monthly workflow has a manual run (`workflow_dispatch`) with inputs `month` and `spotlight` (occupation code). Run on the open PR's branch, it reruns `updates:generate --section data --spotlight <code>` and `social:render` for the month set, sets `pickedBy: "founder"`, pushes a commit to the same PR, and rewrites that month's spotlight, images, captions and preview in the PR summary (the import's other lines stay). The founder uses GitHub's "Run workflow" button; no local tools needed.

### 6.9 Monthly job: `monthly-data.yml` (Claude's call)

- **Schedule**: daily at 20:30 UTC (06:30–07:30 in Sydney) on days 1–28, plus `workflow_dispatch`. The October 2026 data was checked on 17 Nov, so new months appear in the first half of the month; days 1–28 leave margin. GitHub may delay or skip scheduled runs at busy times; the next day's run covers it.
- `concurrency: data-update` (shared with the round job), so the two never run at once.
- Steps:
  1. **Base branch**: at most one data PR is open at a time, because every import rewrites most of `src/data/` and two PRs would always conflict. If an open PR has label `data-update` (for example a round PR), the job works **on that PR's branch** and adds its update to it as new commits, appending its section to the PR summary; otherwise it branches from `main` as `data/skillselect-YYYY-MM`. "The current state" below means that base branch. (Claude's call: joining rather than waiting keeps each update within a day even when the founder hasn't merged the previous one yet.)
  2. **Probe**: `npm run data:import -- --probe` opens a Qlik session, reads the values of the `As At Month` field (no table page reads, no variable changes), prints the newest month and exits. If it is not newer than the current `manifest.asAt`, exit successfully.
  3. **Target month** = `manifest.asAt` + 1 (one month per run, oldest first; the dashboard keeps 24 months, so a skipped month is caught later).
  4. **Import**: `npm ci`, then `npm run data:import -- --as-at YYYY-MM --checked-at <Sydney today> --keep-rounds`. The importer already validates and exits 1 on any issue without writing `src/data/`. **The monthly import adds no rounds** (Claude's call, from the builder check): with `--keep-rounds` (a new flag; the builder may make it the monthly default) it doesn't fetch the round pages and regenerates with the rounds already in the current `rounds.json`, like `--generate-only` does. A round dated after the as-at month, or any round the round job hasn't imported yet, is never written into `rounds.json`, a facts file or a card by this job: every round is owned by the round job (6.10). The Home Affairs nominations table in `data.nominations` is the one stored with the latest round.
  5. **Recap and images**: `npm run updates:generate -- --month YYYY-MM --section data`, `npm run social:render -- --month YYYY-MM --set month`, retention prune.
  6. **Checks**: `npm run check` and `npm run build` (capture the staleness warnings for the summary).
  7. **Summary**: `npm run updates:summary -- --month YYYY-MM > pr-body.md`.
  8. **Commit and PR**: commit 1 `data: SkillSelect snapshot as at {Mon YYYY}` (`data/raw/`, `src/data/` except `updates/`); commit 2 `feat(updates): {Month YYYY} recap and Instagram cards` (`src/data/updates/`, `public/social/`). Push, then `gh pr create --label data-update --body-file pr-body.md` with the founder as reviewer (or, on a joined PR, `gh pr edit --body-file` with the appended summary and a PR comment saying what was added).
- **Runner**: `ubuntu-latest`; Node from `actions/setup-node` at the version the repo requires (22.12+) with npm cache; Chrome from the runner image (`CHROME_PATH`, or a pinned setup action if the image lacks it). `timeout-minutes: 120` (the dashboard streams at 12–19 KB/s). Minimal `permissions`: `contents: write`, `pull-requests: write`, `issues: write`. Third-party actions pinned.
- **Minutes**: about 30–60 minutes once a month, plus under 1 minute a day for probes, plus the other two workflows: well under 500 minutes a month. The repo is public, so standard GitHub-hosted runner minutes are free.

### 6.10 189 round job: `round-189.yml` (Claude's call)

- **Owns every round** (Claude's call): this is the only job that fetches the round pages or writes a round into `rounds.json`, a facts file's `rounds` section or a round card. It builds the round's month page within a day of the round (Goal 2).
- **Schedule**: daily at 21:00 UTC, plus `workflow_dispatch`. Same `data-update` concurrency, and the same base-branch rule as 6.9 step 1: if a data PR is open, the round is added to that PR's branch rather than waiting for the merge.
- **Detect**: fetch the current invitation rounds page (same request as `fetchRoundPages`), parse the newest round date, compare with the newest round in the current `src/data/rounds.json`. Not newer: exit. (If more than one round is new, import them oldest first in one run.)
- **Import**: `npm run data:import -- --rounds-only` (new mode): re-reads both round pages, stores the current page's HTML at `data/raw/rounds/<round-date>.html` (about 55 KB; today the raw round HTML isn't stored, so `--generate-only` can't re-parse a round), and regenerates `src/data/` from the stored raw files for the current `manifest.asAt` with the new rounds. Validation as for any import. Whether `manifest.checkedAt` should move is left to the builder (a separate `roundsCheckedAt` is cleaner, because the dashboard wasn't re-checked).
- **Recap and images** for the round's data month: `updates:generate -- --month YYYY-MM --section round --round YYYY-MM-DD` (a round-only page if that month's dashboard data isn't in yet; otherwise the round sections join the existing data sections) and `social:render -- --set round`; then checks and build.
- **PR** on branch `data/round-YYYY-MM-DD` (or the open data PR's branch), label `data-update`: summary with the round date, total invited per subclass, occupations listed, cut-off distribution, changes against the previous round, newly listed and dropped, and any round names that match no occupation (`manifest.roundsUnmatched` growth is shown under "Needs your decision"; adding an alias to `ROUND_NAME_ALIASES` is a reviewed code change).
- **Parser extension** (needed by the recap in step 1, not only by this job): parse the totals table ("Total EOIs Invited" per subclass), each row's tie-break date (visa date of effect), and the "State and Territory nominations" table, into `rounds.json`. This is a schema change: bump the file's version, update `readRoundsFile` and the guards, test against `scripts/import/__fixtures__/invitation-rounds.html`. A page whose layout no longer matches stops the import ("Official page schema changed"), as today.

### 6.11 Page watcher: `page-watch.yml` (Claude's call)

- **Sources**: `scripts/page-watch/sources.ts` collects every cited URL from code, so a new source is watched automatically: `src/data/states.ts` (`url`), every `source` in `src/data/state-rules/2026-27/`, the state and federal list sources used by `scripts/state-lists/`, and the sources in `src/data/guide/` (fees, steps, visas, points changes). About 50 unique URLs today. Each entry keeps which files and items cite it and their `checkedAt`.
- **Daily** at 22:00 UTC: fetch each sequentially, at least 1 s apart, 30 s timeout, the importer's User-Agent; no retries beyond one.
- **Normalise**: decode entities; drop `script`, `style`, `nav`, `header`, `footer` and cookie banners; prefer the page's main content element; collapse whitespace; drop volatile lines (for example "Page last updated", visit counters) via a small per-domain rule list. Hash the result.
- **Baseline**: the previous run's normalised texts, kept in the Actions cache (restore the latest `page-watch-*` key, save a new key each run). First run, or an evicted cache: store a baseline, open no issues, and say so in the run summary. (Alternative if cache eviction proves noisy: an orphan `automation/page-watch` branch, which would need Cloudflare's preview builds excluded for it.)
- **On a change**: open an issue "Source changed: {page title or host}" with label `source-watch`, assigned to the founder: the URL, which repo items cite it and their `checkedAt`, the date first seen, and a before/after excerpt of up to 40 changed lines. If an open issue for that URL exists, comment on it instead. **On failure** (HTTP 400+, timeout, login wall) on 3 consecutive days: one "Source unreachable" issue. Never work around a block.
- The watcher **never edits the site**. The founder (or a Claude session) updates the rule or fee and its `checkedAt` in a normal reviewed change, then closes the issue.

### 6.12 The PR description

Generated by `npm run updates:summary` from the old and new manifests, cores and facts file. It must be readable in two minutes, plain English, with numbers formatted as on the page:

1. One line: "SkillSelect data as at {date} (snapshot {id}), checked {date}. Validation passed; `npm run check` and `npm run build` passed."
2. **Pool changes per visa**: 189, 190, 491 SUBMITTED last month → this month (ranges), and holding an invitation (minimums).
3. **189 rounds** in the month, if any: date, total invited, occupations listed, lowest-score range, fell/rose/same, newly listed and dropped.
4. **190 and 491 by state**: floors this month and last.
5. **Occupations added or removed** from this month's data, by name and code. A removed occupation keeps its page with its last published data and the "not in the SkillSelect data since" note (6.17).
6. **Notable movers** (exact counts) and the **spotlight** pick with why, and how to swap it.
7. **Needs your decision**: revisions of earlier months (and whether a published recap is affected), new unmatched round names, page-read use above 90% of the budget, staleness warnings from the build, and the SUBMITTED coverage-window check (`docs/DATA.md`: after the 11/2026 import the all-status sum should stop rising about 885 a month for Software Engineer; report the figure).
8. **Images**: each PNG embedded from the branch (light and dark side by side), with its draft alt text, and the draft caption.
9. **Preview**: the Cloudflare Pages preview URL for the branch, if previews are on, with direct links to `/updates/YYYY-MM/` and three sample occupation pages.
10. **To publish**: "Merge this pull request. Cloudflare deploys it in a few minutes." Closing a month's own pull request (branch `data/skillselect-YYYY-MM`) **holds** that month (controller ruling, Plan 3 Task 6): while the branch exists on GitHub with no open data PR, the monthly job prints "Held: …" and imports nothing; deleting the branch makes the job import that month again. A data section added to another job's PR (a round branch) can't be held this way, and its publish line says so.

On a joined PR (6.9 step 1) each job appends its own dated section ("Added 12 Dec: 189 round of 10 Dec 2026") with items 1–9 for its update. Everything in the PR is public; the summary holds published data only.

### 6.13 Number rules for the recap and cards (from `notes.md`)

1. **Round totals per occupation aren't published.** Only the round total (Home Affairs totals table) and each occupation's lowest score invited and tie-break date. "Holding a 189 invitation" is the dashboard's INVITED stock at the as-at date, labelled a minimum (EOIs that lodged by then have left INVITED; 14,876+ against 20,000 issued).
2. **State figures are wide.** A state's figure is the sum of its occupation-by-score cells within one visa and one month; shown as **"at least {floor}"**, with "+ N hidden small counts". A state whose every cell is "<20" reads "under 20 for each occupation", never 0 (TAS 491 on 2026-10). States are never added to each other or to `ANY`; `ANY` is "State not recorded", never a state.
3. **Two state measures disagree.** The Home Affairs nominations table is copied as published (including "<5"), labelled "A different measure", with its own period, and never compared or reconciled numerically with the dashboard.
4. **Visas are separate.** One EOI can select 189, 190 and 491; no figure adds visas.
5. **A pool change isn't new interest.** State both numbers; claim no cause.
6. **INVITED is never summed across as-at months.** National totals sum occupations within one visa and one month only, as intervals.
7. **No next round date** in any copy or FAQ.
8. **Ranges and "about".** A sum that includes masked cells is a range. Show "about N" (N the midpoint rounded to the nearest 1,000) only when the range's width is at most 2% of its midpoint, and show the range beside it.
9. **Movers** use exact counts only (neither month masked). A `null` cut-off is "Not listed", never 0; a skipped round is absent, never "not listed".
10. Every string on the page and cards passes the `BANNED_COPY` sweep.

### 6.14 What a new snapshot changes (must land before the first automated PR; the sample freeze is a Founder decision, the rest Claude's calls)

The site has been pinned to the 2026-10 snapshot ("The first dataset is pinned to `--as-at 2026-10`… Moving to a newer snapshot is a separate, reviewed change", `docs/DATA.md`). This design is that review. What moves when a new month is merged:

- **Most pages follow the data**, as intended: occupation pages, the report and check (they fetch the current core), the homepage try-it and example, `/states/` evidence, the sitemap's `lastModified`.
- **`/sample/` must not drift.** It loads the live cores of its four example occupations and the comparison occupation (`src/app/sample/page.tsx`, `SAMPLE_COMPARISON = "254412"`) at `SAMPLE_AS_OF = "2026-11-17"`. Its tabs are named "Strong", "In the middle", "189 closed", "Nothing suits", and `src/lib/outlook/examples.test.ts` asserts each stamp on live data ("a data refresh that moves a stamp must be reviewed"), with each tab kept within 5 printed pages. A new month can move a stamp, which fails `npm run check` and so blocks every monthly PR. **Freeze the sample (Founder)**: `/sample/` stays on the 2026-10 snapshot with `SAMPLE_AS_OF = "2026-11-17"` pinned, and says so clearly on the page ("Example reports use SkillSelect data as at 31 Oct 2026"). A script writes the five occupations' 2026-10 core and detail records to `src/data/sample/2026-10/` (regenerated in memory from `data/raw/` as `src/lib/data/legacy.test.ts` does, ruling R16), and `/sample/` reads only those. The sample is refreshed only when the founder asks, as a separate reviewed change; the monthly job never touches it.
- **Tests that read live data**: 24 test files under `src/lib/` read `src/data/` (for example `outlook/label-189.test.ts`, `occupation-page/summary.test.ts`, `outlook/__fixtures__/scenario-input.ts`, `state-outlook/outlook.real-data.test.ts`). Sort them into two kinds. Tests that assert **specific figures or labels** move to frozen 2026-10 fixtures (the same frozen records, or in-memory regeneration). Tests that assert **invariants** (every occupation validates, every page has a unique title, every view-model passes copy rules) keep reading live data: they are what should stop a bad month.
- **Defaults**: `scenarios.ts` (`asOf = "2026-11-17"`) and `check-flow.tsx`'s initial state are placeholders replaced at run time by `localToday()`; confirm, and leave them.
- **Docs**: replace the "pinned" sentences in `docs/DATA.md` and `scripts/README.md` with "new months arrive through the monthly pull request (`docs/superpowers/specs/2026-11-24-monthly-updates-design.md`)", and move the "After an import" steps there into the workflow.
- **Rehearsal**: run the whole monthly workflow once by hand against `--as-at 2026-10` (re-import into a scratch branch). It should produce no data changes beyond `checkedAt` and the recap/images for 2026-10, and proves the pipeline end to end before real November data appears (expected mid-December 2026).

### 6.15 Failures and notifications (Claude's call)

- Any failed step fails the workflow, so **no PR with bad data** is ever opened, and GitHub emails the founder (GitHub sends scheduled-run failure emails to the user who last edited the workflow's schedule; the founder should be that user, or confirm Actions failure notifications in Settings → Notifications).
- The failed run uploads its logs and any raw files fetched as a workflow artifact (7 days; public, like the logs, which hold only published data and never a secret), and opens one issue "Monthly SkillSelect update failed ({month})" (or "189 round import failed ({date})") with the failing step and the last 50 log lines; later failures for the same month comment on it rather than opening another. The issue is closed by the next successful run for that month.
- PRs request the founder's review and issues are assigned to the founder, so GitHub's "participating" notifications email them even if repo watching is off.
- PRs opened with `GITHUB_TOKEN` do not trigger other GitHub workflows. There are none today, and the job has already run check and build. Cloudflare's own Git integration does see the branch push and builds a preview if previews are enabled.

### 6.16 One-time founder setup

1. GitHub → repo Settings → Actions → General → Workflow permissions: tick **"Allow GitHub Actions to create and approve pull requests"**. (The workflows declare their own `permissions`; the default "read repository contents" setting can stay.)
2. Settings → Notifications: email for Actions failures and for participating notifications (on by default).
3. Cloudflare Pages: confirm preview deployments are enabled for non-production branches, so each PR has a preview link. If they are off, the founder reviews the images in the PR and the numbers in the summary only.
4. Create the labels `data-update` and `source-watch` (or let the first run create them).

No secrets are added. No Cloudflare or Supabase credentials go into GitHub.

### 6.17 Occupations that drop out of the data (Founder; details Claude's calls)

Today ruling R9 keeps in the index only the codes present at the as-at month, so an occupation missing from a new month would lose its page (a 404 on an indexed URL). The founder decided instead that **its page stays up**, showing its last published data under a note: "Not in the SkillSelect data since {Month YYYY}". It is never removed.

- **Data**: the generator keeps a dropped occupation's last core and detail files unchanged (they keep their own snapshot id) and marks its index entry with `lastAsAt` (the last month that had it). A code that returns is regenerated from the new month and the mark is cleared. Validation changes accordingly: a record with an older snapshot id is allowed only when its index entry has `lastAsAt`; the "occupation count does not fall by more than 10%" check counts current codes only. This is a schema change (guards, `docs/DATA.md` R9).
- **Occupation page**: the note sits above the direct answer; every "as at" date, the title and the description use the occupation's own last snapshot, never the current one; the verdict strip and check card say the figures are from that month.
- **Check and report**: a dropped occupation stays selectable; the report treats it as having no current data (the points-only path, as for `hasData: false`) and shows the same note, so old figures are never presented as current. The builder settles the wording.
- **Sitemap and indexing**: the page stays indexable under the existing content rule (`noindex` only when every published count is "<20") and stays in the sitemap with `lastModified` = its last snapshot's `checkedAt`; the `Dataset` JSON-LD gives that month as its temporal coverage. The builder may decide otherwise with a reason (for example `noindex` after 12 months out of the data).
- The PR summary lists dropped and returning occupations (6.12 item 5).

## 7. Left to the builder

- File and component split, names, exact spacing, chart proportions, map shade thresholds (mockup: 700+, 200+, 20+, under 20 each), and card typography, within the brand system and the mockups.
- The exact probe call against the Qlik engine, provided it reads no table pages, changes no variables and stays within the guardrail.
- React `renderToStaticMarkup` versus string templates for the cards; reusing `stamp-geometry.ts` for stamp sizing.
- The normalisation rule list for the page watcher, tuned on the real pages until a quiet week produces no issues.
- Whether `--rounds-only` updates `manifest.checkedAt` or a new `roundsCheckedAt`.
- The FAQ wording, within 6.4 and the copy rules.
- Whether the PR embeds images by branch blob URL or relative path (the repo is public, so both render for anyone).
- The exact hashtag set (6.7), the round-only page's placeholder wording, and the details of 6.17 within the founder's decision.

## 8. Build order

0. **Spike and unpin** (before anything ships): run `npm run data:import -- --as-at 2026-10` once from a GitHub Actions runner via a throwaway `workflow_dispatch` workflow on a branch, and record whether the dashboard answers, how long it takes and the page reads used. Then freeze `/sample/` and split the live-data tests (6.14), and add the dropped-occupation handling (6.17). **If the dashboard blocks or throttles GitHub-hosted runners, stop and ask the founder** (Founder: no fallback to the founder's Mac); steps 1 and 2 can still proceed, steps 3 and 4 wait for the founder's answer.
1. **Recap page and index**: round-page parser extension (totals, tie-break dates, nominations table), `src/lib/updates/` facts (round and data sections) and view-models with tests, `updates:generate`, `/updates/2026-10/` from current data (its round section from the 15 Oct 2026 round, its data section from the 2026-10 snapshot), `/updates/`, sitemap, JSON-LD, dated direct answer, footer link, Lighthouse pages. Ship `/updates/2026-10/` as soon as it passes (it is useful on its own and gives Instagram its first post).
2. **Instagram templates and render script**: `src/lib/updates/cards.ts`, `scripts/social/`, the round set and the month set for 2026-10, the OG image on the recap page, compression and limits, caption and alt-text drafts.
3. **Monthly job**: probe, `--keep-rounds`, `monthly-data.yml`, joining an open data PR, the frozen-section test, PR summary, retention, failure issue, spotlight swap via `workflow_dispatch`. Rehearse against 2026-10 (6.14). Target: ready before the November data appears (about mid-December 2026).
4. **189 round job**: `--rounds-only`, stored round HTML, `round-189.yml`, round-only recap pages.
5. **Page watcher**: `sources.ts`, normaliser, `page-watch.yml`, issue handling.

Each step is its own branch and PR, with `npm run check` and `npm run build` passing, a browser check of new pages against `out/` at desktop and 390 px in both themes, and the decision log and `docs/HANDOFF.md` updated.

## 9. Risks

1. **The dashboard may block or throttle GitHub-hosted runners** (cloud IP ranges, websocket limits). Step 0 tests this first. If it does, the builder stops and asks the founder (Founder decision: no fallback to the founder's Mac, no self-hosted runner, and never working around a block).
2. **Dashboard layout or field changes.** The importer already stops on a changed table shape, short pages, a guardrail error (7005), a silently failed selection and validation issues, and writes nothing. The job fails safely; the founder gets an email and an issue; a code fix is a normal reviewed change.
3. **Round page layout changes.** The parser throws "Official page schema changed"; the round job fails safely. New occupation spellings appear as unmatched names in the PR summary, not as wrong cut-offs.
4. **The sample page and examples are pinned to 2026-10 and `asOf "2026-11-17"`.** Without the freeze in 6.14, the first new month would move a sample stamp, fail `examples.test.ts` and block every monthly PR. With it (Founder), the sample stays the reviewed, clearly dated October example until the founder asks for a refresh.
5. **Snapshot-specific tests.** Any test still asserting a 2026-10 figure on live data fails on the first new month. Step 0 sorts them; the rehearsal can't catch them all (it re-imports the same month), so expect to fix a few on the first real PR, in that PR's branch.
6. **The Home Affairs nominations table conflicts with dashboard figures** (Vic 0 and NSW 11 for 190 to 30 Sep, against at least 1,018 and 790 holding a 190 invitation on 31 Oct). Different measures and periods. The page labels the table "A different measure" and never explains or reconciles it.
7. **Summing INVITED across months or visas** would double count. The facts builder has no function that does it, and a test asserts national figures come from one visa and one month.
8. **"<20" handling.** Masked cells make state figures wide (NSW 190 790–6,927). "At least N" plus "+ N hidden small counts" is honest but can look small; all-masked states read "under 20 for each occupation". A floor is never presented as a total.
9. **Page-read budget (250).** The monthly plan is about 217 reads today (203 at the as-at month, 14 for the previous-month revision checks). Growing pools and more scores add pages; at 250 the importer stops and the job fails. The PR summary warns above 90% (225). Raising the budget is a founder-reviewed change (ruling R11).
10. **Fonts in CI.** Linux runners have different system fonts. All faces load from `node_modules` by file URL; the renderer fails if a face isn't loaded, and a test rejects card glyphs outside the bundled subsets. Text rasterises slightly differently on Linux than on the Mac mockups; acceptable.
11. **Repo size.** Today `data/raw/` is 9.3 MB and one month of raw (5.0 MB) gzips to about 0.85 MB; each import also rewrites much of `src/data/` (13 MB). Images: the mockup PNGs are 87–312 KB; quantised, a month's round and month sets (about 21 PNGs) should be about 1.5–3.5 MB together. Estimate **3–5 MB of git history a month, about 40–60 MB a year**, well within GitHub's limits. Limits in 6.7 (300 KB an image, 2.5 MB a set, 3 months of sets in the tree, OG images kept) bound it. If growth exceeds 10 MB a month, move the Instagram sets out of git (workflow artifacts or a release asset) and keep only `og.png`.
12. **Revisions** of a month that already has a recap: flagged in the PR summary, never applied to the published page silently (6.3).
13. **Removed occupations.** Ruling R9 drops codes absent at the as-at month. Without 6.17 an indexed occupation page would disappear (a 404 for Google); with it the page stays, clearly dated. The risk moves to presentation: a page must never show old figures as current, so tests cover the note, the dates and the report's points-only path.
14. **Joined PRs.** With at most one open data PR, a round or a month added to an open PR makes it bigger and changes it while the founder may be reviewing it. Each addition is a separate commit with its own dated summary section and a PR comment, so the founder sees exactly what arrived. A slow merge no longer delays an update; it only grows the PR.
15. **Round ownership.** Because only the round job writes rounds and the monthly import uses `--keep-rounds`, a failed round job means the round is missing from the site and the recap until it succeeds, even after the next monthly import. Its failure issue (6.15) makes that visible.
16. **GitHub scheduling.** Cron runs can be late or dropped at busy times (daily retries cover it). The repo is public, so scheduled workflows are disabled after 60 days without repository activity; monthly merges normally prevent that, but a long pause would need re-enabling.
17. **Everything is public.** Data PRs, draft images and captions, issues and logs are visible to anyone before the founder approves. They hold only published government data and our own drafts; a draft that is later corrected is still visible in history.
18. **Coverage window.** `docs/DATA.md` suspects SUBMITTED before late 2026 undercounts the pool. Month-on-month pool changes from 2026-10 onward should be sound, but the November PR must report the all-status check before the recap says much about pool trends.
19. **Instagram's rules change** (safe zones, grid crop, sizes). They are constants in one module; re-check them when building step 2.

## 10. Open questions for the founder

1. Are Cloudflare Pages preview deployments on for branches? If not, the founder reviews each PR from its images and summary only (6.16 item 3).

Answered on 24 Nov 2026 and recorded above: the sample stays frozen (6.14), dropped occupations keep their pages (6.17), the handle is `@migratelens` with hashtags in captions (6.7), a blocked spike means stop and ask (section 8), and the repo is public (section 3).
