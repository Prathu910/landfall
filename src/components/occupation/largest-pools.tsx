import Link from "next/link";
import { formatDate } from "@/lib/migration";
import type { LargePool } from "@/lib/occupation-page/directory";
import { formatNumber } from "@/lib/updates/format";
import table from "./cutoff-table.module.css";
import styles from "./largest-pools.module.css";

/** The largest 189 pools on the index, each with its latest cut-off in the last four rounds. */
export function LargestPools({
  pools,
  month,
}: {
  pools: LargePool[];
  /** "Oct 2026", the snapshot month. */
  month: string;
}) {
  return (
    <section className={styles.section} aria-labelledby="largest-pools-h">
      <h2 id="largest-pools-h">Which occupations have the most 189 EOIs?</h2>
      <p className={styles.intro}>
        The {pools.length} largest 189 pools as at {month}, with each
        occupation’s latest cut-off in the last four rounds. Every listed
        occupation’s cut-offs are in{" "}
        <Link href="/occupations/189-cut-offs/">
          189 cut-offs by occupation
        </Link>
        .
      </p>
      <div className={table.wrap}>
        <table className={table.table}>
          <caption className="sr-only">
            The largest 189 EOI pools, as at {month}
          </caption>
          <thead>
            <tr>
              <th scope="col">Occupation</th>
              <th scope="col" className={table.num}>
                189 EOIs
              </th>
              <th scope="col">Latest cut-off</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={pool.code}>
                <th scope="row">
                  <Link href={pool.path}>{pool.name}</Link>
                  <span className={table.code}>{pool.code}</span>
                </th>
                <td className={table.num} data-label="189 EOIs">
                  {formatNumber(pool.pool)}
                </td>
                <td
                  className={pool.latest ? undefined : table.missing}
                  data-label="Latest cut-off"
                >
                  {pool.latest ? (
                    <>
                      {pool.latest.cutoff} points,{" "}
                      <time dateTime={pool.latest.date}>
                        {formatDate(pool.latest.date)}
                      </time>
                    </>
                  ) : (
                    "Not listed in the last 4 rounds"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
