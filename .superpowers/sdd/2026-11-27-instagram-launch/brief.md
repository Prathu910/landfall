# Instagram launch pack: builder brief

**Context:**
- The founder (27 Nov 2026) approved the launch pack for the new, still-empty `@migratelens` Instagram account.
- They will post the **light** cards by hand. Build dark too where it costs nothing, but light is what they post.
- The first spotlights are **NSW** (state) and **Registered Nurses nec, 254499** (occupation).
- Goal: grow traffic to the site through a credible, data-first Instagram page.

**Branch:**
- Work on `social/launch-pack`, cut from `origin/staging` at 76a6a77. Its upstream is unset.
- Commit there in small conventional commits ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never push or merge. Never touch live services.

**Read first:**
- CLAUDE.md: "Product constraints", "Brand" and "Instagram cards".
- docs/STRATEGY.md: the 24 Nov 2026 monthly-updates rows (Look A, carousels first, no automatic posting, `@migratelens`, captions end with a few hashtags).
- docs/ENGINEERING.md.
- scripts/README.md, the "Instagram cards" section.
- All of `scripts/social/`: templates, render.ts, jobs.ts, browser-checks.ts, compress.ts, tokens.ts.
- `public/social/2026-10/*/set.json`, to see the existing captions and alt text.
- Look at a few existing light PNGs in `public/social/2026-10/` so the new cards match them exactly.

## Deliverable

### 1. New card templates (committed code) in `scripts/social/templates/`

All new templates follow these rules:
- Look A, "Passport page", 1080×1350 feed; the stories are 1080×1920.
- Tokens only, from `src/lib/brand/palette*.ts`.
- The same faces (Archivo, and the stencil for stamps).
- They pass the same `browser-checks.ts` checks: no overflow, the grid-crop safe area on covers, the story safe band.
- Same limits: at most 300 KB per image and 2.5 MB per set.

Every figure is read from the site's own data and modules, never typed in by hand. Build the view-models as pure functions with unit tests, next to the existing ones or in a new `src/lib/social/` module (relative imports).

### 2. The 9 feed posts (carousels). Posts 1, 4 and 7 will be pinned.

1. **Welcome.** 4 slides:
   - Slide 1 hook: "Your points vs real SkillSelect data".
   - Slide 2: what the free check gives you: points, plus three visa stamps for the 189, 190 and 491.
   - Slide 3: where the data comes from: Home Affairs SkillSelect, updated after every round. "General information, not migration advice."
   - Slide 4: the closing card, "Check yours free · migratelens.com".
   - Wording comes from `src/lib/about/copy.ts` and the homepage.
   - No prices, user counts, testimonials or "Founding 100" (that count changes).
2. **October 189 round.** Reuse the existing light PNGs in `public/social/2026-10/round-2026-10-15/`. Copy them into the pack; don't re-render.
3. **October update.** Reuse `public/social/2026-10/month/*-light.png`, plus that round's card 2, the way the month set does.
4. **The points table.** Built from `src/data/guide/points-table.ts`, with its `source` and `checkedAt` shown:
   - a cover;
   - one slide for each group: age; English; skilled work (overseas and Australian); qualifications and Australian study, including the specialist and regional study points; partner; other points (professional year, community language, and so on); nomination and sponsorship (+5 for 190, +15 for 491);
   - "Where do you land? Check free";
   - a closing card.
5. **189 vs 190 vs 491.** From `src/data/guide/visas.ts`, `src/lib/guide/compare.ts` and the guide meta:
   - a cover;
   - one slide per visa: who nominates or sponsors, permanent or provisional, and the 191 pathway for the 491;
   - a side-by-side slide;
   - a closing card.
6. **"What does '<20' mean?"**, the jargon buster. From `src/lib/guide/glossary.ts`:
   - a cover;
   - one term per slide: EOI, invitation, nomination, "<20" (0 to 19, may be zero), cut-off (lowest score invited), tie-break date;
   - a closing card.
7. **"Is 65 points enough?"** From the latest round's recap facts (`loadLatestRound` / `src/lib/updates/latest-round.ts`, the recap facts for 2026-10):
   - a cover;
   - the number of occupations invited at each lowest score in the 15 Oct 2026 round;
   - the plain reading: 65 is the pass mark, not a promise; cut-offs differ by occupation;
   - "Check your occupation's cut-offs" pointing to migratelens.com/occupations/189-cut-offs/;
   - a closing card.
   - Wording follows the "Is 65 points enough?" FAQ answer that is already on the site.
8. **State spotlight: NSW.** From the state page view-model (`loadStatePageView("NSW")`, `src/lib/state-page/`):
   - a cover;
   - 12 months of EOIs holding an NSW 190 invitation and an NSW 491 invitation at each month-end. This is a stock: never call it "invitations issued", and keep "<20" as ranges and "at least N";
   - the points of those EOIs in the data month;
   - the top occupations;
   - the 2026–27 rules in brief, only where verified;
   - "See every figure · migratelens.com/states/new-south-wales/";
   - a closing card.
   - Ruling R3 of the SEO audit applies word for word.
9. **Occupation spotlight: Registered Nurses nec (254499).** From its core, detail and the occupation-page modules (`src/lib/occupation-page/answer.ts`, `faq.ts`, `summary.ts`):
   - a cover;
   - the latest listed 189 round and its cut-off, dated by that round;
   - the 189 pool by points;
   - the states that list it, for 190 and 491;
   - the 190 and 491 pools;
   - the page link (its slug);
   - a closing card.
   - Look at `templates/spotlight-card.tsx` and reuse it where it fits.

Make the state and occupation spotlights parameterised by state code and occupation code, so later months can render any of them.

### 3. Stories (1080×1920, light)

- **Poll frame:** "What's your points score?", with an empty space at the right place for Instagram's poll sticker.
- **Quiz frame:** "What does '<20' mean in SkillSelect?", with space for the quiz sticker.
- **Link frame:** "Check your points free", with space for the link sticker.
- **"New post" frame:** a generic frame the founder can use to share any feed post.

Mark sticker spaces with a subtle dashed box only on an `--guides` render, never in the final PNG.

### 4. Profile kit

- **Profile picture:** 1080×1080. The logo mark centred on paper, safe inside Instagram's circular crop.
- **4 highlight covers:** 1080×1920, with the icon centred in the middle circle: Rounds, Points, States, How it works.
- **Name field and bio:** 3 options in `profile.md`. Keep the name at 30 characters or fewer. The bio must be 150 characters or fewer and end with "General information, not migration advice." or keep it short enough to include that.

### 5. Captions and calendar

- **Captions:** one JSON per post, like `set.json`, plus a `captions.md`. For every post:
  - a first-line hook;
  - a 2–4 sentence body;
  - one call to action ("Comment your occupation and we'll reply with its latest data", "Save this for your EOI");
  - 5–8 relevant hashtags (e.g. #AustraliaPR #SkillSelect #189visa #190visa #491visa #AustralianImmigration #PointsTest #EOI), mixing broad and niche, with no banned or spammy tags;
  - alt text for every slide.
- Caption copy obeys the same rules as the cards.
- **Calendar:** `calendar.md`, a 10-day plan.
  - Post 1 first.
  - Then roughly one feed post a day, at 7–9 pm India time, with the reason for each slot.
  - Stories for each day.
  - When to pin posts 1, 4 and 7.
  - A short reply guide for "comment your occupation": reply with the occupation's dated latest figures and its page link.
  - Never promise an outcome, and never give personal advice.

### 6. Output and the preview page

- **Command:** a new set kind, e.g. `npm run social:render -- --set launch --out <dir>`.
- **Output directory:** `/Users/aveomac/aveo-projects/landfall/.superpowers/social/launch-2026-11/`. It is local and not committed: no launch images go into `public/`.
- **Folder layout:** one subfolder per post (`01-welcome/`, `02-round-oct/`, …), each holding its PNGs in posting order, named `01.png`, `02.png`, …. Plus `stories/`, `profile/`, `captions.md`, `calendar.md`, `profile.md` and `preview.html`.
- **`preview.html`:** self-contained, with relative image paths. It shows:
  - the profile header as it will look (picture, name, bio, highlights);
  - the 3-column grid with posts 1, 4 and 7 pinned first;
  - each carousel swipeable or scrollable;
  - each caption with a copy button.

  Light theme. It must work at phone width.

## Rules

Hard rules, from CLAUDE.md:
- No invented data, no percentage chances, no testimonials and no user counts.
- Counts are EOIs, not people.
- "<20" is a 0–19 range and is never summed as 0.
- A null cut-off means "not listed".
- State counts are EOIs holding an invitation at month-end.
- Every figure is dated.
- `BANNED_COPY` (`src/lib/report/copy.ts`) applies to every card and caption. Add a test that sweeps all launch copy and captions with it, as the recap copy sweep does.
- No price literals anywhere in the pack.
- Text is at least 12 px at 1080 width; aim for 24 px or more for body text on feed cards, so it reads on a phone.

## Definition of done

- `npm run check` passes, and `npm run build` still passes.
- The launch set renders with every browser check passing and within the size limits.
- You have looked at every light PNG yourself and fixed anything cramped, overflowing or unreadable at phone size. Keep a contact sheet, `contact.png`, in the output folder.
- Update scripts/README.md (the new set kind and its options) and the "Instagram cards" paragraph in CLAUDE.md.
- Write `.superpowers/sdd/2026-11-27-instagram-launch/report.md` with:
  - the commits;
  - what was built;
  - the command output;
  - where each figure comes from;
  - any concerns.

  Return the same text.
- Kill any Chrome or server you start.
