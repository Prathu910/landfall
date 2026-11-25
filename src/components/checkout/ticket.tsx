import { useId, type ReactNode } from "react";
import { ticketLabel } from "../../lib/checkout/ticket-label";
import styles from "./ticket.module.css";

type Props = {
  /** "pass": the boarding pass on paper; "ink": the receipt's dark ticket. */
  variant: "pass" | "ink";
  /** The perforated stub's word ("FOUNDING 100"), hidden from screen readers. */
  stub: string;
  title: string;
  sub: ReactNode;
  meta?: ReactNode;
  /**
   * The meta in words, for the button's name, when `meta` is markup
   * ("Free, 63 of 100 left"); a string meta is used as it is.
   */
  metaText?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  busy?: boolean;
  wide?: boolean;
};

/** A ticket-shaped button; its name is the title plus the meta (ticketLabel). */
export function Ticket({
  variant,
  stub,
  title,
  sub,
  meta,
  metaText,
  onClick,
  type = "button",
  disabled = false,
  busy = false,
  wide = false,
}: Props) {
  const subId = useId();
  const metaWords = metaText ?? (typeof meta === "string" ? meta : "");
  const classes = [styles.ticket, styles[variant], wide ? styles.wide : ""];
  return (
    <button
      type={type}
      className={classes.join(" ")}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={ticketLabel(title, metaWords)}
      aria-describedby={subId}
    >
      <span className={styles.stub} aria-hidden="true">
        <span>{stub}</span>
      </span>
      <span className={styles.main}>
        <span className={styles.title}>
          {title}
          {busy && <span className={styles.spinner} aria-hidden="true" />}
        </span>
        <span id={subId} className={styles.sub}>
          {sub}
        </span>
        {meta !== undefined && <span className={styles.meta}>{meta}</span>}
      </span>
      {variant === "ink" && (
        <span className={styles.punch} aria-hidden="true" />
      )}
    </button>
  );
}
