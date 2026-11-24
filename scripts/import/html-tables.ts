// Reads the tables in the official round pages' HTML blocks as cell text.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
};

export function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, body: string) => {
      if (body[0] === "#") {
        const code =
          body[1] === "x" || body[1] === "X"
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);
        return String.fromCodePoint(code);
      }
      return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
    },
  );
}

export function cellText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export type Cell = { text: string; span: number };
export type Table = Cell[][];

function readCell(html: string): Cell {
  const colspan = /^<t[dh][^>]*\scolspan="?(\d+)/i.exec(html);
  return { text: cellText(html), span: colspan ? Number(colspan[1]) : 1 };
}

export function extractTables(html: string): Table[] {
  return (html.match(/<table[\s>][\s\S]*?<\/table>/gi) ?? []).map((table) =>
    (table.match(/<tr[\s>][\s\S]*?<\/tr>/gi) ?? []).map((row) =>
      (row.match(/<t[dh][\s>][\s\S]*?<\/t[dh]>/gi) ?? []).map(readCell),
    ),
  );
}

export const texts = (row: Cell[]): string[] => row.map((cell) => cell.text);

/** One label per data column: a cell spanning n columns labels all n. */
export function expandSpans(row: Cell[]): string[] {
  return row.flatMap((cell) => Array<string>(cell.span).fill(cell.text));
}

export function indexesWhere(
  cells: string[],
  test: (text: string, index: number) => boolean,
): number[] {
  return cells.flatMap((text, index) => (test(text, index) ? [index] : []));
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** "15 October 2026" → "2026-10-15". */
export function parseLongDate(text: string): string {
  const match = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(text.trim());
  const month = match ? MONTHS.indexOf(match[2].toLowerCase()) : -1;
  if (!match || month < 0) throw new Error(`Unrecognised round date "${text}"`);
  return `${match[3]}-${pad(month + 1)}-${pad(Number(match[1]))}`;
}

/** "03/09/2026" (day first) → "2026-09-03", or null if it isn't a real date. */
export function parseDayFirstDate(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso)
    ? iso
    : null;
}

/** "20,000" or "20000" → 20000; anything else → null. */
export function parseCount(text: string): number | null {
  return /^(\d+|\d{1,3}(,\d{3})+)$/.test(text)
    ? Number(text.replace(/,/g, ""))
    : null;
}
