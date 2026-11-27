# Paid report, plan 2 of 3: orders backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Supabase backend that sells and issues reports: settings, the founding count, the email codes, Razorpay orders and webhooks, issuing, stored reports with 7-day corrections, and delivery (PDF and email) with retries.

**Architecture:** Storage and every rule that must hold under concurrency (the founding count, idempotent issue, the correction window) live in SQL functions in one new migration, called with the service key through PostgREST RPC, as `submit_calculation` is today. Thin Edge Functions validate input, call Razorpay, Resend and Cloudflare, build the payload with plan 1's `report-engine.js`, and call the RPCs. All network clients take an injected `fetch`, so Deno tests run offline.

**Tech Stack:** Supabase Postgres 17 (migrations, pg_cron + pg_net for the schedule), Supabase Edge Functions (Deno 2.9), Razorpay Orders API and webhooks, Resend email API, Cloudflare Browser Rendering REST API (PDF), Turnstile.

**Spec:** `docs/superpowers/specs/2026-11-25-paid-report-design.md`, sections "Server side", "Data", "PDF and email", "Refunds and expiry", "Failure handling", "Security" and "Founder setup". It depends on plan 1 (`…-1-engine.md`): `issuePayload`, `freeResult`, `parseProfile`, `parseEngineData`, `ReportPayload`, `ReportMeta`.

## Global Constraints

- Prices are integers in the smallest unit: INR `69900`, USD `1400`. Prices come **only** from `report_settings`; no request carries an amount.
- Founding limit `100`, `founding_enabled true`, `usd_enabled false` as migration defaults. One founding report per normalised email (`normalizeEmail` from `src/lib/submissions/contract.ts`).
- Codes are 6 digits, expire after 10 minutes, allow 5 tries, and can be resent once per 60 s. Only the SHA-256 of a code is stored.
- Link tokens are 32 random bytes, base64url. Only `sha256(token)` (hex) is stored. Tokens never appear in a URL query, a log line or an error message.
- Corrections: within 7 days of the first issue, at most 3 revisions; every revision rebuilds from version 1's data month.
- Reports expire 12 months after issue. Profile and view are deleted then; `token_hash`, `status`, `report_no` and `expires_at` stay so the link can say "expired".
- Report numbers are `ML-YYMM-NNNN`: issue year and month in UTC, then a global sequence zero-padded to 4.
- Webhook events handled: `payment.captured`, `order.paid`, `refund.processed`. Everything else returns 200 and is ignored.
- Secrets come only from the Supabase function env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_BR_TOKEN`, `REPORT_SITE_URL` (for example `https://migratelens.com`), `REPORT_DELIVER_SECRET`, plus the existing `ALLOWED_ORIGINS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY`.
- Every public function follows `_shared/http.ts`: the origin allowlist, the 16 KB body cap, `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
- Email copy follows `BANNED_COPY`, says "Information from published data, not migration advice", and names `hello@migratelens.com` and "MigrateLens, Ahmedabad, India".
- `npm run check`, `npm run backend:check`, `npm run backend:test` and `npm run backend:test:sql` pass after every task. Commits carry `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No live network calls in tests.

## Review Focus

- **The webhook and `report-confirm` racing for one payment:** exactly one report, and both callers get the same token. The SQL test runs both RPCs in parallel (Task 2) and the Deno test calls confirm after the webhook (Task 6).
- **A webhook whose amount or currency differs from the stored order** (tampering, or a dashboard-made payment against our order id): no issue; the order is marked `failed` with reason `amount-mismatch`. Test in Task 6.
- **101 people confirming founding codes at the same moment** with limit 100: exactly 100 issued, and the 101st gets `founding-full` with the paid quote. SQL concurrency test in Task 2.
- **Someone guessing codes:** the 6th wrong try locks the claim, and resend can't reset the try count. Tests in Task 2 (SQL) and Task 5 (function).
- **A PDF render refused for the day (HTTP 429):** the report email still goes out with the link and "PDF to follow", and delivery retries after 00:00 UTC without sending the link email twice. Test in Task 8.

---

### Task 1: Shared contract and email copy

**Files:**

- Create: `src/lib/orders/contract.ts` (dependency-free, imported by Deno with `.ts` and by the frontend), `src/lib/orders/contract.test.ts`, `src/lib/orders/emails.ts`, `src/lib/orders/emails.test.ts`, `src/lib/orders/seller.ts` (`export const SELLER = { name: "MigrateLens", city: "Ahmedabad", country: "India", email: "hello@migratelens.com" } as const`)
- Import rule: `emails.ts` imports only `./seller.ts` and `./contract.ts`, written **with** the `.ts` extension so Deno can load it (`tsconfig.json` already sets `allowImportingTsExtensions`).

**Interfaces:**

- Produces, in `contract.ts`:
  - `type Currency = "INR" | "USD"`
  - `type Quote = { prices: { INR: number; USD: number | null }; founding: { enabled: boolean; remaining: number; limit: number } }` (USD is null when `usd_enabled` is false)
  - `type OrderRequest = { profile: unknown; email: string; currency: Currency; consent: true; asOf: string; turnstile_token: string }`
  - `type OrderResponse = { kind: "code-sent"; claimId: string; emailHint: string } | { kind: "razorpay"; orderId: string; keyId: string; amount: number; currency: Currency } | { kind: "issued"; token: string } | { kind: "error"; code: OrderErrorCode }`
  - `type OrderErrorCode = "invalid" | "no-data" | "founding-used" | "founding-full" | "usd-off" | "busy" | "verification"`
  - `type VerifyRequest = { claimId: string; code: string }`; `type VerifyResponse = { kind: "issued"; token: string } | { kind: "error"; code: "wrong-code" | "expired" | "locked" | "founding-full" }`
  - `type ConfirmRequest = { orderId: string; paymentId: string; signature: string }`; `type ConfirmResponse = { kind: "issued"; token: string } | { kind: "error"; code: "signature" | "pending" }`
  - `type ReportGetResponse = { kind: "report"; payload: ReportPayloadJson } | { kind: "revoked" } | { kind: "expired" } | { kind: "not-found" }`. Here `ReportPayloadJson` is `unknown`; the frontend narrows it with plan 1's types.
  - `type ReviseRequest = { token: string; profile: unknown }`; `type ReviseResponse = { kind: "revised"; version: number } | { kind: "error"; code: "closed" | "limit" | "invalid" | "occupation-changed" }`
  - Validators `validateOrderRequest(v: unknown): OrderRequest | null`, `validateVerify`, `validateConfirm`, `validateRevise`
  - `function emailHint(email: string): string`: `"a•••@gmail.com"` style (first character, then `•••`, then `@domain`).
- Produces, in `emails.ts`, pure functions returning `{ subject: string; html: string; text: string }`:
  - `codeEmail({ code })`
  - `reportEmail({ name, reportNo, link, issuedAt, amount, currency, paymentId, pdfAttached })`
  - `pdfFollowEmail({ reportNo, link })`
  - `revisedEmail({ reportNo, version, link })`

  Each carries the refund line ("7-day no-questions refund: reply or write to hello@migratelens.com"), the "not migration advice" line and the seller line.

- [ ] **Step 1: Write the failing tests.**
  - The validators reject:
    - missing `consent`;
    - an amount field (unknown keys are dropped, and `amount` must never pass through);
    - a bad currency;
    - an email that fails `validEmail`;
    - a 7-digit code;
    - a token that isn't 43 base64url characters.
  - `emailHint("aarav@gmail.com") === "a•••@gmail.com"`.
  - The copy sweep: no template output contains a `BANNED_COPY` pattern, and every one contains `hello@migratelens.com` and "not migration advice".
  - `reportEmail` with `pdfAttached: false` says the PDF will follow.
- [ ] **Step 2: Run** `npx vitest run src/lib/orders`. Expected: FAIL.
- [ ] **Step 3: Implement** both modules. The HTML is a single table layout with inline styles, which email clients need; the light brand colours come from `src/lib/brand/palette.ts` and are written as literals inside `emails.ts` only (emails can't use CSS tokens). Add `src/lib/orders/emails.ts` to the allowlist in `src/app/colour-literals.test.ts`, with a comment saying why.
- [ ] **Step 4: Run** `npx vitest run src/lib/orders src/app/colour-literals.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(orders): shared contract and email templates`.

### Task 2: Migration: settings, reports, orders, founding claims

**Files:**

- Create: `supabase/migrations/20261125000100_paid_reports.sql`
- Modify: `supabase/tests/postgres_test.py` (new behavioural checks)

**Interfaces** (SQL functions, `security invoker`, `search_path = ''`, executable only by `service_role`; tables have RLS on and no grants to `anon` or `authenticated`):

- `report_quote() returns jsonb`: the `Quote` shape.
- `founding_start(p jsonb) returns jsonb`. Input `{email, code_hash, profile, as_of}`. Output `{status: "sent", claim_id} | {status: "used"} | {status: "full"} | {status: "off"} | {status: "wait", seconds}`. It reuses an open claim for the same email (new code, same try count) and enforces the 60 s resend gap. `used` means the email already has an issued founding report.
- `founding_confirm(p jsonb) returns jsonb`. Input `{claim_id, code_hash, report}`, where `report` is `{token_hash, token_enc, payload, engine_data, data_as_at}`. Output `{status: "issued", report_no, report_id} | {status: "wrong", tries_left} | {status: "expired"} | {status: "locked"} | {status: "full"}`. It locks the `report_settings` row (`for update`), counts issued founding orders, and inserts the report plus a `kind = 'founding'` order in one transaction.
- `paid_order_create(p jsonb) returns jsonb`. Input `{email, currency, profile, as_of, razorpay_order_id}`. It stores a pending order with the amount and currency from settings at that moment.
- `paid_order_amount(p_currency text) returns integer` (read by the function before calling Razorpay).
- `paid_issue(p jsonb) returns jsonb`. Input `{razorpay_order_id, razorpay_payment_id, amount, currency, report}` (`report` has the same shape as in `founding_confirm`). Output `{status: "issued" | "existing", report_id, report_no, token_hash_matches: boolean} | {status: "mismatch"} | {status: "unknown-order"}`. It is idempotent on the order id: a second call returns `existing` and stores nothing new. Payment id is unique.
- `report_by_token(p_token_hash text) returns jsonb`: `{status: "issued", payload, version} | {status: "revoked"} | {status: "expired"} | {status: "missing"}`.
- `report_revise(p jsonb) returns jsonb`. Input `{token_hash, payload, now}`. Output `{status: "revised", version} | {status: "closed"} | {status: "limit"}`.
- `report_revoke_by_payment(p_payment_id text) returns jsonb`
- `report_delivery_queue(p_limit int) returns jsonb`: issued reports with `pdf_status` in (`pending`, `retry`) whose `next_attempt_at <= now()`, or `email_status` in (`pending`, `retry`).
- `report_delivery_mark(p jsonb) returns void`: `{report_id, pdf_status?, email_status?, next_attempt_at?}`. It increments attempt counters.
- `purge_expired_reports() returns void`
- `paid_order_get(p_razorpay_order_id text) returns jsonb`: `{email, currency, amount, profile, as_of, status}` or null.
- `report_rate(p_key text, p_limit int) returns boolean`: a fixed one-minute window counter in `report_rate_hits`; it returns false once over the limit.
- Extra columns, needed by Tasks 6–8:
  - `reports.engine_data jsonb`: the core and detail the report was built from, so corrections rebuild from the same month;
  - `reports.token_enc text`: AES-GCM ciphertext of the token, for PDF rendering, cleared after delivery;
  - `reports.first_issued_at`, `next_attempt_at`, `pdf_attempts`, `email_attempts`, `link_email_sent boolean`, `pdf_email_sent boolean`.
- Tables, as the spec's "Data" section:
  - `report_settings`: a single row, enforced by `id boolean primary key default true check (id)`.
  - `reports`.
  - `report_orders`.
  - `founding_claims`.
  - Sequence `report_no_seq`.

  Status columns are `text` with `check` lists. `reports.token_hash` is unique; `report_orders.razorpay_order_id` and `razorpay_payment_id` are unique where not null.

- [ ] **Step 1: Write the failing SQL checks** in `postgres_test.py`:
  - `"quote defaults"`: INR 69900, USD null, founding remaining 100.
  - `"founding claims stop at the limit"`: set the limit to 3, run 5 parallel `founding_start` + `founding_confirm` pairs with different emails on a thread pool (as the existing concurrency check does), and expect exactly 3 `issued` and 2 `full`.
  - `"one founding report per email"`: a second `founding_start` for the same email after an issue returns `used`.
  - `"five wrong codes lock the claim; resend keeps the count"`.
  - `"an expired code is refused"`: set `expires_at` in the past.
  - `"paid issue is idempotent under a race"`: two parallel `paid_issue` calls, one report, and the second returns `existing`.
  - `"amount mismatch is refused"`: `paid_issue` with `amount` 100 returns `mismatch`.
  - `"revise: three times, then limit; after 7 days, closed"`.
  - `"refund revokes"`; `"purge keeps the token row as expired"`.
  - `"anon and authenticated can't read or call anything"`, as the existing permission checks.
- [ ] **Step 2: Run** `npm run backend:test:sql`. Expected: FAIL.
- [ ] **Step 3: Write the migration.**
- [ ] **Step 4: Run** `npm run backend:test:sql`. Expected: PASS, with the existing checks unchanged.
- [ ] **Step 5: Commit** `feat(db): paid reports, orders and founding claims`.

### Task 3: Razorpay client

**Files:**

- Create: `supabase/functions/_shared/report/razorpay.ts`, `supabase/tests/razorpay_test.ts`
- Modify: `supabase/functions/deno.json` (add the test and the files to `check`)

**Interfaces:**

- Produces:
  - `async function createRazorpayOrder(cfg: { keyId: string; keySecret: string }, order: { amount: number; currency: Currency; receipt: string; notes: Record<string, string> }, fetcher: typeof fetch): Promise<{ id: string; amount: number; currency: Currency }>`. It POSTs to `https://api.razorpay.com/v1/orders` with Basic auth and a 15 s timeout, and throws `RazorpayError` on non-2xx.
  - `async function hmacHex(secret: string, message: string): Promise<string>` (WebCrypto HMAC-SHA256)
  - `async function validPaymentSignature(orderId: string, paymentId: string, signature: string, keySecret: string): Promise<boolean>`: HMAC over `` `${orderId}|${paymentId}` ``, constant-time comparison.
  - `async function validWebhookSignature(rawBody: string, header: string, webhookSecret: string): Promise<boolean>`
  - `type RazorpayEvent = { event: string; payment?: { id: string; order_id: string; amount: number; currency: string; status: string }; refund?: { payment_id: string } }` and `function parseRazorpayEvent(v: unknown): RazorpayEvent | null`

- [ ] **Step 1: Write the failing tests.**
  - The signature checks against vectors computed in the test with an independent HMAC: Node-generated hex literals pasted in, for secret `"test_secret"`, order `"order_TEST1"` and payment `"pay_TEST1"`.
  - Rejecting a one-character change.
  - `createRazorpayOrder` sends the Basic auth header and body. Never log the secret: assert the thrown error message doesn't contain it.
  - Parsing a sample `payment.captured` body and a `refund.processed` body. The fixtures are copied from Razorpay's webhook docs into `supabase/tests/fixtures/`, with ids replaced.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): Razorpay orders and signature checks`.

### Task 4: PDF and email clients

**Files:**

- Create: `supabase/functions/_shared/report/resend.ts`, `supabase/functions/_shared/report/pdf.ts`, `supabase/tests/delivery_clients_test.ts`

**Interfaces:**

- Produces:
  - `async function sendEmail(cfg: { apiKey: string; from: string }, msg: { to: string; subject: string; html: string; text: string; attachment?: { filename: string; content: Uint8Array } }, fetcher: typeof fetch): Promise<{ ok: true; id: string } | { ok: false; retry: boolean }>`. It POSTs `https://api.resend.com/emails`, with the attachment base64-encoded. 429 and 5xx mean `retry: true`; other 4xx mean `retry: false`.
  - `async function renderPdf(cfg: { accountId: string; token: string }, url: string, fetcher: typeof fetch): Promise<{ ok: true; pdf: Uint8Array } | { ok: false; reason: "limited" | "failed" }>`. It POSTs `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/pdf` with `{ url, gotoOptions: { waitUntil: "networkidle0", timeout: 30000 }, pdfOptions: { format: "a4", printBackground: true, preferCSSPageSize: true } }`. 429 means `limited`. Confirm the body shape against Cloudflare's current Browser Rendering docs when implementing, and record the doc URL in a code comment.

- [ ] **Step 1: Write the failing tests** with a fake `fetch`:
  - the request shape;
  - base64 of the attachment;
  - 429 handling for both clients;
  - a 200 with a non-PDF content type is `failed`;
  - the report URL (with its `#token`) is never in a thrown error's message.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): PDF rendering and email clients`.

### Task 5: Quote, order and founding verify functions

**Files:**

- Create:
  - `supabase/functions/_shared/report/handlers.ts` (one exported handler per function, all `(req: Request, deps: Deps) => Promise<Response>`);
  - `supabase/functions/_shared/report/data.ts`;
  - `supabase/functions/report-quote/index.ts`, `report-order/index.ts`, `report-verify/index.ts`;
  - `supabase/tests/report_order_test.ts`.
- Modify:
  - `supabase/functions/_shared/handler.ts`: export the existing Turnstile `verify` as `verifyTurnstile(token, action, origin, secret, fetcher)` and use it from both places;
  - `supabase/config.toml`: new `[functions.*]` blocks with `verify_jwt = false`;
  - `supabase/functions/deno.json`.

**Interfaces:**

- Consumes:
  - plan 1's `issuePayload`, `freeResult`, `parseProfile`, `parseEngineData` from `../report-engine.js`;
  - Task 1's contract;
  - Task 2's RPCs;
  - Task 3's `createRazorpayOrder`.
- Produces:
  - `type Deps = { env: (n: string) => string | undefined; fetch: typeof fetch; now: () => number; randomBytes: (n: number) => Uint8Array }`
  - `async function loadEngineData(siteUrl: string, code: string, fetcher: typeof fetch): Promise<EngineData | null>`. It fetches `/data/manifest.json`, `/data/occupation-index.json`, `/data/state-rules.json`, `/data/occupations/{code}.json` and `/data/occupations/{code}.detail.json` (a 404 detail means `null`), with a 10 s timeout each, and validates with `parseEngineData`.
  - `async function newToken(randomBytes): Promise<{ token: string; hash: string }>`
- Behaviour of `report-order`:
  1. Validate, then Turnstile (action `"report"`).
  2. `parseProfile`, then `loadEngineData`. No data, or a `freeResult` that is `points-only`, means `no-data`.
  3. Then `report_quote`:
     - **Founding open:** `founding_start` → `codeEmail` → `sendEmail` → `code-sent`. If the email fails, return `busy` and leave the claim unsent so the next attempt resends.
     - **Otherwise:** a currency of `USD` with USD off means `usd-off`. Else `createRazorpayOrder` with the amount from `paid_order_amount`, receipt = a fresh UUID, and notes `{ occupation }` only. Then `paid_order_create`, returning `razorpay` with `keyId`.
- `report-verify`: hash the code, build the payload with `issuePayload` (meta `{ reportNo: "pending", version: 1, … }`; the RPC writes the real `report_no` into the stored payload's meta), then `founding_confirm`. On `issued`, return the token.

- [ ] **Step 1: Write the failing Deno tests** with a fake fetch that routes by URL (PostgREST RPC, Turnstile, Resend, Razorpay, site data):
  - `"founding: sends a code, never a report"`;
  - `"founding full: creates a Razorpay order at the settings price"`, asserting the request body amount is 69900 for INR;
  - `"an amount in the request is ignored"`;
  - `"USD off is refused"`;
  - `"no-data occupation is refused"`;
  - `"verify issues once and returns a token whose hash was stored"`;
  - `"wrong code returns tries left"`;
  - `"Turnstile failure returns verification"`;
  - `"site data unavailable returns busy, not invalid"`.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): quote, order and founding verification`.

### Task 6: Payment confirmation and webhook

**Files:**

- Create: `supabase/functions/report-confirm/index.ts`, `supabase/functions/razorpay-webhook/index.ts`, `supabase/tests/report_payment_test.ts`
- Modify: `supabase/functions/_shared/report/handlers.ts`, `supabase/config.toml`, `supabase/functions/deno.json`
- Note: every issue path (Tasks 5 and 6) stores `engine_data` (the core and detail used) and `token_enc` (encrypted with `REPORT_TOKEN_KEY`, a 32-byte base64 secret; add it to the secrets list in Task 8's docs).

**Interfaces:**

- Consumes: Task 3's verification; Task 2's `paid_issue` and `report_revoke_by_payment`; Task 5's `loadEngineData` and `newToken`.
- Behaviour:
  - **`report-confirm`:**
    1. Verify the payment signature.
    2. Read the pending order with `paid_order_get`.
    3. Build the payload and call `paid_issue` with the order's own amount and currency (the signature proves payment for that order), plus a new token hash.
    4. `issued` returns the token. `existing` (the webhook got there first) returns `{ kind: "error", code: "pending" }`. `paid_issue` keeps the first token hash, the buyer gets the link by email, and the browser shows "Your report is issued: check your email" with the report number.
  - **`razorpay-webhook`:**
    1. Verify the raw-body signature; anything unsigned gets 401.
    2. On `payment.captured` or `order.paid`, compare the event's amount and currency with the order, issue through `paid_issue` (idempotent), and mark the email `pending`.
    3. On `refund.processed`, revoke.
    4. Always answer within 5 s: issuing runs inline, because the engine takes milliseconds and data is fetched with a 10 s timeout. If it fails, answer 500 so Razorpay retries.

- [ ] **Step 1: Write the failing tests:**
  - `"confirm issues and returns the token"`;
  - `"webhook after confirm changes nothing"`;
  - `"confirm after webhook returns pending, and the email is queued once"`;
  - `"bad signature: 400, nothing stored"`;
  - `"webhook amount mismatch: no report, order failed"`;
  - `"refund revokes the report"`;
  - `"unknown events: 200, ignored"`;
  - `"unsigned webhook: 401"`.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): payment confirmation and Razorpay webhook`.

### Task 7: Reading and correcting a report

**Files:**

- Create: `supabase/functions/report-get/index.ts`, `supabase/functions/report-revise/index.ts`, `supabase/tests/report_read_test.ts`
- Modify: `handlers.ts`, `config.toml`, `deno.json`

**Interfaces:**

- **`report-get`:** POST `{ token }` (a POST body, so the token never sits in a URL), giving `ReportGetResponse`. It is rate-limited to 30 requests a minute per IP (`x-forwarded-for`) with `report_rate`.
- **`report-revise`:**
  1. Validate, `parseProfile`, and refuse with `occupation-changed` if the occupation code differs from version 1's. A different occupation is a different report, so it can't be used to serve several people.
  2. Rebuild from the report's stored `engine_data`, with the live `rules`, manifest and index, so the data month never changes.
  3. Use `meta.version + 1` and call `report_revise`. On success, queue a `revisedEmail` with the new PDF (`pdf_status` back to `pending`).

- [ ] **Step 1: Write the failing tests:**
  - `"get returns the payload"`;
  - `"get: revoked and expired states"`;
  - `"get: unknown token is not-found, same timing path"`;
  - `"revise within 7 days bumps the version and keeps the report number"`;
  - `"revise after 7 days: closed"`;
  - `"fourth revise: limit"`;
  - `"revise with a different occupation: occupation-changed"`;
  - `"revise uses the stored engine data even after the live month moves"`.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run backend:test:sql && npm run backend:check && npm run backend:test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): read and correct issued reports`.

### Task 8: Delivery job, schedule, retention and setup docs

**Files:**

- Create:
  - `supabase/functions/report-deliver/index.ts`;
  - `supabase/cron/20261125000300_report_delivery.sql`: pg_cron every 5 minutes, calling the function with pg_net and an `x-deliver-secret` header from Vault, plus daily `purge_expired_reports()` at 03:10 UTC. It is applied by hand, like the existing cron file.
  - `supabase/tests/report_deliver_test.ts`.
- Modify: `handlers.ts`, `config.toml`, `deno.json`, `docs/OPERATIONS-BACKEND.md` (a new "Paid reports" section), `docs/OPERATIONS.md` (a pointer).

**Interfaces:**

- **`report-deliver`:** POST, accepted only with `x-deliver-secret` equal to `REPORT_DELIVER_SECRET`. It takes up to 10 items from `report_delivery_queue`. For each:
  1. If the PDF is pending, decrypt `token_enc` and call `renderPdf(REPORT_SITE_URL + "/report/#" + token)`. Clear `token_enc` once both emails are done.
  2. If the PDF is ready, or 3 minutes have passed since issue, or it is `limited`, send `reportEmail`, with `pdfAttached` only if the PDF is ready.
  3. If the PDF later succeeds after the link email went out, send `pdfFollowEmail` with it.
  4. Mark each step with `report_delivery_mark`. A `limited` result retries at the next 00:05 UTC. Other failures back off at 5, 15 and 60 minutes, then daily. After 5 failed email attempts, send one alert email to `hello@migratelens.com` (no profile data, only the report number).
  5. Founding codes are never queued; they are sent inline in Task 5.
- **Docs**, in "Founder setup" order:
  - the secrets list;
  - the Razorpay webhook URL and events;
  - Resend domain verification;
  - the Cloudflare token (Browser Rendering permission only);
  - the cron install;
  - the `report_settings` edits (limit, prices, `usd_enabled`), with the Supabase Table Editor path;
  - the test-mode rehearsal script (the spec's 5 cases);
  - switching to live keys.

- [ ] **Step 1: Write the failing tests:**
  - `"rejects without the deliver secret"`;
  - `"PDF ready: one email with the attachment"`;
  - `"PDF limited: link email now, PDF email later, never two link emails"`;
  - `"email retry backs off and alerts after 5 failures"`;
  - `"token is cleared after full delivery"`.
- [ ] **Step 2: Run** `npm run backend:test`. Expected: FAIL.
- [ ] **Step 3: Implement** the function, the cron file and the docs.
- [ ] **Step 4: Run** `npm run backend:test:sql && npm run backend:check && npm run backend:test && npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(backend): report delivery with retries, schedule and setup guide`.
