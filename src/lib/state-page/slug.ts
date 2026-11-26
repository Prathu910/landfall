import type { StateCode } from "../data/types";
import { STATE_ORDER } from "../occupation-page/states";
import { STATE_NAMES } from "../state-outlook/context";

/**
 * The eight state pages. Slugs are the full names (`sa`, `act`, `wa` and
 * `nt` are ambiguous on their own); the search name is what readers type
 * ("NSW 190", "Victoria 190").
 */
export type StatePage = {
  code: StateCode;
  slug: string;
  searchName: string;
  fullName: string;
};

const SEARCH_NAMES: Record<StateCode, string> = {
  NSW: "NSW",
  VIC: "Victoria",
  QLD: "Queensland",
  WA: "WA",
  SA: "SA",
  ACT: "ACT",
  TAS: "Tasmania",
  NT: "NT",
};

function slugOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, "-");
}

export const STATE_PAGES: readonly StatePage[] = STATE_ORDER.map((code) => ({
  code,
  slug: slugOf(STATE_NAMES[code]),
  searchName: SEARCH_NAMES[code],
  fullName: STATE_NAMES[code],
}));

export function statePage(code: StateCode): StatePage {
  const page = STATE_PAGES.find((p) => p.code === code);
  if (!page) throw new Error(`No state page for ${code}`);
  return page;
}

/** "/states/new-south-wales/" */
export function statePath(code: StateCode): string {
  return `/states/${statePage(code).slug}/`;
}

export function stateFromSlug(slug: string): StateCode | null {
  return STATE_PAGES.find((p) => p.slug === slug)?.code ?? null;
}
