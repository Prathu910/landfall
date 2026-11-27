import type { LaunchCoverCard } from "../../../src/lib/social/launch-types";
import { COVER_TITLE, fitLines } from "../title-fit";
import { CardPage, type CardFormat } from "./card-page";
import { LaunchStamp } from "./launch-stamp";
import { SwipeCue } from "./swipe-cue";

/** The passport arrangement's slots for three stamps: two visa frames and a round one. */
const SLOTS = [
  { slot: "s2", rotate: 5, ink: "ink" },
  { slot: "s3", rotate: -6, ink: "ink" },
  { slot: "s1", rotate: -7, ink: "green" },
] as const;

function Stamps({ card }: { card: LaunchCoverCard }) {
  if (card.stamps.length === 1) {
    const [stamp] = card.stamps;
    return (
      <div className={`stamps single-${stamp.shape}`} data-essential="">
        <div className="s1">
          <LaunchStamp
            stamp={stamp}
            rotate={stamp.shape === "round" ? -7 : -5}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="stamps" data-essential="">
      {card.stamps.slice(0, SLOTS.length).map((stamp, i) => (
        <div className={SLOTS[i].slot} key={SLOTS[i].slot}>
          <LaunchStamp
            stamp={stamp}
            rotate={SLOTS[i].rotate}
            ink={SLOTS[i].ink}
          />
        </div>
      ))}
    </div>
  );
}

/** Card 1 of a launch post: the hook title, its stamps, the swipe cue and the MRZ line. */
export function LaunchCover({
  card,
  format,
}: {
  card: LaunchCoverCard;
  format: CardFormat;
}) {
  const size = fitLines(card.titleLines, COVER_TITLE).size;
  return (
    <CardPage
      card={card}
      format={format}
      kind="cover launch-cover"
      mrz={card.mrz}
    >
      <div className="cover-main">
        <div className="cover-head" data-essential="">
          <div className="eyebrow">{card.eyebrow}</div>
          <h1
            className="title fit"
            style={{ fontSize: size, maxHeight: COVER_TITLE.height }}
          >
            {card.titleLines.map((line) => (
              <span className="line" key={line}>
                {line}
              </span>
            ))}
          </h1>
          <p className="sub">{card.sub}</p>
        </div>
        <Stamps card={card} />
      </div>
      <SwipeCue label={card.swipe} />
    </CardPage>
  );
}
