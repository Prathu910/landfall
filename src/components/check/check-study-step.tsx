import { Checkbox, Radio, Select } from "@mantine/core";
import type { Profile } from "@/lib/migration";
import { CheckDateField } from "./check-date-field";
import type { CheckStepProps } from "./types";
import styles from "../check-flow.module.css";

export function CheckStudyStep({ profile, update, asOf }: CheckStepProps) {
  return (
    <>
      <Radio.Group
        label="Your English proficiency"
        value={profile.english}
        onChange={(value) => update("english", value as Profile["english"])}
        size="md"
        withAsterisk
      >
        <div className={styles.englishChoices}>
          {[
            {
              value: "competent",
              label: "Competent",
              detail: "0 points",
            },
            {
              value: "proficient",
              label: "Proficient",
              detail: "10 points",
            },
            {
              value: "superior",
              label: "Superior",
              detail: "20 points",
            },
          ].map((option) => (
            <label
              className={`${styles.englishChoice} ${profile.english === option.value ? styles.selectedChoice : ""}`}
              key={option.value}
            >
              <Radio value={option.value} aria-label={option.label} size="sm" />
              <span>
                {option.label}
                <strong>{option.detail}</strong>
              </span>
            </label>
          ))}
        </div>
      </Radio.Group>
      <p className={styles.help}>
        Choose the level demonstrated by an accepted test, or Competent if you
        hold an eligible passport.{" "}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language"
        >
          Check official thresholds ↗
        </a>
      </p>
      <CheckDateField
        profile={profile}
        update={update}
        asOf={asOf}
        field="englishDate"
        label="English test date (optional)"
        description="Leave blank for passport evidence. Test results use a three-year window in this overview."
        pastOnly
      />
      <div className={styles.divider} />
      <Select
        label="Highest recognised qualification"
        placeholder="Choose your highest qualification"
        value={
          profile.qualification === "unknown" ? null : profile.qualification
        }
        onChange={(value) =>
          update(
            "qualification",
            (value ?? "unknown") as Profile["qualification"],
          )
        }
        data={[
          {
            value: "doctorate",
            label: "Doctorate · 20 points",
          },
          {
            value: "bachelor",
            label: "Bachelor’s or master’s degree · 15 points",
          },
          {
            value: "trade",
            label:
              "Australian diploma/trade, or recognised qualification · 10 points",
          },
          { value: "none", label: "None of these · 0 points" },
        ]}
        size="md"
        radius="md"
        aria-required
      />
      <Checkbox
        label="I meet the Australian study requirement"
        description="Qualifying study of at least two academic years over at least 16 months in Australia."
        checked={profile.ausStudy}
        onChange={(event) => {
          update("ausStudy", event.currentTarget.checked);
          if (!event.currentTarget.checked) update("regionalStudy", false);
        }}
        size="md"
      />
      {profile.ausStudy && (
        <Checkbox
          label="I meet the regional Australian study requirement"
          description="Living and studying in an eligible regional area during the qualifying study, excluding distance education."
          checked={profile.regionalStudy}
          onChange={(event) =>
            update("regionalStudy", event.currentTarget.checked)
          }
          size="md"
        />
      )}
      <Checkbox
        label="I have a qualifying Australian research master’s or doctorate"
        description="At least two academic years of eligible STEM/ICT study for specialist education points."
        checked={profile.specialistEducation}
        onChange={(event) =>
          update("specialistEducation", event.currentTarget.checked)
        }
        size="md"
      />
    </>
  );
}
