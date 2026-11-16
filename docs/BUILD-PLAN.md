# First useful release implementation plan

**Goal:** Deliver a functional private first release that demonstrates a personal migration picture from real published data and self-reported profile inputs.

**Architecture:** Next.js static export with reusable components, versioned pure migration rules and checked-in sourced snapshot data. No paid services or personal data backend in this phase.

**Stack:** Next.js, React, TypeScript, lucide-react, Vitest.

- [ ] Set up the application, static export configuration, dependency lockfile and documented phase boundaries.
- [ ] Write meaningful failing domain tests before implementing the points and timeline engine. Cover the current published category values, the employment cap, missing inputs, calendar boundaries and evidence expiry. Domain files: `src/lib/migration.ts`, `src/lib/migration.test.ts`.
- [ ] Import the existing public SkillSelect results table with occupation and points as the two optional dimensions. Preserve `<20`, record source and snapshot date, validate counts and document the import. Data files: `src/data/pool.json`, `src/lib/pool.ts`, `src/lib/pool.test.ts`.
- [ ] Implement the homepage, explorer and shared navigation. Use sourced metrics and an honest path into the free check. Files: `src/app/page.tsx`, `src/components/*`, `src/app/globals.css`.
- [ ] Implement the four-step check and generated report. Keep personal profile in memory unless the visitor explicitly enables local saving. Files: `src/app/check/page.tsx`, `src/components/check-flow.tsx`, `src/components/report.tsx`.
- [ ] Add sample, state comparison and methodology routes with all controls functional. Files: `src/app/sample/page.tsx`, `src/app/states/page.tsx`, `src/app/methodology/page.tsx`.
- [ ] Review spec compliance, then code quality. Fix findings. Verify domain tests, TypeScript, production build, desktop/mobile browser flows and console errors.
- [ ] Package exact source and static output; deploy privately with Sites. Document what's working and what phase 2 still requires.

The root agent owns UI, integration and publication. A bounded domain implementation agent owns migration computation files. Review agents inspect finished behaviour without changing source. No implementation work relies on an additional founder question.
