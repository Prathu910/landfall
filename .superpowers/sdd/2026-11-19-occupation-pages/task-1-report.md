# Task 1 report
Implemented src/lib/site.ts, src/lib/occupation-page/slug.ts + slug.test.ts, and layout.tsx now uses metadataBase from SITE_URL and the SITE_INDEXABLE robots switch (other metadata kept; the old metadataBase placeholder host was replaced as the brief says).
Tests: slug.test.ts 5 passed; npm run check passes (74 files, 779 tests). Build not run (no routes touched).
TDD caveat: tests and implementation were written together; the RED run was not observed separately.
Commit trailer uses "Claude Sonnet 5.5" per the session attribution rather than the contract's "Opus 5.5".
