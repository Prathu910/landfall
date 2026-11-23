import type { FeeCatalogue } from "./types";
import { feeItems } from "./staleness";

export type SourceEntry = { label: string; href: string; checkedAt: string };

/** The official pages behind a guide page, each listed once (first label wins). */
export function sourceList(
  pages: { label: string; href: string }[],
  fees: FeeCatalogue | null,
  checkedAt: string,
): SourceEntry[] {
  const feeLabels = fees
    ? feeItems(fees).map((item) => ({
        label: item.label ?? item.id,
        href: item.source,
        checkedAt: item.checkedAt,
      }))
    : [];
  const all = [...pages.map((p) => ({ ...p, checkedAt })), ...feeLabels];
  const seen = new Set<string>();
  return all.filter((entry) => {
    if (seen.has(entry.href)) return false;
    seen.add(entry.href);
    return true;
  });
}
