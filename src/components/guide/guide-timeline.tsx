import type { CSSProperties } from "react";
import { formatDate } from "@/lib/migration";
import type { GuideStep } from "@/lib/guide/types";
import { GuideLink } from "./guide-link";
import styles from "./guide-timeline.module.css";

/** The route to a skilled visa as a numbered line of steps (CSS only). */
export function GuideTimeline({ steps }: { steps: GuideStep[] }) {
  return (
    <div className={styles.timeline}>
      <ol
        className={styles.overview}
        aria-label="Steps at a glance"
        style={{ "--count": steps.length } as CSSProperties}
      >
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={styles.overviewItem}
            data-branch={step.appliesTo.length < 3 || undefined}
          >
            <a href={`#step-${step.id}`}>
              <span className={styles.overviewNumber} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.overviewText}>{step.short}</span>
              {step.appliesTo.length < 3 && (
                <span className={styles.overviewOnly}>
                  {step.appliesTo.join(" and ")} only
                </span>
              )}
            </a>
          </li>
        ))}
      </ol>
      <ol className={styles.steps}>
        {steps.map((step, i) => (
          <li
            key={step.id}
            id={`step-${step.id}`}
            className={styles.step}
            data-branch={step.appliesTo.length < 3 || undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {i + 1}
            </span>
            <div className={styles.body}>
              <h3>
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className={styles.what}>{step.what}</p>
              <dl className={styles.facts}>
                <div className={styles.rule}>
                  <dt>The rule</dt>
                  <dd>
                    {step.rule.text}{" "}
                    <GuideLink
                      className={styles.source}
                      href={step.rule.source}
                    >
                      Source, checked {formatDate(step.rule.checkedAt)}
                    </GuideLink>
                  </dd>
                </div>
                <div>
                  <dt>Who runs it</dt>
                  <dd>{step.who}</dd>
                </div>
                <div>
                  <dt>How long</dt>
                  <dd>{step.duration.text}</dd>
                </div>
                <div>
                  <dt>In Australia</dt>
                  <dd>{step.onshore}</dd>
                </div>
                <div>
                  <dt>Outside Australia</dt>
                  <dd>{step.offshore}</dd>
                </div>
              </dl>
              <GuideLink className={styles.official} href={step.link.href}>
                {step.link.text}
              </GuideLink>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
