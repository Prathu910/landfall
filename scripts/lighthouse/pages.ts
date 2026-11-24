import { CATEGORIES, type Category } from "./summary";

export interface AuditPage {
  path: string;
  /** Categories that must score 100. */
  gated: readonly Category[];
}

const ALL = CATEGORIES;
/** Pages that shouldn't rank still need to be accessible and well built. */
const QUALITY_ONLY: readonly Category[] = ["accessibility", "best-practices"];

/**
 * Every page type that should get search traffic (founder goal, 24 Nov 2026,
 * docs/STRATEGY.md), plus /feedback/ and the 404 for accessibility and best
 * practices. The occupation pages cover the shapes that render differently:
 * a large pool on every visa, a 189-invited occupation, one off the 189
 * list (Cook; Aquaculture Farmer is off the list too, but every count is
 * "<20", so it is noindex by design), and an indexable page whose counts
 * are almost all "<20".
 */
export const AUDIT_PAGES: readonly AuditPage[] = [
  { path: "/", gated: ALL },
  { path: "/guide/", gated: ALL },
  { path: "/guide/189/", gated: ALL },
  { path: "/guide/190/", gated: ALL },
  { path: "/guide/491/", gated: ALL },
  { path: "/occupations/", gated: ALL },
  { path: "/occupations/registered-nurses-nec-254499/", gated: ALL },
  { path: "/occupations/software-engineer-261313/", gated: ALL },
  { path: "/occupations/cook-351411/", gated: ALL },
  {
    path: "/occupations/intensive-care-ambulance-paramedic-411112/",
    gated: ALL,
  },
  { path: "/states/", gated: ALL },
  { path: "/methodology/", gated: ALL },
  { path: "/sample/", gated: ALL },
  { path: "/check/", gated: ALL },
  { path: "/feedback/", gated: QUALITY_ONLY },
  // The 404 page itself: Lighthouse won't audit a response with a 404
  // status, so it loads the file Cloudflare serves for a missing path.
  { path: "/404.html", gated: QUALITY_ONLY },
];
