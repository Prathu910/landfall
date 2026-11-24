import { RoundStamp } from "../../../src/components/updates/round-stamp";
import type { RoundCard as RoundView } from "../../../src/lib/updates/cards";
import { CardPage, type CardFormat } from "./card-page";

/** Bar heights in px: the tallest bar, and the floor every bar keeps. */
const BAR = { max: 96, min: 8 };

function Distribution({ view }: { view: RoundView["distribution"] }) {
  return (
    <div className="block">
      <h3>{view.heading}</h3>
      <div className="vcols">
        {view.bars.map((bar) => (
          <div className="vcol" key={bar.score}>
            <b>{bar.count}</b>
            <div
              className="vbar"
              style={{ height: Math.round(BAR.min + bar.share * BAR.max) }}
            />
            <span>{bar.score}</span>
          </div>
        ))}
      </div>
      <div className="axis">{view.axis}</div>
    </div>
  );
}

function Picks({ view }: { view: NonNullable<RoundView["picks"]> }) {
  return (
    <div className="block">
      <h3>{view.heading}</h3>
      <div className="rows">
        {view.items.map((item) => (
          <div className="row" key={item.name}>
            <span className="name fit">{item.name}</span>
            <span className="score">
              <span className="val">{item.current}</span>
              <span className="was">{item.previous}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A score range ("65–100") never breaks at its dash. */
function KeepRanges({ text }: { text: string }) {
  return text.split(/(\d+–\d+)/).map((part, index) =>
    index % 2 === 1 ? (
      <span className="nowrap" key={index}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Card 2: one 189 round's facts (shared by the round and month sets). */
export function RoundCard({
  card,
  format,
}: {
  card: RoundView;
  format: CardFormat;
}) {
  return (
    <CardPage card={card} format={format} kind="round">
      <div className="headgrid">
        <div>
          <div className="eyebrow">{card.eyebrow}</div>
          <h1 className="title">{card.title}</h1>
          <p className="sub">
            <KeepRanges text={card.sub} />
          </p>
        </div>
        <RoundStamp
          {...card.stamp}
          rotate={7}
          paper="var(--paper)"
          className="stamp ink-green"
        />
      </div>
      <Distribution view={card.distribution} />
      {card.picks ? <Picks view={card.picks} /> : null}
      {card.notListed ? <p className="note">{card.notListed}</p> : null}
    </CardPage>
  );
}
