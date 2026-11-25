# Task 5 report
Implemented: scripts/social/compress.ts (quantise, checkLimits, SetManifest, limits), scripts/updates/retention.ts (retentionPlan + CLI, `updates:retention`), render.ts (quantise each PNG, checkLimits before any write, writes set.json), jobs.ts (setManifest, manifestPath), .prettierignore (public/social/), scripts/README.md.
Rulings: R11 (only retention prunes; every og.png kept incl. round-*), R12 (prettierignore) followed.
Measured (2026-10, local render): largest image 134 KB (month cover/story dark; before quantising two were 312/320 KB); round set 0.8 MB; month set 1.2 MB. Visual check of month cover-dark: no visible loss.
Tests: compress.test.ts (7) and retention.test.ts (4) pass; npm run check: 175 files, 1784 tests passing.
Notes: retention keeps the 3 newest month folders <= latestMonth (default newest folder); month-set total counts its og.png. manifest `file` is repo-relative. Local renders left untracked in public/social/ (not committed; delete or leave for Task 6). `npm run build` not run (no app code touched).
