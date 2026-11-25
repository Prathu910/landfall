# Monthly SkillSelect update: mockup notes (24 Nov 2026)

Throwaway spike. Nothing under `src/` changed; no commits. Gallery: `index.html` (serve this folder: `python3 -m http.server 3031 --bind 127.0.0.1 --directory .superpowers/brainstorm/round-recap-2026-11-24`).

## Files

- `index.html`: gallery for the founder.
- `page/updates-2026-10.html` + `page.css`: recap page mockup (header button toggles light/dark; `?theme=dark|light` forces one).
- `instagram/card.html` + `card.css`: one page renders every card: `?card=cover-a|cover-b|189-a|189-b|190|491|spot|close&size=feed|story&theme=light|dark`.
- `instagram/*.png`: 8 feed cards light, 4 dark (cover A, cover B, 189 A, 190), 3 stories (cover A light/dark, 189 A light).
- `screens/recap-{1280,390}-{light,dark}.png`: full-page screenshots (390 at 2x).
- `data/extract.py` → `data/figures.json` and `figures.js` (`window.FIG`). Every number on the mockups is read from `FIG` at render time.
- `render.mjs`: puppeteer-core + local Chrome (same approach as `scripts/og-image`), needs the server on :3031. `node .superpowers/brainstorm/round-recap-2026-11-24/render.mjs [filter]`.
- `assets/`: copies of the site fonts (Archivo variable, Big Shoulders Stencil 900), guilloche SVGs, the homepage atlas geometry, shared `brand.css` (tokens copied from `globals.css`) and `lib.js` (stamps, map, formatting).

## Every number and its source

Sources: **(D)** `src/data/` snapshot `skillselect-2026-10-31` (SkillSelect EOI dashboard, as at 31 Oct 2026, checked 17 Nov 2026). **(R)** `src/data/rounds.json`. **(H)** the Home Affairs invitation rounds page as recorded by our importer on 17 Nov 2026 (`scripts/import/__fixtures__/invitation-rounds.html`). **(L)** `src/data/state-rules/federal-occupations.json` (checked 23 Nov 2026).

### 189 round
| Figure | Value | Source |
|---|---|---|
| Round date | 15 Oct 2026 | R, H |
| EOIs invited, 189 | 20,000 | H ("Total EOIs Invited") |
| Occupations listed | 159 (161 table rows; Medical Diagnostic Radiographer and Medical Laboratory Scientist appear twice) | R |
| Previous round | 4 Jun 2026, 140 occupations | R |
| Lowest score invited, by occupation | 65: 44 · 70: 36 · 75: 9 · 80: 36 · 85: 19 · 90: 10 · 95: 3 · 100: 2 | R |
| Change since 4 Jun (occupations in both) | 78 fell, 9 rose, 50 same; 22 newly listed, 3 dropped (Fitter and Turner, Organisational Psychologist, Thoracic Medicine Specialist) | R |
| Biggest falls | Welfare Centre Manager 85→65; Airconditioning and Refrigeration Mechanic, Arts Administrator or Manager, Automotive Electrician, Boat Builder and Repairer, Cabinetmaker 80→65 | R |
| Biggest rises | Clinical Psychologist 75→90; Child Care Centre Manager, Natural and Physical Science Professionals nec, Psychologists nec, Secondary School Teacher, Social Worker +5 | R |
| Tie-break dates | per occupation, e.g. Registered Nurses nec 19 Nov 2025; Early Childhood (Pre-primary School) Teacher 22 Jul 2026; ICT Security Specialist 8 Nov 2024 | H |
| Notable table (largest 189 pools listed) | Early Childhood Teacher 90 / pool 13,693 / at least 198 invited; Registered Nurses nec 70 (Jun 75) / 4,280 / 2,730; ICT Security Specialist 100 / 3,097 / under 20; Secondary School Teacher 80 (75) / 2,703 / 243; Electronics Engineer 95 / 2,700 / 96; University Lecturer 90 / 2,184 / 252; Construction Project Manager 80 / 2,118 / 378; Social Worker 80 (75) / 1,442 / 171; Chemical Engineer 85 / 1,290 / 203; Registered Nurse (Aged Care) 70 (75) / 1,138 / 846 | R, H, D |
| Large pools on the 189 list, not listed in the last 4 rounds (last listed 7 Nov 2024) | Chef 10,773 (85); Software Engineer 9,464 (95); Civil Engineer 8,702 (85); ICT Business Analyst 7,774 (95); Mechanical Engineer 7,501 (85); Accountant (General) 6,992 (95) | D, R, L |

### National totals (sum across occupations within one visa and one month; masked cells kept as 0–19)
| | 30 Sep 2026 | 31 Oct 2026 |
|---|---|---|
| 189 pool (SUBMITTED) | 181,076–182,254 | 166,555–167,904 (shown as "~167,000") |
| 189 INVITED | 0–285 ("under 286") | 14,876–16,643 ("at least 14,876") |
| 190 pool | 400,515–402,358 | 403,175–405,056 |
| 190 INVITED | 26–1,014 | 7,017–9,867 |
| 491 pool | 435,683–438,115 | 439,657–442,127 |
| 491 INVITED | 0–1,368 | 2,625–5,342 |

189 pool change: down 13,172–15,699 (interval difference). 190/491 pool changes are under 2%.

### 189 pool by points, 31 Oct 2026 (D, summed `pool.189.byScore`)
40: 21–1,256 · 45: 328–2,152 · 50: 1,668–3,644 · 55: 5,270–7,113 · 60: 11,086–12,758 · 65: 28,957–30,401 · 70: 31,203–32,495 · 75: 27,610–28,731 · 80: 20,959–21,985 · 85: 17,004–17,916 · 90: 11,297–11,905 · 95: 5,365–6,030 · 100: 1,852–2,194 · 105: 119–423 · 110: under 172.

### 190 and 491 INVITED by nominating state, 31 Oct 2026 (D, `stateInvited`, sum over occupations and scores; shown as the floor, "at least")
| | ACT | NSW | NT | QLD | SA | TAS | VIC | WA | Not recorded (ANY) |
|---|---|---|---|---|---|---|---|---|---|
| 190 | 62 | 790 | 46 | 504 | 244 | 28 | 1,018 | 705 | 243 |
| 491 | 34 | 141 | 22 | 86 | 121 | under 20 each | 232 | 260 | 101 |

Hidden (<20) cells behind those floors, 190: ACT 166, NSW 323, NT 123, QLD 242, SA 230, TAS 194, VIC 284, WA 332. On 30 Sep 2026 every state's 190 and 491 cells were `<20` (all floors 0).

Home Affairs nominations 1 Jul–30 Sep 2026 (H, copied as published): 190 ACT <5, NSW 11, NT 188, Qld 7, SA 0, Tas 271, Vic 0, WA 17; 491 ACT <5, NSW 0, NT 208, Qld <5, SA 0, Tas 96, Vic 0, WA 120.

### Spotlight: Registered Nurses nec (254499) (D, R, H)
Last six 189 lowest scores: Sep 24 75, Nov 24 70, Aug 25 80, Nov 25 75, Jun 26 75, Oct 26 70. Tie-break 19 Nov 2025. 189 INVITED 2,730 (Sep `<20`). 189 pool 4,280 (Sep 7,500). 190 INVITED floors on 31 Oct: VIC 337, NSW 327, QLD 260, WA 253, SA 124.

### Pool movers 30 Sep → 31 Oct (189, exact counts only)
Registered Nurses nec 7,500→4,280; Registered Nurse (Aged Care) 2,041→1,138; Carpenter 1,464→665; Registered Nurse (Medical) 1,671→1,083; Solicitor 732→154; Painting Trades Worker 1,480→944.

## Data caveats hit

1. **Round totals per occupation aren't published**, only the overall 20,000 and each occupation's lowest score and tie-break date. The "holding a 189 invitation" column is the dashboard's INVITED stock on 31 Oct, a minimum (EOIs that lodged by then have left INVITED; 14,876+ vs 20,000 issued).
2. **State figures are wide.** Summing hundreds of masked cells gives ranges like NSW 190 790–6,927. Only the floor is meaningful, so the cards say "at least" and the page adds "+ N hidden small counts". This is the main honesty/readability tension.
3. **Two state measures disagree on sight.** Home Affairs' nominations table to 30 Sep shows Vic 0 and NSW 11 for 190, while the dashboard shows at least 1,018 and 790 holding a 190 invitation on 31 Oct. Consistent with states starting the 2026–27 year in October, but the page labels the table "a different measure" rather than explaining it.
4. **Multi-visa EOIs.** Electronics Engineer shows 78 invited in SA for 190 (at 100 points) and 78 for 491 (at 110), i.e. probably the same EOIs. Visas are never added together; it's noted in the page cautions.
5. **Pool changes aren't new interest.** The 189 pool fall matches invitations moving EOIs out, but the data doesn't say which EOIs left why, so the copy states both numbers without claiming a cause.
6. **TAS 491:** every occupation cell is `<20`, shown as "under 20 each", never 0.
7. **No date for the next round** is in our sources, so the FAQ doesn't guess one.

## Proposed URL

`/updates/2026-10/` (index at `/updates/`). Keyed by the data month (matches the snapshot id, sorts, never ambiguous); a round-day post can go live at the same URL with the round only, then gain the 190/491 and pool sections when the monthly dashboard data lands. Keywords ("SkillSelect October 2026", "189 invitation round") go in the title, H1 and meta description rather than the slug. Alternative if SEO wants words in the slug: `/updates/skillselect-october-2026/`.

## Open design questions

1. Direction A (passport page) or B (big stamp) for Instagram, or B for the cover and A for the data cards?
2. Keep "at least N" for state numbers, or show state order only (most to fewest) to avoid minimums that look small?
3. One page per data month (proposed) or one per round?
4. Spotlight: rotate occupations, follow the biggest mover, or let followers vote?
5. Should the page carry Dataset + FAQPage JSON-LD and an OG image built from the 189 card (cheap reuse)?
