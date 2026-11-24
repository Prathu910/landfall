import { RectStamp } from "../../../src/components/updates/rect-stamp";
import type { SpotlightCard as SpotlightView } from "../../../src/lib/updates/cards";
import { CardPage, type CardFormat } from "./card-page";

/** What the round columns measure; the heading names the rounds. */
const MEASURE = "lowest score invited";
/** Column heights in px: a cut-off of FLOOR points, and the tallest. */
const COLUMN = { floor: 60, min: 44, max: 150, notListed: 44 };

function columnHeight(cutoff: number | null, highest: number): number {
  if (cutoff === null) return COLUMN.notListed;
  const span = Math.max(highest - COLUMN.floor, 1);
  const share = (cutoff - COLUMN.floor) / span;
  return Math.round(COLUMN.min + share * (COLUMN.max - COLUMN.min));
}

function Rounds({ view }: { view: SpotlightView["rounds"] }) {
  const highest = Math.max(
    COLUMN.floor,
    ...view.columns.map((column) => column.cutoff ?? 0),
  );
  const last = view.columns.length - 1;
  return (
    <div className="block">
      <h3>
        {view.heading} · {MEASURE}
      </h3>
      <div className="cols">
        {view.columns.map((column, index) => (
          <div
            key={column.label}
            className={`col${index === last ? " latest" : ""}${column.cutoff === null ? " none" : ""}`}
          >
            <div
              className="c"
              style={{ height: columnHeight(column.cutoff, highest) }}
            >
              {column.value}
            </div>
            <span>{column.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card 5: one occupation's month, from the spotlight facts (spec 6.8). */
export function SpotlightCard({
  card,
  format,
}: {
  card: SpotlightView;
  format: CardFormat;
}) {
  const notes = [card.unavailable, card.tieBreak, card.states190].filter(
    (line): line is string => line !== null,
  );
  return (
    <CardPage card={card} format={format} kind="spotlight">
      <div className="spot-head">
        <div>
          <div className="eyebrow">{card.eyebrow}</div>
          <h1 className="title fit">{card.name}</h1>
          <div className="code">{card.code}</div>
        </div>
        {card.stamp ? (
          <RectStamp {...card.stamp} rotate={-5} className="stamp ink-green" />
        ) : null}
      </div>
      {card.littleChanged ? (
        <p className="note">
          <b>{card.littleChanged}</b>
        </p>
      ) : null}
      {card.facts.length > 0 ? (
        <div className="facts">
          {card.facts.map((fact) => (
            <div className="fact" key={fact.label}>
              <div className="big">{fact.big}</div>
              <div className="lab">{fact.label}</div>
            </div>
          ))}
        </div>
      ) : null}
      {card.rounds.columns.length > 0 ? <Rounds view={card.rounds} /> : null}
      {notes.length > 0 ? <p className="note">{notes.join(" ")}</p> : null}
    </CardPage>
  );
}
