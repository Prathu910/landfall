import type { DemoContent } from "../../lib/home/demo-content";

export type SheetLayout = "wide" | "compact";

/** What the hero demo shows at a moment of its story. */
export type DemoScene = {
  /** The report, or the check that builds it. */
  view: "report" | "check";
  /** The profile's points lines are filled in. */
  answered: boolean;
  /** The profile's total is shown. */
  total: boolean;
  /** The scorecard's counts are in. */
  counted: boolean;
  /** How many tile groups are lit, in outlook order. */
  lit: number;
};

/** The payoff: the whole report, as the poster and every loop's start. */
export const PAYOFF_SCENE: DemoScene = {
  view: "report",
  answered: true,
  total: true,
  counted: true,
  lit: Number.POSITIVE_INFINITY,
};

/** After "Start over": the check, empty. */
export const EMPTY_SCENE: DemoScene = {
  view: "check",
  answered: false,
  total: false,
  counted: false,
  lit: 0,
};

type Tile = DemoContent["tiles"][number];
export type TileGroup = { tone: Tile["tone"]; label: string };

/** Each outlook group once, in tile order: the order the tiles light up. */
export function groupsOf(tiles: Tile[]): TileGroup[] {
  const groups: TileGroup[] = [];
  for (const tile of tiles) {
    if (!groups.some((g) => g.tone === tile.tone)) {
      groups.push({ tone: tile.tone, label: tile.group });
    }
  }
  return groups;
}

/** "Age · 30 pts" as its label and its points, to set them in two columns. */
export function splitLine(line: string): { label: string; value: string } {
  const at = line.lastIndexOf(" · ");
  if (at < 0) return { label: line, value: "" };
  return { label: line.slice(0, at), value: line.slice(at + 3) };
}
