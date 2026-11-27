/**
 * SERVER ONLY. Reads the site's data with node `fs` (through the data,
 * updates and state-page loaders) for the launch pack renderer.
 */
import { stateRuleData } from "../../components/data/state-rule-data";
import { FEES } from "../../data/guide/fees";
import { PASS_MARK, POINTS_TABLE } from "../../data/guide/points-table";
import { GUIDE_CHECKED_AT } from "../../data/guide/sources";
import { VISA_GUIDES } from "../../data/guide/visas";
import {
  loadManifest,
  loadOccupationCore,
  loadRounds,
} from "../data/load-server";
import type { StateCode } from "../data/types";
import { glossaryTerms } from "../guide/glossary";
import { tieBreakFor } from "../occupation-page/cutoffs";
import { stateRows } from "../occupation-page/states";
import { summarise189Rounds } from "../report/round-status";
import { loadStatePageView } from "../state-page/load-server";
import { loadLatestRound, loadRecap } from "../updates/load-server";
import type { EnoughInput } from "./enough-post";
import type { LaunchInput } from "./launch-pack";
import type { OccupationInput } from "./occupation-post";

function loadOccupation(code: string): OccupationInput {
  const core = loadOccupationCore(code);
  if (!core) throw new Error(`No published data for occupation ${code}`);
  const latest = summarise189Rounds(core.rounds189).latestCutoff;
  return {
    core,
    rows: stateRows(code, core, stateRuleData),
    tieBreak: latest ? tieBreakFor(loadRounds(), code, latest.date) : null,
    federal: stateRuleData.federal,
  };
}

/** The launch pack's input for one state and one occupation spotlight. */
export function loadLaunchInput(options: {
  state: StateCode;
  occupation: string;
}): LaunchInput {
  const manifest = loadManifest();
  const round = loadLatestRound();
  if (!round) throw new Error("No 189 round in the recap facts");
  return {
    asAt: manifest.asAt,
    recap: loadRecap(round.month),
    round,
    pointsTable: POINTS_TABLE,
    passMark: PASS_MARK,
    guides: VISA_GUIDES,
    fees: FEES,
    guideCheckedAt: GUIDE_CHECKED_AT,
    glossary: glossaryTerms({
      dashboard: manifest.sources.dashboard,
      currentRounds: manifest.sources.currentRounds,
    }),
    state: loadStatePageView(options.state),
    occupation: loadOccupation(options.occupation),
  };
}

/** The newest 189 round and its recap section, for the "Is 65 points enough?" reel. */
export function loadEnoughInput(): EnoughInput {
  const round = loadLatestRound();
  if (!round) throw new Error("No 189 round in the recap facts");
  const section = loadRecap(round.month).rounds[round.date];
  if (!section) throw new Error(`${round.month} has no round on ${round.date}`);
  return { round, section, passMark: PASS_MARK };
}
