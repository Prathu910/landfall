import { sampleProfile, type Profile } from "./migration";

/** The date the sample report is calculated at, pinned so it never drifts. */
export const SAMPLE_AS_OF = "2026-11-17";

/** Aarav's comparison occupation, rendered into the static HTML: Registered Nurse (Aged Care). */
export const SAMPLE_COMPARISON = "254412";

/**
 * The `/sample/` profile: Aarav, a nurse (Registered Nurses nec) onshore in
 * Victoria, with his dates filled in. The homepage demo and the check's
 * "Try sample answers" use it too.
 */
export const sampleReportProfile: Profile = {
  ...sampleProfile,
  onshore: true,
  state: "VIC",
  visaExpiry: "2027-09-30",
  assessmentDate: "2026-02-20",
  assessmentExpiry: "2029-02-20",
  eoiDate: "2026-03-14",
};
