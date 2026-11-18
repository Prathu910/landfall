# Task 3 report
Implemented: logo.tsx (+css, geometry consts MARK_RING/MARK_BARS/FAVICON_MARK), favicon icon.svg, header (Sample report/States/Method + "Check my points" CTA, drawer kept), footer (dark ink, reversed logo, verbatim disclaimer, "as at October 2026" via loadManifest in the Server Component), metadata, 404, methodology, report, state-rules comments renamed.
TDD: RED = no-old-name failed listing 13 files, logo test failed on missing module; GREEN = 5 tests pass. npm run check: 60 files/681 tests pass; build passes; grep -ril landfall out empty.
Screenshots: screenshots/task3-{header,footer}-{1440,390}.png, task3-drawer-390.png (no horizontal overflow at 390).
Notes: localStorage key renamed landfall-profile-v1 -> migratelens-profile-v1 (existing opt-in saves in preview browsers are orphaned). no-old-name test allowlists the preview host in metadataBase. Footer restyled dark. Home hero/report eyebrow now "THE MIGRATELENS PERSPECTIVE".

## Fix report (B3)
Added src/lib/profile-storage.ts (+test, RED: module not found, then GREEN 5 tests). check-flow migrates before load and Clear uses clearSavedProfile. no-old-name allowlists only that module file. Brand takes `reversed`, footer reuses it; dead `href !== "/"` branch dropped. format:check, npm run check (61 files, 686 tests), build pass. `grep -ril landfall out` now matches only the check page JS chunk, which holds the legacy key string (expected).
