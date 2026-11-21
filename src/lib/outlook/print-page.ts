/**
 * The printed report's page footers (spec 11). Chrome-based browsers draw
 * `@page` margin boxes; Safari omits them, and the guarantee box remains.
 */
import { formatDate } from "../migration";

// Letters, digits and plain punctuation pass through; anything else becomes
// a CSS hex escape, so a reader's name can't end the string or the <style>.
const SAFE = /[\p{L}\p{N} .,'’()/-]/u;
const MARGIN_FONT = `font: 12px "Archivo Variable", sans-serif; color: var(--muted);`;

/** "MigrateLens report for Priya. Our best reading … to October 2026, not a guarantee." */
export function printFooterText(name: string, month: string): string {
  const trimmed = name.trim();
  const lead = trimmed
    ? `MigrateLens report for ${trimmed}.`
    : "MigrateLens report.";
  return `${lead} Our best reading of SkillSelect data to ${month}, not a guarantee.`;
}

/** The top line of page 1: whose report, when it was worked out, and the data date. */
export function printBrandLine(
  name: string,
  asOf: string,
  snapshotDate: string,
): string {
  const trimmed = name.trim();
  const whose = trimmed ? `Report for ${trimmed}` : "Your report";
  return `${whose}, calculated ${formatDate(asOf)}. SkillSelect data to ${formatDate(snapshotDate)}.`;
}

function cssString(text: string): string {
  const escaped = Array.from(text, (char) =>
    SAFE.test(char) ? char : `\\${char.codePointAt(0)?.toString(16)} `,
  ).join("");
  return `"${escaped}"`;
}

/** The per-report `@page` rule, injected as a <style> element. */
export function printPageStyle(name: string, month: string): string {
  const footer = cssString(printFooterText(name, month));
  return (
    "@page { " +
    `@bottom-left { content: ${footer}; ${MARGIN_FONT} } ` +
    `@bottom-right { content: "Page " counter(page) " of " counter(pages); ${MARGIN_FONT} } ` +
    "}"
  );
}
