import type { LaunchListCard } from "../../../src/lib/social/launch-types";
import { CARD_TITLE, fitTitleLines } from "../title-fit";
import { CardPage, type CardFormat } from "./card-page";

/** Rows of label and value: a points group, a visa, a state's streams or top occupations. */
/** Few rows get larger type; many get tighter rows. */
function density(card: LaunchListCard): string {
  const rows = card.groups.reduce((sum, g) => sum + g.rows.length, 0);
  if (rows <= 4) return "roomy";
  return rows >= 6 ? "compact" : "regular";
}

export function LaunchList({
  card,
  format,
}: {
  card: LaunchListCard;
  format: CardFormat;
}) {
  return (
    <CardPage
      card={card}
      format={format}
      kind={`launch-list values-${card.values} ${density(card)}`}
    >
      <div className="eyebrow">{card.eyebrow}</div>
      <h1 className="title fit" style={fitTitleLines(card.title, CARD_TITLE)}>
        {card.title}
      </h1>
      {card.lead ? <p className="lead">{card.lead}</p> : null}
      {card.groups.map((group, i) => (
        <div className="block" key={group.heading ?? i}>
          {group.heading ? <h3>{group.heading}</h3> : null}
          <div className="list">
            {group.rows.map((row) => (
              <div className="item" key={row.label}>
                <div className="item-label">
                  {row.label}
                  {row.note ? <small>{row.note}</small> : null}
                </div>
                <div className="item-value">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {card.note ? <p className="note">{card.note}</p> : null}
    </CardPage>
  );
}
