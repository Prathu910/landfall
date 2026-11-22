import { SegmentedControl, Select, TextInput } from "@mantine/core";
import { occupationIndex } from "../data/occupation-index";
import { CheckDateField } from "./check-date-field";
import type { CheckStepProps } from "./types";
import styles from "../check-flow.module.css";

const states = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

export function CheckProfileStep({ profile, update, asOf }: CheckStepProps) {
  return (
    <>
      <div className={styles.columns}>
        <TextInput
          label="First name (optional)"
          autoComplete="given-name"
          maxLength={50}
          placeholder="What should we call you?"
          value={profile.name}
          onChange={(event) => update("name", event.currentTarget.value)}
          size="md"
          radius="md"
        />
        <CheckDateField
          profile={profile}
          update={update}
          asOf={asOf}
          field="dob"
          label="Date of birth"
          description="Age points are assessed when invited."
          pastOnly
        />
      </div>
      <Select
        label="Nominated occupation"
        description="Use the occupation in your skills assessment. Search by title or ANZSCO code."
        placeholder="Search your occupation"
        searchable
        nothingFoundMessage="No match. Choose Other for a points check."
        value={profile.occupation || null}
        onChange={(value) => update("occupation", value ?? "")}
        data={[
          ...occupationIndex.map((o) => ({
            value: o.code,
            label: `${o.name} · ${o.code}`,
          })),
          {
            value: "other",
            label: "Other occupation · points check only",
          },
        ]}
        size="md"
        radius="md"
        maxDropdownHeight={260}
        aria-required
      />
      <div>
        <span className={styles.fieldLabel}>Where are you living?</span>
        <SegmentedControl
          aria-label="Where are you living?"
          fullWidth
          value={profile.onshore ? "onshore" : "offshore"}
          onChange={(value) => update("onshore", value === "onshore")}
          data={[
            { value: "offshore", label: "Outside Australia" },
            { value: "onshore", label: "In Australia" },
          ]}
          size="md"
          radius="md"
        />
      </div>
      {profile.onshore && (
        <div className={styles.columns}>
          <Select
            label="Current state or territory"
            placeholder="Choose your state"
            data={states}
            value={profile.state || null}
            onChange={(value) => update("state", value ?? "")}
            size="md"
            radius="md"
          />
          <CheckDateField
            profile={profile}
            update={update}
            asOf={asOf}
            field="visaExpiry"
            label="Current visa expiry (optional)"
          />
        </div>
      )}
    </>
  );
}
