# Task 8 report: homepage rebuild

Status: DONE_WITH_CONCERNS (minor; see Concerns)
Commit: 9dab50a feat(home): two-door homepage with demo, try-it and answers (base 9d70e15)

## Implemented

`/` is rebuilt in the spec's order. It is a Server Component: it calls `buildSampleView()` once and passes the result to `buildDemoContent` and to `ThreeQuestions`.

1. **Hero**
   - The h1 is the spec headline. Each sentence sits in its own block span with balanced wrapping, so the text content is unchanged.
   - Then the lede, then `Doors`.
   - Then the trust line: `trustLine(manifest.asAt)` gives "SkillSelect data, as at Oct 2026 · No percentages · Stays in your browser".
   - The demo uses `HeroDemoLoader`.
     - From 1100px it sits beside the copy in a `minmax(0,1fr) minmax(576px,1.1fr)` grid. The demo column measures 576px at 1100 and 595px at 1280 and 1440.
     - Below 1100px it sits under the doors and trust line, full width (poster max 720).
2. **TryIt** with `defaultOccupation={SAMPLE_COMPARISON}` (261313), centred, max 760px.
3. **ThreeQuestions** (`src/components/home/three-questions.tsx`). Each question has its text and a link on the left, and a real visual on the right with an "Example from the sample report: …" caption.
   - **Where do I stand?** `QueueBar` from `panels.whereYouStand.segments`, plus its sentence. Links to `/sample/#visa-189-stand`.
   - **What happened to EOIs like mine?** The new `OutcomeBar` (extracted from `EoisLikeYours` and reused there unchanged), with counts in the key, plus `eois.sentence`. Links to `/sample/#visa-189-eois`.
   - **Which states have evidence for me?** The 190 `StateTile`s. Each tile links to `/sample/#state-190-XX`, which opens that panel. The question links to `/sample/#state-outlook`.
   - If a view is missing, the build fails with a clear error, the same as `buildDemoContent`.
4. **Story**: an ink band (`--focus-ring: var(--focus-ring-on-dark)`) with the label "Why we built it", the approved title and the approved body, verbatim.
5. **Our rules**: four items and a link to `/methodology/`.
6. **FAQ**: seven questions in native `<details>` (`home-faq-list.tsx`). The answers are in the static HTML, and the existing print rule opens them.
   - I didn't reuse `faq.tsx`. It is a client Mantine Accordion, and its panels are forced open in print only inside `.report-sheet`.
7. **Final call to action**: a card with the heading, the body, the "Check my points, free" button to `/check/` and a link to the sample.

**Doors.** The whole card is clickable through a stretched `::after` on the action link. The link's accessible name is the action ("Check my points" / "Check where I stand"), with `aria-describedby` pointing to the door title. The spec's "→" is drawn as an `aria-hidden` icon, not text, so the copy stores the action without it. Both doors go to `/check/` with no URL difference. The focus ring is drawn on the card via `:has(:focus-visible)` (slate on newsprint).

**Carried items**
- **Header CTA at 390.** The full label now fits from 371px up:
  - ≤480px: the arrow icon is hidden;
  - ≤400px: the header gutter is 16px;
  - ≤369px: the CTA is hidden, and the burger drawer, which already holds a "Check my points" button, provides it.
  - Measured label scrollWidth equals clientWidth (97/97) at 375, 390 and 430. No aria changes.
- **Brand** moved to `src/components/brand/brand.tsx` (server-safe). The header and footer import it from there.
- **Deleted:** `home-experience.tsx`, `pool-explorer.tsx`, `pool-explorer.module.css` and `pool-chart.tsx`. Only `page.tsx` imported them (grep).
- **globals.css:** 248 selectors removed by a postcss script. The script dropped only selectors that referenced old homepage classes:
  - `.section`, `.quiet-link`, `.timeline-feature`, `.status-dot`;
  - `hero*`, `announcement`, `product-*`, `explorer*`, `chart-*`, `key-dot`, `pale`, `light`, `slider-row`, `preview-*`, `mini-*`, `big-number`, `trust-strip`, `section-heading`;
  - `pathway*`, `honest-*`, `value-*`, `feature-icon`, `visa-number`, `timeline-preview*`, `preview-event`, `event-date`, `timeline-node`, `timeline-pill`, `check-icon`, `cta-orbit`, `cta-note`, `hero-copy`.

  A comparison script confirmed that every remaining rule is byte-equivalent to the old one, apart from the `:root` additions. `.final-cta`, `.pill`, `.data-caption` and `.warning` are kept because `report.tsx` and `points-audit` still use them. 2,859 → about 1,670 lines.
- **New tokens:** `--muted-on-dark: #d6cfbf` (11.22:1 on ink; the footer's value) and `--saffron-on-dark: #f0a35e` (8.37:1 on ink; the primary door's tag and the story label).
- **Other ratios used:** slate on card 8.28, saffron-text on card 5.52 and on newsprint 5.06, muted-soft on newsprint 5.0.

**Small report-component changes**
- `StateTile.onOpen` is now optional, and there is a new optional `href`. Without `onOpen` the tile is a plain link with no handler, so it renders from a Server Component. The report passes `onOpen` as before.
- `OutcomeBar` was extracted with an optional `withCounts`, which is off in the report.

## Final copy (src/lib/home/home-copy.ts)

- **headline:** "Know your points. See where they'd put you."
- **lede:** "Count your points, check the points-test basics, then see the EOIs ahead of you and what happened to EOIs like yours. From official SkillSelect data, free."
- **doors:**
  - planning: tag "Not lodged an EOI yet" · title "Am I ready, and is it worth it?" · body "Your points, what could add more, and where an EOI at your score would sit today." · action "Check my points" (+ drawn arrow)
  - lodged: tag "Already lodged" · title "Where does my EOI stand?" · body "The EOIs ahead of you, the ones at your score, and what happened to EOIs lodged when yours was." · action "Check where I stand" (+ drawn arrow)
- **trustLine(asAt):** "SkillSelect data, as at {Mon YYYY}", "No percentages", "Stays in your browser"
- **questions.heading:** "Three questions the report answers"
- **questions.lede:** "Each answer comes from published SkillSelect data. These are from the sample report, so you can see what yours will look like."
  - **stand:** "Where do I stand?" / "The 189 EOIs for your occupation with a higher score than yours, at your score, and below it." / link "Open “Where you stand” in the sample report"
  - **outcomes:** "What happened to EOIs like mine?" / "EOIs submitted in the same month as yours: how many were invited, lodged a visa, are still waiting or closed." / link "Open “What happened to EOIs like yours”"
  - **states:** "Which states have evidence for me?" / "Each state's nomination rules read against your answers, grouped by the evidence each state has published." / link "Open the state outlook in the sample report"
- **sampleCaption:** "Example from the sample report: {occupation}, {visa} at {points} points."
- **story:** label "Why we built it" · title "65 points is the pass mark, not a promise." · body (verbatim, spec section 5) "Reach 65 points and you'll often hear the same answer: yes, you can apply, now pay the fees, sometimes lakhs of rupees. What you rarely hear is how many EOIs are ahead of you, or how long EOIs like yours have waited. We built MigrateLens so you can see that first, from official data, before you commit to anything."
- **rules:** "Our rules" · "Official data, with dates and sources." · "No percentages or invented numbers." · "Your answers stay in your browser." · "General information, not migration advice." · link "Read how we use the data" (→ /methodology/)
- **faqHeading:** "Common questions". The spec's "Questions people ask" fails `BANNED_COPY` because of the word "people".
- **finalCta:** heading "See your own numbers" · body "Four short steps. No account, and your answers stay in your browser." · action "Check my points, free" · link "Or read the sample report first"

## Final FAQ (src/components/home/home-faq.ts)

1. **How many EOIs are ahead of me?** "The check counts them for you: the published 189 EOIs for your occupation with a higher score than yours, and the ones at your score, from SkillSelect data. These are counts of EOIs, not your place in a queue: ties are broken by an unpublished date of effect, and one person can hold several EOIs." Link: "See an example in the sample report" (/sample/#visa-189-stand)
2. **Does state nomination add points?** "Yes. Under the Home Affairs points test, a 190 state nomination adds 5 points, and a 491 state nomination or family sponsorship adds 15. Each state also sets its own nomination criteria, which the report keeps separate from your federal points." Link: "Compare the states and territories" (/states/)
3. **How long do EOIs stay active?** "An EOI stays in SkillSelect for two years from the day it is submitted, according to Home Affairs. If no invitation comes in that time, the EOI expires and a new one has to be submitted." Link: "See the official sources" (/methodology/#sources)
4. **Is a masked “<20” zero?** "Not necessarily. SkillSelect publishes any count from 0 to 19 as “<20”, so the real number may be zero or as high as 19. We carry it as that range in every total and never turn it into a single number." Link: "How we read the pool" (/methodology/#pool)
5. **Does the check tell me if I can get a visa?** "No. It counts your points and checks the points-test basics: your age, your English and a valid skills assessment. A visa has more requirements than we can check, so treat the result as general information, not migration advice." Link: "What the check leaves out" (/methodology/#limitations)
6. **Where does the data come from?** "From SkillSelect: the EOI data and invitation round results that the Department of Home Affairs publishes. Every figure in a report shows the date its data is as at, and the method page lists each source." Link: "See every source" (/methodology/#sources)
7. **Are my answers saved or shared?** "Your answers stay in your browser: they are never sent to us and never put in a web address. If you choose to save them, they are kept on this device only, and you can clear them at any time." Link: "Read the privacy note" (/methodology/#privacy)

The FAQ quotes no snapshot counts. The only numbers are points-test rules (5 and 15, and a test pins them to `calculatePoints`) and the two-year EOI validity, both attributed to Home Affairs.

## Tests and TDD evidence

`src/lib/home/home-copy.test.ts` has 11 tests:
- exact spec strings (headline, lede, story, both doors);
- the trust line format;
- the sample caption;
- the final CTA;
- deny-list checks (`eligib`, `%`, `always`, Y-Axis, VisaEnvoy, Abhinav) and `BANNED_COPY`, unmodified, over every string in `HOME_COPY`, the FAQ, the trust line and the caption;
- 5–7 FAQ entries with unique ids;
- each answer has 2–3 sentences, ends its question with "?" and doesn't open with "It depends";
- the nomination answer matches `calculatePoints` (+5 / +15);
- FAQ links only go to /sample/, /states/ or /methodology/ with trailing slashes.

- **RED:** `npx vitest run src/lib/home/home-copy.test.ts` failed with `Error: Cannot find module '../../components/home/home-faq'` (Test Files 1 failed, no tests ran).
- **GREEN, first attempt:** 10 passed, 1 failed. The deny-list caught "eligible family sponsorship" in the nomination answer. I reworded it to "state nomination or family sponsorship" and all 11 passed.
- **Final:** `npm run check` passes (prettier, eslint 0 warnings, tsc, vitest: 71 files, 737 tests). `npm run build` passes, all routes static.

## Browser verification (Playwright + system Chrome against out/, python http.server 3017, stopped afterwards)

- **Overflow:** no horizontal overflow on `/` at 320, 360, 375, 390, 768, 1024, 1099, 1100, 1280 and 1440. No console errors.
- **Text size:** the smallest computed text in `main` outside the demo figure is 12px at every width. The demo's own floor was verified in Task 7.
- **Other pages:** /sample/, /check/, /states/ and /methodology/ at 1440, 390 and 320 have no page overflow and no console errors.
- **Reduced motion (1440):** no stage element, poster opacity 1, and no demo chunk requested.
  - With motion allowed, the only extra JS is `/_next/static/chunks/201.2c61fcd17b3b4081.js` (the demo chunk).
- **Motion allowed (1440):** the demo animates. Six samples 2.2s apart gave four distinct states: the report view with the cursor at different points, and the check view listing "Age 30 pts, English proficiency 20 pts …".
  - Frames: `screenshots/task8-demo-frame-0..5.png`.
- **Poster vs /sample/ (DOM read):** the numbers match.
  - Poster (no-JS HTML): 189 90 points 865–903 / 1,093; 190 95 points 882–920 / 1,293; 491 105 points 541–579 / 878.
  - /sample/ `#reality-check` cards: 189 90 points 865–903 / 1,093; 190 95 points 882–920 / 1,293; 491 105 points 541–579 / 878.
- **JavaScript disabled:** `out/index.html` contains both door titles, the poster numbers, the story title, the rules, the FAQ answers (spot-checked two) and "SkillSelect data, as at Oct 2026".
- **Print media:** all seven `main` sections, the poster and all seven FAQ answers are visible.
  - PDF: `screenshots/task8-home-print.pdf`, 7 A4 pages (the header and footer are hidden by the existing site-wide print rule).
- **Try-it (1440 and 390):**
  - Changing to Registered Nurse (Medical) changed the figures, and changing points to 70 changed them again ("0–38", "311").
  - The URL stayed `/`. Network: only `/data/occupations/261313.json` and then `254418.json`.
  - "Get the full report" href is `/check/?occupation=254418`. The /check/ page preselects "Registered Nurse (Medical) · 254418".
- **Link targets exist:** `/sample/#visa-189-stand`, `#visa-189-eois`, `#state-outlook`, `#state-190-ACT` and `#state-190-SA` (the SA panel opens on load). `/methodology/#sources`, `#pool`, `#limitations` and `#privacy`.
- **Screenshots** (`.superpowers/sdd/2026-11-18-migratelens-brand-and-homepage/screenshots/`):
  - `task8-home-desktop-top.png`, `task8-home-desktop-full.png`;
  - `task8-home-390.png` (full page), `task8-home-375.png`, `task8-home-320.png`;
  - `task8-try-it-1440.png`, `task8-try-it-390.png`;
  - `task8-home-print.pdf`;
  - `task8-demo-frame-0..5.png`.

## Files changed

- **Created:**
  - src/app/home.module.css
  - src/components/brand/brand.tsx
  - src/components/home/{doors.tsx, doors.module.css, three-questions.tsx, three-questions.module.css, home-faq.ts, home-faq-list.tsx, home-faq-list.module.css}
  - src/components/report/outcome-bar.tsx
  - src/lib/home/{home-copy.ts, home-copy.test.ts}
- **Modified:**
  - src/app/page.tsx (rewrite)
  - src/app/globals.css (old homepage rules removed, 2 tokens added, header-CTA phone rules)
  - src/components/report/{eois-like-yours.tsx, state-tile.tsx}
  - src/components/{site-header.tsx, site-footer.tsx}
- **Deleted:**
  - src/components/{home-experience.tsx, pool-explorer.tsx, pool-explorer.module.css, pool-chart.tsx}

## Self-review / deviations

- `HOME_COPY` lives in `src/lib/home/home-copy.ts`. The brief names only the test file; the copy is pure data, so it sits in lib. The FAQ data is at the brief's path, `src/components/home/home-faq.ts`; the lib test imports it.
- I added `home-faq-list.tsx`, the CSS modules and `outcome-bar.tsx` beyond the brief's file list, to keep one component per file and to reuse the report's own outcome bar.
- **Breakpoint:** the hero goes two-column at 1100px, not 1024. At 1024 the 576px demo would leave about 340px for the headline and doors. This follows the dispatch's "~1100".
- **Rules link text** is "Read how we use the data" (spec: "Links to /methodology/").
- **Action arrow:** the doors' action strings omit the spec's "→". The arrow is a decorative icon, so screen readers don't read "right arrow".
- `Reveal` and `AnimatedNumber` stay, because the report still uses them.

## Concerns (minor)

- **FAQ heading:** "Common questions" replaces the spec's "Questions people ask", which `BANNED_COPY` rejects for "people". The controller or founder may prefer other wording.
- **Header CTA below 370px:** the CTA is hidden at 320 and 360, and the burger drawer holds it. A shorter label was the alternative.
- **Dead classes left in globals.css:** `.button-small`, `.button-outline`, `.page-panel`, `.two-columns` and `.main-nav.is-open` have no users. They are not homepage classes, so I left them for a later sweep.
- **Docs not updated** (STRATEGY decision log, HANDOFF, REPORT-COVERAGE). I assumed that is Task 9's docs step; say if this task should do it.
- **Not checked:** Safari and Firefox. The poster's `tan(atan2())` caveat from Task 7 still applies.
