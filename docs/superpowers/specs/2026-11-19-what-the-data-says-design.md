# What the data says: design (19 Nov 2026)

Approved by the founder from the mockup in `.superpowers/brainstorm/verdict-2026-11-19/` ("Go ahead with your picks").

## Why

The report gives the facts but leaves the reader to assemble the answer. The founder wants the report to end, and start, with the answer people came for: a plain-language summary with numbers ("I short the user should get the ANSWER for which they paid").

## Goals

- One plain sentence that says where the reader stands, from the report's own numbers, first thing in the report.
- The per-visa picture at a glance, a picture of 189 cut-offs against the reader's points, the outcomes of EOIs like theirs, and the points they could gain or will lose.
- The same bottom line repeated in one line at the end of the report.

## Non-goals and anti-goals

- No percentages, no forecasts (no "you will wait 1–2 years"), no "you should" and no visa recommendation. Comparisons say where "the published evidence is strongest", never which visa to apply for (STRATEGY "Data, not advice"; Migration Act s276/s280 risk, covered by the lawyer review).
- No second copy of the 189/190/491 numbers: the summary reuses the scorecard instead of duplicating it.
- Nothing that the report's existing view-models do not already establish.

## Approaches considered

1. **A new section above the scorecard (the mockup's layout).** Faithful to the mockup, but the visa rows repeat the scorecard's three cards directly above it.
2. **Evolve the scorecard into "What the data says" (chosen, Claude's call).** The opening section keeps its three cards as the visa rows; its eyebrow, headline and 190/491 chips change; the chart, "EOIs like yours" and the levers go below the cards. Same content as the mockup, with no duplication.
3. **A section at the end only.** Matches the founder's first words ("at last"), but most readers never scroll that far; the founder accepted the "top plus recap" pick.

## Design

- **Title:** eyebrow "What the data says" (replaces "Your reality check"); nav entry "What the data says". Section id stays `reality-check`.
- **Bottom line (headline), when occupation data is ready and 189 EOIs are published:**
  - No listing in the last four rounds: "189 hasn't listed {name} in its last four rounds; the last cut-off was {c} points, in {Mon YYYY}." (or "…in any round we can read.")
  - Listed, points at or above the latest cut-off: "189 listed {name} in each of its last four rounds (or "in {k} of …"), at {lo}–{hi} points, and you have {base}."
  - Listed, points below the latest cut-off: "189 listed {name} in each of its last four rounds; the latest cut-off was {c} points, above your {base}."
  - Other data states keep today's headlines.
- **State line (detail under the headline):** "The published evidence for 190 is strongest in NSW, and for 491 in WA." When no state is strongest: "No state shows strong published evidence for your profile yet." plus "Worth watching: WA for 491." when a state is worth watching.
- **190/491 chips** name the best state group: "Strongest evidence: NSW" (green), "Worth watching: WA" (slate), "Needs your answers", "Rules being checked" (neutral), or "Not open to you now" (red).
- **Cut-off chart:** the last six 189 rounds, oldest first; a listed cut-off is a dot, a round that did not list the occupation is a hollow ring labelled "not listed", the reader's points a saffron line. A note above it says how the points compare ("Your 75 is at or above 4 of the 6 cut-offs listed in the last 6 rounds", "…every cut-off…", "Every cut-off … was above your …", "Not listed in any of the last 6 rounds."). The SVG has a text description for screen readers.
- **EOIs like yours:** the 189 panel's existing sentence, linking to the 189 panel.
- **Levers:** "Points you could add" (the report's scenario gains; when one would lift the reader to or above every cut-off listed in the last six rounds, it says so) and "Dated changes ahead" (the timeline's next dated changes, with their dates).
- **Recap:** the headline and state line, at the end of the report, before "What this report can and cannot tell you".
- All text comes from pure, tested view-models in `src/lib/report/`; copy passes `BANNED_COPY`; everything prints; no animation is added.

## Left to the builder

Exact spacing, chart proportions and responsive layout within the brand system; the 12px floor and contrast tests apply.
