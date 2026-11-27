import type { LaunchCompareCard } from "../../../src/lib/social/launch-types";
import { CARD_TITLE, fitTitleLines } from "../title-fit";
import { CardPage, type CardFormat } from "./card-page";

/** The visas side by side: a stencil head per column, then one band per row. */
export function LaunchCompare({
  card,
  format,
}: {
  card: LaunchCompareCard;
  format: CardFormat;
}) {
  return (
    <CardPage card={card} format={format} kind="launch-compare">
      <div className="eyebrow">{card.eyebrow}</div>
      <h1 className="title fit" style={fitTitleLines(card.title, CARD_TITLE)}>
        {card.title}
      </h1>
      <div className="cmp">
        <div className="cmp-head">
          {card.columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        {card.rows.map((row) => (
          <div className="cmp-row" key={row.label}>
            <h3>{row.label}</h3>
            <div className="cmp-cells">
              {row.values.map((value, i) => (
                <span key={card.columns[i]}>{value}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {card.note ? <p className="note">{card.note}</p> : null}
    </CardPage>
  );
}
