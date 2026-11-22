export function HomeConditions({ date }: { date: string }) {
  return (
    <section className="band" aria-labelledby="cond-h">
      <div className="wrap">
        <div className="conditions">
          <div className="conditions-in">
            <div>
              <h2 id="cond-h">Conditions of this report</h2>
              <p className="sub">What it is, and what it isn’t.</p>
            </div>
            <ol className="conds">
              <li>
                <div>
                  <b>Official data, dated</b>
                  <span>
                    SkillSelect EOI data and invitation rounds to {date}, from
                    Home Affairs. State rules from each state’s own pages.
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <b>Built by someone who went through it</b>
                  <span>
                    A skilled migrant who paid an agency for a report and heard
                    only “you qualify, submit and hope”.
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <b>Not a guarantee</b>
                  <span>
                    Our best reading of the data. Round sizes, cut-offs and
                    state rules can change at any time.
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <b>Not a migration agent</b>
                  <span>
                    General information, not advice. For your own case, talk to
                    a registered agent.
                  </span>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
