# Premium iteration checkpoint (v0.2)

17 November 2026. `npm test`: 47 passing tests; `npm run typecheck`: passed; `npm run build`: passed; `npm audit --omit=dev`: zero reported vulnerabilities. Original SPEC and reference HTML copies compare byte-for-byte with the parent originals.

Production browser checks cover searchable occupations, keyboard slider, landing-page feature tabs, validation, calendar selection, the four-step check, score/scenario changes, three visa pool controls, bounded chart input, checklist, glossary, editing, optional saving, restoration and clearing. Review identified and corrected SVG title hydration, unbounded chart work, collapsed print content and expired-evidence scenario gaps. See HANDOFF.md for the remaining visual QA and deployment work.

The verification below records the earlier v0.1 baseline; its mobile checks should be repeated for the redesign.

---

# First release verification

17 November 2026. Verified the static production output, not only the development server.

- `npm test`: 36 passing domain tests across migration rules/timeline and masked pool arithmetic.
- `npm run typecheck`: passed.
- `npm run build` through the Sites build helper: passed; static export includes home, check, sample, state overview, methodology and not-found pages.
- `npm audit --omit=dev`: no reported vulnerabilities.
- Independent spec review: passed after correcting unsupported-occupation Professional Year handling and adding report-contained state summaries.
- Independent quality review: passed after correcting hidden Professional Year date validation and the missing 18th-birthday gain event.

## Browser checks against production export

Playwright with installed Chrome, desktop 1440×960 and mobile 390×844:

- Homepage occupation selection and point-stepper interactions.
- Empty-profile validation and sample-answer entry.
- Full four-step check to generated report.
- Hidden future Professional Year date no longer blocks advancement when the category is unchecked.
- Report contains all eight sourced state summaries.
- Edit answers returns to review.
- Explicit local-saving consent, saved-profile restoration after reload, and removal through clear.
- Mobile navigation, state scoring filter, search, no-results message and reset to all eight jurisdictions.
- Methodology FAQ expands correctly.
- Homepage and sample report have no horizontal overflow at mobile width.
- Print media hides site navigation and uses the report stylesheet.
- No JavaScript page errors during the final mobile/route/print flow.

Screenshots are in ignored `output/playwright/`. A stale Turbopack development bundle was discovered during the first regression check. Final browser checks were repeated against the freshly built static export, and the development script now uses webpack consistently with production.

## Limits

Browser print styles were checked, but a paid PDF worker, email delivery and payment flow do not exist in this phase. No claim is made about production load capacity, every possible migration profile, complete state eligibility, legal approval, or full WCAG/Lighthouse certification. Source-specific automation and commercial-launch reviews remain phase 2 work.
