import { localToday } from "../src/lib/migration";

// Rules older than this at build time are listed so they are re-verified
// before the report's 60-day render-time cut-off marks them unverified.
const WARN_AFTER_DAYS = 45;
const LISTED = 20;

/** Prints a warning for guide fees and rules older than 12 months, and for visa charges past the next 1 July. */
async function checkGuide(today: string): Promise<void> {
  const { FEES } = await import("../src/data/guide/fees");
  const { GUIDE_STEPS } = await import("../src/data/guide/steps");
  const { POINTS_CHANGES } = await import("../src/data/guide/points-changes");
  const { VISA_GUIDES } = await import("../src/data/guide/visas");
  const {
    chargesOutdated,
    guideDatedItems,
    nextChargeChange,
    staleGuideItems,
    GUIDE_MAX_AGE_DAYS,
  } = await import("../src/lib/guide/staleness");
  if (chargesOutdated(FEES.feesAsAt, today)) {
    console.warn(
      `WARNING check-rule-staleness: the PR guide's visa charges are as at ${FEES.feesAsAt}, and Home Affairs changes them every 1 July (next: ${nextChargeChange(FEES.feesAsAt) ?? "unknown"}). Re-read the current visa pricing table and update FEES (docs/research/pr-guide-2026-11.md).`,
    );
  }
  const items = guideDatedItems({
    fees: FEES,
    steps: GUIDE_STEPS,
    pointsChanges: POINTS_CHANGES,
    visas: VISA_GUIDES,
  });
  const stale = staleGuideItems(items, today);
  if (stale.length === 0) {
    console.log(
      `check-rule-staleness: every PR guide fee and rule was checked within ${GUIDE_MAX_AGE_DAYS} days of ${today}`,
    );
    return;
  }
  console.warn(
    `WARNING check-rule-staleness: ${stale.length} PR guide item(s) checked more than ${GUIDE_MAX_AGE_DAYS} days before ${today}. Fees change every 1 July; re-read them (docs/research/pr-guide-2026-11.md):`,
  );
  for (const item of stale.slice(0, LISTED)) {
    console.warn(`  ${item.id} (checked ${item.checkedAt}) ${item.source}`);
  }
  if (stale.length > LISTED) {
    console.warn(`  …and ${stale.length - LISTED} more`);
  }
}

/** Prints a warning for stale state rules. Never fails the build. */
async function main(): Promise<void> {
  const { stateRules } = await import("../src/data/state-rules/2026-27/index");
  const { staleRules } = await import("../src/lib/state-outlook/staleness");
  const today = localToday();
  await checkGuide(today);
  const stale = staleRules(stateRules, today, WARN_AFTER_DAYS);
  if (stale.length === 0) {
    console.log(
      `check-rule-staleness: every state rule was checked within ${WARN_AFTER_DAYS} days of ${today}`,
    );
    return;
  }
  console.warn(
    `WARNING check-rule-staleness: ${stale.length} state rule(s) checked more than ${WARN_AFTER_DAYS} days before ${today}. Re-verify them (docs/DATA.md, "State rules"):`,
  );
  for (const rule of stale.slice(0, LISTED)) {
    console.warn(`  ${rule.path} (checked ${rule.checkedAt})`);
  }
  if (stale.length > LISTED) {
    console.warn(`  …and ${stale.length - LISTED} more`);
  }
}

main().catch((error: unknown) => {
  console.warn(
    `WARNING check-rule-staleness: could not check the state rules: ${String(error)}`,
  );
});
