// No imports, on purpose: the write-read Edge Function imports this file
// from Deno as ../../../src/lib/outlook/read-contract.ts.

/**
 * Everything "Our read" may mention (spec 6.9). It holds computed results
 * only: no name, email, date of birth or exact dates, because it is sent to
 * the AI. Dated changes are month and year.
 */
export type ReportFacts = {
  occupation: string;
  dataMonth: string;
  /** Which visa the stamp covers: 189, one state visa, or all three combined. */
  situation: "189" | "state" | "combined";
  /** The reader has already submitted an EOI. */
  lodged: boolean;
  stamp: { visa: string; state: string | null; label: string };
  visas: {
    visa: string;
    label: string;
    state: string | null;
    points: number;
    caption: string;
  }[];
  counts: { name: string; text: string; numbers: number[] }[]; // e.g. { name: "tied", text: "1,841", numbers: [1841] }
  route: string[];
  wait: string;
  changes: {
    title: string;
    fromPoints: number;
    toPoints: number;
    toLabel: string;
    month: string | null;
  }[];
  extraNumbers: number[]; // rounds, months counts, days waiting, years
};

/** Wording the report's new sections and "Our read" must never use (spec 10). */
export const READ_BANNED =
  /\b(guarantee\w*|definitely|will be invited|chances? of|likely to be invited|some invitations|a few|per ?cent)\b|%/i;

/**
 * Off the Home Affairs 189 list, a read must never say a change opens 189 or
 * that a 189 EOI can be submitted. The facts mark that case with the 189
 * visa's label, NOT_AVAILABLE_189 (label-189.ts NOT_AVAILABLE).
 */
export const OFF_LIST_READ_BANNED =
  /\bopens? 189\b|\bsubmit\w*\b[^.]*\b189 EOI\b/i;
export const NOT_AVAILABLE_189 = "Not available";

function offList189(facts: ReportFacts): boolean {
  return facts.visas.some(
    (v) => v.visa === "189" && v.label === NOT_AVAILABLE_189,
  );
}

export const MIN_WORDS = 40;
export const MAX_WORDS = 110;
const NUMBER_TOKEN = /\d[\d,]*(\.\d+)?/g;
// A day next to a month ("12 March", "Oct 15") is more precise than the
// facts, which hold months only. Case-sensitive so "may 5" isn't a date.
const MONTH = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";
const DAY_DATE = new RegExp(`\\b\\d{1,2} ${MONTH}\\b|\\b${MONTH} \\d{1,2}\\b`);

function numbersIn(text: string): number[] {
  return (text.match(NUMBER_TOKEN) ?? []).map((token) =>
    Number(token.replace(/,/g, "")),
  );
}

/** Every string the facts hold, so a number quoted from any of them is allowed. */
function textsOf(facts: ReportFacts): string[] {
  return [
    facts.occupation,
    facts.dataMonth,
    facts.stamp.visa,
    facts.stamp.state ?? "",
    facts.stamp.label,
    ...facts.visas.flatMap((v) => [v.visa, v.label, v.state ?? "", v.caption]),
    ...facts.counts.map((c) => c.text),
    ...facts.route,
    facts.wait,
    ...facts.changes.flatMap((c) => [c.title, c.toLabel, c.month ?? ""]),
  ];
}

/**
 * The numbers a read may use: points, counts, months, years and day counts,
 * plus any number written in the facts' own text (years in month strings,
 * cut-offs in captions, days waiting in the route).
 */
export function allowedNumbers(facts: ReportFacts): Set<number> {
  return new Set([
    ...facts.visas.map((v) => v.points),
    ...facts.counts.flatMap((c) => c.numbers),
    ...facts.changes.flatMap((c) => [c.fromPoints, c.toPoints]),
    ...facts.extraNumbers,
    ...textsOf(facts).flatMap(numbersIn),
  ]);
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/** Any failure means the reader gets the template read instead. */
export function checkRead(
  text: string,
  facts: ReportFacts,
): { ok: true } | { ok: false; reason: "number" | "banned" | "length" } {
  if (READ_BANNED.test(text)) return { ok: false, reason: "banned" };
  if (offList189(facts) && OFF_LIST_READ_BANNED.test(text)) {
    return { ok: false, reason: "banned" };
  }
  // An exact date is a number the facts never hold.
  if (DAY_DATE.test(text)) return { ok: false, reason: "number" };
  const allowed = allowedNumbers(facts);
  if (numbersIn(text).some((n) => !allowed.has(n))) {
    return { ok: false, reason: "number" };
  }
  const words = wordCount(text);
  if (words < MIN_WORDS || words > MAX_WORDS) {
    return { ok: false, reason: "length" };
  }
  return { ok: true };
}
