import type { ReactNode } from "react";
import {
  MARK_VIEWBOX,
  markSvgBody,
} from "../../../src/components/brand/mark-geometry";

export type CardFormat = "feed" | "story" | "og" | "square";

/** What the page frame reads from a card: the monthly sets' and the launch pack's. */
export type PageMeta = {
  tag: string;
  position: { index: number; of: number } | null;
  source: string;
};

/**
 * "Oct 2026 · 3/6". Card 2 has no position (spec decision 1), and the OG
 * image isn't in a carousel.
 */
function tagText(card: PageMeta, format: CardFormat): string {
  const { position } = card;
  if (!position || format === "og") return card.tag;
  return `${card.tag} · ${position.index}/${position.of}`;
}

/** The source line, with its "as at" (or "checked") date in bold as the mockup. */
function SourceLine({ text }: { text: string }) {
  const at = Math.max(
    text.lastIndexOf(" · as at "),
    text.lastIndexOf(" · checked "),
  );
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
  card: PageMeta;
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
