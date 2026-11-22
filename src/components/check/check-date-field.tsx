import { DateInput } from "@mantine/dates";
import { CalendarDays } from "lucide-react";
import controls from "./check-controls.module.css";
import type { CheckStepProps } from "./types";

type DateFieldKey =
  | "dob"
  | "englishDate"
  | "visaExpiry"
  | "professionalYearDate"
  | "communityLanguageExpiry"
  | "assessmentDate"
  | "assessmentExpiry"
  | "eoiDate";

type CheckDateFieldProps = CheckStepProps & {
  field: DateFieldKey;
  label: string;
  description?: string;
  pastOnly?: boolean;
};

export function CheckDateField({
  field: key,
  label,
  description,
  pastOnly = false,
  profile,
  update,
  asOf,
}: CheckDateFieldProps) {
  return (
    <DateInput
      label={label}
      description={description}
      placeholder="DD MMM YYYY"
      valueFormat="DD MMM YYYY"
      clearable={key !== "dob"}
      value={profile[key] || null}
      onChange={(value) => update(key, value ?? "")}
      maxDate={pastOnly ? asOf : undefined}
      minDate="1900-01-01"
      maxLevel="decade"
      defaultDate={key === "dob" ? "1995-01-01" : asOf}
      leftSection={<CalendarDays size={16} />}
      size="md"
      radius="md"
      popoverProps={{
        shadow: "md",
        withinPortal: true,
        classNames: { dropdown: controls.calendar },
      }}
      aria-required={key === "dob"}
    />
  );
}
