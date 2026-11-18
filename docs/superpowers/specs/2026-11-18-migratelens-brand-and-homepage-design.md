# MigrateLens brand and homepage — design

Date: 18 Nov 2026 · Branch: `brand/migratelens` · Status: approved by the founder, 18 Nov 2026

## Intent

The founder chose the brand name **MigrateLens** (decision log, `docs/STRATEGY.md`). Before roadmap step 4 (SEO and occupation pages), the whole site gets a real identity, and the homepage is rebuilt. Occupation pages will launch under this brand, so they shouldn't be built on a placeholder look.

The goal is a site that feels **modern, premium and trustworthy** to a skilled-migration hopeful, often in India and often already let down by a paid agency report. The site should read like an **independent data newsroom, not a visa agency**: calm, editorial, numbers first, sources visible.

## Goals

- **A brand system:** logo, colours, type and status colours, applied site-wide (header, footer, homepage, check flow, report, sample, states, methodology, 404, favicon, social image).
- **A homepage that speaks to two audiences.** Planners (no EOI yet) and people already waiting both see themselves within five seconds and reach the same free check.
- **Show the product, not adjectives.** An animated product demo sits in the hero. A live "try it" with real published data comes directly below it.
- **Answer-first copy and FAQ** that can rank and be quoted by AI answers (AEO/GEO), within the product rules.
- **Fold in the overlapping roadmap step 5 polish:**
  - Readable type everywhere: no text under 12px, and body text at least 16px on mobile.
  - Retire the hard-to-read Instrument Serif.
  - Drop the "Short line. _Italic line._" pattern and the "01 / CONNECT THE DOTS" eyebrows.

## Non-goals

- Occupation pages, sitemap, JSON-LD and the content engine. These are step 4 and later.
- The domain and launch: `robots` stays `noindex` until the founder buys the domain and asks to launch.
- Payments, accounts and email.
- Changing report logic or data. This project is presentation only, plus homepage data reads.

## Anti-goals (a failure even if it "works")

- **Looking like a government site or a migration agency.** That means no crest-like marks and no navy-and-gold "official" look. Copy never offers to "help with your visa".
- **Promising "eligibility".** We check the points-test basics only (age, English, skills assessment). Say "check the points-test basics", never "check your eligibility".
- **Invented or decorative numbers.** No percentages, testimonials, user counts or fake "live" activity. Every number on the page comes from the published data or is clearly labelled as an example. The animated demo uses the real sample report's numbers.
- **Brand colour colliding with meaning.** Saffron must never be confused with a report status.
- **Motion that ignores reduced motion,** or that hides content from print or screen readers.

## Constraints (binding)

- **Product rules:** everything in `CLAUDE.md` "Product constraints" and `docs/STRATEGY.md` "Product rules".
  - Counts, not people.
  - A masked "<20" may be zero.
  - Profile data never goes in the URL; the only query parameter allowed is `?occupation=`.
  - Every section prints.
  - Every animation respects reduced motion.
- **Engineering:** `docs/ENGINEERING.md`.
  - Tokens in `globals.css`.
  - CSS modules for new components.
  - Files of 250 lines or fewer.
  - AA contrast.
  - `npm run check` and `npm run build` pass.
  - Browser verification against `out/`.
- **Static export:** no server features. Client components may only load data as `CLAUDE.md` "Loading data" allows (the occupation index, plus one occupation at a time through `useOccupationCore`).
- **Stageshow:** the kit is copied into the project per the skill (`.agents/skills/stageshow`, kit in `kit/`). It needs `lucide-react` (already a dependency) and React (the project is on React 19; the kit targets React 18, so the builder confirms it works). The demo must pass the skill's rehearsal gate (`scripts/film.mjs --gate`).
- **Fonts:** self-hosted through `@fontsource`, as now (no Google Fonts requests). Newsreader and Inter replace DM Sans and Instrument Serif.

## Approaches considered (decided with the founder in mockups)

The mockups are in `.superpowers/brainstorm/60615-1795008019/content/`.

### Brand direction

1. **A · Eucalypt & Gold:** calm green and gold, an evolution of today's look.
2. **B · Deep Field:** navy and cobalt, tech-precise. Risk: it reads close to a government look.
3. **C · Data Desk:** newsprint, ink and saffron, an editorial data newsroom.

**Founder picked C.** It sends the strongest "independent, not selling you a visa" signal, and saffron is a warm nod to Indian users.

### Logo

1. **C1 · Rising bars:** a lens ring holding three rising bars; the tallest is saffron.
2. **C2 · Your line:** score bars with a saffron "your score" line.
3. **C3 · Wordmark with a focus dot.**

**Founder picked C1:** literal, friendly, and it reads at favicon size.

### Hero

1. **A:** a Stageshow animated demo.
2. **B:** a live try-it with real data.
3. **C:** both, with the demo in the hero and the live try-it as the next section.

**Founder confirmed the combined approach (C).**

### Positioning

1. **P1 · Two doors:** "Not lodged an EOI yet" and "Already lodged", both leading to the same check.
2. **P2:** one headline with one button.
3. **P3:** lead with honesty.

**Founder picked P1.** The founder raised this one: planners who haven't lodged an EOI are a large audience, and "where your EOI stands" alone shut them out.

## The design

### Brand system

**Logo (C1).**

- **The mark:** a 48-unit viewBox. A ring at r=18 with a 3.5 stroke holds three bars, all bottom-aligned at y=33:
  - x=15, height 8 (ink)
  - x=21.75, height 13 (ink)
  - x=28.5, height 18 (saffron)
- **Favicon variant:** simplified, with a 5 stroke and square bars (exact SVG in the mockup `data-desk-logo.html`, C1).
- **Wordmark:** "MigrateLens" in Newsreader 600. The lockup puts the mark left of the wordmark with a gap of about a third of the mark's width.
- **Versions:** on newsprint (ink and saffron), reversed on ink (newsprint and saffron), and as an app icon on an ink square.
- **Files:** the components live in `src/components/brand/`, exporting `LogoMark`, `Logo` (the lockup) and `logo.svg` sources. `src/app/icon.svg` is replaced.

**Colours.** These are tokens in `globals.css`, replacing the forest palette. Token names are the builder's call.

| Role         | Value                       | Use                                                                    |
| ------------ | --------------------------- | ---------------------------------------------------------------------- |
| Ink          | `#1B1A17`                   | Text, primary buttons, dark sections                                   |
| Newsprint    | `#F3EEE3`                   | Page background                                                        |
| Card         | `#FBF8F2`                   | Cards and panels                                                       |
| Saffron      | `#D9731A`                   | **Marks, lines and highlights only, never text** (it fails AA as text) |
| Saffron text | `#A04E0C`                   | Saffron-coloured text (AA on newsprint and card)                       |
| Slate        | `#2E4A7D`                   | Links and secondary actions                                            |
| Muted        | about `#4A463E` / `#6B6558` | Secondary text. The builder confirms AA on both backgrounds.           |
| Rule         | about `#DDD4C2`             | Borders and dividers                                                   |

**Report status colours.** These replace the current ones, and each keeps its label text.

| Status              | Colours                      | Notes                                  |
| ------------------- | ---------------------------- | -------------------------------------- |
| Strongest evidence  | green `#1F5136` on `#DDEBDF` |                                        |
| Worth watching      | slate `#2E4A7D` on `#E4E9F2` | Was amber. It moves away from saffron. |
| Needs your answers  | muted on `#ECE7DC`           | Dashed border                          |
| Not yet verified    | muted on `#ECE7DC`           |                                        |
| Not open to you now | brick `#8A2E22` on `#F5DEDA` |                                        |

- **The "?" lines** (restrictions and unconfirmed rules) keep a warm, prominent tint, but distinct from brand saffron. The builder picks it and checks AA.
- **Every pairing is checked against AA** and the ratios are recorded in the report.

**Type.**

- **Newsreader (600)** for headlines and big numbers.
- **Inter (400/500/600)** for everything else.
- **Numbers** use `font-variant-numeric: tabular-nums`.
- **Minimum sizes:** no text under 12px, body text 16px or more on mobile (this fixes the about 125 tiny declarations in roadmap step 5).
- DM Sans and Instrument Serif are removed.

**Tone of copy.**

- Plain, specific and calm. The newsroom voice gives the number, the date and the source.
- No poetic fragments and no "Short line. _Italic line._" pairs.
- Report copy rules (`src/lib/report/copy.ts`, `BANNED_COPY`) apply to homepage copy too.

### Homepage (`/`), in order

**1. Header (site-wide).**

- Logo lockup.
- Navigation: "Sample report", "States", "Method", and a primary "Check my points" button.
- "Occupations" appears only once step 4 ships. Don't link to pages that don't exist.

**2. Hero.**

- **Headline:** "Know your points. See where they'd put you."
- **Lede:** "Count your points, check the points-test basics, then see the EOIs ahead of you and what happened to EOIs like yours. From official SkillSelect data, free."
- **Two doors** (cards, both linking to `/check/`):
  - **Primary, ink.** Tag "Not lodged an EOI yet". Title "Am I ready, and is it worth it?" Body: "Your points, what could add more, and where an EOI at your score would sit today." Action "Check my points →".
  - **Secondary.** Tag "Already lodged". Title "Where does my EOI stand?" Body: "The EOIs ahead of you, the ones at your score, and what happened to EOIs lodged when yours was." Action "Check where I stand →".
  - Both doors lead to the same flow, with no URL difference. The check already treats the EOI date as optional.
- **Trust line:** "SkillSelect data, as at {Mon YYYY}" (read from the manifest, never hard-coded), "No percentages", "Stays in your browser".
- **Beside the headline (wide screens) or below the doors (mobile): the Stageshow demo.**
  - **Beat 1:** a cursor fills a short profile, the sample report's own (`sampleProfile`: ICT Business Analyst 261111), then its points.
  - **Beat 2:** the scorecard counts in the sample's "EOIs ahead of you" and "at your score" figures, with 189, 190 and 491 side by side.
  - **Beat 3:** the state tiles light up in their groups.
  - **Beat 4:** the payoff holds.
  - **Length and loop:** about 12–16 seconds, looping.
  - **The numbers are the real sample report's** (`sampleProfile`, the sample's pinned `asOf` of 2026-11-17). _Controller's call:_ a Server Component builds the sample report view with the same functions `/sample/` uses and passes the demo only the strings it shows (occupation name, points, the scorecard figures, the state tile groups) as props. A new snapshot then updates the demo automatically, and it can never disagree with the sample.
  - **Stageshow is the default** (the founder asked for it). _Controller's call:_
    - The kit is copied into `src/components/stageshow-kit/` (or similar), and the builder adapts it minimally for React 19 if needed.
    - The demo loads client-side only (`next/dynamic` with `ssr: false`), with the poster as server-rendered static markup, so it never delays the hero.
    - The demo's gzipped JS stays at about 40 KB or less (report the measurement).
    - If the kit can't be made to work, or the rehearsal gate can't pass in reasonable effort, ship the poster frame only, record why in the report, and bring it back to the controller. Never ship a demo that fails the gate.
  - **Poster frame:** the scorecard and tiles together. It's shown under reduced motion and in print.
  - **It's an illustration with `aria-hidden` content** and a one-line visually hidden description, and it never traps focus.

**3. Try it with your occupation (live, real data).**

- **Inputs:** an occupation picker (from `occupation-index.json`) and a points selector. _Controller's call:_ a **bare total** (65 to 140 in steps of 5, default 85), not a profile, so there is no `calculatePoints` here. The 189 figures come from the existing pure functions (`comparePool` / the pool view-models for "higher" and "same" intervals, and the round status from the core record's `rounds189`), through a thin, tested, total-only view-model in `src/lib/home/` if one is needed. No EOI date is involved: the try-it says "EOIs with a higher score" and "at your score", and never "ahead of you in the queue".
- **Output for 189:** EOIs with a higher score (as an interval), EOIs at your score, and the latest 189 round status ("Not listed" ≠ zero). It reuses the report's view-models and copy (`src/lib/report/`), not new wording.
- **Loading:** fetches one occupation through `useOccupationCore`. While loading it shows "Loading published data…".
- **"Get the full report" links** to `/check/?occupation=<code>`. That's the only query parameter allowed: the points never go in the URL.
- **Replaces** the fixed-occupation `HomeExperience` / `PoolExplorer` on the homepage. Remove them if nothing else uses them.

**4. Three questions the report answers.**

- "Where do I stand?"
- "What happened to EOIs like mine?"
- "Which states have evidence for me?"
- Each has a small real visual from the sample report (the queue bar, the outcome bar, the state tiles), rendered with the report's own components or view-models, and links to that section of `/sample/`.

**5. Why we built it.** The founder's idea, tweaked by Claude; wording approved by the founder:

- **Title:** "65 points is the pass mark, not a promise."
- **Body:** "Reach 65 points and you'll often hear the same answer: yes, you can apply, now pay the fees, sometimes lakhs of rupees. What you rarely hear is how many EOIs are ahead of you, or how long EOIs like yours have waited. We built MigrateLens so you can see that first, from official data, before you commit to anything."
- **Rules for this copy:** no agency is named; "often", never "always"; never "before you spend a rupee", because the full report will be paid later. The lawyer review checks it before launch.

**6. Our rules.**

- Official data, with dates and sources.
- No percentages or invented numbers.
- Your answers stay in your browser.
- General information, not migration advice.
- Links to `/methodology/`.

**7. Questions people ask (FAQ).**

- **5–7 questions**, each answered first in 2–3 sentences with a date and source where a number appears. Examples: "How many EOIs are ahead of me?", "Does state nomination add points?", "How long do EOIs stay active?", "Is a masked '<20' zero?".
- **Uses the existing `faq.tsx`** if it fits.
- **Content stays visible when printed** and to crawlers: no answers hidden behind JavaScript-only toggles. `<details>` is fine.

**8. Final call to action and footer (site-wide).**

- Repeats "Check my points, free".
- **The footer carries the disclaimer:** "MigrateLens gives general information from published data. We are not registered migration agents and don't give migration advice." Plus links (method, sample, states), the data as-at date and the brand.

**The two doors** change nothing in `/check/`: no URL difference and no copy difference (controller's call; the URL rule allows nothing else, and the form already treats the EOI date as optional).

**Removed from the homepage:**

- the "announcement" pill;
- "A big decision. A clearer way forward.";
- the "01 / 02 / 03" eyebrow sections;
- the pathways rows and the generic icon cards.

### Site-wide rollout

- **Rename "Landfall" to "MigrateLens" in user-facing text:**
  - layout metadata (title default and template, description);
  - `site-header`, `site-footer`, `not-found`;
  - methodology;
  - the `report.tsx` disclaimer line.
- **Code comments:** rename where they refer to the product (e.g. the state-rules comments). The repository and package name stay.
- **Social image:** `metadataBase` stays the preview URL until the domain exists. Add a static OG image (1200×630): ink background, logo, the headline. _Controller's call:_ a committed PNG rendered once from an HTML/SVG template with the self-hosted fonts by a small script (headless Chrome, as the project's browser checks already use). Commit the script so it can be re-run. The favicon is `src/app/icon.svg`, the C1 favicon variant.
- **Restyle** the report, check flow, sample, states and methodology through tokens. Nothing changes structurally beyond the status colours, fonts and minimum sizes. _Controller's call on scope:_
  - The minimum-size sweep covers `globals.css` and every CSS module.
  - Small local layout adjustments (padding, wrapping, a column becoming two rows at 390px) are allowed where larger type would otherwise overflow.
  - Re-designing report sections is not allowed. If a section can't hold 12px+ text without a redesign, record it and leave it for the controller.
  - Status tones stay as they are in the view-models (`Tone`, group ids). Only the CSS colour mapping changes, so no report logic or test changes are expected beyond class or snapshot updates.
- **Unused code goes too:** remove the old homepage components and their CSS (`HomeExperience`, `PoolExplorer`, `pool-chart` if unused elsewhere). The 404 keeps the site header and footer through the layout.
- **Docs:**
  - `docs/STRATEGY.md`: a decision-log row for the brand system and positioning.
  - `CLAUDE.md` and `AGENTS.md`: the product name, the "Mantine theme (forest palette)" line, and the fonts.
  - `docs/HANDOFF.md`.
  - `.superpowers/brainstorm/60615-1795008019/decisions.md`.

## Left to the builder

- Spacing, the exact layout grid and breakpoints.
- The demo's exact beats and timing, within the story above and the Stageshow rules.
- FAQ wording, within the copy rules.
- Token names, the "?" line tint and the muted greys, as long as AA holds.
- Whether the demo reads the sample's numbers at build time or keeps them as constants checked by a test against the sample view.
- The Mantine theme mapping: the `forest` palette is replaced by a brand palette built from the new tokens.

## Verification

- **`npm run check` and `npm run build` pass.**
- **The Stageshow rehearsal gate passes** for the demo at 1440 and 390 widths.
- **Headless browser checks against `out/`:**
  - Pages: home, `/check/`, `/sample/`, `/states/`, `/methodology/` and the 404, at 1440 and 390.
  - No horizontal overflow.
  - Reduced motion shows the poster.
  - Print keeps every section.
  - The try-it fetches one occupation and never writes points to the URL.
  - Every status chip and text pairing passes AA (ratios listed).
  - No "Landfall" left in rendered pages.
  - No console errors.
- **Screenshots for the founder:** home desktop and mobile, a report section, the state outlook in the new colours.
