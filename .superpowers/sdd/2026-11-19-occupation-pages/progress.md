# SDD ledger — plan: docs/superpowers/plans/2026-11-19-occupation-pages.md

Spec: docs/superpowers/specs/2026-11-19-occupation-pages-design.md. Branch: roadmap/occupation-pages (base 16c0b1c).
Founder end-of-run instruction: write the final summary into docs/HANDOFF.md and this workspace, push, stop background processes (servers 3017/3018, caffeinate bem4ha2dz), then shut down the Mac via System Events (closes the terminal too).

## Pre-flight scan (19 Nov 2026)

| Pair / task | Produces vs consumes | Finding |
|---|---|---|
| T1 → T4, T6 | `SITE_URL`, `SITE_INDEXABLE`, `occupationSlug`, `occupationPath` | consistent |
| T2 → T4 | `mostCommonScore` used by the FAQ's "Is N points enough" | consistent |
| T2 → T5/T6 | `OccupationSummary({ chips, sentences, sourceLine })` needs a source line no task produces | gap → R1 |
| T3 → T4 | `StateRow` consumed by `occupationFaq` | consistent; "most invitations" needs an order on intervals → R2 |
| T3 → T5 | `CohortRow` name collides with the report's `CohortRow` (eois-like-yours) | different modules; keep, no import clash |
| T4 → T6 | `isIndexable`, `pageTitle`, `pageDescription`, `occupationJsonLd`, `sitemapEntries` | consistent |
| T5 → T6 | `PoolTabs` `totals` and `RelatedOccupations` `unitGroup` | page computes them (formatCount of the pool total; first four code digits) |
| T1 self | slug rule vs tests | consistent ("Ship's Master" → ship-s-master) |
| T2 self | sentences vs real data | checked: SE rounds/pool, nurse 70–80 |
| T3 self | round cards, notes, cohorts, state sums vs real data | checked: SE [null,100,100,95,null×4]; nurse 65–85 latest 70; nurse Oct 2026 invited 40; VIC 337–375, NSW 327–346, SE NSW 0–38 |
| T4 self | FAQ modes (SE 75, nurse 70), Victoria most 190 invitations | consistent under R2 |
| T5 self | "component test only if the repo renders components in tests" | the repo has no `.test.tsx` → R3 |
| T6 self | 479 pages + index = 480 entries in out/occupations | consistent |
| T7 self | browser pass, docs | consistent |

Ruling R1: Task 2 also produces `sourceLine(core: OccupationCore): string` = "SkillSelect (Department of Home Affairs), snapshot {formatDate(monthEnd(core.asAt))} · counts are EOIs (one person can hold several) · updated monthly" (`monthEnd` from src/lib/data/report-source.ts) — the spec's summary ends with this line and no task owned it — cost if wrong: one string moved.
Ruling R2: "the state with the most 190 invitations" ranks the invited intervals by `min`, then `max`; a state is named only when its `min` is above 0 — keeps masked ranges from winning on their upper bound — cost if wrong: one FAQ sentence.
Ruling R3: no component render tests in Task 5 (the repo has none); the view-model tests and Task 7's browser pass cover it — cost if wrong: a missed render bug caught in Task 7.

## Tasks
Task 1: dispatched (base 16c0b1c, implementer a6c1348b29578c354, sonnet)
Task 1: implementer DONE_WITH_CONCERNS dfcb485 (no RED seen; metadataBase moved from the preview host to the SITE_URL placeholder; trailer names Sonnet). Review dispatched (aa7a74e47909b5c3e).
Task 1: complete (commits 16c0b1c..dfcb485, review clean; 2 Minor noted)
Ruling R4: keep `metadataBase` on the SITE_URL placeholder (migratelens.com) as the spec mandates; preview unfurls may lack an image until the domain is live — cost if wrong: one line in site.ts.
Ruling R5: subagent commit trailers may name the model that wrote them (Sonnet) — accurate attribution — cost if wrong: cosmetic.
Minor parked M1: codeFromSlug matches the last 6 digits of a longer digit run; only generated slugs reach it (dynamicParams=false).
Task 2: dispatched (base dfcb485)
Task 2: implementer DONE_WITH_CONCERNS 05d5c3e (no RED; local STATUS_TONE copy; chip omissions for no 189 pool / no federal entry). Review dispatched.
Task 2: complete (commits dfcb485..05d5c3e, review clean; Minor parked for the final wave)
Minor parked M2: summary.ts duplicates the scorecard's STATUS_TONE — export it from report/scorecard.ts and import it; add amber/green chip assertions, the 491 chip in the not-on-list test, and a non-ready likeTheseSentence test.
Task 3: dispatched (base 05d5c3e)
Task 3: implementer DONE_WITH_CONCERNS 58386f6 (wording for VIC-type and not-on-list rows chosen by implementer; missing cohort month = 0; report lacks RED/GREEN). Review dispatched.
Task 3: review Needs fixes (2 Important). 
Ruling R6: a submission month absent from detail.cohorts["189"] within the 36-month cohort window (docs/DATA.md ruling R8) is zero, not "not published": the cohorts view is one fetch over every month, so a month without rows had no EOIs — keep the zeros and add a code comment citing DATA.md — cost if wrong: an unpublished month drawn as an empty bar.
Task 3: minor (deferred): charts.test 261313 cohortNote needs a positive range assertion; no test for detail without cohorts["189"] (null) or an absent month; "Not applicable"/"Rules being checked" outputs only indirectly tested; roundsNote "latest cut-off" names the most recent listed round within the last four; redundant MonthKey annotation charts.ts:245.
Task 3: fix round 1 dispatched (mixed stream kinds in stateRows; R6 comment)
Task 3: fix round 1/5 (2 addressed, 0 open; commits 58386f6..28399fc)
Task 3: complete (commits 05d5c3e..28399fc, review clean after round 1)
Task 3: minor (deferred): states.test non-null assertion on the rule lookup (check ENGINEERING.md).
Task 4: dispatched (base 28399fc)
Task 4: implementer DONE_WITH_CONCERNS a15518d (allMaskedCore has unmasked pools, so tests use a local fully masked core; R2 tie names no state). Review dispatched.
Ruling R7: accept the local fully masked core in meta.test.ts instead of `allMaskedCore` — that fixture only masks monthly history and has unmasked pools, so the plan named the wrong fixture; the tested rule (every pool count "<20" → not indexable, not in the sitemap) is what the spec requires — cost if wrong: none to behaviour.
Task 4: complete (commits 28399fc..a15518d, review clean; R7)
Task 4: minor (deferred): R2 tie names no state (untested, no comment); BANNED_COPY sweep misses the no-189 and "None of …"/"No 189 round" answers; pageDescription slice drops a word when char 160 is a space.
Task 5: dispatched (base a15518d)
Task 5: implementer DONE e19da75 (hand-written accessible tablist; StateTable header takes a formatted month from Task 6). Review dispatched.
Task 5: review Needs fixes (3 Important: print colour of the dark strip; stacked table loses semantics; cohort segments colour-only + CLOSED near-invisible).
Task 5: minor (deferred): summary headline serif 400 → 600 (brand: only 600 self-hosted); source line and legend under 16px on phones; tablist lacks Home/End, tabpanel tabindex, "Visa 189" labels; state links lack "(opens in a new tab)"; "Not listed" tight at 320px (check in Task 7); related-link tap targets ~36px; StateTable header needs a formatted month from Task 6.
Task 5: fix round 1 dispatched
Task 5: fix round 1/5 (3 addressed, 0 open; commits e19da75..5fa111c)
Task 5: complete (commits a15518d..5fa111c, review clean after round 1)
Task 5: minor (deferred): Closed (--muted) is close to On hold (--muted-soft) in the cohort bar — hatch or lighten one; .row lacks position:relative for .srOnly; redundant table roles (harmless).
Task 6: dispatched (base 5fa111c)
Task 6: implementer DONE_WITH_CONCERNS 960ec07 (out/occupations has 484 entries = 479 pages + index.html + 4 RSC .txt files; sitemap 354 = 5 static + 349 occupations; robots disallows all; extra CSS modules). Review dispatched.
Note for final review: the spec estimated 192 thin pages (every score cell "<20"); isIndexable also counts pool totals, so 349 occupations are indexable, not ~287. Triage whether a page with all score cells "<20" but a published total ≥20 should be noindex.
Task 6: complete (commits 5fa111c..960ec07, review clean)
Task 6: minor (deferred): source line appears twice (summary box and footer); robots allow-all branch untested; sitemap.ts `as OccupationCore[]` cast.
Task 7: dispatched (base 960ec07)
Task 7: implementer DONE cb9411d (browser pass clean at 1440/390/320; docs updated). Review dispatched.
Task 7: complete (commits 960ec07..cb9411d, review clean)
Task 7: minor (deferred): HANDOFF launch note should say SITE_URL is a placeholder; stale "Next: roadmap step 4" line in HANDOFF; HANDOFF "Verified" overstates 320px scope; try-it import order; transient ERR_SOCKET_NOT_CONNECTED unmentioned.
Controller observation (minor): the occupation H1 is "{name}" with the code on the subtitle line ("ANZSCO 261313 · …"); the spec asked for H1 "{name} ({code})" and subtitle "Australian skilled visas: 189, 190 and 491 EOIs, cut-offs and invitations · as at {Mon YYYY}".
Final review: dispatched (base main merge-base)
Final review: With fixes (1 Critical, 5 Important, 5 Minor + 3 triaged). Findings: final-fix-findings.md.
Ruling R8 (replaces R2): name "the state with the most 190 invitations" only when its min is above every other state's max — overlapping masked ranges cannot rank — cost if wrong: one FAQ sentence shown less often.
Ruling R9: keep the spec's indexable rule (noindex only when every published count is "<20"): 349 indexable pages, not ~287 — the extra 62 have a published pool total of 20+ plus round and state data — cost if wrong: some thin pages indexed at launch; one rule to tighten.
Final fix wave: dispatched (base cb9411d)
Final fix wave: DONE_WITH_CONCERNS cba5562, a879669 (all items; C1 compares only states with a published count). Scoped re-review dispatched.
Final fix wave: re-review clean (all 14 items + decision-log entry ADDRESSED; commits cb9411d..a879669)
Ruling R10: park the "Not published" hardening for the "most invitations" sentence (a state with no snapshot-month key is skipped, not counted against the leader) — DATA.md says every fetched month holds a key for each state, and 0 of 479 built pages combine the sentence with "Not published" — cost if wrong: one unsupported sentence after a partial import; a one-line guard fixes it.
Deferred follow-ups (left by triage): M1 codeFromSlug, M2 STATUS_TONE copy, test gaps, pageDescription edge, tablist Home/End, "(opens in a new tab)", tap targets, Closed/On hold colours, .srOnly anchor, duplicate source line, robots allow-all test, sitemap cast, "last 1 submission months" wording, faq→charts helper import.
