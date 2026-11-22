"use client";
import { SegmentedControl } from "@mantine/core";
import styles from "./home-controls.module.css";

export function HomeSegments({
  label,
  value,
  onChange,
  data,
  points = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  data: { value: string; label: React.ReactNode }[];
  points?: boolean;
}) {
  return (
    <SegmentedControl
      aria-label={label}
      value={value}
      onChange={onChange}
      data={data}
      fullWidth={points}
      radius="xl"
      classNames={{
        root: points ? styles.points : styles.segments,
        label: styles.segmentLabel,
        indicator: styles.indicator,
        input: styles.segmentInput,
        control: styles.segmentControl,
      }}
    />
  );
}
