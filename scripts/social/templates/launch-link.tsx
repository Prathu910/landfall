import { Fragment } from "react";
import type { LaunchLinkCard } from "../../../src/lib/social/launch-types";
import { LINK_TITLE, fitTitleLines } from "../title-fit";
import { CardPage, type CardFormat } from "./card-page";
import { LaunchStamp } from "./launch-stamp";

/** The address, breakable only after a "/", so a long path never splits a word. */
function Url({ url }: { url: string }) {
  const parts = url.split(/(?<=\/)/);
  return (
    <span>
      {parts.map((part, i) => (
        <Fragment key={i}>
          <span className="nowrap">{part}</span>
          {i < parts.length - 1 ? <wbr /> : null}
        </Fragment>
      ))}
    </span>
  );
}

/** A call to action: the title, what the page has, and its address on a passport label. */
export function LaunchLink({
  card,
  format,
}: {
  card: LaunchLinkCard;
  format: CardFormat;
}) {
  return (
    <CardPage card={card} format={format} kind="launch-link">
      <div className="link-body">
        <div className="eyebrow">{card.eyebrow}</div>
        <h1 className="title fit" style={fitTitleLines(card.title, LINK_TITLE)}>
          {card.title}
        </h1>
        <p className="sub">{card.sub}</p>
        <div className="visa-label">
          <span className="visa-label-head">Visit</span>
          <div className={card.url.length > 30 ? "link-url long" : "link-url"}>
            <Url url={card.url} />
          </div>
        </div>
        {card.points.length > 0 ? (
          <ul className="link-points">
            {card.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : null}
        {card.stamp ? (
          <div className="link-stamp">
            <LaunchStamp stamp={card.stamp} rotate={-6} />
          </div>
        ) : null}
      </div>
    </CardPage>
  );
}
