import { SampleTabs } from "@/components/report/sample-tabs";
import type { SampleExample } from "@/components/report/sample-tabs";
import styles from "@/components/report/sample-tabs.module.css";
import { toOccupationEvidence } from "@/lib/data/legacy";
import {
  loadManifest,
  loadOccupationCore,
  loadOccupationDetail,
} from "@/lib/data/load-server";
import { reportSource } from "@/lib/data/report-source";
import type { OccupationCore, OccupationDetail } from "@/lib/data/types";
import { EXAMPLES } from "@/lib/outlook/examples";
import { SAMPLE_AS_OF, SAMPLE_COMPARISON } from "@/lib/sample";
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
  const examples: SampleExample[] = EXAMPLES.map(({ id, tab, profile }) => {
    const core = requireCore(profile.occupation);
    return {
      id,
      tab,
      profile,
      occupation: {
        status: "ready",
        evidence: toOccupationEvidence(core),
        core,
        detail: {
          status: "ready",
          detail: requireDetail(profile.occupation),
        },
      },
    };
  });
  const first = examples[0].occupation;
  if (first.status !== "ready") throw new Error("Sample needs a core");
  return (
    <main id="main" className="container">
      {/* The report's own headline is the page's one h1. */}
      <p className={styles.intro}>
        Four fictional people, one for each kind of result. The points
        calculations and official occupation snapshot are real. Your own report
        uses your answers.
      </p>
      <SampleTabs
        examples={examples}
        asOf={SAMPLE_AS_OF}
        initialComparison={toOccupationEvidence(requireCore(SAMPLE_COMPARISON))}
        source={reportSource(first.core.asAt, loadManifest())}
      />
    </main>
  );
}
