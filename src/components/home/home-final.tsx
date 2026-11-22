import { HomeAction } from "./controls/home-action";
export function HomeFinal() {
  return (
    <section className="band" aria-labelledby="fin-h">
      <div className="wrap final">
        <svg
          className="final-stamp"
          viewBox="-12 -12 344 344"
          aria-hidden="true"
        >
          <g transform="rotate(-7 160 160)">
            <circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeDasharray="14 10"
            />
            <circle
              cx="160"
              cy="160"
              r="132"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
            <text
              x="160"
              y="150"
              textAnchor="middle"
              fontWeight="900"
              fontSize="62"
              fill="currentColor"
            >
              YOUR
            </text>
            <text
              x="160"
              y="213"
              textAnchor="middle"
              fontWeight="900"
              fontSize="62"
              fill="currentColor"
            >
              STAMP
            </text>
          </g>
        </svg>
        <div>
          <h2 id="fin-h">Get your own stamp</h2>
          <p>
            Four short steps, then your personal report. Email required; no
            account needed.
          </p>
          <div className="ctas">
            <HomeAction href="/check/">Check my points, free</HomeAction>
            <HomeAction secondary href="/sample/">
              See an example report
            </HomeAction>
          </div>
        </div>
      </div>
    </section>
  );
}
