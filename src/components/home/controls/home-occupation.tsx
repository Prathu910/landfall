"use client";
import { Select } from "@mantine/core";
import { occupationIndex } from "@/components/data/occupation-index";
import styles from "./home-controls.module.css";
const options = occupationIndex.map((item) => ({
  value: item.code,
  label: `${item.name} (${item.code})`,
}));
export function HomeOccupation({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      label="Choose your occupation"
      searchable
      data={options}
      value={value}
      onChange={(value) => value && onChange(value)}
      allowDeselect={false}
      nothingFoundMessage="No occupation matches. Try a name or ANZSCO code."
      maxDropdownHeight={280}
      classNames={{
        input: styles.selectInput,
        label: styles.selectLabel,
        dropdown: styles.dropdown,
        option: styles.option,
        empty: styles.empty,
      }}
      // Not kept mounted: inline (no portal), Mantine would server-render all
      // 493 options into the homepage HTML (about 117 KB) while hidden.
      comboboxProps={{ withinPortal: false, keepMounted: false }}
    />
  );
}
