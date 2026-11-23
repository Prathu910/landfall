import type { Visa } from "../data/types";
import type { FederalList } from "../state-outlook/rules-types";

const VISAS: Visa[] = ["189", "190", "491"];

/**
 * "How to apply" links from an occupation page: the guide for each visa the
 * Home Affairs list has for the code, carrying only the occupation code.
 */
export function applyLinks(
  code: string,
  federal: FederalList | null,
): { visa: Visa; href: string }[] {
  return VISAS.filter((visa) =>
    federal ? Boolean(federal.entries[code]?.[visa]) : true,
  ).map((visa) => ({ visa, href: `/guide/${visa}/?occupation=${code}` }));
}
