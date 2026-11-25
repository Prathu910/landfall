import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import type { HeroView, PassportView } from "@/lib/updates/hero-view";
import type { RecapView } from "@/lib/updates/recap-view";
import { PassportPanel } from "./passport-panel";
import styles from "./recap-hero.module.css";

/** "As at 31 October 2026:" leads the answer in bold, as in the mockup. */
function DirectAnswer({ answer }: { answer: string }) {
  const match = /^(As at [^:]+:)\s(.*)$/s.exec(answer);
  if (!match) return <p className={styles.answer}>{answer}</p>;
  return (
    <p className={styles.answer}>
      <strong>{match[1]}</strong> {match[2]}
    </p>
  );
}

/** The recap's breadcrumb, headline, dated answer and key-figures panel. */
export function RecapHero({
  breadcrumb,
  hero,
  passport,
}: {
  breadcrumb: RecapView["breadcrumb"];
  hero: HeroView;
  passport: PassportView;
}) {
  const current = breadcrumb[breadcrumb.length - 1];
  return (
    <div className={styles.band}>
      <div className={styles.shell}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          {breadcrumb.slice(0, -1).map((crumb) => (
            <Fragment key={crumb.href}>
              <Link href={crumb.href}>{crumb.name}</Link>
              <ChevronRight size={12} aria-hidden />
            </Fragment>
          ))}
          <span aria-current="page">{current.name}</span>
        </nav>
        <div className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>{hero.eyebrow}</p>
            <h1 className={styles.title}>{hero.h1}</h1>
            <DirectAnswer answer={hero.answer} />
            <dl className={styles.dateline}>
              {hero.dateline.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            {hero.pendingDataNote && (
              <p className={styles.pending}>{hero.pendingDataNote}</p>
            )}
            <div className={styles.actions}>
              {hero.actions.map((action, index) =>
                index === 0 ? (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={styles.primary}
                  >
                    {action.label} <span aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  <a
                    key={action.href}
                    href={action.href}
                    className={styles.secondary}
                  >
                    {action.label}
                  </a>
                ),
              )}
            </div>
          </div>
          <PassportPanel passport={passport} />
        </div>
      </div>
    </div>
  );
}
