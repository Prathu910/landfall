import type { HomeExample } from "@/lib/home/example";
import { HomeShift } from "./home-shift";
import { HomeStamp } from "./home-stamp";

export function HomeReportExample({
  example,
  date,
}: {
  example: HomeExample;
  date: string;
}) {
  return (
    <section className="band paper" id="example" aria-labelledby="get-h">
      <div className="wrap">
        <h2 className="sec-h" id="get-h">
          What your report gives you
        </h2>
        <p className="sub">
          One answer on the first page, then what to do about it.
        </p>
        <div className="get">
          <div className="item stamp-item">
            <h3>Your outlook</h3>
            <p>Your best visa today, in one word.</p>
            <div className="big">
              <HomeStamp
                label={example.outlook.label}
                top={
                  example.outlook.visa
                    ? `SUBCLASS ${example.outlook.visa}${example.outlook.state ? ` ${example.outlook.state}` : ""}`
                    : "189 • 190 • 491"
                }
                bottom={`${date.toUpperCase()} • ${example.outlook.points} POINTS`}
              />
            </div>
          </div>
          <div className="item">
            <h3>Best route and wait</h3>
            <div className="kv">
              <div>
                <b>Best route</b>
                {example.bestRoute}
              </div>
              <div>
                <b>Estimated wait</b>
                {example.wait}
              </div>
            </div>
          </div>
          <div className="item">
            <h3>How to improve</h3>
            <p>{example.improvementText}</p>
            <HomeShift
              from={{ points: example.fromPoints, label: example.fromLabel }}
              to={{ points: example.toPoints, label: example.toLabel }}
            />
          </div>
          <div className="item pdf">
            <div>
              <h3>A compact PDF to keep</h3>
              <p>
                The same pages on any phone or laptop, ready to share with
                family or an agent.
              </p>
            </div>
            <div
              className="pages"
              aria-label="Example report includes the answer, what to do, your points, and evidence"
            >
              {["The answer", "What to do", "Your points", "Evidence"].map(
                (name, index) => (
                  <figure key={name}>
                    <div className="pg" aria-hidden="true">
                      <i className="s" />
                      {index === 0 ? <div className="dot" /> : null}
                      {[0, 1, 2, 3, 4].map((line) => (
                        <i key={line} className={line % 2 ? "s" : undefined} />
                      ))}
                    </div>
                    <figcaption>
                      {index + 1}. {name}
                    </figcaption>
                  </figure>
                ),
              )}
            </div>
          </div>
        </div>
        <p className="example-cap">
          From the example report: a registered nurse at {example.fromPoints}{" "}
          points, applying from offshore. Historical evidence, with state rules
          checked separately. <a href="/sample/">Read the full sample report</a>
          .
        </p>
      </div>
    </section>
  );
}
