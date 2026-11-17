import { formatDate } from "@/lib/migration";
import type { RoundEvidence } from "@/lib/report-evidence";
import type { ReportOccupation } from "../data/report-occupation";
import { LoadingData } from "./loading-data";

function RoundsTable({
  rounds,
  score,
}: {
  rounds: RoundEvidence[];
  score: number;
}) {
  return (
    <table className="rounds-table">
      <thead>
        <tr>
          <th scope="col">189 round date</th>
          <th scope="col">Published minimum</th>
          <th scope="col">Your current score</th>
        </tr>
      </thead>
      <tbody>
        {rounds.map((r) => (
          <tr key={r.date}>
            <td>{formatDate(r.date)}</td>
            <td>
              {r.cutoff === null ? (
                <span className="subtle">Not listed</span>
              ) : (
                <strong>{r.cutoff} points</strong>
              )}
            </td>
            <td>
              {r.cutoff === null
                ? "No comparison"
                : score >= r.cutoff
                  ? `${score - r.cutoff} points above / at`
                  : `${r.cutoff - score} points below`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RoundsSection({
  occupation,
  loadFailed,
  score,
  roundsUrl,
  previousRoundsUrl,
}: {
  occupation: ReportOccupation;
  /** The occupation is published but its file did not load. */
  loadFailed: boolean;
  score: number;
  roundsUrl: string;
  previousRoundsUrl: string;
}) {
  return (
    <section className="report-section" id="rounds">
      <span className="section-label">04 / INVITATION HISTORY</span>
      <h2>
        What was published.
        <br />
        <em>Not a prediction.</em>
      </h2>
      <p>
        Six actual 189 invitation rounds, matched to the nominated occupation. A
        missing published row means “not listed”, rather than a zero cutoff or
        proof of no invitations.
      </p>
      {occupation.status === "loading" ? (
        <LoadingData />
      ) : occupation.status === "ready" ? (
        <RoundsTable rounds={occupation.evidence.rounds} score={score} />
      ) : (
        <div className="report-empty">
          {loadFailed
            ? "Invitation results for this occupation could not be loaded. Try again later."
            : "Occupation-matched invitation results are unavailable for this profile."}
        </div>
      )}
      <p className="data-caption">
        Meeting a historical minimum does not mean your EOI would have been
        invited. Tie-break dates, occupation eligibility and EOI status also
        matter.{" "}
        <a
          className="source-link"
          href={roundsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Current results
        </a>{" "}
        ·{" "}
        <a
          className="source-link"
          href={previousRoundsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Previous rounds
        </a>
      </p>
    </section>
  );
}
