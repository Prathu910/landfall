# Binding constraints (verbatim from plan)

Spec: docs/superpowers/specs/2026-11-17-reality-check-and-state-outlook-design.md (sections 4, 5, 6 + resolutions + founder decisions). Research: docs/research/state-nomination-2026-27.md


- Follow `docs/ENGINEERING.md`. `npm run check` (0 warnings) and `npm run build` must pass at the end of every task. `src/lib` and `scripts` use relative imports. CSS-module selectors always contain a local class.
- Copy rules (spec §7) apply to every new string. Use `BANNED_COPY` and the helpers in `src/lib/report/copy.ts`; don't duplicate them. Never write "best", "should", "apply to" or "likely to be invited". Group labels describe **evidence**:
  - "Strongest evidence"
  - "Worth watching"
  - "Needs your answers"
  - "Not yet verified"
  - "Not open to you now"
- **Founder decision (17 Nov 2026):** ACT, VIC, TAS and NT rules are not browser-verified, so their tiles show "Not yet verified" with their published evidence still visible. Any rule sourced only from a search extract (`[S]` in the research) has `verification: "secondary"` and never decides eligibility.
- **Every rule** carries `source` (URL), `checkedAt` (YYYY-MM-DD) and `verification: "verified" | "secondary"`. A rule with `checkedAt` more than 60 days before the report's `asOf` is treated as unverified at render time. A build-time warning (not a failure) lists rules more than 45 days old. Tests use fixed dates and never the real clock.
- **Streams are modelled:** a state passes for a visa if any of its streams passes, and the panel names that stream. The cohort is one of `living-in-state`, `living-in-other-state` or `offshore`, derived from the profile's `onshore` and `state` answers.
- **Federal eligibility** comes only from the imported official list. EOI counts are never used as a proxy. An occupation that is federally ineligible for a visa is "Not open to you now" in every state for that visa. If the federal list is unavailable, all tiles are "Not yet verified".
- **Evidence:** reuse `stateEvidence(core, visa, state, score)` from `src/lib/data/state-evidence.ts`. "Strongest evidence" requires `peak.invitedAtLeast.min > 0` at or below the user's score within the last 12 calendar months. "Any state" invitations are shown separately and never change a state's group.
- **"Not advice to apply. Rules change; check the official page."** appears in every state panel.
- **Profile data stays in the browser:** opt-in saving, clearable, never in the URL. New optional profile fields must not break restoring previously saved profiles: missing means unanswered.
- **Printing** shows both visas' grids and every state panel, expanded. Animations respect reduced motion.
- **Network:** only importer fixture capture and the import runs may use it. Tests never do. If an official source blocks automated access (HTTP 403, a login wall, or JS-only data), stop that importer and report BLOCKED with evidence. Do not work around blocks.

