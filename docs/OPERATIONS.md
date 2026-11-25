# MigrateLens forms: deployment and operations

The frontend remains a Cloudflare Pages static export. Calculations and feedback are posted directly to Supabase Edge Functions. Keep the occupation-page release on `roadmap/occupation-pages` until it is reviewed and integrated into the production branch. The backend must be ready before enabling the required-email frontend in production.

## Public frontend settings

Set these independently for Cloudflare Production and Preview builds. Changing them requires a new build.

| Variable                         | Value                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Project URL for the appropriate staging or production Supabase project, without a path |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public managed Turnstile widget key for the corresponding frontend hostname            |
| `NEXT_PUBLIC_PRIVACY_EMAIL`      | Working monitored mailbox for privacy questions and deletion requests                  |

Missing or invalid public settings leave both submission forms unavailable; no save is simulated. The personal report still requires email and a successful write. The public sample and occupation pages keep working. The email field is held in memory and excluded from local profile saving and printed reports.

No Supabase secret/service-role key, database password or Turnstile secret belongs in a `NEXT_PUBLIC_` value or frontend environment file.

## Account setup and backend deployment

Follow [the backend runbook](OPERATIONS-BACKEND.md) for the exact migrations, Edge Function secrets, allowed origins, tests, deployment commands, SQL views and deletion procedures. Use separate Supabase staging and production projects. An unauthenticated visitor can submit only through the validated functions; browser REST/table/RPC access must remain denied.

In Cloudflare Turnstile, create managed widgets with explicit frontend hostnames. Use production `migratelens.com`, and only specifically needed staging hosts. Avoid authorizing all `pages.dev` hosts. Set the private verification key in Supabase secrets. The expected actions are `calculation` and `feedback`; custom submission handlers validate them directly, independently of Supabase Auth settings.

For local UI development, run `npm run dev`. For an integrated local backend use the Supabase CLI stack separately (see the backend runbook), set public local URL and test widget values in an ignored `.env.local`, and rebuild/restart the frontend. Never send real user data in local smoke tests.

## Verification commands

```sh
npm ci
npm run check
npm run build
npm run backend:check
npm run backend:test
npm run backend:test:sql
```

The Deno CLI is pinned in dev dependencies. Backend SQL verification creates and deletes its own temporary Postgres cluster, using the installed Postgres tools. It does not reuse the developer's database. Deno HTTP tests use controlled Turnstile/database responses; SQL tests exercise real Postgres permissions and concurrency. A real Supabase REST gateway check still belongs to staging verification.

## Deployment order

1. Apply staging migrations and deploy both functions and secrets.
2. Check the daily retention job and a deletion in staging.
3. Build the frontend with staging public variables and verify the Cloudflare preview.
4. Test a personal check: missing email, invalid email, rejected verification, unavailable storage, retry, successful persisted record and report. Check that double clicks/retries do not add records and the stored summary has no personal dates.
5. Test sample report and sample-answer mode without any saved records. Start a new real check to leave sample mode.
6. Test feedback with no email and no context, then an optional email and selected summary. Check a failed save preserves the message. Inspect records privately in Supabase.
7. Verify direct browser REST and RPC reads/writes are denied even with a public API key.
8. Apply reviewed production migrations, deploy functions/secrets and verify retention before releasing the frontend with production variables. Remove smoke-test data.
9. Verify production saves and the privacy contact. Only then finish indexing configuration, robots/sitemap checks, redirects and Search Console submission.

Cloudflare build settings: Pages static HTML export, `npm run build`, output `out`, repository root. OpenNext is not part of this architecture. Frontend static builds do not deploy Supabase functions or apply migrations.

Validate dependency changes with a fresh `npm ci`, using the Node/npm versions reported in the Cloudflare build log (the 20 November build uses Node 22.23.4 and npm 10.9.9). Generate lockfile repairs without an existing `node_modules` tree so optional platform dependencies are included. Commit `package-lock.json`; do not replace the clean-install step with `npm install` in Cloudflare to hide a stale lockfile.

## Failure and rollback

A successful API acknowledgement is required to open the personal report. Network, verification or storage failures keep the answers and show retry; do not disable that acknowledgement check to hide an outage. Feedback independently keeps the message when its write fails. Both depend on the availability of the same Supabase project.

Check Supabase service/function status and sanitized operational logs; do not add payload/email logging. Check Turnstile hostname/action and CORS configuration when a browser fails but HTTP tests pass. If public configuration changes, rebuild Pages. Roll back the frontend and backend independently using compatible migrations; do not drop live tables as a rollback.

Supabase Free may pause inactive projects. Review current plan limits before enabling the email gate in production. No paid plan has been purchased by this implementation.

## Data and contact handling

The project has no email delivery service, login, verified email ownership, paid access or alert subscription. Collected report addresses are not marketing permissions. Distinct submitted addresses are not verified unique people.

Use the restricted Supabase dashboard for records and operator queries. Treat exports as private, keep them outside git and `out`, and delete them after their task. Daily cleanup removes records older than 180 days at its next run; backup expiry follows the provider's configured policy. Monitor the scheduled job history. Deletion requests arrive at the configured privacy mailbox; browser “Clear my answers” does not delete server submissions. Verify the requester's authority before deleting or disclosing records, and do not send profile records to an unverified address.

## Cloudflare Web Analytics (beacon errors)

The privacy section discloses Cloudflare Web Analytics, but nothing in the code loads it: Cloudflare injects `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "3cf7eccade584b71974c42dd7d4699de"}'>` into every page at the edge (seen with `curl -s https://migratelens.com/ | grep cloudflareinsights`, 24 Nov 2026).

**What goes wrong.** The beacon's report to `https://cloudflareinsights.com/cdn-cgi/rum` fails on every page view. The CORS preflight succeeds (200, `access-control-allow-origin: https://migratelens.com`), but the POST itself, replayed with the browser's exact payload, returns **404 with no CORS headers**, so Chrome logs "Access to XMLHttpRequest … blocked by CORS policy" and "Failed to load resource: net::ERR_FAILED". The collector does not accept site token `3cf7ecca…`: the Web Analytics site behind it no longer exists or is not active for `migratelens.com` (for example it was created for another hostname or a since-deleted Pages setup). No visits are being counted, and PageSpeed Insights takes Best Practices to 96 for the console errors. The handoff of 20 Nov already noted the beacon upload failing.

**Fix it in the Cloudflare dashboard** (pick one):

1. **Keep analytics (recommended).** Dashboard → **Analytics & Logs → Web Analytics**. If a site for `migratelens.com` is listed, open **Manage site** and check its hostname is exactly `migratelens.com`; otherwise choose **Add a site**, enter `migratelens.com` and pick **Enable automatic setup** (the zone is proxied by Cloudflare, so no snippet is needed). Then **Workers & Pages → the MigrateLens project → Metrics → Web Analytics**: if it shows enabled with an old site, **Disable** it, so only one beacon is injected. Purge the cache (**Caching → Configuration → Purge Everything**).
2. **Turn it off.** Disable Web Analytics in both places above and purge the cache. The privacy sentence about Cloudflare Web Analytics in `src/components/methodology/method-privacy.tsx` then needs removing in a release.

**Check it worked.** `curl -s https://migratelens.com/ | grep -o 'data-cf-beacon=[^>]*'` shows a new token (or nothing, if turned off); in Chrome DevTools the Console has no CORS error and the Network tab's `rum` request succeeds; then `npm run lighthouse -- --base-url https://migratelens.com --only / --runs 1` shows Best Practices 100. Don't paste a manual beacon snippet into the code while automatic setup is on: two beacons would double-count.

## Monthly data pipeline (GitHub Actions)

Three workflows in `.github/workflows/` keep the published data fresh. None merges, deploys or holds a secret: each prepares a change for the founder and uses only the built-in `GITHUB_TOKEN`. The repository is public, so branches, pull requests, summaries and issues hold published data and our drafts only. Spec: `docs/superpowers/specs/2026-11-24-monthly-updates-design.md`. Scripts are in `scripts/automation/` (shell and helpers) and `scripts/page-watch/`.

| Workflow           | When (UTC)            | What it does                                                                                                                                                                            |
| ------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `monthly-data.yml` | 20:30 on days 1 to 28 | Probes the SkillSelect dashboard. When a new as-at month is out it imports it, writes the recap and Instagram cards, runs every check and opens the month's `data-update` pull request. |
| `round-189.yml`    | 21:00 daily           | Checks the Home Affairs 189 round page. For a new round it adds the round and the recap's round section and opens (or adds to) a `data-update` pull request.                            |
| `page-watch.yml`   | 22:00 daily           | Reads each cited state and fee page and opens an issue when its text changes. It never edits the site.                                                                                  |

All three run only from `main` on `schedule` or `workflow_dispatch`. The data jobs share the concurrency group `data-update`, so they never run at once. GitHub keeps one run going and one waiting in that group: a third queued run cancels the waiting one. There is at most one open `data-update` pull request: a job that finds one works on its branch and adds to it. The pull request summary says what changed, what needs a decision and how to publish it.

### One-time setup (founder)

1. GitHub: Settings, Actions, General, "Workflow permissions": tick "Allow GitHub Actions to create and approve pull requests". Without it the first pull request fails.
2. Optional: Settings, Secrets and variables, Actions, Variables: add `CF_PAGES_PROJECT` (the Cloudflare Pages project name). The pull request summary then links the Cloudflare preview. No secret or token is needed.
3. Make sure notifications are on for the repository (issues and pull requests) so failures reach you. Assignments go to `Prathu910`. The labels `data-update` and `source-watch` are created by the workflows.
4. Merge the branch to `main`. Scheduled workflows and `workflow_dispatch` exist only on `main`.
5. Run the rehearsal below.

### Rehearsal (after the merge)

Use Actions, pick the workflow, "Run workflow" (or `gh workflow run <file>`), and read each run's summary.

1. `monthly-data` with `month` = `2026-10` (and no spotlight). It re-imports a month that is already published, as a no-op check. Expected: a pull request in which `src/data/manifest.json` changes only in `checkedAt`; `src/data/updates/2026-10.json` is unchanged; `data/raw/` changes only if Home Affairs revised 2026-10, which the summary lists under "Needs your decision"; the summary renders with its images table. Close the pull request (or merge it) before step 3: an open data pull request is one the round job joins. Closing it holds 2026-10, which does no harm.
2. `monthly-data` with no inputs. This exercises the dashboard probe: expected "Nothing to do" (no newer month) and exit 0, or, if November is out, the November pull request.
3. `round-189`. Expected: no new round, exit 0, no pull request. If a November round is already published, it opens that round's pull request instead.
4. `page-watch`, twice. First run: "baseline stored", no issues. Second run: no issues.
5. Note each run's duration and the pages read in `.superpowers/sdd/2026-11-24-monthly-updates-3-scheduled-jobs/progress.md`.

The data jobs' "Start Chrome" step runs on every run, as a smoke test of the Chrome sandbox (the runner is `ubuntu-latest`, Ubuntu 24.04, which restricts unprivileged user namespaces). The 2026-10 month set already exists, so the rehearsal renders no cards: the first real puppeteer render, when the first new month or round arrives, is the step still untested in CI, so watch that run. Holding a month, the spotlight swap, replacing a branch and the failure issues are tested only by local dry runs until they happen. Target: rehearsal done before November's data appears (about mid-December 2026).

### Reading a run

- **Closing a month's pull request holds that month.** The job then exits 0 before any import, logging "Held: the pull request for {Month YYYY} was closed. Delete branch data/skillselect-{YYYY-MM} to import it again." The branch stays. A held month is also not added to any other open data pull request (`isHeld` in `base-branch.ts`). To import the month again, delete that branch. Only a pull request closed without merging holds: a branch left with no pull request (a failed `gh pr create`) is not held, and the next run replaces it (a push with `--force-with-lease` on the commit that run saw).
- **Closing a round pull request does not hold the round.** The next daily run opens it again, replacing the branch the same way.
- **Month data joining a round pull request** retitles it "SkillSelect data as at {date} and 189 rounds".
- **Spotlight swap.** The recap's spotlight is the occupation the Instagram card and recap feature. Run `monthly-data` with `workflow_dispatch`, `spotlight` = the six-digit code (and `month` if more than one could be open). It changes the open data pull request only: the recap facts, the cards and the summary are regenerated and the summary is rewritten. It cannot change a month already on `main`.
- **Failure issues.** A failed job opens an issue assigned to the founder, with the log tail, and fails the run; no pull request is opened or updated with bad data. Titles: "Monthly SkillSelect update failed (Month YYYY)", "189 round import failed (date)", "189 round check failed" for a failure before the round page was read, and "Page watch failed" for the page watcher's own job. The next successful run closes the issue. A failed run's `git status` and changed `data/raw/` files are kept as an artifact for 7 days.
- **Page watcher issues** (label `source-watch`):
  - "Source changed: {page}": the page's text changed. Compare the excerpt with `src/data/states.ts`, the state rules or the guide's fees, change them in a reviewed commit and close the issue.
  - "Source unreachable: {host}": pages that were readable failed on 3 separate days.
  - One standing issue, "Sources the watcher cannot read": pages never readable (VIC, ACT, TAS, NT and CA ANZ refuse automated reads) and pages that robots.txt disallows. It changes only when that set changes. Check those pages by hand.
  - The baseline is the Actions cache. When it is missing (the first run, or the cache was evicted) the run stores a new baseline and opens no issues.
- **Request rules (founder decision 25 Nov 2026).** The jobs keep a browser User-Agent. Each run requests a page at most once, with a 10 second gap between requests to the same site, and the jobs run once a day. A refusal is never retried, and anything robots.txt disallows is skipped. The round job reads the site's robots.txt once, then the current rounds page (saved for the run, so a second look reads the copy) and, only for a new round, the previous rounds page 10 seconds later; the import reads those saved pages (`scripts/automation/round-pages.ts`). The page watcher follows RFC 9309: a robots.txt that answers 401, 403, 429 or 5xx, or doesn't answer, stops that site for the run; a missing one (404 or another 4xx) allows every page. It stops asking a site after a 429, a timeout or a second 403 in the run; a page skipped that way keeps its baseline and doesn't count as a failed day. The dashboard importer keeps its own guardrail (`docs/DATA.md`).
- **Publishing.** Merge the pull request after reading the summary. Cloudflare Pages builds `main` as for any change.

### Dry runs and local checks

`DRY_RUN=1 BASE_REF=HEAD bash scripts/automation/monthly.sh run` (or `round.sh`) runs the job locally on the current branch: nothing is pushed, every `gh` call is printed instead of made, and a monthly run regenerates from `data/raw/` instead of importing. `BASE_REF` defaults to `origin/main`; set it to `HEAD` while the work is unmerged. `npm run page-watch -- --state <file> --dry-run` reads the pages (about 50 requests, slowly) and opens no issue. Variables for dry-run tests are documented at the top of each script.
