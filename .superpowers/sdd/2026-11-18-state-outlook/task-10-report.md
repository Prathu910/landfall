# Task 10 report
Status: DONE. Components only render view-models (no data loading). Files: src/components/report/state-outlook.tsx (+.module.css), state-tile.tsx (+css), state-panel.tsx (+css).
API: StateOutlook({ subtitle, summaryByVisa, tilesByVisa, panelsByVisa, anyStateByVisa, defaultVisa }).
Behaviour: #state-outlook section; Mantine SegmentedControl (hidden in print); #state-outlook-190/491 and #state-{visa}-{code} hashes read on load/hashchange, select visa, open details, focus summary, scroll. Tile click does history.replaceState to the panel anchor (no profile data). Non-selected visa display:none on screen only, shown in print.
Verification: temp page (reverted) built with real fixture view-models; npm run build OK; npm run check OK (604 tests); screenshots 1440 and 390 and print.pdf (19 pages, 16 panels expanded, both visas) in screenshots/.
Notes: tile group label taken from the matching panel's groupLabel; panel chip group taken from the matching tile. Pre-existing lint warning (unused countInSentence in view.ts) untouched. Not tested on a real touch device or screen reader.

## Fix P23
buildTiles now shows the evidence fragment for every group except not-open; reasons stay in panels. RED test failed on old code, GREEN after. Removed unused countInSentence import. check: 0 warnings; build OK. desktop-1440.png refreshed (NSW reads 'at least 71 invited at <=95 (as at Oct 2026)').

## Fix: AA links, panel headings, rAF cleanup
- Panel links now --forest-dark (#102e29) with underline. Contrast: white 14.53, amber-tint 12.40, danger-tint 12.13 (old --forest: 5.21 / 4.44 / 4.35).
- Summary now holds an h4 (state name, group chip, stream name inside); section headings are h5. Visual design unchanged.
- goTo's requestAnimationFrame is cancelled on re-call and on unmount.
- check 0 warnings (605 tests), build OK.
