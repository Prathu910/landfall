"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowDown, Link as LinkIcon } from "lucide-react";
import { issuedDay } from "@/lib/checkout/report-window";
import { formatDate } from "@/lib/migration";
import { DownloadPdfButton } from "../report/download-pdf-button";
import styles from "./issued-moment.module.css";

type Props = {
  name: string;
  reportNo: string;
  issuedAt: string;
  /** The data month's last day, YYYY-MM-DD. */
  dataAsAt: string;
  /** The masked email the checkout left, or null. */
  hint: string | null;
  /** The element "Read" moves to. */
  reportId: string;
};

/** The round ISSUED stamp; it lands once, only when motion is allowed. */
function IssuedStamp({ day }: { day: string }) {
  const id = useId();
  return (
    <svg className={styles.stamp} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id={`${id}-top`} d="M 30 100 A 70 70 0 0 1 170 100" />
        <path id={`${id}-bottom`} d="M 34 100 A 66 66 0 0 0 166 100" />
      </defs>
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
      <circle
        cx="100"
        cy="100"
        r="82"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <text className={styles.arc}>
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          MIGRATELENS
        </textPath>
      </text>
      <text className={styles.word} x="100" y="114" textAnchor="middle">
        ISSUED
      </text>
      <text className={styles.arc}>
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
          {day.toUpperCase()}
        </textPath>
      </text>
    </svg>
  );
}

/** Shown once, on arrival from the checkout, above the report. */
export function IssuedMoment(props: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState("");
  const day = issuedDay(props.issuedAt);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(
        "Private link copied. Keep it to yourself: anyone with it can read your report.",
      );
    } catch {
      setCopied(
        "Copy the address from your browser's address bar to keep the link.",
      );
    }
  };
  const name = props.name.trim();
  return (
    <section
      className={`${styles.issued} no-print`}
      aria-labelledby="issued-heading"
    >
      <IssuedStamp day={day} />
      <p className={styles.eyebrow}>Report issued</p>
      <h2
        id="issued-heading"
        ref={heading}
        tabIndex={-1}
        className={styles.title}
      >
        {name
          ? `Your PR report is ready, ${name}.`
          : "Your PR report is ready."}
      </h2>
      <ul className={styles.meta}>
        <li>
          Report no. <b>{props.reportNo}</b>
        </li>
        <li>
          Issued <b>{day}</b>
        </li>
        <li>
          Data as at <b>{formatDate(props.dataAsAt)}</b>
        </li>
        <li>
          {props.hint ? (
            <>
              PDF sent to <b>{props.hint}</b>
            </>
          ) : (
            "PDF on its way to your email"
          )}
        </li>
      </ul>
      <div className={styles.actions}>
        {/* A button, not a #link: the hash holds the token. */}
        <button
          type="button"
          className={styles.read}
          onClick={() => {
            const target = document.getElementById(props.reportId);
            target?.focus({ preventScroll: true });
            target?.scrollIntoView();
          }}
        >
          <ArrowDown size={16} aria-hidden /> Read
        </button>
        <DownloadPdfButton />
        <button type="button" className={styles.copy} onClick={copy}>
          <LinkIcon size={16} aria-hidden /> Copy private link
        </button>
      </div>
      <p className={styles.copied} role="status">
        {copied}
      </p>
    </section>
  );
}
