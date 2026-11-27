import type { LaunchStoryCard } from "../../../src/lib/social/launch-types";
import { STORY_TITLE, fitTitleLines } from "../title-fit";
import { CardPage, type CardFormat } from "./card-page";

/**
 * A story frame. The sticker space is empty paper; only a `--guides`
 * render (body.guides) outlines it and names the sticker.
 */
export function LaunchStory({
  card,
  format,
}: {
  card: LaunchStoryCard;
  format: CardFormat;
}) {
  return (
    <CardPage card={card} format={format} kind="launch-story">
      <div className="eyebrow">{card.eyebrow}</div>
      <h1 className="title fit" style={fitTitleLines(card.title, STORY_TITLE)}>
        {card.title}
      </h1>
      {card.sub ? <p className="sub">{card.sub}</p> : null}
      <div className={`sticker sticker-${card.sticker.kind}`} data-sticker="">
        <span>{card.sticker.label}</span>
      </div>
      <p className="story-foot">{card.foot}</p>
    </CardPage>
  );
}
