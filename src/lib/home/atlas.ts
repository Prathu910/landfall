import { calendarMonths } from "../data/months";
import { poolPosition } from "../data/pool-position";
import { stateEvidence } from "../data/state-evidence";
import type {
  Interval,
  Manifest,
  OccupationCore,
  StateCode,
  Visa,
} from "../data/types";
import { label189 } from "../outlook/label-189";
import { evidenceLabel } from "../outlook/label-state";
import { labelName } from "../outlook/labels";
import type { OutlookLabel } from "../outlook/labels";
import { formatMonth, formatSummed } from "../report/copy";
import { buildRounds } from "../report/panel-189";

export type HomeAtlasProvenance = Pick<
  Manifest,
  "snapshotId" | "asAt" | "checkedAt" | "sources"
>;

export type HomeAtlasMonth = {
  month: string;
  label: string;
  count: Interval | null;
  text: string;
  masked: boolean;
};

/** An "under N" month: a masked range that starts at zero. */
function mayBeZero(month: HomeAtlasMonth): boolean {
  return month.masked && month.count?.min === 0;
}

type PublishedMonth = { month: string; count: Interval; text: string };

type AtlasCommon = {
  basePoints: number;
  totalPoints: number;
  nominationPoints: number;
  label: OutlookLabel;
  labelText: string;
  explanation: string;
  caveat: string;
  provenance: HomeAtlasProvenance;
  sourceText: string;
  sourceHref: string;
};

export type HomeAtlasView = AtlasCommon &
  (
    | {
        kind: "national";
        visa: "189";
        higher: Interval | null;
        same: Interval | null;
        higherText: string;
        sameText: string;
        latestRound: string;
      }
    | {
        kind: "state";
        visa: "190" | "491";
        state: StateCode;
        months: HomeAtlasMonth[];
        latest: PublishedMonth | null;
        latestConfirmed: PublishedMonth | null;
      }
  );

const STATE_CAVEAT =
  "Historical evidence, not eligibility. Your full report checks state rules and your answers separately.";
const NATIONAL_CAVEAT =
  "189 is a national pathway. Select a state on the map to explore its 190 nomination evidence. Meeting a cut-off does not guarantee an invitation. Counts are EOIs, not unique people or a place in a queue; ties use an unpublished date of effect. Your points-test basics are checked in the full report.";

function publishedMonth(month: HomeAtlasMonth): PublishedMonth | null {
  return month.count
    ? { month: month.month, count: month.count, text: month.text }
    : null;
}

/**
 * A published-evidence preview, never a personal eligibility decision. Pass
 * only the manifest's provenance fields from the server; no dataset imports.
 */
export function buildHomeAtlas(
  core: OccupationCore,
  basePoints: number,
  visa: Visa,
  state: StateCode,
  provenance: HomeAtlasProvenance,
): HomeAtlasView {
  const nominationPoints = visa === "190" ? 5 : visa === "491" ? 15 : 0;
  const totalPoints = basePoints + nominationPoints;
  const common = {
    basePoints,
    totalPoints,
    nominationPoints,
    provenance: {
      ...provenance,
      snapshotId: core.snapshotId,
      asAt: core.asAt,
    },
    sourceText: `SkillSelect, as at ${formatMonth(core.asAt)}. Checked ${provenance.checkedAt}.`,
    sourceHref: provenance.sources.dashboard,
  };
  if (visa === "189") {
    const outcome = label189({ points: totalPoints, eligible: true, core });
    const position = poolPosition(core, null, visa, totalPoints, null);
    const higher = position.available ? position.higher : null;
    const same = position.available ? position.same : null;
    const latest = buildRounds(core, []).tiles[0];
    return {
      ...common,
      kind: "national",
      visa,
      label: outcome.label,
      labelText: labelName(outcome.label, outcome.tooFew),
      explanation: outcome.why,
      caveat: NATIONAL_CAVEAT,
      higher,
      same,
      higherText: higher ? formatSummed(higher) : "Not published",
      sameText: same ? formatSummed(same) : "Not published",
      latestRound: latest
        ? `${latest.value}, ${latest.label}`
        : "Not listed in any round we can read",
    };
  }
  const outcome = evidenceLabel(core, visa, state, totalPoints);
  const evidence = stateEvidence(core, visa, state, totalPoints, 6).state;
  const months = calendarMonths(core.asAt, 6).map((month): HomeAtlasMonth => {
    const row = evidence.invitedAtOrBelow.find((item) => item.asAt === month);
    const count = row?.invitedAtLeast ?? null;
    return {
      month,
      label: formatMonth(month),
      count,
      text: count ? formatSummed(count) : "Not published",
      masked: count !== null && count.min !== count.max,
    };
  });
  const latest = months.findLast((month) => (month.count?.max ?? 0) > 0);
  const latestConfirmed = months.findLast(
    (month) => (month.count?.min ?? 0) > 0,
  );
  return {
    ...common,
    kind: "state",
    visa,
    state,
    label: outcome.label,
    labelText: labelName(outcome.label),
    explanation:
      evidence.notPublished.length === 6
        ? "No monthly state evidence is published in this snapshot window."
        : `The stamp summarises published invitation evidence at your points. Patterned bars show ranges; their height marks the upper bound.${months.some(mayBeZero) ? " An “under” count may be zero." : ""}`,
    caveat:
      STATE_CAVEAT +
      (visa === "491"
        ? " The 491 is provisional; regional location requirements also apply."
        : ""),
    months,
    latest: latest ? publishedMonth(latest) : null,
    latestConfirmed: latestConfirmed ? publishedMonth(latestConfirmed) : null,
  };
}
