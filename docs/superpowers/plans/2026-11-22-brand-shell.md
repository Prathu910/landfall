# Shared brand and site shell implementation

22 November 2026. Founder authorized implementation via subagent, continuing the approved Direction A+ identity without another brainstorming round.

## Goal

Replace the older Data Desk logo, favicon, header and footer with a coherent premium identity that belongs beside the approved passport/map homepage and points-check flow. Preserve the MigrateLens name and keep the site easy to navigate. This assignment ends at a locally verified, reviewable result, without deployment.

## Reference and ownership

Visual references: `.superpowers/brainstorm/homepage-2026-11-22/direction-a-plus.html`, current `src/app/page.tsx`, `src/app/home.module.css`, and `src/app/check/`. Ink `#12202c`, sage `#eef2f0`, white paper, Archivo, fine passport linework and restrained stamp accents. Stencil type is for stamps, not the main wordmark.

Own `src/components/brand/*`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`, their new adjacent CSS Modules, and `src/app/icon.svg`. Add necessary vector assets under `public/brand/`. Coordinate shared global-token or layout changes, preserve the root theme and all existing page/report work. No changes to calculations, email capture, feedback backend, report logic or AI configuration. Work on the existing branch; no checkout, commit, push, merge or deploy.

## Tasks

- [x] Read project guidance and inspect all consumers of the existing logo geometry, including social-image scripts and tests, before changing its API.
- [x] Develop a distinctive vector mark and Archivo wordmark that work at 16/24/32px, in single ink and reversed on dark. Use a meaningful lens/navigation/passport motif with simple geometry and negative space. Create a small local comparison board if exploring alternative marks; choose a clear recommended execution and implement it for review. Avoid generic airplane, flag, chart-growth or AI-sparkle decoration.
- [x] Implement a calm desktop header with readable navigation, active states and a polished points-check CTA. On phones use the existing Mantine Drawer/Burger, styled to the approved identity with 44px targets, keyboard focus, Escape, focus trapping/restoration, scroll locking and reliable link dismissal.
- [x] Implement a compact premium footer using the new lockup, meaningful links and dated SkillSelect attribution. Preserve feedback/privacy/registered-agent links and the general-information disclosure. No invented seals, ratings or government endorsement.
- [x] Extract touched shell styling from oversized globals into CSS Modules; remove obsolete conflicting shell rules. Keep stable `.site-header` and `.site-footer` hooks if print/other pages depend on them. Preserve the `--site-header-height` contract and existing report anchor offsets.
- [x] Keep design tokens centralized and mirrored where the brand tests require it. Do not broadly recolour older page bodies or replace root typography as part of this task. Update favicon from the same geometry as the mark and verify it on light and dark browser surfaces.
- [x] Verify the built static export across homepage, check, sample report, occupation listing/detail, states, feedback and methodology at 1440/1024/901/820/390/360/320px as relevant. No clipping, overflow, obscured anchors or duplicate navigation. Verify drawer keyboard/touch behavior, active navigation, logo home links, reduced motion, dark footer contrast and report print hiding.
- [x] Run `npm run check` and `npm run build`. Use meaningful tests for changed logic/contracts; replace obsolete geometry snapshots rather than preserving the old mark. Obtain independent spec review followed by code-quality review, fix material findings, and capture final screenshots.
- [x] Write `docs/BRAND-SHELL-HANDOFF.md` with design rationale, vector assets, exact checks, screenshots and remaining concerns; update this checklist. Main HANDOFF/STRATEGY coordination stays with the parent.

## Acceptance

The shared chrome and vector identity look native to the approved homepage/check design, work on narrow phones and with a keyboard, preserve existing product behavior, and pass the project checks. The founder can review the actual implementation locally before any merge/deployment.
