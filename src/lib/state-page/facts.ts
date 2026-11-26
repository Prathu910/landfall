import type { StateProgram } from "../../data/states";
import type { RoundsFile } from "../data/rounds-file";
import type {
  Interval,
  Manifest,
  MonthKey,
  OccupationCore,
  StateCode,
  StateVisa,
} from "../data/types";
import type { StateRuleData } from "../report/state-outlook-view";
import { buildStateCards, type StateCard } from "../states-page/state-cards";
import { stateNominations, type StateNominations } from "./nominations";
import { statePoolTotal } from "./pool";
import {
  importedListSize,
  rulesCheckedAt,
  selectionLines,
  streamRows,
  STATE_VISAS,
  type SelectionLine,
  type StreamRow,
} from "./program";
import { lowestPublishedScore, stateScoreSums, type ScoreSum } from "./scores";
import {
  latestFigure,
  stateSeries,
  type StateFigureCell,
  type StateSeries,
} from "./series";
import { statePage, type StatePage } from "./slug";
import { topStateOccupations, type StateOccupationRow } from "./occupations";

export type StatePageInput = {
  state: StateCode;
  /** Current cores only (`currentCores`). */
  cores: readonly OccupationCore[];
  manifest: Pick<
    Manifest,
    "snapshotId" | "asAt" | "checkedAt" | "roundsCheckedAt" | "sources"
  >;
  rounds: RoundsFile;
  ruleData: StateRuleData;
  programs: StateProgram[];
};

/** Everything one visa's sections say about the state. */
export type StateVisaFacts = {
  visa: StateVisa;
  series: StateSeries;
  latest: StateFigureCell | null;
  pool: Interval | null;
  scores: ScoreSum[];
  lowestScore: number | null;
  top: { rows: StateOccupationRow[]; withPublished: number };
  list: { count: number; checkedAt: string } | null;
};

export type StateFacts = {
  page: StatePage;
  asAt: MonthKey;
  manifest: StatePageInput["manifest"];
  visas: Record<StateVisa, StateVisaFacts>;
  nominations: StateNominations | null;
  card: StateCard;
  streams: StreamRow[];
  selection: SelectionLine[];
  rulesCheckedAt: string;
  /** The rule data's program year as printed: "2026–27". */
  programYear: string;
};

function visaFacts(input: StatePageInput, visa: StateVisa): StateVisaFacts {
  const { cores, state } = input;
  const asAt = input.manifest.asAt;
  const series = stateSeries(cores, visa, state, asAt);
  const scores = stateScoreSums(cores, visa, state, asAt);
  const list = importedListSize(input.ruleData, state, visa);
  return {
    visa,
    series,
    latest: latestFigure(series),
    pool: statePoolTotal(cores, visa, state),
    scores,
    lowestScore: lowestPublishedScore(scores),
    top: topStateOccupations(cores, visa, state, asAt),
    // An imported list with no codes for the visa says nothing about it.
    list: list && list.count > 0 ? list : null,
  };
}

/** The facts behind one state page; every figure is computed here, once. */
export function buildStateFacts(input: StatePageInput): StateFacts {
  const { state, ruleData } = input;
  const card = buildStateCards(input.programs, ruleData).find(
    (c) => c.code === state,
  );
  if (!card) throw new Error(`No state program summary for ${state}`);
  const [v190, v491] = STATE_VISAS.map((visa) => visaFacts(input, visa));
  return {
    page: statePage(state),
    asAt: input.manifest.asAt,
    manifest: input.manifest,
    visas: { "190": v190, "491": v491 },
    nominations: stateNominations(input.rounds, state),
    card,
    streams: streamRows(ruleData, state),
    selection: selectionLines(ruleData, state),
    rulesCheckedAt: rulesCheckedAt(ruleData, state),
    programYear: ruleData.rules.programYear.replace("-", "–"),
  };
}
