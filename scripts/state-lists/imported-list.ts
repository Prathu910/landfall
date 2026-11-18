import type { ImportedList } from "../../src/lib/state-outlook/rules-types";
import { isImportedList } from "../../src/lib/state-outlook/rules-guards";
import { writeFileAtomic } from "../import/atomic-write";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 60_000;

/** A page change that silently drops rows would mark occupations unlisted. */
export function assertListSize(list: ImportedList, minCodes: number): void {
  const count = Object.keys(list.entries).length;
  if (count < minCodes) {
    throw new Error(
      `Only ${count} occupations in the ${list.listId} list (expected at least ${minCodes}); review the source`,
    );
  }
}

export function writeImportedList(path: string, list: ImportedList): void {
  const listId = list.listId;
  if (!isImportedList(list)) {
    throw new Error(`${listId} list failed validation; not written`);
  }
  writeFileAtomic(path, `${JSON.stringify(list, null, 2)}\n`);
}

export async function fetchText(url: string, accept: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: accept },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}; not imported`);
  }
  return response.text();
}

export function sortedEntries(
  entries: ImportedList["entries"],
): ImportedList["entries"] {
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
}
