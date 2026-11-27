# Paid report, plan 3 of 3: checkout, report page and legal pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** What the reader sees: the free result as a passport spread, the boarding-pass button, the three-beat checkout with the ink-ticket button, the founding code step, Razorpay Checkout, the `/report/` page (issued moment, corrections, revoked and expired states), and the legal and contact pages Razorpay requires.

**Architecture:** `/check/` keeps its four steps. After step 4 it shows `FreeResultSpread`, built from plan 1's `buildFreeResult` (no email asked). The button opens `CheckoutStep`, which is driven by a pure `checkoutReducer` and talks to plan 2's functions through one small transport module. On success the browser goes to `/report/#<token>`. That static page fetches the payload and renders plan 1's `ReportView`. The full builder never reaches any page (the plan 1 bundle lock is extended to `/check/` and `/report/`).

**Tech Stack:** Next.js 16 static export (webpack), React 19, Mantine, CSS modules with tokens, motion (respecting reduced motion), Razorpay Checkout (`https://checkout.razorpay.com/v1/checkout.js`, loaded only on the pay press), Turnstile.

**Spec:** `docs/superpowers/specs/2026-11-25-paid-report-design.md`, plus the approved mockup `.superpowers/brainstorm/30029-1795612153/content/paid-report-3.html`, whose CSS is the visual reference. Port it to CSS modules with tokens and don't copy literals. It depends on plan 1 (`ReportView`, `ReportPayload`, `buildFreeResult`, `FreeResult`, `LOCKED_PAGES`) and plan 2 (`src/lib/orders/contract.ts`, the function names).

## Global Constraints

- **Prices are shown only from the quote.** No price literal exists in frontend code, except the mockup-derived copy tests, which use the quote fixture.
- Currency default: `INR` when `Intl.DateTimeFormat().resolvedOptions().timeZone` is `Asia/Kolkata` or `Asia/Calcutta`, otherwise `USD`. Use `INR` whenever the quote's USD is null; the switch is hidden then.
- **Copy, verbatim from the approved mockup:**
  - Button: "Get my full PR report →", "Your queue, your wait, your best state". The stub reads "FOUNDING 100" or "PR REPORT"; the tag reads "FREE".
  - Founding meta: "{remaining} of {limit} left". Paid meta: "{price} one-off · 7-day no-questions refund".
  - Claim button: "Claim my free report →" with "{remaining} of {limit} founding places left · issued in seconds". Pay button: "Pay {price} securely →" with "UPI, cards, netbanking · issued in seconds". Ticket stubs "FOUNDING" and "ADMIT ONE".
  - Beats "01 · WHAT YOU GET", "02 · WHAT GOES INTO IT", "03 · WHY IT'S WORTH IT".
  - Trust lines: "Secure payment by Razorpay" (paid only), "7-day no-questions refund", "Ready on screen in seconds, PDF by email", "Questions? hello@migratelens.com".
- **The teaser counts real sections.** It reads "{n} more sections, written for your {points} points", where `n` is the number of report sections this reader's payload will have. Compute it from `FreeResult`: the sections `ReportView` renders for a `kind: "report"` view. Never a page count.
- Seller line on legal pages and the receipt: "MigrateLens, Ahmedabad, India · hello@migratelens.com".
- "Information from published data, not migration advice." appears on the checkout, `/report/` and every legal page.
- **Motion:** the foil sheen, the issued-stamp landing and the step transitions all sit under `@media (prefers-reduced-motion: no-preference)` or `useReducedMotion`. Nothing moves otherwise.
- **Theme:** both themes through tokens only (`src/app/colour-literals.test.ts`). A new colour gets light and dark values in `palette.ts` and `palette-dark.ts`, and a text pair in `text-pairs.ts` if it's text. Gold is `--saffron`, used for lines and marks only, never text.
- **Layout:** 320 px and up, with no horizontal scroll and 12 px minimum text (`src/app/font-floor.test.ts`). Keyboard-operable; visible focus.
- `/report/` is `noindex`, isn't in the sitemap, and is disallowed in `robots.ts`. The token is read only from `location.hash` and sent only in POST bodies. It is never written to `localStorage`, analytics or the URL query.
- `npm run check`, `npm run build` (including the postbuild bundle lock) and `npm run lighthouse` (`/check/` at 100; the legal pages at 100) pass. Verify in a browser against `out/`. Commits carry `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **The reader refreshes or goes back during Razorpay Checkout,** or the tab sleeps: the checkout must recover to "Pay" without a second order. The reducer test covers `dismissed` then a retry reusing `orderId`, in Task 4.
- **The founding count reaches 0 between the quote and the press:** `founding-full` shows the paid receipt with a short note, without losing the email or consent. Reducer test in Task 4.
- **A time zone that isn't available** (`resolvedOptions().timeZone` undefined in old browsers or privacy modes): default `USD`, or `INR` when USD is off. Unit test in Task 4.
- **The report link opened on a second device after the 7-day window:** the report renders, and Edit and Sharpen are replaced by the "final" line. Test in Task 5.
- **The PDF renderer loading `/report/#token`:** the print layout must come out complete without any click, with no issued animation blocking and no cookie banner. Task 5 checks it with headless Chrome print-to-PDF against `out/`.

---

### Task 1: Legal and contact pages

**Files:**

- Create: `src/app/terms/page.tsx`, `src/app/refunds/page.tsx`, `src/app/delivery/page.tsx`, `src/app/contact/page.tsx`, `src/app/privacy/page.tsx`, `src/lib/legal/copy.ts` (every legal paragraph as data, with `LEGAL_UPDATED = "2026-11-25"`), `src/lib/legal/copy.test.ts`
- Modify:
  - `src/components/site-footer.tsx`: "Terms", "Refunds", "Delivery", "Contact" and "Privacy" (now `/privacy/`);
  - `src/app/methodology/page.tsx`: the `#privacy` section keeps its anchor, gains a link to `/privacy/` and drops the paragraphs now on that page;
  - `src/app/sitemap.ts`;
  - `scripts/lighthouse/pages.ts` (the five pages, gated ALL).

**Interfaces:**

- Consumes: `SELLER` from `src/lib/orders/seller.ts` (plan 2 Task 1). The legal copy and the receipt import it; nothing re-declares the values.
- Page shells use `src/components/info-page/` (`PageHead`, `info-page.module.css`), as `/methodology/` does.
- **Content, per the spec:**
  - **Terms:**
    - what the report is;
    - information, not migration advice;
    - prices from the checkout;
    - Founding 100 (free, one per email, while places last);
    - the 7-day correction window, with up to 3 revisions;
    - access by private link for 12 months;
    - Indian law, Ahmedabad courts.
  - **Refunds:** 7 days from issue, no questions; write to hello@migratelens.com with the report number; refunded to the original method through Razorpay; the link stops working.
  - **Delivery:** digital only; on screen at once; email with PDF within minutes, the PDF at worst the next day; no physical shipping.
  - **Contact:** the email, the city and country, and a reply within 2 working days.
  - **Privacy:** the current privacy text, plus:
    - payments: what the server stores (email, answers, report) and what Razorpay processes;
    - the processors: Supabase, Razorpay, Cloudflare (hosting, analytics, PDF rendering), Resend;
    - 12-month storage, and deletion on request.

  Every page says "Last updated 25 Nov 2026" and "Drafted for review: check with your lawyer before relying on this." **The founder removes that last line after the review.** It is a `LEGAL_REVIEWED = false` switch in `copy.ts` that hides the line when true.

- [ ] **Step 1: Write the failing tests** in `copy.test.ts`:
  - every page section is non-empty;
  - the seller name, city and email appear on Terms, Refunds, Delivery, Contact and Privacy;
  - Refunds says "7 days" and "no questions";
  - the `BANNED_COPY` sweep;
  - with `LEGAL_REVIEWED` false, the review line renders.
- [ ] **Step 2: Run** `npx vitest run src/lib/legal`. Expected: FAIL.
- [ ] **Step 3: Implement** the copy, pages, footer, sitemap, methodology change and Lighthouse entries.
- [ ] **Step 4: Run** `npm run check && npm run build && npm run lighthouse`. Expected: PASS; the five pages at 100.
- [ ] **Step 5: Commit** `feat(legal): terms, refunds, delivery, contact and privacy pages`.

### Task 2: Ticket buttons

**Files:**

- Create: `src/components/checkout/ticket.tsx`, `src/components/checkout/ticket.module.css`, `src/components/checkout/free-tag.tsx`
- Test: `src/components/checkout/ticket.test.tsx` (if the repo has no component test setup, test the pure `ticketLabel` helper in `src/lib/checkout/ticket-label.ts` and do the visual check in Task 3's browser step)

**Interfaces:**

- Produces:
  - `function Ticket(props: { variant: "pass" | "ink"; stub: string; title: string; sub: ReactNode; meta?: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; busy?: boolean; wide?: boolean }): JSX.Element`. It renders a `<button>` whose accessible name is `title` plus the visible meta text. The stub is `aria-hidden`.
  - `function FreeTag(): JSX.Element` ("FREE", stencil face, `--label-strong-*` tokens).
  - `function ticketLabel(title: string, meta: string): string`
- Visual values come from `paid-report-3.html` (`.pass`, `.tk`, `.tk.ink`, `.free`), mapped to tokens:
  - paper: `--check-paper`, `--paper-2`;
  - ink: `--brand-deep` with `color-scheme: light`;
  - stub: the brand green;
  - hairline: `--saffron` through `color-mix`.

  The sheen is a `::after` gradient animation of 3.6 s with a 1–1.6 s delay, only under `prefers-reduced-motion: no-preference`. `busy` shows a spinner and sets `aria-busy`.

- [ ] **Step 1: Write the failing test.** `ticketLabel("Claim my free report →", "63 of 100 founding places left")` equals `"Claim my free report, 63 of 100 founding places left"`, with the arrow dropped.
- [ ] **Step 2: Run** `npx vitest run src/lib/checkout`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`. Expected: PASS, including `colour-literals` and `font-floor`.
- [ ] **Step 5: Commit** `feat(checkout): boarding-pass and ink ticket buttons`.

### Task 3: The free result in `/check/`

**Files:**

- Create: `src/components/checkout/free-result-spread.tsx` (+ `.module.css`), `src/lib/checkout/teaser.ts`, `src/lib/checkout/teaser.test.ts`
- Modify:
  - `src/components/check-flow.tsx`:
    - step 4 no longer asks for an email;
    - "View report" shows `FreeResultSpread`;
    - remove `useSubmission("calculation")`, `CalculationEmail`, the Turnstile on this step, `readToken` and the `Report` render;
    - the sample run ends with a "See the full sample report" link to `/sample/`;
  - `src/components/check-review-step.tsx`;
  - `src/app/check/page.tsx`: the head copy replaces "free personal report" with "Start with your points. See where they put you for the 189, 190 and 491, free; your full personal report is one step further." and the check line "Email to view report" becomes "Free result, no email";
  - `src/components/report.tsx`: delete the `Report` wrapper added in plan 1. `/check/` no longer renders reports.

**Interfaces:**

- Consumes: `buildFreeResult` (plan 1); `Ticket`, `FreeTag` (Task 2); the visa stamp component used by `VisaRow` (render each `FreeStamp` with it, without captions).
- Produces:
  - `function teaserLines(result: Extract<FreeResult, { kind: "stamps" }>): { heading: string; ticks: [string, string, string] }`. The heading is "{n} more sections, written for your {points} points"; the ticks are "EOIs ahead of you, and your estimated wait", "All 8 states checked against you" and "Your fastest ways to more points".
  - `FreeResultSpread` props: `{ result: FreeResult; quote: Quote | null; onOpenCheckout: () => void; occupationName: string; whereLine: string }`.
  - With `kind: "points-only"`, the spread's right page reads "A full report isn't available for this occupation yet." and shows no ticket.
  - The blurred right-page shapes are static decorative markup (`aria-hidden`), carrying no data.

- [ ] **Step 1: Write the failing tests:**
  - `teaserLines` counts the sections for a full fixture view;
  - the copy sweep;
  - `"no-data occupation gets no checkout"`, through a pure `canBuy(result: FreeResult): boolean`.
- [ ] **Step 2: Run** `npx vitest run src/lib/checkout`. Expected: FAIL.
- [ ] **Step 3: Implement.** The layout ports `.spread` and `.veil` from `paid-report-3.html`: two pages from 860 px up, stacked below that.
- [ ] **Step 4: Run** `npm run check && npm run build`. Then, in headless Chrome against `out/`, at 320, 390 and 1280, light and dark, with reduced motion on and off: fill the check with the Software Engineer example and screenshot the spread. Keyboard: Tab reaches the ticket and Enter opens checkout (stubbed until Task 4).
- [ ] **Step 5: Commit** `feat(check): free result as a passport spread, no email gate`.

### Task 4: Checkout step, founding code and Razorpay

**Files:**

- Create:
  - `src/lib/checkout/reducer.ts`, with `reducer.test.ts`;
  - `src/lib/checkout/currency.ts`, with `currency.test.ts`;
  - `src/components/checkout/transport.ts` (POSTs to `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/<name>`);
  - `src/components/checkout/checkout-step.tsx`, `receipt.tsx`, `build-up.tsx` and `code-entry.tsx` (+ CSS modules);
  - `src/components/checkout/razorpay.ts`.
- Modify: `src/components/check-flow.tsx` (the checkout step after the free result).

**Interfaces:**

- Consumes: the contract types (plan 2 Task 1); `Ticket` (Task 2); the existing `Turnstile` component (action `"report"`).
- Produces:
  - `function defaultCurrency(timeZone: string | undefined, usdAvailable: boolean): Currency`
  - `function formatPrice(amount: number, currency: Currency): string`: `"₹699"` or `"$14"`, with no decimals when the amount is whole.
  - `type CheckoutState`, a discriminated union: `"ready" | "submitting" | "code" | "verifying" | "paying" | "confirming" | "issued" | "issued-by-email" | "error"`, carrying `{ quote, currency, email, consent, claimId?, emailHint?, order?, error? }`.
  - `type CheckoutEvent = { type: "quote"; quote: Quote } | { type: "currency"; currency: Currency } | { type: "submit" } | { type: "order"; response: OrderResponse } | { type: "verify"; response: VerifyResponse } | { type: "razorpay-success"; paymentId: string; signature: string } | { type: "razorpay-dismissed" } | { type: "confirm"; response: ConfirmResponse } | { type: "failed"; message: string }`
  - `function checkoutReducer(s: CheckoutState, e: CheckoutEvent): CheckoutState`
  - `function loadRazorpay(): Promise<RazorpayCtor>`: it injects the script once and rejects after 15 s.
  - `function openRazorpay(ctor, opts: { keyId; orderId; amount; currency; email; onSuccess(paymentId, signature); onDismiss() }): void`. It sets `prefill.email`, `name: "MigrateLens"`, `description: "Personal PR report"` and `theme.color` from the brand green token read at runtime.
  - Transport: `getQuote()`, `postOrder(req)`, `postVerify(req)`, `postConfirm(req)`.
- **Flow:**
  - The quote is fetched when the checkout mounts, and the receipt shows skeleton rows until it arrives.
  - On `issued`, go to `/report/#${token}` with `location.assign`.
  - On `issued-by-email`, show "Your report is issued: check your email" with the email hint.
  - Error copy:
    - `founding-full`: "The last founding place has just gone. Your report is {price}."
    - `founding-used`: "This email already has a founding report. Check your inbox, or buy another for {price}."
    - `no-data`: return to the free result.
    - `busy`: "Something went wrong on our side. Try again in a minute; you haven't been charged."
    - Razorpay script failure: "Payment couldn't start. Check your connection and try again."
- **Layout:** ports `.two`, `.beat`, `.receipt`, `.tear`, `.meter` and `.tk.ink` from the mockup. The receipt is sticky from 860 px up and comes after the beats on phones. The code entry replaces the email row in place, with one 6-digit `inputmode="numeric"` `autocomplete="one-time-code"` field and "Resend code" after 60 s.

- [ ] **Step 1: Write the failing tests.**
  - `currency.test.ts`: Kolkata → INR; London → USD; `undefined` → USD; USD unavailable → INR; `formatPrice(69900,"INR")` is "₹699"; `formatPrice(1400,"USD")` is "$14".
  - `reducer.test.ts`:
    - `"founding: submit → code → verify → issued"`;
    - `"paid: submit → paying → success → confirming → issued"`;
    - `"dismissed returns to ready and keeps the order for a retry"`;
    - `"founding-full mid-claim switches to the paid quote, keeping email and consent"`;
    - `"confirm pending → issued-by-email"`;
    - `"submit without consent is refused locally"`;
    - `"wrong code keeps the code step with tries left"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/checkout`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check && npm run build`. In a browser on `out/` with `NEXT_PUBLIC_SUPABASE_URL` pointing at a local stub server (a scratchpad Node script answering the five endpoints with fixtures; not committed), walk through the founding path, the paid path (stub Razorpay by setting `window.Razorpay` to a fake before the press), dismissal and `founding-full`. Do this at 390 and 1280, in both themes, keyboard only.
- [ ] **Step 5: Commit** `feat(checkout): three-beat checkout, founding code and Razorpay`.

### Task 5: The `/report/` page

**Files:**

- Create:
  - `src/app/report/page.tsx` (static shell, `robots: { index: false }`);
  - `src/components/issued/issued-report.tsx`, `issued-moment.tsx` and `report-states.tsx` (+ CSS modules);
  - `src/lib/checkout/report-window.ts`, with `report-window.test.ts`;
  - `src/components/issued/use-issued-report.ts`.
- Modify:
  - `src/lib/robots-rules.ts` (disallow `/report/`);
  - `scripts/check-bundle-lock.ts` (`LOCKED_PAGES` adds `check/index.html` and `report/index.html`).

**Interfaces:**

- Consumes: `ReportView` and `ReportPayload` (plan 1); `ReportGetResponse`, `ReviseRequest` and `ReviseResponse` (plan 2); `useOccupationCore` for the public evidence data.
- Produces:
  - `function correctionState(meta: ReportMeta, now: string): { open: boolean; revisionsLeft: number; finalLine: string | null }`. `finalLine` is "This report is final (issued {d MMM yyyy})." once closed.
  - `function tokenFromHash(hash: string): string | null`: it accepts exactly 43 base64url characters after `#`.
  - `useIssuedReport(token)`, returning `{ status: "loading" | "report" | "revoked" | "expired" | "not-found" | "error"; payload?: ReportPayload; revise(profile: Profile): Promise<ReviseResponse> }`.
- **Page:**
  - **Issued moment.** It shows only when arriving from the checkout (`sessionStorage` flag `ml-issued-<report_no>`, set just before `location.assign`, removed after showing). It has the round "ISSUED" stamp, "Your PR report is ready, {name}." (or "Your PR report is ready." with no name), the report number, "Issued {date}", "Data as at {date}", "PDF sent to {hint}", and the actions Read, Download PDF (the existing `download-pdf-button`) and Copy private link (`navigator.clipboard` with the full URL, including the hash).
  - Then `ReportView` with `mode: "issued"`. `onEdit` opens the check form pre-filled from `payload.profile` in a dialog, and `onAnswer` merges into the profile. Both call `revise` and then refetch.
  - The revoked, expired and not-found states give a short line plus hello@migratelens.com.
  - **Print:** under `@media print`, the issued moment and toolbar are hidden, and the report's existing print tree prints. The page must reach its print-ready state without interaction. The report renders after a single fetch, so plan 2's `networkidle0` wait catches it. Also set `document.body.dataset.ready = "true"` once it has rendered, so the headless check in Step 4 can wait on it.

- [ ] **Step 1: Write the failing tests:**
  - `correctionState` inside the window with 2 left, at the boundary second, and after it;
  - `tokenFromHash` accepts 43 characters and rejects 42, 44, `?` and other characters;
  - `"the report page is disallowed in robots"` in `src/app/robots.test.ts`.
- [ ] **Step 2: Run** `npx vitest run src/lib/checkout src/app/robots.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check && npm run build`. The postbuild bundle lock must report 3 clean pages. With the stub server from Task 4:
  - open `/report/#<fixture token>` at 390 and 1280, in both themes, with reduced motion on and off;
  - print to PDF with headless Chrome and check every section is present;
  - check the revoked and expired fixtures;
  - check a closed-window fixture shows the final line and no Edit button.
- [ ] **Step 5: Commit** `feat(report): issued report page with corrections and print`.

### Task 6: Wrap-up: docs, Lighthouse, rehearsal list

**Files:**

- Modify:
  - `CLAUDE.md`: the architecture gets "Paid report" (the checkout, `/report/`, `src/lib/checkout/`, `src/components/checkout/`, `src/components/issued/`, the bundle lock, plan 2's functions), and the "free personal report" mentions are corrected;
  - `docs/OPERATIONS.md`, a frontend section: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` now power the checkout; the env needs no Razorpay value, because the key ID comes from the order response;
  - `docs/HANDOFF.md`: the founder's rehearsal checklist at the top (plan 2 Task 8's test-mode script, then the live switch, then "remove the review line" after the lawyer review);
  - `docs/REPORT-COVERAGE.md`: the report is paid and its sections are unchanged;
  - `scripts/lighthouse/pages.ts`: `/check/` stays gated ALL; `/report/` is not audited, because it's `noindex` and needs a token.

- [ ] **Step 1: Run** the full definition of done: `npm run check && npm run build && npm run lighthouse && npm run backend:check && npm run backend:test && npm run backend:test:sql`. Expected: all PASS; `/check/` and the legal pages at 100 in all four categories, mobile and desktop.
- [ ] **Step 2: Update the docs** listed above.
- [ ] **Step 3: Commit** `docs: paid report operations, handoff and architecture`.
