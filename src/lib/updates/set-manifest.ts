import type { MonthKey } from "../data/types";
import type { CardId } from "./cards";

/** One image in `set.json`; `file` is relative to the repo root. */
export type SetImage = {
  card: CardId;
  format: "feed" | "story" | "og";
  theme: "light" | "dark";
  file: string;
  alt: string;
};

/** `set.json`: what the monthly job reads to build the PR and the post. */
export type SetManifest = {
  kind: "round" | "month";
  month: MonthKey;
  /** The round set's round date; null for a month set. */
  round: string | null;
  images: SetImage[];
  /** Files in other sets that this set shows but does not render. */
  reused: string[];
  caption: string;
};
