import { occupationIndex } from "@/components/data/occupation-index";
import { Report } from "@/components/report";
import { toOccupationEvidence, toPoolOccupation } from "@/lib/data/legacy";
import {
  loadManifest,
  loadOccupationCore,
  loadOccupationDetail,
} from "@/lib/data/load-server";
import { reportSource } from "@/lib/data/report-source";
import type { OccupationCore } from "@/lib/data/types";
import { sampleProfile } from "@/lib/migration";
export const metadata = { title: "Explore the sample report" };

/** Aarav's comparison occupation, rendered into the static HTML. */
const SAMPLE_COMPARISON = "261313";

function requireCore(code: string): OccupationCore {
  const core = loadOccupationCore(code);
  if (!core) throw new Error(`Sample report needs occupation ${code}`);
  return core;
}

export default function SamplePage() {
  const nominated = requireCore(sampleProfile.occupation);
  const nominatedDetail = loadOccupationDetail(sampleProfile.occupation);
  const comparison = requireCore(SAMPLE_COMPARISON);
  const profile = {
    ...sampleProfile,
    onshore: true,
    state: "VIC",
    visaExpiry: "2027-09-30",
    assessmentDate: "2026-02-20",
    assessmentExpiry: "2029-02-20",
    eoiDate: "2026-03-14",
  };
  return (
    <main id="main" className="container">
      <div className="page-head">
        <span className="eyebrow">See what clarity looks like</span>
        <h1>
          One person.
          <br />
          <em>Their whole picture.</em>
        </h1>
        <p>
          Aarav is fictional. The points calculations and official occupation
          snapshot are real. Your own overview uses your answers.
        </p>
      </div>
      <Report
        profile={profile}
        asOf="2026-11-17"
        sample
        occupation={{
          status: "ready",
          pool: toPoolOccupation(nominated),
          evidence: toOccupationEvidence(nominated),
          core: nominated,
          detail: nominatedDetail
            ? { status: "ready", detail: nominatedDetail }
            : { status: "unavailable" },
        }}
        comparisonIndex={occupationIndex}
        initialComparison={toOccupationEvidence(comparison)}
        source={reportSource(nominated.asAt, loadManifest())}
      />
    </main>
  );
}
