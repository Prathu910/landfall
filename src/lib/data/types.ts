export type Visa = "189" | "190" | "491";
export type StateVisa = "190" | "491";
export type EoiStatus = "SUBMITTED" | "INVITED" | "LODGED" | "HOLD" | "CLOSED";
export type StateCode =
  "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
export type StateKey = StateCode | "ANY";
export type ProfileAttribute =
  "english" | "australianStudy" | "professionalYear" | "partnerSkills";
export type MonthKey = string; // "YYYY-MM"
export type CountText = string; // displayed qText: digits or "<20"
export type ScoreCounts = Record<string, CountText>; // key = score as string, e.g. "90"
export type Interval = { min: number; max: number };

/**
 * Multi-month maps (statusHistory, invitedByScore, stateInvited and
 * invitedProfile) hold a key for every month that was fetched, `{}` when the
 * occupation had no rows that month (zero). A month without a key was not
 * fetched: "not published", never zero.
 */
export type RecordSchemaVersion = 2;

export type OccupationCore = {
  schemaVersion: RecordSchemaVersion;
  snapshotId: string;
  asAt: MonthKey;
  code: string;
  name: string;
  group: string | null;
  pool: Partial<Record<Visa, { total: CountText; byScore: ScoreCounts }>>; // SUBMITTED, latest as-at
  statusHistory: Partial<
    Record<Visa, Record<MonthKey, Partial<Record<EoiStatus, CountText>>>>
  >;
  invitedByScore: Partial<Record<Visa, Record<MonthKey, ScoreCounts>>>;
  statePool: Partial<Record<StateVisa, Partial<Record<StateKey, ScoreCounts>>>>;
  stateInvited: Partial<
    Record<StateVisa, Partial<Record<StateKey, Record<MonthKey, ScoreCounts>>>>
  >;
  rounds189: { date: string; cutoff: number | null }[]; // newest first
};

export type OccupationDetail = {
  schemaVersion: RecordSchemaVersion;
  snapshotId: string;
  asAt: MonthKey;
  code: string;
  cohorts: Partial<
    Record<
      Visa,
      Record<MonthKey | "older", Partial<Record<EoiStatus, CountText>>>
    >
  >;
  cohortsByScore: Partial<
    Record<Visa, Record<string, Record<MonthKey | "older", CountText>>>
  >; // SUBMITTED only; score -> submitted month
  invitedProfile: Partial<
    Record<
      Visa,
      Partial<
        Record<ProfileAttribute, Record<MonthKey, Record<string, CountText>>>
      >
    >
  >; // attribute -> as-at month -> displayed value -> count
  invitedProfileState: Partial<
    Record<
      StateVisa,
      Partial<
        Record<
          StateKey,
          Partial<Record<ProfileAttribute, Record<string, CountText>>>
        >
      >
    >
  >;
};

export type OccupationIndexEntry = {
  code: string;
  name: string;
  hasData: boolean;
  /**
   * Set only on an occupation that dropped out of the SkillSelect data: the
   * last month it was published. Its files hold that month's figures.
   */
  lastAsAt?: MonthKey;
  /** The date the data was last checked while this occupation was still in it. */
  lastCheckedAt?: string; // YYYY-MM-DD
};
export type Manifest = {
  schemaVersion: 1;
  snapshotId: string;
  asAt: MonthKey;
  checkedAt: string; // YYYY-MM-DD
  importVersion: string;
  sources: { dashboard: string; currentRounds: string; previousRounds: string };
  roundsUnmatched: string[]; // round-table occupation names with no dashboard match
  occupations: (OccupationIndexEntry & {
    group: string | null;
    totals: Partial<Record<Visa, CountText>>;
  })[];
};
