# Rehearsal: homepage hero demo

Gold: `hero-demo`, filmed first (a still and a 16 s loop).

- Kept from the gold:
  - a hero window bled off the stage;
  - a stage about 720 wide beside the copy;
  - a cursor story of a few beats with named targets;
  - a `compact` redesign for the phone column.
- Changed: the content is MigrateLens's own check and report, in the Data Desk look, on the page's newsprint ground with no plate.
- Borrowed from `payout-flow`: values arriving in a stagger, and a payoff that holds.
- Ruling B9 sets the smallest design text at 15px, with the wide design used only from a 576px column (12 / 15 = 0.8). At that size the report and the check no longer fit one frame, so the story became one window with two views: the report and the check that builds it. They crossfade as a page swap: the body only, a 200 ms fade with an 8px rise.
- Compact uses the page itself instead of a desktop window, because a portrait desktop window fails the window-shape rule.

Beats:

1. The loop opens on the finished report, which is the poster.
2. The cursor presses "Start over", and the body swaps to the empty check.
3. "Try sample answers" fills the occupation and the six points fields, then "90 points".
4. "Open my overview" swaps back to the report, where the 189, 190 and 491 figures count in from zeros, side by side.
5. The 190 tiles light group by group, each group's status chip arriving with it.
6. The payoff holds and the cursor rests.

Loop: 13.2 s at 1440 and at 390, measured from the stage's marks.

Captured:

- Loops at 1440 (a 584px hero column, wide at 0.81), 768 (wide at 1:1), and 390, 375, 360 and 320 (compact at 1, 0.96, 0.92 and 0.80).
- `--states` at 1440 and 390.
- The check view at 600 ms intervals at both widths.
- Reduced motion: poster only, demo chunk never requested.
- Print emulation: poster shown, stage hidden.
- A long occupation ("Software and Applications Programmers nec") on the poster at 390 and 1440.
- The rendered size of every text node (computed font-size × stage scale) in the poster and the live stage at 320, 360, 375, 390, 768 and 1440. The smallest is 12.07px.
- Only the light look exists; the site has no dark theme.
- All of this ran against the built `out/` served on 127.0.0.1:3017 from a temporary page, removed before commit.

Gate: `rehearsal passed (necessary, not sufficient: references/verify.md and the fresh eye in review.md still stand)` on the loop at 1440, 768, 390, 375, 360 and 320, and on `--states` at 1440 and 390.

Film:

- `loose stack:` the outlook heading sat 11px above the tiles. The gap is now 8px at the new type size. Cleared.
- `framing: window shows 342x544, narrower than tall` (compact). Compact is now the page, not a desktop window. Cleared.
- `uneven gutters:` in compact:
  - The scorecard rows now run edge to edge with their rules, as a list on the page. Cleared.
  - The check's footer: the saffron rule over the total is now its own hairline, not the footer's border. Cleared.
- `spills its slot:` the compact legend chips wrapped. They now stack. Cleared.
- `tight control:` the two stacked compact buttons were 6.4px apart at 320. The gap is now 10px, which renders at 8px. Cleared.
- `touching:`
  - The en dash between two counters: there is now one `Count` per figure. Cleared.
  - "At your score" against its value in compact: they now have a 6px gap, clear of the figure's 4px rise as it arrives. Cleared.
- `lands on a transform` / `steps in its box`: arriving values, chips, buttons and the views now keep their compositing layers for good. Cleared.
- Stands:
  - `near-empty frames` around the Start over beat, while the empty check fills. That is the beat.
  - `appears with no entrance: span.ss-count`, with no timestamp. The count sheet at 80 ms shows each figure fading in with its roll; most likely this is the stage mounting over the identical poster.
  - `shrunk, not laid out for the phone: drawn at 0.80` at 320. Ruling B9 sizes the design so that 0.8 still renders 12px.
- `vanishes with no exit` on the poster: the poster now fades out under the identical stage frame.

Review: no fresh-eye review was run. The implementer contract forbids dispatching reviewers; the controller schedules review.

Assumptions: the payoff is the loop's start, so mounting the stage over the poster is seamless. A long occupation is clamped to two lines in compact.

Not checked:

- Safari and Firefox. The poster's CSS-only scale uses `tan(atan2())`; without it, the poster shows at 1:1 cropped to the column.
- A real touch device.
- A hidden tab and its return.
- Live pacing against rAF timestamps.
