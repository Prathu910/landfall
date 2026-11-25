import type { ReactNode } from "react";
import {
  MARK_VIEWBOX,
  markSvgBody,
} from "../../../src/components/brand/mark-geometry";
import type { CardView } from "../../../src/lib/updates/cards";

export type CardFormat = "feed" | "story" | "og";

/**
 * "Oct 2026 · 3/6". Card 2 has no position (spec decision 1), and the OG
 * image isn't in a carousel.
 */
function tagText(card: CardView, format: CardFormat): string {
  const { position } = card;
  if (!position || format === "og") return card.tag;
  return `${card.tag} · ${position.index}/${position.of}`;
}

/** The source line, with its "as at" date in bold as the mockup. */
function SourceLine({ text }: { text: string }) {
  const at = text.lastIndexOf(" · as at ");
  if (at < 0) return <div className="source">{text}</div>;
  return (
    <div className="source">
      {text.slice(0, at)} · <b>{text.slice(at + 3)}</b>
    </div>
  );
}

function Logo() {
  return (
    <span className="logo">
      <svg
        viewBox={MARK_VIEWBOX}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: markSvgBody("var(--ink)") }}
      />
      <span>MigrateLens</span>
    </span>
  );
}

/**
 * One passport page: guilloche paper, the logo and tag, the card's body, the
 * source line and, on covers, the MRZ line. On a story everything sits in
 * one `[data-safe]` box, which the renderer checks stays inside Instagram's
 * safe zone.
 */
export function CardPage({
  card,
  format,
  kind,
  mrz,
  foot,
  children,
}: {
  card: CardView;
  format: CardFormat;
  /** The card's layout class in card.css. */
  kind: string;
  mrz?: string;
  /** Pinned above the source line, below the card's free space. */
  foot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`page ${kind}`}>
      <div className="guill" />
      <div className="inner">
        <div
          className="content"
          data-safe={format === "story" ? "" : undefined}
        >
          <div className="top">
            <Logo />
            <span className="tag">{tagText(card, format)}</span>
          </div>
          {children}
          <div className="grow" />
          {foot}
          <SourceLine text={card.source} />
          {mrz ? <div className="mrz">{mrz}</div> : null}
        </div>
      </div>
    </div>
  );
}
