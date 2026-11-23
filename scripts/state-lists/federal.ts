import type { FederalList } from "../../src/lib/state-outlook/rules-types";
import { isFederalList } from "../../src/lib/state-outlook/rules-guards";
import { fetchText, sortedEntries, writeJsonFile } from "./shared";
import { decodeEntities, normalizeOccupationName } from "../import/rounds";

type Eligibility = FederalList["entries"][string];
type FederalVisa = keyof Eligibility;
const FEDERAL_VISAS: readonly FederalVisa[] = ["189", "190", "491"];

/** A 189/190/491 row whose only codes are labelled ANZSCO 2022. */
export type UnlabelledRow = {
  occupation: string;
  codes2022: string[];
  eligibility: Eligibility;
};

export type IndexOccupation = { code: string; name: string };

export const FEDERAL_LIST_URL =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list";
const DATA_INPUT_ID = "ctl00_PlaceHolderMain_PageJSONDataHiddenField_Input";

// The page's visa labels, with runs of spaces collapsed.
const LABEL_189 = "189 - Skilled Independent (subclass 189) - Points-Tested";
const LABEL_190 = "190 - Skilled Nominated (subclass 190)";
const LABEL_491_STATE =
  "491 - Skilled Work Regional (provisional) visa (subclass 491) State or Territory nominated";
const LABEL_491_FAMILY =
  "491 - Skilled Work Regional (provisional) visa (subclass 491) Family Sponsored";
const KNOWN_LABELS = [LABEL_189, LABEL_190, LABEL_491_STATE, LABEL_491_FAMILY];
// The labels and caveats this importer reads start with one of these.
const FEDERAL_LABEL = /^(189|190|491)\b/;

type OfficialRow = {
  occupation: string;
  anzscocode: string;
  visas: string;
  visacaveats: string;
};

function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/[\u200b\u00a0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function field(item: Record<string, unknown>, key: keyof OfficialRow): string {
  const value = item[key];
  if (typeof value !== "string") {
    throw new Error(
      `Occupation list field "${key}" missing; review the source`,
    );
  }
  return value;
}

function readRows(html: string): OfficialRow[] {
  const tag = new RegExp(`<input[^>]*id="${DATA_INPUT_ID}"[^>]*>`, "i").exec(
    html,
  );
  const value = tag && /\svalue="([^"]*)"/i.exec(tag[0]);
  if (!value) {
    throw new Error(
      "Occupation list data field not found; review the source before importing",
    );
  }
  const items: unknown = JSON.parse(decodeEntities(value[1]));
  if (!Array.isArray(items)) {
    throw new Error("Occupation list data is not a list; review the source");
  }
  return items.map((item: unknown) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(
        "Occupation list row is not an object; review the source",
      );
    }
    const record = item as Record<string, unknown>;
    return {
      occupation: field(record, "occupation"),
      anzscocode: field(record, "anzscocode"),
      visas: field(record, "visas"),
      visacaveats: field(record, "visacaveats"),
    };
  });
}

/**
 * The 6-digit codes in each "ANZSCO <year> ..." part of the code cell, e.g.
 * "ANZSCO 2022 - Subclass 186 and 482 visas - 139916".
 */
function codesLabelled(text: string, year: "2013" | "2022"): string[] {
  const codes = text
    .split(/ANZSCO\s*/)
    .filter((part) => part.startsWith(year))
    .flatMap(
      (part) => part.slice(year.length).match(/(?<!\d)\d{6}(?!\d)/g) ?? [],
    );
  return [...new Set(codes)];
}

/** Fails on any 189, 190 or 491 label the parser does not know. */
function eligibility(row: OfficialRow): Eligibility {
  const labels = row.visas
    .split(";")
    .map((label) => label.replace(/\s+/g, " ").trim())
    .filter((label) => label.length > 0);
  for (const label of labels) {
    if (FEDERAL_LABEL.test(label) && !KNOWN_LABELS.includes(label)) {
      throw new Error(`Unknown visa label "${label}"; review the source`);
    }
  }
  return {
    "189": labels.includes(LABEL_189),
    "190": labels.includes(LABEL_190),
    "491": labels.includes(LABEL_491_STATE),
  };
}

/** The list stores eligibility as booleans, so a 189/190/491 caveat can't be kept. */
function rejectCaveats(row: OfficialRow): void {
  for (const item of row.visacaveats.split(/<li>/i).slice(1)) {
    if (FEDERAL_LABEL.test(plainText(item)) && /caveat/i.test(item)) {
      throw new Error(
        `${row.occupation}: a caveat applies to 189, 190 or 491; review the source`,
      );
    }
  }
}

/**
 * Reads the official list. Subclasses 189, 190 and 491 use ANZSCO 2013 codes, the
 * same codes as the SkillSelect dashboard, so entries are keyed by them.
 */
export function parseFederalList(html: string): {
  entries: Record<string, Eligibility>;
  unlabelled: UnlabelledRow[];
} {
  const entries: Record<string, Eligibility> = {};
  const unlabelled: UnlabelledRow[] = [];
  for (const row of readRows(html)) {
    rejectCaveats(row);
    const text = plainText(row.anzscocode);
    const codes = codesLabelled(text, "2013");
    const rowEligibility = eligibility(row);
    if (codes.length > 1) {
      throw new Error(
        `${row.occupation} has ANZSCO 2013 codes ${codes.join(", ")}; review the source`,
      );
    }
    if (codes.length === 0) {
      if (FEDERAL_VISAS.some((visa) => rowEligibility[visa])) {
        const codes2022 = codesLabelled(text, "2022");
        unlabelled.push({
          occupation: row.occupation,
          codes2022,
          eligibility: rowEligibility,
        });
      }
      continue;
    }
    if (entries[codes[0]]) {
      throw new Error(`Code ${codes[0]} is listed twice; review the source`);
    }
    entries[codes[0]] = rowEligibility;
  }
  return { entries, unlabelled };
}

/** Exactly one of the row's codes names the same occupation in the index. */
function indexMatch(
  row: UnlabelledRow,
  index: IndexOccupation[],
): string | null {
  const name = normalizeOccupationName(row.occupation);
  const matches = index.filter(
    (o) =>
      row.codes2022.includes(o.code) &&
      normalizeOccupationName(o.name) === name,
  );
  return matches.length === 1 ? matches[0].code : null;
}

/**
 * Builds the federal list. A row labelled only with 2022 codes is kept when
 * the dashboard has one of those codes under the same occupation name, which
 * makes it that occupation's 2013 code; any other such row is left out and
 * returned in `unmatched`.
 */
export function buildFederalList(
  html: string,
  index: IndexOccupation[],
  meta: { source: string; checkedAt: string },
): { list: FederalList; unmatched: UnlabelledRow[] } {
  const { entries, unlabelled } = parseFederalList(html);
  const unmatched: UnlabelledRow[] = [];
  for (const row of unlabelled) {
    const code = indexMatch(row, index);
    if (code === null || entries[code]) unmatched.push(row);
    else entries[code] = row.eligibility;
  }
  const list = { ...meta, entries: sortedEntries(entries) };
  return { list, unmatched };
}

export function countEligible(
  entries: Eligibility[],
): Record<FederalVisa, number> {
  const count = (visa: FederalVisa) => entries.filter((e) => e[visa]).length;
  return { "189": count("189"), "190": count("190"), "491": count("491") };
}

/** A page change that silently drops rows would mark occupations ineligible. */
export function assertPlausible(
  list: FederalList,
  minimums: Record<FederalVisa, number>,
): void {
  const counts = countEligible(Object.values(list.entries));
  for (const visa of FEDERAL_VISAS) {
    if (counts[visa] < minimums[visa]) {
      throw new Error(
        `Only ${counts[visa]} occupations eligible for ${visa} (expected at least ${minimums[visa]}); review the source`,
      );
    }
  }
}

export function writeFederalList(path: string, list: FederalList): void {
  if (!isFederalList(list)) {
    throw new Error("Federal list failed validation; not written");
  }
  writeJsonFile(path, list);
}

export function fetchFederalPage(url = FEDERAL_LIST_URL): Promise<string> {
  return fetchText(url, "text/html");
}
