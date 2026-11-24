import { Guilloche } from "@/components/guilloche/guilloche";
import styles from "./passport-background.module.css";

/**
 * The approved mockup's security lines, shared by the screen and PDF heroes:
 * the original colours by day and in print, the UV glow at night.
 */
export function PassportBackground({ print = false }: { print?: boolean }) {
  return (
    <Guilloche
      art="report-passport"
      className={`${styles.artwork}${print ? ` ${styles.print}` : ""}`}
    />
  );
}
