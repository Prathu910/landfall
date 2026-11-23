import { formatDate } from "@/lib/migration";
import type { GuideRule } from "@/lib/guide/types";
import { GuideLink } from "./guide-link";
import styles from "./visa-rules.module.css";

/** A visa's rules as a definition list, each with its official source. */
export function VisaRules({ rules }: { rules: GuideRule[] }) {
  return (
    <dl className={styles.rules}>
      {rules.map((rule) => (
        <div key={rule.label} className={styles.rule}>
          <dt>{rule.label}</dt>
          <dd>
            {rule.text}{" "}
            <GuideLink className={styles.source} href={rule.source}>
              Source, checked {formatDate(rule.checkedAt)}
            </GuideLink>
          </dd>
        </div>
      ))}
    </dl>
  );
}
