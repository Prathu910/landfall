import { NumberInput } from "@mantine/core";
import type { CheckStepProps } from "./types";

type CheckExperienceFieldProps = Pick<CheckStepProps, "profile" | "update"> & {
  field: "overseasYears" | "australianYears";
  label: string;
};

export function CheckExperienceField({
  field: key,
  label,
  profile,
  update,
}: CheckExperienceFieldProps) {
  return (
    <NumberInput
      label={label}
      description="Completed qualifying years in the last 10 years."
      min={0}
      max={10}
      step={0.5}
      decimalScale={1}
      value={profile[key]}
      onChange={(value) =>
        update(key, Math.min(10, Math.max(0, Number(value) || 0)))
      }
      size="md"
      radius="md"
    />
  );
}
