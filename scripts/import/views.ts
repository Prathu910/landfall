import type {
  EoiStatus,
  ProfileAttribute,
  Visa,
} from "../../src/lib/data/types";

export type DetailField =
  "occupation" | "points" | "submittedMonth" | "state" | ProfileAttribute;
export type ViewId =
  | "pool-by-score"
  | "status-history"
  | "invited-by-score"
  | "cohorts"
  | "cohorts-by-score"
  | "state-pool"
  | "state-invited"
  | "invited-profile"
  | "invited-profile-state";

export type ViewDefinition = {
  id: ViewId;
  shown: DetailField[];
  partitionBy: ("state" | "score" | ProfileAttribute)[]; // run once per value; each counts as a filter
  /** Attributes run one at a time, each added to `shown` for its own run. */
  attributeVariants?: ProfileAttribute[];
  statuses: EoiStatus[];
  visas: Visa[];
  months: "latest" | { latest: number }; // { latest: 24 } = all
  detail: boolean; // true -> goes to the .detail.json file
};

const ALL_STATUSES: EoiStatus[] = [
  "SUBMITTED",
  "INVITED",
  "LODGED",
  "HOLD",
  "CLOSED",
];
const ALL_VISAS: Visa[] = ["189", "190", "491"];
const ATTRIBUTES: ProfileAttribute[] = [
  "english",
  "australianStudy",
  "professionalYear",
  "partnerSkills",
];

export const VIEWS: ViewDefinition[] = [
  {
    id: "pool-by-score",
    shown: ["occupation", "points"],
    partitionBy: [],
    statuses: ["SUBMITTED"],
    visas: ALL_VISAS,
    months: "latest",
    detail: false,
  },
  {
    id: "status-history",
    shown: ["occupation"],
    partitionBy: [],
    statuses: ALL_STATUSES,
    visas: ALL_VISAS,
    months: { latest: 24 },
    detail: false,
  },
  {
    id: "invited-by-score",
    shown: ["occupation", "points"],
    partitionBy: [],
    statuses: ["INVITED"],
    visas: ALL_VISAS,
    months: { latest: 24 },
    detail: false,
  },
  {
    id: "cohorts",
    shown: ["occupation", "submittedMonth"],
    partitionBy: [],
    statuses: ALL_STATUSES,
    visas: ALL_VISAS,
    months: "latest",
    detail: true,
  },
  {
    id: "cohorts-by-score",
    shown: ["occupation", "submittedMonth"],
    partitionBy: ["score"],
    statuses: ["SUBMITTED"],
    visas: ALL_VISAS,
    months: "latest",
    detail: true,
  },
  {
    id: "state-pool",
    shown: ["occupation", "points"],
    partitionBy: ["state"],
    statuses: ["SUBMITTED"],
    visas: ["190", "491"],
    months: "latest",
    detail: false,
  },
  {
    id: "state-invited",
    shown: ["occupation", "points"],
    partitionBy: ["state"],
    statuses: ["INVITED"],
    visas: ["190", "491"],
    months: { latest: 12 },
    detail: false,
  },
  {
    id: "invited-profile",
    shown: ["occupation"],
    partitionBy: [],
    attributeVariants: ATTRIBUTES,
    statuses: ["INVITED"],
    visas: ALL_VISAS,
    months: { latest: 12 },
    detail: true,
  },
  {
    id: "invited-profile-state",
    shown: ["occupation"],
    partitionBy: ["state"],
    attributeVariants: ATTRIBUTES,
    statuses: ["INVITED"],
    visas: ["190", "491"],
    months: "latest",
    detail: true,
  },
];

export const FIELD_NAMES: Record<
  DetailField,
  { field: string; toggle: `vShow${string}` }
> = {
  occupation: { field: "Occupation", toggle: "vShowOccupations" },
  points: { field: "Score", toggle: "vShowPoints" },
  submittedMonth: { field: "Month Submitted", toggle: "vShowSubmittedOn" },
  state: { field: "Nominated State", toggle: "vShowEOINomState" },
  english: { field: "English Test Score", toggle: "vShowEnglishLanguageScore" },
  australianStudy: {
    field: "Australian Study Flag",
    toggle: "vShowAustralianStudy",
  },
  professionalYear: {
    field: "Professional Year",
    toggle: "vShowEmpProfessionalYear",
  },
  partnerSkills: {
    field: "PartnerSkills Score",
    toggle: "vShowPartnerSkillsScore",
  },
};

/** Detail fields that count towards the publisher's filter limit. */
export const FILTER_FIELDS = [
  "Occupation Group",
  "Occupation",
  "Score",
  "Month Submitted",
  "PartnerSkills Score",
  "English Test Score",
  "Australian Study Flag",
  "Regional Study",
  "Specialist Education",
  "Nominated State",
  "Comm Language Qual",
  "Professional Year",
] as const;

/** Every display toggle; each run sets all of them explicitly. */
export const ALL_TOGGLES: `vShow${string}`[] = [
  "vShowOccupationGroups",
  "vShowOccupations",
  "vShowPoints",
  "vShowSubmittedOn",
  "vShowPartnerSkillsScore",
  "vShowEnglishLanguageScore",
  "vShowAustralianStudy",
  "vShowRegionalStudy",
  "vShowSpecialistEducation",
  "vShowEOINomState",
  "vShowEduCommLanguageQual",
  "vShowEmpProfessionalYear",
];

export function assertWithinGuardrail(view: ViewDefinition): void {
  const shown = view.shown.length + (view.attributeVariants ? 1 : 0);
  if (shown > 2) {
    throw new Error(
      `${view.id}: ${shown} shown columns exceeds the limit of 2`,
    );
  }
  if (view.partitionBy.length > 2) {
    throw new Error(
      `${view.id}: ${view.partitionBy.length} filters exceeds the limit of 2`,
    );
  }
}
