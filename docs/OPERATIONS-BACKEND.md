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

**Two switches.** The frontend calls `write-read` only when its public build setting `NEXT_PUBLIC_READ_ENABLED` is `true`, and the Function serves reads only when `READ_ENABLED=true`. Both are off by default. Turn them on only after the privacy text and the coordinated `PRIVACY_VERSION` deploy are live.

**Enablement checklist (ruling R31).** The frontend shows the AI sentences in the email gate and privacy text only when built with `NEXT_PUBLIC_READ_ENABLED=true`; `PRIVACY_VERSION` is not bumped until the rollout, because the deployed Functions check it exactly. Before any of it: set a monthly spend limit on the Anthropic workspace; build a Postgres-backed use counter per submission id (ids only) for `write-read`, because the in-memory per-token count resets per instance, and do not set `READ_ENABLED=true` until it exists; confirm that the hosted Supabase gateway puts the real client address first in `X-Forwarded-For` and that a hosted deploy resolves the `npm:@anthropic-ai/sdk` import. Then, in order: (1) set the Function secrets `ANTHROPIC_API_KEY`, `READ_MODEL`, `READ_MAX_OUTPUT_TOKENS`, `READ_TOKEN_SECRET`, leaving `READ_ENABLED` unset; (2) bump `PRIVACY_VERSION` (and the notice date in the methodology page) and build the frontend with `NEXT_PUBLIC_READ_ENABLED=true`; (3) deploy the Functions and then the frontend back to back, because between the two deploys the old live frontend sends the old `PRIVACY_VERSION`, which the new Functions reject (or make the Functions accept both versions for a day, then drop the old one); (4) set `READ_ENABLED=true`. With either off, every report shows the deterministic template read.

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

**No storage, no content logs.** Facts and generated text are never written to the database or logs. A configuration problem logs one line, `write-read disabled: <reason>` (for example `READ_MODEL is not an allowed model ID`), and an unexpected failure (the 503 answer) logs `write-read failed: <error class>` plus `(HTTP <status>)` when the error carries one; neither ever logs the facts, text, error message, key or token; `READ_ENABLED` being off is not logged. Token use counts and the rate limit live in memory per Function instance, so they are best effort: a cold start or a second instance starts fresh, and each token still expires after 10 minutes. The rate-limit map holds at most 1000 addresses and drops the oldest first.

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

## Paid reports

The paid PR report (₹699 / US$14, the first 100 free as Founding 100 after an emailed code) runs on eight more Functions. The design is [the paid report spec](superpowers/specs/2026-11-25-paid-report-design.md); the wire contract is `src/lib/orders/contract.ts`. Code is in `supabase/functions/_shared/report/`, migrations `20261125000100_paid_reports.sql`, `20261125000200_founding_claim_source.sql`, `20261125000210_refunds_before_issue.sql`, `20261125000220_paid_order_snapshot.sql`, `20261125000230_paid_order_stuck.sql` and `20261125000240_duplicate_payments.sql`, and the schedule `supabase/cron/20261125000300_report_delivery.sql`. Nothing here is live until the founder completes the setup below; do not say payments or report emails work before the rehearsal passes.

| Function           | Caller               | Request                                                                  | Authenticated by                   |
| ------------------ | -------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| `report-quote`     | `/check/` checkout   | `GET`                                                                    | Allowed origin                     |
| `report-order`     | `/check/` checkout   | `POST {profile, email, currency, consent, asOf, turnstile_token, paid?}` | Allowed origin, Turnstile `report` |
| `report-verify`    | `/check/` checkout   | `POST {claimId, code}`                                                   | Allowed origin, the emailed code   |
| `report-confirm`   | `/check/` checkout   | `POST {orderId, paymentId, signature}`                                   | Allowed origin, Razorpay signature |
| `report-get`       | `/report/`           | `POST {token}` (never in a URL), 30 a minute per address                 | Allowed origin, the link token     |
| `report-revise`    | `/report/`           | `POST {token, profile}`                                                  | Allowed origin, the link token     |
| `razorpay-webhook` | Razorpay             | `POST` event                                                             | `X-Razorpay-Signature` (raw body)  |
| `report-deliver`   | pg_cron, every 5 min | `POST`                                                                   | `x-deliver-secret` header          |

Every browser Function follows the submission rules above: exact origins, the 16 KiB body cap, `Cache-Control: no-store`, `X-Robots-Tag: noindex`. A business outcome is HTTP 200 with `{ "kind": "error", "code": … }`; `invalid` and `signature` are 400, `verification` 403, `limited` 429 and `busy` 503 (no detail; retry). The webhook and deliver Functions have no CORS and answer `{ "ok": true }`, 401 unsigned, or 500 so the caller retries. No Function logs a body, token, email or key. Prices come only from `report_settings`; a request's amount is ignored. The report is built from the site's own static data (`REPORT_SITE_URL/data/...`), so the monthly import needs no Function redeploy. A paid order keeps the occupation's data as it was quoted, and its report is built from that copy, so a monthly deploy between quote and payment can't stop an issue; if a paid order still can't be built (the site down), the webhook answers 500 and Razorpay retries, and the order stays `created`, never `failed`. The captured payment id is recorded on the order before the build, and the first failed build emails `hello@migratelens.com` once for that order ("Paid order not issued yet", ids only; `alerted_at` records it), so a charged order with no report shows in the founder query below. `paid: true` on `report-order` (the checkout's "buy another" for an email that already has a founding report) skips the founding offer and creates a Razorpay order. When the webhook issues first, `report-confirm` for the same signed payment answers `issued` with that report's token (read from `token_enc` through `paid_order_token`), so the buyer still sees the report at once; it answers `pending` only once delivery has cleared the stored token. A second payment captured on an order that already has its report (a late-approved UPI collect, say) issues nothing and emails `hello@migratelens.com` once ("Duplicate payment, refund it", ids only). Refund that payment in Razorpay: `report_refund` revokes a report only for the payment that issued it (or an order with no payment yet), and records any other refunded payment in `report_orders.other_refunds`, leaving the report in place. One known exception to "never mixes months" (review M6, not yet fixed): the stored snapshot holds the occupation's core and detail only, and the occupation index and state rules are read live, so a revision, or a paid order quoted before a monthly deploy, uses that month's SkillSelect data with the state rules the site serves at build time.

### Founder setup

Do these in order, first on staging with Razorpay **test mode**, then on production.

**1. Razorpay.** In the Dashboard (test mode first): Account & Settings → API Keys → generate a key; note the key ID and secret. Settings → Webhooks → Add: URL `https://<project-ref>.supabase.co/functions/v1/razorpay-webhook`, a strong secret of your own, events `payment.captured`, `order.paid` and `refund.processed` only. Keep payment auto-capture on (the default), and never turn it off: the webhook issues only on a capture, but `report-confirm` issues on Checkout's signature, which Razorpay sends at authorisation, so with auto-capture off a report could be issued for a payment that is later auto-refunded. Request International Payments only after the legal pages are live; link PayPal if Razorpay asks.

**2. Resend.** Create the account, add the domain `migratelens.com`, add its DNS records (SPF, DKIM, and the return-path MX) in Cloudflare DNS, and wait for "Verified". Create an API key with sending access only. The sender is `REPORT_EMAIL_FROM`, for example `MigrateLens <report@migratelens.com>`. Keep click and open tracking off for `migratelens.com` (in the domain's settings in Resend): click tracking would route the report link, and so its `#` token, through Resend's redirect. Founding codes and report emails share Resend's free daily limit; watch it at launch.

**3. Cloudflare Browser Rendering.** My Profile → API Tokens → Create a custom token with the single permission Account → **Browser Rendering → Edit**, for this account only. Note the account ID (Workers & Pages overview). The Workers Free plan gives 10 browser minutes a day; when a day's minutes run out, the link email goes out with "PDF to follow" and the PDF follows after 00:05 UTC.

**4. Supabase secrets.** Put these in the private `supabase/.env.staging` (and later `.env.production`), never in git, chat or a `NEXT_PUBLIC_` variable, then `npx supabase secrets set --env-file supabase/.env.staging`:

| Secret                    | Value                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `RAZORPAY_KEY_ID`         | The key ID (`rzp_test_…`, later `rzp_live_…`). It reaches the browser only inside a `report-order` reply. |
| `RAZORPAY_KEY_SECRET`     | The key secret (checks Checkout's payment signature).                                                     |
| `RAZORPAY_WEBHOOK_SECRET` | The secret typed when adding the webhook.                                                                 |
| `RESEND_API_KEY`          | The Resend API key.                                                                                       |
| `REPORT_EMAIL_FROM`       | The verified sender, `MigrateLens <report@migratelens.com>`.                                              |
| `CLOUDFLARE_ACCOUNT_ID`   | The Cloudflare account ID.                                                                                |
| `CLOUDFLARE_BR_TOKEN`     | The Browser Rendering token.                                                                              |
| `REPORT_SITE_URL`         | The site the data and `/report/` are read from: `https://migratelens.com`, or the staging preview URL.    |
| `REPORT_DELIVER_SECRET`   | 32 random bytes as hex: `openssl rand -hex 32`. The same value goes into Vault (step 6).                  |
| `REPORT_TOKEN_KEY`        | 32 random bytes, base64: `openssl rand -base64 32`. Encrypts the link token for the PDF job.              |

Plus the existing `ALLOWED_ORIGINS` and `TURNSTILE_SECRET_KEY` (the Turnstile widget must allow the action `report`); `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided. Changing `REPORT_TOKEN_KEY` makes undelivered reports' PDFs fail (with an alert); rotate it only when `report_delivery_queue` would be empty.

**5. Migrations and Functions.** Run `npm run engine:bundle` if `supabase/functions/_shared/report-engine.js` is out of date, then from the repository root:

```sh
npx supabase db push --remote
for fn in report-quote report-order report-verify report-confirm report-get report-revise razorpay-webhook report-deliver; do
  npx supabase functions deploy "$fn" --use-api
done
```

`verify_jwt = false` is set for each in `supabase/config.toml`; each checks its own caller as in the table above.

**6. Schedule.** Enable **pg_cron** and **pg_net** in Database → Integrations (Vault is on by default). In the SQL Editor, as the project owner, create the two Vault secrets (the deliver secret is the `REPORT_DELIVER_SECRET` value from step 4):

```sql
select vault.create_secret('<REPORT_DELIVER_SECRET value>', 'report_deliver_secret');
select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/report-deliver', 'report_deliver_url');
```

Then apply the schedule (it refuses to install without both extensions, both secrets and a UTC cron time zone):

```sh
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/cron/20261125000300_report_delivery.sql
```

It installs `migratelens-report-delivery` (every 5 minutes: the job reads the URL and secret from Vault and posts to `report-deliver`) and `migratelens-report-retention` (03:10 UTC daily: `purge_expired_reports()`, which clears reports 12 months after issue but keeps the token hash, number and status so the link says "expired"). Reapplying updates both named jobs. Confirm runs with `select status, start_time, return_message from cron.job_run_details where jobid in (select jobid from cron.job where jobname like 'migratelens-report-%') order by start_time desc limit 10;` and pg_net replies with `select status_code, created from net._http_response order by created desc limit 10;` (expect 200).

**7. Settings.** Table Editor → schema `public` → table `report_settings` (one row). Check `founding_enabled` true, `founding_limit` 100, `price_inr` 69900, `price_usd` 1400, `usd_enabled` false. Edit them there at any time, no deploy needed: raise or lower the limit, switch the founding offer off, change a price (smallest unit: paise, cents), or set `usd_enabled` true once Razorpay activates international payments. The checkout's count reads the real number of founding reports issued. One founding report per email address, whatever its letter case (`Aarav@x.com` and `aarav@x.com` share one place; `+tags` and dots count as different addresses); emails go to the address as typed.

**8. Rehearsal (test mode, on the staging preview).** Use Razorpay's test cards or test UPI and your own email:

1. A founding claim: the code email arrives; a wrong code shows tries left; the right code opens the report; the report email arrives with the PDF (or the link, then the PDF).
2. A paid INR order (set `founding_limit` to the issued count first): pay in Checkout; the report opens; the email has the receipt and PDF.
3. A dismissed checkout: close Razorpay Checkout, then pay on the second try; one report, one charge.
4. A closed tab after payment: pay, close the tab before the report opens; the webhook issues it and the email arrives within a few minutes.
5. A refund: refund a test payment in the Dashboard; the link then says the report was refunded.

Also check the three things the offline tests could not (they were built from the providers' documentation without network access):

- **Cloudflare PDF request shape:** the PDF arrives, is the print layout (not the screen page), and fits A4. If it doesn't, compare `supabase/functions/_shared/report/pdf.ts` with the [PDF endpoint docs](https://developers.cloudflare.com/browser-rendering/rest-api/pdf-endpoint/).
- **Resend's `Idempotency-Key` header:** in Resend → Emails, each report has one link email and at most one PDF email, even after a retried run.
- **Resend `Idempotency-Key` reused with a different body (PDF-attached vs link-only email):** the link email's key doesn't say whether the PDF is attached, so a retry that changes the attachment reuses the key with another body. Check what Resend answers (its docs say 409) and that the email still goes out.
- **Razorpay webhook payloads:** in Dashboard → Webhooks → the webhook's deliveries, each event got 200, and a `payment.captured` body has `payload.payment.entity` with `id`, `order_id`, `amount`, `currency` and `status: "captured"` (and a refund body `payload.refund.entity.payment_id`), as `supabase/tests/fixtures/razorpay-*.json` assume.

Check also: an alert email reaches `hello@migratelens.com` when delivery fails 5 times (say, by giving a staging project a wrong `RESEND_API_KEY` for a while); a paid order still issues when the site moves to a new month between Checkout and payment (it is built from the data it was quoted on). A paid order that can't be built stays `created` while the webhook answers 500 (Razorpay → Webhooks shows those failing deliveries), gets its payment id at once, and sends one "Paid order not issued yet" alert however often it is retried; it issues as usual once the site is back. An email that already has a founding report can buy another while the founding offer is open (the checkout's "buy another" pays at the full price).

**9. Live keys.** Switch Razorpay to live mode, generate live keys, add the live webhook with a new secret, set the three `RAZORPAY_*` secrets on production, and run one real ₹699 payment end to end, then refund it in the Dashboard.

### Founder queries for paid reports

```sql
-- Orders that need a look: failed (amount-mismatch; no-data on orders before 20261125000220), paid with no
-- report, or paid but not issued 15 minutes after the payment was seen (the report can't be built yet).
select razorpay_order_id, razorpay_payment_id, status, failure_reason, amount, currency, created_at, paid_at, alerted_at
from public.report_orders where kind = 'paid' and (status = 'failed' or (status = 'paid' and report_id is null)
  or (status = 'created' and razorpay_payment_id is not null and paid_at <= now() - interval '15 minutes'))
order by created_at desc;
-- Deliveries still pending or failed.
select report_no, version, pdf_status, email_status, pdf_attempts, email_attempts, next_attempt_at, email_next_at
from public.reports where status = 'issued' and (pdf_status <> 'done' or email_status <> 'sent')
order by first_issued_at;
```

A `created` order in that list was charged and has no report. If it still isn't issued once the cause is fixed (the site or its data back), refund the payment in the Razorpay Dashboard (the `refund.processed` webhook marks the order refunded, so a late retry issues nothing), and if you want the order out of the retry path first, run `select public.paid_order_fail('<order_id>', 'no-data');` in the SQL Editor.

A deletion request for paid reports clears the report's personal columns (`update public.reports set email = null, profile = null, payload = null, engine_data = null, token_enc = null, status = 'expired' where lower(email) = lower('<address>')`), the order profiles (`update public.report_orders set profile = null, engine_data = null where lower(email) = lower('<address>')`) and any founding claim (`delete from public.founding_claims where lower(email) = lower('<address>')`), in one transaction, after the confirmation step above; keep order amounts, ids, dates and email for accounting until the founder's CA says otherwise.
