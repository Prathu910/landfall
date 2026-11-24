import type { RecapFacts } from "../types";

function codesIn(value: unknown, codes: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) codesIn(item, codes);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key === "code" && typeof item === "string") codes.add(item);
    else codesIn(item, codes);
  }
}

/** Every occupation code the facts files name, as if each had a page. */
export function pagesFor(...facts: RecapFacts[]): ReadonlySet<string> {
  const codes = new Set<string>();
  for (const file of facts) codesIn(file, codes);
  return codes;
}
