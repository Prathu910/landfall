import Link from "next/link";
import { STATE_PAGES, statePath } from "@/lib/state-page/slug";
import type { StateCode } from "@/lib/data/types";
import styles from "./state-links.module.css";

/** The eight state pages, by the names readers search for. */
export function StateLinks({ current }: { current?: StateCode }) {
  return (
    <nav className={styles.links} aria-label="State and territory pages">
      <ul>
        {STATE_PAGES.map((page) => (
          <li key={page.code}>
            <Link
              href={statePath(page.code)}
              aria-current={page.code === current ? "page" : undefined}
            >
              {page.searchName}
              <span className="sr-only">
                {" "}
                ({page.fullName}) 190 and 491 data
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
