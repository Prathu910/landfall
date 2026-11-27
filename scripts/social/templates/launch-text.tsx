import type { LaunchTextCard } from "../../../src/lib/social/launch-types";
import { TEXT_TITLE, fitTitleLines } from "../title-fit";
import { CardPage, type CardFormat } from "./card-page";
import { LaunchStamp } from "./launch-stamp";

const ROW_ROTATE = [-5, 4, -3];

/** Plain explanation; its stamps and bold line sit at the foot of the page. */
export function LaunchText({
  card,
  format,
}: {
  card: LaunchTextCard;
  format: CardFormat;
}) {
  const [single] = card.stamps.length === 1 ? card.stamps : [];
  return (
    <CardPage card={card} format={format} kind="launch-text">
      <div className="text-head">
        <div>
          <div className="eyebrow">{card.eyebrow}</div>
          <h1
            className="title fit"
            style={fitTitleLines(card.title, TEXT_TITLE)}
          >
            {card.title}
          </h1>
        </div>
      </div>
      {card.paragraphs.map((text) => (
        <p className="para" key={text}>
          {text}
        </p>
      ))}
      {card.facts.length > 0 ? (
        <div className="facts">
          {card.facts.map((fact) => (
            <div className="fact" key={fact.label}>
              <div className="lab">{fact.label}</div>
              <div className="val">{fact.value}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="text-foot">
        {single ? (
          <div className="foot-stamp">
            <LaunchStamp stamp={single} rotate={-5} />
          </div>
        ) : null}
        {card.stamps.length > 1 ? (
          <div className="stamp-row">
            {card.stamps.map((stamp, i) => (
              <div key={stamp.word}>
                <LaunchStamp
                  stamp={stamp}
                  rotate={ROW_ROTATE[i % ROW_ROTATE.length]}
                  ink={i === 0 ? "green" : "ink"}
                />
              </div>
            ))}
          </div>
        ) : null}
        {card.emphasis ? <p className="emphasis">{card.emphasis}</p> : null}
      </div>
    </CardPage>
  );
}
