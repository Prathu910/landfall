import { PassportBackground } from "@/components/report/passport-background";
import type { PassportView } from "@/lib/updates/hero-view";
import styles from "./passport-panel.module.css";
import { RoundStamp } from "./round-stamp";

/** The key-figures panel: the month's stamp, four figures and the MRZ line. */
export function PassportPanel({ passport }: { passport: PassportView }) {
  const { stamp } = passport;
  return (
    <aside className={styles.passport} aria-labelledby="recap-key-figures">
      <PassportBackground />
      <p className={styles.top}>
        <span id="recap-key-figures">{passport.label}</span>
        <span>{passport.number}</span>
      </p>
      <div className={styles.stampBox}>
        <RoundStamp
          top={stamp.top}
          word={stamp.middle}
          bottom={stamp.bottom}
          label={stamp.text}
          className={`${styles.stamp} ${styles[stamp.kind]}`}
        />
      </div>
      <dl className={styles.figures}>
        {passport.figures.map((figure) => (
          <div key={figure.label} className={styles.figure}>
            <dt>{figure.label}</dt>
            <dd>{figure.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.mrz} aria-hidden="true">
        {passport.mrz}
      </p>
    </aside>
  );
}
