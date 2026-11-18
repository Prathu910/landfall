export type ReportSection = readonly [id: string, title: string];

const OPENING: ReportSection[] = [["reality-check", "Reality check"]];
const PANELS: ReportSection[] = [
  ["visa-189", "189 in detail"],
  ["visa-190", "190 in detail"],
  ["visa-491", "491 in detail"],
  ["state-outlook", "State outlook"],
];
const REST: ReportSection[] = [
  ["points", "Your points"],
  ["scenarios", "What could change"],
  ["timeline", "Your personal dates"],
  ["compare", "Occupation context"],
  ["prepare", "Get organised"],
  ["definitions", "Useful definitions"],
];

// Module-level lists keep a stable identity for the nav observer's effect.
const WITH_PANELS = [...OPENING, ...PANELS, ...REST];
const WITHOUT_PANELS = [...OPENING, ...REST];

/** The report's nav, in page order; the visa panels and state outlook appear only once they render. */
export function reportSections(withPanels: boolean): ReportSection[] {
  return withPanels ? WITH_PANELS : WITHOUT_PANELS;
}

/** "05 / YOUR POINTS AUDIT": the number matches the section's place in the nav. */
export function sectionLabel(
  sections: ReportSection[],
  id: string,
  title: string,
): string {
  const position = sections.findIndex(([sectionId]) => sectionId === id) + 1;
  return `${String(position).padStart(2, "0")} / ${title}`;
}
