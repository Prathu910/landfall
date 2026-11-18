"use client";

import { NumberInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { normaliseStateAnswers } from "../../lib/state-answers";
import { STATE_NAMES } from "../../lib/state-outlook/context";
import type { Question } from "../../lib/state-outlook/questions";
import type { Profile } from "../../lib/migration";
import styles from "./sharpen-form.module.css";

type Props = {
  questions: Question[];
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
  readOnly?: boolean;
};

const STATE_OPTIONS = Object.entries(STATE_NAMES).map(([value, label]) => ({
  value,
  label,
}));
const WITH_NONE = (none: string) => [
  ...STATE_OPTIONS,
  { value: "none", label: none },
];
const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function isAnswered(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

/** Passes a state-outlook answer through validation; null or "" clears it. */
function patchFor(field: keyof Profile, value: unknown): Partial<Profile> {
  if (field === "state" || field === "visaExpiry") {
    return { [field]: typeof value === "string" ? value : "" };
  }
  if (!isAnswered(value)) return { [field]: null };
  return normaliseStateAnswers({ [field]: value });
}

function Input({
  question,
  profile,
  disabled,
  set,
}: {
  question: Question;
  profile: Profile;
  disabled: boolean;
  set: (value: unknown) => void;
}) {
  const common = {
    label: question.text,
    description: question.help,
    disabled,
    size: "md",
    radius: "md",
  } as const;
  const value = profile[question.field];
  switch (question.kind) {
    case "months":
    case "years":
      return (
        <NumberInput
          {...common}
          min={0}
          max={question.max}
          allowDecimal={question.kind === "years"}
          decimalScale={1}
          step={question.kind === "years" ? 0.5 : 1}
          value={typeof value === "number" ? value : ""}
          onChange={(v) => set(v === "" ? null : Number(v))}
        />
      );
    case "visa-expiry":
      return (
        <DateInput
          {...common}
          placeholder="DD MMM YYYY"
          valueFormat="DD MMM YYYY"
          minDate="1900-01-01"
          value={profile.visaExpiry || null}
          onChange={(v) => set(v ?? "")}
          popoverProps={{ shadow: "md", withinPortal: true }}
        />
      );
    case "regional":
      return (
        <Select
          {...common}
          data={YES_NO}
          clearable
          value={typeof value === "boolean" ? (value ? "yes" : "no") : null}
          onChange={(v) => set(v === null ? null : v === "yes")}
        />
      );
    case "job-offer":
    case "study":
      return (
        <Select
          {...common}
          data={WITH_NONE(
            question.kind === "study"
              ? "I didn't study in Australia"
              : "No job offer",
          )}
          clearable
          value={typeof value === "string" ? value : null}
          onChange={set}
        />
      );
    case "state":
      return (
        <Select
          {...common}
          data={STATE_OPTIONS}
          clearable
          value={profile.state || null}
          onChange={(v) => set(v ?? "")}
        />
      );
  }
}

export function SharpenForm({
  questions,
  profile,
  onChange,
  readOnly = false,
}: Props) {
  if (questions.length === 0) return null;
  return (
    <details className={styles.form} open>
      <summary className={styles.summary}>Sharpen my state outlook</summary>
      <p className={styles.intro}>
        Optional. Answers stay in this browser and change which states we can
        check for you.
      </p>
      {readOnly && (
        <p className={styles.note}>Sample answers can&apos;t be changed.</p>
      )}
      <ul className={styles.questions}>
        {questions.map((q) => {
          const answered = isAnswered(profile[q.field]);
          const set = (value: unknown) => {
            const patch = patchFor(q.field, value);
            if (Object.keys(patch).length > 0) onChange(patch);
          };
          return (
            <li key={q.field} className={styles.question}>
              <Input
                question={q}
                profile={profile}
                disabled={readOnly}
                set={set}
              />
              <p className={styles.affects}>{q.affectsText}</p>
              {answered && !readOnly && q.kind !== "state" && (
                <button
                  type="button"
                  className={styles.clear}
                  onClick={() => set(null)}
                >
                  Clear this answer
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
