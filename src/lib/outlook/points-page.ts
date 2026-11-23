import type { MonthKey } from "../data/types";
import {
  MONTH_NAMES,
  addYearsToDate,
  ageOnDate,
  assessmentEndDate,
  formatDate,
} from "../migration";
import type { PointCategory, PointsResult, Profile } from "../migration";

export type PointsField = { label: string; value: string };
export type PointsRow = { label: string; detail: string; points: number };
export type PointsTotal = { points: number; label: string };

/** "Your points, in full": the profile as given, every category and the totals. */
export type PointsPage = {
  fields: PointsField[];
  rows: PointsRow[];
  /** The bonus categories worth nothing, in one line; null when none are zero. */
  zero: string | null;
  totals: PointsTotal[];
  /** A decorative passport-style line, hidden from assistive technology. */
  mrz: [string, string];
};

export type PointsPageInput = {
  profile: Profile;
  points: PointsResult;
  /** The occupation's display name, or a placeholder when none was chosen. */
  occupation: string;
  asOf: string;
  month: MonthKey;
  /** False when the Home Affairs list leaves the occupation off 189. */
  available189?: boolean;
};

const NOT_GIVEN = "Not given";
const MRZ_LENGTH = 44;
// The points test treats an English result as valid for 3 years.
const ENGLISH_VALID_YEARS = 3;
// Every reader answers these, so they show even at zero points.
const ALWAYS_SHOWN = new Set([
  "age",
  "english",
  "employment",
  "qualification",
  "partner",
]);
const ENGLISH: Record<Profile["english"], string> = {
  unknown: NOT_GIVEN,
  competent: "Competent",
  proficient: "Proficient",
  superior: "Superior",
};
const QUALIFICATION: Record<Profile["qualification"], string> = {
  unknown: NOT_GIVEN,
  none: "None of the listed qualifications",
  trade: "Diploma, trade or recognised qualification",
  bachelor: "Bachelor or master's degree",
  doctorate: "Doctorate",
};
const PARTNER: Record<Profile["partner"], string> = {
  unknown: NOT_GIVEN,
  single: "Single",
  citizen: "Partner is an Australian citizen or PR",
  skilled: "Partner meets the skilled partner requirements",
  english: "Partner meets the English-only requirements",
  none: "Partner meets neither category",
};
const BONUS: Record<string, string> = {
  "australian-study": "Australian study requirement met",
  "regional-study": "Studied in regional Australia",
  "specialist-education": "Australian research master's or doctorate",
  "professional-year": "Professional Year completed",
  "community-language": "Credentialled community language",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function plural(count: number, unit: string): string {
  return `${count} ${count === 1 ? unit : `${unit}s`}`;
}

function dobField(profile: Profile, asOf: string): string {
  const age = ageOnDate(profile.dob, asOf);
  return age === null ? NOT_GIVEN : `${formatDate(profile.dob)}, age ${age}`;
}

function whereField(profile: Profile): string {
  if (!profile.onshore) return "Offshore";
  return profile.state ? `Onshore, ${profile.state}` : "Onshore";
}

/** The points test's own end date: the letter's expiry or 3 years from issue. */
function assessmentField(profile: Profile, asOf: string): string {
  const end = assessmentEndDate(profile);
  if (!end) return NOT_GIVEN;
  return end <= asOf
    ? `Expired ${formatDate(end)}`
    : `Valid to ${formatDate(end)}`;
}

function englishField(profile: Profile, asOf: string): string {
  const level = ENGLISH[profile.english];
  if (profile.english === "unknown") return level;
  const end = addYearsToDate(profile.englishDate, ENGLISH_VALID_YEARS);
  if (!end) return `${level}, no test date given`;
  const verb = end <= asOf ? "expired" : "valid to";
  return `${level}, ${verb} ${formatDate(end)}`;
}

function fieldsOf(input: PointsPageInput): PointsField[] {
  const { profile, asOf, occupation } = input;
  const code = profile.occupation ? ` (${profile.occupation})` : "";
  const fields: PointsField[] = [
    { label: "Name", value: profile.name.trim() || NOT_GIVEN },
    { label: "Occupation", value: `${occupation}${code}` },
    { label: "Date of birth", value: dobField(profile, asOf) },
    { label: "Where you are", value: whereField(profile) },
    { label: "Skills assessment", value: assessmentField(profile, asOf) },
    { label: "English test", value: englishField(profile, asOf) },
  ];
  if (ISO_DATE.test(profile.eoiDate)) {
    fields.push({ label: "EOI submitted", value: formatDate(profile.eoiDate) });
  }
  return fields;
}

function employmentDetail(profile: Profile): string {
  const parts: string[] = [];
  if (profile.overseasYears > 0) {
    parts.push(`${plural(profile.overseasYears, "year")} overseas`);
  }
  if (profile.australianYears > 0) {
    parts.push(`${plural(profile.australianYears, "year")} in Australia`);
  }
  return parts.length ? parts.join(" and ") : "None";
}

function detailOf(category: PointCategory, input: PointsPageInput): string {
  const { profile, asOf } = input;
  switch (category.key) {
    case "age":
      return String(ageOnDate(profile.dob, asOf) ?? NOT_GIVEN);
    case "english":
      return ENGLISH[profile.english];
    case "employment":
      return employmentDetail(profile);
    case "qualification":
      return QUALIFICATION[profile.qualification];
    case "partner":
      return PARTNER[profile.partner];
    default:
      return BONUS[category.key] ?? category.label;
  }
}

function shown(category: PointCategory): boolean {
  return category.points > 0 || ALWAYS_SHOWN.has(category.key);
}

function mrzLine(text: string): string {
  return text.slice(0, MRZ_LENGTH).padEnd(MRZ_LENGTH, "<");
}

function mrzOf(input: PointsPageInput): [string, string] {
  const { profile, points, month } = input;
  const name =
    profile.name
      .toUpperCase()
      .replace(/[^A-Z]+/g, "<")
      .replace(/^<|<$/g, "") || "YOUR";
  const [year, monthNumber] = month.split("-");
  const stamp = `${MONTH_NAMES[Number(monthNumber) - 1].toUpperCase()}${year}`;
  const code = profile.occupation || "000000";
  return [
    mrzLine(`P<MLN${name}<<REPORT`),
    mrzLine(
      `${code}<189<${points.base}<190<${points.subclass190}<491<${points.subclass491}<<${stamp}`,
    ),
  ];
}

export function buildPointsPage(input: PointsPageInput): PointsPage {
  const { points } = input;
  const zero = points.categories.filter((category) => !shown(category));
  return {
    fields: fieldsOf(input),
    rows: points.categories.filter(shown).map((category) => ({
      label: category.label,
      detail: detailOf(category, input),
      points: category.points,
    })),
    zero: zero.length
      ? zero.map((category) => category.label).join(", ")
      : null,
    totals: [
      {
        points: points.base,
        label:
          input.available189 === false
            ? "189 Independent (not available for this occupation)"
            : "189 Independent",
      },
      { points: points.subclass190, label: "190 with nomination (+5)" },
      { points: points.subclass491, label: "491 with nomination (+15)" },
    ],
    mrz: mrzOf(input),
  };
}
