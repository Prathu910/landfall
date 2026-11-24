import type { StateCard as StateView } from "../../../src/lib/updates/cards";
import { CardMap } from "./card-map";
import { CardPage, type CardFormat } from "./card-page";

/** Cards 3 and 4: one visa's invitations by state, as the recap's map. */
export function StateCard({
  card,
  format,
}: {
  card: StateView;
  format: CardFormat;
}) {
  return (
    <CardPage card={card} format={format} kind="state">
      <div className="eyebrow">{card.eyebrow}</div>
      <h1 className="title">{card.title}</h1>
      <p className="sub">{card.sub}</p>
      <div className="mapwrap">
        <CardMap map={card.map} label={card.title} />
      </div>
      <div className="legend">
        {card.legend.map((entry) => (
          <span key={entry.shade}>
            <i className={`band-${entry.shade}`} />
            {entry.label}
          </span>
        ))}
      </div>
      <p className="note">
        <b>{card.notRecorded}.</b> {card.note}
      </p>
    </CardPage>
  );
}
