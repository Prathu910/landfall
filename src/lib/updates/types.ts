import type { NominationsTable, RoundTotal } from "../data/rounds-file";
import type {
  CountText,
  Interval,
  MonthKey,
  StateCode,
  StateKey,
  StateVisa,
  Visa,
} from "../data/types";

/** An occupation named in a round; `code` is null when no dashboard occupation matched. */
export type OccRef = { code: string | null; name: string };

export type CutoffMove = {
  code: string;
  name: string;
  previous: number;
  current: number;
};

/** A 189 pool change with exact counts at both ends. */
export type PoolMove = CutoffMove;

export type RoundSection = {
  generatedAt: string; // Sydney date
  sources: {
    currentRounds: string;
    previousRounds: string;
    checkedAt: string;
  };
  /** Never null: the round job refuses a round without a totals table (R4). */
  totals: RoundTotal[];
  occupations: {
    code: string | null;
    name: string;
    cutoff: number;
    previousCutoff: number | null;
    tieBreak: string | null;
  }[];
  distribution: { score: number; occupations: number }[];
  previousRound: { date: string; listed: number } | null;
  comparison: {
    fell: number;
    rose: number;
    same: number;
    newlyListed: OccRef[];
    notListedAgain: OccRef[];
    falls: CutoffMove[];
    rises: CutoffMove[];
  } | null;
  cardPicks: CutoffMove[];
};

export type StateFigure = {
  total: Interval;
  floor: number;
  maskedCells: number;
  previousFloor: number | null;
  top: { code: string; name: string; total: Interval }[];
};

export type MonthPair = { current: Interval; previous: Interval | null };

export type ScoreTotal = { score: number; count: Interval };

export type NotableRow = {
  code: string;
  name: string;
  cutoff: number;
  previousCutoff: number | null;
  tieBreak: string | null;
  pool: CountText;
  invited: CountText | null;
};

export type NotListedRow = {
  code: string;
  name: string;
  pool: number;
  roundsNotListed: number;
  lastListed: { date: string; cutoff: number } | null;
};

export type SpotlightSeries =
  | "SUBMITTED-189"
  | "SUBMITTED-190"
  | "SUBMITTED-491"
  | "INVITED-189"
  | "INVITED-190"
  | "INVITED-491";

/** `qualifiedBy: null` means "little changed this month". */
export type Spotlight = {
  code: string;
  name: string;
  pickedBy: "auto" | "founder";
  qualifiedBy: {
    series: SpotlightSeries;
    change: Interval;
    guaranteed: number;
  } | null;
  card: {
    latest189:
      | { kind: "listed"; date: string; cutoff: number }
      | { kind: "not-listed"; date: string }
      | { kind: "not-on-list" };
    rounds: { date: string; cutoff: number | null }[];
    tieBreak: string | null;
    invited189: { current: CountText | null; previous: CountText | null };
    pool189: { current: CountText | null; previous: CountText | null };
    top190: { state: StateCode; floor: number }[];
  };
};

export type DataSection = {
  generatedAt: string;
  sources: {
    snapshotId: string;
    checkedAt: string;
    previous: { month: MonthKey; snapshotId: string; checkedAt: string } | null;
    federalListCheckedAt: string;
  };
  national: Record<Visa, { submitted: MonthPair; invited: MonthPair }>;
  pool189ByScore: ScoreTotal[];
  invitedByScore: Record<Visa, ScoreTotal[]>;
  states: Record<StateVisa, Record<StateKey, StateFigure>>;
  nominations: NominationsTable | null;
  movers: { fell: PoolMove[]; rose: PoolMove[] };
  notable189: { round: string; rows: NotableRow[] } | null;
  largePoolsNotListed: NotListedRow[];
  spotlight: Spotlight;
  occupationsAdded: OccRef[] | null;
  occupationsRemoved: OccRef[] | null;
};

export type RecapFacts = {
  schemaVersion: 1;
  month: MonthKey;
  firstGeneratedAt: string;
  updatedAt: string;
  /** Keyed by round date (YYYY-MM-DD), every key inside `month`. */
  rounds: Record<string, RoundSection>;
  data: DataSection | null;
};
