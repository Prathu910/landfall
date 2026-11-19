# Task 9 report
Commits: 099c97f docs; 5a15dfa sweep (next/link, 5 dead classes); 6d10ca6 badge 12px fix.
Docs: CLAUDE.md (name, og:image command, ink palette, Brand + Homepage bullets), AGENTS.md (heading), ENGINEERING.md (brand tokens + focus-ring-on-dark, 12px floor + B1, rehearsal gate), HANDOFF.md (resume point + follow-ups), REPORT-COVERAGE.md (Worth watching is slate).
Sweep: next/link in three-questions/home-faq-list; removed .button-small, .button-outline(+hover), .page-panel, .two-columns (2 rules), .main-nav.is-open (all had no users). toPoolOccupation: test-only, left, noted in HANDOFF.
Browser (headless Chrome CDP vs out/, 1440 and 390; /, /check/, /sample/, /states/, /methodology/, 404): overflow 0 everywhere; no console errors (404 page only logs the expected 404s; one transient python-server ERR_CONNECTION_RESET once, not reproducible).
Found + fixed: Mantine Badge "Optional" on /check/ step 3 rendered at 10px (inline size var beat --badge-fz); now !important 12px.
Sub-12px: none outside the demo. Demo (aria-hidden): fs 17px x scale 0.826 = 14px steady; one probe at 1440 / read 11.58px on one element, an in-flight animation scale (not reproduced steady; B9 measured min 12.07 earlier).
AA on /sample/ (computed): strongest 7.44; worth watching (slate) 7.21; needs answers/not verified muted on ECE7DC 7.61; not open 6.55 (7.31 note); muted body 8.1-8.9; eyebrow 5.0; accent button 5.32; all pass.
/check/ walk at 390 (example answers, steps 1-4, report): no overflow, no sub-12px, no errors.
B4: `grep -ril landfall out --include=*.html` is NOT empty: 8 files, solely the preview host landfall-migration-report.cappedpike4.chatgpt.site (metadataBase/og:image; must stay until launch, allowlisted in no-old-name test). No brand text.
Screenshots: screenshots/task9-sample-outlook-1440.png, -390.png, task9-check-report-390.png.
npm run check: 737 tests, 0 warnings; npm run build OK. Server stopped.
Not checked: Safari/Firefox/touch.
