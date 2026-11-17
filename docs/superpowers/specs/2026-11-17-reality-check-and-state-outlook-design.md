# Reality check and state outlook: design

Roadmap steps 2 and 3 of `docs/STRATEGY.md`. Date: 17 November 2026. Status: draft for founder approval.

Builds on the data foundation (step 1): `docs/superpowers/specs/2026-11-17-data-foundation-design.md`, its accessors in `src/lib/data/`, and the data dictionary `docs/DATA.md` (written in step 1, Task 12). State research: `docs/research/state-nomination-2026-27.md`.

## Intent

The founder paid an agency for a report that said "you have 65+ points, submit an EOI and hope". Landfall's report opens with the opposite: a frank, sourced reality check of where the person stands in each visa queue, and which states' published evidence fits their profile. It never gives a percentage chance or a forecast.

This document covers two report features:

1. **Reality check (step 2):** a three-pathway scorecard at the top of the report, plus a detail panel per visa.
2. **State outlook (step 3):** for 190 and 491, every state and territory placed in an evidence group, each with its reasons, sources and checked dates.

## Goals

1. In the first screen of a report, show for 189, 190 and 491:
   - the user's points for that visa;
   - EOIs ahead of them and at their score;
   - one plain, factual sentence on recent invitation activity.
2. Let the user drill into each visa:
   - **189:** where you stand, the same-score split, rounds, what happened to EOIs like yours, and what could change.
   - **190/491:** the pool position plus the state outlook.
3. Place all eight jurisdictions into evidence groups for the user's occupation and situation. Every placement shows its reasons, sources and checked dates.
4. Cover every occupation in the step 1 dataset, not only the original 11:
   - state rules from official lists wherever a list is published;
   - "Not yet verified" or "Needs your answers", with the reason, where it isn't.
5. Work on a 390px phone, in print, with a keyboard, and with reduced motion.

## Non-goals

- Percentage chances, forecasts or "estimated months to invite" (founder decision, 17 Nov 2026).
- Free/paid gating. Everything is designed as one full report; paywall UI comes in step 7, after the lawyer review.
- State score calculators (Canberra Matrix, Victorian Points Test, Tasmania priority attributes) in this release. Their tables must first be transcribed verbatim and verified in a browser. Until then the panel says "Victoria ranks with its own points test (not calculated here)" and links to it.
- Employer-sponsored or other visas.
- Occupation SEO pages (step 4). They will reuse these components, so build them as server-renderable pieces.

## Anti-goals (failure even if it "works")

- **Masked counts as positive claims.** Any sentence that reads "<20" as a positive claim, such as "some invitations", is wrong. Under 20 may be zero; say so.
- **"Closed" read as "never invited".**
- **Summing across visas, states (including "any state") or monthly INVITED snapshots.**
- **A ranking that reads as advice.** No "best state for you", "apply to", or "you should".
- **Unverified rules shown as fact.** A rule sourced only from a search extract ([S] in the research) never produces "eligible" or "not open". It produces "Not yet verified".
- **A green tile whose reason a user can't see.**

## Decisions made with the founder (17 Nov 2026, browser mockups)

| Decision                           | Choice                                                                                                                                                     | Alternatives considered                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| How the reality check opens        | **C, the three-pathway scorecard**                                                                                                                         | A: verdict headline and three numbers. B: queue bar and outcomes.            |
| How much each card says            | **C2:** dark headline strip, then per card a status chip, one plain sentence, ahead / at-your-score counts and a details link                              | C1: numbers only                                                             |
| "What happened to EOIs like yours" | **D3:** your submission month in plain words, one outcome bar, nearby months in a table one tap away                                                       | D1: your month only. D2: month-by-month bars.                                |
| 189 detail panel order             | **Where you stand → among your score → recent rounds → EOIs like yours → what could change**                                                               | n/a                                                                          |
| State outlook                      | **E2, colour-coded tiles** for all eight jurisdictions; tap opens a detail panel with three layers                                                         | E1: ranked list in groups. E3: comparison table.                             |
| Extra questions                    | **Option A.** The existing step 1 question (offshore, or onshore with the state) stays; an optional "Sharpen my state outlook" step comes after the report | B: everything in the main check. C: state questions only in the paid report. |

Mockups (local, not committed): `.superpowers/brainstorm/*/content/`.

## Design

### Placement

The scorecard replaces the report's current opening: the three point totals (90 / 95 / 105) and the eligibility note. The points audit follows immediately after it. The report's section navigation gains "Reality check" first and "State outlook" inside the 190/491 content. Existing sections (scenarios, pool, rounds, timeline, states, comparison, checklist, glossary) stay, de-duplicated where they now overlap:

- The old "published pool" and "invitation history" sections fold into the 189 detail panel.
- The old "State pathways" cards are replaced by the state outlook.

### 1. Scorecard (C2)

**Headline strip.** One sentence about the cross-visa picture, chosen by deterministic rules from the 189 status:

| 189 status            | Template                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| No recent invitations | "189 hasn't listed {occupation} in its last four rounds. Your 190 and 491 prospects depend on state nomination."                   |
| Occasional            | "{occupation} was listed in {k} of the last four 189 rounds. The latest published cut-off was {cutoff} points; you have {score}."  |
| Regular               | "{occupation} was listed in each of the last four 189 rounds. The latest published cut-off was {cutoff} points; you have {score}." |
| No occupation data    | "Published SkillSelect data for {occupation} is too limited to compare. Your points breakdown is below."                           |

The source and snapshot date sit under the strip.

**189 status chip**, from the last four official rounds (`rounds189`, newest first):

- **Regular invitations:** a cut-off listed in all four rounds.
- **Occasional invitations:** listed in one to three of them.
- **No recent invitations:** listed in none.

**190 / 491 chip:** always "State decides". Their sentence summarises the state outlook, for example: "Strongest evidence in VIC and NSW. Not open to you now in 3 states." When the outlook has no Strongest group: "No state shows strong published evidence for your profile yet."

**Card contents:**

- visa name;
- the chip;
- the sentence;
- "Your points" (with +5 or +15 shown);
- "Ahead of you" and "At your score" from `poolPosition`;
- a details link.

The pool-overlap note sits under the cards: "One EOI can select several visas, so pools overlap."

### 2. 189 detail panel (approved order)

1. **Where you stand.**
   - A queue bar: ahead, at your score, lower scores.
   - A sentence with the published total and the net change across the stored history ("up 1,613 in 11 months").
   - The net change is a difference of published totals, not inflows.
2. **Among EOIs at your score.** `poolPosition(...).sameSubmitted` split around the user's EOI submission month: before, same month and after.
   - Always labelled approximate, because tie-breaks use the unpublished date of effect.
   - If the user has no EOI date, show: "Add your EOI date to see how many same-score EOIs were submitted before yours."
3. **Recent 189 rounds.**
   - Tiles for the last six official rounds: a cut-off, or "Not listed" (never zero).
   - "See all rounds" expands the full parsed history.
   - Skipped (unparseable) rounds are mentioned, never silently hidden.
4. **EOIs like yours (D3).** `cohortOutcomes` for the user's submission month.
   - Sentence: "Of the {range} {occupation} EOIs from {month}, as at {snapshot}: {invited} are invited and {lodged} have a visa application lodged." Closed is explained as "expired, withdrawn or finalised (finalised includes granted visas)". This replaces the mockup's "have been invited or have lodged", which would undercount older cohorts whose granted visas sit in "closed". The status is current status at the snapshot, not lifetime outcomes
   - Then four numbers, one bar, and a nearby-months table (two either side) that stays visible in print.
   - Totals that include a masked status are shown as a range.
   - "Closed" is always explained as "expired, withdrawn or finalised".
   - With no EOI date, show the latest complete month and say so.
   - Submission months outside the stored 36-month window show "Not available for EOIs this old" (step 1 ruling R8).
5. **What could change your position.** Links to the timeline (upcoming point changes) and the existing what-if scenarios, each with its point effect.

### 3. 190 and 491 detail panels

1. **Where you stand in the national {visa} pool**, at score + 5 (190) or + 15 (491). The same queue bar and numbers, with the note: "This is the national pool. States select by their own rules."
2. **Invitations recorded:** `invitationActivity` per month for the last 12 snapshots, labelled "at least N invited (as at {month})". Never summed across months.
3. **State outlook**, below.

### 4. State outlook (E2)

**Layout:**

- A 4 × 2 grid of tiles (2 × 4 at 390px), one per jurisdiction, with a separate small "Any state" tile.
- A 190 / 491 segmented control sits above the grid; it defaults to whichever visa panel the user came from.
- Each tile shows the state code, the group label, and one evidence fragment (e.g. "337 invited ≤85").
- Colour encodes the group, and every tile also carries the group label as text.

**Groups,** assigned by `stateOutlook(core, rules, profile, visa)`, a new pure function in `src/lib/data/state-outlook.ts`:

| Group                   | Rule                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Not open to you now** | A verified rule fails: the program is closed for this visa or cohort, the occupation isn't on the verified list for the user's cohort, or a residence or work requirement the user's answers fail. The panel names the failing rule. |
| **Needs your answers**  | No verified rule fails, but a verified rule needs a fact the user hasn't given. The tile shows the evidence anyway and says which question would decide it ("Answer 1 question"). Answering moves it to another group.               |
| **Not yet verified**    | No verified rule fails, but a needed rule is unverified (only [S]), "not confirmed", contradictory on official pages, or stale (see the rules data section). The tile still shows the published evidence.                            |
| **Strongest evidence**  | All needed rules are verified and pass, **and** `stateEvidence(...).peak.invitedAtLeast.min > 0` at or below the user's score within the latest 12 snapshots.                                                                        |
| **Worth watching**      | All needed rules are verified and pass, but evidence is weaker: masked only (`min = 0`), only above the user's score, or none in the window.                                                                                         |

Within each group, tiles are ordered by evidence `peak.min` descending, then by state code. "Any state" invitations never change a state's group.

**Detail panel (approved sketch):**

1. **Can you apply?** Each rule as ✓ / ✗ / ?, with its source link and "checked {date}". Unverified rules say "Not yet verified on the official page".
2. **What the data shows.** From `stateEvidence`:
   - competing EOIs at or above the user's score;
   - invitations at or below their score, per month, plus the peak;
   - the invited score range;
   - optionally one similar-profile line (`similarProfileInvited` for the user's English level), shown only when not masked.

   State-published evidence (WA last-invited points and date, ACT minimum Matrix score, TAS lowest score invited) appears as "past cut-off, not a prediction", with its source.

3. **Your points there.**
   - Federal points with nomination.
   - Where the state uses its own system, name it and link it ("Victoria ranks with its own points test, not calculated here").
   - Never call a state score "points" without naming the system.

The footer says: "Not advice to apply. Rules change; check the official page."

Every panel is fully expanded in print.

### 5. State rules data

- **New typed data:** `src/data/state-rules/2026-27/` (hand-curated TypeScript plus imported lists).
- **Each rule** carries:
  - `source` (URL);
  - `checkedAt` (YYYY-MM-DD);
  - `verification: "verified" | "secondary"`, where secondary means [S] and is never used to decide eligibility;
  - `note`.
- **Streams are modelled.** Each state × visa has its streams (e.g. WA General / Graduate; SA Graduates / Skilled Employment / Outer Regional / Offshore; QLD onshore / offshore / graduate; TAS TSE / TSG / TER). A user passes a state if **any** stream passes, and the panel names that stream. The user's cohort is one of: living in that state, living in another state, or offshore.
- **Federal layer:** each occupation's federal eligibility for 190 and 491 is imported from the official Home Affairs skilled occupation list, with its own importer, source and `checkedAt`. Federally ineligible means "Not open to you now" for every state. If the list can't be read, every tile for that occupation is "Not yet verified". The dashboard having EOIs for a visa is never used as a proxy for eligibility.
- **Program status** per state × visa × stream: `open | closed | restricted | unknown`, with the restriction described (e.g. SA onshore: visa expiry by 31 Jan 2027).
- **Occupation lists:** imported into a code → availability map per state × visa × cohort.
  - Where an official machine-readable or web list exists: WA CSV, QLD onshore and offshore web lists, SA web list, NSW unit-group list. An importer script per list lives in `scripts/state-lists/`, with fixtures and tests, following `docs/ENGINEERING.md`.
  - VIC: "all federally eligible occupations" [S], so it is "Not yet verified" until checked in a browser.
  - ACT, TAS, NT: "Not yet verified" until checked in a browser.
- **Residence and work rules:** structured fields the outlook can test against the user's answers:
  - `minMonthsLivingInState`;
  - `minMonthsWorkingInState`;
  - `offshoreAllowed`;
  - `requiresJobOffer`;
  - `visaExpiryBefore`.
- **Contradictions on official pages** (e.g. WA's ranking order, ACT's 3 vs 6 months) are stored as `verification: "secondary"` with both readings in `note`, which makes the tile "Not yet verified".
- A validation test fails if any rule lacks a source or `checkedAt`. Staleness is never a hard failure and never depends on the real clock in tests:
  - The build prints a warning listing rules whose `checkedAt` is more than 45 days before the build date.
  - At render time, a rule more than 60 days older than the report's `asOf` date is treated as unverified, so its tile becomes "Not yet verified" and its panel shows "Last checked {date}; may have changed".
  - Re-verifying the rules is a monthly routine alongside the data import.

### 6. Questions

- **Main check (unchanged):** step 1 already asks "In Australia (which state) or offshore". It feeds cohort and residence tests.
- **New optional step, "Sharpen my state outlook":** offered on the report under the state outlook and in every "Needs your answers" panel. All answers are optional:
  - months living in your current state;
  - months working in your nominated occupation in that state;
  - job offer in a state (which state);
  - your current visa's expiry date (already in the profile; reused);
  - annual income band (kept for the future VPT calculator, not used yet).
- New profile fields follow the existing rules: browser-only, opt-in save, clearable, never in the URL.

### 7. Copy rules (binding for all templates)

- `<20` → "under 20" and, in sentences, "so may be zero". Never "some" or "a few".
- Absent from a round table → "Not listed", never "0" or "no cut-off".
- INVITED snapshot counts → "at least N invited (as at {month})".
- CLOSED → "closed (expired, withdrawn or finalised)".
- Pools → "EOIs", never "people" or "applicants".
- Never write "should", "apply to", "best" or "likely to be invited".
- Every number sits next to its source or snapshot date, within the same section.

## Constraints

- Static export, Next 16 and webpack (`CLAUDE.md`). Follow `docs/ENGINEERING.md`:
  - Server Components where possible. Report sections that depend on the browser-only profile are client components.
  - The state rules and the user's occupation record load per occupation (step 1 loaders and hook).
  - Pure logic (`stateOutlook`, chip and headline selection, copy templates) lives in `src/lib/` with TDD.
- Text is at least 12px; body text at least 16px on mobile; WCAG 2.2 AA contrast. Group colours always have a text label.
- Reduced motion respected. Charts are hand-written SVG or CSS bars with text equivalents.
- Data honesty rules from `docs/STRATEGY.md` and the step 1 spec.
- `report.tsx` is over the size limit. Build the new sections as separate files under `src/components/report/` and extract the sections being replaced (boy scout rule). Don't rewrite unrelated sections.

## Approaches considered (implementation)

1. **Bolt onto `report.tsx`.** Fastest, but it grows a 1,000+ line client file and blocks reuse on occupation pages. Rejected.
2. **New section components with pure view-models (chosen).** Each section has:
   - a pure `build<Section>ViewModel(core, detail, profile, asOf)` in `src/lib/report/`, returning display-ready strings and intervals, unit-tested with fixtures;
   - a thin component that renders it.

   This keeps copy rules testable, and lets step 4 occupation pages render the same sections server-side for a default profile.

3. **Separate report page per visa.** Clearer URLs, but it breaks the single printable report. Rejected.

## Resolved after the builder check (Claude's calls, 17 Nov 2026)

1. **Two kinds of "Unknown".** "Needs your answers" means the user can resolve it now; "Not yet verified" means Landfall must verify the rule. Both tiles still show the published evidence, so the grid is never empty.
2. **The optional "Sharpen my state outlook" step collects every fact a verified rule needs.** On top of the list in section 6:
   - months living offshore;
   - years of skilled work in the last 3 and last 5 years;
   - whether you live in a regional area;
   - which state you studied in, and the qualification level.

   The main check is unchanged (option A).

3. **Streams are modelled per state.** A state passes if any stream passes.
4. **Federal eligibility** comes from an imported official list, never from inference.
5. **"EOIs like yours" wording** is updated to current-status language (section 2, item 4). The meaning of each status, as observed, is documented in `docs/DATA.md` from step 1. The section ships with that caveat.
6. **Rule staleness** is a warning at build time. At render time, a stale rule is treated as unverified. Tests use fixed dates.
7. **Skipped 189 rounds** (currently printed only by the import CLI) are added to the step 1 data (`src/data/rounds.json` gains `skipped`), so the rounds section can mention them.
8. **Dependency:** step 2 starts after step 1's Tasks 11–12 (loaders, client hook, `docs/DATA.md`) land.

## Left to the builder

- Exact component and file names, within the approach above.
- Tile and bar styling, within the existing design tokens and the mockups.
- How the 190 / 491 segmented control and panel expansion animate (respecting reduced motion).
- The importer details for each state list, within ENGINEERING.md.

## Founder decisions after the draft

1. **Unverified jurisdictions (17 Nov 2026):** ship with ACT, VIC, TAS and NT tiles showing "Not yet verified", with their published evidence still visible. The founder will come back later with how to verify them. Building this does not depend on that answer.
