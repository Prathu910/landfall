# Source import notes

The checked-in `src/data/pool.json` is a public SkillSelect month-end snapshot imported on 17 November 2026. Snapshot: 31 October 2026. Filters: 189PTS Points-Tested Stream; SUBMITTED. The existing published results table displays Occupation and Points as its two optional dimensions. The import preserves displayed `<20` values and never queries underlying unmasked counts.

11 supported occupations are selected from the returned public table. Missing point rows contribute zero to the published distribution; suppressed published rows contribute a 0–19 interval. A displayed comparison is about EOIs in the published snapshot, never unique people or exact tie-break ranks.

Before refreshing, inspect and export the existing official table, verify the snapshot/status/visa, validate each score and count, and replace the checked-in file through review. Do not silently label old data live. Production scheduled imports and publication validation are phase 2.
