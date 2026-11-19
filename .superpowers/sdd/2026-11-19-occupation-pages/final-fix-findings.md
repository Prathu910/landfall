# Final review fix wave — complete findings list (fix all)

Critical
C1. src/lib/occupation-page/faq.ts:36-55 — "{State} had the most 190 invitations" ranks masked intervals by lower bound (ruling R2), naming a winner when the runner-up's range overlaps (19 of 20 pages: nurse VIC 337–375 vs NSW 327–346; Physiotherapist NSW 20–96 vs WA 0–95; Carpenter WA 166–280 vs VIC 144–182). It is also emitted in FAQPage JSON-LD. Fix: name a state only when top.min > next.max (strictly above every other state's max); otherwise leave the sentence out. Update faq.test.ts (the "Victoria" expectation for 254499 is wrong; it should now have no such sentence) and add a test where the lead is unambiguous. This replaces ruling R2.

Important
I1. faq.ts:55 and src/components/occupation/state-table.tsx:20,41 describe stateInvited as invitations issued in a month. stateInvited counts EOIs in INVITED status as at the snapshot. Use "EOIs in invited status for 190, as at {Mon YYYY}" in the FAQ sentence (if it survives C1) and head the table column "Invited for 190, as at {Mon YYYY}".
I2. src/lib/occupation-page/charts.ts:136-141 — the cohort note omits lodged EOIs ("1,535 are invited so far" while 658 lodged). Say "… {invited} are invited, {lodged} have lodged a visa application and {waiting} are still waiting" (intervals via formatCount, masked kept as ranges/"under 20"). Update tests.
I3. Pages with no 189 pool hide real 189 rounds and contradict themselves (summary.ts:127,142; src/app/occupations/[slug]/page.tsx:129; e.g. Ophthalmologist 253914, Nursing Clinical Director 134212, Horse Trainer 361112, Dancer or Choreographer 211112). Gate the 189 chip, the rounds sentence and the round cards on "has a 189 pool OR any listed cut-off among the last 8 rounds"; reword the no-pool sentence to "No 189 EOIs are waiting in the published pool for {name}; …" (keep the 190/491 totals part). Add tests with 253914.
I4. src/lib/occupation-page/meta.ts:64-77 — Dataset JSON-LD lacks temporalCoverage and isAccessibleForFree. Add temporalCoverage as "{first cohort month}/{asAt}" if simple, else the asAt month (e.g. "2026-10"), and isAccessibleForFree: true; test both.
I5. CLAUDE.md and docs/HANDOFF.md say "each of the 493 occupations": it is 479 pages (14 occupations have no data). Correct both.

Minor (fix in the same wave)
m1. faq.ts:115 prints "at 65 to 65 points" for a single value — reuse the single-value rule (pointsRange in charts.ts, or one shared helper).
m2. faq.ts:114 — with a 189 pool but no listed round the answer reads "the last was not listed points": give that case its own sentence.
m3. faq.ts:58-63 — when one state lists both visas say "WA lists it for 190 and 491", not "WA lists it for 190 and WA lists it for 491".
m4. src/components/occupation/pool-tabs.tsx:91 — label the total: "{total} EOIs in the {visa} pool".
m5. src/components/home/try-it.tsx:103 — on an occupation page, hide "See the {name} page" when the selected occupation is the page's own occupation (e.g. pass an optional `currentCode` prop from the page; the homepage passes nothing).

Triaged from the ledger (fix in the same wave)
t1. Occupation page H1 must be "{name} ({code})" with the subtitle "Australian skilled visas: 189, 190 and 491 EOIs, cut-offs and invitations · as at {Mon YYYY}" (spec), page.tsx:113-117.
t2. Extend the BANNED_COPY sweeps: run occupationSummary, statusChips, occupationFaq and cohortNote over EVERY hasData core (load each with loadOccupationCore/loadOccupationDetail and stateRuleData) and assert no string matches BANNED_COPY and none contains "65 to 65"-style repeats or "not listed points". Keep it fast.
t3. docs/HANDOFF.md: say SITE_URL is a placeholder until the founder's domain; remove the stale "Next: roadmap step 4" line; say 320px was checked for the long name only.

Record in docs/STRATEGY.md decision log (19 Nov 2026): the indexable rule follows the spec (a page is noindex only when every published count is "<20"), giving 349 indexable occupation pages, not the ~287 estimated; and that "most invitations" is named only when one state's range is strictly above every other's.
