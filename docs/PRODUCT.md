# Landfall product direction

> **Brand note (18 November 2026).** The product is now called **MigrateLens**; "Landfall" below is the old working name. The look described under "First release design" is superseded by the brand and homepage spec, `docs/superpowers/specs/2026-11-18-migratelens-brand-and-homepage-design.md`.

> **Superseded in part.** As of 17 November 2026, `docs/STRATEGY.md` holds the founder's decisions and the approved roadmap. Where the two conflict, it wins. Examples: history-based outcome counts are now allowed, and SEO occupation pages come before monetisation.

17 November 2026. SPEC.md and the HTML files in the parent directory are exploratory context. RESEARCH.md records the evidence informing this direction.

## Outcome

Build a useful, trustworthy paid product that can become a sustainable second income. First demonstrate personal value with a working free check. Evaluate purchases and acquisition costs before expanding operational scope.

## Phases

1. **Useful first release (this implementation):** editorial homepage with interactive real-data pool explorer; multi-step points check; personal age/expiry timeline; generated free report; sourced state overview; readable sample and methodology. Browser-local opt-in saved progress. No personal data submitted to a server. A private review deployment.
2. **First sales:** audited imports; protected report storage; checkout and payment webhooks; transactional email; generated PDFs; legal review; clear support/refund terms; explicit delivery and refresh entitlements. Acceptance: a real purchase delivers a reproducible, private report reliably.
3. **Repeat value:** snapshot-triggered report versions, change summaries, opt-in alerts and reminders, timestamped forward predictions and public accuracy measures. Acceptance: each refresh can explain exactly what changed and why.
4. **Growth:** occupation pages, search traffic, referrals and agent partnerships, prioritised by conversion, customer usefulness and support cost.

Phases are outcome gates, not calendar promises. Do not take payments until paid delivery, legal review and data-quality gates are met.

## First release design

_Superseded: the brand, colours and type are now set by the MigrateLens brand and homepage spec (see the note at the top)._

Use Landfall as a replaceable working name. Warm off-white, forest ink, mint accents, sans-serif hierarchy with editorial serif accents, Mantine controls and Motion interactions. See DESIGN.md for the v0.2 design approach. Desktop header with product navigation and a simple mobile menu. The page explains value through a working occupation/points explorer, pathway distinctions, a sample timeline and a readable sample report.

The check groups input into four steps: profile; English and education; experience and other points; review. Results update as input changes. Required inputs are validated before a full report is shown. Date-only calculations use UTC calendar components; the browser's local calendar date determines today. No personal profile in a URL. Persistence is optional and clearable.

The generated report contains points by category, conditional nomination totals, real credential scenarios, current three-visa pool comparisons, twelve monthly 189 totals, six official invitation rounds, a personal timeline, state summaries, occupation comparisons, a preparation checklist and glossary. REPORT-COVERAGE.md records the original reference comparison. It never invents wait times, exact same-score ranks, probabilities, testimonials, completed purchases or live subscriptions. A browser print view is available; a downloadable paid PDF is a later phase.

## Architecture

Next.js App Router and TypeScript. Static export for the private first-release deployment; later add server features without replacing the component or computation boundaries. Versioned pure points/date functions are separate from UI. A checked-in source snapshot preserves masked counts as intervals. No database, secrets or third-party analytics is needed for this release.

## Verification

Test points thresholds, caps, missing inputs, date boundaries, English expiry, assessment maximum validity and timeline ordering. Test pool interval arithmetic. Run TypeScript and production build. Review desktop and mobile layouts and exercise the check, report, state filtering, persistence and print controls in a browser.
