import { Alert, Badge, Checkbox, Select } from "@mantine/core";
import { CalendarDays, Info } from "lucide-react";
import type { Profile } from "@/lib/migration";
import { CheckExperienceField } from "./check-experience-field";
import { CheckDateField } from "./check-date-field";
import type { CheckStepProps } from "./types";
import styles from "../check-flow.module.css";

export function CheckWorkStep({ profile, update, asOf }: CheckStepProps) {
  return (
    <>
      <Alert icon={<Info size={17} />} color="ink" variant="light" radius="md">
        Qualifying work must be paid, at least 20 hours a week, and in your
        nominated or a closely related occupation. Australian work must meet
        visa conditions.
      </Alert>
      <div className={styles.columns}>
        <CheckExperienceField
          profile={profile}
          update={update}
          field="overseasYears"
          label="Overseas skilled experience"
        />
        <CheckExperienceField
          profile={profile}
          update={update}
          field="australianYears"
          label="Australian skilled experience"
        />
      </div>
      <Select
        label="Partner status"
        placeholder="Choose your situation"
        value={profile.partner === "unknown" ? null : profile.partner}
        onChange={(value) =>
          update("partner", (value ?? "unknown") as Profile["partner"])
        }
        data={[
          { value: "single", label: "Single · 10 points" },
          {
            value: "citizen",
            label: "Partner is an Australian citizen or PR · 10 points",
          },
          {
            value: "skilled",
            label: "Partner meets all skilled partner requirements · 10 points",
          },
          {
            value: "english",
            label: "Partner meets English-only requirements · 5 points",
          },
          {
            value: "none",
            label: "Partner meets neither category · 0 points",
          },
        ]}
        size="md"
        radius="md"
        aria-required
      />
      {["skilled", "english"].includes(profile.partner) && (
        <p className={styles.help}>
          Partner must apply for the same visa. Skilled points also require
          being under 45, Competent English, an eligible occupation on the same
          list and a suitable assessment. Your answer confirms these conditions.
        </p>
      )}
      <Checkbox
        label="I completed an approved Professional Year in my eligible occupation"
        checked={profile.professionalYear}
        onChange={(event) =>
          update("professionalYear", event.currentTarget.checked)
        }
        size="md"
      />
      {profile.professionalYear && (
        <CheckDateField
          profile={profile}
          update={update}
          asOf={asOf}
          field="professionalYearDate"
          label="Professional Year completion date"
          pastOnly
        />
      )}
      <Checkbox
        label="I hold a recognised NAATI community language credential"
        checked={profile.communityLanguage}
        onChange={(event) =>
          update("communityLanguage", event.currentTarget.checked)
        }
        size="md"
      />
      {profile.communityLanguage && (
        <CheckDateField
          profile={profile}
          update={update}
          asOf={asOf}
          field="communityLanguageExpiry"
          label="Community language expiry (optional)"
        />
      )}
      <div className={styles.divider} />
      <h3 className={styles.sectionTitle}>
        <CalendarDays size={18} /> Dates for your timeline{" "}
        <Badge color="gray" variant="light" size="sm">
          Optional
        </Badge>
      </h3>
      <div className={styles.columns}>
        <CheckDateField
          profile={profile}
          update={update}
          asOf={asOf}
          field="assessmentDate"
          label="Skills assessment issue date"
          pastOnly
        />
        <CheckDateField
          profile={profile}
          update={update}
          asOf={asOf}
          field="assessmentExpiry"
          label="Assessment expiry on letter"
          description="The earlier of this date and the three-year cap is used."
        />
      </div>
      <CheckDateField
        profile={profile}
        update={update}
        asOf={asOf}
        field="eoiDate"
        label="EOI submission date"
        description="Submission date, not date of effect. Used for the two-year EOI validity window."
        pastOnly
      />
    </>
  );
}
