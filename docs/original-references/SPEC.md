# Landfall (working name): product and build spec

Version 1, 16 November 2026. Written for Claude Code.
Companion file: `landfall-sample.html` (design reference for the report).

---

## 1. Purpose and how to use this doc

- This is the single source of truth for the product. It summarises a long planning discussion between the founder and Claude that you (Claude Code) have not seen. Everything you need is here.
- `landfall-sample.html` is a single-file mockup of the full sample report. Use it as the reference for look, tone, layout and components. **All numbers in it are invented. "Landfall" and the logo are placeholders.**
- If this doc and the HTML disagree, this doc wins. If this doc is silent, choose the simplest option and record the assumption in `DECISIONS.md`.
- **[Verify]** marks facts or rules that must be checked against official sources before shipping.
- **[Founder]** marks decisions the founder must make. Ask, or use a sensible default and log it.
- The founder is a software engineer with 5 years of experience, working solo, who wants a first sale quickly. Build an MVP first, but keep the architecture clean.

---

## 2. Product summary and business model

**What:** a web product that sells a personalised, data-heavy report on a person's chances and timeline for Australian skilled permanent residency (subclasses 189, 190 and 491). It is built from official public data plus our own estimates.

**Why a one-off report:**
- It fits the buying moment: when someone lodges an EOI or misses a round.
- It avoids subscription churn, since people cancel as soon as they're invited.
- Competitors sell dashboards. We sell a report about one person: key dates, points audit, scenarios and state fit.

**Core loop:**
1. Free tools (points calculator, free preview).
2. A personalised preview showing 2–3 real results.
3. Purchase of the full report.
4. Instant web report plus PDF.
5. Free refreshes for 3 months.
6. Alerts that bring people back.
7. Referrals.

**Revenue:**
- **v1:** one-off report with location-based pricing (see §14), including 3 months of free refreshes.
- **Later:**
  - paid refresh extensions or an alerts subscription;
  - a premium tier reviewed by a registered migration agent (RMA) [Founder, needs legal advice];
  - white-label B2B widgets and reports for small Australian RMAs, which has higher prices, lower churn, and puts the advice with the RMA.

**Moat (be realistic):**
- The sample report sells the product, but it can be copied.
- The real moat is:
  1. a public, graded accuracy record;
  2. data updates within hours of each round;
  3. a report engine that links insights across sections automatically;
  4. trust and distribution in the community.

---

## 3. Market, audience and competitors

**Market facts (researched Nov 2026; recheck before quoting publicly) [Verify]:**
- As at Aug 2026 there were about 181k EOIs in the 189 queue, 490k for 190 and 528k for 491. These overlap, because one EOI can select several visas.
- India is the largest source of permanent migrants: 48,326 permanent grants in 2024-25, more than double China (20,405).
- Pakistan (9,557), Sri Lanka (9,444) and Nepal (8,319) are also in the top ten. South Asia is roughly 40% of the 185,000-place program.
- 189 grants fell 44% in 2024-25.
- The 2026-27 Budget committed to a points test overhaul. The new test is reported to start on 1 July 2027.
- Offshore places were cut to 55,110 and onshore applicants are being prioritised.

**Audience:**
- **Primary:** Indian applicants.
  - Onshore in Australia (students, 485 and 482 holders). They earn AUD and are most willing to pay.
  - Based in India.
- **Next:** Nepal, Sri Lanka and Pakistan, then the Philippines and everyone else. The product stays the same; only the marketing changes.
- **Occupations to prioritise:**
  - ICT: Software Engineer, Developer Programmer, ICT Business Analyst, Analyst Programmer.
  - Accountants.
  - Engineers: civil, mechanical, electrical.
  - Registered nurses.
  - Chefs and cooks.
  - Early childhood and secondary teachers.
  
  [Founder: confirm the v1 list using real EOI data.]

**Positioning:** a global product in English with a neutral brand (not branded as Indian), marketed to Indians first. Plain English and honest about uncertainty.

**Competitors (all use the same public SkillSelect data):**
- **ImmiTrend (immitrend.com.au):** the most complete dashboard.
  - Free tier; Pro at US$5.99/month; Pro+ at US$19.99/month, which includes an occupation report.
  - Agency tiers at US$49 and US$149.
  - AI assistant on credits.
  - English and Chinese.
- **VisaIQ:** 11 free tools.
- **PR Insight.**
- **One U Education:** free per-occupation EOI pages that funnel to advisers.
- **Magpie Consultants:** free queue checker.
- **MyImmiTracker:** community case trackers.
- **ISCAH:** invitation estimates.

Many of these are free because they generate leads for agencies. Don't compete on dashboards. Compete on the personal report, key dates, clarity and honesty.

---

## 4. Launch scope

**In v1:**
- **Visas 189, 190 and 491, all from day one.**
  - 189 is a ranked queue and can be modelled well.
  - 190 and 491 depend on each state's profile-based selection and sparse data, so their estimates carry lower confidence labels.
- **All 8 states and territories** in the 190/491 summaries.
- **Occupations:** full-quality reports for the 10–15 most common occupations in the target audience. For other occupations, either show a clear "limited analysis" notice or block them at checkout [Founder].
- **The current points test,** with an architecture that can add a second rule set (the new test, expected 1 July 2027) without rewrites.
- **English UI.**

**Not in v1:**
- AI chat assistant (legal risk, see §15).
- Modelling of employer-sponsored visas beyond showing official grant counts.
- Password accounts (use magic-link email instead).
- Hindi or other languages (phase 3).
- B2B widgets (phase 3).

---

## 5. Site map and pages

**Principles:** keep the site small and focused, with one clear promise per page. Easy navigation, mobile first, premium and trustworthy (see §12).

1. **Home (`/`)**
   - One clear promise, e.g. "See where you stand for 189, 190 and 491, and what changes it".
   - Points calculator entry and free check call to action.
   - Sample report preview.
   - How the data works: sources and data-as-at date.
   - Accuracy record teaser, founder story snippet and FAQ teaser.
   - No stock photos of landmarks.
2. **Free points calculator (`/points-calculator`):** see §6.
3. **Free check and preview (`/check`)**
   - Profile form (§8).
   - Personalised preview with 2–3 real results: their 189 queue position, the latest cut-off for their occupation, and how many states list their occupation.
   - Paywall showing the report's full table of contents, then checkout.
   - Captures email with consent even when there's no purchase.
4. **Sample report (`/sample`)**
   - The full report for a fictional person.
   - Runs on real, current data and is regenerated monthly.
   - Uses the same component as client reports, with a prominent "Sample report" badge.
5. **Pricing (`/pricing`)**
   - One product with location-based pricing.
   - What's included: 15-page report, web and PDF, 3 months of refreshes, alerts.
   - Refund policy and payment security notes.
6. **Latest rounds (`/rounds`)**
   - The latest 189 round and recent state rounds, updated within hours of each round.
   - Round history.
   - Serves search traffic and shows the data is fresh.
7. **Occupation pages (`/occupations/[slug-anzsco]`)**
   - One page per occupation, generated automatically and indexed by search engines.
   - Pool by points, cut-off history, ceiling, states listing it, and trends.
   - "Check my position" call to action and "Follow this occupation" alerts.
8. **Methodology and accuracy (`/methodology`, `/accuracy`)**
   - Sources, update cadence, how estimates work, and confidence levels.
   - Licence attribution.
   - A public scorecard of predictions saved before each round, compared with the actual results.
9. **About (`/about`):** the founder's own PR journey, real name and photo [Founder], and contact details.
10. **FAQ (`/faq`).**
11. **Legal:** `/terms`, `/privacy`, `/refunds`, `/disclaimer`.
12. **Checkout (`/checkout`) and success page.**
13. **Client report (`/r/[token]`):** see §7 and §11. Not indexed.
14. **My reports (`/account`)**
    - Magic-link sign-in.
    - Lists reports and their versions.
    - Alert preferences and data deletion.
15. **Report your invitation (`/report-invitation`):** community form, see §6.
16. **Admin (`/admin`, protected)**
    - Data imports and validation results.
    - Manual entry of state data.
    - Moderation of community reports.
    - Saving predictions before rounds.
    - Orders and report regeneration.

---

## 6. Free tools and engagement features

Goal: give real value for free, bring people back, and build the email and Telegram audience that sells reports.

1. **Free points calculator (v1)**
   - Inputs follow the current points test categories (table in §9).
   - Shows the score instantly, with a per-category breakdown using bars like the report's points audit, plus 189/190/491 totals.
   - Lists unclaimed categories that fit the person's profile, stated as facts, not advice.
   - If date of birth is entered, shows the date their age points change.
   - Shareable result card (OG image), e.g. "My skilled migration points: 90". No personal data in the URL.
   - Call to action: "See where 90 points puts you in the queue", which opens `/check` prefilled.
   - The rule set is versioned. When the new test is final, add a current/new toggle. That will be a major traffic moment, so prepare for it.
2. **Free preview (`/check`):** see §5.
3. **Round alerts**
   - Email plus a Telegram channel (and a WhatsApp channel [Founder]) posting cut-offs within an hour of each round.
   - Personal alerts for followers, e.g. "Your occupation was invited at 95 in today's round".
4. **Follow an occupation:** email when its cut-off, ceiling or pool changes.
5. **Key date reminders (opt-in, for buyers):** emails before:
   - an age-bracket change;
   - the English test's 3-year limit;
   - skills assessment expiry;
   - visa expiry.
6. **"What changed" on refresh:** each refresh shows the differences from the previous version (e.g. EOIs ahead 1,940 → 1,720).
7. **Report your invitation (community data)**
   - Short form: occupation, visa, state, points, invitation date, onshore/offshore, English level, plus optional traits used in state comparisons.
   - Moderated before use.
   - Incentive, e.g. buyers get an extra month of refreshes [Founder].
   - Feeds the 190/491 comparisons. Always label this data "community-reported".
8. **Section feedback:** "Was this useful?" yes/no on each report section, with an optional comment.
9. **Referrals:** the buyer gets a link; the friend gets a discount; the buyer gets extra refresh months [Founder].
10. **Public accuracy scorecard:** predictions saved before each round and graded after.
11. **Monthly newsletter:** a snapshot of pool changes.
12. **Later:**
    - EOI journey tracker (days since date of effect, rounds compared with their score);
    - Hindi content;
    - short videos for each round.

---

## 7. The personalised report

**Format:** a web page (primary) and a PDF from the same source. About 15 A4 pages in 5 parts plus an appendix. See `landfall-sample.html`.

**Writing rules for every section:**
- **Answer first:**
  1. one plain-English sentence and one big number;
  2. one supporting chart;
  3. details below, collapsible on mobile.
- **Use their name and numbers,** e.g. "At 90 points, 1,940 EOIs rank ahead of you."
- **Every estimate shows a range and a confidence label** (High / Medium / Low) with the reason.
- **Describe what the data shows; never tell them what to do.** No "you should apply to NSW". See §15.
- **Mark community-reported data** separately from official data.
- **Page test:** if another buyer's details were swapped in and the page didn't change, it's reference material. Move it to the appendix and keep it short.

**Cross-linking:** insights must flow between sections automatically. For example, an age-bracket change inside the estimated 189 window must appear in:
- the key dates warning;
- the scenarios;
- the 189 estimate.

These links are produced by rules (§9), not written by hand.

### Cover

- Name, title, report ID, version and generated date.
- Data-as-at date and the refresh-until date.
- "What we analysed" tiles: EOIs in the pool, rounds analysed, states checked, years of grant data.
- Table of contents with page numbers.

### Part 1: your answer

- **Summary (p2)**
  - A headline sentence comparing the pathways.
  - Three cards (189 / 190 / 491), each with an outlook pill (Good / Possible / Slow / Not eligible), a key number, one line of explanation and a confidence label.
- **Your key dates (p3):** a timeline computed from their profile, covering:
  - date of effect and report date;
  - the estimated 189 window;
  - policy dates (e.g. the new points test);
  - age-bracket changes;
  - visa expiry (onshore applicants);
  - the English test's 3-year limit [Verify];
  - skills assessment expiry (from their input);
  - experience milestones that add points.

  Colour-code each item by type (gain / loss / expiry / estimate or policy). Show a warning box when a points loss falls inside an estimated window.

### Part 2: your points

- **Points audit (p4)**
  - Every category with their situation, points, maximum, status (Claimed / Possible / Not applicable) and a bar.
  - Totals for 189, 190 and 491.
- **Points scenarios (p5)**
  - For each feasible change (each Possible category, combinations of them, and upcoming losses): the new score and the number of EOIs ahead in the 189 queue, as a bar chart.
  - A short factual description of what each change involves.
- **Old vs new points test (p5):** the current score, and the new-test score shown as "Pending" until the rules are final. Then compute it and show the difference by category.

### Part 3: your pathways

- **189 (p6)**
  - EOIs ahead, split into those with more points and those on the same points with an earlier date of effect.
  - A queue bar, and the number behind them.
  - Occupation ceiling: ceiling, invited so far (estimated), remaining (estimated).
  - A cut-off dot chart for the last 6 rounds: their score as a dashed line, hollow markers for rounds with no invitations.
  - Estimated wait in rounds, with a confidence label, and a note if a key date falls inside that window.
- **190 and 491 by state (p7–8)**
  - One row per state or territory:
    - listing status for 190 and 491;
    - residency or onshore rules;
    - the latest reported invitation, tagged Official or Community;
    - a fit pill (Good / Possible / Limited data / Not listed / Not eligible now).
  - A profile comparison card for the best-fit state: traits such as points, English, onshore status, salary, time working in that state and NAATI, compared with typical invitees. Show match icons and the sample size.
- **Other pathways (p9)**
  - Official grant counts for their occupation for 186, 482 and 494, with a factual one-liner each.
  - The note: "A registered migration agent can tell you whether any of these suits your situation."

### Part 4: your occupation

- **Pool (p10)**
  - 189/190/491 pool sizes, with a note that they overlap.
  - 12-month trend line for the 189 pool.
  - Monthly bars of new vs leaving EOIs (last 6 months).
  - Pool by points, with their band highlighted.
  - Which states competitors select.
- **Invitation history (p11):** last 6 rounds with date, cut-off and estimated invitations (labelled as estimates).
- **People like you (p11):** grants in their occupation by citizenship (their own highlighted) and by state.
- **Related occupations (p12)**
  - Nearby ANZSCO codes: pool size, last cut-off, and how many of the last 6 rounds invited them.
  - Must include this note: "The occupation in your EOI must match your skills assessment. Speak to a registered migration agent before acting on this." [Legal review]

### Part 5: planning ahead

- **What could change (p13):** upcoming policy and program events with their usual timing.
- **If you're invited (p13–14)**
  - The 60-day lodgement window [Verify].
  - A document checklist based on the official Home Affairs checklist.
  - A cost estimate for their family size, using official charges at the time the report is generated. Never hard-code these.
  - Current published processing times.
- **Our track record (p14):** predicted vs actual cut-offs for their occupation over the last 6 rounds, with predictions saved before each round.

### Appendix (p15)

- Glossary.
- Method and sources, with update cadence.
- Licence attribution and disclaimer.
- Version information and a "Check for updates" button.

---

## 8. Report inputs (profile form)

Collect only what the report needs. Use a multi-step, mobile-friendly form that saves progress, and explain why each field is needed.

- **About them:** first name (display only), email (for delivery), country of citizenship, date of birth (for age points and key dates).
- **Occupation:** ANZSCO search by name or code.
- **Skills assessment:** assessing authority, outcome date, and the expiry date printed on their letter.
- **English:** test type, test date, and scores or level (Competent / Proficient / Superior).
- **Education:**
  - highest qualification;
  - whether they meet the Australian study requirement;
  - whether they studied in regional Australia;
  - specialist education (an Australian research master's or doctorate in an eligible field).
- **Other points:** Professional Year completed; NAATI credentialled community language.
- **Employment:**
  - overseas and Australian skilled employment periods, with start and end dates;
  - confirmation of at least 20 hours a week.
- **Partner status:** single; partner is an Australian citizen or PR; partner with a skills assessment and competent English; partner with competent English only; partner with neither.
- **Location:** onshore or offshore; current state; current visa subclass and expiry if onshore.
- **EOI:** whether submitted, the date of effect, and points claimed. Cross-check against our calculation and flag any mismatch gently.
- **Optional, for 190/491 comparisons:** salary band, years working in each state, state preferences.
- **Consent:** terms, privacy, and optional reminders and marketing.

**Do not collect:** passport numbers, full legal names, documents, or ImmiAccount details.

---

## 9. Computation and modelling rules

### Points, current test [Verify every value against Home Affairs before launch]

| Category | Points |
|---|---|
| Age 18–24 / 25–32 / 33–39 / 40–44 | 25 / 30 / 25 / 15 (must be under 45 at invitation) |
| English: Competent / Proficient / Superior | 0 / 10 / 20 |
| Overseas skilled employment, last 10 years: 3–4 / 5–7 / 8–10 years | 5 / 10 / 15 |
| Australian skilled employment, last 10 years: 1–2 / 3–4 / 5–7 / 8–10 years | 5 / 10 / 15 / 20 |
| Combined employment cap | 20 |
| Qualification: doctorate / bachelor or higher / diploma or trade / other recognised | 20 / 15 / 10 / 10 |
| Specialist education | 10 |
| Australian study requirement | 5 |
| Professional Year | 5 |
| Credentialled community language | 5 |
| Study in regional Australia | 5 |
| Partner: single or partner is a citizen/PR | 10 |
| Partner: skilled (skills assessment and competent English) | 10 |
| Partner: competent English only | 5 |
| State nomination (190) / regional nomination (491) | +5 / +15 |
| Pass mark | 65 |

Store this as a versioned rule set (data, not code branches) with effective dates. Add a second rule set for the new test once it's published.

### Key dates engine

- Find every date on which a category's points change:
  - age-bracket birthdays;
  - experience thresholds being crossed;
  - the English test's 3-year limit;
  - skills assessment expiry;
  - visa expiry.
- Compute the score on each of those dates.
- Flag any points loss that falls inside an estimated invitation window.

### 189 queue position

- Use the latest monthly EOI snapshot for their occupation.
- Count EOIs with more points, plus those on the same points with an earlier date of effect.
- If the data only gives the date of effect by month, estimate within the month and label it as an approximation.

### Wait estimate

- Inputs: recent cut-offs, estimated invitations per round, remaining ceiling, and pool inflow.
- Output: a range in rounds and months, plus a confidence label.
- Start with a simple, explainable model, and backtest it against history before showing it to anyone.

### Cut-off predictions

- Save each prediction before the round, timestamped and never edited.
- Grade it after the round and store it for the track record.

### State fit for 190 and 491

- Rules-based, using:
  - listing status;
  - residency rules;
  - recently reported cut-offs;
  - a comparison of traits against community samples.
- Confidence depends on sample size, e.g. fewer than 20 reports means Low. [Founder: set thresholds]

### Confidence labels

- **High:** official data with a stable history.
- **Medium:** an estimate with a reasonable backtest.
- **Low:** community data or small samples.
- Always show the reason for the label.

### Scenarios

Recompute EOIs ahead using the new points total, assuming the rest of the pool stays unchanged, and state that assumption on the page.

### Rounding and traceability

- Show rounded numbers (e.g. "about 420") but keep exact values in the data.
- Every displayed number must reference a snapshot ID and computation version.

---

## 10. Data sources, pipeline and accuracy

### Sources

- **SkillSelect EOI data** (Home Affairs dashboard), monthly.
  - Licensed under CC BY 3.0 AU, which requires attribution.
  - [Verify the extraction method and respect the site's terms.]
  - Build a manual CSV import as a fallback.
- **SkillSelect invitation round results,** each round.
- **Occupation ceilings** (Home Affairs), yearly plus updates.
- **State and territory nomination pages:** occupation lists, criteria and invitation announcements.
  - Eight different formats; some states publish details of the last people invited, others publish little.
  - Enter these through an admin tool that records the source URL and date.
- **Visa grant statistics** (Home Affairs / data.gov.au), yearly.
- **Official charges and processing times** (Home Affairs), fetched when each report is generated.
- **Community-reported invitations** from our form, moderated.

### Pipeline

- Each import creates an unchangeable snapshot recording the source, fetch time and a hash.
- Validation checks before anything is published:
  - totals match the official published totals;
  - row counts are sensible;
  - the differences from the previous snapshot look reasonable.

  Any failure blocks publishing and alerts the admin.
- Publishing a snapshot triggers:
  - rebuilding the occupation pages;
  - sending alerts;
  - refreshing eligible reports as new versions;
  - regenerating the sample report.
- Speed target: round results live within hours.

### Accuracy record

- Predictions are saved before each round.
- They are graded on a public scorecard and shown per occupation in reports.

**Never invent data.** If data is missing, the report says so, e.g. "Too few reports to estimate".

---

## 11. Report delivery

### Unique links

- **URL format:** `/r/{token}`, where the token is at least 128-bit random (e.g. a nanoid of 22+ characters). Never use sequential IDs, names or emails in URLs.
- **Keep reports out of search:**
  - `noindex`/`nofollow` meta tags plus the `X-Robots-Tag` header;
  - excluded from the sitemap;
  - `Referrer-Policy: no-referrer`.
- **No third-party analytics or session replay** on report pages; only minimal first-party event logging.
- **Owner controls:** the owner can revoke or regenerate the link from their account, with optional magic-link login to view.

### Versions and refreshes

- Each refresh creates a new, unchangeable version holding:
  - the inputs;
  - snapshot IDs;
  - computed JSON;
  - the rendered PDF.
- Previous versions stay viewable with their dates, along with a "What changed" summary.
- Refreshes are free for 3 months from purchase:
  - automatically after each new snapshot or round;
  - or when the user edits their profile (e.g. a new English score) and regenerates.

### PDF

- Built from the same components as the web report, with a print stylesheet.
- Rendered by headless Chromium (Playwright) in a background worker, on A4.
- Charts must be SVG, not canvas.
- `break-inside: avoid` on cards, so nothing splits across pages.
- Header and footer show the report ID, data-as-at date and page numbers.
- Generated in the background after purchase or refresh and saved for each version. The download link is emailed and shown on the page.

### Privacy

- Collect the minimum (§8) and encrypt data at rest.
- Set a retention policy, and let users delete their account and reports.
- Check obligations under India's DPDP Act and the Australian Privacy Act [Founder + legal].

---

## 12. Design system and UX rules

**Reference:** `landfall-sample.html`. Its data and brand are placeholders; the look and patterns are the target.

**Feel:** premium, trustworthy and calm; data-heavy but easy to read. Honesty is what makes it feel premium.

### Tokens

- **Brand colours:**
  - teal `#0F6E56` for primary actions, logo and the primary button;
  - `#1D9E75` for charts and "you" highlights;
  - `#5DCAA5` as a secondary chart tint;
  - `#E1F5EE` for icons on brand colour.
- **Surfaces:** page `#EBE9E3`, card `#F5F4F0`, panel `#FFFFFF`.
- **Text:** primary `#1B1B19`, secondary `#57564F`, muted `#8B8A83`.
- **Borders:** `rgba(27,27,25,.10)`, `.18` and `.40`.
- **Status colours:**
  - success `#3B6D11` on `#EAF3DE`;
  - warning `#854F0B` on `#FAEEDA`;
  - accent `#185FA5` on `#E6F1FB`;
  - danger `#A32D2D`;
  - chart red `#E24B4A`;
  - neutral grey bars `#888780`.
- **Type:**
  - Source Serif 4 for headlines, big numbers and the cover; IBM Plex Sans for UI and body text.
  - Tabular lining numerals for all numbers.
  - Two weights only (400 and 500).
  - Sentence case everywhere; no all caps.
- **Shape:** 8px corner radius for controls, 12px for cards. Flat design: no gradients and no heavy shadows.

### Components (all shown in the HTML)

- Outlook pill.
- Confidence meter (3 bars plus a label).
- Summary card.
- Big number with a sentence.
- Queue bar (segments, a "you" marker and a legend).
- Cut-off dot chart (dashed "your score" line; hollow dot = no invitations that round).
- Timeline (date, dot coloured by type, title, detail).
- Points audit row (name with status pill, detail, bar, score/maximum).
- Scenario bar list.
- State row (state, rules, latest report with source tag, fit pill).
- Trait comparison rows with match icons.
- Bar lists and metric tiles.
- Glossary.
- Sticky header with brand, sample badge, data-as-at date and Download PDF button.
- Section links that highlight as you scroll.

### Mobile

- Use container queries. Below about 560px:
  - grids stack into one column;
  - tables become stacked rows or cards;
  - section links scroll horizontally.
- Prefer horizontal bar charts.
- Tap targets at least 44px.
- Collapsible details.

### Copy rules

- Plain English, active voice, specific.
- No fake urgency, no fake testimonials, no stock photos of landmarks.
- Show data-as-at dates and sources where people can see them.
- Disclaimers should be calm and clear.

### Accessibility

- WCAG AA contrast and visible keyboard focus.
- Charts have aria-labels that include the data.
- Respect reduced-motion settings.

### Charts

- Use SVG so the PDF stays sharp: visx, Recharts with SVG output, or hand-written SVG.
- Avoid canvas.

---

## 13. Suggested tech stack and architecture

These are suggestions. Claude Code may propose alternatives with reasons. Keep it simple enough for a solo founder.

### Stack

- **Web:** Next.js (App Router) with TypeScript, hosted on Vercel.
- **Database:** PostgreSQL (e.g. Neon or Supabase) with Drizzle or Prisma.
- **Background jobs and PDF worker:**
  - a small container service (Fly.io, Railway or Render) running Playwright;
  - a job queue such as pg-boss on Postgres, or Inngest/Trigger.dev.
- **Email:** Resend or Postmark.
- **Telegram:** the Bot API for channel posts.
- **Payments:**
  - Razorpay (INR, UPI);
  - Stripe or Paddle (USD/AUD). Paddle acts as merchant of record and handles tax. [Founder]
- **Auth:** magic-link email.
- **Monitoring:** Sentry, plus privacy-friendly analytics (e.g. Plausible) on marketing pages only.

### Core data model

- **Users and orders:** `User`, `Profile` (inputs, versioned), `Order`.
- **Reports:**
  - `Report`;
  - `ReportVersion` (profile snapshot, data snapshot IDs, rule-set version, computed JSON, PDF URL, created at);
  - `ReportToken` (link, revocable).
- **Data snapshots:** `DataSnapshot` (type, source, fetched at, hash, status).
- **Occupations:** `Occupation` (ANZSCO code, names, slug, group).
- **EOI counts:** `EoiCount` (snapshot, occupation, subclass, points, date-of-effect month, state, count).
- **Rounds:**
  - `InvitationRound`;
  - `RoundCutoff` (round, occupation, subclass, minimum points, date-of-effect cut-off if published);
  - `Ceiling`.
- **States:**
  - `StateProgram`;
  - `StateListing` (state, occupation, subclass, year, rules);
  - `StateInvitationReport` (official or community, source URL).
- **Community and accuracy:**
  - `CommunityReport` (moderation status);
  - `Prediction` (saved at, predicted, actual, graded).
- **Other:** `VisaGrantStat`, `PointsRuleSet`, `AlertSubscription`, `Feedback`.

### Report engine

- Pure functions, run in order:
  1. `computePoints(profile, ruleSet)`
  2. `computeKeyDates`
  3. `computeQueue(snapshot)`
  4. `computeScenarios`
  5. `computeStateFit`
  6. `computeEstimates`
  7. assemble the `ReportVersion` JSON, including the cross-link flags.
- Unit-test each function with fixtures, and add golden-file tests for complete reports.
- Rendering reads only the JSON.

---

## 14. Payments, pricing and refunds

- **One product:** the personalised report, 3 months of refreshes, and alerts.
- **Location-based pricing,** by where the buyer lives, not their nationality:
  - India-based: about ₹499–999 via UPI;
  - Australia and elsewhere: about US$15–29 (or the AUD equivalent).
  
  Start with two price points and A/B test them. [Founder]
- **Price anchor:** ImmiTrend only offers an occupation report through Pro+ at US$19.99/month.
- **Show the full table of contents** on the pricing page and on the paywall.
- **Refund policy,** written before the first sale [Founder]:
  - e.g. refund if the report can't be generated for their occupation, or the data is clearly wrong;
  - wrong predictions don't qualify, as long as they're clearly labelled as estimates. Say this on the page.
- **Receipts:** by email. GST/tax handling [Founder + accountant].

---

## 15. Legal and compliance guardrails

This is not legal advice. Before launch, the founder must get a one-off review from an Australian migration lawyer covering the report template, the calculator and the site copy.

### Context

- **Migration Act 1958, s280:** only registered migration agents, Australian legal practitioners and a few exempt people may give immigration assistance.
- **s281:** asking for or receiving a fee for immigration assistance while unregistered is a serious offence, reported to carry up to 10 years' imprisonment.
- **OMARA guidance (March 2026):** there is no exemption for information generated by AI.
- **Offshore activity:** Home Affairs notes that Part 3 of the Act doesn't apply outside Australia. Don't rely on this, because onshore users are core customers.

### Product rules

- **Present data and estimates, never advice.**
  - Never write "you should", "apply to" or "choose occupation X".
  - Write "the data shows" or "people with similar profiles".
- **No AI chat assistant in v1.**
- **Lawyer review required** for the related occupations, other pathways and "if you're invited" sections, and for state fit wording.
- **Disclaimer:** every report page and the site must say "General information, not migration advice. [Brand] is not a registered migration agent." Link to the OMARA register so people can find an RMA.
- **Attribution:** "Department of Home Affairs data used under a CC BY 3.0 AU licence", with a link to the licence.
- **No government logos,** and nothing that implies government affiliation.
- **Real testimonials only.**
- **Privacy:** handle data as described in §11.
- **Later:** any RMA partnership (premium reviewed tier or B2B) must be set up with legal advice.

---

## 16. Build plan, milestones and acceptance criteria

### Phase 0: foundations (weeks 1–2)

- Repository, stack and database schema.
- Rule set for the current points test, with tests.
- Import and validate the 189 EOI snapshot and round results for the v1 occupations.
- Admin import screen showing differences and validation results.
- Design tokens and core components based on `landfall-sample.html`.

### Phase 1: first sale (weeks 3–6)

- **Pages:** home, points calculator, check/preview, sample, pricing, methodology, about, FAQ, legal.
- **Report engine** covering:
  - summary, key dates, points audit and scenarios;
  - 189;
  - 190/491 state rows, with state data entered manually through admin.

  Other sections can be simplified in v1 but must follow the structure.
- **Delivery:** checkout (one payment provider first), report link, web report, PDF worker, email delivery.
- **Manual review mode:** the admin can review and adjust each of the first ~20 reports before release.

### Phase 2: retention and search traffic (weeks 7–12)

- All report sections complete.
- Occupation pages and the latest rounds page.
- Alerts by email and Telegram.
- Refreshes with "What changed".
- Community invitation form and moderation.
- Accuracy scorecard.
- Second payment provider.

### Phase 3: growth

- Support for the new points test, as soon as the final rules are published.
- Referrals, account dashboard and key date reminders.
- Hindi content.
- White-label B2B widgets for RMAs.
- RMA-reviewed premium tier.

### Acceptance criteria for v1

- **Points calculator:** matches the official rules across a test suite of at least 30 profiles [Verify].
- **Traceability:** every number in a report traces to a snapshot ID and computation version. No hard-coded data in components.
- **Imports:** any validation error stops the import from being published.
- **Report pages:** `noindex`, no third-party scripts, unguessable tokens, and working revocation.
- **PDF:**
  - renders every section with SVG charts;
  - no cards split across pages;
  - correct footer;
  - generated in the background in under 60 seconds.
- **Mobile:** Lighthouse performance and accessibility scores of 90+ on the report and calculator; usable at 360px width.
- **Copy:** all text passes the "data, not advice" check.
- **Sample report:** runs on real, current data and is regenerated monthly.

---

## 17. Open decisions for the founder

- **Brand and domain:** a .com is recommended; a .com.au needs an Australian business connection.
- **Legal set-up:** where to register the business, which lawyer to engage, and whether to partner with an RMA.
- **Payments:** providers, exact prices and the refund policy.
- **v1 scope:** the occupation list, and what happens for other occupations.
- **Community data:** incentives for reporting invitations, and moderation rules.
- **Channels:** whether to add a WhatsApp channel alongside Telegram.
- **Estimates:** confidence thresholds and model details (start simple).
- **Data collection:** the extraction method for each source, respecting its terms.