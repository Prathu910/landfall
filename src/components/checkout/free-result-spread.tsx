"use client";

import Link from "next/link";
import { useId } from "react";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { defaultCurrency } from "@/lib/checkout/currency";
import { passTicket, type PassMeta } from "@/lib/checkout/pass-ticket";
import {
  canBuy,
  CONTACT_LINE,
  offerAction,
  resultLine,
  teaserLines,
  TEASER_TITLE,
} from "@/lib/checkout/teaser";
import type { Quote } from "@/lib/orders/contract";
import type { FreeResult } from "@/lib/outlook/free-result";
import { REPORT_SECTIONS } from "@/lib/report/sections";
import { VisaStamp } from "../report/visa-stamp";
import { FreeTag } from "./free-tag";
import { Ticket } from "./ticket";
import styles from "./free-result-spread.module.css";

// Each stamp tilts a little differently, as in the report's visa row.
const TILTS = [-4, 3, -2];

type Props = {
  result: FreeResult;
  /** Null until the quote arrives: the ticket shows skeleton meta, no price. */
  quote: Quote | null;
  onOpenCheckout: () => void;
  occupationName: string;
  whereLine: string;
  /** The sample answers end with a link to the sample report, not a checkout. */
  sample?: boolean;
  /** The checkout's backend is configured; without it there is no ticket (R12). */
  configured: boolean;
};

function PassMetaRow({ meta }: { meta: PassMeta }) {
  if (meta.kind === "pending") {
    return <span className={styles.skeleton} aria-hidden="true" />;
  }
  if (meta.kind === "founding") {
    return (
      <>
        <FreeTag />
        <s className={styles.was}>
          <span className="sr-only">was </span>
          {meta.was}
        </s>
        <span>
          <b className={styles.count}>{meta.remaining}</b> of {meta.limit} left
        </span>
      </>
    );
  }
  return (
    <>
      <b className={styles.count}>{meta.price}</b>
      <span>one-off · 7-day no-questions refund</span>
    </>
  );
}

function Ghost() {
  // Decorative placeholder shapes: they carry no data (spec copy rules).
  return (
    <div className={styles.ghost} aria-hidden="true">
      <i className={styles.ghostLine} />
      <div className={styles.ghostBars}>
        {[30, 55, 80, 100, 70, 45, 35, 20].map((height) => (
          <i key={height} style={{ height: `${height}%` }} />
        ))}
      </div>
      <i className={styles.ghostLine} />
      <i className={styles.ghostLine} />
      <div className={styles.ghostGrid}>
        {[1, 0.6, 1, 0.4, 0.7, 1, 0.5, 1].map((opacity, i) => (
          <i key={i} style={{ opacity }} />
        ))}
      </div>
      <i className={styles.ghostLine} />
    </div>
  );
}

function Offer(
  props: Props & { result: Extract<FreeResult, { kind: "stamps" }> },
) {
  const { result, quote, onOpenCheckout } = props;
  const action = offerAction(props.sample ?? false, props.configured);
  const { heading, ticks } = teaserLines(result);
  const currency = defaultCurrency(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    quote?.prices.USD != null,
  );
  const ticket = passTicket(quote, currency);
  return (
    <>
      <LockKeyhole className={styles.lock} size={26} aria-hidden />
      <h3 className={styles.heading}>{heading}</h3>
      <ul className={styles.ticks}>
        {ticks.map((tick) => (
          <li key={tick}>
            <Check size={16} aria-hidden />
            {tick}
          </li>
        ))}
      </ul>
      <div className={styles.action}>
        {action === "sample" && (
          <Link href="/sample/" className={styles.sampleLink}>
            See the full sample report <ArrowRight size={16} aria-hidden />
          </Link>
        )}
        {action === "contact" && (
          <p className={styles.note}>
            {CONTACT_LINE.before}
            <a href={`mailto:${CONTACT_LINE.email}`}>{CONTACT_LINE.email}</a>
          </p>
        )}
        {action === "ticket" && (
          <Ticket
            variant="pass"
            stub={ticket.stub}
            title="Get my full PR report →"
            sub="Your queue, your wait, your best state"
            meta={<PassMetaRow meta={ticket.meta} />}
            metaText={ticket.metaText}
            onClick={onOpenCheckout}
            wide
          />
        )}
      </div>
    </>
  );
}

/** The free result as a passport spread: the result, then the full report's offer. */
export function FreeResultSpread(props: Props) {
  const { result, occupationName, whereLine } = props;
  const headingId = useId();
  const { points } = result;
  return (
    <section className={styles.spread} aria-labelledby={headingId}>
      <div className={styles.page}>
        <h2 id={headingId} className={styles.running} tabIndex={-1}>
          <span>FREE RESULT</span>
          <span aria-hidden="true">PAGE 1</span>
        </h2>
        <p className={styles.points}>
          <span className={styles.big}>{points.base}</span>
          <span className={styles.note}>points before nomination</span>
        </p>
        <p className={styles.note}>
          {points.subclass190} with 190 nomination · {points.subclass491} with
          491
        </p>
        {result.kind === "stamps" && (
          <>
            <div
              className={styles.stamps}
              role="group"
              aria-label={`Your visa stamps as ${occupationName}`}
            >
              {result.stamps.map((stamp, i) => (
                <div key={stamp.visa} className={styles.stamp}>
                  <VisaStamp
                    shape={stamp.shape}
                    top={stamp.top}
                    word={stamp.stampWord}
                    points={stamp.points}
                    label={stamp.ink}
                    rotate={TILTS[i] ?? 0}
                  />
                </div>
              ))}
            </div>
            <p className={styles.lede}>
              Your stamps say <b>where</b> you stand. The full report says{" "}
              <b>why</b>, and what to do about it.
            </p>
          </>
        )}
        <p className={styles.note}>{whereLine}</p>
      </div>
      <div className={`${styles.page} ${styles.facing}`}>
        <p className={styles.running}>
          <span>{TEASER_TITLE}</span>
          {canBuy(result) && <span>{REPORT_SECTIONS.length} SECTIONS</span>}
        </p>
        <Ghost />
        <div className={styles.veil}>
          {result.kind === "stamps" ? (
            <Offer {...props} result={result} />
          ) : (
            <>
              <p className={styles.heading} role="status">
                {resultLine(result)}
              </p>
              {result.kind === "points-only" && result.note && (
                <p className={styles.note}>{result.note}</p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
