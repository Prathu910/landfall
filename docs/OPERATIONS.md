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

## Failure and rollback

A successful API acknowledgement is required to open the personal report. Network, verification or storage failures keep the answers and show retry; do not disable that acknowledgement check to hide an outage. Feedback independently keeps the message when its write fails. Both depend on the availability of the same Supabase project.

Check Supabase service/function status and sanitized operational logs; do not add payload/email logging. Check Turnstile hostname/action and CORS configuration when a browser fails but HTTP tests pass. If public configuration changes, rebuild Pages. Roll back the frontend and backend independently using compatible migrations; do not drop live tables as a rollback.

Supabase Free may pause inactive projects. Review current plan limits before enabling the email gate in production. No paid plan has been purchased by this implementation.

## Data and contact handling

The project has no email delivery service, login, verified email ownership, paid access or alert subscription. Collected report addresses are not marketing permissions. Distinct submitted addresses are not verified unique people.

Use the restricted Supabase dashboard for records and operator queries. Treat exports as private, keep them outside git and `out`, and delete them after their task. Daily cleanup removes records older than 180 days at its next run; backup expiry follows the provider's configured policy. Monitor the scheduled job history. Deletion requests arrive at the configured privacy mailbox; browser “Clear my answers” does not delete server submissions. Verify the requester's authority before deleting or disclosing records, and do not send profile records to an unverified address.
