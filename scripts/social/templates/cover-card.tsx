import { RectStamp } from "../../../src/components/updates/rect-stamp";
import { RoundStamp } from "../../../src/components/updates/round-stamp";
import type {
  CoverCard as CoverView,
  RoundCoverCard,
  StampText,
} from "../../../src/lib/updates/cards";
import { CardPage, type CardFormat } from "./card-page";
import { SwipeCue } from "./swipe-cue";

/** Archivo 800 at 112% width averages under 0.66em a character. */
const CHAR_EM = 0.66;
const TITLE = {
  feed: { max: 136, width: 816 },
  story: { max: 136, width: 816 },
  og: { max: 96, width: 560 },
} as const;

/**
 * The cover title's size: as large as the mockup, smaller when its longest
 * line ("15 September") would not fit. The renderer still fails if it does.
 */
function titleSize(lines: readonly string[], format: CardFormat): number {
  const longest = Math.max(...lines.map((line) => line.length));
  const { max, width } = TITLE[format];
  return Math.min(max, Math.floor(width / (longest * CHAR_EM)));
}

function Round({ stamp }: { stamp: StampText }) {
  return (
    <div className="s1">
      <RoundStamp {...stamp} paper="var(--paper)" className="stamp ink-green" />
    </div>
  );
}

function State({
  stamp,
  slot,
  rotate,
}: {
  stamp: StampText;
  slot: "s2" | "s3";
  rotate: number;
}) {
  return (
    <div className={slot}>
      <RectStamp {...stamp} rotate={rotate} className="stamp ink-ink" />
    </div>
  );
}

function Stamps({ card }: { card: CoverView | RoundCoverCard }) {
  if (card.id === "round-cover") {
    return (
      <div className="stamps single" data-essential="">
        <Round stamp={card.stamp} />
      </div>
    );
  }
  const { round, s190, s491 } = card.stamps;
  return (
    <div className={`stamps ${round ? "" : "no-round"}`} data-essential="">
      <State stamp={s190} slot="s2" rotate={5} />
      <State stamp={s491} slot="s3" rotate={-6} />
      {round ? <Round stamp={round} /> : null}
    </div>
  );
}

/** Card 1 of a set: the month (or round date), its stamps and the MRZ line. */
export function CoverCard({
  card,
  format,
}: {
  card: CoverView | RoundCoverCard;
  format: CardFormat;
}) {
  const [first, second] = card.titleLines;
  return (
    <CardPage card={card} format={format} kind="cover" mrz={card.mrz}>
      <div className="cover-main">
        <div className="cover-head" data-essential="">
          <div className="eyebrow">{card.eyebrow}</div>
          <h1
            className="title fit"
            style={{ fontSize: titleSize(card.titleLines, format) }}
          >
            {first}
            <br />
            {second}
          </h1>
          <p className="sub">{card.sub}</p>
        </div>
        <Stamps card={card} />
      </div>
      <SwipeCue label={card.swipe} />
    </CardPage>
  );
}
