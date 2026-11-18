/** Text of an HTML fragment: tags removed, spaces and zero-width marks tidied. */
export function textOf(fragment: string): string {
  return fragment
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ ​]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every table in the page as rows of cell text. Heading cells (th) and data
 * cells (td) are both returned, so the first row is the heading row.
 */
export function tablesOf(html: string): string[][][] {
  const tables = html.match(/<table\b[\s\S]*?<\/table>/g) ?? [];
  return tables.map((table) =>
    (table.match(/<tr\b[\s\S]*?<\/tr>/g) ?? []).map((row) =>
      (row.match(/<t[dh]\b[\s\S]*?<\/t[dh]>/g) ?? []).map(textOf),
    ),
  );
}
