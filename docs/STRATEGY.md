# Landfall strategy and founder decisions

**Read this first.** This is the current source of truth for product direction. Where it disagrees with `PRODUCT.md`, `REPORT-COVERAGE.md`, `HANDOFF.md` or `docs/original-references/`, this file wins. Record every new founder decision in the decision log at the bottom, with its date.

Last updated: 17 November 2026.

## Why Landfall exists

The founder went through Australian skilled migration personally. They paid an agency (Y-Axis) about 2,700 for an Australia PR report and got nothing extraordinary: the usual message that 65+ points means "you qualify, submit an EOI and hope". Agencies earn their fee whether the applicant waits two years, three years or forever.

Landfall is the report the founder wanted. It is a **frank reality check from official data**, covering:

- where you actually stand;
- how many EOIs are ahead of you and how many share your score;
- what happened to EOIs like yours;
- which states are realistic for your profile.

It is an independent information product, not an agency, and it earns nothing from telling people what they want to hear.

**Business goal:** earn the first dollar online, then build a sustainable income. The founder treats Claude as a co-founder: expect candid challenges, not agreement.

## Positioning

- Competitors (OneU Education, ImmiTrend, agency calculators) give away the same SkillSelect data as dashboards. Free data alone is a commodity. Landfall competes on **personal interpretation and blunt honesty**, for example: "189 has not listed your occupation in four rounds since Nov 2024".
- The founder stays **anonymous for now**. They may reveal their identity later. Until then, build trust through a "built by someone who went through it" voice (no name or face), a fully open methodology, dated sources and a public changelog. Later, add a published accuracy record.
- Primary audience: Indian applicants, onshore and offshore. Then Nepal, Sri Lanka, Pakistan and others. The brand is neutral, not India-branded.

## Product rules (updated)

- **No percentage chances.** Founder decision, 17 Nov 2026. Show counts instead. A forecast percentage may only be considered after Landfall has published a timestamped forecast track record.
- **Counts we do show for 189, 190 and 491:**
  - EOIs with a higher score in your occupation;
  - EOIs at your score;
  - an approximate split of same-score EOIs submitted before and after your month, labelled as approximate, because tie-breaks use the unpublished date of effect, not Month Submitted;
  - outcomes for EOIs like yours: invited, lodged, still submitted, or closed without invitation;
  - when invitations last happened.
- **Wait information comes from history, never a forecast.** Example: "EOIs at this score submitted in 2024 that were invited waited X–Y months." Where nobody was invited, say so plainly, and do not produce a wait estimate.
- Never collapse `<20` to a number; it stays the interval 0–19. Never present EOIs as unique people. Never invent data, testimonials or user counts.
- **Data, not advice.** State rankings say "where published evidence is strongest for profiles like yours", never "apply to X". Landfall is not a registered migration agent. A one-off migration lawyer review is required before any payment, and it must cover the state ranking wording (Migration Act s280/s281 risk).

## Data finding: the public dashboard has much more than we import

Read-only recon on 17 Nov 2026 used the same public SkillSelect Qlik dashboard as `scripts/import-report-evidence.py` (app `aaac76b5-…`, table `eymDb`). It exposes these fields:

- `EOI Status`: SUBMITTED, INVITED, LODGED, HOLD, CLOSED
- `Month Submitted`: 82 values, back to 2017
- `As At Month`: 24 monthly snapshots, 11/2024 to 10/2026
- `Nominated State`: ACT, NSW, NT, QLD, SA, TAS, VIC, WA, ANY, N/A, AUSTRADE
- `Visa Type`
- `Occupation` and `Occupation Group`, covering every occupation with EOIs (about 470), not just our 11
- `Score`
- Profile attributes: `English Test Score` (0/5/10/20 points), `Australian Study Flag`, `Regional Study`, `Comm Language Qual`, `Specialist Education`, `Professional Year`, `PartnerSkills Score`

There is **no onshore/offshore field.** Onshore/offshore treatment must come from the user's answers plus each state's published rules.

Preliminary samples as at 10/2026 (unverified interpretation; do not publish until status semantics are confirmed):

| 189, as at 10/2026 | INVITED | LODGED | HOLD | CLOSED |
| --- | --- | --- | --- | --- |
| 261313 Software Engineer | <20 | 119 | 343 | 12,354 |
| 254499 Registered Nurses nec | 2,730 | 989 | 91 | 7,936 |
| 241411 Secondary School Teacher | 243 | 204 | 63 | 2,538 |

Victoria 190 INVITED for Registered Nurses nec, by points: 75 → 36, 80 → 215, 85 → 86, 90 → <20, 95 → <20.

Things to verify before any of this is shown to users:

- How statuses behave for one EOI that selects several visas or states.
- Whether CLOSED mixes expiries, withdrawals and invitations on another visa.
- How long an EOI stays INVITED before it becomes LODGED. Cohort flips across snapshots may be needed to count invitations within a period.
- Table pages return at most 200 rows, so the import must page through results; a missing row in a truncated page is not absence.
- Keep the importer's ethic: read the displayed `qText` only, and never ask for unmasked counts.

## 190 / 491 state outlook (approved design direction)

Each state gets three layers:

1. **Eligibility (rules).** Is the occupation on that state's 190/491 list? Does the user meet its onshore/offshore and residence rules and its minimum work experience? These rules are curated by hand from official pages, each with a "checked on" date.
2. **Evidence (dashboard).** How many EOIs that state invited for this occupation at or below the user's score, profile-similar slices where they aren't masked, and the number of competing EOIs for that state.
3. **Points there.** Federal points plus 5 (190) or plus 15 (491). Also show the ACT Canberra Matrix score where it can be computed. For VIC (VPT) and TAS (priority attributes), first verify whether each system is published in enough detail to compute.

States are ranked by eligibility first, then by evidence, into these groups:

- **Strongest evidence**
- **Worth watching**
- **Not open to you now**
- **Unknown**, with the reason

Data limits are shown inline.

**Extra questions (option A, approved):**

- Add one question to check step 1: "Where are you now?" The answer is offshore, or onshore with the state.
- Everything else goes in an optional **"Sharpen my state outlook"** step after the report. This covers time living or working in the state, working in the nominated occupation there, a job offer, and earnings (for VPT).
- The first check stays fast.

## Approved roadmap (in this order)

1. **Data foundation.** Import every occupation, the EOI statuses, Month Submitted cohorts, Nominated State and profile attributes. Make the import verified, tested and reproducible. Resolve the status questions above.
2. **Reality-check section** at the top of the report, using the counts and history described above.
3. **State outlook for 190/491**, as designed above. Curate state rules for all eight jurisdictions.
4. **SEO foundation and occupation pages for every occupation.**
   - Tier 1: a generated page for every occupation, each with its own numbers and verdict. Set `noindex` on pages where every count is `<20`.
   - Tier 2: deep pages for about the top 30 occupations, refreshed monthly.
   - Requires: a final brand name and domain (Landfall is a working name), sitemap, robots, a unique meta description per page, OG images, JSON-LD (FAQPage, Dataset, Organization) and "last updated" stamps.
5. **Polish.**
   - Readability: about 125 font-size declarations are under 11px, some at 7–8px. Raise them.
   - Copy: make the hero specific to Australian PR and points, and drop the repeated "Short line. *Italic line.*" pattern.
   - Sample report: show its best moments, not empty states.
   - Fix the `npm ci` lockfile mismatch (`@emnapi/*` missing).
6. **Content engine.**
   - Recap pages within 24 hours of each invitation round.
   - Question pages built on our tools (age points, English expiry, "is 90 enough for X").
   - A points-reform hub, so we're ready when the new points test is published (announced in the 2026–27 Budget).
   - Data stories as link bait, e.g. "What happened to 12,000 Software Engineer EOIs".
   - AEO/GEO:
     - Open each page with a 2–3 sentence direct answer, with date and source.
     - Keep citable numbers stable.
     - Add `llms.txt`.
   - Off-page:
     - Genuine help in r/AusVisa and Telegram/Facebook groups.
     - An embeddable points-calculator widget that earns backlinks.
     - Partnerships with YouTubers and PTE coaches.
   - Case studies must be real or clearly data stories, never invented.
7. **Monetisation.**
   - Lawyer review comes first.
   - Paywall the full report:
     - India: about ₹999.
     - Onshore/elsewhere: about US$19–29.
     - Y-Axis's comparable report is listed at ₹2,360 incl. tax.
     - Founding-member price with a refund guarantee.
   - Alerts by email: an occupation appears in a round, a state list changes, or the user's points drop on a birthday.
   - Disclosed affiliate links (PTE prep, NAATI CCL) at the "+N points" moments.
   - Later, possibly an RMA-reviewed premium tier.

Also planned:

- **"Your cheapest next points".** Rank the ways to gain points (English band, NAATI CCL, Professional Year, partner, next experience band) by points gained, time and rough cost, alongside the dates when points drop.
- **EOI expiry warnings.**

## Superseded statements in older docs

- `PRODUCT.md` / `REPORT-COVERAGE.md` / `CLAUDE.md` said Landfall must never show invitation probabilities or wait-time predictions.
  - Still true: no percentages and no forecasts.
  - Now allowed: history-based outcome counts and historical waits, as defined above.
- `REPORT-COVERAGE.md` deferred "people like you", state ranking and "comparison with Victorian invitees" for lack of evidence. The dashboard fields above now make evidence-based versions feasible, subject to verification.
- `PRODUCT.md` phase 4 put occupation pages and SEO last. SEO for all occupations now comes before monetisation (roadmap step 4).

## Decision log

| Date | Decision |
| --- | --- |
| 17 Nov 2026 | Claude acts as co-founder; candid critique is expected. |
| 17 Nov 2026 | The product's core is a reality check: where you stand, who is ahead, what happened to EOIs like yours. |
| 17 Nov 2026 | No percentage chances for now. Show counts: ahead of you, at your score, outcomes and history. |
| 17 Nov 2026 | Publish pages for every occupation, in tiers, with noindex where all counts are masked. Blogs, data stories and backlinks are planned strategically. |
| 17 Nov 2026 | The founder stays anonymous for now. |
| 17 Nov 2026 | The 190/491 state outlook uses three layers (rules, evidence, points) and ranks states into groups. |
| 17 Nov 2026 | Extra questions: "Where are you now?" in step 1; the rest in an optional post-report step (option A). |
| 17 Nov 2026 | Roadmap order approved as listed above. |
