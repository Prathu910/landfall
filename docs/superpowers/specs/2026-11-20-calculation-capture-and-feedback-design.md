# Calculation capture and feedback: proposed design

Date: 20 November 2026. Branch: `roadmap/occupation-pages`.

Status: approved direction and implemented locally, 20 November 2026. The founder required email before personal reports, chose Supabase, and authorized implementation while setting up Cloudflare. Cloudflare Pages hosts the static frontend; separately deployed Supabase storage/Functions and Turnstile support the submission flows. Local checks and review are recorded in HANDOFF.md. Infrastructure deployment and live collection are not yet verified.

## Purpose and confirmed requirements

Understand whether people use MigrateLens, which occupations and points they check, and what would make the product more useful. Collect suggestions, bugs, improvements, and requests for additional features before public launch.

Founder decisions in this conversation:

- Do this work on the current branch, before launch.
- Store an email address with the calculation.
- Require email before the personal report is shown.
- Provide a feedback form welcoming suggestions, feedback, improvements, and requests.
- The founder purchased `migratelens.com` through Hostinger and is setting up Cloudflare.
- Use Supabase for the backend instead of D1, while retaining Cloudflare Pages and Turnstile. Accounts, login and email delivery remain later work.

The proposed saved record is an email plus a limited calculation summary. It is identifiable data, not anonymous analytics. Saving the complete existing `Profile` object is not necessary for the stated purpose and is outside this proposal.

## Current system and necessary changes

The application is a Next.js static export (`out/`). Its points calculation runs in the browser. `src/components/check-flow.tsx` opens the report at the end of step 4. Its existing save option writes the profile to browser local storage only. There is no application database, email service, or account system.

`src/app/methodology/page.tsx` currently promises that profiles remain in the browser and no email address is collected. `CLAUDE.md` also requires personal profile data to stay in the browser. Implementing this founder request must update these statements and the related documentation together with the new behavior. Until implementation, they remain descriptions of the current release.

Occupation pages, the homepage explorer, and `/sample/` remain publicly accessible. The required email applies to the personal report reached from `/check/`.

## Approaches considered

| Approach                                        | Benefit                                                                                                 | Trade-off                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Supabase Postgres and Edge Functions — selected | Supports submission storage now, with Auth available for future accounts, saved reports and paid access | Adds a backend provider alongside Cloudflare; authentication and payments still require implementation |
| Cloudflare Pages Functions and D1               | Uses the hosting account already being configured; supports simple submissions and feedback             | Does not include the authentication service planned for returning users                                |
| Hosted form and analytics services              | Quick initial setup with an existing response dashboard                                                 | Calculation capture and the email gate still need integration; user data goes to additional providers  |

Use Supabase Edge Functions for two submission endpoints and Supabase Postgres for private storage. Keep Next.js in static-export mode on Cloudflare Pages. The browser calls the configured Supabase Functions URL directly; no Cloudflare API proxy, D1 binding, Worker, or Next.js route handler is required for this feature.

Keep Supabase Auth out of this release: entering a required email does not create an account or verify ownership. Future Auth users can be associated with saved calculations only after an explicit, verified ownership flow; never grant access to historical records merely because someone submits a matching email.

Develop on Supabase Free if its limits fit. Its projects may pause after a week of inactivity, and Pro starts at US$25/month at the time of planning. Account for that before relying on the email gate in production, since unavailable storage prevents personal reports from opening. This is not a request to purchase a paid plan.

## Personal report flow

1. Keep the four-step check. On the final step, add a required, clearly labelled email field immediately before the existing overview button.
2. Explain the storage before submission. Proposed copy: “Enter your email to view your report. We save your email, occupation, age band, whether you are in Australia, and points summary to understand how MigrateLens is used. Your full answers stay in your browser. We will not send updates or marketing without a separate opt-in.” Link to the privacy explanation.
3. Use the action label “View my free report”. There is no account creation, emailed report, or report-recovery claim.
4. Validate the email and submission, complete the spam check, and save the record. Open the report only after the server confirms persistence.
5. Disable duplicate submission while pending. On failure, preserve all answers and email, explain that the report could not be opened, and offer Retry. Do not silently discard the capture or falsely claim success.
6. Email is held separately from `Profile`; do not add it to the existing browser-profile persistence or public report view-model. Never place it in a URL, analytics event, rendered report, printout, or request log.
7. Format validation does not prove email ownership. Store `email_verified = false`. Do not require OTP or an email provider in this release.

Mandatory email adds friction; measure accepted submissions and feedback after launch. It does not authenticate visitors or form a secure paywall: the calculator and report renderer remain client-side.

### Exactly what is stored

`calculation_submissions`:

| Field                                     | Meaning                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `id`                                      | Random submission UUID; unique and reused on retries                              |
| `created_at`                              | Server timestamp in UTC                                                           |
| `email`                                   | Trimmed, validated address; preserve local-part spelling and normalize the domain |
| `email_verified`                          | False in this release                                                             |
| `occupation_code`                         | Chosen code, or an explicit points-only value                                     |
| `age_band`                                | Under 18, 18–24, 25–32, 33–39, 40–44, or 45+; never date of birth                 |
| `location`                                | Onshore or offshore only; not inferred nationality or country                     |
| `base_points`, `points_190`, `points_491` | Self-reported calculation totals, not verified eligibility                        |
| `snapshot_id`                             | Dataset version used to generate the report                                       |
| `privacy_version`                         | Version of the collection disclosure shown at submission                          |

Do not send the raw `Profile`, name, exact dates, visa expiry, credential dates, income, employer, documents, or raw IP address to this table. The client must construct an allowlisted summary; the server independently rejects unknown fields. Derive age bands using the calculator's date handling, not an additional browser-clock rule.

The server validates shape, enum values, email length and format, occupation code, points ranges and nomination offsets. The summary is still visitor-supplied data; validation cannot turn it into a verified migration profile.

### Counting behavior

- One explicit successful form submission creates one record. Rendering, hydration, input changes, tabs, scenario changes, and optional state questions do not create records.
- Network retries reuse the same UUID and payload. Same UUID with different content is a conflict, not an overwrite. Refreshing the report does not resend a submission automatically.
- An explicit edit followed by a fresh form submission creates a new UUID and snapshot. A new check or clear action resets the previous submission state.
- `/sample/`, the homepage demo and try-it, and “Try sample answers” runs never contribute to production metrics. Track the run's sample origin; do not detect it by comparing personal answers with the sample's values. Starting a real check resets that origin explicitly.
- Label counts “saved calculations” and “distinct submitted email addresses”. Do not label them verified users, unique people, or delivered emails.
- A capture is recorded before the report renders, so it measures accepted submissions, not proof that someone read the report. Visitors who abandon the form are not measured by these records.

## Feedback flow

Add a static `/feedback/` page, linked from the shared footer. Add a small report prompt after the opening summary: “Was this useful? Tell us what to improve.” It links to the same page without serializing profile data in the URL.

The form opens with: “Help shape MigrateLens. What worked, what needs improving, and what would you like to see next?”

Fields:

- Category, required: Suggestion / Something is wrong / Improvement / Feature request / Other.
- Message, required: 10–3,000 characters.
- Email, optional: “Leave your email if you would like a reply.” This is separate from the report gate, since feedback can also come from visitors who never calculate points.
- For a report-origin visit, an optional, unchecked “Include my occupation and points summary” option. Transfer the summary through short-lived session storage; consume and remove it on arrival. No hidden attachment of the report email or the full profile. If browser storage is blocked, the generic feedback form still works.

Show a brief reminder not to include passport numbers, documents, or other sensitive details. No uploads or star rating in the first version.

`feedback_submissions` stores a unique UUID, server timestamp, category, message, optional contact email, optional explicitly attached summary, disclosure version, and status (`new`, `reviewed`, `planned`, `closed`). Store messages as plain text. Do not render visitor HTML.

Submission shows a pending state, then a success message only after the database write. On failure, retain the message and offer retry. Retries are idempotent. Do not promise an automatic email or a reply time.

## Backend and protection

Supabase Edge Function routes, relative to the configured Supabase project URL:

- `POST /functions/v1/submit-calculation`: validate and persist the required email and allowlisted calculation summary; return a submission reference without echoing the saved email.
- `POST /functions/v1/submit-feedback`: validate and persist feedback; return a submission reference without echoing the message or email.
- `OPTIONS` handles browser CORS preflight without reading or writing submission records. Other methods return 405. There is no public list, search, update, export, or record-read endpoint.

Use Supabase's parameterized client operations or parameterized SQL, explicit column lists, Postgres uniqueness constraints, and versioned migrations. A database function can implement the atomic idempotent insert-and-compare; it must not become an anonymously executable RPC. Use separate production and staging Supabase projects, with local Supabase for tests. Cloudflare preview builds use staging settings and never production. Do not require paid Supabase branching merely to isolate previews.

Enable Row Level Security and revoke direct table and submission-RPC access from `anon` and `authenticated`; no browser policy may permit reads, inserts, updates or deletes. Only the server-side function may write records using its privileged backend client. Keep Supabase secret/service-role credentials and the Turnstile secret in Supabase Edge Function secrets, never in Cloudflare frontend variables, browser bundles, or git. The frontend receives only the public project/Functions URL and public Turnstile site key; any publishable API key used by the client is public, not an authorization boundary. Test direct REST and RPC requests against these restrictions.

These two Functions accept visitors without Supabase Auth sessions. Configure `verify_jwt = false` only for these handlers in `supabase/config.toml`; they must still validate every submission and Turnstile token. This is not permission to expose the database or disable authentication on future account or paid-report endpoints.

Use Turnstile on both submission flows. Validate tokens inside the Edge Function, including success, expected frontend hostname, and expected action. A widget alone is insufficient, and enabling CAPTCHA in Supabase Auth does not protect these custom unauthenticated handlers. Refresh expired tokens and obtain a fresh token when a failed request needs resubmission. An already-persisted retry returns the existing receipt only after checking its payload matches, without a second write.

Set JSON-only requests, a 16 KB body limit, strict field allowlists and length limits, and explicit CORS origins. Production accepts `https://migratelens.com`; a future `www` address redirects to that origin. Staging accepts only configured preview origins and local development addresses, never a wildcard for all `pages.dev` projects. Return `Vary: Origin`, allow only the headers and methods used by the client, and apply the correct CORS headers to both success and error responses so the browser can display errors. Do not use browser cookies or credentialed cross-origin requests in this release. Origin checks are an additional browser control, not authentication or a substitute for spam protection. Do not log submission payloads. Add `Cache-Control: no-store` and `X-Robots-Tag: noindex` to function responses.

Occupation pages and assets remain static and do not call Supabase on load. Keep the existing exported 404 behavior. Feedback should work if the calculation handler is down, and vice versa; a Supabase project or database outage can affect both writes. Frontend builds and backend migrations/Functions deploy separately; apply backward-compatible backend changes before deploying the frontend that uses them.

Detailed responses: 201 for a new persisted submission, 200 for an identical persisted retry, 400 for invalid content, 403 for rejected origin or spam verification, 409 for an idempotency-key conflict, 413 for an oversized body, 415 for the wrong content type, and 503 for unavailable storage or verification services. The client maps these to useful messages without showing internal database errors.

## Founder review and retention

For launch, use the authenticated Supabase Table Editor and SQL Editor. This provides private access to saved calculations and feedback without shipping a custom admin application. Provide copyable, parameterized or fixed SQL examples in an operations guide for:

- Saved calculations per day and week, with the reporting timezone labelled.
- Distinct submitted email addresses within a selected date range.
- Popular occupations and points bands, plus onshore/offshore split.
- New feedback, category breakdowns, and status changes.
- Deleting submissions associated with a specified email on request.

Proposed retention: delete identifiable calculations and feedback older than 180 days in a daily Supabase Cron (`pg_cron`) database job, so removal occurs on the next daily run after the threshold. Do not retain an email hash as an undeclared permanent identifier. Keep cleanup independent of public submissions, check job history, and document that backups expire under the configured backup policy rather than promising immediate deletion from backups. Do not claim automatic expiry until the job is deployed and verified. No separate Cloudflare retention Worker is needed. A privacy contact address must be chosen and configured before collection goes live.

Do not treat the collected addresses as an alert or marketing subscriber list. Add a separate, unchecked opt-in only when an actual email service and unsubscribe process exist. Collecting a required report email does not implement that service.

## Proposed file boundaries

| Location                                         | Responsibility                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `src/lib/submissions/`                           | Pure types, allowlisted summary projection, validation and idempotency rules, with tests                        |
| `src/components/submissions/`                    | Email field, submission state, Turnstile integration and fetch adapter                                          |
| `src/components/check-flow.tsx`                  | Small final-step integration; extract the affected final-step section first because this component is oversized |
| `src/components/feedback/`                       | Feedback form, pending/error/success states and styles                                                          |
| `src/app/feedback/page.tsx`                      | Static page, title, description and canonical                                                                   |
| `src/components/site-footer.tsx`                 | Feedback and privacy links                                                                                      |
| `src/components/report/`                         | Small feedback prompt, excluded or simplified in print                                                          |
| `supabase/functions/submit-calculation/index.ts` | Thin calculation submission handler                                                                             |
| `supabase/functions/submit-feedback/index.ts`    | Thin feedback submission handler                                                                                |
| `supabase/functions/_shared/`                    | Backend database access, CORS, request validation and Turnstile verification                                    |
| `supabase/migrations/`                           | Postgres schema, indexes, grants, RLS, idempotent submission operation and daily retention job                  |
| `supabase/tests/`                                | SQL permission/idempotency tests and backend integration fixtures                                               |
| `supabase/config.toml`                           | Local project settings and explicit public-submission Function configuration                                    |
| `supabase/functions/deno.json`                   | Pinned backend dependencies, typecheck and test configuration                                                   |
| `.env.example`, `.gitignore`                     | Document public settings and ignore local secrets, Supabase local state and data exports                        |
| `docs/OPERATIONS.md`                             | Setup, queries, deletion, retention, failure handling and launch checklist                                      |

Keep fetch out of `src/lib`, following the existing architecture. Define one canonical submission contract and verify it can be imported by both the frontend toolchain and the Deno Functions toolchain; do not maintain two independent schemas that can drift. Pin frontend, CLI and backend dependencies at implementation time, including the relevant lockfiles. Typecheck and test Deno Functions separately from Next.js; exclude backend runtime files from the frontend TypeScript include. Verify the local Supabase CLI prerequisites and document them before asking the founder to run the backend locally.

## Delivery sequence

1. Finalize this design and record the founder's accepted scope.
2. Write the detailed implementation plan with executable task checks and exact dependency versions.
3. Define the data contracts and migrations; test the summary allowlist, validation and idempotency boundaries first.
4. Implement and test Edge Functions with local Supabase, real Postgres migrations, and mocked Turnstile responses. Verify duplicate submissions, CORS and preflight, and denied direct database/RPC access against the real local stack rather than relying entirely on mocks.
5. Integrate required email capture into the check and preserve its existing validation, sample behavior, printing, editing and local saving.
6. Build the feedback page and entry points; test submission, retry, optional context and keyboard/error states.
7. Update the privacy explanation, applicable product constraints, README, handoff, coverage documentation and sitemap. Adding `/feedback/` changes the expected static-page sitemap count.
8. Add the daily Supabase Cron job and operations guide. Create a staging Supabase project, apply migrations, deploy the Edge Functions and secrets, and configure its URL/site key in Cloudflare preview builds. Verify the integrated preview before setting up production collection.
9. Run `npm run check`, `npm run build`, the separate Edge Function and Postgres checks, and browser verification against the built `out/` at desktop and 390px, including reduced motion and printing. Serve local Supabase Functions separately; plain `next dev` and a static server do not start the backend. Verify both local cross-origin requests and the staging Cloudflare preview.
10. Configure production Supabase, Turnstile, Cron and privacy contact; apply reviewed migrations and deploy Functions before the frontend; verify a production test submission and deletion; remove test data; then proceed with the domain/indexing/Search Console launch work. Validate Cloudflare is building the static export with `npm run build` and publishing `out`, without an OpenNext adapter.

The implementation now follows this design locally; production infrastructure and domain/indexing preparation remain separate. See HANDOFF.md for exact verification evidence and pending account-dependent setup.

## Acceptance checks

- A personal report requires a valid email and a successful database acknowledgement; the existing public sample does not.
- A saved record contains the promised email and summary only. Exact dates and the raw profile are absent from requests, records and application logs.
- No record is labelled verified; no email is sent and no future alert subscription is silently created.
- A double click, rerender, reload or retry does not inflate one submission. An explicit new submission is counted separately.
- Demo and sample-origin runs are excluded; preview traffic is isolated from production.
- Optional local profile saving, clear answers, points-only checks, report edits, scenario tools and state questions still work.
- Feedback works without a personal report or email, preserves text on errors, and stores optional context only when selected.
- Keyboard focus and announced errors work; text meets the existing mobile/font floor; feedback controls do not clutter printed reports.
- Both Functions reject invalid, oversized, unknown-field and spam submissions. A failed insert never returns success. No public route can read saved records.
- Direct anonymous and authenticated REST/RPC access to submission data is denied. Privileged keys are absent from the static export. CORS preflight and error responses work for configured frontend origins and reject other browser origins.
- The owner can privately inspect totals and feedback and execute a documented deletion. Daily retention is verified separately from the API.
- Static occupation pages still export and load without invoking the submission backend.
- The public privacy explanation accurately describes the deployed collection and retention behavior.

## Sources checked while planning

- [Cloudflare Pages static export](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/): host the Next.js static export; use this repository's `npm run build` and `out` output rather than an OpenNext build.
- [Supabase database](https://supabase.com/docs/guides/database/overview) and [Edge Functions](https://supabase.com/docs/guides/functions): Postgres storage and server-side submission handlers.
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Function secrets](https://supabase.com/docs/guides/functions/secrets): restrict database access and keep privileged credentials on the backend.
- [Function configuration](https://supabase.com/docs/guides/functions/function-configuration) and [CORS](https://supabase.com/docs/guides/functions/cors): configure public submission handlers without implying that they authenticate visitors.
- [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/): server validation is mandatory; tokens expire and have replay restrictions.
- [Supabase Cron](https://supabase.com/docs/guides/cron): daily database cleanup using `pg_cron`.
- [Supabase local development](https://supabase.com/docs/guides/local-development/cli/getting-started): local backend and migrations are separate from the static frontend server.
- [Supabase pricing](https://supabase.com/pricing): Free-project inactivity behavior and Pro pricing; no unlimited or permanent-zero-cost promise.
