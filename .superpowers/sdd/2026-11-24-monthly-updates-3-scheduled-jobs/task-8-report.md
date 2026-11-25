# Task 8 report: page watcher

Status: DONE_WITH_CONCERNS (concerns below). Commit `79c279e feat(automation): daily page watcher for cited state and fee pages` (base 1a3a1ef). Not pushed.

## What I built

- `scripts/page-watch/sources.ts`
  - `findCitations(value, file)` walks objects for `https://` strings under `source`/`url` keys. Each citation keeps its own record's `checkedAt`. Without one it uses `checked` (the date key `states.ts` uses) or an enclosing record's `checkedAt`, so a `value.url` gets the date of the sourced fact around it.
  - An item is the path to the value. Array elements are named by their `id`/`code`/`label`/`name`, e.g. `ACT 190 › streams › act-190-canberra-resident › occupations`.
  - `collectSources()` reads:
    - `states.ts`;
    - every rule in `state-rules/2026-27`, filed under its state's file;
    - every `*_URL` export of `scripts/state-lists/{federal,nsw,qld,sa,wa}.ts`, dated by the imported list whose `source` names that URL;
    - `SOURCES`, dated `GUIDE_CHECKED_AT`;
    - `VISA_CHARGES`, `THIRD_PARTY_FEES`, `GUIDE_STEPS`, `VISA_GUIDES` and `POINTS_CHANGES`.
  - `groupByUrl` dedupes and sorts. It also merges anchors: the four WA `#…` links are one fetch, and the item keeps its anchor. Result: 88 unique pages today (91 before the anchor merge).
- `scripts/page-watch/normalise.ts`
  - `normalisePage` drops comments, `script`/`style`/`noscript`/`template`, `nav`/`header`/`footer` and any element whose id or class contains `cookie`. A small balanced-tag scanner does this, so nested cookie divs go too.
  - It prefers `<main>` or `[role=main]`, then `<body>`.
  - Whitespace in the source is spacing only; block tags make the lines. `decodeEntities` comes from `scripts/import/rounds`. Zero-width spaces are removed (Home Affairs pages are full of them). `VOLATILE_LINES` (`"*"` plus per-host lists) drops lines, and `hash` is the SHA-256 of `text`.
  - Title: the first `h1` in the content, else the first part of `<title>` (split on ` | `, ` – `, ` - `), else "". `watch.ts` falls back to the host.
  - **Home Affairs:** its SharePoint pages carry their content as JSON in hidden `ctl00_PlaceHolderMain_*HiddenField_Input` fields, the ones the importer reads. Without those fields the watcher would see almost nothing. Their string leaves are rendered as HTML and appended. The skill occupation list yields 11,598 lines, so list and caveat changes are caught.
  - `isLoginPage(html)`: a password input in the content region.
  - `normaliseResponse(bytes, contentType, url)`: HTML goes to `normalisePage`. Other `text/*` (the WA CSV) is compared line by line. A PDF or other file becomes one fingerprint line (`application/pdf file, N bytes, SHA-256 …`), so a change is still reported but never as binary text in a public issue.
- `scripts/page-watch/watch.ts`
  - `planWatch` matches the brief's interface. `diffLines(before, after, max)` returns `{ lines, total }`. It trims the common prefix and suffix, runs an LCS, and falls back to a set difference above 4M cells. Lines are clipped to 300 characters. `watchMarker(url)` and `LABEL` are exported, and `UNREACHABLE_AFTER = 3`.
  - No saved state, or a URL newly cited: a baseline is stored and no issue opened. The summary says "No saved baseline (the first run, or the cache was evicted)…".
  - Pages no longer cited are dropped from the state.
  - A failure keeps the last good text and adds 1 to `failures`; a success resets it to 0. A page never read has `hash: ""`, and its first success is a baseline.
  - The unreachable action fires only on the day the count reaches exactly 3. It waits after that, and a page that recovers and then fails three more days is reported again.
  - Unreachable pages are grouped into **one issue per host**. Pages that already have an open issue (found by their marker) get a comment there instead. Without this, ACT alone would open 12 issues.
  - Change body:
    - the marker;
    - a never-edits note;
    - the page URL;
    - "Change first seen: {today} (the previous text was first seen {firstSeen})";
    - citing items (up to 12, then "and N more") with checked dates;
    - "Changed lines (showing x of y)";
    - the excerpt in a `diff` fence, using `fenceFor` (now exported from `failure-issue.ts`).
  - Bodies are capped at `MAX_BODY`.
  - Page titles and reasons go through `plain()`: one line, control characters removed, `@` replaced with a fullwidth `＠`, capped (title name 100 characters). Page text appears only inside the fence, where GitHub doesn't link mentions.
- `scripts/page-watch/cli.ts` (`npm run page-watch -- --state <file> [--dry-run]`)
  - Sequential requests: at least 1 s apart overall and **10 s apart per host**, with hosts taken in turn (`politeOrder`).
  - 30 s timeout. User-Agent: `USER_AGENT` from `scripts/state-lists/shared.ts` (R19; now exported).
  - One retry, after 5 s, and only for a timeout, a network error or HTTP 5xx. A 4xx (403, 429) is never retried. HTTP ≥ 400, a timeout or a sign-in page counts as a failure.
  - Open issues come from `gh issue list --label source-watch --author app/github-actions --json number,title,body`.
  - `applyActions`:
    - creates use `gh issue create --title … --label source-watch --assignee Prathu910 --body-file -`;
    - comments use `gh issue comment N --body-file -`;
    - everything goes through `realGh` (argument arrays, body on stdin), so page text never reaches a shell.
  - The state is written atomically only after every action succeeds.
  - Dry run: `realGh(true)` (no GitHub calls). It prints each action's body and writes the state to `$TMPDIR/page-watch-state-<ms>.json`.
  - The summary goes to stdout and is appended to `$GITHUB_STEP_SUMMARY`. `TODAY` overrides the Sydney date.
- `.github/workflows/page-watch.yml`
  - Triggers: `schedule: cron "0 22 * * *"` and `workflow_dispatch`.
  - `permissions: contents: read, issues: write`; `concurrency: page-watch`; job timeout 30 min.
  - Checkout uses `persist-credentials: false` because the job never pushes. Then setup-node 22 with the npm cache, and `env -u GH_TOKEN npm ci`.
  - `actions/cache/restore` (key `page-watch-${{ github.run_id }}`, `restore-keys: page-watch-`).
  - R18: `gh label create source-watch --force`.
  - `npm run page-watch -- --state "$RUNNER_TEMP/page-watch/state.json"` with `GH_TOKEN`.
  - `actions/cache/save` with the same key. It runs only on success, so a failed run never replaces the baseline.
  - Actions are pinned by SHA (`actions/cache` v4.3.0 `0057852b…`, resolved with `git ls-remote`). Every step has a timeout, and no `run:` contains `${{ }}`.
- `package.json` has the `page-watch` script. `.prettierignore` lists `scripts/page-watch/__fixtures__/`.
- Fixtures:
  - `nsw-190.html`: the live NSW 190 page (141 KB), saved today.
  - `homeaffairs-rounds.html`: a copy of the importer's saved Home Affairs rounds page (the hidden schema field).

## Tests

- `scripts/page-watch/{sources,normalise,watch,cli}.test.ts`: 41 tests, no network. They cover every expectation in the brief:
  - ≥ 40 sources, the occupation list URL present, URLs unique;
  - nav, cookie and "Skip to content" dropped;
  - "Page last updated" dates hash the same;
  - a baseline-only run;
  - "Source changed: Skilled occupation list", and a comment when an issue is open;
  - two failures then a recovery give 0;
  - two failures then HTTP 403 give "Source unreachable: immi.homeaffairs.gov.au".
- They also cover:
  - nothing on the 4th day, and fail, fail, ok, fail, fail opening no issue;
  - host grouping, with the open-issue comment split off;
  - a never-read page;
  - a page missing from the results;
  - forgetting uncited pages, and a new source as a baseline;
  - the host as title fallback;
  - hostile text: a ```` ``` ```` line and an `@mention` stay inside a longer fence, and the title has no `@`, ≤ 120 characters; the body is ≤ `MAX_BODY` with exactly 40 excerpt lines;
  - `diffLines` order, cap, set-difference fallback and line clipping;
  - the two fixtures, and CSV/PDF handling;
  - `parseState` on damaged state;
  - `applyActions` argument arrays and stdin, assigned to Prathu910;
  - `politeOrder`.
- TDD:
  - RED: `npx vitest run scripts/page-watch/sources.test.ts` (with `sources.ts` moved aside) → "Test Files 1 failed … no tests". `normalise.test.ts` → `Error: Cannot find module './normalise'`. `watch.test.ts` → `Error: Cannot find module './watch'`. Each failed as expected, because the module didn't exist yet.
  - GREEN: `npx vitest run scripts/page-watch/` → `Tests 41 passed (41)`.
- `npm run check` → exit 0: 191 files and 1,940 tests pass. Its one lint warning is in an untracked `.superpowers/brainstorm/…/lib.js`, not my code.
- `npm run build` → exit 0.
- actionlint 1.7.12 with shellcheck 0.11.0 (release binaries in the scratchpad) on all three workflows → exit 0. `shellcheck -x scripts/automation/*.sh` → exit 0, and `bash -n` passes on each. This task adds no shell scripts.
- **The live pass (once):** `npm run page-watch -- --dry-run` took 2 min 27 s and exited 0. It used 1 s spacing; per-host spacing was added afterwards. Of 88 pages, 49 were read and 39 failed:
  - HTTP 403 from www.act.gov.au (12 pages; the research already recorded ACT blocking automated reads);
  - HTTP 403 from migration.tas.gov.au (10), liveinmelbourne.vic.gov.au (4), theterritory.com.au (3), australiasnorthernterritory.com.au (1) and charteredaccountantsanz.com (1);
  - **HTTP 429 from www.migration.qld.gov.au (9)**, for requests 1 s apart. That is why I added the 10 s per-host gap and host interleaving. It is untested live, because I made only the one pass.
  - Every Home Affairs page was read, using the R19 UA.
  - passportindia's fee calculator has no readable text; the summary lists it.
  - The state is 1.4 MB.
- Two fixture downloads (curl, 2 s apart) came before the pass. Home Affairs answered **HTTP 403 to a UA with a "MigrateLens-PageWatch (+https://migratelens.com)" suffix**. I didn't retry it (the auto-mode classifier also denied an immediate retry as a workaround). The NSW page downloaded fine.

## Concerns

1. **Many cited pages refuse automated reads.** ACT, TAS, VIC, NT, CA ANZ and possibly QLD (39 of 88 pages) failed from this Mac, and GitHub's Azure IPs may fare worse. From day 3 the founder will get about 6–7 "Source unreachable" issues, one per host. Those pages are effectively not watched. That is the honest design ("never work around a block"), but the founder should expect it. They could close those issues as known, or we could later add a per-host "known blocked" list.
2. **UA naming the site vs R19.** The dispatch asked for "a clear User-Agent that names the site". R19 says to use `USER_AGENT` from `shared.ts` (a plain Chrome UA), and Home Affairs 403'd the suffixed UA I tried. I followed R19. Changing it means weighing politeness against Home Affairs blocking every page.
3. **`watch.ts` is 355 lines after Prettier**, over the ~300 guideline. The brief's file list doesn't include a split. `diffLines` with its helpers (about 60 lines) would be the natural file to extract.
4. Normaliser limits, to tune in the quiet week (spec open question):
   - Home Affairs hidden-field leaves include SharePoint labels ("Published", "Page Content", "False"); they are stable.
   - The visa pricing table is loaded by script, so only the intro text is watched. Fees are still caught by the 1 July staleness warning.
   - Only the importer's small named-entity set is decoded (`&lsquo;` stays literal; it's stable).
5. Small additions beyond the brief:
   - `checked` as a fallback date key;
   - anchor merging;
   - non-HTML handling;
   - host grouping for unreachable pages;
   - the per-host gap;
   - retries only for 5xx/timeout/network;
   - `cli.test.ts`;
   - `persist-credentials: false`;
   - `concurrency`.
   - Not added: a failure issue for a crashed page-watch run. GitHub's failed-run email covers it, and spec 6.15 scopes failure issues to the data jobs.
6. `resultsUrl` in the state rules isn't a `source`/`url` key, so it isn't collected on its own. Today the same URL is cited as a stream's `status` source, so it is watched anyway.
7. Docs (`scripts/README.md`, `docs/OPERATIONS.md`, `CLAUDE.md` commands) are not updated; I left that for Task 9.

---

## Fix round 1 (coordinator findings I1, I2 and the minors, plus the founder's 25 Nov 2026 User-Agent ruling)

Commits: `44d064b feat(automation): robots.txt rules for the page watcher` and `4f41b3f fix(automation): page watcher keeps to its budget and one standing issue`. No amends, no push, and no live network calls this round.

### What changed

- **I1, run budget and stopping a host** (`fetch-pages.ts`, new; `cli.ts`)
  - A host that answers 403 or 429, or doesn't answer, is asked nothing more that run. This covers a robots.txt timeout or 429 as well as a page's. Its remaining pages get the same `kind` and reason without being requested.
  - `RUN_BUDGET_MS = 15 min`. Once the next request would be due after the deadline, the remaining pages become `skipped` with "not fetched: the run's time budget ran out", and a note goes in the summary. A skipped page keeps its saved entry unchanged: no failure counted, no reset.
  - Planning, the issue actions, writing state and the summary always run afterwards. The step timeout stays at 20 min.
  - `fetch`, `sleep`, `now`, `log` and the `deadline` are injected (`ReadDeps`).
- **Founder ruling, User-Agent and politeness**
  - `USER_AGENT` is unchanged, with the comment "Browser User-Agent for automated jobs: founder decision 25 Nov 2026, docs/STRATEGY.md." I didn't add a STRATEGY entry; that is Task 9's.
  - **One request per page per day, never retried.** This replaces the earlier retry on 5xx or timeout, and it overrides the coordinator's minor "a 5xx is retried once". The test now checks that a 5xx costs exactly one request. Pages whose `checkedOn` is today are not requested again ("already read today").
  - 10 s per host, 1 s overall, hosts taken in turn.
- **robots.txt** (`robots.ts`, new, with a fixture)
  - Each host's `/robots.txt` is fetched once per run, before its first page, with the same User-Agent and the same gaps.
  - The rules in force are the `*` group plus any group naming the product token (`Mozilla`). I merge both groups, the stricter reading of "and".
  - Matching follows RFC 9309: the longest match wins, Allow wins a tie, `*` and a trailing `$` work, and the query string is matched.
  - A disallowed URL is never requested. It is recorded as `disallowed` with "not fetched: disallowed by robots.txt" and goes in "Not watched" and the standing issue.
  - A 404 means everything is allowed. Any other failure is unknown: allowed, with a note in the summary. The exceptions are a timeout or 429 on robots.txt, which stop the host (I1).
  - `Crawl-delay` is ignored; our 10 s gap applies.
- **I2, the standing issue** (`standing.ts`, `issue-text.ts`)
  - A page counts as not watched when it has no baseline and fails with `refused` (any 4xx or a sign-in page), or when robots.txt disallows it. Such a page never gets a per-host issue. The summary lists it under "### Not watched: refuses automated reads".
  - There is one issue, "Sources the watcher cannot read". Its pages are marked `<!-- cannot-read: URL -->`, separate from `watch-url`, so change matching can't land on it.
  - It is found by exact title with `gh issue list --state all --author app/github-actions --search 'in:title "…"'`, preferring an open one. It is created once when the set is first non-empty.
  - It is edited (`gh issue edit N --body-file -`) only when the URL set differs, and the body says "None right now" once the set empties. A closed issue is never edited, reopened, commented on or replaced.
  - A page that was listed and wasn't requested this run (budget, already read today) stays listed, so a budget cut causes no churn.
  - "Source unreachable" is now only for pages that had a baseline and failed on 3 days running. Its body says they "used to be readable" and gives when their last text was first seen.
  - A never-read page that only times out is in neither list; it shows in the summary under "Unreadable". That follows the ruling's "4xx" wording.
- **Minors**
  - Failures count days. `WatchEntry.checkedOn` is the last day the page was requested, and a failure adds 1 only when `checkedOn !== today`. The unreachable issue fires only on a day that counted, so a same-day rerun neither counts again nor re-fires. `parseState` requires `checkedOn`, so older state files start a fresh baseline (none is deployed). This one field covers both the "last failed date" minor and the one-request-per-day rule.
  - The cache key is `page-watch-${{ github.run_id }}-${{ github.run_attempt }}` on restore and save.
  - `markersIn` reads markers only on their own lines outside fenced blocks; `issueFor` uses it.
  - `withExcerpt` shortens the excerpt, never the fence, so the closing fence stays.
  - `attempt`/`readPage` tests use an injected fetch: 403, 429 and 404 are not retried, 503 is one request, a sign-in page is `refused`, a timeout is `timeout`, and ENOTFOUND is a network error.
  - The split: `diff-lines.ts` (73 lines), `issue-text.ts` (151), `standing.ts` (71), `summary.ts` (78), `fetch-pages.ts` (242). `watch.ts` is down to 242. `LABEL` moved to `issue-text.ts` to avoid an import cycle.
  - Cookie notices are now a separate pass, `isCookieNotice`. It never matches `html`, `body`, `main` or `[role=main]`. A match whose content holds `<main`, `role=main` or `<h1` is treated as a wrapper: it is kept and its children are searched instead.
  - The comment on an unreachable issue now reads "Readable again, with changed text (seen …)."; other comments keep "Changed again".

### Tests (fix round)

- `npx vitest run scripts/page-watch/` → 8 files, **78 tests passed**. New or rewritten:
  - `robots.test.ts`: 8, with a fixture.
  - `fetch-pages.test.ts`: 12, with a fake fetch and clock:
    - robots skip, with robots.txt fetched once per host;
    - stop after a 403, after a timeout on robots.txt or a page, and after a robots.txt 429;
    - the 10 s and 1 s gaps;
    - the deadline;
    - already read today.
  - `issue-text.test.ts`: 4.
  - `diff-lines.test.ts`: 4, moved from `watch.test.ts`.
  - `watch.test.ts`: 25. New cases:
    - same-day runs;
    - a marker only inside a fence;
    - the "Readable again" wording;
    - the standing issue: create once, edit only on change, cleared to "None right now", closed left alone, listed-but-skipped kept, timeout and baseline pages excluded;
    - pages not requested left alone;
    - run notes.
  - `cli.test.ts`: `findStandingIssue`, the `edit` action, `parseState` without `checkedOn`.
  - `normalise.test.ts`: a cookie class on `body` and on a wrapper.
- TDD note: in this round the tests were written beside the implementation, not strictly first. No RED runs were recorded.
- `npm run check` → exit 0: 195 files, 1,977 tests. Its only lint warning is the untracked `.superpowers/brainstorm/…/lib.js`, as before.
- `actionlint -shellcheck` (1.7.12 / 0.11.0) on all workflows → exit 0. `shellcheck -x scripts/automation/*.sh` → exit 0, and `bash -n` passes on each.
- `npm run build` was not re-run this round; the changes are all in `scripts/` and the workflow.

### Remaining concerns

1. "At most one request per page per day" holds across successful runs through the saved `checkedOn`. A failed run saves no state, so a rerun the same day requests its pages again. robots.txt is fetched once per run, not once per day.
2. A closed standing issue stays closed: if a new page becomes unreadable after the founder closes it, only the run summary shows it.
3. Treating a robots.txt timeout or 429 as stopping the host is my reading, combining I1 with "unknown: allowed". Other robots failures (403, 5xx, network) are allowed with a note.
4. Live behaviour of robots.txt, the host stop and the budget hasn't been seen, since no live calls were allowed. The Task 9 rehearsal will be the first.
