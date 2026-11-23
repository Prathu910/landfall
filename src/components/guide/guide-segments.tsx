"use client";
import { SegmentedControl } from "@mantine/core";
import { useId } from "react";
import styles from "./guide-controls.module.css";

/** A labelled segmented choice (radio group underneath: arrow keys move). */
export function GuideSegments({
  label,
  value,
  onChange,
  data,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  data: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <p className={styles.label} id={id}>
        {label}
      </p>
      <SegmentedControl
        aria-labelledby={id}
        value={value}
        onChange={onChange}
        data={data}
        fullWidth
        radius="xl"
        classNames={{
          root: styles.segmented,
          label: styles.segmentLabel,
          indicator: styles.segmentIndicator,
          control: styles.segmentControl,
        }}
      />
    </div>
  );
}
