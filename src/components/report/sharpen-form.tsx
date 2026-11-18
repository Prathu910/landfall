"use client";

import { NumberInput, Select } from "@mantine/core";
import { useState } from "react";
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

// Main-check answers stored as strings: "" means unanswered.
const TEXT_FIELDS: (keyof Profile)[] = [
  "state",
  "visaExpiry",
  "englishDate",
  "assessmentDate",
  "assessmentExpiry",
];

/** Passes a state-outlook answer through validation; null or "" clears it. */
function patchFor(field: keyof Profile, value: unknown): Partial<Profile> {
  if (TEXT_FIELDS.includes(field)) {
    return { [field]: typeof value === "string" ? value : "" };
  }
  if (!isAnswered(value)) return { [field]: null };
  return normaliseStateAnswers({ [field]: value });
}

/** The error for typed text that is not a valid answer; "" means no error. */
function numberError(text: string | number, question: Question): string {
  if (text === "") return "";
  const unit = question.kind === "years" ? "years" : "months";
  const message = `Enter 0 to ${question.max} ${unit}`;
  const n = Number(text);
  if (!Number.isFinite(n)) return message;
  return Object.keys(normaliseStateAnswers({ [question.field]: n })).length > 0
    ? ""
    : message;
}

/**
 * Keeps what the user is typing ("1." on the way to "1.5") apart from the
 * profile, and commits only valid values. An invalid entry shows an error and
 * clears the stored answer, so the outlook never uses a value the field
 * doesn't show.
 */
function NumberAnswer({
  question,
  value,
  readOnly,
  set,
}: {
  question: Question;
  value: number | null;
  readOnly: boolean;
  set: (value: unknown) => void;
}) {
  const [text, setText] = useState<string | number>(value ?? "");
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    // The profile changed from outside (for example "Clear this answer").
    setSeen(value);
    setText(value ?? "");
  }
  const error = numberError(text, question);
  return (
    <NumberInput
      label={question.text}
      description={question.help}
      readOnly={readOnly}
      size="md"
      radius="md"
      min={0}
      max={question.max}
      allowDecimal={question.kind === "years"}
      decimalScale={1}
      step={question.kind === "years" ? 0.5 : 1}
      clampBehavior="none"
      error={error || undefined}
      value={text}
      onChange={(v) => {
        setText(v);
        const next = v === "" || numberError(v, question) ? null : Number(v);
        setSeen(next);
        set(next);
      }}
    />
  );
}

function Input({
  question,
  profile,
  readOnly,
  set,
}: {
  question: Question;
  profile: Profile;
  readOnly: boolean;
  set: (value: unknown) => void;
}) {
  const common = {
    label: question.text,
    description: question.help,
    readOnly,
    size: "md",
    radius: "md",
  } as const;
  const value = profile[question.field];
  switch (question.kind) {
    case "months":
    case "years":
      return (
        <NumberAnswer
          question={question}
          value={typeof value === "number" ? value : null}
          readOnly={readOnly}
          set={set}
        />
      );
    case "date":
      return (
        <DateInput
          {...common}
          placeholder="DD MMM YYYY"
          valueFormat="DD MMM YYYY"
          minDate="1900-01-01"
          value={typeof value === "string" && value !== "" ? value : null}
          onChange={(v) => set(v ?? "")}
          popoverProps={{ shadow: "md", withinPortal: true }}
        />
      );
    case "regional":
      return (
        <Select
          {...common}
          data={YES_NO}
          clearable={!readOnly}
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
          clearable={!readOnly}
          value={typeof value === "string" ? value : null}
          onChange={set}
        />
      );
    case "state":
      return (
        <Select
          {...common}
          data={STATE_OPTIONS}
          clearable={!readOnly}
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
                readOnly={readOnly}
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
