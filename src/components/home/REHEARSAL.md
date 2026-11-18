# Rehearsal: homepage hero demo

Gold: `hero-demo` (filmed first; still and 16 s loop). Kept: a hero window pinned
one gutter from the top-left and bled off the right and bottom, the stage at
about 720 wide beside copy, a cursor story of a few beats with named targets,
and a `compact` redesign for the phone column. Changed: the content is
MigrateLens's own report (the check's points, the scorecard, the 190 state
tiles) in the Data Desk look on the page's newsprint ground, with no plate. The
compact design drops the desktop window for the page itself (a portrait
desktop window fails the window-shape rule) and lets the total stand for the
points lines. Borrowed from `payout-flow`: values arriving in a stagger, the
payoff that holds.

Beats: 1 the loop opens on the finished report (the poster) → cursor presses
"Start over", everything the story added leaves in one reverse stagger → 2 the
same button now reads "Try sample answers"; pressed, the occupation and points
lines fill, then "90 points" → 3 the scorecard's three figures count in from
zeros (189, 190, 491 side by side) → 4 the 190 tiles light group by group, each
group's status chip arriving with it → payoff holds, cursor rests. Loop 12.1 s
(1440) and 12.3 s (390), measured from the stage's marks.

Captured: widths 1440 (wide, 720 at 1:1), 390 (compact, 358 at 1:1) and a 566 px
column (wide at 0.78); light look only (the site has no dark theme); `--states`
at both widths; the count and reset beats at 80 ms; reduced motion (poster
only, demo chunk never requested); print emulation (poster shown, stage hidden).
Built `out/` served on 127.0.0.1:3017 from a temporary page, removed before commit.

Gate: `rehearsal passed (necessary, not sufficient: references/verify.md and the fresh eye in review.md still stand)`
on the wide loop, the 390 loop, `--states` at 1440 and 390, and the 566 px column.

Film:

- `loose stack:` outlook heading 11 px above the tiles → gap 8 → 4 px; cleared.
- `framing: window shows 342x544, narrower than tall` (compact) → compact is
  now the page, not a desktop window; cleared.
- `uneven gutters:` compact scorecard rows → rows run edge to edge with their
  rules, as a list on the page; cleared.
- `touching:` en dash between two counters → one `Count` per figure; cleared.
- `lands on a transform` / `steps in its box` → lasting layers on arriving
  values, chips and the button; cleared.
- `appears, then moves` on count strips → figures fade over 0.9 s with the
  roll; cleared at 390, the 80 ms count sheet shows the fade with the roll.
- Stands: `near-empty frames` around the "Start over" beat (about 3.5 s until
  the scorecard is back): that is the beat, the cleared check before the sample
  answers fill it. `appears with no entrance: span.ss-count` once per 1440 run,
  with no timestamp; the 80 ms count and reset sheets show no pop, so it is
  most likely the stage mounting over the identical poster.
- `vanishes with no exit` on the poster: the poster now fades out under the
  identical stage frame instead of switching off.

Review: no fresh-eye review run (the implementer contract forbids dispatching
reviewers; the controller schedules review).

Assumptions: "Start over" and "Try sample answers" share one button that
changes label in place (both are the check's own buttons); the payoff is the
loop's start, so mounting the stage over the poster is seamless.

Unresolved: at a hero column under about 612 px the wide design scales below
0.85 and its 12 px labels read near 10 px (Task 8 picks the column width).

Not checked: Safari and Firefox (the poster's CSS-only scale uses
`tan(atan2())` and container units); a real touch device; a hidden tab and
return; pausing via offscreen scroll beyond the stage's own handling; live
pacing against rAF timestamps.
