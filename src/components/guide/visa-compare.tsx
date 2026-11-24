import Link from "next/link";
import type { Visa } from "@/lib/data/types";
import type { CompareRow } from "@/lib/guide/compare";
import styles from "./visa-compare.module.css";

const VISAS: Visa[] = ["189", "190", "491"];

/** The 189, 190 and 491 side by side; each column heads to its guide. */
export function VisaCompare({
  rows,
  current,
}: {
  rows: CompareRow[];
  current?: Visa;
}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="sr-only">The 189, 190 and 491 compared</caption>
        <thead>
          <tr>
            <td />
            {VISAS.map((visa) => (
              <th
                key={visa}
                scope="col"
                data-current={visa === current || undefined}
              >
                {visa === current ? (
                  <span aria-current="page">{visa}</span>
                ) : (
                  <Link href={`/guide/${visa}/`}>{visa}</Link>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {VISAS.map((visa) => (
                <td
                  key={visa}
                  data-label={visa}
                  data-current={visa === current || undefined}
                >
                  {row.values[visa]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
