# Direction A plus: design and research

22 November 2026. Separate enhancement of the founder-preferred `.superpowers/brainstorm/homepage-2026-11-21/direction-a.html`. The original is unchanged; the blue/white 22 November proposal is not the chosen direction.

## Recommendation

Keep Direction A's distinctive passport language rather than changing its identity again: ink, white paper, sage desk, guilloche lines and stamps. Make the first screen explain Australian permanent residency and the free report. Let a genuinely useful map explain how state pathways differ, with detail revealed by interaction rather than adding a wall of text.

## References reviewed

- [ImmiTrend](https://immitrend.com.au/): direct invitation question, occupation-first exploration and a working tool near the top. Borrow the clarity of the entry point; do not copy its forecasts or figures.
- [One U state nomination](https://www.oneuedu.com/en-US/tools/state-nomination): explicit state-by-state comparison and dated sources. Borrow the state-selection mental model; do not import its policy statuses.
- [Wise Australia](https://wise.com/au/): plain explanation of what the product does and an immediate task entry.
- [Linear's design refresh](https://linear.app/now/behind-the-latest-design-refresh): consistency, fewer competing interface elements and progressive disclosure.

## What changed in the copy

- Original Direction A hero, fonts, stamps, palette and report previews remain the visual base.
- Australian permanent-residency context is visible before the headline. Copy explains the 189, 190 and provisional 491 pathways and email requirement.
- The map has eight selectable state shapes, equivalent labelled buttons, keyboard activation and arrow navigation, and zoom/reset controls. Changing occupation, base points, visa or state updates the evidence panel.
- The map and evidence panel replace the old two doors and separate try-it section, keeping the page from growing through added prose.
- Published state evidence is generated from the repository's snapshot using `stateEvidence` and `evidenceLabel`. It is not an eligibility result or a current state-policy-status map. Patterned bars show interval upper bounds, missing months stay missing, and source/caveat text stays visible.
- The 189 example uses `label189` and `buildTryIt` output. The static nurse sample is corrected to VIC 190 and NT 491, matching the implemented example. The unsupported English-study duration is removed.

## Assets and scope

State geometry: [rowanhogan/australian-states](https://github.com/rowanhogan/australian-states), simplified for the illustration. Locally served Archivo and Big Shoulders Stencil Display. Existing approved stamp and passport generators reused. No AI calls, form submissions or backend changes. This is a design preview, not a deployed homepage.

## Verification

Eight real state shapes are clickable, including the ACT inset. Checked at 1440, 1280, 1024, 820, 760, 600, 390 and 360px with no horizontal overflow. All eight shapes, native state buttons, keyboard arrow/Enter navigation, zoom/reset, all 288 state/visa/occupation/points combinations, and monthly data rendering were exercised in a real browser without page errors. Syntax and formatting checks pass. The original Direction A SHA-256 remains `3a7fc4db5da392997cabe935e0a426f4e56a788f82239ee7a92475a2a5975f80`.
