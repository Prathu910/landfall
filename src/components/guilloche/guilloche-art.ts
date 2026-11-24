/**
 * The guilloche artworks, each split by line colour into `public/` SVGs
 * (bottom layer first, as the original drawing paints them). The ink is the
 * colour token whose daylight value is that layer's original stroke colour.
 */
export type GuillocheArt =
  | "passport-left"
  | "passport-right"
  | "passport-evidence"
  | "report-passport"
  | "report-passport-corner";

interface GuillocheLayer {
  src: string;
  ink: `--${string}`;
}

interface GuillocheArtwork {
  layers: readonly GuillocheLayer[];
  /** CSS mask position / size. */
  fit: string;
}

const COVER = "center / cover";

function homePanel(name: string): GuillocheArtwork {
  return {
    fit: COVER,
    layers: [
      { src: `/home/${name}-b.svg`, ink: "--guilloche-b" },
      { src: `/home/${name}-a.svg`, ink: "--guilloche-a" },
    ],
  };
}

const REPORT_LAYERS: readonly GuillocheLayer[] = [
  { src: "/report-passport-a.svg", ink: "--guilloche-report" },
  { src: "/report-passport-b.svg", ink: "--guilloche-report-deep" },
  { src: "/report-passport-c.svg", ink: "--guilloche-report-violet" },
];

export const GUILLOCHE_ART: Record<GuillocheArt, GuillocheArtwork> = {
  "passport-left": homePanel("passport-left"),
  "passport-right": homePanel("passport-right"),
  "passport-evidence": homePanel("passport-evidence"),
  "report-passport": { fit: COVER, layers: REPORT_LAYERS },
  /** The occupation directory's heading: the report artwork in its corner. */
  "report-passport-corner": {
    fit: "right top / 45% auto",
    layers: REPORT_LAYERS,
  },
};
