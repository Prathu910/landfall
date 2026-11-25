import { RoundStamp } from "../../../src/components/updates/round-stamp";
import type { ClosingCard as ClosingView } from "../../../src/lib/updates/cards";
import { CardPage, type CardFormat } from "./card-page";

/** The last card: the free points check, the handle and the disclaimer. */
export function ClosingCard({
  card,
  format,
}: {
  card: ClosingView;
  format: CardFormat;
}) {
  return (
    <CardPage
      card={card}
      format={format}
      kind="closing"
      foot={
        <div className="disclaim">
          {card.disclaimer}
          <small>{card.disclaimerSmall}</small>
        </div>
      }
    >
      <div className="bigstamp">
        <RoundStamp
          {...card.stamp}
          rotate={-6}
          paper="var(--paper)"
          className="stamp ink-green"
        />
      </div>
      <h1 className="title">{card.title}</h1>
      <div className="url">
        <span>{card.url}</span>
      </div>
      <div className="handle">{card.handle}</div>
      <p className="sub">{card.sub}</p>
    </CardPage>
  );
}
