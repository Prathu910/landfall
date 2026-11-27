"use client";
import type { ReactNode } from "react";
import { Alert, Checkbox } from "@mantine/core";
import { ShieldCheck } from "lucide-react";
import { formatDate, type Profile, type PointsResult } from "@/lib/migration";
import styles from "./check-flow.module.css";
export function CheckReviewStep({
  profile,
  result,
  asOf,
  occupationName,
  save,
  allowSave,
  onSave,
  children,
}: {
  profile: Profile;
  result: PointsResult;
  asOf: string;
  occupationName: string;
  save: boolean;
  allowSave: boolean;
  onSave: (save: boolean) => void;
  /** The sample run's note, shown under the save option. */
  children?: ReactNode;
}) {
  return (
    <>
      <div className={styles.review}>
        {[
          ["Name", profile.name || "Not provided"],
          ["Date of birth", formatDate(profile.dob)],
          ["Occupation", occupationName],
          ["English", profile.english],
          ["Qualification", profile.qualification],
          [
            "Skilled experience",
            `${profile.overseasYears} overseas + ${profile.australianYears} Australian years`,
          ],
          ["Partner category", profile.partner],
          ["189 points", String(result.base)],
          ["Calculated on", formatDate(asOf)],
        ].map(([key, value]) => (
          <div key={key}>
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <Alert icon={<ShieldCheck size={18} />} color="ink" radius="md">
        Your answers are self-reported. Your free result shows your points and
        your outlook for each visa from published data; it does not establish
        visa eligibility or guarantee an invitation.
      </Alert>
      <Checkbox
        label="Save my progress on this device"
        description="Optional. Anyone using this browser may see saved answers. Clear them below at any time."
        disabled={!allowSave}
        checked={save}
        onChange={(e) => onSave(e.currentTarget.checked)}
        size="md"
      />
      {children}
    </>
  );
}
