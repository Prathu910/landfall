import { ArrowUpRight } from "lucide-react";
import type { MethodSource } from "./method-content";
import styles from "./methodology.module.css";

export function MethodSources({
  sources,
  coverage,
}: {
  sources: MethodSource[];
  /** From coverageSentence: counted from the occupation index at build. */
  coverage: string;
}) {
  return (
    <section id="sources" className={styles.section}>
      <h2>Our sources</h2>
      <p>
        We use public government information and keep the data date visible.{" "}
        {coverage} it is a checked-in snapshot, not a live connection to
        SkillSelect.
      </p>
      <table className={styles.sources}>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">What it covers</th>
            <th scope="col">
              <span className="sr-only">Link</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.name}>
              <th scope="row">{s.name}</th>
              <td>{s.description}</td>
              <td>
                <a href={s.url} target="_blank" rel="noreferrer">
                  Source
                  <span className="sr-only">: {s.name}</span>
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
