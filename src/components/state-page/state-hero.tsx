import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import type { StateCode } from "@/lib/data/types";
import type { StatePageView } from "@/lib/state-page/view";
import { StateMap } from "@/components/states/state-map";
import hero from "@/components/updates/recap-hero.module.css";
import { RoundStamp } from "@/components/updates/round-stamp";
import styles from "./state-hero.module.css";

/** The stamp sits on the side away from the highlighted state. */
const WEST: ReadonlySet<StateCode> = new Set(["WA", "NT", "SA"]);

/** The state page's breadcrumb, h1, dated direct answer and its source. */
export function StateHero({
  view,
}: {
  view: Pick<StatePageView, "hero" | "page">;
}) {
  const { crumbs, ...h } = view.hero;
  const current = crumbs[crumbs.length - 1];
  const [first, ...rest] = h.answer;
  return (
    <div className={hero.band}>
      <div className={hero.shell}>
        <nav className={hero.crumb} aria-label="Breadcrumb">
          {crumbs.slice(0, -1).map((crumb) => (
            <Fragment key={crumb.href}>
              <Link href={crumb.href}>{crumb.name}</Link>
              <ChevronRight size={12} aria-hidden />
            </Fragment>
          ))}
          <span aria-current="page">{current.name}</span>
        </nav>
        <div className={`${hero.hero} ${styles.hero}`}>
          <div>
            <p className={hero.eyebrow}>{h.eyebrow}</p>
            <h1 className={`${hero.title} ${styles.title}`}>{h.h1}</h1>
            <p className={styles.subtitle}>{h.subtitle}</p>
            <p className={hero.answer}>
              <strong>{first}</strong> {rest.join(" ")}
            </p>
            <p className={styles.source}>
              {h.source}{" "}
              {h.sourceLinks.map((link, index) => (
                <Fragment key={link.href}>
                  {index > 0 && " · "}
                  <a href={link.href} rel="noreferrer">
                    {link.text}
                  </a>
                </Fragment>
              ))}
            </p>
            <dl className={hero.dateline}>
              {h.dateline.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>
                    <time dateTime={item.dateTime}>{item.value}</time>
                  </dd>
                </div>
              ))}
            </dl>
            <div className={hero.actions}>
              <Link href="/check/" className={hero.primary}>
                Check my points <span aria-hidden="true">↗</span>
              </Link>
              <a href="#months" className={hero.secondary}>
                See the 12 months
              </a>
            </div>
          </div>
          <div className={styles.art} aria-hidden="true">
            <StateMap
              highlight={view.page.code}
              linkMode="none"
              className={styles.map}
            />
            <RoundStamp
              {...h.stamp}
              rotate={-8}
              className={`${styles.stamp} ${WEST.has(view.page.code) ? styles.right : ""}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
