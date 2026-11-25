// Every official page the site cites, collected from the code itself so a new
// source is watched without a list to keep (spec 6.11). Relative imports: this
// runs under tsx and vitest.
import federalList from "../../src/data/state-rules/federal-occupations.json";
import nswList from "../../src/data/state-rules/lists/nsw.json";
import qldList from "../../src/data/state-rules/lists/qld.json";
import saList from "../../src/data/state-rules/lists/sa.json";
import waList from "../../src/data/state-rules/lists/wa.json";
import { stateRules } from "../../src/data/state-rules/2026-27/index";
import { statePrograms } from "../../src/data/states";
import { POINTS_CHANGES } from "../../src/data/guide/points-changes";
import { GUIDE_CHECKED_AT, SOURCES } from "../../src/data/guide/sources";
import { GUIDE_STEPS } from "../../src/data/guide/steps";
import { THIRD_PARTY_FEES } from "../../src/data/guide/third-party-fees";
import { VISA_CHARGES } from "../../src/data/guide/visa-charges";
import { VISA_GUIDES } from "../../src/data/guide/visas";
import * as federal from "../state-lists/federal";
import * as nsw from "../state-lists/nsw";
import * as qld from "../state-lists/qld";
import * as sa from "../state-lists/sa";
import * as wa from "../state-lists/wa";

export type Citation = { file: string; item: string; checkedAt: string | null };
export type WatchedSource = { url: string; citedBy: Citation[] };
type FoundCitation = Citation & { url: string };

const URL_KEYS = new Set(["source", "url"]);
// states.ts names its date `checked` ("17 Nov 2026"); everything else `checkedAt`.
const DATE_KEYS = ["checkedAt", "checked"];
const LABEL_KEYS = ["id", "code", "label", "name"];

function dateOf(record: Record<string, unknown>): string | null {
  for (const key of DATE_KEYS) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return null;
}

/** An array element is named by its id (or code, label, name), else its index. */
function elementLabel(element: unknown, index: number): string {
  if (element !== null && typeof element === "object") {
    const record = element as Record<string, unknown>;
    for (const key of LABEL_KEYS) {
      if (typeof record[key] === "string") return record[key];
    }
  }
  return `[${index}]`;
}

/**
 * Every `https://` string under a `source` or `url` key, with the path that
 * leads to it and the nearest `checkedAt` (its own record's, else an
 * enclosing one's: a `value.url` belongs to the sourced fact around it).
 */
export function findCitations(
  value: unknown,
  file: string,
  path: string[] = [],
  inherited: string | null = null,
): FoundCitation[] {
  if (Array.isArray(value)) {
    return value.flatMap((element, index) =>
      findCitations(
        element,
        file,
        [...path, elementLabel(element, index)],
        inherited,
      ),
    );
  }
  if (value === null || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const checkedAt = dateOf(record) ?? inherited;
  return Object.entries(record).flatMap(([key, child]) => {
    if (URL_KEYS.has(key) && typeof child === "string") {
      return child.startsWith("https://")
        ? [{ url: child, file, item: path.join(" › ") || key, checkedAt }]
        : [];
    }
    return findCitations(child, file, [...path, key], checkedAt);
  });
}

const RULES_DIR = "src/data/state-rules/2026-27";
const GUIDE_DIR = "src/data/guide";

function stateRuleCitations(): FoundCitation[] {
  return stateRules.rules.flatMap((rule) =>
    findCitations(
      { [`${rule.state} ${rule.visa}`]: rule },
      `${RULES_DIR}/${rule.state.toLowerCase()}.ts`,
    ),
  );
}

// The imported lists record the date their importer last read each URL.
const IMPORTED_LISTS: { source: string; checkedAt: string }[] = [
  federalList,
  nswList,
  qldList,
  saList,
  waList,
];
const LIST_MODULES: Record<string, Record<string, unknown>> = {
  federal,
  nsw,
  qld,
  sa,
  wa,
};

/** Each `*_URL` export of the state list importers. */
function stateListCitations(): FoundCitation[] {
  return Object.entries(LIST_MODULES).flatMap(([name, module]) =>
    Object.entries(module)
      .filter(([key, url]) => key.endsWith("_URL") && typeof url === "string")
      .map(([key, url]) => ({
        url: url as string,
        file: `scripts/state-lists/${name}.ts`,
        item: key,
        checkedAt:
          IMPORTED_LISTS.find((list) => list.source.includes(url as string))
            ?.checkedAt ?? null,
      })),
  );
}

function guideCitations(): FoundCitation[] {
  const named = Object.entries(SOURCES).map(([key, url]) => ({
    url,
    file: `${GUIDE_DIR}/sources.ts`,
    item: `SOURCES.${key}`,
    checkedAt: GUIDE_CHECKED_AT,
  }));
  return [
    ...named,
    ...findCitations(VISA_CHARGES, `${GUIDE_DIR}/visa-charges.ts`),
    ...findCitations(THIRD_PARTY_FEES, `${GUIDE_DIR}/third-party-fees.ts`),
    ...findCitations(GUIDE_STEPS, `${GUIDE_DIR}/steps.ts`),
    ...findCitations(VISA_GUIDES, `${GUIDE_DIR}/visas.ts`),
    ...findCitations(POINTS_CHANGES, `${GUIDE_DIR}/points-changes.ts`),
  ];
}

/**
 * Groups citations by page (unique, sorted), dropping repeated citing items.
 * Anchors on one page are fetched once; the item keeps its anchor.
 */
export function groupByUrl(found: FoundCitation[]): WatchedSource[] {
  const byUrl = new Map<string, Map<string, Citation>>();
  for (const { url: cited, ...rest } of found) {
    const [url, anchor] = cited.split("#");
    const citation = anchor
      ? { ...rest, item: `${rest.item} (#${anchor})` }
      : rest;
    const items = byUrl.get(url) ?? new Map<string, Citation>();
    items.set(`${citation.file}\n${citation.item}`, citation);
    byUrl.set(url, items);
  }
  return [...byUrl.keys()].sort().map((url) => ({
    url,
    citedBy: [...byUrl.get(url)!.values()],
  }));
}

export function collectSources(): WatchedSource[] {
  return groupByUrl([
    ...findCitations(statePrograms, "src/data/states.ts"),
    ...stateRuleCitations(),
    ...stateListCitations(),
    ...guideCitations(),
  ]);
}
