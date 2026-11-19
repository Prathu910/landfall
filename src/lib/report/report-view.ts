import type { OccupationCore, OccupationDetail } from "../data/types";
import { buildTimeline, calculatePoints, type Profile } from "../migration";
import { applyScenarios, buildScenarios } from "../scenarios";
import { submissionMonth } from "./copy";
import {
  buildCutoffChart,
  buildLevers,
  type CutoffChart,
  type Lever,
} from "./data-says";
import { buildEoisLikeYours, type EoisLikeYours } from "./eois-like-yours";
import {
  buildRounds,
  buildSameScore,
  buildWhereYouStand,
  type RoundsBlock,
  type SameScore,
  type WhereYouStand,
} from "./panel-189";
import { buildNominatedPanel, type NominatedPanel } from "./panel-nominated";
import {
  buildScorecard,
  type Scorecard,
  type ScorecardData,
} from "./scorecard";
import {
  buildStateOutlookView,
  type StateOutlookView,
  type StateRuleData,
} from "./state-outlook-view";
import { buildWhatCouldChange, type ChangeItem } from "./what-could-change";

export type ReportViewInput = {
  occupationName: string;
  data: ScorecardData;
  /** The detail file failed to load, so its sections say so instead of loading. */
  detailUnavailable: boolean;
  profile: Profile;
  asOf: string;
  skippedRounds: { date: string }[];
  stateRuleData: StateRuleData;
};

export type PanelViews = {
  whereYouStand: WhereYouStand;
  sameScore: SameScore;
  rounds: RoundsBlock;
  eois: EoisLikeYours;
  changes: ChangeItem[];
  nominated: [NominatedPanel, NominatedPanel];
};

/** "What the data says" beyond the scorecard: the chart, EOIs like yours, the levers and the recap. */
export type DataSays = {
  chart: CutoffChart | null;
  /** The 189 panel's "EOIs like yours" sentence; null until it is ready. */
  like: string | null;
  levers: { add: Lever[]; dated: Lever[] };
  /** The bottom line and the state line, for the end of the report. */
  recap: string;
};

/** `panels`, `stateOutlook` and `dataSays` are null without occupation data: the scorecard explains why. */
export type ReportView = {
  scorecard: Scorecard;
  dataSays: DataSays | null;
  panels: PanelViews | null;
  stateOutlook: StateOutlookView | null;
};

const SAME_SCORE_FAILED: SameScore = {
  kind: "unavailable",
  text: "Published counts by submission month could not be loaded. Try again later.",
};
const EOIS_FAILED: EoisLikeYours = {
  kind: "unavailable",
  text: "Published outcomes by submission month could not be loaded. Try again later.",
};

/** Ruling S3: each scenario on its own, against the current 189 points. */
function scenarioGains(
  profile: Profile,
  asOf: string,
  base: number,
): { label: string; delta: number }[] {
  return buildScenarios(profile, asOf).map((scenario) => ({
    label: scenario.title,
    delta:
      calculatePoints(applyScenarios(profile, [scenario.id], asOf), asOf).base -
      base,
  }));
}

function buildPanels(
  input: ReportViewInput,
  core: OccupationCore,
  detail: OccupationDetail | null,
): PanelViews {
  const { occupationName, profile, asOf, detailUnavailable } = input;
  const points = calculatePoints(profile, asOf);
  const submittedMonth = submissionMonth(profile.eoiDate);
  const sameScore = buildSameScore(
    core,
    detail,
    points.base,
    submittedMonth,
    asOf,
  );
  const eois = buildEoisLikeYours({
    occupationName,
    core,
    detail,
    submittedMonth,
    asOf,
  });
  return {
    whereYouStand: buildWhereYouStand(core, points.base),
    sameScore:
      detailUnavailable && sameScore.kind === "loading"
        ? SAME_SCORE_FAILED
        : sameScore,
    rounds: buildRounds(core, input.skippedRounds),
    eois: detailUnavailable && eois.kind === "loading" ? EOIS_FAILED : eois,
    changes: buildWhatCouldChange(
      buildTimeline(profile, asOf),
      scenarioGains(profile, asOf, points.base),
      asOf,
    ),
    nominated: [
      buildNominatedPanel(core, "190", points.subclass190),
      buildNominatedPanel(core, "491", points.subclass491),
    ],
  };
}

/** Every view-model the report renders, from one profile and occupation. */
export function buildReportView(input: ReportViewInput): ReportView {
  const { occupationName, data, profile, asOf } = input;
  const points = calculatePoints(profile, asOf);
  const stateOutlook =
    data.kind === "ready"
      ? buildStateOutlookView({
          core: data.core,
          profile,
          asOf,
          points,
          data: input.stateRuleData,
        })
      : null;
  const scorecard = buildScorecard({
    occupationName,
    data,
    points,
    submittedMonth: submissionMonth(profile.eoiDate),
    stateSummaries: stateOutlook?.summaryByVisa ?? null,
    stateTiles: stateOutlook?.tilesByVisa ?? null,
  });
  const panels =
    data.kind === "ready" ? buildPanels(input, data.core, data.detail) : null;
  return {
    scorecard,
    dataSays:
      data.kind === "ready" && panels && scorecard.detail !== null
        ? {
            // No 189 EOIs published: the 189 card says so, and a chart of
            // empty rounds would add nothing.
            chart: data.core.pool["189"]
              ? buildCutoffChart(
                  occupationName,
                  data.core.rounds189,
                  points.base,
                )
              : null,
            like: panels.eois.kind === "ready" ? panels.eois.sentence : null,
            levers: buildLevers(
              panels.changes,
              data.core.rounds189,
              points.base,
            ),
            recap: `${scorecard.headline} ${scorecard.detail}`,
          }
        : null,
    panels,
    stateOutlook,
  };
}
