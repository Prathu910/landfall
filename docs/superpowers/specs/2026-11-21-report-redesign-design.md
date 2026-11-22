# Report redesign: verdict first, mobile first (design)

Date: 21 November 2026. Status: approved mockups, written design for founder approval.

Locked mockups and the founder's rulings: `.superpowers/brainstorm/report-redesign-2026-11-21/`
(`report-e-final.html` with every scenario, `device-preview.html`, `pdf/` samples, `decisions.md`).
The mockups are the visual and copy reference. Where this document and a mockup disagree, this document wins.

## 1. Intent

Friends of the founder found the site text-heavy, and the report (34 printed pages) never said clearly whether the reader is in a good position. ImmiTrend, built on the same public data, answers that directly ("Strong chance", "about 3 months"). The founder retired the 17 Nov 2026 "no chances, no forecasts" rule (decision log, 21 Nov 2026) and asked for a product that is clearly better than ImmiTrend and worth paying for.

The redesigned report gives every reader, in the first screen:

- a **plain label** for their best visa, as an ink stamp;
- one sentence of why, the **best route**, and an **estimated wait**;
- a short **"Our read"** written by AI from the computed facts;

then, in order, the three visas, two charts, a route with dated risks, what each improvement would change, folded evidence, the full points profile, how labels are decided, and a not-a-guarantee footer. The printed or downloaded PDF is about 4 A4 pages on every device.

About 80% of readers are on phones, so the report is designed for 360–390 px first.

## 2. Goals, non-goals, anti-goals

**Goals**

1. Every report opens with a label, a reason, a best route and an estimated wait.
2. Labels, waits, routes and improvements are computed in code, deterministically, from the published snapshot and the reader's answers.
3. "How to improve" shows, for each change, the label the reader would get after it, using the same rules as the headline.
4. The full points profile appears at the end, so the report can be handed to anyone.
5. Mobile first at 360/390 px, good on tablets (820 px) and desktop (1280 px).
6. One A4 print layout: about 4 pages, answer on page 1, identical from any device.
7. An AI-written "Our read" whose numbers are verified against the facts, with a deterministic template whenever AI is unavailable or fails the check.
8. All nine mockup scenarios render correctly (section 9).

**Non-goals (this project)**

- Homepage, occupation pages, `/states/` and methodology redesign. They come next and must keep working unchanged.
- Payments, a paywall, accounts, email delivery, alerts.
- Server-generated PDFs (planned with the paid report; this layout is built so that step can reuse it).
- New data imports. Everything needed is already in the core and detail records (section 6.6).
- A published forecast track record.

**Anti-goals (a failure even if it works)**

- An AI-chosen label, wait or number. AI only words what code decided.
- A masked count ("<20") shown as a number, or used optimistically when it decides a label.
- Hiding a hard truth to look positive: when 189 is closed for an occupation, the report says so even if the stamp shows a state route.
- A phone layout that needs sideways scrolling, or text under 12 px.
- A report that breaks when AI, the network or a data file is unavailable.

## 3. Constraints

- Static export (`output: "export"`), Next.js 16, webpack. Read `node_modules/next/dist/docs/` before using a Next API.
- `src/lib` stays pure (no React, DOM or fetch) and is test-driven (`docs/ENGINEERING.md`).
- Client components load data only through the existing hooks (`useOccupationCore`, `useOccupationDetail`) and the allowed client JSON (`occupation-index.json`, `rounds-meta.json`, state rule data).
- Brand tokens live in `globals.css` and `src/lib/brand/palette.ts` (contrast and mirror tests). New colours are added to both.
- 12 px floor test, CSS Modules for new components, one exported component per file, about 250 lines per component file and 300 per `src/lib` module.
- The full Profile stays in the browser. Only the email gate's allowlisted summary goes to Supabase today; the AI step adds a second, documented flow (section 7).
- Every animation respects reduced motion. The stamps do not animate.
- `npm run check` and `npm run build` pass; browser verification against `out/`.

## 4. Approaches considered

| Approach                            | Trade-off                                                                                                                                    | Outcome                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **A. Code decides, AI explains**    | Labels and numbers are deterministic and testable; AI adds a readable paragraph; a template covers failures. About US$0.15–0.20 per AI read. | **Chosen by the founder.**     |
| B. Code only, templated wording     | Free and instant, but reads robotic and is harder to charge for.                                                                             | Kept as the fallback inside A. |
| C. AI does everything from raw data | Flexible, but will sometimes invent or miscount numbers.                                                                                     | Rejected.                      |

Visual direction: four looks (A Signal, B current brand, C Departures, D Passport) led to **Option E**, combining A's clean white layout and Archivo type, D's ink stamps and passport-style points page, and C's charts. Desktop is final; mobile-first behaviour is in section 8.

PDF: one A4 layout for every device, chosen over a phone-shaped PDF because the PDF is for sharing and printing; the live report is the phone reading experience.

## 5. What the reader sees (screen)

Section order (ids in brackets are the in-page anchors):

1. **Outlook** (`outlook`): the "who" line (name if given, occupation, points, onshore/offshore, data month), headline, fact sentence, **Best route**, **Estimated wait**, a one-line "why this label", **Our read**, a **Download PDF** button, and the big stamp.
2. **Your three visas** (`visas`): one stamp each for 189 (rectangle), 190 (hexagon) and 491 (oval), each with its own label and a one-line caption.
3. **Last 6 cut-offs** and **Who's in the queue** (`charts`): columns for the occupation's last six 189 rounds ("Not listed" as dashed outlines) with the reader's line and, where useful, a target line; and queue squares (ahead, tied, behind; a lodged variant in 9.8). Empty states use a dashed box and a plain sentence.
4. **Your best route** (`route`): 3–4 steps with points bubbles, plus dated risks as red markers (birthdays that cost points, English or EOI expiry).
5. **How to improve** (`improve`): cards "change → before stamp → after stamp" with one line of why. The best card is outlined and tagged "Biggest jump". Variants: "Protect your points" when already Very strong; a banner when points can't help ("Points aren't what's holding you back"); a plain list when there is no data. Dated losses appear as a red deadline card.
6. **See the evidence** (`evidence`), folded on screen: every 189 round since 2022 with "Enough / Short by N"; the 189 pool by points; what happened to EOIs from a year ago (or the reader's month if lodged); 190 and 491 by state; and the existing state detail (tiles, panels with rule lines and sources) plus the "Sharpen my state outlook" questions. Sources line at the end.
7. **Your points, in full** (`points`): name, occupation, date of birth and age, location, skills assessment, English test and expiry, EOI date if lodged; every points category including zeros; totals for 189, 190 (+5) and 491 (+15); a decorative passport-style line (`aria-hidden`).
8. **How we label your outlook** (`method`): the label rules in plain sentences (section 6.1–6.3).
9. **Footer:** "This is our best reading of the data, not a guarantee." with the full sentence from the mockup.

The existing "Was this useful?" feedback prompt stays, after section 8, screen only. The email gate before the personal report is unchanged.

Removed from the report: "Get organised" checklist and "Useful definitions" glossary (glossary terms move to the methodology page). The occupation comparison and the 12-month trend chart move into the evidence section, screen only.

**`/sample/`** (founder, 21 Nov 2026) shows four example reports as tabs: Strong (Aarav), In the middle (Priya), 189 closed (Rahul) and Nothing suits (Dev). Each uses a fixed fictional profile against the live snapshot and a checked-in "Our read" that passes `checkRead` in unit tests (template-based, so a data refresh can't leave a stale number). Tests fail if a refresh changes an example's stamp, so the examples are reviewed when the data moves. The sample's tabs never print.

## 6. Domain rules (code decides)

New pure modules live in `src/lib/outlook/` (names are suggestions; the builder may split differently within the size limits). They take the occupation core and detail records, the Profile, the points result, state rules and an explicit `asOf`.

### 6.1 Labels

```ts
type OutlookLabel =
  | "very-strong"
  | "strong"
  | "competitive"
  | "long-wait"
  | "not-invited"
  | "not-eligible"
  | "no-data";
```

Display names: Very strong, Strong, Competitive, Long wait, Not currently invited (stamps may shorten to "Not invited"), Not eligible yet ("Not eligible"), Not enough data ("No data"; "Too few to count" when every count is "<20").

**Rank for "best"**: very-strong > strong > competitive > long-wait > not-eligible > not-open > not-invited > no-data. Not eligible ranks above the others because points can fix it. `not-open` exists only for 190/491 (a state, or a whole visa when every state is not open to the reader); its display name is "Not open to you".

### 6.2 189 label

Inputs: the reader's 189 points; the points-test basics (`eligible` in `PointsResult`: age, English, assessment); `rounds189` (newest first, `null` cutoff = not listed); the 189 pool by score.

Checked in this order:

1. **Not eligible yet**: under 65 points, or `eligible === false`.
2. **Not enough data**: no published 189 pool **and** no round lists the occupation. If every published count is "<20", the display name is "Too few to count". An occupation that rounds list but that has no published pool (some medical specialists, for example Endocrinologist 253315) is labelled from its rounds as below, with zero EOIs ahead, when a core is supplied. The client never fetches `hasData: false` occupations (`docs/DATA.md`), so in the product these show No data; fetching them is out of scope.
3. **Not currently invited**: the occupation's cutoff is `null` in each of the last 4 rounds (the last 4 rounds overall, not the last 4 listings).
4. Let _L3_ be the cutoffs of the occupation's last 3 **listed** rounds (fewer if fewer exist).
5. **Very strong**: points > max(L3) **and** EOIs with a higher score ≤ 19 (cautious reading: the interval's max ≤ 19).
6. **Strong**: points ≥ max(L3).
7. **Competitive**: points ≥ min(L3).
8. **Long wait**: otherwise.

### 6.3 190 and 491 labels, by state

For each state (and `ANY` excluded from ranking), at the reader's points with nomination (+5 or +15), using `stateInvited` and the existing rules engine (`src/lib/state-outlook/`):

- **Rules first.** If the rules engine says the state is not open (not on the list, fails onshore/offshore, residence or experience rules), the state is **Not open to you** and cannot be the best route.
- **Evidence label** from invitations at or below the reader's points, checked in this order (the first that matches wins):
  1. **No data**: none of the last 6 calendar months was fetched.
  2. **Strong**: at least 20 confirmed invitations (sum of interval mins) at or below the reader's points over the last 3 months **and** at least half of that state's invitations in those months were at or below the reader's points (cautious reading of masked cells).
  3. **Competitive**: any confirmed invitation (interval min > 0) at or below the reader's points in the last 3 months; **or** masked ("<20") invitations at or below the reader's points in at least 2 of the last 3 months.
  4. **Long wait**: any invitation (masked or confirmed) at or below the reader's points in the last 6 months; **or** invitations only above the reader's points in the last 6 months.
  5. **Not currently invited**: no invitations for the occupation in that state in the last 6 months.
- **Rules being checked** (ACT, VIC, TAS, NT today) and **Needs your answers** keep the evidence label and carry a flag shown next to it ("we're still checking Tasmania's rules", "answer 2 questions to confirm").
- The visa's label is its best state's label; ties break by states without a flag first, then confirmed invitations at or below the reader's points, then months with such invitations in the last 6, then state code.

Months come from `calendarMonths` back from `asAt`, never from the keys a record holds. A fetched month with no row is zero; an unfetched month is left out and never counted as zero.

### 6.4 The stamp (best visa)

- The stamp shows the best label among 189, 190 and 491; ties prefer 189, then 190, then 491.
- If no visa is Competitive or better, one **combined stamp** ("189 • 190 • 491") shows the best of the three labels.
- The headline and fact sentence follow the stamp, but when 189 is Not currently invited, Long wait or Not eligible yet while a state route is stamped, the fact sentence must also state the 189 position (mockups: Meera, Rahul, Arjun).

### 6.5 Estimated wait

Shown for the stamped visa. Always labelled as an estimate in the methodology; the figure is never a percentage.

| Situation                                          | Text                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 189 Very strong                                    | "The next 189 round."                                                                                         |
| 189 Strong                                         | "The next 1 to 2 rounds."                                                                                     |
| 189 Competitive, not lodged                        | "Uncertain. Possible in a round that goes down to {points}, like {month of the latest round at that cutoff}." |
| 189 Competitive or Strong, lodged (EOI date given) | Pace estimate (below), e.g. "1 to 2 years at 70 (estimate)."                                                  |
| 189 Long wait                                      | "Unlikely without more points."                                                                               |
| 189 Not currently invited                          | "No 189 invitations to measure."                                                                              |
| 189 Not eligible yet                               | "189: not possible until you reach 65."                                                                       |
| No data                                            | "We can't estimate one without data."                                                                         |
| A state visa stamped                               | "States don't publish a queue. {State} invited at or below your points in {n} of the last 6 months."          |

**Pace estimate for lodged readers** (189 only):

- EOIs ahead = higher-score EOIs + SUBMITTED EOIs at the reader's score from submission months before the reader's month (`cohortsByScore`). Month submitted stands in for the unpublished date of effect, so the result is described as "roughly".
- Pace = EOIs INVITED at the reader's score in the latest snapshot month (`invitedByScore`).
- Rounds per year = 189 rounds in the last 12 months (from `rounds189` dates).
- Rounds needed = ahead ÷ pace, using interval min and max; years = rounds needed ÷ rounds per year, shown as a rounded range ("about 3 to 4 rounds, so plan for 1 to 2 years"). If the pace is masked or zero, say "No recent invitations at your score to measure a pace."

### 6.6 Data used (all already imported)

`rounds189`, `pool[visa].byScore`, `invitedByScore`, `stateInvited`, `statePool`, `statusHistory` (core); `cohorts`, `cohortsByScore` (detail); state rules, lists and the federal list (client JSON). The 189 cutoff chart, round tables and pool histogram reuse existing accessors where they exist (`src/lib/data/*`, `src/lib/report/data-says.ts`).

### 6.7 How to improve and protect

- Candidate changes come from the reader's own answers and the existing scenarios (`src/lib/scenarios.ts`): English band up (Proficient, Superior), NAATI CCL, Professional Year (eligible occupations only, as today), partner skills, the next experience band (with its date when it happens on its own).
- Each change produces a modified Profile → `calculatePoints` → the same labels (6.2–6.4). The card shows before and after for the visa the change matters most to (189 unless 189 is Not currently invited, in which case the card says what the change does and doesn't do).
- **Biggest jump**: the change with the highest after-label, then most points, then shortest time.
- **Dated losses** from `buildTimeline`: age-band birthdays, English test expiry, skills assessment expiry, EOI expiry (two years after submission). They are applied **cumulatively in date order** (each card starts from the points left after the earlier losses). An English test or skills assessment expiring makes the reader **Not eligible yet** until it is renewed (this matches `calculatePoints`, where an expired test sets `eligible` to false); those cards show "!" and say a valid test or assessment is a basic requirement, not a points loss. EOI expiry means a new EOI with a new date of effect.
- **Very strong readers** get "Protect your points" (dated losses only).
- **No data**: a plain list of available points, no labels.
- When 189 is Not currently invited, a banner says points aren't the problem, and a points change that leaves 189 Not currently invited is shown as such.

### 6.8 Best route

A short ordered list built by rules from the stamped visa and the reader's state. Each step has a label, a sub-line and, where points change, a points bubble coloured by the label at that point. Patterns from the mockups:

- Very strong 189: today → submit EOI (189 + strongest state) → gather documents → invitation (60 days to lodge).
- Competitive 189: today → submit EOI → the biggest improvement (with expected month) → update EOI the day results arrive.
- State route: today → check the state's rules (if not verified) → submit EOI for that state → keep 189 ticked.
- Below 65: today → submit for the state visa that is possible → the improvement that opens 189 → update EOI.
- Lodged: EOI submitted (date) → today (days waiting) → the improvement → invitation.
- Nothing suits: today → keep EOI in → check other occupations you could be assessed in → watch the states that still list you.

Dated losses from 6.7 are placed between steps by date.

### 6.9 Facts and "Our read"

- A typed `ReportFacts` object collects everything the read may mention: labels, points (now, with nomination, after each change), counts (as intervals with their display text), months, state codes, the best route, the wait text and dated changes (month precision).
- `readTemplate(facts)` produces the deterministic read for every situation. It is used for samples, when AI is off, slow or fails, and in tests.
- `checkRead(text, facts)`: every number in the AI text must be one of the allowed numbers in the facts (counts, points, months, years, day counts); banned phrases (section 10) are absent; length 40–110 words. Any failure → the template.

## 7. AI "Our read" (Supabase Edge Function)

- New function `write-read` alongside `submit-calculation`, same CORS, origin list, request limits and shared handler.
- **Authorization**: `submit-calculation` (already called by the email gate, with Turnstile) returns a short-lived signed token (HMAC over submission id and expiry, about 10 minutes). `write-read` accepts up to 3 calls per token. `/sample/` and fictional examples never call it; they use checked-in reads that pass `checkRead` in unit tests.
- **Input**: the `ReportFacts` only. No name, email, date of birth or exact dates; dated changes are month and year.
- **Model and prompt**: called through the official Anthropic SDK with a fixed system prompt (voice rules from section 10, "use only the numbers in the facts", 60–90 words, no greeting, no name) and the facts as the user message. Server-side refusal fallback enabled where the model supports it.
- **Configuration** (founder, 21 Nov 2026): all AI settings are **server-side environment variables** (Supabase secrets), never in the frontend build, so they can change without a frontend release and are never visible to visitors:

  | Variable                 | Purpose                                                 | Default if unset                                                         |
  | ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
  | `ANTHROPIC_API_KEY`      | API key                                                 | none: the function answers "disabled" and every report uses the template |
  | `READ_MODEL`             | Model ID, e.g. `claude-opus-5-5` or `claude-sonnet-5-5` | `claude-opus-5-5`                                                        |
  | `READ_ENABLED`           | Server kill switch (`true`/`false`)                     | `false`                                                                  |
  | `READ_MAX_OUTPUT_TOKENS` | Cost cap per read                                       | a small value suited to 60–90 words                                      |

  Safety rules: the function checks `READ_MODEL` against an allowlist of current Claude model IDs kept in the function's code (adding a model is a one-line code change with a test), and an unknown or misspelled value never reaches the API: the function answers "disabled" and logs the configuration error, and the reader gets the template. The same happens for a missing key, `READ_ENABLED` not `true`, a timeout, a refusal or a failed `checkRead`. A model change takes effect on the next request with no frontend deploy. `docs/OPERATIONS-BACKEND.md` documents the variables and how to set them.

- **No storage**: facts and the generated text are not written to the database or logs. A per-IP rate limit protects cost.
- **Switch**: two switches must both be on. The frontend calls `write-read` only when a public build setting enables it (off by default), and the function itself serves reads only when `READ_ENABLED=true`. Turn them on after the privacy text and the coordinated `PRIVACY_VERSION` deploy are live. With either off, every report uses the template read.
- **Changes after render**: answering the "Sharpen my state outlook" questions re-runs every deterministic part at once (labels, stamp, wait, route, improve). "Our read" is requested again once per change; a token allows up to 3 calls in its 10 minutes, after which the template is shown.
- **Client behaviour**: the report renders immediately; the "Our read" box shows "Writing our read…" for up to 6 seconds, then the template if nothing valid arrived. The text is checked client-side as well (`checkRead`) before it is shown. Printing uses whatever is shown.
- **Email gate copy**: "Your full answers stay in your browser" stays true and gains "Your summary is written by AI from your results (not your answers)." when the switch is on.
- **Privacy**: the privacy text gains one sentence describing this flow (computed facts sent to Anthropic to write the summary, not stored by MigrateLens). Bumping `PRIVACY_VERSION` needs a coordinated backend deploy (see `docs/HANDOFF.md`). The founder handles legal review.
- `npm run backend:check` and `backend:test` cover the new function, including token expiry, reuse and an invalid facts payload.

## 8. Layout and responsive behaviour

Reference: `report-e-final.html` and `device-preview.html`.

- **Desktop (≥1024 px)**: as the mockup. Hero two columns (text, stamp); three visa stamps in a row; charts side by side; horizontal route; improve cards with stamps on the right.
- **Tablet (721–1023 px)**: desktop structure with single-column charts and the sticky section chips.
- **Phone (≤720 px)**: stamp first (about 230 px wide), then the who line, headline and fact; **Best route** and **Estimated wait** as two tiles; then the why line and Our read. Sticky section chips (Outlook, Visas, Cut-offs, Route, Improve, Evidence, Points) under the site header. Visa stamps as rows (116 px stamp beside its caption). Charts redrawn at a 340-unit width with larger text (not scaled-down desktop SVGs). Vertical route timeline with dated risks inline. Improve stamps below the text (max 300 px). Points table stacks the detail under each category; the photo placeholder is hidden; the totals stay three across.
- Body text 16 px on phones; nothing under 12 px, including SVG text at rendered size.
- Charts keep text alternatives (`aria-label` summaries; tables in the evidence section).
- The stamps use an SVG ink-texture filter and the **Big Shoulders Stencil Display** font, self-hosted through `@fontsource/big-shoulders-stencil-display` (Archivo is also self-hosted). Stamp text is fitted to its box in code (measure and set `textLength` when too wide) so a late font load never overflows.

## 9. Scenarios the build must reproduce

Each has a real-data fixture test asserting the stamp, the three visa labels, the wait text and the improvement labels, plus a browser check. Figures are from snapshot `skillselect-2026-10-31`; the people are fictional.

1. **Strong**, Aarav (`sampleProfile`, nurse 254499, 90, onshore NSW): 189 Very strong; "Protect your points" (33rd birthday −5 stays Very strong at 85; English test expiry after that makes him Not eligible yet until he retakes it).
2. **In the middle**, Priya (nurse, 70, offshore): Competitive; Superior English → 80 Very strong; NAATI → 75 Strong; turning 33 → 65 Long wait.
3. **Long wait, state better**, Meera (early childhood teacher 241111, 80): 189 Long wait; stamp 190 TAS Competitive.
4. **189 closed**, Rahul (software engineer 261313, 85): 189 Not currently invited; stamp 190 NT Competitive; Professional Year card stays Not invited.
5. **Below 65**, Arjun (nurse, 60): 189 Not eligible yet; stamp 190 TAS Competitive.
6. **No data**, Sana (greenkeeper 362311, 75): nothing published (no pool, no round listing, no state invitations; 8 of 493 occupations are like this). Combined "No data" stamp; falls back on list membership (federal list for 190/491, WA list). A separate unit test covers the "listed in rounds but no pool" case (Endocrinologist 253315 at 80 is Competitive from its rounds).
7. **Nothing suits**, Dev (internal auditor 221214, 75): combined "Not invited" stamp.
8. **Already lodged**, Kavya (nurse, 70, EOI 12 Mar 2026): Competitive, pace estimate, EOI expiry 12 Mar 2028.
9. **Evidence opened**, Priya: the folded section's full content.

The mockup's state "Rules" column was illustrative; the build uses the real rules engine, so a few state labels may differ from the mockup. That is expected and must be noted in the PR.

## 10. Copy and voice

- Plain, specific, second person, short sentences. Lead with the reader's number.
- Pools and queues count **EOIs**. Invitation counts may read "invited 168 nurses" as shorthand in "Our read" and captions (approved mockup wording); tables say EOIs.
- Templates use the ANZSCO occupation name from the data (no hand-made plurals). The AI read may phrase it naturally.
- "Under 20" is never written as a number; "so may be zero" where it matters.
- **`BANNED_COPY` changes** (`src/lib/report/copy.ts`): remove `should`, `best` and the generic `people`/`applicants` ban from the report's new sections (the new voice uses "best route", "your best chance"); keep banning `guarantee(d)` outside the footer, `definitely`, `will be invited`, `%`, `chance(s) of`, `likely to be invited`, `some invitations`, `a few`. Old modules still used by the homepage and occupation pages keep the current list until their redesign.
- The footer sentence is fixed text (mockup).

## 11. Print and PDF

Reference: `pdf/` samples (4 pages each) and the print stylesheet in `report-e-final.html`.

- A dedicated print layout rendered alongside the screen layout (hidden on screen, shown in print), so print never inherits phone styles. All phone and tablet media queries are `screen and (...)`.
- `@page { size: A4; margin: 14mm 14mm 18mm; }`. Footer margin boxes: left "MigrateLens report for {name}. Our best reading of SkillSelect data to {month}, not a guarantee."; right "Page x of y" (Chrome-based browsers; Safari omits them, the guarantee box remains).
- Page 1: brand line, outlook (text with tiles and Our read; stamp), three visas. Page 2 (forced break): charts (phone-size SVGs, two columns), horizontal route at print width, how to improve. Page 3: points in full, how we label, the guarantee box (kept together where possible). Appendix (forced break): rounds table, pool histogram, 190 and 491 state tables side by side, sources.
- Colours print exactly (`print-color-adjust: exact`). Section chips, buttons, scenario tabs and the feedback prompt never print.
- The **Download PDF** button calls `window.print()`. A one-tap server PDF comes with the paid report.
- **What prints** (founder, 21 Nov 2026): the answer, the plan, the profile and a one-page evidence appendix. The appendix's state tables carry a short rules note per state (on the list or not; onshore/offshore and residence fit, or "rules being checked"). The rule-by-rule state panels, the occupation comparison, the trend chart and the "Sharpen" questions are screen only. The written rule "every report section, including collapsed content, is visible when printed" (`CLAUDE.md`, `docs/ENGINEERING.md`) is updated to: "Every report section prints in the PDF; interactive controls and the detailed views inside 'See the evidence' are screen only."
- Acceptance: each scenario prints to at most 5 pages, page 1 contains the stamp, headline, best route, wait and three visas, and phone- and desktop-width prints are identical.

## 12. What changes in the codebase

- New `src/lib/outlook/` modules (labels, 189 label, state labels, best visa, wait, route, improve, queue groups, facts, template, read check, view-model) with fixture tests.
- New `src/components/report/` components for the outlook hero, stamps, visa row, cut-off columns, queue squares, route (horizontal and vertical), improve cards, evidence, points page, method note, print layout and Download PDF button, each with a CSS module.
- `report.tsx` composes the new sections; the old scorecard, data-says, visa panels and scenarios sections leave the report. Keep any module still imported by the homepage, `/sample/` hero demo or occupation pages until those are redesigned; delete only what nothing imports.
- New brand tokens for the seven labels (ink and background pairs, AA contrast) in `globals.css` and `palette.ts`.
- `supabase/functions/write-read/` with its model allowlist, the HMAC token in `submit-calculation`, the AI environment variables (section 7) documented in `docs/OPERATIONS-BACKEND.md`, privacy text and `PRIVACY_VERSION`.
- Docs: `docs/ENGINEERING.md` "Data honesty" (estimates allowed when computed in code from published history and labelled; still no percentages; AI never decides labels or numbers), `docs/REPORT-COVERAGE.md`, `docs/HANDOFF.md`, `docs/STRATEGY.md` (decision log already updated), `CLAUDE.md` architecture notes for `src/lib/outlook/` and the new function.

## 13. Delivery order

On a branch `roadmap/report-redesign`:

1. Domain: labels, best visa, wait, improve, route, facts, template and read check, all test-driven against the nine scenario fixtures.
2. Screen components and mobile layout; `/check/` and `/sample/` switch to the new report.
3. Print layout and Download PDF.
4. AI read: function, token, client integration, privacy text (the report is complete without this step, using the template).
5. Docs and final verification at 360, 390, 820 and 1280 px, reduced motion, and PDFs for the nine scenarios.

## 14. Left to the builder

- Exact module and component boundaries, names and file splits within the size limits.
- Template sentences beyond the mockup examples, following section 10.
- SVG implementation details (the mockup code is a reference, not production code), as long as the visuals and the 12 px floor hold.
- How the print layout shares components with the screen layout.
- Rate-limit numbers for `write-read`.
