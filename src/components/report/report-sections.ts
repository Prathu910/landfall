export type ReportSection = readonly [id: string, chip: string];

/** The section chips, in page order; each id is the section's in-page anchor (spec 5). */
export const REPORT_SECTIONS: readonly ReportSection[] = [
  ["outlook", "Outlook"],
  ["visas", "Visas"],
  ["charts", "Cut-offs"],
  ["route", "Route"],
  ["improve", "Improve"],
  ["evidence", "Evidence"],
  ["points", "Points"],
];
