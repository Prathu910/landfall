# AI roadmap

Updated: 22 November 2026. Founder decision: launch with the report summary only; defer the additional AI features to upcoming releases.

## Current release: Our read

The rules engine calculates points, visa labels, estimated waits and improvement scenarios. AI may word the resulting facts into a short summary. A deterministic template remains available when AI is disabled, unavailable or fails validation. AI enablement still requires the backend setup and usage controls recorded in HANDOFF and OPERATIONS-BACKEND.

Existing proposed triggers after enablement: opening a personal report with a valid submission token, and changes to the computed report facts. Scrolling, chart tabs, evidence expansion and PDF download do not need AI calls. Sample reports currently use templates. Cache explanations by report facts in a future iteration; prefer an explicit refresh after grouped changes.

## Upcoming releases

| Feature                | Trigger                                                | Intended value                                                                                               |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Explain my result      | User requests an explanation beneath the outlook stamp | Explain the label, its evidence and the uncertainties in plain language.                                     |
| Compare improvements   | User selects changes and presses Compare               | Explain the difference between the current and recalculated scenarios. Code calculates both scenarios first. |
| Explain a state result | User requests detail for a state                       | Summarise verified requirements, blockers and rules not yet verified.                                        |
| Ask about this report  | User asks a report-specific question                   | Answer from that report and dated supporting evidence, acknowledging missing information.                    |

Suggested order when revisited: Explain my result and Compare improvements first; state explanations and a bounded question box afterwards. No additional AI feature is included in the current launch scope.

## Shared requirements

- Points, labels, state checks and estimates remain deterministic computations.
- Explanations use the report facts and evidence; unsupported claims are rejected or omitted.
- Restrict the personal information sent to the provider to the approved facts contract.
- Add durable per-submission usage counting, measure real token usage and latency, and retain the fallback.
- Keep API credentials server-side. Reopening identical explanations and downloading PDFs should reuse existing text.
