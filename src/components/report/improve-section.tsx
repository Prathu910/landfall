import type { CSSProperties } from "react";
import type { Improve, Loss, Move } from "@/lib/outlook/improve";
import type { OutlookLabel } from "@/lib/outlook/labels";
import { LabelChip } from "./label-chip";
import section from "./section.module.css";
import { ShiftStamps } from "./shift-stamps";
import styles from "./improve-section.module.css";

type Mode = Improve["mode"];

const TITLES: Record<Mode, string> = {
  improve: "How to improve",
  protect: "Protect your points",
  "points-not-problem": "How to improve",
  plain: "How to improve",
};
const SUBS: Record<Mode, string> = {
  improve: "Each step, and what your outlook becomes after it.",
  protect: "You don't need more points. These dates could cost you some.",
  "points-not-problem": "What extra points would and wouldn't change.",
  plain: "Extra points still help, but without data we can't show how much.",
};
const BANNER_LABEL: Partial<Record<Mode, OutlookLabel>> = {
  protect: "very-strong",
  "points-not-problem": "not-invited",
};
const NO_MOVES = "None of the changes we model adds points to your profile.";

function bannerStyle(mode: Mode): CSSProperties {
  const label = BANNER_LABEL[mode] ?? "no-data";
  return {
    "--banner-bg": `var(--label-${label}-bg)`,
    "--banner-ink": `var(--label-${label}-ink)`,
  } as CSSProperties;
}

function MoveCard({ move }: { move: Move }) {
  return (
    <li className={`${styles.move} ${move.best ? styles.best : ""}`}>
      <div>
        {move.best && <span className={styles.tag}>Biggest jump</span>}
        <h3 className={styles.title}>{move.title}</h3>
        {move.detail && <p className={styles.detail}>{move.detail}</p>}
        <p className={styles.why}>{move.why}</p>
      </div>
      <div className={styles.shift}>
        <ShiftStamps from={move.from} to={move.to} />
      </div>
    </li>
  );
}

/** A dated loss; without data (plain mode) its labels mean nothing, so none show. */
function DeadlineCard({ loss, labels }: { loss: Loss; labels: boolean }) {
  const lost = loss.from.points - loss.to.points;
  const verb = loss.to.label === loss.from.label ? "stays" : "becomes";
  return (
    <div className={styles.deadline}>
      <span className={styles.mark} aria-hidden="true">
        {loss.kind === "points" ? `−${lost}` : "!"}
      </span>
      <p>
        <b>{loss.title}.</b> {loss.detail}
        {labels && (
          <>
            {" "}
            At {loss.to.points} points, your 189 outlook {verb}{" "}
            <LabelChip label={loss.to.label} />.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * "How to improve" (or "Protect your points"), with its banner and dated
 * losses. The printed copy sets `anchor` false so the page keeps one #improve.
 */
export function ImproveSection({
  improve,
  labels,
  anchor = true,
}: {
  improve: Improve;
  labels: boolean;
  anchor?: boolean;
}) {
  const { mode } = improve;
  const nothing =
    improve.moves.length === 0 &&
    improve.plain.length === 0 &&
    mode !== "protect";
  return (
    <section id={anchor ? "improve" : undefined} className={section.band}>
      <h2 className={section.h2}>{TITLES[mode]}</h2>
      <p className={section.sub}>{SUBS[mode]}</p>
      {improve.banner && (
        <p className={styles.banner} style={bannerStyle(mode)}>
          {improve.banner}
        </p>
      )}
      {improve.moves.length > 0 && (
        <ul className={styles.moves}>
          {improve.moves.map((move) => (
            <MoveCard key={move.id} move={move} />
          ))}
        </ul>
      )}
      {improve.plain.length > 0 && (
        <ul className={styles.plain}>
          {improve.plain.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {nothing && <p className={section.sub}>{NO_MOVES}</p>}
      {improve.losses.map((loss) => (
        <DeadlineCard
          key={`${loss.date}-${loss.title}`}
          loss={loss}
          labels={labels}
        />
      ))}
    </section>
  );
}
