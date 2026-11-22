import type { HomeAtlasView } from "@/lib/home/atlas";
import { formatMonth } from "@/lib/report/copy";
import { fullReportHref } from "./try-it-href";
import { HomeStamp } from "./home-stamp";
import { STATE_NAMES } from "@/lib/state-outlook/context";

export function AtlasEvidence({
  view,
  code,
}: {
  view: HomeAtlasView;
  code: string;
}) {
  const state = view.kind === "state";
  const max = state
    ? Math.max(1, ...view.months.map((month) => month.count?.max ?? 0))
    : 1;
  return (
    <aside
      className="atlas-passport"
      aria-live="polite"
      aria-atomic="true"
      data-atlas-evidence
      data-snapshot={view.provenance.snapshotId}
    >
      <svg
        className="guill"
        viewBox="0 0 600 520"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <image
          href="/home/passport-evidence.svg"
          width="600"
          height="520"
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
      <div className="passport-topline">
        <span>Published invitation evidence</span>
        <span>{formatMonth(view.provenance.asAt)}</span>
      </div>
      <div className="atlas-state-heading">
        <div>
          <p>
            {view.visa} ·{" "}
            {state
              ? view.visa === "190"
                ? "State nominated"
                : "Provisional regional"
              : "Independent"}
          </p>
          <h3>{state ? STATE_NAMES[view.state] : "Australia-wide"}</h3>
        </div>
        <span className="atlas-state-code">{state ? view.state : "AU"}</span>
      </div>
      <div className={`big atlas-stamp${!state ? " national-stamp" : ""}`}>
        <HomeStamp
          label={view.label}
          shape={state ? (view.visa === "190" ? "hex" : "oval") : "round"}
          top={state ? `${view.visa} ${view.state}` : "SUBCLASS 189"}
          bottom={
            state
              ? `${view.totalPoints} PTS`
              : `${formatMonth(view.provenance.asAt).toUpperCase()} • ${view.totalPoints} POINTS`
          }
        />
      </div>
      <div className="nomination-points">
        <span>{state ? "Points with nomination" : "Independent points"}</span>
        <strong data-total-points={view.totalPoints}>
          {view.totalPoints}{" "}
          <small>
            {view.basePoints}
            {state ? ` + ${view.nominationPoints}` : " base"}
          </small>
        </strong>
      </div>
      <div className="state-latest">
        <span>
          {state
            ? `Latest published count at or below ${view.totalPoints} points`
            : "Your score in the national 189 pool"}
        </span>
        <strong>
          {state
            ? (view.latest?.text ?? "No confirmed count")
            : view.higherText}
        </strong>
        <small>
          {state
            ? view.latest
              ? formatMonth(view.latest.month)
              : "No positive count in this window"
            : "EOIs with a higher score"}
        </small>
      </div>
      {state ? (
        <div className="monthly-evidence">
          <div className="monthly-heading">
            <b>Last six snapshot months</b>
            <span>
              {formatMonth(view.months[0].month)}–
              {formatMonth(view.months[5].month)}
            </span>
          </div>
          <div
            className="state-months"
            role="list"
            aria-label="Monthly published EOI counts"
          >
            {view.months.map((month) => (
              <div
                className="month-cell"
                role="listitem"
                key={month.month}
                aria-label={`${month.label}: ${month.text}${month.masked ? `; range; bar shows upper bound${month.count?.min === 0 ? "; may include zero" : ""}` : ""}`}
              >
                <span className="month-number">
                  {month.count
                    ? month.text.replace(/^under\s+(\d+)$/i, "<$1")
                    : "—"}
                </span>
                <span
                  className={`month-bar${!month.count ? " missing" : month.masked ? " masked" : ""}`}
                  aria-hidden="true"
                  style={{
                    height: month.count
                      ? Math.max(3, (48 * month.count.max) / max)
                      : 12,
                  }}
                />
                <span className="month-name">{month.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="count">
          {view.sameText} EOIs are at this score. Latest 189 round:{" "}
          {view.latestRound}.
        </p>
      )}
      <p className="why">{view.explanation}</p>
      <p className="atlas-caveat">{view.caveat}</p>
      <a className="atlas-report-link" href={fullReportHref(code)}>
        Get my personal report <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
