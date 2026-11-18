import { sampleProfile, type Profile } from "./migration";

/** The date the sample report is calculated at, pinned so it never drifts. */
export const SAMPLE_AS_OF = "2026-11-17";

/** Aarav's comparison occupation, rendered into the static HTML. */
export const SAMPLE_COMPARISON = "261313";

/** The `/sample/` profile: Aarav, onshore in Victoria, with his dates filled in. */
export const sampleReportProfile: Profile = {
  ...sampleProfile,
  onshore: true,
  state: "VIC",
  visaExpiry: "2027-09-30",
  assessmentDate: "2026-02-20",
  assessmentExpiry: "2029-02-20",
  eoiDate: "2026-03-14",
};
