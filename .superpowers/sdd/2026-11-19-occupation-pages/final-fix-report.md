# Final fix wave report

Status: DONE. Base cb9411d. Commits:
- cba5562 fix(occupation-page): final review fixes
- a879669 docs(occupation-page): page count, launch note and final review decisions

## Per finding

**C1 (R8 replaces R2), "most 190" sentence** — `faq.ts` `mostInvitedSentence`: picks the state with the highest `min` and names it only when `top.min > 0` and `top.min > c.max` for every other state with published data; otherwise the sentence is left out (FAQ text and FAQPage JSON-LD share it). Tests (`faq.test.ts`): "names no state when the leading ranges overlap (VIC 337–375, NSW 327–346)" (the old "Victoria" expectation is removed); "names a state only when its range is above every other state's" (VIC 215–234 vs NSW 194, QLD under 20 → named; a lone masked state → not named). Built out/: 1 of 479 pages names a state now (South Australia, 78).

**I1, invited wording** — the FAQ sentence is now "{State} had the most EOIs in invited status for 190, as at {Mon YYYY} ({count})." The table header and `data-label` come from the new `invitedHeading(core)` in `states.ts`: "Invited for 190, as at Oct 2026". `StateTable` takes `invitedHeading` instead of `asAt`. Tests: `states.test.ts` "names EOIs in invited status as at the snapshot…" (RED: `invitedHeading is not a function`); the faq test above pins the sentence.

**I2, cohort note** — `cohortNote` now says "Of those, {invited} are invited, {lodged} have lodged a visa application and {waiting} are still waiting." (each from `formatCount`). Tests (`charts.test.ts`): a regex over the nurse note, "have lodged a visa application" for 261313, and "keeps a masked lodged count as under 20" (exact string with a 0–19 lodged segment). RED: the old note had no lodged clause. Built nurse page: "Of those, 1,535 are invited, 640–659 have lodged a visa application and 3,237 are still waiting."

**I3, 189 rounds without a 189 pool** — new `has189Rounds(core)` in `summary.ts` (a 189 pool or a listed cut-off in the last 8 rounds). It gates the 189 chip (`statusChips`), the rounds sentence (`occupationSummary`: without a pool the 190/491 sentence leads and the rounds sentence follows) and the "Recent 189 rounds" cards (`page.tsx`). The no-pool sentence is now "No 189 EOIs are waiting in the published pool for {name}; …" (190/491 totals kept). Tests (`summary.test.ts`): `has189Rounds` for 261313, 253914, `no189PoolCore` (95 in round 5, so true) and a no-rounds copy (false); 253914's exact two summary sentences; 253914's "189: Regular invitations" chip; the no-pool/no-rounds case keeps no chip and no "189 " sentence. RED: 4 failures (`has189Rounds is not a function`, old wording, 1 sentence instead of 2, empty chips). The no-189 Review Focus tests now use the no-rounds copy of `no189PoolCore`, because the fixture itself has an older listed cut-off. Built Ophthalmologist page: the sentence above, "189 listed Ophthalmologist in each of its last four rounds, at 80 points.", the chip and the round cards.

**I4, Dataset JSON-LD** — `temporalCoverage: "{cohortWindowStart(asAt)}/{asAt}"` ("2023-11/2026-10", the 36-month cohort window, DATA.md R8) and `isAccessibleForFree: true`. Test: `meta.test.ts` "states the coverage and that the data is free" (RED: `expected undefined to be '2023-11/2026-10'`).

**I5, page count** — CLAUDE.md and HANDOFF.md now say 479 occupations with published data (14 of the 493 have none).

**m1, single cut-off** — `pointsRange` in `charts.ts` is now exported and used by the FAQ ("at 65 points", not "65 to 65"). Test: "gives a single cut-off once, not as a range". Before the fix the sweep found real cases: 233411 "95 to 95", 262112 "100 to 100", 331111 "65 to 65".

**m2, never listed** — when there is a 189 pool but no round has ever listed the occupation, the answer opens "189 hasn't listed {name} in any round we can read." Test: "has its own sentence when 189 has never listed it".

**m3, both visas** — states are grouped by what they list ("190 and 491", then "190", then "491"), and the groups are joined with "; ": "For 2026–27, QLD, WA and SA list it for 190 and 491; NSW lists it for 190." Test: "names each state once, with both visas when it lists both" (real nurse rows plus a WA-only case: "WA lists it for 190 and 491.").

**m4, pool total label** — new `poolTotalLabel(visa, pool)` in `charts.ts` gives "{total} EOIs in the {visa} pool". `page.tsx` builds `totals` from it. Test: "labels the pool total" (9,464 / under 20 / null). RED: `poolTotalLabel is not a function`.

**m5, try-it self-link** — new `occupationPageLink(entry, currentCode?)` in `components/home/try-it-href.ts` returns null on the page's own occupation. `TryIt` takes an optional `currentCode`; the occupation page passes its code and the homepage passes nothing. Tests: `try-it-href.test.ts` `occupationPageLink` (RED: not a function).

**t1, H1 and subtitle** — the H1 is "{name} ({code})" and the subtitle is "Australian skilled visas: 189, 190 and 491 EOIs, cut-offs and invitations · as at {Mon YYYY}". Checked on the built pages with curl ("Registered Nurses nec (254499)", "Ophthalmologist (253914)"). No render test (R3).

**t2, copy sweep** — new `src/lib/occupation-page/copy-sweep.test.ts`. It loads every hasData core and detail (479, asserted), runs `occupationSummary`, `statusChips` (federal list), `occupationFaq` (questions and answers), `roundsNote` and `cohortNote`, and asserts that no string matches `BANNED_COPY`, contains a repeated range (`/\b(\d+)(?: to |–)\1\b/`) or contains "not listed points". It runs in about 120ms. RED: with HEAD's faq.ts it failed with the 233411, 262112 and 331111 lines above.

**t3, HANDOFF** — `SITE_URL` is described as a placeholder (`https://migratelens.com`) until the founder buys the domain. The stale "Next: roadmap step 4 …" lead-ins are removed, keeping their follow-up lists. 320px is described as checked for the long name only (261399), which matches task-7-report.

**Decision log** — new 19 Nov 2026 row in `docs/STRATEGY.md`: the indexable rule follows the spec, giving 349 indexable pages rather than ~287, and "most invitations" is named only when one state's range is strictly above every other's.

## Commands
- `npm run check`: format OK, lint OK, typecheck OK; `Test Files 81 passed (81)`, `Tests 845 passed (845)`.
- `npm run build`: OK (/occupations/[slug] has 479 paths, plus sitemap.xml and robots.txt).
- curl against 127.0.0.1:3017:
  - 254499: H1 "Registered Nurses nec (254499)"; new subtitle; "Invited for 190, as at Oct 2026"; no "had the most"; the states sentence above; "EOIs in the 189 pool"; temporalCoverage "2023-11/2026-10"; isAccessibleForFree true.
  - 253914: H1 "Ophthalmologist (253914)"; the no-pool sentence plus the rounds sentence; "Recent 189 rounds"; "189: Regular invitations".
  - No page in out/occupations contains "65 to 65", "not listed points" or "190 invitations, Oct".

## Concerns
- TDD order: I wrote the C1/I1/m1/m2/m3 FAQ edits before their tests. Their RED is shown by the sweep against HEAD's faq.ts (m1, m2) and by the removed "Victoria" expectation (C1); every other item went RED then GREEN.
- C1 compares only states with a published `stateInvited` entry for the snapshot month. A "Not published" state is not counted against the leader, as R2 also did and the finding words it. If that state could hold more, the rule would need every row to be published.
- The try-it page link only renders on the client, so curl cannot see whether it is hidden. It is covered by the `occupationPageLink` unit test.
