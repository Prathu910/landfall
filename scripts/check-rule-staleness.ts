import { localToday } from "../src/lib/migration";

// Rules older than this at build time are listed so they are re-verified
// before the report's 60-day render-time cut-off marks them unverified.
const WARN_AFTER_DAYS = 45;
const LISTED = 20;

/** Prints a warning for stale state rules. Never fails the build. */
async function main(): Promise<void> {
  const { stateRules } = await import("../src/data/state-rules/2026-27/index");
  const { staleRules } = await import("../src/lib/state-outlook/staleness");
  const today = localToday();
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
