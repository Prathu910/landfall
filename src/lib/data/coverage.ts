/** How much of the occupation list the checked-in snapshot covers. */
export type SnapshotCoverage = { total: number; withData: number };

/** Read from occupation-index.json at build time, never hard-coded. */
export function snapshotCoverage(
  entries: readonly { hasData: boolean }[],
): SnapshotCoverage {
  return {
    total: entries.length,
    withData: entries.filter((entry) => entry.hasData).length,
  };
}

/** The methodology page's coverage clause; the page ends the sentence. */
export function coverageSentence(coverage: SnapshotCoverage): string {
  const total = coverage.total.toLocaleString("en-AU");
  const withData = coverage.withData.toLocaleString("en-AU");
  return `The current occupation import covers ${total} occupations, ${withData} of them with published SkillSelect data;`;
}
