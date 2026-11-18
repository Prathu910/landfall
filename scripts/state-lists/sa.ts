import type {
  Cohort,
  ImportedList,
  ImportedListEntry,
} from "../../src/lib/state-outlook/rules-types";
import { fetchText, sortedEntries } from "./shared";

export const SA_LIST_URL =
  "https://migration.sa.gov.au/before-applying/work-in-sa/occupation-lists/occupations-list";

const STREAMS = [
  "South Australian Graduates",
  "Skilled Employment in South Australia",
  "Outer Regional Skilled Employment",
  "Offshore",
];
const VISAS = ["190", "491"] as const;
type Visa = (typeof VISAS)[number];

type Parsed = {
  cohorts: Record<Visa, Set<Cohort>>;
  streams: Record<Visa, Set<string>>;
  // The titles whose blocks list each visa; every title of the code is in `titles`.
  titlesByVisa: Record<Visa, Set<string>>;
  titles: string[];
};

const HEADER =
  /^data-occupation-id=\S+ data-occupation-category-id=\S+ data-occupation-anzsco=(\d{6}) data-occupation-title="([^"]*)"/;
const LOCATION = /<div\s+class="[^"]*">([^<]*)</;
const STREAM_NAME = /^<\/p><div>([^<]*)</;

/**
 * The cohort a location contributes. "Any Location" (seen on an Outer Regional
 * block whose text asks for work in Outer Regional SA) is null: it takes the
 * cohorts the occupation's other blocks give.
 */
function cohortOf(location: string, code: string): Cohort | null {
  if (location === "South Australia") return "living-in-state";
  if (location === "Offshore") return "offshore";
  if (location === "Any Location") return null;
  throw new Error(`${code}: unknown "Applying from" "${location}"; review`);
}

function subclassesOf(section: string, code: string): Visa[] {
  const [, afterLabel] = section.split(/Subclass<\/p>/);
  if (afterLabel === undefined) {
    throw new Error(`${code}: subclass list not found; review the source`);
  }
  const subclasses = afterLabel.split("Skill Level")[0];
  const found = [...subclasses.matchAll(/<a\b[^>]*>([^<]*)<\/a>/g)].map((m) =>
    m[1].trim(),
  );
  return found.map((label) => {
    if (label !== "190" && label !== "491") {
      throw new Error(`${code}: unknown subclass "${label}"; review`);
    }
    return label;
  });
}

function parseOccupation(chunk: string): { code: string; parsed: Parsed } {
  const header = HEADER.exec(chunk);
  if (!header) {
    throw new Error("Occupation block header unreadable; review the source");
  }
  const code = header[1];
  const parsed: Parsed = {
    cohorts: { "190": new Set(), "491": new Set() },
    streams: { "190": new Set(), "491": new Set() },
    titlesByVisa: { "190": new Set(), "491": new Set() },
    titles: [header[2]],
  };
  const anyLocation: Visa[] = [];
  const locations = chunk.split(/Applying from<\/p>/).slice(1);
  if (locations.length === 0) {
    throw new Error(`${code}: no "Applying from" sections; review the source`);
  }
  for (const location of locations) {
    const name = LOCATION.exec(location)?.[1].trim() ?? "";
    const cohort = cohortOf(name, code);
    for (const section of location.split(/Stream(?=<\/p><div>)/).slice(1)) {
      const stream = STREAM_NAME.exec(section)?.[1].trim() ?? "";
      if (!STREAMS.includes(stream)) {
        throw new Error(`${code}: unknown stream "${stream}"; review`);
      }
      for (const visa of subclassesOf(section, code)) {
        if (cohort) parsed.cohorts[visa].add(cohort);
        else anyLocation.push(visa);
        parsed.streams[visa].add(stream);
        parsed.titlesByVisa[visa].add(header[2]);
      }
    }
  }
  const others = new Set([...parsed.cohorts["190"], ...parsed.cohorts["491"]]);
  if (anyLocation.length > 0 && others.size === 0) {
    throw new Error(
      `Review: ${code} appears only under Any Location; its cohorts cannot be read`,
    );
  }
  // Deliberate heuristic, tied to the source wording on 232214: the block says
  // "Any Location" but its text asks for work in Outer Regional South Australia.
  // Where the occupation's other blocks give cohorts, an Any Location visa
  // takes them. Where they give none, we throw rather than guess.
  for (const visa of anyLocation) {
    for (const cohort of others) parsed.cohorts[visa].add(cohort);
  }
  return { code, parsed };
}

const ORDER: Cohort[] = [
  "living-in-state",
  "living-in-other-state",
  "offshore",
];

function toEntry(parsed: Parsed): ImportedListEntry | null {
  const entry: ImportedListEntry = {};
  for (const visa of VISAS) {
    const cohorts = ORDER.filter((c) => parsed.cohorts[visa].has(c));
    if (cohorts.length > 0) entry[visa] = cohorts;
  }
  if (!entry["190"] && !entry["491"]) return null;
  for (const visa of VISAS) {
    if (!entry[visa]) continue;
    const tags = STREAMS.filter((s) => parsed.streams[visa].has(s));
    // A code listed under several titles names the titles that list this visa,
    // so the union can be traced.
    if (parsed.titles.length > 1) {
      tags.push(...[...parsed.titlesByVisa[visa]].map((t) => `title:${t}`));
    }
    (entry.streams ??= {})[visa] = tags;
  }
  return entry;
}

/** Everything either entry offers: a listing under any title counts. */
function union(a: Parsed, b: Parsed): Parsed {
  return {
    cohorts: {
      "190": new Set([...a.cohorts["190"], ...b.cohorts["190"]]),
      "491": new Set([...a.cohorts["491"], ...b.cohorts["491"]]),
    },
    streams: {
      "190": new Set([...a.streams["190"], ...b.streams["190"]]),
      "491": new Set([...a.streams["491"], ...b.streams["491"]]),
    },
    titlesByVisa: {
      "190": new Set([...a.titlesByVisa["190"], ...b.titlesByVisa["190"]]),
      "491": new Set([...a.titlesByVisa["491"], ...b.titlesByVisa["491"]]),
    },
    titles: [...a.titles, ...b.titles],
  };
}

/**
 * Reads the list page. A code the page lists twice (two occupation names under
 * one code) gets the union of what its listings offer, and is returned in
 * `repeated` so the run can report it.
 */
export function parseSaPage(html: string): {
  entries: Record<string, ImportedListEntry>;
  repeated: string[];
} {
  const chunks = html.split(/(?=data-occupation-id=)/).slice(1);
  if (chunks.length === 0) {
    throw new Error("No occupation blocks found; review the source");
  }
  const byCode = new Map<string, Parsed>();
  const repeated: string[] = [];
  for (const chunk of chunks) {
    const { code, parsed } = parseOccupation(chunk);
    const earlier = byCode.get(code);
    if (earlier) repeated.push(code);
    byCode.set(code, earlier ? union(earlier, parsed) : parsed);
  }
  const entries: Record<string, ImportedListEntry> = {};
  for (const [code, parsed] of byCode) {
    const entry = toEntry(parsed);
    if (entry) entries[code] = entry;
  }
  return { entries, repeated: [...new Set(repeated)] };
}

export function buildSaList(
  html: string,
  meta: { source: string; checkedAt: string },
): { list: ImportedList; repeated: string[] } {
  const { entries, repeated } = parseSaPage(html);
  return {
    list: { listId: "sa", ...meta, entries: sortedEntries(entries) },
    repeated,
  };
}

export function fetchSaPage(url = SA_LIST_URL): Promise<string> {
  return fetchText(url, "text/html");
}
