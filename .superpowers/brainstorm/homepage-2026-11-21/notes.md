# Homepage directions (21 November 2026)

Four static mockups for the founder to choose from. Open `index.html`. Each `direction-*.html` is self-contained (inline CSS and JS, Google Fonts). Screenshots are in `screens/`: `-desktop` (1280, full page), `-phone` (390, full page, 2x), and `-fold` versions of each (first screen only).

All four share the same fixed content and the locked report's building blocks: the seven label colours, Archivo, the Big Shoulders Stencil ink stamps (same SVG generator and ink filter as `report-redesign-2026-11-21/report-e-final.html`), the cobalt route colour #2446D6 and ink #12202C. The logo is the ring with three bars, tallest bar saffron #D9822B (used as a mark only, never text).

## Figures used (real, SkillSelect snapshot 31 Oct 2026)

- Try-it, 189 only. Points 65 to 90, labelled by the report's rules (last 3 listed rounds; not listed in last 4 = Not currently invited).
  - Registered Nurses nec 254499: last 3 listed cut-offs 75, 75, 70 (Nov 25, Jun 26, Oct 26). 65 Long wait, 70 Competitive (107–126 EOIs higher, 1,841 tied), 75 Strong, 80 to 90 Very strong.
  - Software Engineer 261313: Not currently invited at every score (not listed in the last 4 rounds, since Nov 2024; last cut-offs 95 and 100).
  - Early Childhood (Pre-primary School) Teacher 241111: cut-offs 90, 85, 85. 65 to 80 Long wait (at 80: 2,444–2,463 EOIs higher), 85 Competitive, 90 Strong.
  - Counts appear only where we have them (nurse 70, teacher 80); other scores show the rule sentence instead, so nothing is invented.
- "What you get" uses the example report (Priya, nurse 70, offshore) exactly as in Option E: Competitive stamp; best route "189, with NSW 190 alongside"; wait "Possible in a round that goes down to 70, like October's"; Superior English +10 takes 70 Competitive to 80 Very strong; NSW 190 / WA 491 remarks; the nurse queue (about 40 EOIs a square); the route with "Turns 33: −5, 14 Mar 2027".
- No testimonials, user counts, ratings, press logos or percentages. Counts are always EOIs.

Each page passed: no horizontal scroll at 390 px, no visible text under 12 px (stamp and chart SVG text measured at rendered size), no script errors, try-it checked for all three occupations.

---

## A. Stamp desk

**Idea.** The homepage extends the report's ink-stamp language onto a desk. The hero is an open passport: the left page carries the three visa stamps (189 rectangle, 190 hexagon, 491 oval), the right page the big outlook stamp. The try-it is "Stamp a profile yourself": choose an occupation and points, and the stamp thumps down with the new label. Trust is framed as "Conditions of this report".

**Palette.** Desk #EEF2F0, paper #FFFFFF, ink #12202C, muted #52606B, rule #D8DFDB, guilloche line #C9D8CF, links/focus cobalt #2446D6, plus the label colours (Competitive #996000 on #FBEFD6 most visible).

**Type.** Archivo at width 118 to 122 for headlines (the report's wide setting), Archivo 400 for body, Big Shoulders Stencil 800/900 inside stamps only.

**Memorable element.** The try-it stamp landing (a 420 ms thump, off under reduced motion) on a guilloche passport page.

**Borrows from the report.** Stamp generator and ink filter, the guilloche background from the report hero, the three visa stamp shapes, the shift stamps (70 Competitive to 80 Very strong), the 4-page PDF.

**Risks.** Closest to the report, so the least new; passport skeuomorphism could feel like "visa granted" to some readers, which oversells (the stamp shows an outlook, not a visa). The numbered conditions list is a document convention, not a sequence. The hero spread is hidden down to one page on phones.

## B. Departures

**Idea.** The route to an invitation organises the page. The hero is a split-flap departures board for the example nurse: 189 / 190 NSW / 491 WA rows with points, a status lamp and a one-line remark. Below, a dotted cobalt route line runs down the page through three stops (Start here, Try a number, Your report). The try-it flips a single board row. "Your report" shows the report's route line and a boarding-pass card (stamp, best route, wait, improvement, with a tear-off stub listing the 4 PDF pages). Sources are a "timetable".

**Palette.** Paper #FFFFFF, wash #EEF2F0, board #132433, flap #1D3245 / #24394D, flap text #F2F5F7, board muted #A9B6C2, cobalt #2446D6 (primary button and route), ink #12202C; status lamps use the label tints with label text (for example #FBEFD6 / #996000).

**Type.** Archivo condensed (width 78, 650) uppercase on the flaps, Archivo wide 116 to 120 for headlines, Archivo body. Stencil only inside the stamp.

**Memorable element.** The split-flap board: letters settle left to right on load and whenever the try-it changes (no animation under reduced motion).

**Borrows from the report.** Option C's "Departures" idea that fed into E, the route line and vertical route timeline (phones) with the dated loss, the big stamp and shift stamps, label colours as lamps.

**Risks.** A dark board is the heaviest element on a white page and drifts from E's clean white; the travel metaphor may feel playful for a serious decision. Board rows restack on phones, so the "board" feeling is weaker there. The flap animation must stay short to avoid feeling gimmicky.

## C. The numbers

**Idea.** Data first, very quiet chrome. The hero answers in one plain sentence with the real numbers set large and light inside it ("A registered nurse at 70 points met the 189 cut-off in 2 of the last 6 rounds, and is tied with 1,841 other EOIs." then the Competitive chip), above the six real nurse cut-off columns with the "You, 70" line. A right-hand margin carries notes and sources (they drop under the text on phones). The try-it is "Move the line": tabs for occupation and a points slider that moves your line across the cut-offs, filling the columns you would have reached. "What you get" is an annotated specimen of the report's top. FAQ is all open, no accordions.

**Palette.** Paper #FFFFFF, ink #12202C, graphite #52606B, mist #E3E8E5, faint #F4F6F5, cobalt #2446D6 (links), label colours only for the verdict chip and your line.

**Type.** Archivo throughout: numerals at 300 weight, width 125 (light and very wide), headings 650 at width 108, body 400 at 18 px. Stencil only in the specimen stamp.

**Memorable element.** The light, extra-wide numerals inside sentences, and the slider moving your line across real columns.

**Borrows from the report.** The cut-off columns and "You" line, "Not listed" dashed columns, the stamp and shift stamps in the specimen, label chips.

**Risks.** The calmest and most text-like of the four; the founder's friends found the site text-heavy, and this leans on reading (short sentences, but sentences). Least "stampy", so the jump into the report's stamps is bigger. Charts are drawn at real width in JS so they stay legible, which the production build would need to replicate.

## D. Story

**Idea.** A bold, phone-first scroll story. Each chapter fills the screen with one idea, in giant stencil type on a flood of a label colour: cobalt hero ("Will my points get me invited?" with a fanned deck of three stamp cards), then "70 points. Competitive." (amber, nurse queue squares), "80 points. Long wait." (orange, teacher cut-off bars), "Not currently invited." (red, four "Not listed" rounds), then "Your turn." where the whole section floods with the colour of the label you get, "What you get", "+10 for English. Very strong." (green), trust on ink, FAQ, cobalt final call. Story progress segments sit at the top, and phones use gentle scroll snapping.

**Palette.** Cobalt #2446D6 and deep cobalt #1A34A8, ink #12202C, paper #FFFFFF, light grey #F2F4F3, and the label pairs as full-screen floods: #FBEFD6 / #996000, #FDE8DB / #BE3F0B, #FCE5E3 / #B42318, #D6EFE0 / #0F6B3C.

**Type.** Big Shoulders Stencil 900, uppercase, very large (60 to 136 px) for every headline; Archivo 400 to 700 for body.

**Memorable element.** The try-it colour flood: the section background and the giant verdict word change to your label's colour.

**Borrows from the report.** The stamp font and the label colours used as the page's colour system, so visitors learn the labels before they reach the report; stamps, queue squares and the shift stamps.

**Risks.** Longest page (lots of full-screen chapters, most empty space on desktop); stencil caps are hard to read in long headlines; the floods put the amber/orange/red pairs at full-screen size, which can feel alarming for the negative labels. Using cobalt as a big flood introduces a colour the report uses only for lines and links.
