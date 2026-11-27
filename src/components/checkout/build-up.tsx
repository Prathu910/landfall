import Link from "next/link";
import { ArrowUp, ChartColumn, Clock, Mail, Map } from "lucide-react";
import type { BeatItem, CheckoutBeats } from "@/lib/checkout/beats";
import { NOT_ADVICE } from "@/lib/orders/seller";
import styles from "./build-up.module.css";

const ICONS: Record<BeatItem["icon"], typeof Clock> = {
  queue: ChartColumn,
  wait: Clock,
  states: Map,
  points: ArrowUp,
  inbox: Mail,
};

/** The checkout's three beats: what you get, what goes into it, why. */
export function BuildUp({ beats }: { beats: CheckoutBeats }) {
  return (
    <div className={styles.beats}>
      <section className={styles.beat} aria-labelledby="beat-get">
        <p className={styles.n}>01 · WHAT YOU GET</p>
        <h3 id="beat-get" className={styles.title}>
          Your report, built on your answers
        </h3>
        <ul className={styles.items}>
          {beats.items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.title}>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={17} />
                </span>
                <div>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className={styles.beat} aria-labelledby="beat-into">
        <p className={styles.n}>02 · WHAT GOES INTO IT</p>
        <h3 id="beat-into" className={styles.title}>
          Every number comes from official data
        </h3>
        <dl className={styles.facts}>
          {beats.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value.toLocaleString("en-AU")}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={styles.beat} aria-labelledby="beat-why">
        <p className={styles.n}>03 · WHY IT&apos;S WORTH IT</p>
        <h3 id="beat-why" className={styles.title}>
          The free check tells you where you stand. The report tells you what to
          do.
        </h3>
        <p className={styles.note}>
          {NOT_ADVICE} <Link href="/sample/">See a full sample report</Link>
        </p>
      </section>
    </div>
  );
}
