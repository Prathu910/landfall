import type { Visa } from "../data/types";
import { isStale } from "../state-outlook/staleness";
import type {
  Fee,
  FeeCatalogue,
  GuideStep,
  PointsChange,
  VisaGuide,
} from "./types";

/** Anything checked longer ago than this needs a fresh read. */
export const GUIDE_MAX_AGE_DAYS = 365;

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The first 1 July after `feesAsAt`, when visa charges next change; null when unreadable. */
export function nextChargeChange(feesAsAt: string): string | null {
  const match = CALENDAR_DATE.exec(feesAsAt);
  if (!match) return null;
  const year = Number(match[1]);
  const beforeJuly = `${match[2]}-${match[3]}` < "07-01";
  return `${beforeJuly ? year : year + 1}-07-01`;
}

/**
 * True once `asOf` reaches the 1 July after `feesAsAt`: Home Affairs sets new
 * visa charges every 1 July, so the checked-in ones may be out of date even if
 * they were read recently. Unreadable dates count as outdated.
 */
export function chargesOutdated(feesAsAt: string, asOf: string): boolean {
  const next = nextChargeChange(feesAsAt);
  if (!next || !CALENDAR_DATE.test(asOf)) return true;
  return asOf >= next;
}

export type DatedItem = {
  id: string;
  checkedAt: string;
  source: string;
  label?: string;
};

const dated = (fee: Fee): DatedItem => ({
  id: fee.id,
  checkedAt: fee.checkedAt,
  source: fee.source,
  label: fee.label,
});

/** Every fee in the catalogue, including each visa's four charges. */
export function feeItems(catalogue: FeeCatalogue): DatedItem[] {
  const charges = Object.values(catalogue.visaCharges).flatMap((c) => [
    c.main,
    c.adult,
    c.child,
    c.secondInstalment,
  ]);
  return [
    ...charges,
    ...catalogue.assessingBodies,
    ...catalogue.englishTests,
    catalogue.naati,
    ...Object.values(catalogue.stateNomination),
    catalogue.afpCheck,
    catalogue.overseasPolice,
    catalogue.health,
    catalogue.translations,
  ].map(dated);
}

/** Every dated, sourced item the guide shows: fees, steps, rules and reform notes. */
export function guideDatedItems(data: {
  fees: FeeCatalogue;
  steps: GuideStep[];
  pointsChanges: PointsChange[];
  visas: Record<Visa, VisaGuide>;
}): DatedItem[] {
  const steps = data.steps.map((s) => ({ id: `step/${s.id}`, ...s.rule }));
  const changes = data.pointsChanges.map((c) => ({
    id: `points-change/${c.status}`,
    checkedAt: c.checkedAt,
    source: c.source,
  }));
  const rules = Object.values(data.visas).flatMap((guide) =>
    [...guide.requirements, ...guide.nomination, ...guide.after].map((r) => ({
      id: `visa-${guide.visa}/${r.label}`,
      checkedAt: r.checkedAt,
      source: r.source,
    })),
  );
  return [...feeItems(data.fees), ...steps, ...changes, ...rules].map(
    ({ id, checkedAt, source }) => ({ id, checkedAt, source }),
  );
}

/** Items checked more than `maxDays` before `asOf`; an unreadable date counts as stale. */
export function staleGuideItems(
  items: DatedItem[],
  asOf: string,
  maxDays = GUIDE_MAX_AGE_DAYS,
): DatedItem[] {
  return items.filter((item) => isStale(item.checkedAt, asOf, maxDays));
}
