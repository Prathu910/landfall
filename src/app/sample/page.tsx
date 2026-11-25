import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { stateRuleData } from "@/components/data/state-rule-data";
import { SampleTabs } from "@/components/report/sample-tabs";
import type { SampleExample } from "@/components/report/sample-tabs";
import { toOccupationEvidence } from "@/lib/data/legacy";
import {
  loadSampleCore,
  loadSampleDetail,
  loadSampleMeta,
} from "@/lib/data/load-server";
import { reportSource } from "@/lib/data/report-source";
import { EXAMPLES, SAMPLE_CODES } from "@/lib/outlook/examples";
import { buildReportPayload } from "@/lib/report-issue/build";
import { SAMPLE_AS_OF } from "@/lib/sample";
import { dayText, monthEnd } from "@/lib/updates/format";
import styles from "./sample-page.module.css";
export const metadata = { title: "Explore the sample report" };

export default function SamplePage() {
  const meta = loadSampleMeta();
  const source = reportSource(
    loadSampleCore(EXAMPLES[0].profile.occupation).asAt,
    meta,
  );
  // The reports are built here, at build time; the page's client code only shows them.
  const examples: SampleExample[] = EXAMPLES.map(({ id, tab, profile }) => {
    const core = loadSampleCore(profile.occupation);
    const detail = loadSampleDetail(profile.occupation);
    return {
      id,
      tab,
      occupation: {
        status: "ready",
        evidence: toOccupationEvidence(core),
        core,
        detail: { status: "ready", detail },
      },
      payload: buildReportPayload({
        profile,
        asOf: SAMPLE_AS_OF,
        core,
        detail,
        rules: stateRuleData,
        source,
        meta: null,
      }),
    };
  });
  const dataAsAt = dayText(monthEnd(meta.asAt));
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
            report uses your answers. Example reports use SkillSelect data as at{" "}
            {dataAsAt}.
            <span className={styles.guideLink}>
              {" "}
              New to skilled PR?{" "}
              <Link href="/guide/">Read the step-by-step guide</Link>.
            </span>
          </p>
        </header>
        <SampleTabs
          examples={examples}
          fixedComparisons={SAMPLE_CODES.map((code) =>
            toOccupationEvidence(loadSampleCore(code)),
          )}
        />
      </div>
    </main>
  );
}
