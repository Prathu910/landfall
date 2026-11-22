# Task 11 report
Added LABEL_PAIRS + tests (AA on bg and white; globals.css mirror; font tokens), tokens in :root, fonts in layout.tsx (archivo wdth.css, big-shoulders latin-800/900; import specifiers omit ".css" because the package exports map appends it).
RED: 2 failures (competitive 4.27 < 4.5; tokens missing). GREEN: npm run check (1146 tests) and npm run build pass.
Contrast changes: competitive ink #A06400 -> #996000 (4.57 on bg); long-wait ink #C2410C -> #BE3F0B (4.54). All others pass as given.
