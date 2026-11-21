# Submission backend operations

Calculation capture and feedback use two public Supabase Edge Functions; a third, `write-read`, writes the report's optional AI "Our read" (see [AI "Our read"](#ai-our-read-write-read)). Tables and submission RPCs are private to `service_role`; there is no browser read/list/export route. Email addresses are unverified, and neither flow creates an account, sends email, or subscribes anyone to marketing. See the [design](superpowers/specs/2026-11-20-calculation-capture-and-feedback-design.md).

## Prerequisites and local checks

Use Node 22.12+, the repository's exact Supabase CLI **3.2.0**, Deno **2.9.6**, Python 3, and PostgreSQL binaries (`initdb`, `pg_ctl`, `psql`, `pg_config`). The submission Functions use web APIs only. `write-read` imports one third-party package, the official Anthropic SDK pinned to an exact version (`npm:@anthropic-ai/sdk@1.12.0`), which Deno downloads into its own cache on the first check; no Deno dependency lockfile is kept. `supabase/functions/deno.json` sets `"nodeModulesDir": "none"` because the repository's root `package.json` would otherwise make Deno look for the SDK in `node_modules/`. The CLI's complete local stack additionally requires a running Docker-compatible engine; `next dev` and a static `out/` server do not start it.

From the repository root:

```sh
npm ci
npm run backend:check   # deno check of all three Functions and both test files
npm run backend:test    # supabase/tests/submissions_test.ts and write_read_test.ts
python3 supabase/tests/postgres_test.py
npx deno bundle --config supabase/functions/deno.json --platform deno --output /tmp/migratelens-submit-calculation.js supabase/functions/submit-calculation/index.ts
npx deno bundle --config supabase/functions/deno.json --platform deno --output /tmp/migratelens-submit-feedback.js supabase/functions/submit-feedback/index.ts
npx deno bundle --config supabase/functions/deno.json --platform deno --output /tmp/migratelens-write-read.js supabase/functions/write-read/index.ts
```

The SQL test starts its own ephemeral PostgreSQL cluster and Unix socket in `/tmp`, creates test-only roles there, applies migrations, checks actual role denials and concurrent idempotency, exercises retention, then stops and removes that cluster. It never connects to an existing database. Set `POSTGRES_BINDIR` if `pg_config --bindir` does not point to runnable binaries. Run it as an ordinary user, not root. HTTP tests use real Request/Response objects and replace only the external storage/Turnstile transports and, for `write-read`, the model call (a fake `complete`; the tests never call the Anthropic API). Deno bundle verifies imports of the canonical contract and dataset JSON outside `supabase/functions`; it does not establish that a cloud deployment succeeded.

For the complete local stack:

```sh
npx supabase start
npx supabase db reset --local
npx supabase status
npx supabase functions serve --env-file supabase/.env.local
```

`db reset --local` destroys only the CLI's local project data. Do not use reset against linked/staging/production data. `supabase/.env.local` is an ignored secrets file you create locally; do not commit it. Keep the CLI default backend credentials from `supabase status` server-side. Use a separate Turnstile widget configured for local frontend hostnames.

## Configuration and deployment

Create separate Supabase projects for staging and production. All Cloudflare preview deployments use staging; never point previews at production. Choose and configure a real privacy contact before enabling collection. Do not use a placeholder mailbox.

Server-only environment values:

| Variable                    | Purpose                                                                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ALLOWED_ORIGINS`           | Comma-separated exact frontend origins. Production: `https://migratelens.com`. Staging: explicitly listed preview/local origins such as `http://localhost:3017`. No paths, trailing slash, wildcard, or broad `pages.dev` allowance. |
| `TURNSTILE_SECRET_KEY`      | Secret belonging to that environment's Turnstile widget.                                                                                                                                                                             |
| `SUPABASE_URL`              | Provided automatically to deployed Functions; local project URL when serving locally.                                                                                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Provided automatically to deployed Functions; backend-only legacy service-role JWT, never a browser publishable key.                                                                                                                 |

The browser receives only `NEXT_PUBLIC_SUPABASE_URL` (project URL; the client appends `/functions/v1`) , `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, and the configured `NEXT_PUBLIC_PRIVACY_EMAIL` contact. It sends JSON directly without credentials/cookies or a Supabase auth session. The frontend configuration guide records the final public variable names.

Create `supabase/.env.staging` privately with only `ALLOWED_ORIGINS` and `TURNSTILE_SECRET_KEY`; Supabase reserves its built-in `SUPABASE_*` environment values. Then run:

```sh
npx supabase login
npx supabase link --project-ref YOUR_STAGING_PROJECT_REF
npx supabase db push --remote
npx supabase secrets set --env-file supabase/.env.staging
npx supabase functions deploy submit-calculation --use-api
npx supabase functions deploy submit-feedback --use-api
npx supabase functions deploy write-read --use-api
```

Check the linked project before each mutation. In the pinned CLI 3.2.0, `db push` defaults to the local database; `--remote` explicitly selects the linked hosted project. `--use-api` lets the pinned CLI bundle and deploy without local Docker. Always deploy from the repository root so the canonical contract and generated occupation index/manifest remain available. `verify_jwt = false` is scoped to these three Functions in `supabase/config.toml`; future account endpoints retain authentication. Functions still independently require the configured Origin, strict JSON payload, and successful server-side Turnstile action/hostname validation.

Apply backward-compatible migrations and deploy the backend before the frontend. Repeat with a separately reviewed production project and its own secret file/widget. No live project, credentials, paid plan, or deployment is created by adding these files. Backend handlers accept only known occupation codes (or `points-only`) and the bundled manifest snapshot. Coordinate dataset/backend/frontend releases: an old open tab must refresh after the accepted snapshot changes.

## HTTP contract and failure handling

`POST /functions/v1/submit-calculation` and `POST /functions/v1/submit-feedback` accept exactly `{ "submission": <canonical payload>, "turnstile_token": "..." }`. Payload fields come from `src/lib/submissions/contract.ts`; raw Profile fields are rejected. Body size is capped at 16 KiB while streaming, even if Content-Length is absent or dishonest. Turnstile action must be `calculation` or `feedback`, respectively; hostname must match the allowed frontend Origin. Every upstream fetch has a 15-second timeout. No payload, email, token, raw IP, or upstream error body is logged by the handlers.

Only `OPTIONS` preflight and `POST` are supported. Allowed-origin responses include CORS, `Vary: Origin`, `Cache-Control: no-store`, and `X-Robots-Tag: noindex`. Missing/unapproved origins receive 403 without an Allow-Origin header. Incorrect server origin configuration fails closed with 503. CORS is a browser boundary, not authentication.

| Status          | Meaning / response                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 201             | New record persisted; `{ "id": "uuid" }`.                                                                                                |
| 200             | Identical UUID/payload already persisted; same receipt.                                                                                  |
| 400             | Invalid/unknown fields, invalid summary, token missing, or malformed JSON.                                                               |
| 403             | Origin rejected or Turnstile failed hostname/action/success checks.                                                                      |
| 405 / 413 / 415 | Unsupported method / body over 16 KiB / wrong content type.                                                                              |
| 409             | UUID already belongs to different content. Start a new explicit submission.                                                              |
| 503             | Missing backend configuration, unavailable storage or verification service, or invalid upstream acknowledgement. Keep answers and retry. |

An existing UUID is checked against every saved payload field before returning a retry receipt. The read-only probe does not write, and a confirmed retry does not consume a second single-use token. A missing submission must pass Turnstile before the atomic insert-and-compare RPC. Concurrent requests cannot overwrite a record or inflate one UUID into multiple rows. Retrying a new, unsaved submission after failed verification/storage requires a fresh widget token. Feedback status edits do not change idempotency comparisons.

If submissions fail, inspect Function invocation status, project/database availability, secrets, allowed origins and Turnstile widget configuration. Do not add request-body logging to debug. Preserve form content and do not tell a visitor that a save succeeded before a persistence receipt. A paused/free project can prevent reports from opening; review project availability before launch.

## AI "Our read" (write-read)

`POST /functions/v1/write-read` writes the 60–90 word "Our read" summary from the report's computed `ReportFacts` (`src/lib/outlook/read-contract.ts`). It shares the submission Functions' origin allowlist, CORS headers, preflight handling and 16 KiB streamed body cap. Code: `supabase/functions/write-read/index.ts`, `supabase/functions/_shared/read.ts` (configuration, system prompt, handler), `read-token.ts`, `read-facts.ts`, `anthropic-complete.ts` (the SDK call) and `http.ts` (origin, CORS, preflight and body handling shared with the submission Functions). Design: spec section 7 of [the report redesign](superpowers/specs/2026-11-21-report-redesign-design.md).

**Two switches.** The frontend calls `write-read` only when its public build setting `NEXT_PUBLIC_READ_ENABLED` is `true`, and the Function serves reads only when `READ_ENABLED=true`. Both are off by default. Turn them on only after the privacy text and the coordinated `PRIVACY_VERSION` deploy are live. With either off, every report shows the deterministic template read.

**Authorization.** When `READ_TOKEN_SECRET` is set, a new calculation that passed Turnstile (the 201 response) also carries `read_token`: an HMAC-SHA256 (Web Crypto) over `{submission id}.{expiry}`, valid for 10 minutes. A 200 retry receipt never carries one, because retries skip Turnstile and replaying one must not mint reads; that reader gets the template read. Without the secret the field is omitted and the submission still succeeds. `write-read` accepts each token for up to 3 reads.

Server-only environment values (Supabase secrets; never put them in the frontend build):

| Variable                 | Purpose                                                                                                                                  | Default if unset                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `ANTHROPIC_API_KEY`      | Anthropic API key used by `write-read`.                                                                                                  | None: the Function answers `disabled`.                    |
| `READ_MODEL`             | Model ID. Must be in `READ_MODELS` in `_shared/read.ts`: `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-fable-5-2`. | `claude-opus-5-5`                                         |
| `READ_ENABLED`           | Server kill switch. Only the exact value `true` turns reads on.                                                                          | Off: the Function answers `disabled`.                     |
| `READ_MAX_OUTPUT_TOKENS` | Cost cap per read, a whole number from 1 to 16000. Opus 5.5 can't turn thinking off and thinking counts toward this cap.                 | `2000`                                                    |
| `READ_TOKEN_SECRET`      | HMAC secret for read tokens; set the same value for `submit-calculation` and `write-read` (secrets are project-wide).                    | None: no `read_token` is issued and reads are `disabled`. |

Generate the secret locally and set the values on the linked project (staging first; never reuse a production key or secret in staging):

```sh
npx supabase secrets set READ_TOKEN_SECRET="$(openssl rand -base64 32)"
npx supabase secrets set ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
npx supabase secrets set READ_MODEL=claude-opus-5-5 READ_MAX_OUTPUT_TOKENS=2000
npx supabase secrets set READ_ENABLED=true    # only once the privacy deploy is live
npx supabase secrets set READ_ENABLED=false   # kill switch
npx supabase secrets list                     # shows names and digests, not values
```

Or add the lines to the private `supabase/.env.staging` file used above and run `npx supabase secrets set --env-file supabase/.env.staging`. Do not commit key values or put them in shell history on shared machines. A secret change applies to the next request; no frontend or Function redeploy is needed. Adding a model to the allowlist is a one-line code change in `READ_MODELS` with its test in `supabase/tests/write_read_test.ts`, then a `write-read` deploy.

**Request and responses.** The body is exactly `{ "token": "<read_token>", "facts": <ReportFacts> }`. The facts are checked key by key; an unknown key (for example a name, email or date of birth) is rejected.

| Status          | Meaning / response                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200             | `{ "read": "…" }`: the model's text passed `checkRead` (only numbers from the facts, no banned wording, no day-of-month dates, 40–110 words).                 |
| 200             | `{ "read": null, "reason": "disabled" \| "check-failed" \| "timeout" \| "refused" }`: show the template. `disabled` covers every configuration problem above. |
| 400             | Malformed JSON, an unknown envelope field, or invalid facts. An invalid request does not use up one of the token's reads.                                     |
| 403             | Origin not allowed, or a token that is missing, tampered, expired, from another secret, or already used 3 times.                                              |
| 405 / 413 / 415 | Unsupported method / body over 16 KiB / wrong content type.                                                                                                   |
| 429             | More than 10 requests from one IP (`X-Forwarded-For`) in a minute.                                                                                            |
| 503             | Invalid `ALLOWED_ORIGINS`, or the API failed in a way other than a timeout or refusal. Show the template.                                                     |

**Model call.** `anthropic-complete.ts` calls `client.beta.messages.create` with the fixed system prompt in `_shared/read.ts`, the facts as the JSON user message, `output_config: { effort: "low" }`, `max_tokens` from `READ_MAX_OUTPUT_TOKENS`, and server-side refusal fallback (`betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`). The SDK timeout is 6 seconds with no retries, matching the reader's page, which stops waiting after 6. Server-side fallback is sent only for models that have it (Opus 5.5, Sonnet 5.5, Fable 5.2); Haiku 5.5 gets neither the beta nor `fallbacks`. A final `stop_reason` of `refusal` answers `refused`; a reply cut off before `end_turn` fails the check.

**No storage, no content logs.** Facts and generated text are never written to the database or logs. A configuration problem logs one line, `write-read disabled: <reason>` (for example `READ_MODEL is not an allowed model ID`), and never the facts, text, key or token; `READ_ENABLED` being off is not logged. Token use counts and the rate limit live in memory per Function instance, so they are best effort: a cold start or a second instance starts fresh, and each token still expires after 10 minutes. The rate-limit map holds at most 1000 addresses and drops the oldest first.

## REST restrictions smoke check

Run this against the CLI local stack and staging after every permission/migration change, before production collection. Supply the local/staging anon key and a valid short-lived JWT with `role=authenticated` from that environment; do not reuse production credentials or create/email a real user merely for a test. The SQL suite already exercises both roles directly; this additional smoke check verifies the actual REST gateway and its schema cache.

```sh
npx deno run --config supabase/functions/deno.json --allow-env=SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_AUTHENTICATED_JWT --allow-net supabase/tests/rest_permissions.ts
```

The script tests both tables' GET/POST/PATCH/DELETE and both submission RPCs plus cleanup RPC. A denied table operation must return 401/403; a hidden or denied RPC may return 401/403/404. It prints no keys or response bodies. A broken permission setup could insert the synthetic fixture: remove any row with `email = 'permission-test@example.com'` using the private SQL Editor afterward. Repeat complete browser submissions, duplicate/retry/conflict and failed Turnstile checks against the staging preview; mock tests alone do not verify deployed secrets or gateway behavior.

## Retention schedule

The portable migration creates `public.purge_expired_submissions()`. It does **not** install a schedule. Enable [Supabase Cron / pg_cron](https://supabase.com/docs/guides/cron/install), then apply the separate reviewed schedule as project owner:

```sh
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/cron/20261120000200_retention_schedule.sql
```

Repeat intentionally using the production database URL after staging verification. The script fails if pg_cron is absent or the configured Cron timezone is not UTC/GMT. Its stable named job runs at **03:00 UTC daily** and deletes both tables' records with `created_at < now() - interval '180 days'`. Reapplying the script updates that named job rather than adding duplicates. Confirm the job and successful executions:

```sql
select jobid, jobname, schedule, command, active, username
from cron.job where jobname = 'migratelens-retention';
select status, start_time, end_time, return_message
from cron.job_run_details
where jobid in (select jobid from cron.job where jobname = 'migratelens-retention')
order by start_time desc limit 10;
select count(*) from public.calculation_submissions
where created_at < now() - interval '180 days';
select count(*) from public.feedback_submissions
where created_at < now() - interval '180 days';
```

Only claim automatic retention after the job is installed and its successful run is verified. Removal happens on the next daily run after the threshold; configured backup expiration is separate and is not immediate deletion from backups. Check job history routinely. The local SQL test proves cleanup logic and its boundary, not extension installation or scheduled execution. Cron does not depend on public requests.

## Private founder queries

Use the authenticated Supabase Table Editor or SQL Editor. Keep exports private and delete them when no longer needed. All reporting below uses UTC. Counts are **saved calculations** and **distinct submitted email addresses**, not unique people or verified users.

```sql
-- Daily / weekly saved calculations, UTC.
select date_trunc('day', created_at at time zone 'UTC') as day_utc,
       count(*) as saved_calculations
from public.calculation_submissions group by 1 order by 1 desc;
select date_trunc('week', created_at at time zone 'UTC') as week_start_utc,
       count(*) as saved_calculations
from public.calculation_submissions group by 1 order by 1 desc;

-- Selected range is inclusive start, exclusive end; change dates explicitly.
select count(distinct email) as distinct_submitted_email_addresses
from public.calculation_submissions
where created_at >= timestamptz '2026-11-01 00:00:00+00'
  and created_at < timestamptz '2026-12-01 00:00:00+00';

-- Popular occupations, ten-point bands and onshore/offshore split.
select summary->>'occupation_code' as occupation_code, count(*) as saved_calculations
from public.calculation_submissions group by 1 order by 2 desc;
select floor((summary->>'base_points')::numeric / 10) * 10 as points_band_start,
       summary->>'location' as location, count(*) as saved_calculations
from public.calculation_submissions group by 1, 2 order by 1, 2;

-- New feedback and category totals. No promised reply time.
select id, created_at, category, message, email, summary
from public.feedback_submissions where status = 'new' order by created_at desc;
select category, status, count(*) from public.feedback_submissions group by 1, 2;
prepare review_feedback(uuid, text) as
  update public.feedback_submissions set status = $2 where id = $1;
-- Bind a real selected UUID and one of: new, reviewed, planned, closed.
-- execute review_feedback('SELECTED-UUID', 'reviewed');
deallocate review_feedback;
```

## Deletion requests

Privately confirm the requested address and apply the existing request-handling process. Email entry alone proves no ownership. Never expose historical records to someone merely because they submit a matching email. The parameterized deletion below removes case-insensitive address matches from both tables and retains no hash or subscriber identifier:

```sql
begin;
prepare delete_calculations(text) as
  delete from public.calculation_submissions where lower(email) = lower($1);
prepare delete_feedback(text) as
  delete from public.feedback_submissions where lower(email) = lower($1);
-- Bind the privately confirmed real request address, then execute both statements.
-- execute delete_calculations('REQUESTED-ADDRESS');
-- execute delete_feedback('REQUESTED-ADDRESS');
deallocate delete_calculations;
deallocate delete_feedback;
commit;
```

Remove staging/launch synthetic submissions by their recorded UUIDs after successful checks. No fake founder mailbox, production test profile, or actual visitor data belongs in git. Backups age out according to the project's configured backup policy.

Provider references: [Function deployment](https://supabase.com/docs/guides/functions/deploy), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Cron scheduling](https://supabase.com/docs/guides/cron/quickstart).
