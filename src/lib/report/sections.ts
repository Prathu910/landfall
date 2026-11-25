export type ReportSection = readonly [id: string, chip: string];

/**
 * The sections ReportView renders for every report, in page order, as the
 * section chips list them; each id is the in-page anchor (spec 5). The free
 * result counts them for its teaser (plan 3 ruling R1).
 */
export const REPORT_SECTIONS: readonly ReportSection[] = [
  ["outlook", "Outlook"],
  ["visas", "Visas"],
  ["charts", "Cut-offs"],
  ["route", "Route"],
  ["improve", "Improve"],
  ["evidence", "Evidence"],
  ["points", "Points"],
];
