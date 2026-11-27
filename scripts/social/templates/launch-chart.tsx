import type { CSSProperties } from "react";
import type {
  Chart,
  ChartBar,
  LaunchChartCard,
} from "../../../src/lib/social/launch-types";
import { CARD_TITLE, fitTitleLines } from "../title-fit";
import { CardPage, type CardFormat } from "./card-page";

/** A share as a CSS custom property, so card CSS sizes the bar. */
const shares = (bar: ChartBar) =>
  ({ "--solid": bar.solid, "--hatched": bar.hatched }) as CSSProperties;

const barClass = (bar: ChartBar, base: string) =>
  [base, bar.strong ? "strong" : "", bar.empty ? "empty" : ""]
    .filter(Boolean)
    .join(" ");

/** A numeric value in the stencil face; a word ("Not listed", "n/p") in Archivo. */
const isFigure = (value: string) => /^[<\d][\d,+–]*$/.test(value);

function Track({ bar }: { bar: ChartBar }) {
  return (
    <span className="track" style={shares(bar)} aria-hidden="true">
      <span className="hatched" />
      <span className="solid" />
    </span>
  );
}

function Columns({ chart }: { chart: Chart }) {
  return (
    <div className="ccols">
      {chart.bars.map((bar) => (
        <div className={barClass(bar, "ccol")} key={`${bar.label}${bar.sub}`}>
          <b className={isFigure(bar.value) ? "fig" : "word"}>{bar.value}</b>
          <Track bar={bar} />
          <span className="clabel">
            {bar.label}
            {bar.sub ? <small>{bar.sub}</small> : <small>&nbsp;</small>}
          </span>
        </div>
      ))}
    </div>
  );
}

function Rows({ chart }: { chart: Chart }) {
  return (
    <div className={chart.bars.length <= 10 ? "crows few" : "crows"}>
      {chart.bars.map((bar) => (
        <div className={barClass(bar, "crow")} key={bar.label}>
          <span className="rlabel">{bar.label}</span>
          <Track bar={bar} />
          <span className="rvalue">{bar.value}</span>
        </div>
      ))}
    </div>
  );
}

/** One or two charts with their headings, key and note. */
export function LaunchChart({
  card,
  format,
}: {
  card: LaunchChartCard;
  format: CardFormat;
}) {
  return (
    <CardPage
      card={card}
      format={format}
      kind={`launch-chart charts-${card.charts.length}`}
    >
      <div className="eyebrow">{card.eyebrow}</div>
      <h1 className="title fit" style={fitTitleLines(card.title, CARD_TITLE)}>
        {card.title}
      </h1>
      {card.lead ? <p className="lead">{card.lead}</p> : null}
      {card.charts.map((chart) => (
        <div className={`block chart ${chart.orientation}`} key={chart.heading}>
          <h3>{chart.heading}</h3>
          {chart.orientation === "columns" ? (
            <Columns chart={chart} />
          ) : (
            <Rows chart={chart} />
          )}
          {chart.axis ? <div className="axis">{chart.axis}</div> : null}
        </div>
      ))}
      {card.key ? (
        <div className="ckey">
          <span>
            <i className="key-solid" />
            {card.key.solid}
          </span>
          <span>
            <i className="key-hatched" />
            {card.key.hatched}
          </span>
        </div>
      ) : null}
      {card.note ? <p className="note">{card.note}</p> : null}
    </CardPage>
  );
}
