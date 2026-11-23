import type { Visa } from "../data/types";
import { isStale } from "../state-outlook/staleness";
import type {
  Fee,
  FeeCatalogue,
  GuideStep,
  PointsChange,
  VisaGuide,
} from "./types";

/** Fees change every 1 July: anything older than this needs a fresh read. */
export const GUIDE_MAX_AGE_DAYS = 365;

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
