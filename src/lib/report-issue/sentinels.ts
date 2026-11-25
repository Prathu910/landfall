import { LODGED_NOTE } from "../outlook/improve";
import { FOOTER_CAVEAT } from "../outlook/view";
import { NO_PACE_TEXT } from "../outlook/wait";

/**
 * Sentences that exist only in the report builder (`buildOutlookView` and what
 * it calls), never in a renderer, so finding one in a page's JS means the page
 * ships the builder. Imported, not copied, so a reworded sentence moves with
 * its module. scripts/check-bundle-lock.ts reads them after every build.
 */
export const BUILDER_SENTINELS: readonly string[] = [
  NO_PACE_TEXT,
  LODGED_NOTE.trim(),
  FOOTER_CAVEAT,
];
