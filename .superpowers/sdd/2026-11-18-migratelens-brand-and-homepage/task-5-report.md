# Task 5 report

Status: DONE. Commit: see `git log -1` (feat(home): sample constants and try-it and demo view-models).

## Implemented
- src/lib/sample.ts: SAMPLE_AS_OF, SAMPLE_COMPARISON, sampleReportProfile.
- src/lib/home/try-it.ts: TRY_IT_POINTS (65..140 step 5), TRY_IT_DEFAULT, buildTryIt (TryItView carries roundStatus + latestRound per ruling B5; counts via countInSentence, so masked = "under 20 (so may be zero)").
- src/lib/home/demo-content.ts: buildDemoContent (throws if counts/state outlook missing).
- src/components/home/sample-view.ts: buildSampleView (reuses components/report/report-view.ts reportView()).
- src/app/sample/page.tsx uses shared constants. src/components/report/report-view.ts: three `@/lib/...` imports made relative (vitest has no alias; no behaviour change).
- Tests: src/lib/home/try-it.test.ts, demo-content.test.ts, src/components/home/sample-view.test.ts. 15 new tests; full suite 704 pass; npm run check and build pass.

## TDD
RED: `npx vitest run src/lib/home src/components/home` -> 3 failed files ("no tests", modules missing). GREEN after implementation: 3 files, 15 tests pass (one extra fix: relative imports in report-view.ts after "Cannot find package '@/lib/report/report-view'").

## sample page diff
Built before and after; out/sample/index.html differs ONLY in the Next build id (uDS7696Np3-fNrt0mWRHC vs pLl1CxxndH3O-vV6FJx32). Otherwise identical.

## buildTryIt(261313 core, 85)
{ kind: "data", higher: "2,004–2,023", same: "1,213", poolTotal: "9,444–9,539", roundStatus: "No recent invitations", latestRound: "Not listed, 15 Oct 2026", asAt: "Oct 2026" }
latestRound = `${tile.value}, ${tile.label}` from buildRounds(...).tiles[0]; "Not listed" for null cutoff (tested not to contain "0").

## DemoContent (sample: 261111 ICT Business Analyst, 90 points, asOf 2026-11-17)
{
 occupation: "ICT Business Analyst", points: "90",
 profileLines: ["ICT Business Analyst", "189 · Independent: 90 points", "190 · Nominated: 95 points, with +5 if nominated", "491 · Regional: 105 points, with +15 if nominated or sponsored"],
 cards: [ {visa:"189 · Independent", ahead:"865–903", atScore:"1,093"}, {visa:"190 · Nominated", ahead:"882–920", atScore:"1,293"}, {visa:"491 · Regional", ahead:"541–579", atScore:"878"} ],
 tiles (190, in outlook order): ACT/NT/TAS/VIC/WA "Not yet verified"; NSW/QLD/SA "Not open to you now" (label = full state name),
 posterAlt: "ICT Business Analyst at 90 points: 865–903 EOIs with a higher score for 189 and 1,093 at the same score, with 882–920 EOIs with a higher score nationally for 190."
}

## Notes / concerns
- buildDemoContent's signature has no profile, so profileLines derive from the scorecard (occupation + points per visa with the report's pointsNote), not personal details (age, English etc.). If the demo wants those, add a profile param.
- tiles: state = code, label = state name, group = panel groupLabel (matched via tile.href == panel.id); GROUP_LABELS in state-outlook/view.ts is not exported.
- Note the sample report's nominated occupation is 261111; 261313 is only its comparison. Try-it's real-data test uses 261313 as the brief asks.
- Interval-ness: demo cards pass the scorecard's formatCount strings ("under 20" when masked); posterAlt re-expands to "under 20 (so may be zero)".

## Fix round 1 (B6, I2, minors)
RED: 4 failing tests (published total x2, profile lines, sample-view categories). GREEN: npm run check 707 tests, 0 warnings; build passes.
- buildDemoContent(view, name, points, categories); profileLines = non-zero categories "{label} · {n} pts" + "{points} points". buildSampleView returns categories.
- buildTryIt now uses poolPosition (the report path), so poolTotal is the published total; real-data test vs poolPosition added plus masked-rows fixture.
- posterAlt uses the typed 189 where-you-stand intervals (countInSentence), no string match; the 190 clause was dropped.
- One-sentence test sturdier.
Output: {"t":{"kind":"data","higher":"2,004–2,023","same":"1,213","poolTotal":"9,464","roundStatus":"No recent invitations","latestRound":"Not listed, 15 Oct 2026","asAt":"Oct 2026"},"pl":["Age · 30 pts","English proficiency · 20 pts","Skilled employment · 10 pts","Highest qualification · 15 pts","Australian study · 5 pts","Partner qualifications · 10 pts","90 points"],"alt":"ICT Business Analyst at 90 points: 865–903 EOIs with a higher score for 189 and 1,093 at the same score."}
