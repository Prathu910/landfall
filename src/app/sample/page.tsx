import { occupationIndex } from "@/components/data/occupation-index";
import { Report } from "@/components/report";
import { toOccupationEvidence } from "@/lib/data/legacy";
import {
  loadManifest,
  loadOccupationCore,
  loadOccupationDetail,
} from "@/lib/data/load-server";
import { reportSource } from "@/lib/data/report-source";
import type { OccupationCore, OccupationDetail } from "@/lib/data/types";
import { sampleProfile } from "@/lib/migration";
import {
  SAMPLE_AS_OF,
  SAMPLE_COMPARISON,
  sampleReportProfile,
} from "@/lib/sample";
export const metadata = { title: "Explore the sample report" };

function requireCore(code: string): OccupationCore {
  const core = loadOccupationCore(code);
  if (!core) throw new Error(`Sample report needs occupation ${code}`);
  return core;
}

/** The sample's panels need the detail file: a missing one fails the build, not the page. */
function requireDetail(code: string): OccupationDetail {
  const detail = loadOccupationDetail(code);
  if (!detail)
    throw new Error(`Sample report needs the detail file for ${code}`);
  return detail;
}

export default function SamplePage() {
  const nominated = requireCore(sampleProfile.occupation);
  const nominatedDetail = requireDetail(sampleProfile.occupation);
  const comparison = requireCore(SAMPLE_COMPARISON);
  return (
    <main id="main" className="container">
      <div className="page-head">
        <h1>A sample report for one fictional profile</h1>
        <p>
          Aarav is fictional. The points calculations and official occupation
          snapshot are real. Your own overview uses your answers.
        </p>
      </div>
      <Report
        profile={sampleReportProfile}
        asOf={SAMPLE_AS_OF}
        sample
        occupation={{
          status: "ready",
          evidence: toOccupationEvidence(nominated),
          core: nominated,
          detail: { status: "ready", detail: nominatedDetail },
        }}
        comparisonIndex={occupationIndex}
        initialComparison={toOccupationEvidence(comparison)}
        source={reportSource(nominated.asAt, loadManifest())}
      />
    </main>
  );
}
