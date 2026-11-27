import { formatDate } from "../migration";
import type { ReviseResponse } from "../orders/contract";
import type { ReportMeta } from "../report-issue/payload";

export type CorrectionState = {
  /** Edit answers and the Sharpen questions are offered only while open. */
  open: boolean;
  revisionsLeft: number;
  /** "This report is final (issued 21 Nov 2026)." once closed, else null. */
  finalLine: string | null;
};

/** The issue date, as "21 Nov 2026" (UTC, as every date in the domain layer). */
export function issuedDay(issuedAt: string): string {
  return formatDate(issuedAt.slice(0, 10));
}

/**
 * The 7-day correction window: open until `correctableUntil` (exclusive) while
 * a revision is left. `now` is an ISO timestamp, passed in so it is testable.
 */
export function correctionState(
  meta: ReportMeta,
  now: string,
): CorrectionState {
  const inWindow = Date.parse(now) < Date.parse(meta.correctableUntil);
  const open = inWindow && meta.revisionsLeft > 0;
  return {
    open,
    revisionsLeft: meta.revisionsLeft,
    finalLine: open
      ? null
      : `This report is final (issued ${issuedDay(meta.issuedAt)}).`,
  };
}

/**
 * Ruling R9: an issued report shows one data month. The live occupation file,
 * fetched for the screen-only extras (the occupation comparison and the
 * 12-month trend), joins it only when its month is the report's. A file still
 * loading, or one that failed, passes through as it is.
 */
export function liveCoreFits(
  live: { status: string; core?: { asAt: string } },
  snapshotDate: string,
): boolean {
  return (
    live.status !== "ready" || live.core?.asAt === snapshotDate.slice(0, 7)
  );
}

const HASH = /^#([A-Za-z0-9_-]{43})$/;

/** The link token: exactly 43 base64url characters after "#", or null. */
export function tokenFromHash(hash: string): string | null {
  return HASH.exec(hash)?.[1] ?? null;
}

/** What a correction's reply means for the reader. */
export function reviseMessage(reply: ReviseResponse): string {
  if (reply.kind === "revised")
    return `Your report is updated (version ${reply.version}). The new PDF is on its way by email.`;
  switch (reply.code) {
    case "closed":
      return "The correction window has closed, so this report is final.";
    case "limit":
      return "You've used all your corrections, so this report is final.";
    case "occupation-changed":
      return "A correction can't change the occupation. For another occupation, start a new check.";
    case "invalid":
      return "We couldn't read those answers. Check them and try again.";
    case "busy":
      return "Something went wrong on our side. Try again in a minute.";
  }
}
