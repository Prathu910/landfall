"use client";
import { Select } from "@mantine/core";
import { occupationIndex } from "@/components/data/occupation-index";
import { setGuideAnswers, useGuideAnswers } from "./guide-store";

const OPTIONS = occupationIndex.map((item) => ({
  value: item.code,
  label: `${item.name} (${item.code})`,
}));

/** The guide's shared occupation search; changing it updates every leaf. */
export function GuideOccupationSelect({
  label = "Your occupation",
  description,
}: {
  label?: string;
  description?: string;
}) {
  const { occupation } = useGuideAnswers();
  return (
    <Select
      label={label}
      description={description}
      placeholder="Search by name or ANZSCO code"
      searchable
      clearable
      data={OPTIONS}
      value={occupation || null}
      onChange={(value) => setGuideAnswers({ occupation: value ?? "" })}
      nothingFoundMessage="No occupation matches. Try a name or ANZSCO code."
      maxDropdownHeight={280}
      // Not kept mounted, so the 493 options are not server-rendered while hidden.
      comboboxProps={{ withinPortal: false, keepMounted: false }}
    />
  );
}
