/** The full-report link. Only the occupation code travels; points never go in the URL. */
export function fullReportHref(code: string): string {
  return `/check/?occupation=${code}`;
}
