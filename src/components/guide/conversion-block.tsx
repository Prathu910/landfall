import Link from "next/link";
import styles from "./conversion-block.module.css";

/**
 * "65 is the pass mark, not a promise": the step from the guide to the
 * personal check. A general statement; it names no agency or adviser.
 */
export function ConversionBlock({ checkHref }: { checkHref: string }) {
  return (
    <div className={styles.block}>
      <p className={styles.lede}>
        You’ll often hear that 65 points means you’re ready to apply.
      </p>
      <p className={styles.mark}>
        <span>65 is the pass mark,</span> <span>not a promise.</span>
      </p>
      <p className={styles.text}>
        See where your points actually sit for your occupation, from published
        SkillSelect data.
      </p>
      <div className={styles.actions}>
        <Link className={styles.primary} href={checkHref}>
          Check my points, free <span aria-hidden="true">→</span>
        </Link>
        <Link className={styles.secondary} href="/sample/">
          See a sample report
        </Link>
      </div>
    </div>
  );
}
