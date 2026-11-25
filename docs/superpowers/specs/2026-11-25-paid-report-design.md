# Paid report: Founding 100, Razorpay, server-issued reports

Date: 25 Nov 2026. Status: design, for founder approval. Mockups: `.superpowers/brainstorm/30029-1795612153/content/paid-report-{1,2,3}.html` (round 3 is the approved look; serve it with the brainstorm server or any static server, with `brand.css`, `lib.js` and the two fonts beside it).

## Why

The personalised report is free today, and readers don't see its value: the email box before it reads like a sign-up form, not like receiving something. The founder wants the report to be a product people buy. The first 100 get it free as founding members, but through the same checkout, so they feel they are getting something worth paying for. Everyone after that pays. Revenue now depends on this flow, so UX quality and payment correctness matter more than build speed.

## Founder decisions (25 Nov 2026)

1. **Paid report.** Prices ₹699 (INR) and US$14 (USD). The founder does the lawyer review personally.
2. **Founding 100.** The first N reports are free through the full checkout. N starts at 100 and is a **setting**, changeable without a deploy (raise, lower, or switch the offer off). The count is real, kept on the server.
3. **Razorpay** for both currencies. The founder's Razorpay account is an **Individual** account, ready for INR. The founder will request International Payments. For an Individual account Razorpay's documentation says international payments go through PayPal (linked in Razorpay), so USD may arrive as PayPal rather than cards. The build must work with whatever methods Razorpay enables.
4. **7-day no-questions refund.** Requests go to **hello@migratelens.com**, which is also the contact address everywhere (contact page, receipts, emails).
5. **The report moves to the server.** After payment or a founding claim, a backend builds and stores the report. The buyer reads it on screen at once, gets an email with the PDF attached and a private link to read it online.
6. **Before paying, the reader sees** their points and breakdown and their three visa stamps (189, 190, 491). Everything else is in the paid report.
7. **Look** (from the mockups):
   - The free result is the **passport spread** (round 2/3, Part 1 B). The left page holds the free result: points, the "80 with 190 · 90 with 491" line, the three stamps, and "Your stamps say _where_ you stand. The next pages say _why_". The right page shows "Your full report · pages 2–9" as blurred placeholder shapes under a frosted panel: "8 more pages, written for your N points", three ticked lines, and the button.
   - The **button** is the boarding-pass ticket with the foil sheen (round 2/3): a green perforated stub ("FOUNDING 100", or "PR REPORT" once paid), "Get my full PR report →", "Your queue, your wait, your best state", and either `FREE ~~₹699~~ 63 of 100 left` or `₹699 one-off · 7-day no-questions refund`. A gold hairline, and a slow sheen every few seconds that doesn't play with reduced motion.
   - The **checkout** is the three build-up sections plus a receipt (Part 2 A). 01 What you get (personalised lines). 02 What goes into it (24 months, 479 occupations, 13 rounds, 8 state programs). 03 Why it's worth it. The receipt stays sticky on the right on desktop and comes after the sections on phones. It holds: an INR/USD switch, the line item, a "Founding 100" discount line, a tear edge, the total, an "N of 100 left" meter, the email, the terms checkbox, and the **ink-ticket** claim/pay button. The stub reads "FOUNDING" or "ADMIT ONE". The button reads "Claim my free report →" with "N of 100 founding places left · issued in seconds", or "Pay ₹699 securely →" with "UPI, cards, netbanking · issued in seconds". Trust lines follow: "Secure payment by Razorpay" (paid only), the 7-day refund, "Ready on screen in seconds, PDF by email", and the contact email.
   - **Report issued** (Part 3): a round "ISSUED" stamp lands once (static with reduced motion), then "Your PR report is ready, {name}." with the report number, issue date, data month and "PDF sent to a•••@…", and Read / Download PDF / Copy private link.
8. **No monthly cost.** Use free tiers: Supabase (already in use), Cloudflare Browser Rendering on the Workers Free plan (10 minutes of browser time a day, up to 3 at once) and Resend (free tier). Razorpay's per-sale fee is the only cost. If PDFs pass the free daily limit, the US$5/month Workers Paid plan is the upgrade, at the founder's call.
9. **The paid report is today's full report** (every section `report.tsx` shows now, plus its print layout), moved behind payment. No page count is promised: the mockup's "8 more pages · pages 2–9" wording is replaced with a true one (for example "Your full report: N sections written for your 75 points", where N counts the sections this reader's report actually has).
10. **Corrections for 7 days.** Within 7 days of issue (the refund window), the buyer can fix their answers ("Edit answers") and answer the Sharpen questions. The server issues a new version under the same link and report number ("version 2", dated). Up to **3** revisions (builder's call on the number, kept small so one purchase can't serve several people). After 7 days the report is final, and the page says so.
11. **Who can buy:** any reader whose occupation has published data. For the occupations without data (14 today, plus dropped ones), the free result shows the points and "A full report isn't available for this occupation yet", with no checkout.
12. **Founding claims need a confirmed email.** The server sends a 6-digit code to the email; the reader types it in; then the report is issued. Paid orders skip the code (payment is the check).
13. **No email gate before the free result.** Points and stamps show straight away. The email is collected at checkout. The existing `submit-calculation` capture and its privacy text are retired from `/check/` (the table and its retention stay until existing rows age out).
14. **Seller details:** "MigrateLens", Ahmedabad, India, on the terms, contact, privacy and refund pages, plus hello@migratelens.com.
15. **The lock holds everywhere.** No public bundle contains the full view builder. `/sample/` and `/report/` render views that were already built (at build time for `/sample/`, on the server for `/report/`), using a renderer split from the builder. `/sample/` looks and behaves the same, including its tabs. This overrides the non-goal "changing `/sample/`" for its code only.

## Goals

- A reader moves from the free result to a paid (or founding) report in one sitting, with no account, and sees the report within seconds of paying.
- The full report can't be had without paying or claiming a founding place. The report view is built only on the server, and the browser never has what it needs to show the paid sections.
- Every paid order ends in exactly one issued report, even if the buyer closes the tab mid-payment.
- The founding count is exact under concurrency: never more than N free reports.
- The look matches the approved mockups in light and dark, at 320 px and up, and `/check/` keeps its Lighthouse 100s.

## Non-goals

- Accounts or logins. The private link is the access.
- Self-serve refunds. The founder refunds in the Razorpay Dashboard. The site reacts through the webhook.
- GST tax invoices. The email is a receipt. Whether invoices are needed is a question for the founder's CA.
- Turning on the AI "Our read". Reports keep the template read (`READ_ENABLED` stays off).
- Changing `/sample/`. It stays free and is the value demonstration. The checkout links to it.
- Alerts, report refreshes and subscriptions.
- Changes to the occupation, state or guide pages, beyond pointing their "Check my points" calls to action at the same `/check/`.

## Anti-goals (what would make this a failure even if it works)

- **Fake scarcity.** The count shown must be the real remaining count, the limit must be real, and the price shown crossed out must be the price buyer N+1 pays. No timers or invented urgency (India's 2023 dark-patterns guidelines ban "false urgency"; Australian Consumer Law bans misleading pricing).
- Charging someone without issuing their report, or issuing two reports for one payment.
- Personal data in URLs, logs, analytics, or GitHub. The link's secret sits after `#`, so it never reaches a server log.
- Implying migration advice. Every page and email says "information from published data, not migration advice".
- Any banned report copy (`BANNED_COPY`), percentage chances, or a "<20" turned into a number.

## Approaches considered

- **A. Supabase backend + Cloudflare Browser Rendering for PDFs + Resend for email (chosen).** It builds on the Supabase project and functions already in production, and the report engine is pure TypeScript, so it runs on the server unchanged. Free tiers cover launch volume.
- **B. Everything on Cloudflare Workers.** It sits beside the site, but splits data across two backends (submissions already live in Supabase) and duplicates the security and test setup. Rejected.
- **C. Like A without the PDF attachment** (the link only; the buyer prints from the page). Simplest and also free, but it drops the attached PDF the founder asked for. Kept only as the fallback when PDF rendering is unavailable (see Failure handling).

## How it works

### Reader flow

1. `/check/` steps 1–3 are unchanged (the live points preview stays).
2. Step 4 shows the **free result** (the passport spread), with no email asked. The browser computes the points and the three stamps locally. Only the code needed for the stamps ships to `/check/`. The full view builder (queue, waits, states, improve, route, evidence) must not be in any client bundle (decision 15). An occupation without published data gets the points and the "not available yet" line, with no button.
3. **The button opens the checkout** as a step of `/check/`, in the same page with no navigation, so the profile stays in memory. The browser fetches the quote (prices, the founding count, whether USD is available).
4. The reader picks a currency, enters their email, ticks the terms, and presses the ink ticket.
   - **Founding place available:** the server emails a 6-digit code. The receipt shows a code field ("We've sent a code to a•••@…"). On a correct code, the server claims a place atomically, issues the report and returns its link. Codes expire after 10 minutes, allow 5 tries, and can be resent once a minute (builder may tune these). The place is claimed only when the code is confirmed, not when it is sent.
   - **Otherwise:** the server creates a Razorpay order, and the browser opens Razorpay Checkout (`checkout.js` is loaded only at this moment). On success the browser sends the payment ID and signature for verification. The server checks them, marks the order paid, issues the report and returns its link.
5. The browser goes to `/report/#<token>` and plays the "issued" moment. The report renders with the existing report components from the stored view.
6. In the background, the PDF is rendered and the email sent (link, PDF, receipt, refund terms, contact).

### Pricing and currency

- Prices live in the settings row as integers in the smallest unit (`69900` paise, `1400` cents), never in client code. The quote returns them, and the order uses them.
- **Default currency:** INR when the browser's time zone is `Asia/Kolkata` (or `Asia/Calcutta`), USD otherwise, with the switch on the receipt. The founder accepts that someone abroad could choose INR.
- **USD is offered only when a setting `usd_enabled` is true**, which the founder sets once Razorpay activates international payments. Until then the switch is hidden and everyone sees INR.

### Founding 100

- Settings hold `founding_enabled` (bool) and `founding_limit` (int, 100). The founder edits them in the Supabase dashboard (table editor), and the docs say exactly where.
- A claim is a single SQL function that locks the settings row, counts issued founding orders, and inserts the claim only if the count is below the limit. It returns the remaining count. Two people can never take the last place.
- **One founding report per email address** (normalised, as `normalizeEmail`). A second claim with the same email returns their existing report link, or, if a different profile, is told founding is one per person and offered the paid checkout. _(Builder's call on the exact wording.)_
- When the count reaches the limit, or the offer is switched off, the same UI shows the paid state. The quote decides which state is shown, and the order endpoint re-checks it, so a stale page can't claim a place that's gone (it gets the paid checkout with a short note).

### Server side (Supabase)

New Edge Functions, following the existing `_shared/handler.ts` patterns (CORS allowlist, Turnstile where a human submits, JSON contract types shared with the frontend in a dependency-free module like `src/lib/submissions/contract.ts`):

| Function           | Does                                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `report-quote`     | GET. Returns prices, currency availability and the founding state (enabled, remaining, limit). Cacheable for a few seconds.                                                                               |
| `report-order`     | POST {profile, email, currency, consent, turnstile}. Validates the profile. Claims a founding place and issues, or creates a pending report and a Razorpay order.                                         |
| `report-confirm`   | POST {order id, payment id, signature}. Verifies the HMAC signature with the key secret, marks the order paid, issues the report (idempotent) and returns its link token.                                 |
| `report-verify`    | POST {claim id, code}. Checks the founding email code, then claims the place and issues the report.                                                                                                       |
| `report-revise`    | POST {token, corrected profile or Sharpen answers}. Within 7 days of issue and under the revision cap, rebuilds the view, stores it as a new version and re-sends the PDF by email.                       |
| `razorpay-webhook` | Verifies `X-Razorpay-Signature`. On `payment.captured` / `order.paid` it issues the report if the browser never confirmed (idempotent), and sends the email. On `refund.processed` it revokes the report. |
| `report-get`       | GET with the token (sent in a header or body, never a query string). Returns the stored view, or "revoked" / "expired" states.                                                                            |
| `report-deliver`   | Internal, run by the schedule: renders missing PDFs and sends unsent emails, with retries.                                                                                                                |

**Report engine on the server.** `src/lib/outlook` is pure TypeScript with relative imports, but it uses extensionless imports and imports JSON (`phrases.ts` imports `manifest.json` and `occupation-index.json`). Deno needs a bundle: an esbuild step (`esbuild` is already installed) bundles the view builder into one module that the functions import. **It must read the live month's data at runtime, not a copy frozen into the bundle.** The monthly job can't redeploy Supabase functions, so the occupation core and detail, the manifest, the index and the state rule data are fetched from the site's own static files (`/data/occupations/<code>.json` and so on). Any of these not yet published as a static file gets published at build time. How the engine takes them as inputs (parameters, or an injected loader) is the builder's call, but the client and server views must come from the same code.

**A report is frozen when issued**, apart from corrections (decision 10). It stores the view, the data month it was built from, and the profile it was built for. A revision builds from the same data month as version 1, so a correction never mixes months. After 7 days it never changes. `report-get` also returns the stored profile, to the token holder only, so "Edit answers" can open the form pre-filled on `/report/`.

### Data (new migration, backend-only like the existing tables: no browser RLS access)

- `report_settings`: a single row. `founding_enabled`, `founding_limit`, `price_inr`, `price_usd`, `usd_enabled`, `updated_at`.
- `reports`:
  - `id`; `token_hash` (SHA-256 of the link token; the token itself is only in the link and the email);
  - `report_no` (`ML-YYMM-NNNN`, a sequence);
  - `email`; `profile` (jsonb, validated); `view` (jsonb); `data_as_at`;
  - `status` (issued / revoked); `pdf_status`, `email_status` and attempt counts;
  - `version`, `revised_at` (corrections), `issued_at`, `expires_at` (issued + 12 months).
- `founding_claims`: email, code hash, attempts, expiry, the pending profile, and the issued report once confirmed.
- `report_orders`:
  - `id`; `report_id`; `kind` (founding / paid); `currency`; `amount`;
  - `razorpay_order_id` (unique), `razorpay_payment_id` (unique);
  - `status` (created / paid / refunded / failed); timestamps.
- **Retention:** keep the token hash and status after deletion, so the link can still say "expired". Reports and their profiles are deleted 12 months after issue, by the existing cron pattern (`supabase/cron/`). Orders keep only what accounting needs (amount, currency, IDs, dates, email) for the period the founder's CA advises. _(Ask the founder; until then keep orders, delete profiles and views at 12 months.)_ Deletion on request through hello@migratelens.com.

### PDF and email

- **PDF:** the Cloudflare Browser Rendering REST API (PDF endpoint) loads `https://migratelens.com/report/#<token>` with print media and returns the PDF, which uses the existing print layout (`print-report.tsx`, max 5 pages today; the paid report may be longer, and the limit for paid reports is the builder's call). It's called from `report-deliver` with a Cloudflare API token scoped to Browser Rendering only.
- **Email:** Resend, from an address at migratelens.com (DNS records in Cloudflare; the founder adds them). It contains the report link, the PDF, the receipt (report number, item, amount, currency, date, payment ID), the 7-day refund terms, and hello@migratelens.com. Plain, accessible HTML plus a text version.
- **Order of events:** the email goes out once the PDF is ready, or after a short wait (the builder picks it, under a few minutes) without the PDF, saying the PDF will follow. Then a second email carries it.

### Refunds and expiry

- The founder refunds in the Razorpay Dashboard within 7 days. The `refund.processed` webhook sets the report to revoked. Its link then shows "This report was refunded", with the contact address.
- After 12 months the link shows "This report has expired", with the contact address.

### New and changed pages

- `/check/`: the free result (passport spread), the button, and the checkout step (build-up + receipt + ticket, plus the founding code field). The existing email gate before the report is removed (decision 13). The page-head copy changes from "free personal report" to wording that fits the paid report. Lighthouse 100 must hold: Razorpay's script loads only on the pay press.
- `/report/`: static, `noindex`, not in the sitemap. It reads the token from the hash and renders the stored view with the existing report components, including the print tree for PDF rendering. It also shows the issued moment, and the revoked and expired states. Within the correction window it offers "Edit answers" (the check form, pre-filled) and the Sharpen questions. Both go through `report-revise`, then show the new version. After the window, both are replaced by "This report is final (issued {date})".
- `/sample/`: renders views built at build time through the split renderer (decision 15). It looks the same.
- **Legal and contact pages** (drafted for the founder's lawyer review; footer links on every page): `/terms/`, `/refunds/` (7 days, no questions, how to ask), `/delivery/` (Razorpay's "shipping" requirement: digital delivery on screen and by email, within minutes), `/contact/` (hello@migratelens.com), and `/privacy/` (a standalone page; `/methodology/#privacy` links to it). Privacy now covers payments: what is sent to the server and Razorpay, the 12-month storage, deletion on request, and the processors (Supabase, Razorpay, Cloudflare, Resend). These pages exist before Razorpay's international activation is requested, because Razorpay requires them.
- `docs/STRATEGY.md`: these founder decisions go in the decision log. The roadmap's monetisation section is updated (prices, Founding 100, Razorpay).

### Copy rules for the new surfaces

- "EOIs", not "people", for pool counts. "Estimate" on waits. No percentage chances.
- The free result's teaser lines name what the report covers. They never show real numbers, and the blurred shapes are decorative placeholders, not real data.
- "Information from published data, not migration advice" appears on the checkout, the report page, the email and the terms.

## Failure handling

| Case                                                       | What happens                                                                                                                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The tab closes after payment, before confirm               | The webhook issues the report and sends the email. The buyer is never charged without a report.                                                                                                      |
| `report-confirm` and the webhook both arrive               | Unique payment ID plus an idempotent issue: one report.                                                                                                                                              |
| The signature fails                                        | Nothing is issued. A friendly error, the contact email, and the order logged as failed.                                                                                                              |
| Razorpay Checkout dismissed or failed                      | The receipt stays. The reader can retry, with no duplicate charge (a new attempt reuses the pending order).                                                                                          |
| The founding limit is reached mid-checkout                 | The order endpoint switches to the paid state with a short note. Nothing is charged silently.                                                                                                        |
| The PDF's free daily limit (HTTP 429) or a render failure  | The email goes out with the link and "PDF to follow". `report-deliver` retries after the UTC day resets. After N failures, an alert to the founder (an email to hello@).                             |
| An email send failure                                      | Retried by `report-deliver` with backoff. The report stays readable through the on-screen link at all times.                                                                                         |
| The data month changes between the free result and payment | The report is built from the month current at issue, and the stamps shown on it may differ slightly from the free result. The report says which month it uses. _(Builder: make sure it can't fail.)_ |

## Security

- Secrets live only in Supabase function secrets, set by the founder, never in chat, the repo or the frontend: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_BR_TOKEN`. The public Razorpay key ID reaches the browser only through the order response.
- Link tokens: at least 128 bits of randomness, stored only as a hash. Constant-time comparison. Rate limits on `report-get`.
- Turnstile on `report-order`, as on the existing submissions.
- Profile validation on the server, reusing the frontend's guards. The server never trusts client-computed points or labels.
- **Amounts come only from settings.** The client never sends a price.
- Webhook endpoint: verify the signature on the raw body, and reject anything else.

## Founder setup (documented in `docs/OPERATIONS-BACKEND.md`)

1. Razorpay: the key ID and secret (test, then live), a webhook to `report-razorpay-webhook` with its secret, the events `payment.captured`, `order.paid` and `refund.processed`. Request International Payments once the policy pages are live. Link PayPal if Razorpay asks.
2. Resend: an account, the migratelens.com domain DNS records in Cloudflare, an API key.
3. Cloudflare: an API token with Browser Rendering permission only, and the account ID.
4. Supabase: set the secrets, deploy the functions, apply the migration, and check `report_settings` (the limit, prices, `usd_enabled` false).
5. Rehearsal in Razorpay **test mode** on the preview deployment: a founding claim, a paid INR order, a dismissed checkout, a closed tab after payment (webhook path), and a refund. Then switch to live keys.

## Testing (definition of done as `docs/ENGINEERING.md`)

- Unit tests:
  - quote and state logic;
  - the founding claim under concurrency (the SQL test, as `supabase/tests/postgres_test.py`);
  - signature verification with Razorpay's documented test vectors;
  - idempotent issue;
  - token hashing;
  - currency defaulting;
  - the copy sweep over the new pages and email templates.
- **Bundle test:** no route's client bundle (in particular `/check/`, `/sample/`, `/report/`) contains the full view builder (fail the build if, for example, `buildImprove` or `estimatedWait` appear in it).
- **Engine parity test:** the server bundle and the client code produce the same stamps for the fixture profiles.
- **Browser checks** on the built `out/`: light and dark, 320, 390 and 1280 px; reduced motion (no sheen, no stamp animation); keyboard-only checkout; screen-reader names on the ticket buttons.
- `npm run check`, `npm run build`, `npm run backend:check`, `backend:test`, `backend:test:sql`, and `npm run lighthouse` (`/check/` stays at 100).

## Left to the builder

- The exact wording beyond the approved mockup copy (it keeps to the copy rules).
- The internal shape of the engine bundle and how data is injected.
- Polling and backoff details for delivery, and the PDF-wait threshold.
- Report-number sequence mechanics.
- Which site the server reads data from for the preview deployment versus production (a setting).
- Razorpay auto-capture configuration (payments must be captured; auto-capture is expected).

## Resolved after the builder check (25 Nov 2026)

The founder answered decisions 10–14 (corrections, who can buy, the founding email code, no email gate, seller details), taking the recommended option each time. Calls made by the designer, for the founder to check:

- The report contents (decision 9) and the true teaser wording.
- The lock everywhere, with the `/sample/` renderer split (decision 15).
- The 3-revision cap, and code expiry and tries.
- The webhook name `razorpay-webhook`; keeping the token hash after deletion.
- Verification codes count against Resend's free daily email limit, so if founding claims spike they compete with report emails. Delivery prioritises codes. Watch this at launch.
