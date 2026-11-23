"use client";
import { Checkbox, Select } from "@mantine/core";
import type { QuickAnswers } from "@/lib/guide/quick-check";
import { GuideOccupationSelect } from "./guide-occupation-select";
import styles from "./quick-check.module.css";

type Option = { value: string; label: string };
type Change = (patch: Partial<QuickAnswers>) => void;

// Labels follow the Home Affairs points table (SOURCES.pointsTable).
const AGE: Option[] = [
  { value: "under-18", label: "Under 18" },
  { value: "18-24", label: "18 to 24" },
  { value: "25-32", label: "25 to 32" },
  { value: "33-39", label: "33 to 39" },
  { value: "40-44", label: "40 to 44" },
  { value: "45-plus", label: "45 or over" },
];
const ENGLISH: Option[] = [
  { value: "not-yet", label: "No test result yet" },
  { value: "competent", label: "Competent (e.g. IELTS 6 each)" },
  { value: "proficient", label: "Proficient (e.g. IELTS 7 each)" },
  { value: "superior", label: "Superior (e.g. IELTS 8 each)" },
];
const QUALIFICATION: Option[] = [
  { value: "doctorate", label: "Doctorate" },
  { value: "bachelor", label: "Bachelor or master’s degree" },
  { value: "trade", label: "Diploma or trade qualification" },
  { value: "none", label: "None of these, recognised" },
];
const OVERSEAS: Option[] = [
  { value: "0", label: "Less than 3 years" },
  { value: "3", label: "3 to 4 years" },
  { value: "5", label: "5 to 7 years" },
  { value: "8", label: "8 years or more" },
];
const AUSTRALIAN: Option[] = [
  { value: "0", label: "Less than 1 year" },
  { value: "1", label: "1 to 2 years" },
  { value: "3", label: "3 to 4 years" },
  { value: "5", label: "5 to 7 years" },
  { value: "8", label: "8 years or more" },
];
const PARTNER: Option[] = [
  { value: "single", label: "Single" },
  { value: "citizen", label: "Partner is an Australian citizen or PR" },
  {
    value: "skilled",
    label: "Partner has a skills assessment and competent English",
  },
  { value: "english", label: "Partner has competent English only" },
  { value: "none", label: "Partner meets neither" },
];
const ASSESSMENT: Option[] = [
  { value: "positive", label: "Yes, a positive outcome" },
  { value: "not-yet", label: "Not yet" },
];
const EXTRAS: { key: keyof QuickAnswers; label: string; points: number }[] = [
  { key: "ausStudy", label: "Australian study (2 academic years)", points: 5 },
  {
    key: "regionalStudy",
    label: "That study was in regional Australia",
    points: 5,
  },
  {
    key: "specialistEducation",
    label: "Australian research master’s or PhD in STEM",
    points: 10,
  },
  {
    key: "professionalYear",
    label: "Professional Year in Australia",
    points: 5,
  },
  {
    key: "communityLanguage",
    label: "NAATI community language credential",
    points: 5,
  },
];

function Choice({
  label,
  data,
  value,
  onChange,
}: {
  label: string;
  data: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select
      label={label}
      placeholder="Choose"
      data={data}
      value={value}
      onChange={onChange}
      allowDeselect={false}
      comboboxProps={{ withinPortal: false }}
    />
  );
}

/** The quick points questions; the occupation is shared with the rest of the page. */
export function QuickCheckForm({
  answers,
  onChange,
}: {
  answers: QuickAnswers;
  onChange: Change;
}) {
  return (
    <div className={styles.form}>
      <div className={styles.wide}>
        <GuideOccupationSelect />
      </div>
      <Choice
        label="Your age"
        data={AGE}
        value={answers.age}
        onChange={(v) => onChange({ age: v as QuickAnswers["age"] })}
      />
      <Choice
        label="English test result"
        data={ENGLISH}
        value={answers.english}
        onChange={(v) => onChange({ english: v as QuickAnswers["english"] })}
      />
      <Choice
        label="Highest recognised qualification"
        data={QUALIFICATION}
        value={answers.qualification}
        onChange={(v) =>
          onChange({ qualification: v as QuickAnswers["qualification"] })
        }
      />
      <Choice
        label="Skills assessment"
        data={ASSESSMENT}
        value={answers.assessment}
        onChange={(v) =>
          onChange({ assessment: v as QuickAnswers["assessment"] })
        }
      />
      <Choice
        label="Skilled work outside Australia (last 10 years)"
        data={OVERSEAS}
        value={String(answers.overseasYears)}
        onChange={(v) => onChange({ overseasYears: Number(v ?? 0) })}
      />
      <Choice
        label="Skilled work in Australia (last 10 years)"
        data={AUSTRALIAN}
        value={String(answers.australianYears)}
        onChange={(v) => onChange({ australianYears: Number(v ?? 0) })}
      />
      <div className={styles.wide}>
        <Choice
          label="Partner"
          data={PARTNER}
          value={answers.partner}
          onChange={(v) => onChange({ partner: v as QuickAnswers["partner"] })}
        />
      </div>
      <fieldset className={`${styles.wide} ${styles.extras}`}>
        <legend>Anything else that adds points</legend>
        {EXTRAS.map((extra) => (
          <Checkbox
            key={extra.key}
            label={`${extra.label} (+${extra.points})`}
            checked={Boolean(answers[extra.key])}
            disabled={extra.key === "regionalStudy" && !answers.ausStudy}
            onChange={(event) =>
              onChange({ [extra.key]: event.currentTarget.checked })
            }
          />
        ))}
      </fieldset>
    </div>
  );
}
