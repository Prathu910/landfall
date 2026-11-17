# State and territory nomination (190 / 491), 2026–27: research notes

Checked: 17 Nov 2026. Program year: 2026–27.

Purpose: source material for hand-curating the "190 / 491 state outlook" (see `docs/STRATEGY.md`). This file is research. It is not product copy, and nothing here should reach users until it has been re-checked against the live official pages.

## How to read this

- **Sources.** Official state/territory and Home Affairs pages only. Every claim carries an inline link. Short phrases in quotation marks are verbatim; everything else is paraphrased.
- **Two levels of confidence.** Four official sites (ACT `act.gov.au`, Victoria `liveinmelbourne.vic.gov.au`, Tasmania `migration.tas.gov.au`, NT `theterritory.com.au` / `australiasnorthernterritory.com.au`) returned **HTTP 403 (Cloudflare bot challenge)** to every automated fetch on 17 Nov 2026, including their PDFs. The browser extension was not connected, and I did not try to get round the block. For those four jurisdictions:
  - **[D] = read directly.** I read the official page or file myself on 17 Nov 2026 (WA, NSW, QLD, SA, Home Affairs).
  - **[S] = search extract.** The text came from a web-search tool's extract of the linked official page. I could not open the page myself, so treat it as **unverified**. The link points to the official page the extract came from. Someone must read it in a normal browser before Landfall relies on it.
- **"Not confirmed"** means I could not establish the fact from an official source I could read, either because the page was blocked, or because the source was silent, ambiguous or contradicted another official page. It never means "no".
- **"Yes" for an occupation** means the occupation appears on that state's published list for that visa and cohort. It does not mean the person is eligible or likely to be invited. Every state adds residence, work and other criteria on top, and most select competitively.
- **Federal layer not re-verified here.** This document assumes all 11 study occupations are federally eligible for both 190 and 491. That assumption was not re-checked against the current Home Affairs instrument.

---

## Context: national allocations

- The Home Affairs allocations page (last updated 21/09/2026) still shows only the **2025–26** allocations: 20,350 in total, set on 4 November 2025. The page has no 2026–27 figures. [D] [Home Affairs – state and territory nomination allocations](https://immi.homeaffairs.gov.au/what-we-do/state-and-territory-nomination-allocations)
  - 2025–26 (190 / 491): ACT 800/800, NSW 2,100/1,500, NT 850/800, QLD 1,850/750, SA 1,350/900, TAS 1,200/650, VIC 2,700/700, WA 2,000/1,400. [D] [same page](https://immi.homeaffairs.gov.au/what-we-do/state-and-territory-nomination-allocations)
- **2026–27 allocations are therefore not confirmed nationally.** Some states quote their own 2026–27 numbers (VIC, TAS, ACT below), but the Commonwealth page has not been updated.

---

## Western Australia (WA)

Checked: 17 Nov 2026. All items [D].

1. **Program status 2026–27.** Open for both 190 and 491. WA invited people in September and October 2026 (1,100 and 1,227 invitations), most recently on 14 October 2026. [WA SNMP – invitation rounds](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#invitation-rounds)
   - Streams:
     - **General:** WASMOL Schedule 1 and Schedule 2.
     - **Defence industry:** WASMOL Schedule 3, 190 only.
     - **Graduate:** Graduate occupation list. [WA SNMP – eligibility](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligibility)
   - The Defence industry stream was announced as "now available" on 13 Nov 2026. [WA news, 13/11/2026](https://migration.wa.gov.au/news/defence-industry-stream-now-available-under-state-nominated-migration-program)
   - Allocation: no 2026–27 number is published. The criteria PDF refers only to "the State's annual nomination allocation". [WA SNMP Criteria 26-27 (PDF, created 13 Nov 2026)](https://migration.wa.gov.au/sites/default/files/2026-11/SNMP%20Criteria%2026-27.pdf)
2. **Occupation lists.** There are four lists, all in one filterable web table with a CSV download. [Eligible occupations](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligible-occupations) · [CSV export](https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv)
   - The CSV has 668 occupation–stream rows covering 384 distinct ANZSCO codes:
     - Schedule 1: 89 rows
     - Schedule 2: 189 rows
     - Schedule 3: 60 rows
     - Graduate: 331 rows
   - Columns: minimum points (65 on every row), "Priority Occupation", "Regional WA only", v190 and v491. [CSV export](https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv)
   - There is **no separate onshore or offshore list**. Residence affects ranking, not list membership.
   - Note: the CSV only returned data with `?combine=&_format=csv`. The page's own link (`?page&_format=csv`) returned an empty file.
3. **Our 11 occupations.** All 11 are listed for both 190 and 491 in General and Graduate streams. Details by occupation: [CSV](https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv)
   - 254499 Registered Nurses nec is on **Schedule 1**. The other 10 are on Schedule 2.
   - 233512 Mechanical Engineer and 233311 Electrical Engineer are also on Schedule 3 (Defence, 190 only).
   - Flagged as "Priority Occupation": 233211, 254499, 351311, 241111 and 241411. The ICT occupations, 221111, 233512 and 233311 are not flagged.
4. **Eligibility rules a questionnaire could test.** [Overview of requirements and stream sections](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligibility)
   - **EOI:** must say "Western Australia only", the applicant must be under 45, and the score must be at least 65 points. [How to apply, Step 1](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#how-to-apply-for-wa-state-nomination)
   - **English:** competent in all four components. Holders of UK, Canadian, NZ, US or Irish passports are exempt. [same](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligibility)
   - **Work experience (Schedule 1 only, 190 and 491):** at least one year in the nominated or a closely related occupation (same first four ANZSCO digits) within the last 10 years. Australian and overseas experience cannot be combined. Only post-qualification, paid work of at least 20 hours a week counts. [same](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligibility)
   - **Employment contract:** required for **190 in Schedules 1 and 2 and the Defence stream**. It must be full-time (35+ hours a week) in WA for at least six months. A contract is not required for 491, for the Graduate stream, or for occupations in the building and construction sector. [same](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligibility)
   - **Graduate stream:** at least two academic years of face-to-face study in WA (at least 87 weeks), and a WA qualification at Certificate III or above. [same](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligibility)
   - **Residence:** there is no minimum residence requirement, and offshore applicants are allowed. People "currently residing in Western Australia" are ranked ahead of others, and must prove at least three months' continuous WA residence immediately before the invitation. People who live interstate or overseas must show a genuine commitment to WA. [Criteria 26-27 PDF](https://migration.wa.gov.au/sites/default/files/2026-11/SNMP%20Criteria%2026-27.pdf)
   - **491 locations:** Perth counts as regional for 491. [Criteria 26-27 PDF](https://migration.wa.gov.au/sites/default/files/2026-11/SNMP%20Criteria%2026-27.pdf)
   - **Salary:** no fixed salary threshold. WA assesses whether the contract salary is "appropriate" against market rates. [Eligibility](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#eligibility)
   - **Fee:** $200 application fee. [Criteria 26-27 PDF](https://migration.wa.gov.au/sites/default/files/2026-11/SNMP%20Criteria%2026-27.pdf)
5. **Selection system.** WA selects by ranking EOIs, with no state score. The order (FAQ version) is: [SNMP FAQ – priority order](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#snmp-frequently-asked-questions)
   1. Building and construction trades.
   2. Other priority sectors: building and construction non-trades, healthcare and social assistance, hospitality and tourism, education and training.
   3. All other sectors.

   Within each tier, WA residents come before offshore and interstate applicants. Then the highest EOI points win, then the oldest EOI date.
   - **Graduate stream:** qualification level is added before points. The order is PhD/Master's, then Honours, then Bachelor's; for VET it is Advanced Diploma down to Certificate III. Up to 75% of graduate places go to higher-education graduates and up to 25% to VET graduates. [Invitation rounds – ranking system](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#invitation-rounds)
   - Applicants eligible for both visas are "generally" invited for 491 first. [same](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#invitation-rounds)
   - **Computable?** Partly. There is no state score, but Landfall could compute the user's **ranking tier** (sector, then residence) and use federal points plus nomination points as the tiebreak. The sector of each occupation is in the CSV.

6. **Published invitation data.** The richest of the eight jurisdictions.
   - **Monthly invitation counts** for 2024–25, 2025–26 and 2026–27, split by stream, schedule and visa, in HTML tables. [Invitation rounds](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#invitation-rounds)
   - **Last invited EOI per round,** in a web table by sector group, stream and visa. Each row shows state of residence, EOI points and submission date. [same](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#invitation-rounds)
   - **Last invited EOI by occupation,** in PDFs that show residence ("WA" or overseas), points and EOI date. Example from the October 2026 non-trade priority PDF: 254499 last invited at 85 points with WA residence, and 233211, 241111, 241411 and 351311 at 90 points with WA residence. [Oct 2026 non-trade PDF](https://migration.wa.gov.au/sites/default/files/2026-10/Oct%202026%20-%20SNMP%20Invite%20Round%20-%20Last%20Invited%20By%20Occupation%20in%20other%20priority%20occupation.pdf) · [Oct 2026 B&C trades PDF](https://migration.wa.gov.au/sites/default/files/2026-10/Oct%202026.BC%20-%20SNMP%20Invite%20Round%20-%20Last%20Invited%20By%20Occupation%20B%26C%20Trade%20Occupations.pdf)
   - Residence is shown on last-invited profiles (a partial onshore/offshore split), but invitation counts are not split by residence. WA notes the data "does not take into account any occupation or visa subclass caps". [Invitation rounds](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#invitation-rounds)
   - In October 2026 the **non-priority sector** rows were all "-", meaning no last-invited profile. That suggests non-priority occupations (for example the ICT occupations and 221111) were not reached. This is an inference, not a published statement. [same](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#invitation-rounds)
7. **Recent changes and contradictions.**
   - The Defence industry stream was added on 13 Nov 2026. [news](https://migration.wa.gov.au/news/defence-industry-stream-now-available-under-state-nominated-migration-program)
   - **Stale links.** "How to apply" Step 3 and "Step 5" still link to the "2025-26 WA SNMP Criteria - July 2025" PDF. The top of the same section links to "SNMP Criteria 26-27.pdf". [How to apply](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#how-to-apply-for-wa-state-nomination)
   - **Contradictory ranking order.** The web FAQ ranks **sector before residence**. The October 2026 last-invited PDF header lists **residence first, then sector**. [FAQ](https://migration.wa.gov.au/our-services-support/state-nominated-migration-program#snmp-frequently-asked-questions) vs [Oct 2026 PDF](https://migration.wa.gov.au/sites/default/files/2026-10/Oct%202026%20-%20SNMP%20Invite%20Round%20-%20Last%20Invited%20By%20Occupation%20in%20other%20priority%20occupation.pdf)
   - **Contradictory priority sectors.** The PDF lists four priority sectors without the trades/non-trades split. The web page lists five tiers.

---

## New South Wales (NSW)

Checked: 17 Nov 2026. All items [D]. Page modified dates: 190 page and skills list 2026-10-15, 491 page 2026-09-04, FAQ 2026-11-16.

1. **Program status 2026–27.**
   - **190 is open.** It runs by invitation only, and NSW calls it "exceptionally competitive". [NSW 190](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190)
   - **491 is closed.** A notice says applications are closed "for the current program year" because all places are allocated, and that settings for the next program year are under review. [NSW 491](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-work-regional-visa-subclass-491)
     - Pathway 1 (regional employer) and Pathway 3 (regional graduate) are each marked "Closed to new applications". [same](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-work-regional-visa-subclass-491)
     - The skills-list page says only the 190 list has been updated. An update on the 491 Regional Skills List "will be provided" later. [NSW Skills Lists](https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists)
   - Allocation: no NSW 2026–27 number is published.
2. **Occupation list.** The NSW Skills List (190) is a web table of **80 ANZSCO unit groups (4-digit)**. An occupation qualifies if it falls in a listed unit group and is eligible for the visa. Onshore and offshore candidates use the same list. [NSW Skills Lists](https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists)
   - **No 2026–27 Regional Skills List (491) is currently published** on that page. [same](https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists)
3. **Our 11 occupations (190).** Each code's unit group is in brackets. [NSW Skills Lists](https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists)
   - **Yes:** 261312 and 261313 (2613), 233211 (2332), 233311 (2333), 254499 (2544), 241111 (2411), 241411 (2414).
   - **No:** 261111 (2611 not listed), 221111 (2211 not listed), 233512 (2335 not listed), 351311 (3513 not listed).
   - **491:** not confirmed, because the program is closed and has no current list.
4. **Eligibility rules.**
   - **190 residence (meet one):** [NSW 190](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190)
     - working in NSW in the nominated occupation for at least 20 hours a week; or
     - living in NSW continuously for at least 6 months; or
     - living **offshore** continuously for at least 6 months.
   - **491 Pathway 2 residence (when open):** the same structure, with a 3-month minimum. [NSW 491](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-work-regional-visa-subclass-491)
   - Moving between NSW and offshore resets the residence clock. [FAQ](https://www.nsw.gov.au/visas-and-migration/skilled-visas/common-questions-about-skilled-visas)
   - Pathway 1 (closed) required six months with the same regional employer, paid at least TSMIT/CSIT. [NSW 491](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-work-regional-visa-subclass-491)
   - NSW sets no minimum work experience, English level or points above the federal minimums. None found.
   - NSW states that EOI submission date does not affect selection. [NSW 190](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190)
5. **Selection system.** NSW ranks EOIs within each ANZSCO unit group using "multiple factors", including age, English, education, points and total years of skilled work. Onshore and offshore are decided by the usual country of residence in the EOI. [NSW 190](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190) · [FAQ](https://www.nsw.gov.au/visas-and-migration/skilled-visas/common-questions-about-skilled-visas)
   - **Computable?** No. The weights are not published.
6. **Published invitation data.** None found on the official 190, 491, skills-list, FAQ or landing pages. NSW says it has "no predetermined or publicly announced dates" for rounds. [NSW 190](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190)
7. **Changes and contradictions.**
   - The 190 list was updated, but the 491 list is pending. [Skills Lists](https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists)
   - **Stale wording.** The FAQ, modified 16 Nov 2026, still says "For the 2025-26 program year" when describing which occupations are considered. [FAQ](https://www.nsw.gov.au/visas-and-migration/skilled-visas/common-questions-about-skilled-visas)
   - **Ambiguous notice.** The 491 closure notice does not name the program year, so it is unclear whether it is a leftover from 2025–26 or applies to 2026–27. With no 2026–27 regional list either, treat 491 as **not open**.

---

## Queensland (QLD)

Checked: 17 Nov 2026. All items [D].

1. **Program status 2026–27.** The 2026–27 program "is now published". **ROIs opened on 6 November 2026.** [Migration Queensland home](https://www.migration.qld.gov.au/)
   - Onshore applicants need a 2025–26 ATO Notice of Assessment before they submit an ROI. [same](https://www.migration.qld.gov.au/)
   - Everyone must lodge a new ROI for 2026–27. [Registration of Interest](https://www.migration.qld.gov.au/nomination-process/registration-of-interest)
   - Pathways:
     - skilled workers living in Queensland (onshore)
     - offshore
     - building and construction workers
     - Queensland university graduates
     - small business owners in regional Queensland [Skilled visas menu](https://www.migration.qld.gov.au/visa-options/skilled-visas)
   - Allocation: no QLD 2026–27 number is published. The FAQ points to the Home Affairs page. [FAQ](https://www.migration.qld.gov.au/resources/frequently-asked-questions)
2. **Occupation lists.** Separate **onshore** and **offshore** lists, published as web tables, each marking 491 and 190 eligibility. Both say an occupation not on the list is not eligible in 2026–27.
   - Onshore list: about 207 occupations, of which 169 are marked for 190. It also has a "Building and Construction pathway" column. [Onshore QSOL](https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list)
   - Offshore list: about 97 occupations, of which 90 are marked for 190. [Offshore QSOL](<https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)>)
3. **Our 11 occupations.**
   - **Onshore:** 190 and 491 for 233211, 233311, 233512, 241111, 241411, 254499, 261312, 261313. **351311 Chef is 491 only.** **261111 and 221111 are not listed.** [Onshore QSOL](https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list)
   - **Offshore:** 190 and 491 for 233211, 233311, 233512, 254499. **Not listed:** 261111, 261312, 261313, 221111, 351311, 241111, 241411. [Offshore QSOL](<https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)>)
4. **Eligibility rules.**
   - **All pathways:** at least 65 points, at least competent English, and post-qualification work of 20+ hours a week. "Closely related" means the same first **3** ANZSCO digits. Casual work is accepted. [Onshore](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-in-queensland) · [Offshore](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-offshore)
   - **Onshore:** must currently live and work in Queensland for a Queensland employer. [Onshore](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-in-queensland)
     - 190: living and working in Queensland for 9 of the last 12 months.
     - 491: living and working in regional Queensland for 6 of the last 9 months.
     - Chefs and Cooks in takeaway or fast-food businesses are excluded.
   - **Offshore:** at least 1 year of skilled employment in the last 3 years. The applicant does not need to be employed now. [Offshore](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-offshore)
   - **Graduates:** a Bachelor's, Master's or PhD completed 100% in Queensland, graduating after 1 July 2022. The 9/12 (190) and 6/9 (491) work rules apply, but any ANZSCO Skill Level 1 job counts. [Graduates](https://www.migration.qld.gov.au/visa-options/skilled-visas/graduates-of-a-queensland-university)
   - **Building and construction:** 3 continuous months of Queensland work for both visas. [B&C](https://www.migration.qld.gov.au/visa-options/skilled-visas/building-and-construction-workers)
   - **Commitment:** live in Queensland for 2 years after a 190 grant or arrival. For 491, live in regional Queensland for 3 years. [Onshore](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-in-queensland)
   - **Prior 491:** QLD will not nominate for 190 anyone nominated for, applying for, or holding a 491 or 489. [same](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-in-queensland)
   - **ROI limits:** an ROI names one visa subclass and cannot be edited. Only the most recent ROI counts. [same](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-in-queensland)
5. **Selection system.** QLD's own ROI-based selection. It "does not primarily select" on EOI points. Factors "may include": [Onshore](https://www.migration.qld.gov.au/visa-options/skilled-visas/skilled-workers-living-in-queensland) · [FAQ](https://www.migration.qld.gov.au/resources/frequently-asked-questions)
   - skills and qualifications
   - work experience, salary and employability
   - location within Queensland
   - age and English
   - partner's skills and English
   - workforce demand

   Graduates "may be prioritised". QLD does not prioritise because a document is about to expire. **Computable?** No. No weights are published.

6. **Published invitation data.** None found on the official pages read. The FAQ says QLD cannot comment on the likelihood of an invitation. [FAQ](https://www.migration.qld.gov.au/resources/frequently-asked-questions)
7. **Changes.**
   - New 2026–27 settings, with ROIs opening 6 Nov 2026 and a new ROI required from everyone. [home](https://www.migration.qld.gov.au/)
   - The home page links to the documentation checklist at `/visa-options/skilled-visas/documentation-checklist`. The menu uses `/migration-queensland-documentation-checklist`. This is minor and was not tested.

---

## South Australia (SA)

Checked: 17 Nov 2026. All items [D].

1. **Program status 2026–27.** Open, but restricted for onshore applicants. [SA program update, 22 Oct 2026](https://migration.sa.gov.au/news/south-australias-general-skilled-migration-program-update)
   - **Onshore:** ROIs are open **only** to people living and working in SA whose current visas expire **by 31 January 2027**.
   - **Offshore:** no ROI. Candidates are invited straight from their SkillSelect EOI.
   - **Streams:** South Australian Graduates, Skilled Employment in SA, Outer Regional Skilled Employment, Offshore. [Skilled migrants](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants)
   - **Allocation:** no SA 2026–27 number is published.
   - **Fees:** $394 per nomination application. ROIs are free. [same](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants)
2. **Occupation list.** One searchable web list of about 351 occupations. For each occupation it shows each stream and "Applying from" (South Australia or Offshore), the available subclasses, minimum points (65 throughout) and additional requirements. **Onshore and offshore availability differ per occupation:** 109 occupations show no offshore subclass. No CSV or PDF was found. [SA Skilled Occupation List](https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list)
3. **Our 11 occupations.** All from the [SA Skilled Occupation List](https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list).

   | Code                            | Onshore streams (Graduates / Skilled Employment / Outer Regional)                                              | Offshore      |
   | ------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------- |
   | 261111 ICT Business Analyst     | 190 and 491 in all three                                                                                       | not available |
   | 261312 Developer Programmer     | 190 and 491 in all three                                                                                       | not available |
   | 261313 Software Engineer        | 190 and 491 in all three                                                                                       | not available |
   | 221111 Accountant (General)     | **491 only** in all three                                                                                      | not available |
   | 233211 Civil Engineer           | 190 and 491 in all three                                                                                       | 190 and 491   |
   | 233512 Mechanical Engineer      | 190 and 491 in all three                                                                                       | 190 and 491   |
   | 233311 Electrical Engineer      | 190 and 491 in all three                                                                                       | 190 and 491   |
   | 254499 Registered Nurses nec    | 190 and 491 in all three                                                                                       | 190 and 491   |
   | 351311 Chef                     | **491 only**, Skilled Employment and Outer Regional only (not Graduates); limited-service restaurants excluded | not available |
   | 241111 Early Childhood Teacher  | 190 and 491 in all three                                                                                       | 190 and 491   |
   | 241411 Secondary School Teacher | 190 and 491 in all three                                                                                       | 190 and 491   |

4. **Eligibility rules.**
   - **All onshore streams:**
     - EOI with SA as first preference, under 45 when nomination is approved, competent English and 65+ points (including nomination points). [Skilled Employment](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia)
     - Employment must be in the same ANZSCO sub-major group (2 digits) as the nominated occupation. [Skilled Employment](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia)
     - In practice, also the 31 Jan 2027 visa-expiry gate above.
   - **Skilled Employment in SA:** has lived in SA for the last 12 months, and has worked full-time (30+ hours a week) for the last 12 months in a related job. [Skilled Employment](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia)
   - **SA Graduates:** [Graduates](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/south-australian-graduates)
     - CRICOS course of at least 46 weeks, at least 75% completed in SA, and at least one year living in SA during study.
     - Has lived in SA for the last 6 months and worked full-time for 6 months, after completing the course.
   - **Outer Regional:** has lived and worked in outer-regional SA for the past 9 months, full-time. [Outer Regional](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/outer-regional-skilled-employment)
   - **Offshore:** at least **3 years** of skilled experience in the last 5 years. Listed construction and trades occupations need only 1 year in the last 3. Full-time here means 20 hours a week. [Offshore](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/moving-to-south-australia-from-overseas)
5. **Selection system.**
   - **Priority industries** (stream pages): construction, engineering, manufacturing, trades, health, education. "High-ranking" candidates in other industries may also be considered. [Skilled Employment](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia)
   - **Visa choice:** priority-industry candidates whose occupation is 190-eligible may get a 190. Others may get a 491. [same](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia)
   - **Onshore factors** (no particular order): English, years of experience, qualification level, salary and an assessment of the employer. EOI points "are not a determining factor" above the 65 minimum. [same](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia)
   - **Offshore factors:** English, years and field of employment, qualifications **and EOI points**. [Offshore](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/moving-to-south-australia-from-overseas)
   - **Computable?** No. No weights are published.
6. **Published invitation data.** "Invitations issued" news posts, roughly monthly in 2025–26. The latest is 21 May 2026, the "final scheduled invitation round" of 2025–26. [Invitations issued – late May 2026](https://migration.sa.gov.au/news/invitations-issued-late-may-2026) · [News index](https://migration.sa.gov.au/news)
   - Format: an HTML table by **ANZSCO sub-major group (2-digit)**, with 190 and 491 counts for the round and year to date. It is not broken down by occupation and shows no points and no onshore/offshore split. 2025–26 total: 2,853 (1,767 for 190, 1,086 for 491). [same](https://migration.sa.gov.au/news/invitations-issued-late-may-2026)
   - **No 2026–27 invitation posts yet** as of 17 Nov 2026. [News index](https://migration.sa.gov.au/news)
7. **Changes and contradictions.**
   - The 22 Oct 2026 update restricted onshore ROIs to people whose visas expire by 31 Jan 2027. [update](https://migration.sa.gov.au/news/south-australias-general-skilled-migration-program-update)
   - **Different priority-sector lists.** The news post names building and construction, **defence**, education, engineering, health and manufacturing. The stream pages name construction, engineering, manufacturing, **trades**, health and education. [update](https://migration.sa.gov.au/news/south-australias-general-skilled-migration-program-update) vs [Skilled Employment](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia)
   - **Stale wording.** The Outer Regional page still says invitations are issued "throughout 2025–26". [Outer Regional](https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/outer-regional-skilled-employment)

---

## Victoria (VIC)

Checked: 17 Nov 2026. **The site blocked automated fetches (HTTP 403). Every item is [S] and unverified.**

1. **Program status 2026–27.**
   - **190 is open for ROIs**, with **900 places**. [S] [2026-27 Skilled visa nomination program](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/2026-27-skilled-visa-nomination-program) · [news: program now open for 190](https://liveinmelbourne.vic.gov.au/news-events/news/2026/victorias-202627-skilled-visa-nomination-program-is-now-open-for-registrations-of-interest-for-the-skilled-nominated-visa-subclass-190.)
   - **491 is not open.** Places have "not yet been finalised" and ROIs are not being accepted. [S] [same](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/2026-27-skilled-visa-nomination-program) · [491 page](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/491)
   - **Opening date:** not confirmed from an official extract. Third-party sites say 26 or 27 October 2026.
   - **New fees for 2026–27:** $60 per ROI and $180 per nomination application, both excluding GST. [S] [Fees](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/fees)
   - Everyone must lodge a new ROI. [S] [Skilled visa FAQs](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/skilled-visa-faqs)
2. **Occupation list.** Victoria has no state occupation list. "All occupations" on the relevant Home Affairs list are eligible, although certain occupations or industries are prioritised. The 2026–27 priority industries were **not** found. [S] [2026-27 program](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/2026-27-skilled-visa-nomination-program)
3. **Our 11 occupations.**
   - **190:** not confirmed. The extract indicates all 11 are eligible onshore and offshore, by the "all occupations" rule.
   - **491:** closed.
4. **Eligibility rules.** [S] [2026-27 program](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/2026-27-skilled-visa-nomination-program) · [FAQs](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/skilled-visa-faqs)
   - 65+ points, including nomination points.
   - A valid skills assessment.
   - **No minimum work experience or hours** for 190.
   - **Offshore applicants may apply for 190** and must be committed to living in Victoria.
   - Earnings claimed in the ROI must come from skilled employment (ANZSCO skill levels 1–3) in Victoria.
   - Residence rules for onshore applicants outside Victoria: not confirmed.
5. **Selection system.** ROIs are ranked by the **Victorian Points Test (VPT)**, with no pass mark. The highest VPT totals within each priority industry or subgroup are invited. [S] [VPT](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/vpt) · [FAQs](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/skilled-visa-faqs)
   - **Factors:** age, English, years of experience in the occupation, education, occupation skill level, partner's skills, and Victorian skilled earnings. [S] [VPT](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/vpt)
   - **Example values from the extract, unverified:** [S] [VPT](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/vpt)
     - Age: up to 300 points for ages 20–29.
     - English: competent 0, proficient 100, superior 200.
     - Experience: 0 to 100 points (8+ years).
     - Education: 25 to 100 points (PhD).
     - Victorian earnings: from AUD 80,000 (8 points) up to 150 points.
   - The weightings were reportedly updated for 2026–27, so the extract may mix old and new values.
   - **Computable?** Probably yes, once transcribed directly from the live VPT page. Not yet verified. Partner-skills and occupation-skill-level values were not captured.
6. **Published invitation data.** Not confirmed. No official invitation statistics were found in search. Victoria reportedly announces no round dates. [S] [FAQs](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/skilled-visa-faqs)
7. **Changes and contradictions.**
   - New 2026–27 ROI and nomination fees. [S]
   - 491 places not finalised. [S]
   - The 491 page may be older content. One extract describes it as dated. [S] [491 page](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/491)
   - **Conflicting place numbers.** 900 places for 190 is much lower than the 2025–26 federal allocation of 2,700 ([D] [Home Affairs](https://immi.homeaffairs.gov.au/what-we-do/state-and-territory-nomination-allocations)). That is plausible for an interim figure, but not confirmed.

---

## Australian Capital Territory (ACT)

Checked: 17 Nov 2026. **The site blocked automated fetches (HTTP 403). Every item is [S] and unverified.**

1. **Program status 2026–27.** Open, with **monthly invitation rounds** run against a pro-rata monthly allocation. [S] [Canberra Matrix invitation rounds](https://www.act.gov.au/migration/resources/canberra-matrix-invitation-round)
   - **12 October 2026 round:**
     - Canberra residents: 126 invitations for 190, 0 for 491 (critical-skill occupations).
     - Overseas applicants: 63 invitations for 190, 0 for 491.
     - Remaining 2026–27 places shown: 480 for 190, 249 for 491. [S] [same](https://www.act.gov.au/migration/resources/canberra-matrix-invitation-round)
   - **Allocation status conflicts.** The home page reportedly says the 2026–27 allocation "has not yet been finalised", and names 12 Nov 2026 as the next round. [S] [ACT Migration home](https://www.act.gov.au/migration/home)
   - Cohorts: Canberra residents and overseas applicants. [S] [ACT nomination pathways](https://www.act.gov.au/migration/skilled-migrants/act-government-nomination/act-nomination-pathways)
2. **Occupation list.** The "ACT Nominated Migration Program Occupation List" (formerly the Critical Skills List), published as a web page and a PDF. It is reportedly **last updated 10 October 2025**. [S] [list page](https://www.act.gov.au/migration/skilled-migrants/act-nominated-migration-program-occupation-list) · [list PDF](https://www.act.gov.au/__data/assets/pdf_file/0005/2931395/ACT-Nominated-Migration-Program-Occupation-List.pdf)
   - Whether it has separate resident/overseas or 190/491 columns: not confirmed.
   - Canberra residents who are majority owners of an eligible ACT business can claim small-business points instead of using the list. [S] [Canberra resident 190](https://www.act.gov.au/migration/skilled-migrants/190-nomination-criteria/canberra-resident-applicant-eligibility)
   - **Size:** not confirmed.
3. **Our 11 occupations.** Every cell is **not confirmed**. What the extract indicates: [S] [list PDF](https://www.act.gov.au/__data/assets/pdf_file/0005/2931395/ACT-Nominated-Migration-Program-Occupation-List.pdf)
   - **Indicated as listed:** 261111, 261312, 261313, 233211, 351311, 241411.
   - **254499:** unclear. Only specialised RN codes (for example 254418) were seen.
   - **221111:** not found.
   - **233512, 233311, 241111:** not determined.
   - Whether each listing covers 190, 491, residents or overseas: not determined.
4. **Eligibility rules.**
   - **Overseas 190:** [S] [Overseas 190](https://www.act.gov.au/migration/skilled-migrants/190-nomination-criteria/overseas-applicant-eligibility)
     - occupation on the ACT list
     - **3 years** of full-time, post-graduate work in the occupation within the last 5 years
     - **Proficient English or above**, except Chef 351311 and ANZSCO skill levels 3–5
     - an employment statement showing research into Canberra jobs
     - has not lived in Australia in the last 12 months, and holds no Australian visa other than a visitor visa
     - a commitment to live in Canberra for 2 years, and settlement funds
   - **Overseas 491:** **1 year** of experience in the last 5 years, with otherwise similar rules. [S] [Overseas 491](https://www.act.gov.au/migration/skilled-migrants/491-nomination-criteria/491-nomination-overseas-applicant-eligibility)
   - **Canberra residents:** minimum residence and work periods apply, but the **sources conflict**. The 491 page says 3 months of residence at Matrix submission; the February 2026 guidelines say 6 months. Newer guidelines dated 27 July 2026 are reported to exist. [S] [Resident 491](https://www.act.gov.au/migration/skilled-migrants/491-nomination-criteria/491-nomination-canberra-resident-applicant-eligibility) · [Guidelines Feb 2026 (PDF)](https://www.act.gov.au/__data/assets/pdf_file/0008/2992049/ACT-Nomination-Guidelines-Canberra-Resident-February-2026.pdf) · [Library – guidelines](https://www.act.gov.au/migration/resources/library-guidelines-and-invitations)
5. **Selection system.** The **Canberra Matrix**, a points-scored submission. Cut-offs depend on the monthly allocation, the date and time of submission, occupation caps and demand. Matrix submissions in critical sectors may be prioritised: care, education, construction, renewables, experience and advanced technology. [S] [Canberra Matrix](https://www.act.gov.au/migration/skilled-migrants/canberra-matrix) · [invitation rounds](https://www.act.gov.au/migration/resources/canberra-matrix-invitation-round)
   - **Overseas Matrix values from the extract, unverified:** [S] [Check your Matrix score – overseas](https://www.act.gov.au/migration/skilled-migrants/canberra-matrix/check-your-canberra-matrix-score-overseas-applicants)
     - Close family in Canberra: 20 (citizen or PR) or 5 (temporary visa).
     - English: superior 15, proficient 10. Partner's English: 5.
     - Occupation on the ACT list: 20.
     - Experience: 10 (3–5 years), 15 (5–8 years), 20 (8–10 years).
     - Previous Canberra residence: up to 20. ACT study: up to 20.
     - ACT job offer: 20.
     - ACT property ($250k) or business: 10.
     - Tertiary qualification: up to 20.
   - A separate calculator exists for Canberra residents. [S] [Check your Matrix score – residents](https://www.act.gov.au/migration/skilled-migrants/canberra-matrix/check-your-canberra-matrix-score-canberra-residents)
   - **Computable?** Likely yes, for both cohorts, once the two calculator pages are transcribed directly. Not verified here.
6. **Published invitation data.**
   - Per-round web page with invitation counts by cohort and visa, plus remaining allocation and a residence split of approvals. [S] [invitation rounds](https://www.act.gov.au/migration/resources/canberra-matrix-invitation-round)
   - A rankings PDF with **minimum Matrix score by occupation unit group**, split by cohort and visa (for example the 11 June 2026 round). [S] [2025-26 invitation round rankings (PDF)](https://www.act.gov.au/__data/assets/pdf_file/0009/2920554/2025-26-Invitation-round-rankings.pdf)
   - Whether a 2026–27 rankings PDF exists: not confirmed.
   - This is the best per-occupation cut-off evidence after WA and TAS, if verified.
7. **Changes and contradictions.**
   - Allocation reported as "not finalised" while remaining places are also shown. [S]
   - Conflicting resident residence period: 3 months vs 6 months. [S]
   - Occupation list dated October 2025, despite newer guidelines (July 2026). [S]
   - One extract cites other allocation figures (600/200) on the invitation page. [S]

---

## Tasmania (TAS)

Checked: 17 Nov 2026. **The site blocked automated fetches (HTTP 403). Every item is [S] and unverified.**

1. **Program status 2026–27.** Reopened to new ROIs on **17 August 2026**, with **2,050 nomination places** (1,250 for 190 and 800 for 491). Weekly invitations started on 20 August 2026. [S] [Program update – August 2026](https://www.migration.tas.gov.au/news/2024-25_program_open_to_rois) · [Summary of changes (PDF)](https://www.migration.tas.gov.au/__data/assets/pdf_file/0006/644352/2026-27-Tasmanian-Skilled-Migration-State-Nomination-Program-Summary-of-Changes-August-2026.pdf)
   - **Onshore pathways:** Tasmanian Skilled Employment (TSE), Skilled Graduate (TSG), Established Resident (TER) and Business Operator (TBO). [S] [TSE](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/tasmanian-skilled-employment-pathways-tse) · [TER](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/tasmanian-established-resident-pathways-ter) · [TSG](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/tasmanian-skilled-graduate-pathways-tsg)
   - **Offshore:**
     - 190 is limited to the **Overseas Applicant (health or education job offer)** pathway. [S] [190 overseas job offer](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-living-overseas/subclass-190-overseas-applicant-health-or-education-sector-job-offer-pathway)
     - **491 OSOP will issue no invitations in 2026–27**, because the Commonwealth is prioritising onshore processing. [S] [OSOP](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-living-overseas/overseas-skilled-occupation-profiles-osop-invitation-only-pathway)
2. **Occupation list.** There is no general state occupation list for onshore pathways. Instead:
   - 190 TSE "Priority Roles" require a matching skills assessment and a closely related job (same 3-digit ANZSCO group). [S] [190 TSE Priority Roles](https://www.migration.tas.gov.au/skilled_migration/subclass-190-tasmanian-skilled-employment-tse-priority-roles)
   - Occupational caveats apply, often that the employer must have operated in Tasmania for 3 years. Further caveat changes take effect on **1 Dec 2026**. [S] [Occupational caveats](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/additional_information,_exclusions_and_definitions/accordion/occupational_caveats_for_tasmanian_skilled_employment_pathway)
   - The overseas 190 pathway is limited to ANZSCO groups 241 (school teachers), 251, 252, 253 and 254 (nursing and midwifery). [S] [190 overseas job offer](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-living-overseas/subclass-190-overseas-applicant-health-or-education-sector-job-offer-pathway)
3. **Our 11 occupations.**
   - **Onshore:** not confirmed for all 11. Pathways appear broadly open, subject to caveats and to whether the occupation is a Priority Role.
   - **Offshore 190:** possible only with a Tasmanian job offer, and only for 254499, 241111 and 241411 (groups 254 and 241). It is not available for the other eight. The group list comes from a truncated extract and needs verification.
   - **Offshore 491:** no for all 11 (no OSOP invitations in 2026–27).
4. **Eligibility rules.**
   - **190 TSE:** [S] [190 TSE minimum requirements](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/tasmanian-skilled-employment-pathways-tse/accordion/190-tse-minimum-requirements)
     - Priority-role option: at least 9 months working in Tasmania, or 6 months for teaching or health.
     - Long-term option: at least 15 months.
     - Both: average of at least 20 hours a week, and at least the "priority income level" of **$57,000 a year or $28.85 an hour**.
     - The extracts conflict on the priority-option duration.
   - **491 TSE:** at least 12 months working in Tasmania (average 20 hours a week), currently living in Tasmania, and intending to stay in the industry for 2 years. [S] [491 TSE priority attributes](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/tasmanian-skilled-employment-pathways-tse/491-accordion/491-tse-priority-attributes)
   - **TSG:** lived in Tasmania for at least 2 calendar years from the start of the course, studying full-time and on site. [S] [TSG](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/tasmanian-skilled-graduate-pathways-tsg)
   - **Overseas 190:** [S] [190 overseas job offer](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-living-overseas/subclass-190-overseas-applicant-health-or-education-sector-job-offer-pathway)
     - a Tasmanian job offer of at least 30 hours a week, in the same 3-digit group as the skills assessment
     - an employer that has operated in Tasmania for at least 12 months
     - the applicant has not lived in another state in the last 12 months
     - a skills assessment and English test, each dated within 3 years
5. **Selection system.** ROIs are ranked by **priority attributes**. Points vary by pathway and subclass and sort ROIs into **Gold, Green, Orange and Orange-plus** passes. [S] [How to apply](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/how-to-apply) · [491 TSE priority attributes](https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/tasmanian-skilled-employment-pathways-tse/491-accordion/491-tse-priority-attributes)
   - Gold: can lodge a nomination application immediately.
   - Green: invited within about six months, subject to places.
   - Orange: may be invited.
   - **190 TSE examples from the extract:** Gold (1,000 points) for teaching or health with 6 months' work at the priority income level. Green (500) for more than 2 years in a matching job.
   - Several attributes were rescored for 2026–27. One example: 2 years' industry experience plus the priority income level dropped from 30 to 15 points for 190. [S] [Summary of changes (PDF)](https://www.migration.tas.gov.au/__data/assets/pdf_file/0006/644352/2026-27-Tasmanian-Skilled-Migration-State-Nomination-Program-Summary-of-Changes-August-2026.pdf)
   - **Computable?** Partly, for onshore users only. The attribute tables are published per pathway and visa, but the scoring is detailed and was rescored for 2026–27. It needs a direct transcription of every pathway's table. The cut-offs move with a rolling average (see item 6).
6. **Published invitation data.** A "Processing Times and Invitations Issued" news page, updated frequently (the extract suggests weekly). [S] [Processing times and invitations](https://www.migration.tas.gov.au/news/processing_times_and_allocation_usage)
   - It shows invitations per period by visa, the **lowest priority-attribute score invited**, and ROIs on hand. One recent extract: 28 invitations for 190 and 38 for 491, lowest scores 313 (190) and 71 (491), ROIs on hand 748 (190) and 608 (491).
   - The method was reportedly changed to a **six-week rolling average**. The "minimum to nominate" figures quoted (323 and 77) do not match the lowest-invited figures.
   - It is not split by occupation. Being onshore-only, it has no onshore/offshore split.
7. **Changes and contradictions.**
   - 2026–27 rescoring, the rename to "priority income level", and no OSOP invitations. [S]
   - Caveat changes on 1 Dec 2026. [S]
   - **Stale URL slug.** The program-update URL slug says "2024-25" but the content is reportedly the August 2026 update. [S] [link](https://www.migration.tas.gov.au/news/2024-25_program_open_to_rois)
   - Conflicting TSE durations (9 months vs "last nine months") and conflicting cut-off figures. [S]

---

## Northern Territory (NT)

Checked: 17 Nov 2026. **Both NT sites blocked automated fetches (HTTP 403). Every item is [S] and unverified**, except one [D] item noted below.

1. **Program status 2026–27.** **Effectively closed.** The NT reportedly "has now received sufficient applications" for 2026–27: [S] [NT Government visa nomination](https://theterritory.com.au/migrate/migrate-to-work/northern-territory-government-visa-nomination) · [new-domain equivalent](https://australiasnorthernterritory.com.au/move/migrate-to-work/nt-government-visa-nomination)
   - **No new 190 applications.**
   - **No offshore streams.**
   - **491 by exception only.** Onshore NT Graduate or NT Resident applicants qualify if they have a "visa deadline" before **30 September 2027**: a substantive visa expiring with no 485 option, turning 45, or a birthday that drops 491 points below 65.

   The date of the closure notice is not confirmed. One search extract flagged the cached page as old, and third-party sites cite an official update on 13 Oct 2026.
   - **Allocation:** not confirmed. Third-party sites quote 850 for 190 and 1,000 for 491.
   - A 2025–26 update page exists on the new domain. [S] [Update on NT GSM nomination applications for 2025-26](https://australiasnorthernterritory.com.au/move/migrate-to-work/nt-government-visa-nomination/update-on-nt-general-skilled-migration-nomination-applications-for-2025-26)

2. **Occupation list.**
   - The **NT Offshore Migration Occupation List** (NTOMOL) applies only to the offshore priority-occupation stream, and is split into A–F, G–O and P–Z pages. [S] [NTOMOL](https://australiasnorthernterritory.com.au/move/migrate-to-work/nt-government-visa-nomination/nt-offshore-migration-occupation-list)
   - Onshore streams reportedly have no NT list. Federal eligibility applies.
   - **Size:** not confirmed.
3. **Our 11 occupations.**
   - **190 (any cohort):** closed.
   - **Offshore:** closed.
   - **Onshore 491:** exception cases only.
   - For reference only (the stream is closed), the NTOMOL extract showed 351311 Chef as listed, and several specialised RN, teacher and engineer codes. 254499, 241411, 233211, 261313 and 221111 were not visible. All of these are not confirmed.
4. **Eligibility rules.** [S] [Eligibility](https://theterritory.com.au/migrate/migrate-to-work/northern-territory-government-visa-nomination/eligibility) · [Additional requirements for onshore applicants](https://theterritory.com.au/migrate/migrate-to-work/additional-requirements-for-onshore-applicants)
   - **NT resident 491:** at least 12 consecutive months living in the NT, plus at least 6 months of full-time NT work. No migrating dependants may live elsewhere in Australia.
   - **NT resident 190 (when open):** at least 2 consecutive years living in the NT and 2 years of full-time NT employment.
   - **Offshore (when open):** at least 2 years of post-qualification experience in the last 5. Streams are priority occupation, job offer and family. Offshore applicants are "generally" considered only for 491.
5. **Selection system.** Application-based assessment against criteria. There is no published points or ranking system. **Computable?** Not applicable. There is no state score to compute.
6. **Published invitation data.** None found. Not confirmed.
7. **Changes and contradictions.**
   - **Two official domains.** `theterritory.com.au` and `australiasnorthernterritory.com.au` both host NT nomination pages, and it is not confirmed which is canonical. [S]
   - **Stale official news.** A StudyNT post says the 491 program "is now open" for onshore and offshore applicants. It is dated **15 November 2023**, not 2026. [D] [StudyNT news (2023)](https://studynt.nt.gov.au/news/the-northern-territory-general-skilled-migration-gsm-program-is-now-open)

---

## Summary table (2026–27, as at 17 Nov 2026)

`[S]` = unverified search extract of the official page (site blocked to direct fetch). Everything else was read directly.

|             | 190 open?                                                    | 491 open?                                             | Occupation list?                                                 | Offshore allowed?                                    | Residence requirement                                                                                                                                        | Selection system                                                       | Computable state score?                          | Published invitation data                                                                                |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **ACT** [S] | Yes (monthly rounds)                                         | Yes, but 0 invitations in the Oct round               | Yes, one list (web + PDF, dated Oct 2025)                        | Yes (overseas cohort)                                | Overseas: not in Australia in last 12 months. Residents: 3 or 6 months (conflict)                                                                            | Canberra Matrix                                                        | Likely yes (calculators published); not verified | Per-round counts by cohort; min Matrix score by occupation group (PDF)                                   |
| **NSW**     | Yes (by invitation)                                          | **No.** Closed; no 2026–27 regional list              | Yes: 80 ANZSCO unit groups (190)                                 | Yes, after 6 months living offshore                  | Work in NSW 20+ hrs/week, OR 6 months NSW residence, OR 6 months offshore                                                                                    | Ranked within unit group (age, English, education, points, experience) | No (weights not published)                       | None found                                                                                               |
| **NT** [S]  | **No** (closed to new applications)                          | Onshore exceptions only (deadline before 30 Sep 2027) | Offshore list only (NTOMOL)                                      | **No** (offshore streams closed)                     | 491 resident: 12 months NT residence + 6 months full-time work. 190: 2 years                                                                                 | Criteria-based assessment                                              | Not applicable                                   | None found                                                                                               |
| **QLD**     | Yes (ROIs from 6 Nov 2026)                                   | Yes                                                   | Yes: separate onshore (~207) and offshore (~97) web lists        | Yes (offshore list; 1 year experience in last 3)     | Onshore: 9 of last 12 months living and working in QLD (190); 6 of 9 months in regional QLD (491); 3 months for B&C                                          | Own ROI selection (not primarily EOI points)                           | No                                               | None found                                                                                               |
| **SA**      | Yes (restricted onshore)                                     | Yes (restricted onshore)                              | Yes: ~351 occupations, per-stream onshore/offshore availability  | Yes (invited from EOI; 3 years experience in last 5) | 12 months living and working in SA (Skilled Employment); 6 months (Graduates); 9 months outer-regional. **Onshore ROIs only if visa expires by 31 Jan 2027** | Merit factors; onshore excludes EOI points, offshore includes them     | No                                               | 2025–26 counts by ANZSCO sub-major group; none yet for 2026–27                                           |
| **TAS** [S] | Yes (onshore; offshore only with health/education job offer) | Yes onshore; **no offshore invitations**              | No general list; Priority Roles and caveats                      | 190 only with a TAS health/education job offer       | 190 TSE: 9 (or 6) or 15 months' TAS work at $57k+. 491 TSE: 12 months                                                                                        | Priority attributes, Gold/Green/Orange passes                          | Partly (tables published; rescored for 2026–27)  | Frequent updates: invitations, lowest score invited, ROIs on hand                                        |
| **VIC** [S] | Yes (900 places)                                             | **No** (places not finalised)                         | No (all federally eligible occupations; priority industries)     | Yes (190)                                            | None stated for 190 (no minimum experience)                                                                                                                  | Victorian Points Test (ROI)                                            | Probably (VPT tables published); not verified    | None found                                                                                               |
| **WA**      | Yes                                                          | Yes                                                   | Yes: WASMOL Schedules 1–3 + Graduate list, 384 codes (web + CSV) | Yes (ranked after WA residents)                      | None required. WA residents (3+ months) prioritised. 190 Schedules 1–2: 6-month WA contract                                                                  | Ranked: sector tier, then residence, then EOI points, then EOI date    | Ranking tier yes; no state score                 | Monthly counts by stream/visa since 2024–25; last-invited points, date and residence by occupation (PDF) |

## Occupation eligibility table (11 occupations × 8 jurisdictions)

Cell format: **190 on / 190 off · 491 on / 491 off**, where "on" = onshore cohort and "off" = offshore cohort.

- Y = listed. N = not listed or not available.
- C = program or cohort closed.
- NC = not confirmed.
- (s) = only a search extract indicated this. Treat it as NC until verified.

Listing is not eligibility (see "How to read this").

| Occupation                      | ACT [S]           | NSW             | NT [S]                    | QLD               | SA                | TAS [S]                               | VIC [S]                 | WA                             |
| ------------------------------- | ----------------- | --------------- | ------------------------- | ----------------- | ----------------- | ------------------------------------- | ----------------------- | ------------------------------ |
| 261111 ICT Business Analyst     | NC (s: listed)    | 190 N/N · 491 C | 190 C · 491 on NC / off C | 190 N/N · 491 N/N | 190 Y/N · 491 Y/N | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 261312 Developer Programmer     | NC (s: listed)    | 190 Y/Y · 491 C | 190 C · 491 on NC / off C | 190 Y/N · 491 Y/N | 190 Y/N · 491 Y/N | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 261313 Software Engineer        | NC (s: listed)    | 190 Y/Y · 491 C | 190 C · 491 on NC / off C | 190 Y/N · 491 Y/N | 190 Y/N · 491 Y/N | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 221111 Accountant (General)     | NC (s: not found) | 190 N/N · 491 C | 190 C · 491 on NC / off C | 190 N/N · 491 N/N | 190 N/N · 491 Y/N | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 233211 Civil Engineer           | NC (s: listed)    | 190 Y/Y · 491 C | 190 C · 491 on NC / off C | 190 Y/Y · 491 Y/Y | 190 Y/Y · 491 Y/Y | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 233512 Mechanical Engineer      | NC                | 190 N/N · 491 C | 190 C · 491 on NC / off C | 190 Y/Y · 491 Y/Y | 190 Y/Y · 491 Y/Y | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 233311 Electrical Engineer      | NC                | 190 Y/Y · 491 C | 190 C · 491 on NC / off C | 190 Y/Y · 491 Y/Y | 190 Y/Y · 491 Y/Y | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 254499 Registered Nurses nec    | NC                | 190 Y/Y · 491 C | 190 C · 491 on NC / off C | 190 Y/Y · 491 Y/Y | 190 Y/Y · 491 Y/Y | 190 NC / NC (s: job offer) · 491 NC/C | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y (Schedule 1) |
| 351311 Chef                     | NC (s: listed)    | 190 N/N · 491 C | 190 C · 491 on NC / off C | 190 N/N · 491 Y/N | 190 N/N · 491 Y/N | 190 NC/N · 491 NC/C                   | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 241111 Early Childhood Teacher  | NC                | 190 Y/Y · 491 C | 190 C · 491 on NC / off C | 190 Y/N · 491 Y/N | 190 Y/Y · 491 Y/Y | 190 NC / NC (s: job offer) · 491 NC/C | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |
| 241411 Secondary School Teacher | NC (s: listed)    | 190 Y/Y · 491 C | 190 C · 491 on NC / off C | 190 Y/N · 491 Y/N | 190 Y/Y · 491 Y/Y | 190 NC / NC (s: job offer) · 491 NC/C | 190 NC (s: Y/Y) · 491 C | 190 Y/Y · 491 Y/Y              |

Sources for the table:

| Jurisdiction      | Source                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WA                | [CSV](https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv)                                                                                                                                  |
| NSW               | [Skills List](https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists) and [491 notice](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-work-regional-visa-subclass-491)                     |
| QLD               | [onshore](https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list) and [offshore](<https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)>) |
| SA                | [list](https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list); "on" means available in at least one onshore stream                                                                           |
| ACT, TAS, VIC, NT | the [S] pages cited in each section                                                                                                                                                                                             |

Two notes on specific cells:

- **WA "off"** means the occupation is listed and residence is not required. Offshore applicants are ranked below WA residents. For 190 in Schedules 1 and 2, they still need a WA employment contract.
- **SA onshore "Y"** is additionally gated by the 31 Jan 2027 visa-expiry condition.

---

## Gaps and risks

**Could not confirm (blocked or missing):**

1. **ACT, VIC, TAS and NT were not read directly.** Every claim for them comes from a search engine's extract, which can be stale, merged across pages or paraphrased wrongly. Someone must open each linked page in a normal browser (and connect the Claude in Chrome extension for future runs) and verify every [S] claim before it reaches users. This affects roughly half the document.
2. **2026–27 allocations.** The Home Affairs page still shows 2025–26. State figures quoted (VIC 900 for 190, TAS 2,050, ACT remaining places) are [S] and partly contradictory. NSW, QLD, SA and WA publish none.
3. **Occupation-level answers for ACT, TAS and NT.** These need direct reads of the ACT list PDF (October 2025, possibly superseded), the TAS Priority Roles and caveats, and the NTOMOL pages (closed anyway).
4. **Scoring tables.** The VPT, the Canberra Matrix (both cohorts) and the TAS priority attributes all need verbatim transcription from the live pages. All three changed or may have changed for 2026–27. Do not build a calculator from the [S] values in this file.
5. **VIC 2026–27 priority industries and the opening date** were not found.
6. **NSW 491** has no 2026–27 regional list, and the closure notice has no year. It is unclear whether the program will reopen in 2026–27.
7. **Federal eligibility of the 11 occupations** for 190 and 491 was assumed, not re-checked.

**Changes often (re-check on every data refresh):**

- Program open or closed notices: NSW 491, NT, VIC 491, the SA onshore gate (visa expiry by 31 Jan 2027), and the QLD ROI window.
- Occupation lists: WA (also new Schedule 3, added 13 Nov 2026), QLD onshore/offshore, SA per-stream availability, NSW unit groups, TAS caveats (changing 1 Dec 2026).
- Invitation evidence:
  - WA monthly tables and last-invited PDFs (new filenames each month)
  - ACT monthly rounds
  - TAS cut-offs (rolling six-week average)
  - SA invitation posts (none yet in 2026–27)

**Contradictions on official pages (do not resolve by guessing):**

- **WA ranking order:** sector first (web FAQ) vs residence first (October 2026 PDF). Stale 2025–26 criteria links also remain on the SNMP page.
- **SA priority sectors:** "defence" vs "trades" in different places. The Outer Regional page still says 2025–26.
- **NSW FAQ:** updated 16 Nov 2026 but still says "2025-26 program year".
- **ACT [S]:** allocation "not finalised" vs remaining places shown. Resident residence period: 3 vs 6 months.
- **TAS [S]:** TSE duration wording, and cut-off figures that do not match.
- **NT:** two official domains, and a stale 2023 "now open" post on StudyNT.

**Before showing users, Landfall must:**

1. Re-read every source in this file on the day the rules are curated, and record that date per rule.
2. Show "Not open to you now" for NT 190, NT offshore, NSW 491, VIC 491 and TAS offshore 491, unless the live pages say otherwise.
3. Never present WA last-invited points, ACT minimum Matrix scores or TAS lowest-invited scores as a prediction. They are past cut-offs only, and WA explicitly excludes caps from them.
4. Keep federal points separate from VPT, Matrix and TAS priority-attribute scores. Do not label any state score "points" without naming the system.
5. Treat SA and QLD occupation listings as necessary, not sufficient. Both select on unpublished factors, and SA onshore is gated by visa expiry.
