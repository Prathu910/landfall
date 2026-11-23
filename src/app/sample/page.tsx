import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { SampleTabs } from "@/components/report/sample-tabs";
import type { SampleExample } from "@/components/report/sample-tabs";
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
import styles from "./sample-page.module.css";
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
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={12} aria-hidden />
          <span aria-current="page">Sample reports</span>
        </nav>
        <header className={styles.heading}>
          <div>
            <p className={styles.context}>
              <FileText size={16} aria-hidden /> Example reports
            </p>
            {/* Looks like the page title; the report's headline stays the one h1. */}
            <p className={styles.title}>Four people, four kinds of result.</p>
          </div>
          <p className={styles.description}>
            Four fictional people, one for each kind of result. The points
            calculations and official occupation snapshot are real. Your own
            report uses your answers.
            <span className={styles.guideLink}>
              {" "}
              New to skilled PR?{" "}
              <Link href="/guide/">Read the step-by-step guide</Link>.
            </span>
          </p>
        </header>
        <SampleTabs
          examples={examples}
          asOf={SAMPLE_AS_OF}
          initialComparison={toOccupationEvidence(
            requireCore(SAMPLE_COMPARISON),
          )}
          source={reportSource(first.core.asAt, loadManifest())}
        />
      </div>
    </main>
  );
}
