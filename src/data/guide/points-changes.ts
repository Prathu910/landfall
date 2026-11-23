import type { PointsChange } from "../../lib/guide/types";
import { GUIDE_CHECKED_AT, SOURCES } from "./sources";

const checkedAt = GUIDE_CHECKED_AT;

// What has been announced about the points test against what is published.
// MigrateLens never models an unpublished rule: the calculator uses the
// current Home Affairs points table until a new one is published.
export const POINTS_CHANGES: PointsChange[] = [
  {
    status: "announced",
    date: "2026-05-12",
    title: "2026–27 Budget",
    text: "The Government said it will reform the permanent migration points test, “optimised to select better educated, higher-skilled and younger migrants overall”.",
    source: SOURCES.budget,
    checkedAt,
  },
  {
    status: "said",
    date: "2026-09-17",
    title: "Minister for Home Affairs, National Press Club",
    text: "The minister said the points test has been redone with Treasury and that, on implementation, housing-trades skills will earn the same points as a university qualification. No start date was given.",
    source: SOURCES.ministerSpeech,
    checkedAt,
  },
  {
    status: "published",
    date: "2026-11-04",
    title: "Current points table",
    text: "The Home Affairs points table (last updated 4 Nov 2026) is still the current test, with a 65-point pass mark. This guide and its calculator use it.",
    source: SOURCES.pointsTable,
    checkedAt,
  },
  {
    status: "not-published",
    date: GUIDE_CHECKED_AT,
    title: "Not yet published",
    text: "A new points table, its start date and any transition rules for existing EOIs had not been published when we checked.",
    source: SOURCES.pointsTable,
    checkedAt,
  },
];
