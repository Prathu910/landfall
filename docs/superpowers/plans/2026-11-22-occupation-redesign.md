# Occupation directory and detail redesign

22 November 2026. Founder authorized development via subagent, continuing the approved Direction A+ visual identity without another brainstorming round.

## Goal and visual contract

Bring `/occupations/` and all generated occupation detail pages into the same premium family as the current homepage, points check and shared shell. Use ink, sage, white paper, Archivo, restrained passport linework and polished Mantine interactions. Make the occupation and its Australian 189/190/provisional 491 context clear immediately. Lead with a useful evidence summary, then progressively reveal supporting detail. Graphics explain actual data rather than decorate it. Keep small-screen use a priority.

## Scope and ownership

Own `src/app/occupations/*`, including `[slug]/page.tsx` and its CSS, and `src/components/occupation/*`. Add focused occupation-only UI/view-model files as needed; keep domain calculations unchanged unless a necessary fix is proven and communicated. Reuse approved tokens/components where suitable. Add new named root tokens only when needed; coordinate any shared component, global stylesheet, brand-palette or home-control changes with the parent first. No homepage, check, report, shell, state-page, feedback/backend or AI changes. Preserve all existing dirty work and original prototypes. Work on the existing `roadmap/report-redesign` branch; no commit, checkout, merge, push or deployment.

## Implementation checklist

- [x] Read AGENTS.md, STRATEGY.md, ENGINEERING.md, CLAUDE.md, occupation SEO spec/ledger, current directory/detail components and relevant local Next.js 16 documentation. Establish baseline checks.
- [x] Redesign the directory with an explicit Australian migration context, polished accessible occupation search, useful result hierarchy, codes, relevant availability states and clear links. Preserve the server-rendered link directory and existing search behavior/keyboard access. Do not invent rankings, popularity or metrics.
- [x] Redesign the shared detail template: clear occupation/code/date/breadcrumb, dated evidence summary, premium visa/points controls, readable pool visualization, recent 189 round cards, cohorts when available, state nomination evidence, related occupations, FAQ and a prominent occupation-prefilled points-check action. Avoid generic repeating cards and large text walls.
- [x] Replace or locally restyle the older occupation try-it presentation with a scoped premium component if needed, preserving current query/profile handoff behavior and evidence provenance. Do not alter the homepage/check controls globally.
- [x] Preserve static exports, slug set and URL paths, metadata/canonicals, original noindex behavior, sitemap inclusion, typed escaped JSON-LD and FAQs. Render core explanatory content and tables as HTML at build time; keep client components as small interactive leaves and pass only their required occupation slice.
- [x] Preserve data honesty: masked intervals remain ranges; missing is not zero; EOIs are not people; national 189 differs from state nomination; list membership/evidence is not eligibility. Identify 491 as provisional. No AI calls or fabricated chances/wait times. Keep official sources, snapshot month and checked date visible.
- [x] Verify built HTML SEO parity and internal links. Browser-check directory, a rich occupation, a sparse/masked occupation, a not-currently-invited case and appropriate missing/empty states. Test widths 1440/1024/901/820/390/360/320, keyboard, touch, reduced motion, search/no-match, tabs, disclosures, chart text alternatives and prefilling the check. No clipping, small text, inaccessible tables or horizontal document overflow.
- [x] Run `npm run check` and `npm run build`; obtain independent spec review followed by independent code-quality review, fix material findings, then repeat affected verification. Use meaningful domain/contract tests only where logic changes; do not add implementation-mirroring CSS tests.
- [x] Write `docs/OCCUPATION-REDESIGN-HANDOFF.md` with changed files, design rationale, exact check results, SEO preservation evidence, representative paths, screenshots and limitations. Update this checklist. Parent owns main HANDOFF/STRATEGY.

## Acceptance

Directory and all occupation details share the approved visual identity, remain useful and legible on phones, preserve search discoverability and honest published evidence, and pass repository checks. Founder can review actual local pages before deployment. State and supporting-page redesigns remain separate.
