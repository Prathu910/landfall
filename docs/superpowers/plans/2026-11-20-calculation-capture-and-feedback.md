# Calculation capture and feedback implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans task by task. Work on `roadmap/occupation-pages`, as requested by the founder; do not create a replacement branch or deploy to main.

**Goal:** Require a persisted email/calculation summary before a personal report, and accept feedback through a private Supabase backend.

**Architecture:** Cloudflare Pages keeps serving the static Next.js export. Two public Supabase Edge Functions validate Turnstile and persist allowlisted records through privileged, atomic Postgres operations; browser table access is denied. Supabase Cron deletes records older than 180 days.

**Tech stack:** Existing Next.js/React/Mantine/Vitest; Deno Edge Functions; Postgres migrations and SQL integration checks; no Auth or email delivery in this release.

## Task 1: Shared submission contract and summary

Files: `src/lib/submissions/contract.ts`, `summary.ts`, colocated tests.

- [ ] Write tests first for rejecting unknown fields, missing/invalid email, malformed UUID, invalid category/summary, non-integer scores, mismatched nomination offsets, invalid occupation/snapshot, oversized feedback, exact date leakage, and age-band boundaries.
- [ ] Run `npx vitest run src/lib/submissions` and observe missing implementations fail.
- [ ] Implement dependency-free shared contracts, normalization and strict shape validation. Summary fields: occupation_code, age_band, location, base_points, points_190, points_491, snapshot_id. Calculation payload adds id, email, privacy_version. Feedback payload adds id, category, message, email (nullable), summary (nullable), privacy_version. Turnstile token is a separate transport field and never persisted.
- [ ] Project only those fields from Profile and PointsResult, using ageOnDate and the report snapshot date. Rerun focused tests.

## Task 2: Supabase backend

Files: `supabase/config.toml`, `supabase/functions/{submit-calculation,submit-feedback}/index.ts`, `_shared/{handler,store,turnstile}.ts`, `supabase/migrations/*`, `supabase/tests/*`, `supabase/functions/deno.json`.

- [ ] Write handler tests before implementation for preflight, rejected origins/method/content type/oversize/unknown fields, missing/expired/incorrect-action token, storage failure, duplicate request, conflict and no private response echoes.
- [ ] Implement public handlers with explicit allowed origins, streaming 16 KB limit, 15-second upstream timeouts, private secrets, and server-side Turnstile checks. OPTIONS returns no submission data. Disable JWT only for these two public handlers.
- [ ] Create both tables with constrained columns, timestamptz, UUID primary keys, email_verified=false and feedback status. Enforce atomic idempotency: equal payload returns existing receipt; different payload with same UUID returns conflict. Restrict all table/RPC operations from anon/authenticated/PUBLIC; grant backend service role only. Enable RLS. No public read endpoint.
- [ ] Install and schedule pg_cron cleanup at 03:00 UTC daily. Cleanup deletes rows older than 180 days; run SQL tests independently of cron where the local server lacks that extension.
- [ ] Test migrations, RLS/grants, insert/retry/conflict (including concurrent behavior), deletion, and absence of unwanted raw profile fields against an isolated local Postgres database. Test Deno handler types and HTTP behavior separately.

## Task 3: Browser transport and Turnstile

Files: `src/components/submissions/{config,transport,use-submission,turnstile}.tsx/ts`, styles and tests where applicable.

- [ ] Test transport for a required persisted receipt, error mapping, network timeout and unconfigured setup; never accept an OK response with an invalid receipt.
- [ ] Add public build-time URL/site-key/privacy-contact variables. Never read or expose service-role or Turnstile secrets in Next.js.
- [ ] Implement an accessible managed Turnstile widget with explicit rendering, cleanup on unmount, expiry/error callbacks, and a refresh after submission failures. Missing configuration produces a useful unavailable state, never a fake success.
- [ ] Implement a locked submission hook: UUID/payload stable across a failed retry, changed payload gets a new UUID, successful response is required. No email or request payload in logs or persistent browser storage.

## Task 4: Personal report gate

Files: `src/components/check-flow.tsx`, extracted `check-review-step.tsx`, submission integration tests/pure lifecycle tests.

- [ ] Extract the existing final review step before adding fields. Retain all existing review fields and local saving behavior.
- [ ] Add required email and collection disclosure on the final step. Only open a personal report after successful save. On error preserve all answers, show retry and focus/announce the error.
- [ ] Exclude sample-origin runs explicitly; sample remains public and is clearly labelled. Add an explicit Start a new check control to leave sample mode. Reset origin and receipt on clear/new; invalidate a receipt when editing, never submit from render effects.
- [ ] Disable double submission/back/clear while a request is pending. Ensure changing answers cannot attach a stale response to a newer profile.
- [ ] Update existing no-email copy where it no longer describes the personal check.

## Task 5: Feedback page and report entry

Files: `src/app/feedback/page.tsx`, `src/components/feedback/*`, `site-footer.tsx`, report prompt, sitemap helper and tests.

- [ ] Implement required category and message, optional reply email, optional unchecked report-summary attachment, pending/error/success states and idempotent retry.
- [ ] Session handoff contains only summary plus created_at, expires after 15 minutes and is consumed/removed. No profile/email in URL. If storage is blocked, open generic feedback.
- [ ] Add footer Feedback and Privacy links and a small report prompt after the opening summary. Hide the prompt when printing.
- [ ] Add feedback metadata/canonical and include `/feedback/` in the sitemap. Verify all pages remain static.

## Task 6: Operations, privacy and release verification

Files: `.env.example`, `.gitignore`, `tsconfig.json`, `eslint.config.mjs`, `package.json`/lockfile, `docs/OPERATIONS.md`, methodology privacy section, CLAUDE, README, STRATEGY, HANDOFF, REPORT-COVERAGE.

- [ ] Pin required tooling, isolate backend/runtime checks, ignore local secrets/runtime state and data exports.
- [ ] Document exact staging/production setup, migrations, Edge Function secrets and deployments, Turnstile hostnames, build-time Cloudflare variables, private review queries, deletion, retention checks and rollback.
- [ ] Describe email plus summary collection accurately; local full-profile saving remains separate. Link a configured privacy contact. Do not invent a working mailbox or claim Auth/marketing/email delivery exists.
- [ ] Run `npm run check`, `npm run build`, backend typechecks/tests, and SQL permission/integration checks. Review spec compliance, then code quality; fix findings before claiming completion.
- [ ] Verify built export in a browser at desktop/390px, keyboard/reduced motion/print; cover personal submit success/failure/retry/sample exclusion and feedback with/without optional context. Use controlled HTTP stubs only for browser states; report separately from real backend tests.
- [ ] Leave production deployment, credentials, indexing, merging and purchases untouched unless separately authorized. Report exact remaining Cloudflare/Supabase account setup steps; do not claim production persistence was verified without a real configured project.

## Progress

Local implementation and reviews completed 20 November 2026. Public infrastructure steps remain pending; no production data collection has been activated.

- Shared contract, summary allowlist, email gate, sample persistence isolation, browser transport/Turnstile, feedback and documentation: implemented.
- Edge Functions, Postgres migration/RLS/idempotency, separate Cron installation script and operator queries: implemented.
- Final evidence: `npm run check` passes 85 files / 860 tests; build statically exports feedback and 479 occupation pages; Deno check and 11 HTTP tests pass; isolated real Postgres permissions/concurrency/retention suite passes.
- Desktop/390px built-export browser checks passed, including required email, successful receipt, storage failure/retry identity, optional context, sample exclusion, linked errors, reduced motion, print prompt hiding and no overflow. Browser service responses were controlled fixtures, separate from the real SQL checks.
- Spec and quality reviews passed after fixing sample storage leakage, backlog status mismatch, retention wording, email field errors, Unicode message length and same-step token clearing.
- External setup remains unchecked: CLI login, staging/production project migrations and Functions deployment, real Turnstile keys, privacy mailbox, scheduled Cron evidence, actual REST-gateway role smoke checks and persisted staging/production submissions.
- Changes are kept locally on the requested branch. No push, merge, production deployment or paid-plan purchase was performed.
