import {
  loadOccupationCore,
  loadOccupationDetail,
} from "../../lib/data/load-server";
import { toOccupationEvidence } from "../../lib/data/legacy";
import { calculatePoints, type PointCategory } from "../../lib/migration";
import type { ReportView } from "../../lib/report/report-view";
import { SAMPLE_AS_OF, sampleReportProfile as profile } from "../../lib/sample";
import { occupationIndex } from "../data/occupation-index";
import { reportView } from "../report/report-view";

/**
 * The sample report's view-model, loaded the way `/sample/` loads it. Server
 * only (it reads the data files), so a missing file fails the build.
 */
export function buildSampleView(): {
  view: ReportView;
  occupationName: string;
  points: number;
  categories: PointCategory[];
} {
  const core = loadOccupationCore(profile.occupation);
  const detail = loadOccupationDetail(profile.occupation);
  if (!core || !detail) {
    throw new Error(`Sample needs occupation ${profile.occupation}`);
  }
  const view = reportView({
    profile,
    asOf: SAMPLE_AS_OF,
    occupation: {
      status: "ready",
      evidence: toOccupationEvidence(core),
      core,
      detail: { status: "ready", detail },
    },
    index: occupationIndex,
  });
  const result = calculatePoints(profile, SAMPLE_AS_OF);
  return {
    view,
    occupationName: core.name,
    points: result.base,
    categories: result.categories,
  };
}
